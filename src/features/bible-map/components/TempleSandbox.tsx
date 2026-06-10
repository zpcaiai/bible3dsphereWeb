import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { featureCollection, feature } from '../lib/geojson'
import {
  TEMPLE_CENTER, TEMPLE_COLORS, templeEras, templeEraForYear,
} from '../data/seed-temple'
import { formatYear } from '../lib/format'
import { DISCLAIMER } from '../domain/constants'
import type { GeoJsonPolygon } from '../domain/types'
import { t } from '../../../i18n/runtime'
import { AutoText } from '../../../autoTranslate.jsx'

const SRC = 'temple-structures'
const LYR = 'temple-structures-3d'
const YEAR_MIN = -1010
const YEAR_MAX = 100

// 高德境外卫星栅格（国内可直连，替代被墙的 Mapbox 矢量样式）。
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
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#0b1220' } },
    { id: 'sat', type: 'raster', source: 'sat', paint: { 'raster-opacity': 0.92, 'raster-brightness-max': 0.92 } },
  ],
}

interface StructProps extends Record<string, unknown> {
  kind: string
  height: number
  color: string
}

interface Props {
  onBack: () => void
}

export function TempleSandbox({ onBack }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const loadedRef = useRef(false)
  const [year, setYear] = useState<number>(-960)
  const era = templeEraForYear(year)

  function buildData(y: number) {
    const e = templeEraForYear(y)
    return featureCollection<GeoJsonPolygon, StructProps>(
      e.structures.map((s) =>
        feature<GeoJsonPolygon, StructProps>(s.polygon, {
          kind: s.kind,
          height: s.height,
          color: TEMPLE_COLORS[s.kind],
        }),
      ),
    )
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: AMAP_STYLE,
      center: TEMPLE_CENTER,
      zoom: 15.2,
      pitch: 60,
      bearing: -20,
      antialias: true,
    })
    mapRef.current = map
    map.on('load', () => {
      map.addSource(SRC, { type: 'geojson', data: buildData(year) })
      map.addLayer({
        id: LYR,
        type: 'fill-extrusion',
        source: SRC,
        paint: {
          'fill-extrusion-color': ['get', 'color'],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.92,
        },
      })
      loadedRef.current = true
    })
    return () => {
      loadedRef.current = false
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !loadedRef.current) return
    const src = map.getSource(SRC)
    if (src) (src as maplibregl.GeoJSONSource).setData(buildData(year))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-white">{t('🏛️ 圣殿山数字孪生沙盘')}</h1>
          <p className="text-xs text-gray-400">{t('拖动时间轴，看耶路撒冷圣殿山从禾场到希律圣殿的「平地起高楼」')}</p>
        </div>
        <button onClick={onBack} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-gray-200 hover:bg-white/10">
          {t('‹ 返回地图')}
        </button>
      </header>

      <div className="relative flex-1">
        <div ref={containerRef} className="h-full w-full" />

        {/* 时代信息卡 */}
        <div className="absolute left-4 top-4 max-w-sm rounded-xl border border-white/10 bg-black/70 p-4 backdrop-blur">
          <div className="text-xs text-amber-400">{formatYear(era.year)}</div>
          <h2 className="mb-1 text-base font-bold text-white"><AutoText>{era.label}</AutoText></h2>
          <p className="text-sm leading-relaxed text-gray-300"><AutoText>{era.note}</AutoText></p>
        </div>
      </div>

      {/* 时间轴 */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs text-gray-400">{t('时代')}</span>
          <span className="text-sm font-bold text-amber-400">{formatYear(year)}</span>
        </div>
        <input
          type="range" min={YEAR_MIN} max={YEAR_MAX} step={10} value={year}
          onChange={(e) => setYear(Number.parseInt(e.target.value, 10))}
          className="w-full accent-amber-400"
          aria-label={t('圣殿时代时间轴')}
        />
        <div className="mt-2 flex flex-wrap gap-2">
          {templeEras.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => setYear(e.year)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                e.id === era.id
                  ? 'border-amber-400/60 bg-amber-400/15 text-amber-300'
                  : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <AutoText>{e.label}</AutoText>
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-[11px] text-gray-500">{DISCLAIMER}</p>
      </div>
    </div>
  )
}
