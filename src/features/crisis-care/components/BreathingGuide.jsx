import { t as i18nT } from '../../../i18n/runtime'
import { useCallback, useEffect, useRef, useState } from 'react'
import { BreathCircle } from '../../../lib/media/MediaControls'
import { useRhythmTone } from '../../../lib/media/useRhythmTone'
import { useHaptics } from '../../../lib/media/useHaptics'
import { useAmbience } from '../../../lib/media/useAmbience'
import { getMediaPref } from '../../../lib/media/mediaPrefs'
import { prefersReducedMotion } from '../../../prefersReducedMotion'

/**
 * BreathingGuide — 4-1-6 呼吸引导（吸气4秒 / 停1秒 / 呼气6秒，共11秒一轮）。
 *
 * 惊恐发作时人读不进文字，只能跟着声音和节奏走，所以这里是三通道同步：
 *   · 视觉：受控 scale 的呼吸圈（不是纯 CSS 动画，才能与音严格同相位）
 *   · 听觉：合成滑音——吸气上行、呼气下行且更长，告诉身体「安全了」
 *   · 触觉：每次相位切换的轻振动，闭着眼也能跟
 *
 * 护栏：声音与振动默认关闭，由页面顶部的同意条开启；不使用任何突发或尖锐音；
 * 尊重系统的「减弱动态效果」。
 */
const PHASES = [
  { key: 'inhale', label: '吸气', secs: 4 },
  { key: 'hold', label: '屏住', secs: 1 },
  { key: 'exhale', label: '呼气', secs: 6 },
]

const TICK_MS = 100

export default function BreathingGuide({ targetCycles = 5 }) {
  const [running, setRunning] = useState(true)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [cycles, setCycles] = useState(0)

  const tone = useRhythmTone({ scope: 'crisis' })
  const haptics = useHaptics({ scope: 'crisis' })
  const ambience = useAmbience({ scope: 'crisis' })

  const elapsedRef = useRef(0)
  const phaseRef = useRef(0)
  const timerRef = useRef(null)
  const reduced = prefersReducedMotion()

  const cuePhase = useCallback((idx) => {
    const p = PHASES[idx]
    if (!p) return
    if (p.key === 'inhale') { tone.inhale(p.secs); haptics.vibrate('inhale') }
    else if (p.key === 'exhale') { tone.exhale(p.secs); haptics.vibrate('exhale') }
    else { tone.hold(p.secs); haptics.vibrate('hold') }
  }, [tone, haptics])

  useEffect(() => {
    if (!running) {
      clearInterval(timerRef.current)
      tone.stopAll()
      return undefined
    }
    cuePhase(phaseRef.current)
    timerRef.current = setInterval(() => {
      const p = PHASES[phaseRef.current]
      elapsedRef.current += TICK_MS
      const pct = Math.min(1, elapsedRef.current / (p.secs * 1000))
      setProgress(pct)
      if (elapsedRef.current >= p.secs * 1000) {
        elapsedRef.current = 0
        const next = (phaseRef.current + 1) % PHASES.length
        phaseRef.current = next
        setPhaseIdx(next)
        setProgress(0)
        if (next === 0) setCycles((c) => c + 1)
        cuePhase(next)
      }
    }, TICK_MS)
    return () => clearInterval(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  useEffect(() => () => { tone.stopAll(); haptics.cancel(); ambience.stop() }, [tone.stopAll, haptics.cancel, ambience.stop])

  const done = cycles >= targetCycles
  const cur = PHASES[phaseIdx]
  const soundOn = getMediaPref('crisisAudio')

  function restart() {
    elapsedRef.current = 0
    phaseRef.current = 0
    setCycles(0); setPhaseIdx(0); setProgress(0); setRunning(true)
  }

  return (
    <div className={`cc-breath-wrap ${running ? '' : 'cc-breath-paused'}`}>
      <BreathCircle
        phase={cur.key}
        progress={progress}
        label={i18nT(cur.label)}
        sub={done ? i18nT('做完了') : `${cycles + 1} / ${targetCycles}`}
        size={reduced ? 150 : 190}
      />

      <p className="cc-muted" style={{ textAlign: 'center', margin: 0 }} aria-live="polite">
        {done
          ? `${i18nT('做完了')} ${cycles} ${i18nT('轮。如果还需要，就再陪自己几轮。')}`
          : `${i18nT('第')} ${cycles + 1} / ${targetCycles} ${i18nT('轮 · 吸气 4 秒，停 1 秒，呼气 6 秒')}`}
      </p>

      {!soundOn && (
        <p className="cc-muted" style={{ textAlign: 'center', fontSize: 12, margin: '6px 0 0', opacity: 0.75 }}>
          {i18nT('如果闭着眼更容易，可以在上面打开声音，跟着引导音呼吸。')}
        </p>
      )}

      <div className="cc-choice" style={{ width: '100%' }}>
        <button className="cc-btn secondary" type="button" onClick={() => setRunning((r) => !r)}>
          {running ? i18nT('暂停') : i18nT('继续')}
        </button>
        <button className="cc-btn ghost" type="button" onClick={restart}>
          {i18nT('重新开始')}
        </button>
        {soundOn && (
          <button
            className="cc-btn ghost" type="button"
            onClick={() => ambience.toggle('ocean')}
            aria-pressed={ambience.playing}
          >
            {ambience.playing ? i18nT('关掉海浪声') : i18nT('加一点海浪声')}
          </button>
        )}
      </div>
    </div>
  )
}
