import { t as i18nT } from '../../../i18n/runtime'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useGuidedAudio } from '../../../lib/media/useGuidedAudio'
import { useHaptics } from '../../../lib/media/useHaptics'
import { useRhythmTone } from '../../../lib/media/useRhythmTone'
import { getMediaPref } from '../../../lib/media/mediaPrefs'

/**
 * GroundingExercise — 5-4-3-2-1 着陆练习。逐步把注意力带回此刻。
 * 用于解离、惊恐、创伤触发时的稳定，不分析原因、不逼回忆。
 *
 * 多模态：每一步可语音朗读并留白（解离时读不进字），完成一步给一次轻振动确认。
 * 「闭着眼跟着做」是这个练习本来的样子。
 */
const STEPS = [
  { n: 5, sense: '看见', hint: '说出你看见的 5 个东西' },
  { n: 4, sense: '摸到', hint: '摸到的 4 个东西' },
  { n: 3, sense: '听见', hint: '听见的 3 个声音' },
  { n: 2, sense: '闻到', hint: '闻到的 2 个气味' },
  { n: 1, sense: '感受', hint: '感受到的 1 个身体感觉' },
]

export default function GroundingExercise() {
  const [done, setDone] = useState([])
  const guided = useGuidedAudio({ scope: 'crisis' })
  const haptics = useHaptics({ scope: 'crisis' })
  const tone = useRhythmTone({ scope: 'crisis' })
  const guidedStepRef = useRef(-1)

  const toggle = useCallback((i) => {
    setDone((d) => {
      const next = d.includes(i) ? d.filter((x) => x !== i) : [...d, i]
      if (!d.includes(i)) { haptics.vibrate('stepDone'); tone.ack() }
      return next
    })
  }, [haptics, tone])

  const startGuided = useCallback(() => {
    guided.start(
      STEPS.map((s, i) => ({
        label: s.sense,
        text: `${s.hint}。慢慢来，不用做得完美。`,
        pauseAfter: 18,
        onEnter: () => { guidedStepRef.current = i; haptics.vibrate('tap') },
      })),
      {
        force: true,
        onComplete: () => { tone.chime(); haptics.vibrate('confirm') },
      },
    )
  }, [guided, haptics, tone])

  // 依赖 guided.stop（稳定的 useCallback）而不是 guided 对象本身：
  // hook 每次渲染都会返回新对象，若放整个对象进 deps，cleanup 会在每次重渲染时触发，
  // 播报刚开始就被自己停掉。
  useEffect(() => () => guided.stop(), [guided.stop])

  const soundOn = getMediaPref('crisisAudio')
  const activeIdx = guided.running ? guided.index : -1

  return (
    <div>
      <p className="cc-muted">{i18nT('不用做得完美，只要慢慢把自己带回此刻。')}</p>

      {soundOn && (
        <div className="cc-choice" style={{ marginBottom: 10 }}>
          {!guided.running ? (
            <button className="cc-btn secondary" type="button" onClick={startGuided}>
              🔊 {i18nT('闭着眼，跟我一步一步来')}
            </button>
          ) : (
            <>
              <button className="cc-btn secondary" type="button" onClick={guided.state === 'paused' ? guided.resume : guided.pause}>
                {guided.state === 'paused' ? i18nT('继续') : i18nT('暂停')}
              </button>
              <button className="cc-btn ghost" type="button" onClick={guided.skip}>{i18nT('下一步')}</button>
              <button className="cc-btn ghost" type="button" onClick={guided.stop}>{i18nT('停止')}</button>
            </>
          )}
        </div>
      )}
      {guided.running && (
        <p className="cc-muted" style={{ fontSize: 12, marginTop: 0 }} aria-live="polite">
          {guided.state === 'waiting' && guided.remaining > 0
            ? `${i18nT('慢慢来，还有')} ${guided.remaining}s`
            : i18nT('正在引导…')}
        </p>
      )}

      {STEPS.map((s, i) => (
        <div
          key={s.n}
          className={`cc-step ${done.includes(i) ? 'done' : ''} ${activeIdx === i ? 'active' : ''}`}
          role="button"
          tabIndex={0}
          aria-pressed={done.includes(i)}
          onClick={() => toggle(i)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggle(i)}
          style={{
            cursor: 'pointer',
            outline: activeIdx === i ? '2px solid rgba(52,199,89,0.55)' : 'none',
            outlineOffset: 2,
          }}
        >
          <b>{s.n}</b> · {i18nT(s.sense)} — {i18nT(s.hint)}
        </div>
      ))}

      {done.length === STEPS.length && (
        <p style={{ color: '#34c759' }} aria-live="polite">
          {i18nT('你已经把自己带回到现在了。这是现在，不是那时，你是安全的。')}
        </p>
      )}
    </div>
  )
}
