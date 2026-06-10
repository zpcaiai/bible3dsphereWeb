'use client'
import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { territoriesToFeatureCollection, SOURCE_IDS, LAYER_IDS } from '../lib/mapbox'
import { featureCollection, feature, point, lineBetween, bboxOf } from '../lib/geojson'
import { PROPHECY_COLORS } from '../lib/colors'
import { DEFAULT_CENTER, DEFAULT_ZOOM, JERUSALEM } from '../domain/constants'
import { t } from '../../../i18n/runtime'
import type {
  BibleCampaignDTO,
  BibleMapEventDTO,
  BiblePersonJourneyDTO,
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
  focusEvent: BibleMapEventDTO | null
  activeTerritoryId: string | null
  onTerritoryClick: (id: string) => void
}

const EMPTY_FC: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }

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
  territories, prophecy, campaign, person, focusEvent, activeTerritoryId, onTerritoryClick,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const loadedRef = useRef(false)
  const rafRef = useRef<number | null>(null)
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
      if (src && 'setData' in src) (src as maplibregl.GeoJSONSource).setData(territoriesToFeatureCollection(territories))
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

    map.on('click', LAYER_IDS.territoryFill, (e) => {
      const f = e.features?.[0]
      const props = (f?.properties ?? {}) as { id?: string }
      if (typeof props.id === 'string') onClickRef.current(props.id)
    })
    map.on('mouseenter', LAYER_IDS.territoryFill, () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', LAYER_IDS.territoryFill, () => { map.getCanvas().style.cursor = '' })
  }

  // 疆域数据更新
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current) return
    const src = map.getSource(SOURCE_IDS.territories)
    if (src) (src as maplibregl.GeoJSONSource).setData(territoriesToFeatureCollection(territories))
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
    lineSrc.setData(featureCollection([feature(lineBetween(JERUSALEM, target), { color })]))
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
    routeSrc.setData(featureCollection([feature(campaign.routeGeojson, { id: campaign.id })]))
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
    const coords = campaign.routeGeojson.coordinates
    map.fitBounds(bboxOf(coords), { padding: 90, duration: 900 })
  }, [campaign])

  // 人物生平轨迹
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current) return
    const routeSrc = map.getSource(SOURCE_IDS.personRoute) as maplibregl.GeoJSONSource | undefined
    const stopsSrc = map.getSource(SOURCE_IDS.personStops) as maplibregl.GeoJSONSource | undefined
    if (!routeSrc || !stopsSrc) return
    if (!person) {
      routeSrc.setData(EMPTY_FC)
      stopsSrc.setData(EMPTY_FC)
      return
    }
    routeSrc.setData(featureCollection([feature(person.routeGeojson, { id: person.id, color: person.color })]))
    stopsSrc.setData(featureCollection<GeoJsonPoint, { color: string; nameZh: string; sequence: number }>(
      person.stops.map((s) => feature(point([s.longitude, s.latitude]), {
        color: person.color,
        nameZh: s.nameZh,
        sequence: s.sequence,
      })),
    ))
    map.fitBounds(bboxOf(person.routeGeojson.coordinates), { padding: 90, duration: 900 })
  }, [person])

  // 战役路线流光动画（deck.gl TripsLayer，可选；未安装则保留上面的静态 line）
  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current) return
    let cancelled = false
    interface DeckOverlayLike extends maplibregl.IControl {
      setProps(props: { layers: unknown[] }): void
    }
    let overlay: DeckOverlayLike | null = null
    const cleanup = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      if (overlay && mapRef.current) {
        try { mapRef.current.removeControl(overlay) } catch { /* ignore */ }
      }
      overlay = null
    }
    if (!campaign) {
      cleanup()
      return
    }
    void (async () => {
      try {
        const mapboxMod = (await import('@deck.gl/mapbox')) as unknown as {
          MapboxOverlay: new (p: { layers: unknown[] }) => DeckOverlayLike
        }
        const layersMod = (await import('@deck.gl/layers')) as unknown as {
          TripsLayer?: new (p: Record<string, unknown>) => unknown
        }
        if (cancelled || !mapRef.current) return
        // TripsLayer 实际位于 @deck.gl/geo-layers（未安装）；从 layers 取为 undefined。
        // 守卫：拿不到构造器就静默降级，保留静态路线，绝不在 rAF 里 new undefined 崩页。
        if (typeof layersMod.TripsLayer !== 'function') return
        const path = campaign.routeGeojson.coordinates.map((c) => [c[0], c[1]] as [number, number])
        const timestamps = path.map((_, i) => i)
        const maxTime = Math.max(1, path.length - 1)
        const trailLength = 1.4
        overlay = new mapboxMod.MapboxOverlay({ layers: [] })
        mapRef.current.addControl(overlay)
        let t = 0
        const TripsLayer = layersMod.TripsLayer
        const tick = (): void => {
          if (cancelled || !overlay) return
          try {
            t = (t + 0.03) % (maxTime + trailLength)
            const layer = new TripsLayer({
              id: 'bm-trip',
              data: [{ path, timestamps }],
              getPath: (d: { path: [number, number][] }) => d.path,
              getTimestamps: (d: { timestamps: number[] }) => d.timestamps,
              getColor: [245, 158, 11],
              opacity: 0.9,
              widthMinPixels: 5,
              trailLength,
              currentTime: t,
              fadeTrail: true,
            })
            overlay.setProps({ layers: [layer] })
          } catch { cleanup(); return }
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      } catch {
        // deck.gl 未安装或失败 → 静默降级，保留静态 line 路线
      }
    })()
    return () => {
      cancelled = true
      cleanup()
    }
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
