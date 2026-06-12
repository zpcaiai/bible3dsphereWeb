// 持久化、按"内容"寻址的翻译缓存。
//
// 关键设计：缓存键 = `${target}:${hash(源文本)}`。
// 只要内容发生任何变化，源文本就变 → 键就变 → 必然未命中 → 重新机翻，
// 因此永远不会返回过期译文（内容一变即自动失效，自然响应最新内容）。
//
// 存于 localStorage，跨刷新/重开生效；带版本号与容量上限（按最近使用淘汰）。

const LS_KEY = 'bs_tcache_v1'   // 改结构时升版本即可整体失效旧缓存
const MAX_ENTRIES = 2000

function djb2(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = (((h << 5) + h) ^ str.charCodeAt(i))
  return (h >>> 0).toString(36)
}

function keyFor(text, target) {
  return `${target}:${djb2(text)}`
}

let _mem = null
function _load() {
  if (_mem) return _mem
  _mem = {}
  try {
    const raw = (typeof localStorage !== 'undefined') && localStorage.getItem(LS_KEY)
    if (raw) {
      const o = JSON.parse(raw)
      if (o && typeof o === 'object') _mem = o
    }
  } catch { _mem = {} }
  return _mem
}

let _saveTimer = null
function _scheduleSave() {
  if (_saveTimer) return
  _saveTimer = setTimeout(() => {
    _saveTimer = null
    try {
      const m = _load()
      const keys = Object.keys(m)
      if (keys.length > MAX_ENTRIES) {
        keys.sort((a, b) => (m[a].t || 0) - (m[b].t || 0)) // 旧的先淘汰
        for (const k of keys.slice(0, keys.length - MAX_ENTRIES)) delete m[k]
      }
      if (typeof localStorage !== 'undefined') localStorage.setItem(LS_KEY, JSON.stringify(m))
    } catch { /* 配额满 / SSR：忽略，内存缓存仍有效 */ }
  }, 400)
}

export function getCached(text, target = 'en') {
  const t = (text || '').trim()
  if (!t) return undefined
  const e = _load()[keyFor(t, target)]
  if (e) { e.t = Date.now() }   // 触碰 → 近期使用，延后淘汰
  return e ? e.v : undefined
}

export function setCached(text, target, translated) {
  const t = (text || '').trim()
  if (!t || !translated || translated === t) return  // 不缓存空/失败/原样回退
  _load()[keyFor(t, target)] = { v: translated, t: Date.now() }
  _scheduleSave()
}

export function getManyCached(texts, target = 'en') {
  const m = _load()
  const hits = {}
  const misses = []
  for (const raw of texts) {
    const t = (raw || '').trim()
    if (!t) continue
    const e = m[keyFor(t, target)]
    if (e) { e.t = Date.now(); hits[t] = e.v }
    else if (!misses.includes(t)) misses.push(t)
  }
  return { hits, misses }
}

export function setManyCached(map, target = 'en') {
  const m = _load()
  const now = Date.now()
  for (const [text, translated] of Object.entries(map)) {
    const t = (text || '').trim()
    if (!t || !translated || translated === t) continue
    m[keyFor(t, target)] = { v: translated, t: now }
  }
  _scheduleSave()
}
