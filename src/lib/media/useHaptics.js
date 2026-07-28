// useHaptics — navigator.vibrate 的统一封装。
//
// 护栏：默认可用，但危机场景走独立的 crisisHaptics 开关（默认关闭），
// 因为部分 PTSD 用户会被突然的振动触发。所有调用都可静默失败。
import { useCallback } from 'react'
import { getMediaPref } from './mediaPrefs'

export function hapticsSupported() {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

export const HAPTIC_PATTERNS = Object.freeze({
  tap: [12],
  ack: [18],
  confirm: [16, 60, 16],
  stepDone: [10, 40, 10],
  inhale: [24],
  exhale: [40],
  hold: [8],
  alert: [30, 80, 30, 80, 30],
  heartbeat: [22, 120, 22],
})

export function useHaptics({ scope = 'default' } = {}) {
  const allowed = useCallback(() => {
    if (!hapticsSupported()) return false
    return scope === 'crisis' ? getMediaPref('crisisHaptics') : getMediaPref('haptics')
  }, [scope])

  const vibrate = useCallback((pattern = 'tap') => {
    if (!allowed()) return false
    const p = typeof pattern === 'string' ? HAPTIC_PATTERNS[pattern] : pattern
    if (!p) return false
    try { return navigator.vibrate(p) } catch { return false }
  }, [allowed])

  const cancel = useCallback(() => {
    if (!hapticsSupported()) return
    try { navigator.vibrate(0) } catch { /* ignore */ }
  }, [])

  return { vibrate, cancel, supported: hapticsSupported(), allowed: allowed() }
}

export default useHaptics
