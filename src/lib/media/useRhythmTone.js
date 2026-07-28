// useRhythmTone — 用振荡器合成的节律引导音（呼吸 / 计时 / 确认）。
//
// 不依赖任何音频文件：离线可用、零加载延迟、体积为 0。
// 所有发声都受 mediaPrefs 约束；scope='crisis' 时改用 crisisAudio 开关（默认关闭）。
import { useCallback, useEffect, useRef } from 'react'
import { getAudioContext, getMasterGain, resumeAudio, audioSupported } from './audioEngine'
import { getMediaPref } from './mediaPrefs'

const SOFT_ATTACK = 0.12
const SOFT_RELEASE = 0.35

export function useRhythmTone({ scope = 'default', volume = 0.09 } = {}) {
  const activeRef = useRef([])

  const allowed = useCallback(() => {
    if (!audioSupported()) return false
    return scope === 'crisis' ? getMediaPref('crisisAudio') : getMediaPref('sound')
  }, [scope])

  const stopAll = useCallback(() => {
    const ctx = getAudioContext()
    activeRef.current.forEach(({ osc, gain }) => {
      try {
        if (ctx) gain.gain.cancelScheduledValues(ctx.currentTime)
        if (ctx) gain.gain.setTargetAtTime(0, ctx.currentTime, 0.05)
        setTimeout(() => { try { osc.stop() } catch { /* 已停止 */ } }, 300)
      } catch { /* ignore */ }
    })
    activeRef.current = []
  }, [])

  useEffect(() => stopAll, [stopAll])

  /**
   * 播放一个柔和的音。
   * @param {number} freq       起始频率 (Hz)
   * @param {number} duration   持续秒数
   * @param {object} opts       { glideTo, type, gain, delay }
   */
  const tone = useCallback(async (freq, duration = 1, opts = {}) => {
    if (!allowed()) return null
    const ok = await resumeAudio()
    if (!ok) return null
    const ctx = getAudioContext()
    const master = getMasterGain()
    if (!ctx || !master) return null

    const t0 = ctx.currentTime + (opts.delay || 0)
    const peak = Math.min(0.35, opts.gain ?? volume)

    const osc = ctx.createOscillator()
    osc.type = opts.type || 'sine'
    osc.frequency.setValueAtTime(freq, t0)
    if (opts.glideTo && opts.glideTo !== freq) {
      osc.frequency.linearRampToValueAtTime(opts.glideTo, t0 + duration)
    }

    const gain = ctx.createGain()
    const attack = Math.min(SOFT_ATTACK, duration * 0.3)
    const release = Math.min(SOFT_RELEASE, duration * 0.4)
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(peak, t0 + attack)
    gain.gain.setValueAtTime(peak, t0 + Math.max(attack, duration - release))
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)

    osc.connect(gain)
    gain.connect(master)
    osc.start(t0)
    osc.stop(t0 + duration + 0.05)

    const entry = { osc, gain }
    activeRef.current.push(entry)
    osc.onended = () => {
      activeRef.current = activeRef.current.filter((e) => e !== entry)
    }
    return entry
  }, [allowed, volume])

  /** 吸气：低 → 高的上行滑音，身体会跟着「往上提」。 */
  const inhale = useCallback((seconds = 4) => tone(196, seconds, { glideTo: 330, gain: volume }), [tone, volume])
  /** 呼气：高 → 低的下行滑音，比吸气长，告诉身体「安全了」。 */
  const exhale = useCallback((seconds = 6) => tone(330, seconds, { glideTo: 165, gain: volume }), [tone, volume])
  /** 屏息：极轻的持续音，保持存在感但不推动。 */
  const hold = useCallback((seconds = 1) => tone(262, seconds, { gain: volume * 0.45 }), [tone, volume])
  /** 轻提示音（一步完成 / 计时到点）。 */
  const chime = useCallback(() => tone(660, 0.5, { gain: volume * 0.7, type: 'triangle' }), [tone, volume])
  /** 确认音（比 chime 更低更短，用于「我在」「已记录」）。 */
  const ack = useCallback(() => tone(392, 0.32, { gain: volume * 0.6, type: 'triangle' }), [tone, volume])

  return { tone, inhale, exhale, hold, chime, ack, stopAll, supported: audioSupported(), allowed: allowed() }
}

export default useRhythmTone
