import { t as i18nT } from '../../../i18n/runtime'
import { useState } from 'react'
import { EMERGENCY_COPY_TEXT } from '../data/crisisContent'
import CrisisResourcePanel from './CrisisResourcePanel'
import { useHaptics } from '../../../lib/media/useHaptics'
import { useRhythmTone } from '../../../lib/media/useRhythmTone'

/**
 * EmergencyEscalationPanel — Red Level。停止普通对话，给出三步紧急行动 +
 * 一键复制求助文本 + 当地热线 + （已预授权时）提醒守护人。
 */
export default function EmergencyEscalationPanel({ emergency, regionCode = 'TW', onNotifyGuardians, canNotify }) {
  const [copied, setCopied] = useState(false)
  // 红色等级下，「我按到了吗」必须有明确的非视觉回执——手在抖、屏幕在糊的时候尤其如此
  const haptics = useHaptics({ scope: 'crisis' })
  const tone = useRhythmTone({ scope: 'crisis' })
  const copyText = emergency?.copyText || EMERGENCY_COPY_TEXT
  const steps = emergency?.steps || [
    '现在最重要的是你的即时安全，你不需要独自扛这个。',
    '请立刻做这三件事：',
    '1. 把可能伤害自己的东西放远，或离开那个地方。',
    '2. 现在拨打当地紧急电话或危机热线。',
    '3. 把下面这句话发给一个可信的人：',
    `「${copyText}」`,
  ]

  async function copy() {
    try {
      await navigator.clipboard.writeText(copyText)
      setCopied(true)
      haptics.vibrate('confirm')
      tone.ack()
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="cc-banner-red">
      <h3>{emergency?.headline || '请先保护好此刻的你'}</h3>
      {steps.map((s, i) => (
        <p key={i} style={{ margin: '4px 0' }}>{s}</p>
      ))}

      <button className="cc-btn danger full" type="button" onClick={copy} style={{ marginTop: 10 }}>
        {i18nT('复制这句求助的话，发给一个人')}
      </button>
      <div className="cc-toast">{copied ? '已复制，现在把它发出去。' : ''}</div>

      <div style={{ marginTop: 14 }}>
        <CrisisResourcePanel block={emergency?.resources ? { regionCode, resources: emergency.resources, emergencyNumber: emergency.emergencyNumber } : null} defaultRegion={regionCode} compact />
      </div>

      {onNotifyGuardians && (
        <button className="cc-btn secondary full" type="button" onClick={() => { haptics.vibrate('confirm'); tone.ack(); onNotifyGuardians() }} style={{ marginTop: 10 }}>
          {canNotify ? '提醒我已授权的守护人' : '设置守护人（暂未授权任何人）'}
        </button>
      )}
      <p className="cc-muted" style={{ marginTop: 10 }}>
        {i18nT('我只是一个陪伴的工具，没办法替代此刻你真正需要的人。等你联系到人之后，我仍然在这里陪你。')}
      </p>
    </div>
  )
}
