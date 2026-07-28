// mediaPrefs.js — 全站多模态输出的用户偏好（声音 / 触觉 / 环境音 / 自动播放）。
//
// 设计原则（见 docs/MULTIMODAL_OPPORTUNITY_AUDIT_2026-07.md 第 7 节护栏）：
//   1. 任何「非用户直接触发」的声音都必须先经过 autoplay 开关；
//   2. 危机关怀场景另设 crisisAudio 独立开关，默认关闭，必须显式点「开启声音」；
//   3. 触觉可独立关闭（PTSD 用户可能被振动触发）；
//   4. 一切偏好持久化，跨页面一致。

const KEY = 'media-prefs-v1'

export const MEDIA_PREF_DEFAULTS = Object.freeze({
  sound: true,        // 允许用户主动触发的音效 / 节律音
  autoplay: false,    // 允许进入页面后自动开始播报
  haptics: true,      // 允许振动
  ambience: false,    // 允许环境音底噪
  crisisAudio: false, // 危机关怀模块的声音（独立、默认关闭）
  crisisHaptics: false, // 危机关怀模块的振动（独立、默认关闭）
})

let _prefs = { ...MEDIA_PREF_DEFAULTS }
const _listeners = new Set()

function _load() {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return
    const saved = JSON.parse(raw)
    if (saved && typeof saved === 'object') {
      Object.keys(MEDIA_PREF_DEFAULTS).forEach((k) => {
        if (typeof saved[k] === 'boolean') _prefs[k] = saved[k]
      })
    }
  } catch { /* 损坏的存储不应阻断渲染 */ }
}
_load()

function _persist() {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(KEY, JSON.stringify(_prefs)) } catch { /* 隐私模式下静默 */ }
}

export function getMediaPrefs() {
  return { ..._prefs }
}

export function getMediaPref(key) {
  return _prefs[key] ?? MEDIA_PREF_DEFAULTS[key] ?? false
}

export function setMediaPref(key, value) {
  if (!(key in MEDIA_PREF_DEFAULTS)) return
  const next = !!value
  if (_prefs[key] === next) return
  _prefs[key] = next
  _persist()
  _listeners.forEach((fn) => { try { fn(getMediaPrefs()) } catch { /* 单个订阅者出错不影响其他 */ } })
}

export function toggleMediaPref(key) {
  setMediaPref(key, !getMediaPref(key))
}

export function subscribeMediaPrefs(fn) {
  _listeners.add(fn)
  return () => _listeners.delete(fn)
}

/** 重置为默认（用于「关闭全部声音与振动」的一键护栏）。 */
export function resetMediaPrefs() {
  _prefs = { ...MEDIA_PREF_DEFAULTS }
  _persist()
  _listeners.forEach((fn) => { try { fn(getMediaPrefs()) } catch { /* ignore */ } })
}

/** 一键静音：关闭所有会发声/震动的开关。危机页面的「全部关掉」按钮用它。 */
export function muteAllMedia() {
  _prefs = { ..._prefs, sound: false, autoplay: false, ambience: false, crisisAudio: false, haptics: false, crisisHaptics: false }
  _persist()
  _listeners.forEach((fn) => { try { fn(getMediaPrefs()) } catch { /* ignore */ } })
}
