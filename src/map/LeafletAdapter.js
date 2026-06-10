// Leaflet 实现的地图适配器。Leaflet 从 CDN 运行时按需加载（不进 npm 依赖，PWA 体积零增加）。
// 对外坐标统一 [lng, lat]；内部转换为 Leaflet 的 [lat, lng]。
import MapAdapter from './MapAdapter'

const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'

let _loading = null
function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L)
  if (_loading) return _loading
  _loading = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'; link.href = LEAFLET_CSS
      document.head.appendChild(link)
    }
    const script = document.createElement('script')
    script.src = LEAFLET_JS
    script.async = true
    script.onload = () => resolve(window.L)
    script.onerror = () => reject(new Error('Leaflet 加载失败（可能离线）'))
    document.head.appendChild(script)
  })
  return _loading
}

const lonlat = ([lng, lat]) => [lat, lng] // GeoJSON -> Leaflet

export default class LeafletAdapter extends MapAdapter {
  constructor() { super(); this.map = null; this.L = null; this.layers = [] }

  get ready() { return !!this.map }

  async init(container, options = {}) {
    const L = await loadLeaflet()
    this.L = L
    const center = options.center ? lonlat(options.center) : [29.5, 34]
    this.map = L.map(container, {
      center,
      zoom: options.zoom ?? 6,
      zoomControl: true,
      attributionControl: true,
      scrollWheelZoom: options.scrollWheelZoom ?? true,
    })
    // 底图图层：标准 OSM + 复古怀旧风（CSS 滤镜在 .biblemap-map 上叠加）
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, attribution: '&copy; OpenStreetMap',
    })
    // 国内 OSM 瓦片常被阻断（地图变灰板）：连续瓦片错误时自动切换高德底图（免 key）
    let tileErrs = 0
    osm.on('tileerror', () => {
      tileErrs += 1
      if (tileErrs >= 4 && !this._fellBackToAmap) {
        this._fellBackToAmap = true
        try { this.map.removeLayer(osm) } catch (e) {}
        L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
          maxZoom: 18, subdomains: ['1', '2', '3', '4'], attribution: '&copy; \u9ad8\u5fb7\u5730\u56fe',
        }).addTo(this.map)
      }
    })
    const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17, attribution: '&copy; OpenTopoMap',
    })
    osm.addTo(this.map)
    L.control.layers(
      { '怀旧地图': osm, '地形图': topo },
      {},
      { position: 'topright', collapsed: true },
    ).addTo(this.map)
    // 容器在子tab切换后才可见，确保尺寸正确（多次触发以覆盖 visibility 过渡）
    setTimeout(() => { try { this.map && this.map.invalidateSize() } catch (e) {} }, 200)
    setTimeout(() => { try { this.map && this.map.invalidateSize() } catch (e) {} }, 800)
    return this
  }

  setView(lngLat, zoom, animate = true) {
    if (!this.map) return
    if (!Array.isArray(lngLat) || !Number.isFinite(+lngLat[0]) || !Number.isFinite(+lngLat[1])) return
    const target = lonlat(lngLat)
    const z = Number.isFinite(+zoom) ? +zoom : this.map.getZoom()
    // 子tab/动画切换后容器尺寸可能为0，先校正，否则 Leaflet 投影得 NaN
    try { this.map.invalidateSize() } catch (e) {}
    const size = this.map.getSize()
    const cur = this.map.getCenter()
    // 关键修复：Leaflet flyTo 在 ①容器尺寸为0 或 ②目标≈当前中心且缩放不变 时，
    // 内部 project/unproject 会除0得 (NaN,NaN)，且在 requestAnimationFrame 帧里持续抛错崩整页。
    // 这两种情况绝不能走 flyTo —— 输入坐标守卫拦不住（NaN 是 Leaflet 内部产生的）。改用无动画 setView。
    const samePlace = cur &&
      Math.abs(cur.lat - target[0]) < 1e-6 &&
      Math.abs(cur.lng - target[1]) < 1e-6 &&
      this.map.getZoom() === z
    if (!animate || !size || !size.x || !size.y || samePlace) {
      try { this.map.setView(target, z, { animate: false }) } catch (e) {}
      return
    }
    try {
      this.map.flyTo(target, z, { duration: 1.1 })
    } catch (e) {
      try { this.map.setView(target, z, { animate: false }) } catch (e2) {}
    }
  }

  fitBounds(bounds, options = {}) {
    if (!this.map) return
    if (!Array.isArray(bounds) || bounds.length < 2) return
    const [sw, ne] = bounds
    // 防 NaN/Infinity：空数据时 Math.min(...[])=Infinity → Leaflet flyTo(NaN) 抛错崩页
    const ok = (p) => Array.isArray(p) && Number.isFinite(+p[0]) && Number.isFinite(+p[1])
    if (!ok(sw) || !ok(ne)) return
    try { this.map.invalidateSize() } catch (e) {}
    // 无动画，避免 fitBounds 内部走 flyTo 动画在退化 bounds 上产生 NaN 崩页
    try {
      this.map.fitBounds([lonlat(sw), lonlat(ne)], { padding: [30, 30], animate: false, ...options })
    } catch (e) {}
  }

  addMarker(lngLat, options = {}) {
    if (!this.map) return null
    const L = this.L
    const { label, color = '#fbbf24', onClick, html, active } = options
    // 尺寸恒为 24、锚点固定（高亮用中心缩放 transform，不改宽高），避免激活态标记偏移
    const size = 24
    const icon = L.divIcon({
      className: 'biblemap-pin',
      html: `<div class="biblemap-pin-dot${active ? ' active' : ''}" style="--pin:${color};width:${size}px;height:${size}px${active ? ';transform:scale(1.25)' : ''}">${label ?? ''}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })
    const m = L.marker(lonlat(lngLat), { icon }).addTo(this.map)
    if (html) m.bindPopup(html, { className: 'biblemap-popup' })
    if (onClick) m.on('click', onClick)
    this.layers.push(m)
    return m
  }

  addRoute(coordinates, options = {}) {
    if (!this.map) return null
    const L = this.L
    const latlngs = coordinates.map(lonlat)
    const line = L.polyline(latlngs, {
      color: options.color ?? '#ffd700',
      weight: options.weight ?? 3,
      opacity: options.opacity ?? 0.8,
      dashArray: options.solid ? null : (options.dashArray ?? '6 8'),
    }).addTo(this.map)
    this.layers.push(line)
    return line
  }

  removeRoute(handle) {
    if (!this.map || !handle) return
    try { this.map.removeLayer(handle) } catch (e) {}
    this.layers = this.layers.filter((l) => l !== handle)
  }

  setMarkerActive(handle, active) {
    try {
      const el = handle && handle.getElement ? handle.getElement() : null
      const dot = el && el.querySelector ? el.querySelector('.biblemap-pin-dot') : null
      if (!dot) return
      dot.classList.toggle('active', !!active)
      // 中心缩放而非改宽高：divIcon 锚点固定在 12,12，改宽高会让激活态偏移
      dot.style.transform = active ? 'scale(1.25)' : ''
    } catch (e) {}
  }

  showPopup(lngLat, html) {
    if (!this.map) return
    this.L.popup({ className: 'biblemap-popup' }).setLatLng(lonlat(lngLat)).setContent(html).openOn(this.map)
  }

  renderGeoJson(geojson, options = {}) {
    if (!this.map) return null
    const layer = this.L.geoJSON(geojson, options).addTo(this.map)
    this.layers.push(layer)
    return layer
  }

  clear() {
    if (!this.map) return
    this.layers.forEach(l => this.map.removeLayer(l))
    this.layers = []
  }

  destroy() {
    if (this.map) { this.map.remove(); this.map = null }
  }
}
