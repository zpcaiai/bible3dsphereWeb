import { useEffect, useRef, useState, useCallback } from 'react'
import BackButton from './BackButton'
import { pickVoiceFor, speechLangFor } from './voice'
import { createMapAdapter } from './map/createMapAdapter'
import { normalizeRoute, routeSliceToStation } from './map/routePlayback'
import { resolveJourneyRoute } from './map/journeyRouting'
import { loadBibleMap, BIBLE_MAPS, confidenceMeta, fetchTimeSlice, fetchRegions, fetchRelations, fetchLandmarks, landmarkNoteBySlug } from './data/bibleGeoSource'
import { t, getRuntimeLang } from './i18n/runtime'
import { AutoText } from './autoTranslate.jsx'

function popupHtml(p, cm, order) {
  const en = getRuntimeLang() === 'en'
  const title = en && p.name_en ? p.name_en : p.name_zh
  const sub = en ? (p.name_zh || '') : (p.name_en || '')
  const stn = en ? `Stop ${order}` : `第 ${order} 站`
  return `<div class="biblemap-pop">
    <div class="biblemap-pop-no">${stn} · ${p.scriptureRef || ''}</div>
    <div class="biblemap-pop-name">${title}</div>
    <div class="biblemap-pop-en">${sub}</div>
    <div class="biblemap-pop-conf" style="color:${cm.color}">● ${cm.label}</div>
  </div>`
}

function coordsFor(feature, variant) {
  const ov = variant?.overrides?.[feature?.properties?.id]
  const c = ov || feature?.geometry?.coordinates
  // 防 NaN：无效坐标返回 null（曾导致 Leaflet flyTo(NaN,NaN) 崩溃、播放行程中断）
  return Array.isArray(c) && c.length >= 2 && Number.isFinite(+c[0]) && Number.isFinite(+c[1]) ? c : null
}

function distanceKm(a, b) {
  if (!a || !b) return Infinity
  const rad = Math.PI / 180
  const lat1 = a[1] * rad
  const lat2 = b[1] * rad
  const dLat = (b[1] - a[1]) * rad
  const dLng = (b[0] - a[0]) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function journeyZoomForStation(stations, variant, feature, indexHint = -1) {
  if (!variant?.stationIds) return 8
  const idx = indexHint >= 0 ? indexHint : stations.findIndex((s) => s === feature || s.properties.id === feature?.properties?.id)
  const cur = coordsFor(feature, variant)
  if (!cur) return 6
  const neighbors = [stations[idx - 1], stations[idx + 1]]
    .map((s) => coordsFor(s, variant))
    .filter(Boolean)
  const nearest = neighbors.length ? Math.min(...neighbors.map((c) => distanceKm(cur, c))) : Infinity
  if (nearest < 1) return 15
  if (nearest < 3) return 14
  if (nearest < 8) return 13
  if (nearest < 20) return 11
  if (nearest < 60) return 9
  if (nearest < 150) return 8
  if (nearest < 500) return 6
  return 5
}

// 语音朗读：优先后端自然女声（edge-tts 晓晓），失败回退浏览器原生
let _mapAudio = null
async function speak(text) {
  try {
    if (_mapAudio) { try { _mapAudio.pause() } catch (e) {} _mapAudio = null }
    const { fetchTTS } = await import('./api')
    const en = !/[一-鿿]/.test(text)
    const blob = await fetchTTS(text, en ? 'en-US' : 'zh-CN', en ? 'en-US-AriaNeural' : 'zh-CN-XiaoxiaoNeural')
    const audio = new Audio(URL.createObjectURL(blob))
    _mapAudio = audio
    audio.onended = () => { try { URL.revokeObjectURL(audio.src) } catch (e) {} }
    await audio.play()
    return
  } catch (e) { /* 后端不可用 → 原生兜底 */ }
  try {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = speechLangFor(text)
    const v = pickVoiceFor(text)
    if (v) u.voice = v
    window.speechSynthesis.speak(u)
  } catch (e) { /* ignore */ }
}

function orderedStations(dataset, variant) {
  if (!dataset || dataset.temporal || !dataset.stations) return []
  if (variant?.stationIds) {
    const byId = new Map(dataset.stations.map((f) => [f.properties.id, f]))
    return variant.stationIds.map((id) => byId.get(id)).filter(Boolean)
  }
  return dataset.stations.slice().sort((a, b) => (a.properties.order || 0) - (b.properties.order || 0))
}

function eraOf(eras, year) {
  return eras.find((e) => year >= e.start && year < e.end) || eras[eras.length - 1]
}
const REL_LABEL = { within: t("隶属于"), contains: t("包含"), adjacent: t("相邻"), capital_of: t("首都："), borders: t("接壤") }

export default function BibleMapPage({ initialDatasetId = 'exodus', onBack, single = false }) {
  const mapNodeRef = useRef(null)   // 当前已初始化地图的 DOM 节点
  const adapterRef = useRef(null)
  const markersRef = useRef({})
  const playRef = useRef(null)
  const selectedRef = useRef(null)
  const progressRef = useRef(null)   // 已走过路程的实线（弧线）

  const [datasetId, setDatasetId] = useState(initialDatasetId)
  const [dataset, setDataset] = useState(null)
  const [variantId, setVariantId] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [year, setYear] = useState(-1000)       // 时间轴（温度场数据集用）
  const [slice, setSlice] = useState(null)       // 当前年份切片
  const [mapError, setMapError] = useState('')
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [timelinePlaying, setTimelinePlaying] = useState(false)
  const [timelineSpeed, setTimelineSpeed] = useState(1)
  const [regionRel, setRegionRel] = useState(null)

  useEffect(() => {
    setDatasetId(initialDatasetId)
  }, [initialDatasetId])

  // 加载数据集
  useEffect(() => {
    let cancelled = false
    setDataset(null)
    loadBibleMap(datasetId).then((ds) => {
      if (cancelled) return
      setDataset(ds)
      if (ds.temporal) {
        setYear(Math.round((ds.eras[0].start + ds.eras[Math.min(2, ds.eras.length - 1)].end) / 2))
      } else {
        setVariantId(ds.defaultVariantId)
        const stn = orderedStations(ds, ds.variants.find((v) => v.id === ds.defaultVariantId))
        setSelectedId(stn[0]?.properties.id || null)
        selectedRef.current = stn[0] || null
      }
    })
    return () => { cancelled = true }
  }, [datasetId])

  // 地图容器 callback ref：组件重渲染会换 DOM 节点（dataset 加载前是占位节点，
  // 加载后是真实可见节点）。每拿到一个新节点就把地图初始化/迁移过去，
  // 否则地图会绑在已卸载的旧节点上 → 可见容器永远空白（整片灰）。
  const mountMap = useCallback((node) => {
    if (!node || node === mapNodeRef.current) {
      // 节点未变：确保尺寸正确（子tab切回时容器从隐藏变可见）
      if (node && adapterRef.current?.map?.invalidateSize) {
        setTimeout(() => { try { adapterRef.current.map.invalidateSize() } catch (e) {} }, 60)
      }
      return
    }
    // 换了新节点 → 销毁旧地图，在新节点上重建
    if (adapterRef.current) { try { adapterRef.current.destroy() } catch (e) {} ; adapterRef.current = null }
    setReady(false)
    mapNodeRef.current = node
    const adapter = createMapAdapter()
    adapterRef.current = adapter
    adapter
      .init(node, { center: [34, 31], zoom: 5, scrollWheelZoom: false })
      .then(() => { if (adapterRef.current === adapter) setReady(true) })
      .catch((e) => setMapError(e.message || t("地图加载失败")))
  }, [])

  // 卸载时清理
  useEffect(() => () => {
    if (playRef.current) clearInterval(playRef.current)
    if (adapterRef.current) { try { adapterRef.current.destroy() } catch (e) {} }
  }, [])

  const variant = dataset && !dataset.temporal ? (dataset.variants.find((v) => v.id === variantId) || dataset.variants[0]) : null
  const STN = orderedStations(dataset, variant)
  const stationCoords = STN.map((f) => coordsFor(f, variant)).filter(Boolean)
  // 真实步行/航行路线（/api/route 逐段解析）。未解析完成前 normalizeRoute
  // 回退为贝塞尔弧线占位；解析成功后整条主路线与进度实线都贴真实路网。
  const routeKey = `${dataset?.id || ''}|${variant?.id || ''}`
  const [realRoute, setRealRoute] = useState(null) // {key, coords}
  useEffect(() => {
    if (!dataset || dataset.temporal || !variant || variant.route || stationCoords.length < 2) return
    let cancelled = false
    resolveJourneyRoute(stationCoords, { sea: !!variant.sea }).then((coords) => {
      if (!cancelled && coords && coords.length >= 2) setRealRoute({ key: routeKey, coords })
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset, variantId])
  const effectiveRoute = variant?.route || (realRoute && realRoute.key === routeKey ? realRoute.coords : null)
  const routePath = normalizeRoute(stationCoords, effectiveRoute)
  const selected = STN.find((s) => s.properties.id === selectedId) || STN[0] || null
  useEffect(() => { selectedRef.current = selected }, [selected])

  useEffect(() => {
    if (!dataset?.temporal || !timelinePlaying) return
    const maxY = dataset.eras[dataset.eras.length - 1].end
    const stepYears = 50 * timelineSpeed
    const timer = setInterval(() => {
      setYear((cur) => {
        const next = cur + stepYears
        if (next >= maxY - 1) {
          setTimelinePlaying(false)
          return maxY - 1
        }
        return next
      })
    }, 800)
    return () => clearInterval(timer)
  }, [dataset, timelinePlaying, timelineSpeed])

  const focusStation = useCallback((f, indexHint = -1) => {
    const ad = adapterRef.current
    const cc = coordsFor(f, variant)
    if (!ad?.ready || !cc) return
    ad.setView(cc, journeyZoomForStation(STN, variant, f, indexHint))
  }, [STN, variant])

  const selectStation = useCallback((f, fromMarker = false, indexHint = -1) => {
    setSelectedId(f.properties.id)
    selectedRef.current = f
    focusStation(f, indexHint)
    const ad = adapterRef.current
    if (ad?.ready) {
      const m = markersRef.current[f.properties.id]
      if (m && m.openPopup) setTimeout(() => m.openPopup(), fromMarker ? 0 : 250)
    }
  }, [focusStation])

  // 渲染图层（旅程/路线模式）
  useEffect(() => {
    const ad = adapterRef.current
    if (!ad?.ready || !dataset || dataset.temporal || !variant || !STN.length) return
    ad.clear()
    markersRef.current = {}
    progressRef.current = null
    // 主路线优先使用 variant.route 的真实路网/航线；无路网时才回退为站点弧线。
    if (routePath.length >= 2) ad.addRoute(routePath, { color: variant.color, weight: 3 })
    STN.forEach((f, i) => {
      const cm = confidenceMeta[f.properties.confidence] || confidenceMeta.unknown
      const cc = coordsFor(f, variant)
      if (!cc) return
      const m = ad.addMarker(cc, {
        label: i + 1, color: cm.color,
        active: selectedRef.current && selectedRef.current.properties.id === f.properties.id,
        html: popupHtml(f.properties, cm, i + 1),
        onClick: () => selectStation(f, true, i),
      })
      markersRef.current[f.properties.id] = m
    })
    const boundsCoords = routePath.length >= 2 ? routePath : stationCoords
    if (boundsCoords.length) {
      const lngs = boundsCoords.map((c) => c[0]); const lats = boundsCoords.map((c) => c[1])
      ad.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, dataset, variantId, realRoute])

  // 渲染图层（时间轴/疆域模式）
  useEffect(() => {
    const ad = adapterRef.current
    if (!ad?.ready || !dataset?.temporal) return
    let cancelled = false
    const era = eraOf(dataset.eras, year)
    ;(async () => {
      if (dataset.kind === 'regions') {
        const { fc, source } = await fetchRegions(year)
        if (cancelled) return
        ad.clear()
        const colors = dataset.colorBySlug || {}
        const allLng = [], allLat = []
        fc.features.forEach((f) => {
          const c = colors[f.properties.slug] || '#ffd700'
          ad.renderGeoJson(f, {
            style: { color: c, weight: 1.5, fillColor: c, fillOpacity: 0.32 },
            type: 'fill',
            paint: { 'fill-color': c, 'fill-opacity': 0.32, 'fill-outline-color': c },
          })
          const ring = f.geometry?.coordinates?.[0] || []
          ring.forEach(([lng, lat]) => { allLng.push(lng); allLat.push(lat) })
        })
        if (allLng.length) ad.fitBounds([[Math.min(...allLng), Math.min(...allLat)], [Math.max(...allLng), Math.max(...allLat)]], { maxZoom: 9 })
        setSlice({ era, source, regions: fc.features.map((f) => ({ slug: f.properties.slug, name_zh: f.properties.name_zh })) })
        setRegionRel(null)
        return
      }
      const api = await fetchTimeSlice(dataset.slug, year)
      if (cancelled) return
      const geometry = api?.geometry || { type: 'Polygon', coordinates: [era.polygon] }
      ad.clear()
      ad.renderGeoJson(
        { type: 'Feature', geometry, properties: {} },
        {
          style: { color: '#ffd700', weight: 2, fillColor: '#ffd700', fillOpacity: 0.25 },
          type: 'fill',
          paint: { 'fill-color': '#ffd700', 'fill-opacity': 0.25, 'fill-outline-color': '#ffd700' },
        },
      )
      ad.addMarker(dataset.point, { label: '', color: '#ffd700', active: true })
      const { fc: lmFc } = await fetchLandmarks(year)
      if (cancelled) return
      lmFc.features.forEach((f) => {
        const note = landmarkNoteBySlug[f.properties.slug] || ''
        ad.addMarker(f.geometry.coordinates, {
          label: '', color: '#22d3ee',
          html: `<div class="biblemap-pop"><div class="biblemap-pop-name">${f.properties.name_zh}</div><div class="biblemap-pop-en">${f.properties.name_en || ''}</div><div class="biblemap-pop-conf" style="color:#22d3ee">${note}</div></div>`,
        })
      })
      try {
        const ring = geometry.type === 'Polygon' ? geometry.coordinates[0] : [dataset.point]
        const lngs = ring.map((c) => c[0]); const lats = ring.map((c) => c[1])
        ad.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { maxZoom: 14 })
      } catch (e) { /* ignore */ }
      setSlice({ name_zh: api?.name_zh || era.name_zh, name_en: api?.name_en || era.name_en, era, source: api ? 'api' : 'local', landmarks: lmFc.features.map((f) => ({ slug: f.properties.slug, name_zh: f.properties.name_zh })) })
    })()
    return () => { cancelled = true }
  }, [ready, dataset, year])

  // 当前站高亮 + 已走过路程实线：切换站点时上一站自动恢复原状
  useEffect(() => {
    const ad = adapterRef.current
    if (!ad?.ready || !dataset || dataset.temporal || !STN.length) return
    // 标记高亮：仅当前站 active，其余恢复原状
    STN.forEach((f) => {
      const m = markersRef.current[f.properties.id]
      if (m && ad.setMarkerActive) ad.setMarkerActive(m, f.properties.id === selectedId)
    })
    // 已走过的路程截断自主路线，避免进度实线与真实路网分叉。
    if (ad.removeRoute && progressRef.current) { ad.removeRoute(progressRef.current); progressRef.current = null }
    const curIdx = STN.findIndex((s) => s.properties.id === selectedId)
    if (curIdx > 0) {
      const walked = routeSliceToStation(stationCoords, effectiveRoute, curIdx)
      if (walked.length >= 2 && ad.addRoute) {
        progressRef.current = ad.addRoute(walked, { color: variant?.color || '#ffd700', weight: 4, opacity: 1, solid: true })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, ready, dataset, variantId, realRoute])

  function step(dir) {
    if (!selected) return
    const idx = STN.findIndex((s) => s.properties.id === selected.properties.id)
    let next = idx + dir
    if (next < 0) next = STN.length - 1
    if (next >= STN.length) next = 0
    selectStation(STN[next], false, next)
  }

  function togglePlay() {
    if (playing) { clearInterval(playRef.current); playRef.current = null; setPlaying(false); return }
    setPlaying(true)
    playRef.current = setInterval(() => {
      setSelectedId((curId) => {
        if (!STN.length) return curId
        const idx = STN.findIndex((s) => s.properties.id === curId)
        const nx = STN[(idx + 1) % STN.length]
        const nextIndex = (idx + 1) % STN.length
        selectedRef.current = nx
        focusStation(nx, nextIndex)
        return nx.properties.id
      })
    }, 2600)
  }

  function switchDataset(id) {
    if (id === datasetId) return
    setPlaying(false)
    setTimelinePlaying(false)
    if (playRef.current) { clearInterval(playRef.current); playRef.current = null }
    setSlice(null)
    setDatasetId(id)
  }

  if (!dataset) {
    return (
      <div className="biblemap-page">
        {onBack && (
          <div className="biblemap-live-head">
            <BackButton onClick={onBack} />
            <div>
              <h2>{t("圣经地图")}</h2>
              <p>{t("交互路线、时间轴与经文事件")}</p>
            </div>
          </div>
        )}
        <div className="biblemap-loading">{t("地图数据加载中…")}</div>
      </div>
    )
  }

  const LiveHeader = onBack ? (
    <div className="biblemap-live-head">
      <BackButton onClick={onBack} />
      <div>
        <h2><AutoText>{dataset.title}</AutoText></h2>
        <p><AutoText>{dataset.subtitle}</AutoText></p>
      </div>
    </div>
  ) : null

  const DatasetSelector = single ? null : (
    <div className="biblemap-dataset">
      {BIBLE_MAPS.map((m) => (
        <button key={m.id} className={`biblemap-dataset-btn ${m.id === datasetId ? 'active' : ''}`} onClick={() => switchDataset(m.id)}>
          <span className="biblemap-dataset-icon">{m.icon}</span>{m.title}
        </button>
      ))}
    </div>
  )

  const MapBox = (
    <div className="biblemap-map-wrap">
      <div ref={mountMap} className="biblemap-map" />
      {mapError && (
        <div className="biblemap-map-fallback">
          {t("🗺️ 地图瓦片加载失败")}{mapError ? `（${mapError}）` : ''}<br />
          <span>{t("可能处于离线状态，下方仍可浏览经文与时代信息")}</span>
        </div>
      )}
    </div>
  )

  // ── 时间轴 / 疆域模式 ──────────────────────────────────────────────
  if (dataset.temporal) {
    const era = eraOf(dataset.eras, year)
    const minY = dataset.eras[0].start
    const maxY = dataset.eras[dataset.eras.length - 1].end
    const _en = getRuntimeLang() === 'en'
    const yLabel = (y) => (y < 0 ? (_en ? `${-y} BC` : `公元前 ${-y}`) : (_en ? `AD ${y}` : `公元 ${y}`))
    const eraEndLabel = era.end <= 0 ? yLabel(era.end) : (_en ? `AD ${era.end}` : `公元 ${era.end}`)
    const colorBySlug = dataset.colorBySlug || {}
    return (
      <div className="biblemap-page">
        {LiveHeader}
        {DatasetSelector}
        <div className="biblemap-hypo-desc"><AutoText>{dataset.subtitle}</AutoText>
          <span className="biblemap-src">{slice?.source === 'api' ? t("· 数据源：后端") : t("· 数据源：本地")}</span>
        </div>
        {MapBox}
        <div className="biblemap-timeline">
          <div className="biblemap-year">{yLabel(year)}</div>
          <div className="biblemap-timeline-controls">
            <button className={timelinePlaying ? 'on' : ''} onClick={() => setTimelinePlaying(v => !v)}>
              {timelinePlaying ? t("⏸ 暂停") : t("▶ 播放时间轴")}
            </button>
            {[1, 2, 4].map((s) => (
              <button key={s} className={timelineSpeed === s ? 'on' : ''} onClick={() => setTimelineSpeed(s)}>
                {s}x
              </button>
            ))}
          </div>
          <input
            type="range" className="biblemap-slider"
            min={minY} max={maxY - 1} step={50} value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
          />
          <div className="biblemap-era-chips">
            {dataset.eras.map((e) => (
              <button key={e.id}
                className={`biblemap-era-chip ${e.id === era.id ? 'active' : ''}`}
                onClick={() => setYear(Math.round((e.start + e.end) / 2))}>
                <AutoText>{e.name_zh || e.label}</AutoText>
              </button>
            ))}
          </div>
        </div>
        <div className="biblemap-detail">
          <div className="biblemap-detail-head">
            <div className="biblemap-detail-no"><AutoText>{era.label}</AutoText> · {era.ref}</div>
            <div className="biblemap-detail-title">{dataset.kind === 'regions' ? <AutoText>{era.label}</AutoText> : (getRuntimeLang() === 'en' ? (slice?.name_en || era.name_en || slice?.name_zh || era.name_zh) : (slice?.name_zh || era.name_zh))}</div>
            <div className="biblemap-detail-sub">{dataset.kind === 'regions'
              ? `${yLabel(era.start)} – ${eraEndLabel} · ${slice?.regions?.length || 0} ${_en ? 'regions' : '个疆域'}`
              : `${slice?.name_en || era.name_en} · ${yLabel(era.start)} – ${eraEndLabel}`}</div>
            <span className="biblemap-conf-badge" style={{ color: confidenceMeta.approximate.color, borderColor: confidenceMeta.approximate.color }}>{t("● 疆域范围为示意")}</span>
          </div>
          <div className="biblemap-events">
            <div className="biblemap-event">
              <div className="biblemap-event-summary"><AutoText>{era.note}</AutoText></div>
            </div>
          </div>

          {dataset.kind !== 'regions' && slice?.landmarks?.length > 0 && (
            <div className="biblemap-region-grid">
              {slice.landmarks.map((l) => (
                <span key={l.slug} className="biblemap-region-chip biblemap-region-chip-static">
                  <i style={{ background: '#22d3ee' }} />{getRuntimeLang() === 'en' && l.name_en ? l.name_en : l.name_zh}
                </span>
              ))}
            </div>
          )}

          {dataset.kind === 'regions' && slice?.regions && (
            <>
              <div className="biblemap-region-grid">
                {slice.regions.map((r) => (
                  <button key={r.slug}
                    className={`biblemap-region-chip ${regionRel?.slug === r.slug ? 'active' : ''}`}
                    onClick={async () => {
                      const rels = await fetchRelations(r.slug, year)
                      setRegionRel({ slug: r.slug, name: (getRuntimeLang() === 'en' && r.name_en ? r.name_en : r.name_zh), rels })
                    }}>
                    <i style={{ background: colorBySlug[r.slug] || '#ffd700' }} />{getRuntimeLang() === 'en' && r.name_en ? r.name_en : r.name_zh}
                  </button>
                ))}
              </div>
              {regionRel && (
                <div className="biblemap-relations">
                  <div className="biblemap-relations-title">{regionRel.name} {t("· 拓扑关系")}</div>
                  {regionRel.rels.length ? regionRel.rels.map((rl, i) => (
                    <div key={i} className="biblemap-relation">
                      {REL_LABEL[rl.relation_type] || rl.relation_type} <b><AutoText>{rl.other_name || rl.other_slug}</AutoText></b>
                    </div>
                  )) : <div className="biblemap-relation biblemap-relation-empty">{t("（暂无关系记录，或后端未启用）")}</div>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // ── 旅程 / 路线模式 ──────────────────────────────────────────────
  if (!selected) {
    return (
      <div className="biblemap-page">
        {LiveHeader}
        {DatasetSelector}
        <div className="biblemap-loading">{t("加载中…")}</div>
      </div>
    )
  }
  const p = selected.properties
  const cm = confidenceMeta[p.confidence] || confidenceMeta.unknown
  const idx = STN.findIndex((s) => s.properties.id === selected.properties.id)
  const hasYears = variant?.startYear != null && variant?.endYear != null && STN.length > 1
  const stationYears = hasYears ? STN.map((_, i) => Math.round(variant.startYear + (variant.endYear - variant.startYear) * i / (STN.length - 1))) : null
  const jYLabel = (y) => (getRuntimeLang() === 'en' ? (y < 0 ? `c. ${-y} BC` : `c. AD ${y}`) : (y < 0 ? `约公元前 ${-y}` : `约公元 ${y}`))
  const curYear = hasYears ? stationYears[idx < 0 ? 0 : idx] : null
  const selectByYear = (y) => { if (!stationYears) return; let i = 0; for (let k = 0; k < stationYears.length; k++) { if (stationYears[k] <= y) i = k }; selectStation(STN[i], false, i) }

  return (
    <div className="biblemap-page">
      {LiveHeader}
      {DatasetSelector}
      <div className="biblemap-hypo">
        {dataset.variants.map((h) => (
          <button key={h.id} className={`biblemap-hypo-btn ${h.id === variantId ? 'active' : ''}`}
            style={{ '--hc': h.color }} onClick={() => setVariantId(h.id)} title={h.description}>
            <i style={{ background: h.color }} /><AutoText>{h.label}</AutoText>
          </button>
        ))}
      </div>
      <div className="biblemap-hypo-desc"><AutoText>{variant.description}</AutoText>
        <span className="biblemap-src">{dataset.source === 'api' ? t("· 数据源：后端") : t("· 数据源：本地")}</span>
      </div>
      {MapBox}
      <div className="biblemap-controls">
        <button onClick={() => step(-1)} aria-label={t("上一站")}>‹</button>
        <button className={`biblemap-play ${playing ? 'on' : ''}`} onClick={togglePlay}>{playing ? t("⏸ 暂停") : t("▶ 播放行程")}</button>
        <button onClick={() => step(1)} aria-label={t("下一站")}>›</button>
        <span className="biblemap-counter">{t("第")} {idx + 1} {t("站 /")} {STN.length}</span>
      </div>
      <div className="biblemap-journey-axis">
        {hasYears && <div className="biblemap-year biblemap-year-sm">{jYLabel(curYear)}</div>}
        <input
          type="range" className="biblemap-slider"
          min={hasYears ? variant.startYear : 0}
          max={hasYears ? variant.endYear : Math.max(0, STN.length - 1)}
          step={1}
          value={hasYears ? curYear : (idx < 0 ? 0 : idx)}
          onChange={(e) => hasYears ? selectByYear(parseInt(e.target.value, 10)) : selectStation(STN[parseInt(e.target.value, 10)], false, parseInt(e.target.value, 10))}
          aria-label={t("行程进度")}
        />
        <div className="biblemap-axis-ends">
          <span>{getRuntimeLang() === 'en' && STN[0]?.properties.name_en ? STN[0].properties.name_en : STN[0]?.properties.name_zh}{hasYears ? ` · ${jYLabel(stationYears[0])}` : ''}</span>
          <span>{getRuntimeLang() === 'en' && STN[STN.length - 1]?.properties.name_en ? STN[STN.length - 1].properties.name_en : STN[STN.length - 1]?.properties.name_zh}{hasYears ? ` · ${jYLabel(stationYears[STN.length - 1])}` : ''}</span>
        </div>
      </div>
      <div className="biblemap-detail">
        <div className="biblemap-detail-head">
          <div className="biblemap-detail-no">{t("第")} {idx + 1} {t("站")}{p.scriptureRef ? ` · ${p.scriptureRef}` : ''}</div>
          <div className="biblemap-detail-title">{getRuntimeLang() === 'en' && p.name_en ? p.name_en : p.name_zh}</div>
          <div className="biblemap-detail-sub">{p.name_en}{p.name_he ? ` · ${p.name_he}` : ''}</div>
          <span className="biblemap-conf-badge" style={{ color: cm.color, borderColor: cm.color }}>● {cm.label}</span>
        </div>
        {p.events && p.events.length > 0 ? (
          <div className="biblemap-events">
            {p.events.map((ev, i) => (
              <div key={i} className="biblemap-event">
                <div className="biblemap-event-title">
                  <AutoText>{ev.title}</AutoText><span className="biblemap-event-ref">{ev.ref}</span>
                  <button className="biblemap-tts" onClick={() => speak(`${ev.title}。${ev.summary}`)} title={t("朗读")} aria-label={t("朗读")}>🔊</button>
                </div>
                <div className="biblemap-event-summary"><AutoText>{ev.summary}</AutoText></div>
                {ev.image && (
                  <img className="biblemap-event-img" src={ev.image} alt={ev.title} loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none' }} />
                )}
                {ev.audio && <audio className="biblemap-event-audio" controls src={ev.audio} />}
              </div>
            ))}
          </div>
        ) : (
          <div className="biblemap-noevent">{t("此站为途经地，圣经未记载具体事件。")}</div>
        )}
      </div>
      <div className="biblemap-strip">
        {STN.map((f, i) => (
          <button key={`${f.properties.id}-${i}`} className={`biblemap-chip ${i === idx ? 'active' : ''}`}
            style={{ '--c': (confidenceMeta[f.properties.confidence] || confidenceMeta.unknown).color }}
            onClick={() => selectStation(f, false, i)}>
            <span className="biblemap-chip-no">{i + 1}</span>
            <span className="biblemap-chip-name">{getRuntimeLang() === 'en' && f.properties.name_en ? f.properties.name_en : f.properties.name_zh}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
