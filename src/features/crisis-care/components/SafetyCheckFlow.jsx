import { t as i18nT } from '../../../i18n/runtime'
import { useEffect, useState } from 'react'
import { speakOnce, stopAllAudio } from '../../../useGlobalAudio'
import { getMediaPref } from '../../../lib/media/mediaPrefs'
import { useHaptics } from '../../../lib/media/useHaptics'

/**
 * SafetyCheckFlow — 直接、温柔、简短的安全确认状态机（前端镜像 crisis_engine.safety_check_step）。
 * 每次只问一个问题。若用户表示「有具体计划/工具」→ 触发 onEscalate(red)。
 * 不解释、不讲道、不要求用户证明自己没事。
 */
const QUESTIONS = {
  ask_intent: '我听见你现在非常痛苦。为了先确保你安全，我想很直接地问你一句：\n你现在是否有伤害自己、结束生命，或伤害他人的想法？',
  ask_plan: '谢谢你愿意如实告诉我。你现在是否已经有具体的方法、工具、地点或时间？',
}

function nextStep(state, yes) {
  if (state === 'ask_intent') {
    return yes
      ? { state: 'ask_plan', message: QUESTIONS.ask_plan, done: false, escalate: false }
      : { state: 'stabilize', message: '谢谢你告诉我。那我们先一起把接下来的几分钟稳稳地度过，好吗？我会陪着你。', done: false, escalate: false }
  }
  if (state === 'ask_plan') {
    return yes
      ? { state: 'escalate_red', message: '', done: true, escalate: true }
      : { state: 'create_safety_plan', message: '我听到了。你现在还没有具体的计划，这很重要。我们一起做一个今晚的安全小计划，并联系一个真实的人，好吗？', done: false, escalate: false }
  }
  return { state: 'stabilize', message: '我在这里陪你。', done: false, escalate: false }
}

export default function SafetyCheckFlow({ onEscalate, onStabilize, onSafetyPlan }) {
  const [state, setState] = useState('ask_intent')
  const [message, setMessage] = useState(QUESTIONS.ask_intent)
  const [speaking, setSpeaking] = useState(false)
  const haptics = useHaptics({ scope: 'crisis' })

  useEffect(() => () => stopAllAudio(), [])

  // 这几个问题必须由人「问」出来才不像表单。声音需显式开启，且永不自动播放。
  async function readAloud() {
    if (speaking) { stopAllAudio(); setSpeaking(false); return }
    setSpeaking(true)
    await speakOnce(message.replace(/\n/g, '。'), { rate: 0.8 })
    setSpeaking(false)
  }

  function answer(yes) {
    haptics.vibrate('tap')
    stopAllAudio()
    setSpeaking(false)
    const step = nextStep(state, yes)
    if (step.escalate) { onEscalate && onEscalate(); return }
    setState(step.state)
    setMessage(step.message)
    if (step.state === 'stabilize') onStabilize && onStabilize()
    if (step.state === 'create_safety_plan') onSafetyPlan && onSafetyPlan()
  }

  const terminal = state === 'stabilize' || state === 'create_safety_plan'

  return (
    <div className="cc-card">
      <p style={{ whiteSpace: 'pre-line' }}>{message}</p>
      {getMediaPref('crisisAudio') && (
        <button className="cc-btn ghost" type="button" onClick={readAloud} style={{ marginBottom: 8 }}>
          {speaking ? `⏹ ${i18nT('停止')}` : `🔊 ${i18nT('念给我听')}`}
        </button>
      )}
      {!terminal && (
        <div className="cc-choice">
          <button className="cc-btn danger" type="button" onClick={() => answer(true)}>{i18nT('是 / 有')}</button>
          <button className="cc-btn secondary" type="button" onClick={() => answer(false)}>{i18nT('没有')}</button>
        </div>
      )}
      {state === 'stabilize' && (
        <button className="cc-btn full" type="button" onClick={() => onStabilize && onStabilize()}>{i18nT('开始 60 秒稳定练习')}</button>
      )}
      {state === 'create_safety_plan' && (
        <button className="cc-btn full" type="button" onClick={() => onSafetyPlan && onSafetyPlan()}>{i18nT('一起做今晚的安全计划')}</button>
      )}
      <p className="cc-muted" style={{ marginTop: 10 }}>
        {i18nT('你可以不回答。我不会逼你。无论如何，联系一个信任的人或拨打热线，都不是软弱。')}
      </p>
    </div>
  )
}
