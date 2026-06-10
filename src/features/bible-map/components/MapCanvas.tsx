'use client'
import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { territoriesToFeatureCollection, SOURCE_IDS, LAYER_IDS } from '../lib/mapbox'
import { featureCollection, feature, point, lineString, bboxOf } from '../lib/geojson'
import { PROPHECY_COLORS } from '../lib/colors'
import { DEFAULT_CENTER, DEFAULT_ZOOM, JERUSALEM } from '../domain/constants'
import { t } from '../../../i18n/runtime'
import { pickVal } from '../../../i18n/pickLang'
import type {
  BibleCampaignDTO,
  BibleMapEventDTO,
  BiblePersonJourneyDTO,
  BiblePersonJourneyStopDTO,
  BibleProphecyDTO,
  BibleTerritoryDTO,
  GeoJsonPoint,
  GeoJsonPosition,
} from '../domain/types'

interface Props {
  territories: BibleTerritoryDTO[]
  prophecy: BibleProphecyDTO | null
  campaign: BibleCampaignDTO | null
  person: BiblePersonJourneyDTO | null
  focusStop?: BiblePersonJourneyStopDTO | null
  focusEvent: BibleMapEventDTO | null
  activeTerritoryId: string | null
  onTerritoryClick: (id: string) => void
}

const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

// 两点间二次贝塞尔弧线（航线风格），替代生硬直线。
// 控制点取中点向行进方向左侧偏移（偏移量与两点距离成正比）。
function curvedSegment(a: GeoJsonPosition, b: GeoJsonPosition, curvature = 0.18, steps = 28): GeoJsonPosition[] {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const mx = (a[0] + b[0]) / 2
  const my = (a[1] + b[1]) / 2
  const cx = mx - dy * curvature
  const cy = my + dx * curvature
  const out: GeoJsonPosition[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const u = 1 - t
    out.push([u * u * a[0] + 2 * u * t * cx + t * t * b[0], u * u * a[1] + 2 * u * t * cy + t * t * b[1]])
  }
  return out
}
// 多段弧线拼接（去掉相邻段重复的衔接点）
function joinSegments(segs: GeoJsonPosition[][], count = segs.length): GeoJsonPosition[] {
  const out: GeoJsonPosition[] = []
  for (let i = 0; i < Math.min(count, segs.length); i++) {
    out.push(...(out.length ? segs[i].slice(1) : segs[i]))
  }
  return out
}

const PERSON_PROGRESS_SRC = 'bm-person-progress'
const PERSON_PROGRESS_LYR = 'bm-person-progress-layer'

// 高德境外卫星栅格（耶路撒冷/中东在 GCJ-02 加密区之外，与 WGS84 对齐，坐标准确，
// 且国内可直连，替代被墙的 Mapbox 矢量样式）。叠加高德注记(cva)显示地名。
const AMAP_STYLE: maplibregl.Style = {
  version: 8,
  sources: {
    sat: {
      type: 'raster',
      tiles: [
        'https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        'https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        'https://webst03.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
        'https://webst04.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
      ],
      tileSize: 256, maxzoom: 18, attribution: '© AutoNavi',
    },
    label: {
      type: 'raster',
      tiles: [
        'https://webst01.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}',
        'https://webst02.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}',
        'https://webst03.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}',
        'https://webst04.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}',
      ],
      tileSize: 256, maxzoom: 18, attribution: '© AutoNavi',
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#0b1220' } },
    { id: 'sat', type: 'raster', source: 'sat', paint: { 'raster-opacity': 0.9, 'raster-brightness-max': 0.9 } },
    { id: 'label', type: 'raster', source: 'label', paint: { 'raster-opacity': 0.5 } },
  ],
}

export function MapCanvas({
  territories, prophecy, campaign, person, focusStop = null, focusEvent, activeTerritoryId, onTerritoryClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const loadedRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const stopMarkersRef = useRef<maplibregl.Marker[]>([])
  const fadeRafRef = useRef<number | null>(null)
  const hasTerritoryDataRef = useRef(false)
  const curvedSegsRef = useRef<GeoJsonPosition[][]>([])
  const personColorRef = useRef('#fbbf24')
  const progressRafRef = useRef<number | null>(null)
  const pulseRafRef = useRef<number | null>(null)
  const onClickRef = useRef(onTerritoryClick)
  onClickRef.current = onTerritoryClick

  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errMsg, setErrMsg] = useState('')

  // 初始化（一次）
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: AMAP_STYLE,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      // MapLibre 默认单指拖动、滚轮缩放，无需 cooperativeGestures。
    })
    mapRef.current = map

    // 栅格瓦片错误不致命（个别瓦片失败），仅当迟迟无法进入就绪态才提示。
    const enter = () => {
      if (loadedRef.current) return
      buildLayers(map)
      loadedRef.current = true
      setPhase('ready')
      map.resize()
      const src = map.getSource(SOURCE_IDS.territories)
      if (src && 'setData' in src) {
        (src as maplibregl.GeoJSONSource).setData(territoriesToFeatureCollection(territories))
        hasTerritoryDataRef.current = territories.length > 0
      }
    }
    map.on('load', enter)
    map.on('error', (e) => {
      try { console.warn('[圣经地图集] MapLibre:', (e && e.error && e.error.message) || e) } catch { /* ignore */ }
    })
    // 兜底：某些环境 'load' 迟迟不触发（后台标签 rAF 节流、首帧延迟）→ 6s 强制进入。
    const loadTimer = setTimeout(() => {
      if (!loadedRef.current) {
        try { enter() } catch { setPhase('error'); setErrMsg(t('地图加载失败（请检查网络后重试）')) }
      }
    }, 6000)

    // 监听容器尺寸变化（懒显示/响应式/侧栏收展），自动 resize 保证地图始终铺满且加载瓦片。
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(() => { mapRef.current?.resize() })
      ro.observe(containerRef.current)
    }
    const t1 = setTimeout(() => mapRef.current?.resize(), 250)
    const t2 = setTimeout(() => mapRef.current?.resize(), 800)

    return () => {
      loadedRef.current = false
      if (ro) ro.disconnect()
      clearTimeout(loadTimer)
      clearTimeout(t1)
      clearTimeout(t2)
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 建立业务图层（疆域/预言/战役）
  function buildLayers(map: maplibregl.Map): void {
    if (map.getSource(SOURCE_IDS.territories)) return
    map.addSource(SOURCE_IDS.territories, { type: 'geojson', data: EMPTY_FC })
    map.addLayer({
      id: LAYER_IDS.territoryFill, type: 'fill', source: SOURCE_IDS.territories,
      paint: { 'fill-color': ['get', 'color'], 'fill-opacity': ['get', 'fillOpacity'] },
    })
    map.addLayer({
      id: LAYER_IDS.territoryOutline, type: 'line', source: SOURCE_IDS.territories,
      paint: { 'line-color': ['get', 'color'], 'line-width': 1.5 },
    })
    map.addLayer({
      id: LAYER_IDS.territoryActive, type: 'line', source: SOURCE_IDS.territories,
      paint: { 'line-color': '#ffffff', 'line-width': 3 },
      filter: ['==', ['get', 'id'], '__none__'],
    })

    map.addSource(SOURCE_IDS.prophecyLine, { type: 'geojson', data: EMPTY_FC })
    map.addLayer({
      id: LAYER_IDS.prophecyLine, type: 'line', source: SOURCE_IDS.prophecyLine,
      paint: { 'line-color': ['get', 'color'], 'line-width': 3, 'line-dasharray': [2, 1.5] },
    })
    map.addSource(SOURCE_IDS.prophecyTarget, { type: 'geojson', data: EMPTY_FC })
    map.addLayer({
      id: 'bm-prophecy-target-layer', type: 'circle', source: SOURCE_IDS.prophecyTarget,
      paint: { 'circle-radius': 7, 'circle-color': ['get', 'color'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
    })

    map.addSource(SOURCE_IDS.campaignRoute, { type: 'geojson', data: EMPTY_FC })
    map.addLayer({
      id: LAYER_IDS.campaignRoute, type: 'line', source: SOURCE_IDS.campaignRoute,
      paint: { 'line-color': '#f59e0b', 'line-width': 4, 'line-opacity': 0.9 },
    })
    // 战役流光：沿弧线滑动的亮色短线（原生 rAF，无 deck.gl 依赖）
    map.addSource('bm-campaign-flow', { type: 'geojson', data: EMPTY_FC })
    map.addLayer({
      id: 'bm-campaign-flow-layer', type: 'line', source: 'bm-campaign-flow',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': '#fde68a', 'line-width': 5.5, 'line-opacity': 0.95, 'line-blur': 0.5 },
    })
    map.addSource(SOURCE_IDS.campaignPoints, { type: 'geojson', data: EMPTY_FC })
    map.addLayer({
      id: 'bm-campaign-points-layer', type: 'circle', source: SOURCE_IDS.campaignPoints,
      paint: { 'circle-radius': 6, 'circle-color': ['get', 'color'], 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
    })

    map.addSource(SOURCE_IDS.personRoute, { type: 'geojson', data: EMPTY_FC })
    map.addLayer({
      id: LAYER_IDS.personRoute, type: 'line', source: SOURCE_IDS.personRoute,
      paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-opacity': 0.95, 'line-dasharray': [1.2, 0.8] },
    })
    // 播放进度线：已走过的路程（实线，叠在全程虚线之上、站点圆点之下）
    map.addSource(PERSON_PROGRESS_SRC, { type: 'geojson', data: EMPTY_FC })
    map.addLayer({
      id: PERSON_PROGRESS_LYR, type: 'line', source: PERSON_PROGRESS_SRC,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': ['get', 'color'], 'line-width': 5, 'line-opacity': 1 },
    })
    map.addSource(SOURCE_IDS.personStops, { type: 'geojson', data: EMPTY_FC })
    map.addLayer({
      id: 'bm-person-stops-layer', type: 'circle', source: SOURCE_IDS.personStops,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['get', 'sequence'], 1, 7, 14, 4.5],
        'circle-color': ['get', 'color'],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
      },
    })
    // 行程播放时当前站点的高亮光圈
    map.addLayer({
      id: 'bm-person-stop-active', type: 'circle', source: SOURCE_IDS.personStops,
      paint: { 'circle-radius': 11, 'circle-color': 'rgba(251,191,36,0.18)', 'circle-stroke-color': '#fbbf24', 'circle-stroke-width': 3 },
      filter: ['==', ['get', 'sequence'], -1],
    })

    map.on('click', LAYER_IDS.territoryFill, (e) => {
      const f = e.features?.[0]
      const props = (f?.properties ?? {}) as { id?: string }
      if (typeof props.id === 'string') onClickRef.current(props.id)
    })
    map.on('mouseenter', LAYER_IDS.territoryFill, () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', LAYER_IDS.territoryFill, () => { map.getCanvas().style.cursor = '' })
  }

  // 疆域数据更新：年代切换时溶解渐变（淡出旧疆域→换数据→淡入新疆域），
  // 让帝国版图随时间轴推移呈现消长动画，而非生硬跳变。
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current) return
    const src = map.getSource(SOURCE_IDS.territories) as maplibregl.GeoJSONSource | undefined
    if (!src) return
    const setFade = (k: number): void => {
      try {
        map.setPaintProperty(LAYER_IDS.territoryFill, 'fill-opacity', ['*', ['get', 'fillOpacity'], k])
        map.setPaintProperty(LAYER_IDS.territoryOutline, 'line-opacity', k)
      } catch { /* style 销毁等场景忽略 */ }
    }
    if (fadeRafRef.current !== null) { cancelAnimationFrame(fadeRafRef.current); fadeRafRef.current = null }
    const data = territoriesToFeatureCollection(territories)
    // 首次有数据时直接呈现，之后的切换走溶解动画
    if (!hasTerritoryDataRef.current) {
      src.setData(data)
      hasTerritoryDataRef.current = territories.length > 0
      setFade(1)
      return
    }
    const OUT = 160, IN = 460
    const start = performance.now()
    let swapped = false
    const step = (now: number): void => {
      const dt = now - start
      if (dt < OUT) {
        setFade(1 - dt / OUT)
      } else {
        if (!swapped) { swapped = true; src.setData(data) }
        const k = Math.min(1, (dt - OUT) / IN)
        setFade(1 - (1 - k) * (1 - k)) // easeOutQuad
        if (k >= 1) { fadeRafRef.current = null; return }
      }
      fadeRafRef.current = requestAnimationFrame(step)
    }
    fadeRafRef.current = requestAnimationFrame(step)
    return () => {
      if (fadeRafRef.current !== null) { cancelAnimationFrame(fadeRafRef.current); fadeRafRef.current = null }
    }
  }, [territories])

  // 高亮选中疆域
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current) return
    map.setFilter(LAYER_IDS.territoryActive, ['==', ['get', 'id'], activeTerritoryId ?? '__none__'])
  }, [activeTerritoryId])

  // 预言射线
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current) return
    const lineSrc = map.getSource(SOURCE_IDS.prophecyLine) as maplibregl.GeoJSONSource | undefined
    const targetSrc = map.getSource(SOURCE_IDS.prophecyTarget) as maplibregl.GeoJSONSource | undefined
    if (!lineSrc || !targetSrc) return
    if (!prophecy) {
      lineSrc.setData(EMPTY_FC)
      targetSrc.setData(EMPTY_FC)
      return
    }
    const target: [number, number] = [prophecy.targetLongitude, prophecy.targetLatitude]
    const color = PROPHECY_COLORS[prophecy.prophecyType] ?? '#ef4444'
    // 预言射线也用弧线（航线风格），不用生硬直线
    lineSrc.setData(featureCollection([feature(lineString(curvedSegment(JERUSALEM as GeoJsonPosition, target as GeoJsonPosition, 0.22, 40)), { color })]))
    targetSrc.setData(featureCollection([feature(point(target), { color })]))
    const bounds = bboxOf([JERUSALEM as GeoJsonPosition, target as GeoJsonPosition])
    map.fitBounds(bounds, { padding: 80, duration: 800 })
  }, [prophecy])

  // 战役路线
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current) return
    const routeSrc = map.getSource(SOURCE_IDS.campaignRoute) as maplibregl.GeoJSONSource | undefined
    const pointsSrc = map.getSource(SOURCE_IDS.campaignPoints) as maplibregl.GeoJSONSource | undefined
    if (!routeSrc || !pointsSrc) return
    if (!campaign) {
      routeSrc.setData(EMPTY_FC)
      pointsSrc.setData(EMPTY_FC)
      return
    }
    // 战役路线同样弧线化
    const waypoints = campaign.routeGeojson.coordinates
    const curvedRoute = waypoints.length >= 2
      ? joinSegments(waypoints.slice(0, -1).map((c, i) => curvedSegment(c, waypoints[i + 1])))
      : waypoints
    routeSrc.setData(featureCollection([feature(curvedRoute.length >= 2 ? lineString(curvedRoute) : campaign.routeGeojson, { id: campaign.id })]))
    const kindColor: Record<string, string> = { camp: '#22c55e', enemy: '#ef4444', retreat: '#eab308' }
    if (campaign.pointsGeojson) {
      const colored = featureCollection<GeoJsonPoint, { color: string; nameZh: string }>(
        campaign.pointsGeojson.features.map((f) =>
          feature(f.geometry, {
            color: kindColor[String(f.properties.kind)] ?? '#38bdf8',
            nameZh: String(f.properties.nameZh ?? ''),
          }),
        ),
      )
      pointsSrc.setData(colored)
    } else {
      pointsSrc.setData(EMPTY_FC)
    }
    map.fitBounds(bboxOf(curvedRoute.length >= 2 ? curvedRoute : waypoints), { padding: 90, duration: 900 })
  }, [campaign])

  // 人物生平轨迹
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current) return
    const routeSrc = map.getSource(SOURCE_IDS.personRoute) as maplibregl.GeoJSONSource | undefined
    const stopsSrc = map.getSource(SOURCE_IDS.personStops) as maplibregl.GeoJSONSource | undefined
    if (!routeSrc || !stopsSrc) return
    // 站点名 DOM 标注（避免字形/CJK glyphs 依赖）
    stopMarkersRef.current.forEach((m) => { try { m.remove() } catch { /* ignore */ } })
    stopMarkersRef.current = []
    const progressSrc = map.getSource(PERSON_PROGRESS_SRC) as maplibregl.GeoJSONSource | undefined
    progressSrc?.setData(EMPTY_FC)
    curvedSegsRef.current = []
    if (!person) {
      routeSrc.setData(EMPTY_FC)
      stopsSrc.setData(EMPTY_FC)
      return
    }
    // 站点间连线用贝塞尔弧线（航线风格），不再用生硬直线
    const segs = person.stops.length >= 2
      ? person.stops.slice(0, -1).map((s, i) => curvedSegment(
          [s.longitude, s.latitude],
          [person.stops[i + 1].longitude, person.stops[i + 1].latitude],
        ))
      : []
    curvedSegsRef.current = segs
    personColorRef.current = person.color
    const fullPath = joinSegments(segs)
    const routeLine = fullPath.length >= 2 ? lineString(fullPath) : person.routeGeojson
    routeSrc.setData(featureCollection([feature(routeLine, { id: person.id, color: person.color })]))
    stopsSrc.setData(featureCollection<GeoJsonPoint, { color: string; nameZh: string; sequence: number }>(
      person.stops.map((s) => feature(point([s.longitude, s.latitude]), {
        color: person.color,
        nameZh: s.nameZh,
        sequence: s.sequence,
      })),
    ))
    person.stops.forEach((s) => {
      const el = document.createElement('div')
      el.style.cssText = 'pointer-events:none;font-size:11px;font-weight:600;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.95),0 0 6px rgba(0,0,0,.7);white-space:nowrap;transform:translateY(-9px);'
      el.textContent = `${s.sequence} ${pickVal(s.nameZh, s.name)}`
      stopMarkersRef.current.push(
        new maplibregl.Marker({ element: el, anchor: 'bottom' }).setLngLat([s.longitude, s.latitude]).addTo(map),
      )
    })
    map.fitBounds(bboxOf(fullPath.length >= 2 ? fullPath : person.routeGeojson.coordinates), { padding: 90, duration: 900 })
  }, [person])

  // 行程播放：进度线沿弧线逐段绘制；到站后当前站点脉冲高亮；
  // 离开该站（focusStop 变化）或停止播放（null）即恢复原来状态。
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current) return
    const progressSrc = map.getSource(PERSON_PROGRESS_SRC) as maplibregl.GeoJSONSource | undefined
    const cancelAnims = (): void => {
      if (progressRafRef.current !== null) { cancelAnimationFrame(progressRafRef.current); progressRafRef.current = null }
      if (pulseRafRef.current !== null) { cancelAnimationFrame(pulseRafRef.current); pulseRafRef.current = null }
    }
    const setActive = (seq: number): void => {
      try { map.setFilter('bm-person-stop-active', ['==', ['get', 'sequence'], seq]) } catch { /* ignore */ }
    }
    const setActiveRadius = (r: number): void => {
      try { map.setPaintProperty('bm-person-stop-active', 'circle-radius', r) } catch { /* ignore */ }
    }
    cancelAnims()
    if (!focusStop) {
      // 恢复原状：取消高亮、清空进度线、全程虚线恢复原透明度
      setActive(-1)
      setActiveRadius(11)
      try { map.setPaintProperty(LAYER_IDS.personRoute, 'line-opacity', 0.95) } catch { /* ignore */ }
      progressSrc?.setData(EMPTY_FC)
      return
    }
    // 行进中：先取消上一站的高亮（让上一站恢复原状），弱化全程虚线以凸显进度实线
    setActive(-1)
    setActiveRadius(11)
    try { map.setPaintProperty(LAYER_IDS.personRoute, 'line-opacity', 0.32) } catch { /* ignore */ }

    const segs = curvedSegsRef.current
    const color = personColorRef.current
    const seq = focusStop.sequence
    const doneCount = Math.max(0, seq - 2)            // 已完整走过的弧线段
    const animSeg = seq >= 2 ? segs[seq - 2] : null   // 正在行进的弧线段（上一站→当前站）
    const base = joinSegments(segs, doneCount)
    const DRAW = 1300
    const start = performance.now()
    const setProgress = (coords: GeoJsonPosition[]): void => {
      if (progressSrc) progressSrc.setData(coords.length >= 2 ? featureCollection([feature(lineString(coords), { color })]) : EMPTY_FC)
    }
    const startPulse = (): void => {
      // 到站：当前站点脉冲高亮
      setActive(seq)
      const t0 = performance.now()
      const pulse = (now: number): void => {
        setActiveRadius(11 + 3.5 * Math.abs(Math.sin((now - t0) / 380)))
        pulseRafRef.current = requestAnimationFrame(pulse)
      }
      pulseRafRef.current = requestAnimationFrame(pulse)
    }
    if (!animSeg || animSeg.length < 2) {
      setProgress(base)
      startPulse()
    } else {
      const step = (now: number): void => {
        const k = Math.min(1, (now - start) / DRAW)
        const e = 1 - (1 - k) * (1 - k) // easeOutQuad
        const npts = Math.max(2, Math.round(animSeg.length * e))
        setProgress([...base, ...(base.length ? animSeg.slice(1, npts) : animSeg.slice(0, npts))])
        if (k >= 1) { progressRafRef.current = null; startPulse(); return }
        progressRafRef.current = requestAnimationFrame(step)
      }
      progressRafRef.current = requestAnimationFrame(step)
    }
    // 智能缩放：按本段行程跨度调整 zoom——跨千里看全局，城内短途拉近看细节
    const zoomSeg = seq >= 2 ? segs[seq - 2] : segs[0]
    let zoom = 7.2
    if (zoomSeg && zoomSeg.length >= 2) {
      const a = zoomSeg[0]
      const b = zoomSeg[zoomSeg.length - 1]
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]) // 度数距离（近似）
      zoom = d > 5 ? 5.6 : d > 2 ? 6.4 : d > 0.8 ? 7.2 : d > 0.25 ? 8.4 : 9.6
    }
    map.flyTo({ center: [focusStop.longitude, focusStop.latitude], zoom, duration: 1500 })
    return cancelAnims
  }, [focusStop])

  // 战役路线流光动画：亮色短线沿弧线循环滑动（原生 MapLibre setData + rAF，
  // 替代此前从未真正生效的 deck.gl TripsLayer——TripsLayer 在未安装的 @deck.gl/geo-layers 里）。
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current) return
    const flowSrc = map.getSource('bm-campaign-flow') as maplibregl.GeoJSONSource | undefined
    const stop = (): void => {
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      flowSrc?.setData(EMPTY_FC)
    }
    stop()
    if (!campaign || !flowSrc) return
    const wps = campaign.routeGeojson.coordinates
    if (wps.length < 2) return
    const arc = joinSegments(wps.slice(0, -1).map((c, i) => curvedSegment(c, wps[i + 1])))
    const n = arc.length
    const windowLen = Math.max(3, Math.round(n * 0.18)) // 流光长度 ≈ 路线 18%
    const stride = Math.max(1, Math.round(n / 150))     // 一圈约 6 秒
    let head = 0
    let last = 0
    const step = (now: number): void => {
      if (now - last > 40) { // ~25fps 足够顺滑且省电
        last = now
        head = (head + stride) % (n + windowLen)
        const s = Math.max(0, head - windowLen)
        const e = Math.min(n, head)
        if (e - s >= 2) flowSrc.setData(featureCollection([feature(lineString(arc.slice(s, e)), {})]))
        else flowSrc.setData(EMPTY_FC)
      }
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return stop
  }, [campaign])

  // 事件定位
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current || !focusEvent) return
    if (focusEvent.longitude !== null && focusEvent.latitude !== null) {
      map.flyTo({ center: [focusEvent.longitude, focusEvent.latitude], zoom: 8, duration: 900 })
    }
  }, [focusEvent])

  return (
    <div className="relative h-full min-h-[320px] w-full">
      <div ref={containerRef} className="h-full min-h-[320px] w-full rounded-xl" />
      {phase !== 'ready' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-[#0b1220]/80 text-center">
          <div className="pointer-events-auto">
            {phase === 'error' ? (
              <>
                <div className="mb-2 text-3xl">🗺️</div>
                <p className="text-sm text-gray-300">{errMsg || t('地图加载失败')}</p>
                <p className="mt-1 text-xs text-gray-500">{t('左侧时间轴、图层、事件与右侧详情仍可正常使用。')}</p>
              </>
            ) : (
              <>
                <div className="mb-2 animate-pulse text-2xl">🗺️</div>
                <p className="text-sm text-gray-400">{t('地图加载中…')}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
