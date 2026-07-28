import { t as i18nT } from '../../../i18n/runtime'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ADDICTION_DELAY_STEPS, HALT_ITEMS } from '../data/crisisContent'
import { CountdownRing } from '../../../lib/media/MediaControls'
import { useRhythmTone } from '../../../lib/media/useRhythmTone'
import { useHaptics } from '../../../lib/media/useHaptics'
import { speakOnce, stopAllAudio } from '../../../useGlobalAudio'
import { getMediaPref } from '../../../lib/media/mediaPrefs'

/**
 * AddictionDelayFlow — 成瘾复发冲动的即时干预：HALT 检查 + 10 分钟延迟。
 * 不要求永远不犯，只把行动推迟 10 分钟。
 *
 * 多模态：倒计时环（看得见「浪在退」）+ 每分钟一次轻振动与陪伴语音
 * （「再撑一分钟，我还在」）。冲动当下最难的是「一个人熬」，声音让它不像独处。
 */
const TOTAL = 600

const COMPANION_LINES = [
  '还有九分钟。你已经开始了，这就是抵抗。',
  '还有八分钟。冲动像浪，它会到顶，然后退下去。',
  '还有七分钟。你不需要赢一辈子，只要赢这一次呼吸。',
  '还有六分钟。喝口水，动一动脚。',
  '还剩一半了。你正在做一件很难的事。',
  '还有四分钟。注意听，浪已经在退了。',
  '还有三分钟。你没有失败，你在这里。',
  '还有两分钟。快到了。',
  '最后一分钟。你撑住了。',
]

export default function AddictionDelayFlow() {
  const [halt, setHalt] = useState([])
  const [seconds, setSeconds] = useState(null)
  const tone = useRhythmTone({ scope: 'crisis' })
  const haptics = useHaptics({ scope: 'crisis' })
  const lastMinuteRef = useRef(null)

  useEffect(() => {
    if (seconds === null || seconds <= 0) return undefined
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [seconds])

  // 每整分钟：一次轻振动 + 一句陪伴（声音开启时）
  useEffect(() => {
    if (seconds === null || seconds <= 0) return
    if (seconds % 60 !== 0 || seconds === TOTAL) return
    if (lastMinuteRef.current === seconds) return
    lastMinuteRef.current = seconds
    haptics.vibrate('heartbeat')
    tone.ack()
    if (getMediaPref('crisisAudio')) {
      const idx = COMPANION_LINES.length - Math.floor(seconds / 60)
      const line = COMPANION_LINES[idx]
      if (line) speakOnce(i18nT(line), { rate: 0.85 })
    }
  }, [seconds, haptics, tone])

  useEffect(() => () => { stopAllAudio(); haptics.cancel(); tone.stopAll() }, [haptics.cancel, tone.stopAll])

  const start = useCallback(() => {
    lastMinuteRef.current = null
    setSeconds(TOTAL)
    haptics.vibrate('confirm')
    tone.ack()
    if (getMediaPref('crisisAudio')) speakOnce(i18nT('好，我们只推迟十分钟。我陪你。'), { rate: 0.85 })
  }, [haptics, tone])

  const stop = useCallback(() => {
    setSeconds(null)
    stopAllAudio()
    haptics.cancel()
  }, [haptics])

  useEffect(() => {
    if (seconds === 0) {
      haptics.vibrate('confirm')
      tone.chime()
      if (getMediaPref('crisisAudio')) speakOnce(i18nT('你撑过了这十分钟。冲动会像浪一样退下去。'), { rate: 0.85 })
    }
  }, [seconds, haptics, tone])

  const left = seconds ?? TOTAL
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const finished = seconds === 0
  const running = seconds != null && seconds > 0

  return (
    <div className="cc-card">
      <h3>{i18nT('先别急，我们只推迟 10 分钟')}</h3>
      <p>{i18nT('你现在不用承诺永远不再犯，也不用靠意志战胜一生的问题。你只需要把这个行动延迟 10 分钟。')}</p>

      <h3 style={{ marginTop: 12 }}>{i18nT('先做 HALT 检查')}</h3>
      <p className="cc-muted">{i18nT('很多复发冲动，其实是身体在喊这四件事之一：')}</p>
      <div className="cc-pill-row">
        {HALT_ITEMS.map((it) => (
          <button
            key={it.key}
            type="button"
            className={`cc-pill ${halt.includes(it.key) ? 'active' : ''}`}
            aria-pressed={halt.includes(it.key)}
            onClick={() => {
              haptics.vibrate('tap')
              setHalt((h) => (h.includes(it.key) ? h.filter((x) => x !== it.key) : [...h, it.key]))
            }}
          >
            {it.label}
          </button>
        ))}
      </div>

      <h3 style={{ marginTop: 12 }}>{i18nT('现在做这三步')}</h3>
      {ADDICTION_DELAY_STEPS.map((s, i) => (
        <p key={i}>{i + 1}. {s}</p>
      ))}

      <div style={{ display: 'grid', placeItems: 'center', margin: '16px 0', gap: 10 }}>
        <CountdownRing
          progress={seconds == null ? 0 : 1 - seconds / TOTAL}
          size={132} stroke={9}
          color={finished ? '#0ca30c' : '#3987e5'}
          label={`${i18nT('剩余')} ${mm}:${ss}`}
        >
          <span style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{mm}:{ss}</span>
        </CountdownRing>

        {seconds === null && (
          <button className="cc-btn full" type="button" onClick={start}>{i18nT('开始 10 分钟倒计时')}</button>
        )}
        {running && (
          <button className="cc-btn ghost" type="button" onClick={stop}>{i18nT('先停下')}</button>
        )}
        {finished && (
          <>
            <p style={{ color: '#34c759', textAlign: 'center' }} aria-live="polite">
              {i18nT('你撑过了这 10 分钟。冲动会像浪一样退下去。要再来 10 分钟也可以。')}
            </p>
            <button className="cc-btn full" type="button" onClick={start}>{i18nT('再来 10 分钟')}</button>
          </>
        )}
        {!getMediaPref('crisisAudio') && seconds === null && (
          <p className="cc-muted" style={{ fontSize: 12, textAlign: 'center', margin: 0 }}>
            {i18nT('打开上面的声音，倒计时里会有人每分钟陪你说一句话。')}
          </p>
        )}
      </div>
    </div>
  )
}
