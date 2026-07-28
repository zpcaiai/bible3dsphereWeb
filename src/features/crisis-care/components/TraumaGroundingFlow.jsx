import { t as i18nT } from '../../../i18n/runtime'
import { useCallback, useEffect } from 'react'
import { TRAUMA_GROUNDING } from '../data/crisisContent'
import GroundingExercise from './GroundingExercise'
import { useGuidedAudio } from '../../../lib/media/useGuidedAudio'
import { useAmbience } from '../../../lib/media/useAmbience'
import { getMediaPref } from '../../../lib/media/mediaPrefs'

/**
 * TraumaGroundingFlow — 创伤触发 / 解离 / flashback 的稳定。
 * 只做 grounding 与环境确认，不要求复述创伤、不做暴露、不属灵化解释。
 *
 * 多模态护栏（比其他模块更严）：
 *   · 旁白语速放慢（rate 0.78），全程无任何突发音；
 *   · 只提供低频「安静垫底」音景，不提供任何有节奏或有旋律的声音；
 *   · 不使用振动——部分创伤幸存者会被突然的身体刺激再次触发。
 */
const DONTS = [
  '不会要求你详细复述创伤',
  '不会做暴露疗法',
  '不会说「这是神的美意」',
  '不会说「你饶恕他就好了」',
]

const ORIENTING = [
  '你现在是安全的。这里是现在，不是那时候。',
  '如果可以，慢慢看一看你周围。说出你现在所在的地方。',
  '感觉一下脚踩在地上的重量。地板在托住你。',
  '今天是哪一年，你现在多大了。那件事已经过去了。',
]

export default function TraumaGroundingFlow() {
  const guided = useGuidedAudio({ scope: 'crisis' })
  const ambience = useAmbience({ scope: 'crisis' })
  const soundOn = getMediaPref('crisisAudio')

  const startOrienting = useCallback(() => {
    guided.start(
      ORIENTING.map((text) => ({ text: i18nT(text), pauseAfter: 14 })),
      { force: true, rate: 0.78 },
    )
  }, [guided])

  // 同上：只依赖稳定的方法引用，否则 cleanup 会在每次重渲染时把旁白掐断。
  useEffect(() => () => { guided.stop(); ambience.stop() }, [guided.stop, ambience.stop])

  return (
    <div className="cc-card">
      <p>{TRAUMA_GROUNDING}</p>

      {soundOn && (
        <div className="cc-choice" style={{ margin: '10px 0' }}>
          {!guided.running ? (
            <button className="cc-btn secondary" type="button" onClick={startOrienting}>
              🔊 {i18nT('放慢的定向旁白（不会提到那件事）')}
            </button>
          ) : (
            <button className="cc-btn ghost" type="button" onClick={guided.stop}>{i18nT('停止旁白')}</button>
          )}
          <button className="cc-btn ghost" type="button" onClick={() => ambience.toggle('hush')} aria-pressed={ambience.playing}>
            {ambience.playing ? i18nT('关掉底噪') : i18nT('加一层很轻的底噪')}
          </button>
        </div>
      )}
      {guided.running && guided.state === 'waiting' && (
        <p className="cc-muted" style={{ fontSize: 12 }} aria-live="polite">{i18nT('安静一会儿…')} {guided.remaining}s</p>
      )}

      <div style={{ margin: '14px 0' }}>
        <GroundingExercise />
      </div>

      <h3>{i18nT('在这里，我们的约定')}</h3>
      {DONTS.map((d) => (
        <p key={d} className="cc-muted">· {i18nT(d)}</p>
      ))}
      <p className="cc-muted">{i18nT('声音里不会有任何突然或尖锐的声响；这里也不会震动。你随时可以全部关掉。')}</p>
      <p className="cc-muted">{i18nT('如果这样的状态反复出现，强烈建议找一位专业的创伤治疗师一起处理。你值得被好好照顾。')}</p>
    </div>
  )
}
