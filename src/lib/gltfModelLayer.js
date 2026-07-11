// gltfModelLayer.js — 在 Mapbox GL v3 / MapLibre GL v1 上叠加 three.js 3D 模型的自定义图层。
// 有 url 则加载 glTF；否则用程序化「金色圣殿」占位模型，开箱即见、之后替换 url 即可。
// 标准 MercatorCoordinate + 矩阵变换方案，两引擎通用（custom layer 的 render(gl, matrix)）。
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// 程序化占位：第二圣殿示意（廊子 + 圣所 + 镀金顶 + 雅斤/波阿斯），单位米，Y 向上。
function buildPlaceholder() {
  const g = new THREE.Group()
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.7, metalness: o.m ?? 0.1, ...o })
  const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y + h / 2, z); return b }
  const white = M(0xf0e6c8), gold = M(0xe8c050, { m: 0.85, r: 0.25 }), stone = M(0xcfc5b0)
  g.add(box(8, 4, 30, stone, 0, 0, 0))          // 台基
  g.add(box(6, 50, 18, white, -2, 4, 0))         // 廊子 façade（高）
  g.add(box(18, 45, 14, white, -16, 4, 0))       // 圣所主体
  g.add(box(20, 3, 16, gold, -16, 49, 0))        // 镀金顶
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) g.add(box(0.8, 2, 0.8, gold, -16 + i * 6, 52, j * 5)) // 防鸟金尖
  const col = (z) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 20, 10), gold); c.position.set(2.5, 10, z); g.add(c) }
  col(-5); col(5)                                 // 雅斤/波阿斯
  g.add(box(8, 4, 8, M(0xa8642a), 14, 0, 0))     // 祭坛
  return g
}

// origin=[lng,lat]；altitude 米；modelScale 缩放；rotate=[x,y,z] 弧度；onStatus(state,msg)
export function createModelLayer({ glLib, id = 'jeru-3dmodel', origin, altitude = 0, modelScale = 1, rotate = [Math.PI / 2, 0, 0], url = '', onStatus }) {
  const merc = glLib.MercatorCoordinate.fromLngLat(origin, altitude)
  const t = {
    tx: merc.x, ty: merc.y, tz: merc.z,
    rx: rotate[0], ry: rotate[1], rz: rotate[2],
    scale: merc.meterInMercatorCoordinateUnits() * modelScale,
  }
  return {
    id, type: 'custom', renderingMode: '3d',
    onAdd(map, gl) {
      this.map = map
      this.camera = new THREE.Camera()
      this.scene = new THREE.Scene()
      this.scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.0))
      const sun = new THREE.DirectionalLight(0xfff0d0, 1.4); sun.position.set(60, 120, 40); this.scene.add(sun)
      this.scene.add(new THREE.AmbientLight(0x404858, 0.6))
      try { onStatus && onStatus('loading') } catch (_) {}
      if (url) {
        new GLTFLoader().load(url,
          (gltf) => { this.scene.add(gltf.scene); try { onStatus && onStatus('ready') } catch (_) {} try { map.triggerRepaint() } catch (_) {} },
          undefined,
          (err) => { this.scene.add(buildPlaceholder()); try { onStatus && onStatus('error', (err && err.message) || 'glTF 加载失败，已用占位模型') } catch (_) {} try { map.triggerRepaint() } catch (_) {} }
        )
      } else {
        this.scene.add(buildPlaceholder()); try { onStatus && onStatus('placeholder') } catch (_) {}
      }
      this.renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl, antialias: true })
      this.renderer.autoClear = false
    },
    render(gl, matrix) {
      const rx = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), t.rx)
      const ry = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 1, 0), t.ry)
      const rz = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(0, 0, 1), t.rz)
      const m = new THREE.Matrix4().fromArray(matrix)
      const l = new THREE.Matrix4()
        .makeTranslation(t.tx, t.ty, t.tz)
        .scale(new THREE.Vector3(t.scale, -t.scale, t.scale))
        .multiply(rx).multiply(ry).multiply(rz)
      this.camera.projectionMatrix = m.multiply(l)
      this.renderer.resetState()
      this.renderer.render(this.scene, this.camera)
    },
    onRemove() {
      try {
        this.scene && this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach(mt => { for (const value of Object.values(mt)) { if (value?.isTexture) value.dispose() } mt.dispose?.() }) } })
      } catch (_) {}
      // 不 dispose renderer（与地图共享 GL 上下文）
    },
  }
}
