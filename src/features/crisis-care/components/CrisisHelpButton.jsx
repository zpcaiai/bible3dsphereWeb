import { useHaptics } from '../../../lib/media/useHaptics'

/**
 * CrisisHelpButton — 常驻的醒目入口「我现在撑不住了」。
 * 比普通聊天入口更显眼。点击进入危机守护。
 *
 * 按下时给一次轻振动：在崩溃状态下，「我到底按到了没有」这件事本身就会加重焦虑。
 */
export default function CrisisHelpButton({ onClick, label = '我现在撑不住了' }) {
  const haptics = useHaptics({ scope: 'crisis' })
  return (
    <button
      className="cc-help-button"
      type="button"
      onClick={(e) => { haptics.vibrate('ack'); onClick?.(e) }}
      aria-label={label}
    >
      <span aria-hidden="true">🆘</span>
      <span>{label}</span>
    </button>
  )
}
