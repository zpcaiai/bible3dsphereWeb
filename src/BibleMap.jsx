// BibleMap.jsx — 可复用圣经地图引擎（自包含 SVG，离线可用，适配 PWA）
// 统一数据 schema 见 data/bibleMapsData.js。一个引擎驱动全部地图。
// 扩展：地点插图（MapScenes）、AI 讲解（fetchFaithQA）、人物卡片闭环（config.profile）。
import { useEffect, useMemo, useRef, useState } from 'react'
import BackButton from './BackButton'
import MapScene, { resolveScene } from './MapScenes'
import { fetchFaithQA, API_BASE } from './api'
import { curvedSegment } from './map/arc'
import { t, getRuntimeLang } from './i18n/runtime'
import { AutoText } from './autoTranslate.jsx'

const VB_W = 1000
const VB_H = 720
const PAD = 56

// 五角星路径（利未城/逃城符号用），中心在原点
function starPathD(r) {
  let d = ''
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 ? r * 0.42 : r
    d += (i ? 'L' : 'M') + (rr * Math.cos(ang)).toFixed(1) + ',' + (rr * Math.sin(ang)).toFixed(1)
  }
  return d + 'Z'
}

const CONFIDENCE = {
  identified:  { label: t("考古较确定"), color: '#4ade80' },
  approximate: { label: t("传统推定"),   color: '#fbbf24' },
  unknown:     { label: t("地点失考"),   color: '#94a3b8' },
}

// 经纬度 → SVG 坐标（保持长宽比，按中纬度余弦校正经度）
function makeProjector(bounds) {
  const { minLng, maxLng, minLat, maxLat } = bounds
  const midLat = (minLat + maxLat) / 2
  const lngScale = Math.cos((midLat * Math.PI) / 180)
  const geoW = (maxLng - minLng) * lngScale
  const geoH = (maxLat - minLat)
  const innerW = VB_W - 2 * PAD
  const innerH = VB_H - 2 * PAD
  const s = Math.min(innerW / geoW, innerH / geoH)
  const drawW = geoW * s
  const drawH = geoH * s
  const offX = PAD + (innerW - drawW) / 2
  const offY = PAD + (innerH - drawH) / 2
  return (lng, lat) => [
    offX + (lng - minLng) * lngScale * s,
    offY + (maxLat - lat) * s,
  ]
}

function graticule(bounds, project) {
  const lines = []
  const lngStep = (bounds.maxLng - bounds.minLng) > 12 ? 5 : (bounds.maxLng - bounds.minLng) > 5 ? 2 : 1
  const latStep = (bounds.maxLat - bounds.minLat) > 12 ? 5 : (bounds.maxLat - bounds.minLat) > 5 ? 2 : 1
  for (let lng = Math.ceil(bounds.minLng / lngStep) * lngStep; lng <= bounds.maxLng; lng += lngStep) {
    const [x1, y1] = project(lng, bounds.minLat)
    const [x2, y2] = project(lng, bounds.maxLat)
    lines.push({ x1, y1, x2, y2, label: `${lng}°E`, lx: x1, ly: y2 - 6 })
  }
  for (let lat = Math.ceil(bounds.minLat / latStep) * latStep; lat <= bounds.maxLat; lat += latStep) {
    const [x1, y1] = project(bounds.minLng, lat)
    const [x2, y2] = project(bounds.maxLng, lat)
    lines.push({ x1, y1, x2, y2, label: `${lat}°N`, lx: x1 + 4, ly: y1 - 4, horiz: true })
  }
  return lines
}

// —— AI 讲解（复用 /faith-qa，无需登录）——
function AIResult({ data }) {
  return (
    <div className="biblemap-ai-result">
      {data.question_summary && <div className="biblemap-ai-summary">{data.question_summary}</div>}
      {data.nature_analysis && <p>{data.nature_analysis}</p>}
      {data.contextual_analysis && <p>{data.contextual_analysis}</p>}
      {data.right_thinking && <p>{data.right_thinking}</p>}
      {Array.isArray(data.scriptures) && data.scriptures.length > 0 && (
        <div className="biblemap-ai-scriptures">
          {data.scriptures.map((s, i) => (
            <div key={i} className="biblemap-ai-verse">
              <span className="ref">{s.ref || s.reference || ''}</span>
              <span>{s.text || s.content || s.verse || ''}</span>
            </div>
          ))}
        </div>
      )}
      {Array.isArray(data.action_steps) && data.action_steps.length > 0 && (
        <ul className="biblemap-ai-steps">{data.action_steps.map((a, i) => <li key={i}>{a}</li>)}</ul>
      )}
      {data.prayer_direction && <div className="biblemap-ai-prayer">🙏 {data.prayer_direction}</div>}
    </div>
  )
}

function AIExplain({ question, label = t("✦ AI 讲解"), compact }) {
  const [state, setState] = useState({ loading: false, data: null, error: null })
  useEffect(() => { setState({ loading: false, data: null, error: null }) }, [question])
  if (state.data) return <AIResult data={state.data} />
  return (
    <div className={`biblemap-ai ${compact ? 'compact' : ''}`}>
      <button className="biblemap-ai-btn" disabled={state.loading}
        onClick={async () => {
          setState({ loading: true, data: null, error: null })
          try {
            const data = await fetchFaithQA(question)
            setState({ loading: false, data, error: null })
          } catch (e) {
            setState({ loading: false, data: null, error: e.message || t("AI 暂时不可用") })
          }
        }}>
        {state.loading ? t("⏳ AI 思考中…") : label}
      </button>
      {state.error && <div className="biblemap-ai-error">{state.error}</div>}
    </div>
  )
}

export default function BibleMap({ config, onBack }) {
  const project = useMemo(() => makeProjector(config.bounds), [config.bounds])
  const grat = useMemo(() => graticule(config.bounds, project), [config.bounds, project])
  const isTimeline = config.mode === 'timeline'

  const singleSelect = config.layerSelect === 'single'
  const [activeLayerIds, setActiveLayerIds] = useState(
    singleSelect ? [config.layers[0].id] : config.layers.map(l => l.id)
  )
  const activeLayers = config.layers.filter(l => activeLayerIds.includes(l.id))

  const [year, setYear] = useState(config.years ? config.years.default : 0)

  const animLayer = activeLayers[0] || config.layers[0]
  const orderedPoints = useMemo(() => {
    return [...(animLayer?.points || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [animLayer])
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const rafRef = useRef(null)
  const lastTsRef = useRef(0)

  useEffect(() => { setProgress(0); setPlaying(false) }, [activeLayerIds.join(','), config.id])

  useEffect(() => {
    if (!playing) { cancelAnimationFrame(rafRef.current); return }
    const N = orderedPoints.length
    if (N < 2) { setPlaying(false); return }
    const speed = 0.7
    const tick = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts
      const dt = (ts - lastTsRef.current) / 1000
      lastTsRef.current = ts
      setProgress(p => {
        const np = p + dt * speed
        if (np >= N - 1) { setPlaying(false); return N - 1 }
        return np
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(rafRef.current); lastTsRef.current = 0 }
  }, [playing, orderedPoints.length])

  const revealCount = (playing || progress > 0) ? Math.floor(progress) + 1 : Infinity

  // 播放到站：当前地点高亮（行进离站后自动恢复原状）
  const activePointIdx = useMemo(() => {
    if (!playing || orderedPoints.length < 2) return -1
    const i = Math.floor(progress + 1e-4)
    const frac = progress - i
    return frac < 0.4 ? i : -1
  }, [playing, progress, orderedPoints.length])

  const [selected, setSelected] = useState(null)

  // ── 步行路由（陆地航段走真实路网；海上/失败回退直线）──────────────────────
  const SEA_MAP_IDS = ['paul', 'exodus']
  const isSeaLayer = (layer) =>
    SEA_MAP_IDS.includes(config.id) || layer.route === false ||
    layer.scene === 'boat' || layer.scene === 'sea'
  const [routedGeom, setRoutedGeom] = useState({}) // layerId -> [[lng,lat],...]

  // 行进光点：沿弧线（或真实路网）行进，不再走直线
  const travelDot = useMemo(() => {
    if (!(playing || progress > 0) || orderedPoints.length < 2) return null
    const i = Math.min(Math.floor(progress), orderedPoints.length - 2)
    const f = progress - i
    const entry = animLayer ? routedGeom[animLayer.id] : null
    // 有真实路网且站点索引完整：按"站点 i → 站点 i+1"的路网区间插值，
    // progress 为整数时光点精确落在站点上（与到站高亮同步）。
    if (entry && entry.coords.length >= 2 && entry.stationIdx.length === orderedPoints.length) {
      const a = entry.stationIdx[i]
      const b = entry.stationIdx[i + 1]
      const fi = a + f * (b - a)
      const si = Math.max(0, Math.min(Math.floor(fi), entry.coords.length - 2))
      const sf = fi - si
      const [ax, ay] = project(entry.coords[si][0], entry.coords[si][1])
      const [bx, by] = project(entry.coords[si + 1][0], entry.coords[si + 1][1])
      return { x: ax + (bx - ax) * sf, y: ay + (by - ay) * sf }
    }
    const a = orderedPoints[i], b = orderedPoints[i + 1]
    const seg = curvedSegment([a.lng, a.lat], [b.lng, b.lat])
    const fi = f * (seg.length - 1)
    const si = Math.min(Math.floor(fi), seg.length - 2)
    const sf = fi - si
    const [ax, ay] = project(seg[si][0], seg[si][1])
    const [bx, by] = project(seg[si + 1][0], seg[si + 1][1])
    return { x: ax + (bx - ax) * sf, y: ay + (by - ay) * sf }
  }, [playing, progress, orderedPoints, project, routedGeom, animLayer])
  // 逐段解析路线：ORS 会因为整条请求里任一段不可路由（航段过长超出步行距离上限、
  // 或跨越水域）而拒绝整条多点请求，导致整条旅程退化为直线。改为「每相邻两点单独请求」，
  // 可路由的段走真实道路/航线，仅真正不可路由的那一段才退化为直线。陆地段再按
  // foot-walking → foot-hiking → driving-car 依次回退，长途段也能贴着路网走。
  useEffect(() => {
    if (isTimeline) return
    let cancelled = false
    const chainFor = (sea) => sea ? ['sea'] : ['foot-walking', 'foot-hiking', 'driving-car']
    const fetchSeg = async (a, b, profile) => {
      try {
        const r = await fetch(`${API_BASE}/route`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile, coordinates: [[a.lng, a.lat], [b.lng, b.lat]] }),
        })
        if (!r.ok) return null
        const d = await r.json()
        if (!d || !d.ok || !Array.isArray(d.geometry) || d.geometry.length < 2) return null
        return d.geometry.map(pt => [Number(pt[0]), Number(pt[1])]) // [lng,lat]
      } catch { return null }
    }
    const resolveLeg = async (a, b, chain) => {
      for (const prof of chain) {
        const g = await fetchSeg(a, b, prof)
        if (g && g.length >= 2) return g
      }
      return [[a.lng, a.lat], [b.lng, b.lat]] // 该段退化为直线
    }
    activeLayers.forEach(async (layer) => {
      if (!layer.route || routedGeom[layer.id]) return
      const pts = [...(layer.points || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      if (pts.length < 2) return
      const chain = chainFor(isSeaLayer(layer))
      const legs = await Promise.all(
        pts.slice(0, -1).map((a, i) => resolveLeg(a, pts[i + 1], chain))
      )
      if (cancelled) return
      // 拼接时去掉衔接处重复点，并记录每个站点在路网坐标中的索引（stationIdx），
      // 让行进光点/逐站揭示能精确对位到站点，不再按"点数均匀"近似。
      const stitched = []
      const stationIdx = [0]
      legs.forEach((seg) => {
        const add = stitched.length ? seg.slice(1) : seg
        add.forEach(pt => stitched.push(pt))
        stationIdx.push(stitched.length - 1)
      })
      if (stitched.length >= 2) setRoutedGeom(prev => ({ ...prev, [layer.id]: { coords: stitched, stationIdx } }))
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayerIds.join(','), config.id])

  function visiblePoints(layer) {
    let pts = layer.points
    if (isTimeline && config.years) pts = pts.filter(p => (p.year ?? -99999) <= year)
    if ((playing || progress > 0) && layer.id === animLayer?.id && !isTimeline) {
      const sorted = [...pts].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      pts = sorted.slice(0, revealCount)
    }
    return pts
  }

  function routePath(layer) {
    const pts = visiblePoints(layer).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    if (pts.length < 2) return ''
    const geom = routedGeom[layer.id] || null
    if (geom && geom.length >= 2) {
      let g = geom
      if ((playing || progress > 0) && layer.id === animLayer?.id && !isTimeline) {
        const total = (layer.points || []).length || 1
        const frac = Math.min(1, revealCount / total)
        g = geom.slice(0, Math.max(2, Math.ceil(frac * geom.length)))
      }
      return g.map(([lng, lat], i) => {
        const [x, y] = project(lng, lat)
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      }).join(' ')
    }
    // 无真实路网时：站点间用弧线连接（航线风格），不用生硬直线
    const arc = []
    for (let i = 0; i < pts.length - 1; i++) {
      const seg = curvedSegment([pts[i].lng, pts[i].lat], [pts[i + 1].lng, pts[i + 1].lat])
      arc.push(...(arc.length ? seg.slice(1) : seg))
    }
    return arc.map(([lng, lat], i) => {
      const [x, y] = project(lng, lat)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  }

  // 每段中点放一个指向行进方向的箭头（手绘三角，渲染器无关，支持移动端 webview）
  function routeArrows(layer) {
    const pts = visiblePoints(layer).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const arr = []
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = project(pts[i].lng, pts[i].lat)
      const [x2, y2] = project(pts[i + 1].lng, pts[i + 1].lat)
      const dx = x2 - x1, dy = y2 - y1
      if (Math.hypot(dx, dy) < 24) continue // 太近的段不放，避免拥挤
      // 箭头放在弧线中点（二次贝塞尔 t=0.5 处切线与弦平行，角度仍用弦向）
      const seg = curvedSegment([pts[i].lng, pts[i].lat], [pts[i + 1].lng, pts[i + 1].lat])
      const mid = seg[Math.floor(seg.length / 2)]
      const [mx, my] = project(mid[0], mid[1])
      arr.push({ key: `ar-${layer.id}-${i}`, mx, my,
        ang: (Math.atan2(dy, dx) * 180) / Math.PI })
    }
    return arr
  }

  function visibleByYear(item) {
    if (!isTimeline) return true
    const from = item.showFrom ?? -99999
    const to = item.showTo ?? 99999
    return year >= from && year <= to
  }

  function polygonPath(region) {
    const pts = region.polygon || []
    if (pts.length < 3) return ''
    return pts.map(([lng, lat], i) => {
      const [x, y] = project(lng, lat)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ') + ' Z'
  }

  function boundaryPath(boundary) {
    const pts = boundary.path || []
    if (pts.length < 2) return ''
    return pts.map(([lng, lat], i) => {
      const [x, y] = project(lng, lat)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  }

  function svgLabelWidth(label) {
    const units = [...String(label || '')].reduce((sum, ch) => sum + (ch.charCodeAt(0) > 255 ? 12 : 7), 18)
    return Math.min(210, Math.max(76, units))
  }

  function toggleLayer(id) {
    if (singleSelect) { setActiveLayerIds([id]); setSelected(null); return }
    setActiveLayerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const enMode = getRuntimeLang() === 'en'
  const yearLabel = (y) => (y < 0
    ? (enMode ? `${Math.abs(y)} BC` : `公元前 ${Math.abs(y)}`)
    : (enMode ? `AD ${y}` : `公元 ${y}`))
  // 地名：EN 模式优先用数据自带的 name_en（地名无须机翻），否则回退中文
  const placeName = (p) => ((enMode && p && p.name_en) ? p.name_en : (p?.name_zh || p?.name_en || ''))
  const profileLayer = config.profile ? (activeLayers[0] || config.layers[0]) : null
  const visibleRegions = (config.regions || []).filter(visibleByYear)
  const visibleBoundaries = (config.boundaries || []).filter(visibleByYear)

  return (
    <div className="biblemap">
      <div className="biblemap-head">
        <BackButton onClick={onBack} />
        <div className="biblemap-title">
          <h2><AutoText>{config.title}</AutoText></h2>
          <p><AutoText>{config.subtitle}</AutoText>{config.era ? <> · <AutoText>{config.era}</AutoText></> : ''}</p>
        </div>
      </div>

      <div className="biblemap-controls">
        {config.layers.length > 1 && config.layers.map(l => {
          const on = activeLayerIds.includes(l.id)
          return (
            <button key={l.id} className={`biblemap-chip ${on ? 'on' : ''}`}
              onClick={() => toggleLayer(l.id)}
              style={on ? { background: l.color + '33', borderColor: l.color, color: l.color } : {}}>
              <span className="dot" style={{ background: l.color }} /><AutoText>{l.label}</AutoText>
            </button>
          )
        })}
        {!isTimeline && animLayer?.route !== false && orderedPoints.length > 1 && (
          <button className="biblemap-chip play"
            onClick={() => { if (progress >= orderedPoints.length - 1) setProgress(0); setPlaying(p => !p) }}>
            {playing ? t("⏸ 暂停") : (progress > 0 && progress < orderedPoints.length - 1 ? t("▶ 继续") : t("▶ 路线动画"))}
          </button>
        )}
        {!isTimeline && progress > 0 && (
          <button className="biblemap-chip" onClick={() => { setPlaying(false); setProgress(0) }}>{t("↺ 重置")}</button>
        )}
      </div>

      {/* 人物卡片（闭环：人物 → 简介 → 书信 → 旅程地图 → AI 讲解）*/}
      {profileLayer && (
        <div className="biblemap-profile" style={{ borderColor: profileLayer.color + '66' }}>
          <div className="biblemap-profile-scene" style={{ background: profileLayer.color + '1a' }}>
            <MapScene scene={profileLayer.scene || 'journey'} color={profileLayer.color} />
          </div>
          <div className="biblemap-profile-body">
            <div className="biblemap-profile-name" style={{ color: profileLayer.color }}>
              <AutoText>{profileLayer.label}</AutoText>{profileLayer.era && <span className="era"><AutoText>{profileLayer.era}</AutoText></span>}
            </div>
            {profileLayer.bio && <p className="biblemap-profile-bio"><AutoText>{profileLayer.bio}</AutoText></p>}
            {Array.isArray(profileLayer.epistles) && profileLayer.epistles.length > 0 && (
              <div className="biblemap-profile-epistles">
                {t("✉ 相关书信：")}{profileLayer.epistles.map((e, i) => <span key={i} className="ep"><AutoText>{e}</AutoText></span>)}
              </div>
            )}
            <AIExplain compact
              question={`请用简洁、温暖、适合查经班的话，介绍圣经人物「${profileLayer.label}」的生平、属灵意义与主要经历，并给出一句默想或祷告方向。`}
              label={t("✦ 请 AI 讲解这位人物")} />
          </div>
        </div>
      )}

      {isTimeline && config.years && (
        <div className="biblemap-timeline">
          <span className="ty">{yearLabel(year)}</span>
          <input type="range" min={config.years.min} max={config.years.max} step={config.years.step || 1}
            value={year} onChange={e => setYear(Number(e.target.value))} />
          <div className="biblemap-eras">
            {(config.eras || []).map(er => (
              <button key={er.label} className={`era ${year >= er.from && year <= er.to ? 'on' : ''}`}
                onClick={() => setYear(Math.round((er.from + er.to) / 2))}><AutoText>{er.label}</AutoText></button>
            ))}
          </div>
        </div>
      )}

      <div className="biblemap-stage">
        <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="biblemap-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="bm-sea" cx="50%" cy="40%" r="80%">
              <stop offset="0%" stopColor="#1a2f4a" /><stop offset="100%" stopColor="#0e1b2e" />
            </radialGradient>
            <linearGradient id="bm-land" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3a3526" /><stop offset="100%" stopColor="#2a2718" />
            </linearGradient>
            <filter id="bm-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <rect x="0" y="0" width={VB_W} height={VB_H} fill="url(#bm-sea)" />
          <rect x={PAD - 14} y={PAD - 14} width={VB_W - 2 * (PAD - 14)} height={VB_H - 2 * (PAD - 14)}
            fill="url(#bm-land)" rx="10" opacity="0.55" />

          {grat.map((g, i) => (
            <g key={i}>
              <line x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} stroke="#ffffff" strokeOpacity="0.06" strokeWidth="1" />
              <text x={g.lx} y={g.ly} fill="#ffffff" fillOpacity="0.18" fontSize="11">{g.label}</text>
            </g>
          ))}

          <g transform={`translate(${VB_W - 46},${46})`} opacity="0.5">
            <circle r="18" fill="none" stroke="#ffffff" strokeOpacity="0.25" />
            <path d="M0,-15 L4,2 L0,-2 L-4,2 Z" fill="#e8b04b" />
            <text x="0" y="-22" textAnchor="middle" fill="#ffffff" fillOpacity="0.5" fontSize="11">N</text>
          </g>

          {visibleRegions.map(region => {
            const d = polygonPath(region)
            if (!d) return null
            return (
              <path key={'region-' + region.id} d={d}
                fill={region.color} fillOpacity="0.18"
                stroke={region.color} strokeWidth="2" strokeOpacity="0.72"
                strokeLinejoin="round"
                style={{ cursor: region.note || region.scriptureRef ? 'pointer' : 'default' }}
                onClick={() => setSelected({
                  id: region.id,
                  name_zh: region.label,
                  name_en: region.name_en,
                  lng: region.center?.[0],
                  lat: region.center?.[1],
                  confidence: 'approximate',
                  scriptureRef: region.scriptureRef,
                  note: region.note || t("疆域范围为教学示意，古代边界并非现代精确国界。"),
                  events: region.events || [],
                  _color: region.color,
                })} />
            )
          })}

          {visibleRegions.map(region => {
            if (!region.center) return null
            const [x, y] = project(region.center[0], region.center[1])
            const label = enMode && region.name_en ? region.name_en : region.label
            const w = svgLabelWidth(label)
            return (
              <g key={'region-label-' + region.id} transform={`translate(${x.toFixed(1)},${y.toFixed(1)})`} style={{ pointerEvents: 'none' }}>
                <rect x={(-w / 2).toFixed(1)} y="-12" width={w.toFixed(1)} height="22" rx="6" fill="#08111f" fillOpacity="0.55" stroke={region.color} strokeOpacity="0.28" />
                <text x="0" y="4" textAnchor="middle" fontSize="12" fontWeight="700" fill={region.color}
                  stroke="#08111f" strokeWidth="3" paintOrder="stroke">{label}</text>
              </g>
            )
          })}

          {visibleBoundaries.map(boundary => {
            const d = boundaryPath(boundary)
            if (!d) return null
            return (
              <g key={'boundary-' + boundary.id}>
                <path d={d} fill="none" stroke="#08111f" strokeWidth="5.5" strokeOpacity="0.62" strokeLinecap="round" strokeLinejoin="round" />
                <path d={d} fill="none" stroke={boundary.color || '#f8fafc'} strokeWidth="2.2" strokeOpacity="0.9"
                  strokeDasharray={boundary.dashed ? '8 8' : undefined} strokeLinecap="round" strokeLinejoin="round" />
                {boundary.label && (() => {
                  const mid = boundary.path[Math.floor(boundary.path.length / 2)]
                  const [x, y] = project(mid[0], mid[1])
                  return <text x={x + 8} y={y - 8} fontSize="11.5" fill={boundary.color || '#f8fafc'}
                    stroke="#08111f" strokeWidth="3" paintOrder="stroke">{boundary.label}</text>
                })()}
              </g>
            )
          })}

          {activeLayers.map(layer => (
            <path key={'r-' + layer.id} d={routePath(layer)} fill="none"
              stroke={layer.color} strokeWidth="2.5" strokeOpacity="0.85"
              strokeDasharray={layer.route === false ? '2 8' : '7 6'} strokeLinecap="round" strokeLinejoin="round" />
          ))}

          {activeLayers.map(layer => layer.route === false ? null : (
            routeArrows(layer).map(a => (
              <path key={a.key} d="M-5,-4.5 L7,0 L-5,4.5 L-1.5,0 Z" fill={layer.color}
                stroke="#0e1b2e" strokeWidth="0.8"
                transform={`translate(${a.mx.toFixed(1)},${a.my.toFixed(1)}) rotate(${a.ang.toFixed(1)})`} />
            ))
          ))}

          {travelDot && (
            <g filter="url(#bm-glow)">
              <circle cx={travelDot.x} cy={travelDot.y} r="7" fill="#fff" />
              <circle cx={travelDot.x} cy={travelDot.y} r="13" fill="none" stroke="#fff" strokeOpacity="0.5">
                <animate attributeName="r" values="7;15;7" dur="1.4s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.6;0;0.6" dur="1.4s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {activeLayers.flatMap(layer => visiblePoints(layer).map(p => {
            const [x, y] = project(p.lng, p.lat)
            const isSel = selected && selected.id === p.id
            // 播放到站：当前地点高亮（脉冲光环），行进离站后自动恢复
            const isCur = layer.id === animLayer?.id && activePointIdx >= 0 &&
              orderedPoints[activePointIdx] && orderedPoints[activePointIdx].id === p.id
            const big = isSel || isCur
            return (
              <g key={layer.id + '-' + p.id} transform={`translate(${x},${y})`}
                style={{ cursor: 'pointer' }} onClick={() => setSelected({ ...p, _color: layer.color })}>
                {isCur && (
                  <circle r="13" fill="none" stroke={layer.color} strokeWidth="2.5">
                    <animate attributeName="r" values="9;19;9" dur="1.1s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0.9;0;0.9" dur="1.1s" repeatCount="indefinite" />
                  </circle>
                )}
                {p.marker === 'star' ? (
                  <path d={starPathD(big ? 12 : 9)} fill={layer.color} stroke="#0e1b2e" strokeWidth="1.4"
                    filter={big ? 'url(#bm-glow)' : undefined} />
                ) : p.marker === 'diamond' ? (
                  <rect x={big ? -7.5 : -5.5} y={big ? -7.5 : -5.5} width={big ? 15 : 11} height={big ? 15 : 11}
                    transform="rotate(45)" fill={layer.color} stroke="#0e1b2e" strokeWidth="1.4"
                    filter={big ? 'url(#bm-glow)' : undefined} />
                ) : (
                  <circle r={big ? 9 : 6} fill={layer.color} stroke="#0e1b2e" strokeWidth="2"
                    filter={big ? 'url(#bm-glow)' : undefined} />
                )}
                {p.altar && <text x="0" y="-12" textAnchor="middle" fontSize="13">⛪</text>}
                <text x="10" y="4" fontSize="13" fill="#fff" stroke="#0e1b2e" strokeWidth="3"
                  paintOrder="stroke" style={{ pointerEvents: 'none' }}>{placeName(p)}</text>
              </g>
            )
          }))}
        </svg>

        {selected && (
          <div className="biblemap-detail">
            <button className="biblemap-detail-close" onClick={() => setSelected(null)}>×</button>
            <div className="biblemap-scene" style={{ background: selected._color + '1a' }}>
              <MapScene scene={resolveScene(selected, config.id)} color={selected._color} />
            </div>
            <div className="biblemap-detail-name" style={{ color: selected._color }}>
              {placeName(selected)}
            </div>
            <div className="biblemap-detail-meta">
              {selected.year != null && <span>🗓 {yearLabel(selected.year)}</span>}
              {selected.age != null && <span>{t("👤 亚伯拉罕")} {selected.age} {t("岁")}</span>}
              {selected.scriptureRef && <span>📖 <AutoText>{selected.scriptureRef}</AutoText></span>}
              {selected.confidence && (
                <span style={{ color: (CONFIDENCE[selected.confidence] || {}).color }}>
                  ◎ {(CONFIDENCE[selected.confidence] || {}).label}
                </span>
              )}
            </div>
            {selected.altar && <div className="biblemap-altar">{t("⛪ 在此筑坛：")}<AutoText>{selected.altar}</AutoText></div>}
            {selected.promise && <div className="biblemap-promise">{t("✝ 神的应许：")}<AutoText>{selected.promise}</AutoText></div>}
            {selected.note && <p className="biblemap-note"><AutoText>{selected.note}</AutoText></p>}
            <div className="biblemap-events">
              {(selected.events || []).map((ev, i) => (
                <div key={i} className="biblemap-event">
                  <div className="biblemap-event-h">
                    <strong><AutoText>{ev.title}</AutoText></strong>{ev.ref && <span className="ref"><AutoText>{ev.ref}</AutoText></span>}
                  </div>
                  <p><AutoText>{ev.summary}</AutoText></p>
                </div>
              ))}
              {(!selected.events || selected.events.length === 0) && (
                <p className="biblemap-note dim">{t("途经此地。")}</p>
              )}
            </div>
            <AIExplain
              question={`请用简洁、温暖、适合主日学的话，讲解圣经地点「${selected.name_zh}」的历史背景与属灵意义${selected.scriptureRef ? `（相关经文：${selected.scriptureRef}）` : ''}，并给出一句默想或祷告方向。`}
              label={t("✦ AI 讲解这个地点")} />
          </div>
        )}
      </div>

      <div className="biblemap-legend">
        {visibleRegions.map(r => (
          <span key={'leg-r-' + r.id}><i style={{ background: r.color, borderRadius: 2 }} />{enMode && r.name_en ? r.name_en : r.label}</span>
        ))}
        {Object.entries(CONFIDENCE).map(([k, v]) => (
          <span key={k}><i style={{ background: v.color }} />{v.label}</span>
        ))}
        <span className="hint">{t("点击地标/疆域看经文与插图 · ✦ 可让 AI 现场讲解 · ⛪ 表示筑坛/圣所")}</span>
      </div>
    </div>
  )
}
