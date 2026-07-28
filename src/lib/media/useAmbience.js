// useAmbience — 合成环境音底噪（雨 / 海 / 风 / 静默垫底）。
//
// 全部由噪声缓冲 + 滤波 + 极慢 LFO 合成，无需任何音频资源。
// 用于：Lectio 默观留白、诗篇吟诵、安息日模式、创伤稳定（低频垫底）。
import { useCallback, useEffect, useRef, useState } from 'react'
import { getAudioContext, getMasterGain, resumeAudio, createNoiseBuffer, audioSupported } from './audioEngine'
import { getMediaPref } from './mediaPrefs'

export const AMBIENCE_KINDS = Object.freeze({
  rain:    { label: '细雨',   noise: 'white', cutoff: 1400, q: 0.4, lfoRate: 0.08, lfoDepth: 0.25, gain: 0.05 },
  ocean:   { label: '海浪',   noise: 'brown', cutoff: 620,  q: 0.6, lfoRate: 0.06, lfoDepth: 0.55, gain: 0.075 },
  wind:    { label: '旷野风', noise: 'pink',  cutoff: 900,  q: 0.5, lfoRate: 0.04, lfoDepth: 0.4,  gain: 0.055 },
  hush:    { label: '安静垫底', noise: 'brown', cutoff: 320, q: 0.3, lfoRate: 0.02, lfoDepth: 0.12, gain: 0.04 },
})

export function useAmbience({ scope = 'default' } = {}) {
  const nodesRef = useRef(null)
  const [kind, setKind] = useState(null)

  const allowed = useCallback(() => {
    if (!audioSupported()) return false
    if (!getMediaPref('ambience')) return false
    return scope === 'crisis' ? getMediaPref('crisisAudio') : getMediaPref('sound')
  }, [scope])

  const stop = useCallback(() => {
    const nodes = nodesRef.current
    nodesRef.current = null
    setKind(null)
    if (!nodes) return
    const ctx = getAudioContext()
    try {
      if (ctx) {
        nodes.gain.gain.cancelScheduledValues(ctx.currentTime)
        nodes.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.5)
      }
      setTimeout(() => {
        try { nodes.source.stop() } catch { /* 已停止 */ }
        try { nodes.lfo.stop() } catch { /* 已停止 */ }
      }, 1600)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => stop, [stop])

  const start = useCallback(async (nextKind = 'hush', { fadeIn = 2.5 } = {}) => {
    if (!allowed()) return false
    const spec = AMBIENCE_KINDS[nextKind]
    if (!spec) return false
    const ok = await resumeAudio()
    if (!ok) return false
    const ctx = getAudioContext()
    const master = getMasterGain()
    if (!ctx || !master) return false

    stop()

    const source = ctx.createBufferSource()
    source.buffer = createNoiseBuffer(ctx, spec.noise, 6)
    source.loop = true

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = spec.cutoff
    filter.Q.value = spec.q

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(spec.gain, ctx.currentTime + fadeIn)

    // 极慢 LFO 调制音量，让底噪像呼吸/潮汐一样起伏，而不是一堵静止的墙
    const lfo = ctx.createOscillator()
    lfo.frequency.value = spec.lfoRate
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = spec.gain * spec.lfoDepth
    lfo.connect(lfoGain)
    lfoGain.connect(gain.gain)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(master)
    source.start()
    lfo.start()

    nodesRef.current = { source, filter, gain, lfo, lfoGain }
    setKind(nextKind)
    return true
  }, [allowed, stop])

  const toggle = useCallback(async (nextKind) => {
    if (kind === nextKind) { stop(); return false }
    return start(nextKind)
  }, [kind, start, stop])

  return { start, stop, toggle, kind, playing: !!kind, supported: audioSupported(), allowed: allowed() }
}

export default useAmbience
