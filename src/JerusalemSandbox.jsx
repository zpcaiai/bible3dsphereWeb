// JerusalemSandbox.jsx — 耶路撒冷数字孪生时空微缩沙盘
// Mapbox GL JS v3（有 VITE_MAPBOX_TOKEN 时）；否则 / 配额耗尽(401/403/429) 自动回退 MapLibre GL JS v1（免 token）。
// 核心：固定视角圣殿山 · 时间轴剥离各时期 · 3D fill-extrusion 平地起高楼 · 受难周 FPV 相机巡游。
// 库与瓦片均从 CDN 动态加载（需联网）。
import { useEffect, useRef, useState } from 'react'
import BackButton from './BackButton'
import { JERU_ERAS, TEMPLE_CENTER, PASSION_WEEK, eraGeoJSON, locationsFor, JERU_LOCATIONS } from './data/jerusalemChronology'
import { TEMPLE_GEOJSON, TEMPLE_PARTS, TEMPLE_LABELS, TEMPLE_CAMERA } from './data/templeStructure'
import { TEMPLE_GEOJSON_HEROD, TEMPLE_PARTS_HEROD, TEMPLE_LABELS_HEROD, TEMPLE_CAMERA_HEROD } from './data/templeStructureHerod'
import { TEMPLE_GEOJSON_TABERNACLE, TEMPLE_PARTS_TABERNACLE, TEMPLE_LABELS_TABERNACLE, TEMPLE_CAMERA_TABERNACLE } from './data/templeStructureTabernacle'
import { TEMPLE_GEOJSON_ZERUBBABEL, TEMPLE_PARTS_ZERUBBABEL, TEMPLE_LABELS_ZERUBBABEL, TEMPLE_CAMERA_ZERUBBABEL } from './data/templeStructureZerubbabel'
import { createModelLayer } from './lib/gltfModelLayer'
import { t, getRuntimeLang } from './i18n/runtime'
import { AutoText } from './autoTranslate.jsx'

const TOKEN = (import.meta.env && (import.meta.env.NEXT_PUBLIC_MAPBOX_TOKEN || import.meta.env.VITE_MAPBOX_TOKEN)) || ''
const MAPBOX_VER = '3.7.0'
const MAPLIBRE_VER = '1.15.2'
// 经 jsDelivr 加载（已在站点 CSP script-src 白名单内）；GL 库会创建 blob worker，需 CSP worker-src blob:
const CDN = {
  mapboxJs: `https://cdn.jsdelivr.net/npm/mapbox-gl@${MAPBOX_VER}/dist/mapbox-gl.js`,
  mapboxCss: `https://cdn.jsdelivr.net/npm/mapbox-gl@${MAPBOX_VER}/dist/mapbox-gl.css`,
  maplibreJs: `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_VER}/dist/maplibre-gl.js`,
  maplibreCss: `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_VER}/dist/maplibre-gl.css`,
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if ([...document.scripts].some(s => s.src === src)) return resolve()
    const el = document.createElement('script')
    el.src = src; el.async = true
    el.onload = () => resolve()
    el.onerror = () => reject(new Error(t("脚本加载失败：") + src))
    document.head.appendChild(el)
  })
}
// 用 fetch 取 CSS 文本并注入 <style>，避免依赖 CSP style-src 允许外部域
async function loadCss(href) {
  if (document.querySelector(`style[data-href="${href}"]`)) return
  try {
    const txt = await fetch(href).then(r => r.text())
    const st = document.createElement('style'); st.setAttribute('data-href', href); st.textContent = txt
    document.head.appendChild(st)
  } catch (_) {
    // 退而求其次：直接用 <link>（若 CSP 允许）
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l)
  }
}

// MapLibre 免 token 样式：暗色背景 + 可选 OSM 栅格（低饱和暗化）
const MAPLIBRE_STYLE = {
  version: 8,
  sources: {
    // 高德境外卫星瓦片（耶路撒冷在 GCJ-02 加密区之外，与 WGS84 对齐，坐标准确，
    // 且国内可直连，替代被墙的 Mapbox 卫星图）。默认显示，作为基础底图。
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
    osm: {
      type: 'raster',
      tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', 'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png', 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256, maxzoom: 19, attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#0e1726' } },
    { id: 'sat', type: 'raster', source: 'sat', paint: { 'raster-opacity': 0.92, 'raster-brightness-max': 0.92 } },
    { id: 'osm', type: 'raster', source: 'osm', layout: { visibility: 'none' }, paint: { 'raster-opacity': 0.5, 'raster-saturation': -0.7, 'raster-brightness-max': 0.7 } },
  ],
}

function bearing(a, b) {
  const r = Math.PI / 180
  const dLon = (b[0] - a[0]) * r
  const y = Math.sin(dLon) * Math.cos(b[1] * r)
  const x = Math.cos(a[1] * r) * Math.sin(b[1] * r) - Math.sin(a[1] * r) * Math.cos(b[1] * r) * Math.cos(dLon)
  return (Math.atan2(y, x) * 180) / Math.PI
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// 已 remove() 的 Mapbox/MapLibre 地图再调 getLayer/getSource 会直接抛异常（style 已销毁），
// 回退切换引擎时曾导致整个应用崩溃黑屏——统一用安全探测。
const safeLayer = (map, id) => { try { return map && map.getLayer ? map.getLayer(id) : null } catch (_) { return null } }
const safeSource = (map, id) => { try { return map && map.getSource ? map.getSource(id) : null } catch (_) { return null } }
// 四个时期的圣殿/会幕结构：会幕 → 所罗门第一圣殿 → 所罗巴伯第二圣殿 → 希律扩建
const TEMPLE_VARIANTS = {
  tabernacle: { data: TEMPLE_GEOJSON_TABERNACLE, parts: TEMPLE_PARTS_TABERNACLE, labels: TEMPLE_LABELS_TABERNACLE, camera: TEMPLE_CAMERA_TABERNACLE, name: '会幕', icon: '⛺' },
  solomon: { data: TEMPLE_GEOJSON, parts: TEMPLE_PARTS, labels: TEMPLE_LABELS, camera: TEMPLE_CAMERA, name: '所罗门圣殿', icon: '⛪' },
  zerubbabel: { data: TEMPLE_GEOJSON_ZERUBBABEL, parts: TEMPLE_PARTS_ZERUBBABEL, labels: TEMPLE_LABELS_ZERUBBABEL, camera: TEMPLE_CAMERA_ZERUBBABEL, name: '所罗巴伯圣殿', icon: '🧱' },
  herod: { data: TEMPLE_GEOJSON_HEROD, parts: TEMPLE_PARTS_HEROD, labels: TEMPLE_LABELS_HEROD, camera: TEMPLE_CAMERA_HEROD, name: '希律圣殿', icon: '🏛' },
}
const TEMPLE_VARIANT_ORDER = ['tabernacle', 'solomon', 'zerubbabel', 'herod']
const dataFor = (v) => (TEMPLE_VARIANTS[v] || TEMPLE_VARIANTS.herod).data
const partsFor = (v) => (TEMPLE_VARIANTS[v] || TEMPLE_VARIANTS.herod).parts
const labelsFor = (v) => (TEMPLE_VARIANTS[v] || TEMPLE_VARIANTS.herod).labels
const cameraFor = (v) => (TEMPLE_VARIANTS[v] || TEMPLE_VARIANTS.herod).camera
const variantForEra = (id) => {
  if (id === 'david') return 'tabernacle'
  if (id === 'solomon' || id === 'hezekiah') return 'solomon'
  if (id === 'nehemiah') return 'zerubbabel'
  return 'herod'
}
const MODEL_URL = (import.meta.env && import.meta.env.VITE_TEMPLE_GLTF_URL) || ''

export default function JerusalemSandbox({ onBack }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const glRef = useRef(null)
  const markersRef = useRef([])
  const passionMarkerRef = useRef(null)
  const triedFallbackRef = useRef(false)
  const passionRunRef = useRef(false)
  const eraIdxRef = useRef(0)

  const [engine, setEngine] = useState(TOKEN ? 'mapbox' : 'maplibre')
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [errMsg, setErrMsg] = useState('')
  const [eraIdx, setEraIdx] = useState(JERU_ERAS.findIndex(e => e.id === 'herod') >= 0 ? JERU_ERAS.findIndex(e => e.id === 'herod') : 0)
  const [selectedLoc, setSelectedLoc] = useState(null)
  const [passionStop, setPassionStop] = useState(-1)
  const [passionActive, setPassionActive] = useState(false)
  const [showOsm, setShowOsm] = useState(false)
  // —— 圣殿3D结构模式 ——
  const [templeMode, setTempleMode] = useState(false)
  const [cutaway, setCutaway] = useState(true)
  const [selectedPart, setSelectedPart] = useState(null)
  const templeMarkersRef = useRef([])
  const templeModeRef = useRef(false)
  const [templeVariant, setTempleVariant] = useState('herod')
  const templeVariantRef = useRef('herod')
  // —— 真实高程（hillshade）+ glTF 精模图层 ——
  const [showTerrain, setShowTerrain] = useState(true)
  const showTerrainRef = useRef(true)
  const [modelOn, setModelOn] = useState(false)
  const [modelStatus, setModelStatus] = useState('')
  const modelLayerRef = useRef(null)

  const era = JERU_ERAS[eraIdx]
  eraIdxRef.current = eraIdx

  // —— 初始化地图（含回退）——
  useEffect(() => {
    let disposed = false

    async function boot(eng) {
      try {
        setStatus('loading')
        if (eng === 'mapbox') {
          loadCss(CDN.mapboxCss); await loadScript(CDN.mapboxJs)
          if (disposed) return
          const gl = window.mapboxgl
          gl.accessToken = TOKEN
          const map = new gl.Map({
            container: containerRef.current,
            style: 'mapbox://styles/mapbox/satellite-streets-v12',
            center: TEMPLE_CENTER, zoom: 15.4, pitch: 62, bearing: -22, antialias: true,
          })
          glRef.current = gl; mapRef.current = map
          // 国内 api.mapbox.com 常被连接重置(ERR_CONNECTION_CLOSED)：
          // 任何 load 前的错误、或 8 秒仍未 load，都直接回退本地打包的 MapLibre。
          let mbLoaded = false
          const fallbackToMaplibre = () => {
            if (disposed || triedFallbackRef.current) return
            triedFallbackRef.current = true
            try { map.remove() } catch (_) {}
            mapRef.current = null; glRef.current = null
            setEngine('maplibre'); boot('maplibre')
          }
          const mbTimer = setTimeout(() => { if (!mbLoaded) fallbackToMaplibre() }, 4000)
          map.on('error', () => { if (!mbLoaded) { clearTimeout(mbTimer); fallbackToMaplibre() } })
          map.on('load', () => {
            mbLoaded = true; clearTimeout(mbTimer)
            if (!disposed) onMapReady(gl, map, 'mapbox')
          })
        } else {
          // MapLibre 走本地打包（国内 jsDelivr/CDN 不可靠，CDN 加载常失败导致无地图）
          const mod = await import('maplibre-gl')
          await import('maplibre-gl/dist/maplibre-gl.css')
          if (disposed) return
          const gl = mod.default || mod
          const map = new gl.Map({
            container: containerRef.current,
            style: MAPLIBRE_STYLE,
            center: TEMPLE_CENTER, zoom: 15.4, pitch: 60, bearing: -22, antialias: true,
          })
          glRef.current = gl; mapRef.current = map
          let mlReady = false
          const enterMaplibre = () => {
            if (disposed || mlReady) return
            mlReady = true
            onMapReady(gl, map, 'maplibre')
          }
          map.on('load', enterMaplibre)
          // 瓦片/样式错误不致命（如个别 AMap 瓦片失败），记录即可，避免静默卡死
          map.on('error', (e) => {
            try { console.warn('[沙盘] MapLibre:', (e && e.error && e.error.message) || e) } catch (_) {}
          })
          // 兜底：某些环境（后台标签 rAF 节流、首帧延迟）'load' 迟迟不触发，
          // 6 秒后强制进入——onMapReady 已对每层做容错，至少呈现底图与控制条。
          setTimeout(enterMaplibre, 6000)
        }
      } catch (e) {
        if (eng === 'mapbox' && !triedFallbackRef.current) {
          triedFallbackRef.current = true; setEngine('maplibre'); boot('maplibre')
        } else {
          setStatus('error'); setErrMsg(e.message || t("地图加载失败（请检查网络）"))
        }
      }
    }

    boot(TOKEN ? 'mapbox' : 'maplibre')
    let ro = null
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(() => { try { mapRef.current && mapRef.current.resize() } catch (_) {} })
      ro.observe(containerRef.current)
    }
    return () => {
      disposed = true; passionRunRef.current = false
      if (ro) ro.disconnect()
      clearMarkers()
      if (mapRef.current) { try { mapRef.current.remove() } catch (_) {} mapRef.current = null }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function clearMarkers() {
    markersRef.current.forEach(m => { try { m.remove() } catch (_) {} })
    markersRef.current = []
  }

  // —— 地图就绪：建立图层 + 首次渲染当前时期 ——
  function onMapReady(gl, map, eng) {
    // 容器若在初始化时尺寸为 0（懒显示/页签切换），Mapbox/MapLibre 会黑屏不加载瓦片；load 后强制 resize。
    try { map.resize() } catch (_) {}
    setTimeout(() => { try { mapRef.current && mapRef.current.resize() } catch (_) {} }, 300)
    try {
      map.addControl(new gl.NavigationControl({ visualizePitch: true }), 'top-left')
    } catch (_) {}
    // 可选地形（仅 Mapbox）
    if (eng === 'mapbox') {
      try {
        map.addSource('dem', { type: 'raster-dem', url: 'mapbox://mapbox.mapbox-terrain-dem-v1', tileSize: 512, maxzoom: 14 })
        map.setTerrain({ source: 'dem', exaggeration: 1.2 })
      } catch (_) {}
    }
    // 图层构建：包成可重入函数。若样式尚未就绪（兜底强制进入的情况），
    // 先把状态切到 ready 让底图/控制条显示，待 style.load 后再补图层，绝不卡死。
    let layersBuilt = false
    const buildLayers = () => {
      if (layersBuilt) return
      if (map.isStyleLoaded && !map.isStyleLoaded()) return  // 样式没好，等 styledata 再来
      layersBuilt = true
      const g0 = eraGeoJSON(era.id)
      try {
        if (!map.getSource('jeru-poly')) map.addSource('jeru-poly', { type: 'geojson', data: g0.polygons })
        if (!map.getSource('jeru-wall')) map.addSource('jeru-wall', { type: 'geojson', data: g0.walls })
        if (!map.getLayer('jeru-fill')) map.addLayer({
          id: 'jeru-fill', type: 'fill-extrusion', source: 'jeru-poly',
          paint: {
            'fill-extrusion-color': ['coalesce', ['get', 'fill'], '#9a8b5a'],
            'fill-extrusion-height': ['coalesce', ['get', 'height'], 0],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.86,
          },
        })
        if (!map.getLayer('jeru-wall-line')) map.addLayer({
          id: 'jeru-wall-line', type: 'line', source: 'jeru-wall',
          paint: { 'line-color': '#e8b04b', 'line-width': 3, 'line-opacity': 0.9, 'line-dasharray': [2, 1.5] },
        })
      } catch (err) { layersBuilt = false; try { console.warn('[沙盘] 图层构建延后:', err && err.message) } catch (_) {} }
    }
    buildLayers()
    if (!layersBuilt) { try { map.on('styledata', buildLayers) } catch (_) {} }

    // —— 真实高程：DEM 山体阴影（免 token，AWS Terrarium；MapLibre v1 不支持真三维 setTerrain，用 hillshade 呈现起伏）——
    const buildHillshade = () => {
      try {
        if (!safeSource(map, 'dem-terrarium')) {
          map.addSource('dem-terrarium', { type: 'raster-dem', encoding: 'terrarium', tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 14, attribution: '© Mapzen / AWS Terrain Tiles' })
        }
        if (!safeLayer(map, 'hillshade')) {
          const beforeId = safeLayer(map, 'jeru-fill') ? 'jeru-fill' : undefined
          map.addLayer({ id: 'hillshade', type: 'hillshade', source: 'dem-terrarium', layout: { visibility: showTerrainRef.current ? 'visible' : 'none' }, paint: { 'hillshade-exaggeration': 0.55, 'hillshade-shadow-color': '#0d1a2a', 'hillshade-highlight-color': '#fff2d8', 'hillshade-accent-color': '#5a4a3a' } }, beforeId)
        }
        if (eng === 'mapbox' && showTerrainRef.current) { try { map.setTerrain({ source: 'dem', exaggeration: 1.2 }) } catch (_) {} }
      } catch (_) {}
    }
    buildHillshade()
    try { map.on('styledata', buildHillshade) } catch (_) {}

    // 圣殿精细结构（默认隐藏，进入圣殿模式时显示）
    try {
      map.addSource('temple', { type: 'geojson', data: TEMPLE_GEOJSON })
      map.addLayer({
        id: 'temple-fill', type: 'fill-extrusion', source: 'temple',
        layout: { visibility: 'none' },
        paint: {
          'fill-extrusion-color': ['get', 'color'],
          'fill-extrusion-base': ['get', 'base'],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-opacity': 0.95,
        },
      })
      map.on('click', 'temple-fill', (e) => {
        const f = e.features && e.features[0]
        const P = partsFor(templeVariantRef.current)
        if (f && f.properties && P[f.properties.id]) {
          setSelectedPart({ id: f.properties.id, ...P[f.properties.id] })
        }
      })
      map.on('mouseenter', 'temple-fill', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'temple-fill', () => { map.getCanvas().style.cursor = '' })
    } catch (_) {}

    addMarkers(gl, map, era.id)
    setStatus('ready')
    riseTween()
  }

  // —— 关键地点 + 建筑名 DOM 标注（避免字形依赖，两引擎通用）——
  function addMarkers(gl, map, eraId) {
    clearMarkers()
    // 地点
    locationsFor(eraId).features.forEach(f => {
      const p = f.properties
      const el = document.createElement('div')
      el.className = 'jeru-marker'
      el.innerHTML = `<span class="jeru-pin"></span><span class="jeru-mlabel">${p.name_zh}</span>`
      el.onclick = (ev) => { ev.stopPropagation(); setSelectedLoc(JERU_LOCATIONS.find(l => l.id === p.id)) }
      const mk = new gl.Marker({ element: el, anchor: 'bottom' }).setLngLat(f.geometry.coordinates).addTo(map)
      markersRef.current.push(mk)
    })
    // 圣殿/建筑名（圣所类）
    eraGeoJSON(eraId).polygons.features.filter(f => f.properties.sacred || f.properties.kind === 'temple' || f.properties.kind === 'fortress').forEach(f => {
      const ring = f.geometry.coordinates[0].slice(0, -1)
      const c = ring.reduce((a, p) => [a[0] + p[0], a[1] + p[1]], [0, 0]).map(v => v / ring.length)
      const el = document.createElement('div'); el.className = 'jeru-structlabel'; el.textContent = f.properties.name
      const mk = new gl.Marker({ element: el, anchor: 'center' }).setLngLat(c).addTo(map)
      markersRef.current.push(mk)
    })
  }

  // —— 3D 平地起高楼：高度从 0 增长到目标 ——
  function riseTween() {
    const map = mapRef.current; if (!map || !safeLayer(map, 'jeru-fill')) return
    const start = performance.now(); const dur = 900
    const heightExpr = ['coalesce', ['get', 'height'], 0]
    const step = (t) => {
      const k = Math.min(1, (t - start) / dur)
      const e = 1 - Math.pow(1 - k, 3) // easeOutCubic
      try { map.setPaintProperty('jeru-fill', 'fill-extrusion-height', ['*', heightExpr, e]) } catch (_) {}
      if (k < 1 && mapRef.current) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  // —— 切换时期 ——
  useEffect(() => {
    const map = mapRef.current; const gl = glRef.current
    if (!map || status !== 'ready' || !map.getSource) return
    if (!safeSource(map, 'jeru-poly')) return
    // 切换时期时自动退出圣殿模式，恢复城市图层
    if (templeModeRef.current) {
      templeModeRef.current = false; setTempleMode(false); setSelectedPart(null)
      try {
        map.setLayoutProperty('temple-fill', 'visibility', 'none')
        map.setLayoutProperty('jeru-fill', 'visibility', 'visible')
        map.setLayoutProperty('jeru-wall-line', 'visibility', 'visible')
      } catch (_) {}
      clearTempleMarkers()
      map.easeTo({ zoom: 15.4, pitch: 60, bearing: -22, duration: 900 })
    }
    const g = eraGeoJSON(era.id)
    try {
      try { map.getSource('jeru-poly').setData(g.polygons) } catch (_) { return }
      try { map.getSource('jeru-wall').setData(g.walls) } catch (_) { return }
    } catch (_) {}
    addMarkers(gl, map, era.id)
    setSelectedLoc(null)
    riseTween()
    map.easeTo({ center: TEMPLE_CENTER, duration: 800 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eraIdx, status])

  // —— OSM 底图开关（仅 MapLibre）——
  useEffect(() => {
    const map = mapRef.current
    if (!map || engine !== 'maplibre' || !safeLayer(map, 'osm')) return
    try { map.setLayoutProperty('osm', 'visibility', showOsm ? 'visible' : 'none') } catch (_) {}
  }, [showOsm, engine, status])

  function resetView() {
    const map = mapRef.current; if (!map) return
    map.easeTo({ center: TEMPLE_CENTER, zoom: 15.4, pitch: 60, bearing: -22, duration: 900 })
  }

  // —— 地形（hillshade + Mapbox 真三维）开关 ——
  useEffect(() => {
    const map = mapRef.current
    if (!map || status !== 'ready') return
    showTerrainRef.current = showTerrain
    if (safeLayer(map, 'hillshade')) { try { map.setLayoutProperty('hillshade', 'visibility', showTerrain ? 'visible' : 'none') } catch (_) {} }
    if (engine === 'mapbox') { try { map.setTerrain(showTerrain ? { source: 'dem', exaggeration: 1.2 } : null) } catch (_) {} }
  }, [showTerrain, engine, status])

  // —— glTF 精模图层开关（有 VITE_TEMPLE_GLTF_URL 则加载 glTF，否则程序化占位）——
  function toggleModel() {
    const map = mapRef.current, gl = glRef.current
    if (!map || !gl) return
    if (modelOn) {
      try { if (safeLayer(map, 'jeru-3dmodel')) map.removeLayer('jeru-3dmodel') } catch (_) {}
      modelLayerRef.current = null; setModelOn(false); setModelStatus('')
      return
    }
    try {
      const layer = createModelLayer({ glLib: gl, origin: TEMPLE_CENTER, altitude: 6, modelScale: 1, url: MODEL_URL, onStatus: (st, msg) => setModelStatus(msg || st) })
      map.addLayer(layer)
      modelLayerRef.current = layer; setModelOn(true)
      map.flyTo({ center: TEMPLE_CENTER, zoom: 16.6, pitch: 66, bearing: -22, duration: 1400, essential: true })
    } catch (e) { setModelStatus((e && e.message) || '模型图层创建失败') }
  }

  // —— 圣殿3D结构模式 ——
  function clearTempleMarkers() {
    templeMarkersRef.current.forEach(m => { try { m.remove() } catch (_) {} })
    templeMarkersRef.current = []
  }
  function addTempleLabels(gl, map, variant) {
    labelsFor(variant).forEach(l => {
      const el = document.createElement('div'); el.className = 'jeru-structlabel'; el.textContent = l.name
      el.style.pointerEvents = 'auto'; el.style.cursor = 'pointer'
      el.onclick = (ev) => { ev.stopPropagation(); const P = partsFor(templeVariantRef.current); if (P[l.id]) setSelectedPart({ id: l.id, ...P[l.id] }) }
      const mk = new gl.Marker({ element: el, anchor: 'center' }).setLngLat(l.coord).addTo(map)
      templeMarkersRef.current.push(mk)
    })
  }
  function enterTemple() {
    const map = mapRef.current, gl = glRef.current
    if (!map || !safeLayer(map, 'temple-fill')) return
    passionRunRef.current = false; setPassionActive(false)
    const variant = variantForEra(era.id)
    templeVariantRef.current = variant; setTempleVariant(variant)
    templeModeRef.current = true; setTempleMode(true); setSelectedLoc(null)
    try { map.getSource('temple').setData(dataFor(variant)) } catch (_) {}
    try {
      map.setLayoutProperty('jeru-fill', 'visibility', 'none')
      map.setLayoutProperty('jeru-wall-line', 'visibility', 'none')
      map.setLayoutProperty('temple-fill', 'visibility', 'visible')
      map.setFilter('temple-fill', cutaway ? ['!=', ['get', 'cut'], 1] : null)
    } catch (_) {}
    clearMarkers()
    clearTempleMarkers()
    addTempleLabels(gl, map, variant)
    const cam = cameraFor(variant)
    map.flyTo({ center: cam.center, zoom: cam.zoom, pitch: cam.pitch, bearing: cam.bearing, duration: 2200, essential: true })
  }
  function switchTempleVariant(v) {
    const map = mapRef.current, gl = glRef.current
    if (!map || !templeModeRef.current || !safeLayer(map, 'temple-fill')) return
    templeVariantRef.current = v; setTempleVariant(v); setSelectedPart(null)
    try { map.getSource('temple').setData(dataFor(v)) } catch (_) {}
    try { map.setFilter('temple-fill', cutaway ? ['!=', ['get', 'cut'], 1] : null) } catch (_) {}
    clearTempleMarkers(); addTempleLabels(gl, map, v)
    const cam = cameraFor(v)
    map.flyTo({ center: cam.center, zoom: cam.zoom, pitch: cam.pitch, bearing: cam.bearing, duration: 1400, essential: true })
  }
  function exitTemple() {
    const map = mapRef.current, gl = glRef.current
    templeModeRef.current = false; setTempleMode(false); setSelectedPart(null)
    if (!map) return
    try {
      map.setLayoutProperty('temple-fill', 'visibility', 'none')
      map.setLayoutProperty('jeru-fill', 'visibility', 'visible')
      map.setLayoutProperty('jeru-wall-line', 'visibility', 'visible')
    } catch (_) {}
    clearTempleMarkers()
    if (gl) addMarkers(gl, map, era.id)
    resetView()
  }
  // 剖视开关
  useEffect(() => {
    const map = mapRef.current
    if (!map || !templeMode || !safeLayer(map, 'temple-fill')) return
    try { map.setFilter('temple-fill', cutaway ? ['!=', ['get', 'cut'], 1] : null) } catch (_) {}
  }, [cutaway, templeMode])

  // —— 受难周 FPV 巡游 ——
  async function playPassion() {
    const map = mapRef.current, gl = glRef.current
    if (!map || passionRunRef.current) return
    // 受难周属希律时期，先切过去
    const herodIdx = JERU_ERAS.findIndex(e => e.id === 'herod')
    if (eraIdxRef.current !== herodIdx) { setEraIdx(herodIdx); await sleep(900) }
    passionRunRef.current = true; setPassionActive(true)
    if (!passionMarkerRef.current) {
      const el = document.createElement('div'); el.className = 'jeru-pilgrim'; el.textContent = '🚶'
      passionMarkerRef.current = new gl.Marker({ element: el, anchor: 'bottom' })
    }
    passionMarkerRef.current.setLngLat(PASSION_WEEK[0].coord).addTo(map)
    for (let i = 0; i < PASSION_WEEK.length; i++) {
      if (!passionRunRef.current) break
      const stop = PASSION_WEEK[i]
      const next = PASSION_WEEK[Math.min(i + 1, PASSION_WEEK.length - 1)]
      const br = i < PASSION_WEEK.length - 1 ? bearing(stop.coord, next.coord) : map.getBearing()
      setPassionStop(i)
      passionMarkerRef.current.setLngLat(stop.coord)
      map.easeTo({ center: stop.coord, zoom: 17, pitch: 72, bearing: br, duration: 2600, essential: true })
      await sleep(3100)
    }
    passionRunRef.current = false; setPassionActive(false)
  }
  function stopPassion() {
    passionRunRef.current = false; setPassionActive(false); setPassionStop(-1)
    if (passionMarkerRef.current) { try { passionMarkerRef.current.remove() } catch (_) {} }
    // 中断已发出的 easeTo 飞行，避免退出巡游后镜头仍"幽灵漂移"
    try { mapRef.current && mapRef.current.stop() } catch (_) {}
    resetView()
  }
  function jumpStop(i) {
    const map = mapRef.current, gl = glRef.current; if (!map) return
    const stop = PASSION_WEEK[i]
    if (!passionMarkerRef.current) {
      const el = document.createElement('div'); el.className = 'jeru-pilgrim'; el.textContent = '🚶'
      passionMarkerRef.current = new gl.Marker({ element: el, anchor: 'bottom' })
    }
    passionMarkerRef.current.setLngLat(stop.coord).addTo(map)
    setPassionStop(i)
    map.easeTo({ center: stop.coord, zoom: 17, pitch: 72, duration: 1600 })
  }

  // —— FPV 手动翻站（暂停自动巡游，保留叙事浮层）——
  function gotoStopManual(i) {
    if (i < 0 || i >= PASSION_WEEK.length) return
    passionRunRef.current = false
    if (!passionActive) setPassionActive(true)
    jumpStop(i)
  }
  // 受难周巡游时支持 ← → 翻站、Esc 退出
  useEffect(() => {
    if (!passionActive) return
    const onKey = (e) => {
      if (e.key === 'ArrowRight') gotoStopManual((passionStop < 0 ? 0 : passionStop) + 1)
      else if (e.key === 'ArrowLeft') gotoStopManual((passionStop < 0 ? 0 : passionStop) - 1)
      else if (e.key === 'Escape') stopPassion()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passionActive, passionStop])

  return (
    <div className="jeru">
      <div className="biblemap-head">
        <BackButton onClick={onBack} />
        <div className="biblemap-title">
          <h2>{t("🏛 耶路撒冷数字孪生沙盘")}</h2>
          <p>{t("圣城变迁与圣殿结构 · 时间轴剥离 · 受难周 FPV 步行 ·")} {engine === 'mapbox' ? 'Mapbox GL v3' : t("MapLibre GL v1（免 token）")}</p>
        </div>
      </div>

      {/* 时间轴：六个时期 */}
      <div className="jeru-timeline">
        {JERU_ERAS.map((e, i) => (
          <button key={e.id} className={`jeru-era ${i === eraIdx ? 'on' : ''}`} onClick={() => setEraIdx(i)}>
            <span className="y">{e.year < 0 ? (getRuntimeLang() === 'en' ? `${Math.abs(e.year)} BC` : `前${Math.abs(e.year)}`) : e.year}</span>
            <span className="l"><AutoText>{e.label}</AutoText></span>
          </button>
        ))}
      </div>

      <div className="jeru-stage">
        <div ref={containerRef} className="jeru-map" />
        {/* 受难周光影叙事：各各他遍地黑暗 → 复活黎明 */}
        <div className={`jeru-darkness${passionActive && passionStop === 6 ? ' night' : ''}${passionActive && passionStop === 7 ? ' dawn' : ''}`} />

        {/* 受难周 FPV 叙事浮层（自动巡游时自述站点 + 翻站） */}
        {passionActive && passionStop >= 0 && (
          <div className="jeru-fpv-cap">
            <div className="bar"><i style={{ width: `${((passionStop + 1) / PASSION_WEEK.length) * 100}%` }} /></div>
            <div className="d"><AutoText>{PASSION_WEEK[passionStop].day}</AutoText> · STEP {passionStop + 1}/{PASSION_WEEK.length}</div>
            <h4><AutoText>{PASSION_WEEK[passionStop].title}</AutoText> <span className="ref">{PASSION_WEEK[passionStop].ref}</span></h4>
            <p><AutoText>{PASSION_WEEK[passionStop].summary}</AutoText></p>
            <div className="nav">
              <button onClick={() => gotoStopManual(passionStop - 1)} disabled={passionStop <= 0}>‹ {t("上一站")}</button>
              <button onClick={() => gotoStopManual(passionStop + 1)} disabled={passionStop >= PASSION_WEEK.length - 1}>{t("下一站")} ›</button>
              <button className="stop" onClick={stopPassion}>✕ {t("退出")}</button>
            </div>
          </div>
        )}
        {status !== 'ready' && (
          <div className="jeru-overlay">
            {status === 'loading' && <div className="jeru-loading">{t("🌍 正在加载")}{engine === 'mapbox' ? ' Mapbox' : ' MapLibre'} {t("三维沙盘…")}</div>}
            {status === 'error' && (
              <div className="jeru-err">
                <p>⚠ {errMsg}</p>
                <p className="dim">{t("该功能需要联网加载地图库与瓦片。若 Mapbox 配额/令牌不可用，会自动回退到免费的 MapLibre。")}</p>
              </div>
            )}
          </div>
        )}

        {/* 控制条 */}
        <div className="jeru-controls">
          <button onClick={resetView} title={t("复位到圣殿山视角")}>{t("🎯 复位视角")}</button>
          {!passionActive
            ? <button className="primary" onClick={playPassion}>{t("✝ 受难周 FPV 巡游")}</button>
            : <button className="primary" onClick={stopPassion}>{t("⏹ 停止巡游")}</button>}
          {status === 'ready' && (
            <button className={showTerrain ? 'on' : ''} onClick={() => setShowTerrain(s => !s)} title={t("真实高程山体阴影")}>{t("⛰ 地形")}</button>
          )}
          {status === 'ready' && (
            <button className={modelOn ? 'on' : ''} onClick={toggleModel} title={t("叠加 3D 精模（glTF 或占位）")}>{t("🏛 精模")}</button>
          )}
          {engine === 'maplibre' && (
            <button className={showOsm ? 'on' : ''} onClick={() => setShowOsm(s => !s)}>{t("🗺 现代底图")}</button>
          )}
          {status === 'ready' && (!templeMode
            ? <button className="primary" onClick={enterTemple}>{t("🏛 圣殿3D结构")}</button>
            : <>
                {TEMPLE_VARIANT_ORDER.filter(v => v !== templeVariant).map(v => (
                  <button key={v} onClick={() => switchTempleVariant(v)}>{TEMPLE_VARIANTS[v].icon} <AutoText>{TEMPLE_VARIANTS[v].name}</AutoText></button>
                ))}
                <button className={cutaway ? 'on' : ''} onClick={() => setCutaway(c => !c)}>{t("✂ 剖视")}{cutaway ? t("·开") : t("·关")}</button>
                <button onClick={exitTemple}>{t("🚪 离开圣殿")}</button>
              </>)}
        </div>
      </div>

      {/* 时期说明 */}
      <div className="jeru-erainfo" style={{ borderColor: '#e8b04b55' }}>
        <div className="jeru-erainfo-h">
          <strong><AutoText>{era.label}</AutoText></strong>
          <span className="en">{era.en}</span>
          <span className="ref">{era.ref}</span>
        </div>
        <p><AutoText>{era.desc}</AutoText></p>
      </div>

      {/* 受难周分站 */}
      <div className="jeru-passion">
        <div className="jeru-passion-h">{t("✝ 受难周步行轨迹（希律时期 · 点击任一站定位）")}</div>
        <div className="jeru-stops">
          {PASSION_WEEK.map((s, i) => (
            <button key={i} className={`jeru-stop ${passionStop === i ? 'on' : ''}`} onClick={() => jumpStop(i)}>
              <span className="d"><AutoText>{s.day}</AutoText></span><span className="t"><AutoText>{s.title}</AutoText></span>
            </button>
          ))}
        </div>
        {passionStop >= 0 && (
          <div className="jeru-stopdetail">
            <div className="h"><strong><AutoText>{PASSION_WEEK[passionStop].title}</AutoText></strong><span className="ref">{PASSION_WEEK[passionStop].ref}</span></div>
            <p><AutoText>{PASSION_WEEK[passionStop].summary}</AutoText></p>
          </div>
        )}
      </div>

      {/* 圣殿模式提示 */}
      {templeMode && (
        <div className="jeru-temple-hint">
          {era.id === 'modern' && <>{t("⚠ 此为公元70年被毁前的希律圣殿复原——今日圣殿山仅存西墙（哭墙）等台基残迹（可13:2 应验）。")}<br /></>}
          {templeVariant === 'herod' && t("🏛 希律第二圣殿（约2:20；可13:1-2，按传统尺寸示意复原）· 由外而内：外邦人院→隔墙Soreg→妇女院→以色列人院→祭司院与大祭坛→圣所→至圣所，南接皇家柱廊 · 点件看经文 · ✂ 剖视揭顶察看圣所与至圣所")}
          {templeVariant === 'solomon' && t("⛪ 所罗门第一圣殿（王上6–7，按肘比例示意复原）· 点击任一部件看经文与尺寸 · ✂ 剖视揭开殿顶察看圣所与至圣所")}
          {templeVariant === 'tabernacle' && t("⛺ 会幕（出25–27，按肘比例示意复原）· 由外而内：院门→铜祭坛→洗濯盆→圣所→至圣所，一条亲近神的路 · 点件看经文 · ✂ 剖视揭开罩棚与南帷察看内部")}
          {templeVariant === 'zerubbabel' && t("🧱 所罗巴伯第二圣殿（拉3–6；该2，示意复原）· 归回余民先筑坛后建殿：朴素无华、至圣所空无约柜——「这殿后来的荣耀必大过先前」· 点件看经文 · ✂ 剖视揭顶察看")}
        </div>
      )}

      {/* 圣殿部件详情 */}
      {selectedPart && (
        <div className="jeru-locdetail" style={{ borderColor: 'rgba(232,176,75,0.55)' }}>
          <button className="x" onClick={() => setSelectedPart(null)}>×</button>
          <div className="h"><strong><AutoText>{selectedPart.name}</AutoText></strong><span className="ref">{selectedPart.ref}</span></div>
          {selectedPart.dims && <p className="jeru-part-dims">📐 <AutoText>{selectedPart.dims}</AutoText></p>}
          <p><AutoText>{selectedPart.desc}</AutoText></p>
        </div>
      )}

      {/* 地点详情 */}
      {selectedLoc && (
        <div className="jeru-locdetail">
          <button className="x" onClick={() => setSelectedLoc(null)}>×</button>
          <div className="h"><strong>{getRuntimeLang() === 'en' && selectedLoc.name_en ? selectedLoc.name_en : selectedLoc.name_zh}</strong><span className="en">{selectedLoc.name_en}</span><span className="ref">{selectedLoc.ref}</span></div>
          <p><AutoText>{selectedLoc.note}</AutoText></p>
        </div>
      )}

      {modelOn && (
        <div className="jeru-foot" style={{ marginTop: 6 }}>
          🏛 {t("精模")}：{modelStatus ? <AutoText>{modelStatus}</AutoText> : null}
          {!MODEL_URL && t("（未配置 VITE_TEMPLE_GLTF_URL，当前为程序化占位圣殿；设环境变量指向 glTF 即可替换为精模）")}
        </div>
      )}
      <div className="jeru-foot">
        {t("城墙与建筑轮廓为示意性复原（schematic），用于教学呈现各时期相对范围与圣殿\"平地起高楼\"，非精确考古测绘。")}
        {engine === 'maplibre' && !TOKEN && t(" · 当前为免费 MapLibre 模式；配置 VITE_MAPBOX_TOKEN 可启用 Mapbox 卫星底图。")}
      </div>
    </div>
  )
}
