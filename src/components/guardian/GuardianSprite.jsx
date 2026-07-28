// 和平鸽 Dove —— 圣灵的象征（太3:16），展翅、口衔橄榄枝（创8:11）
// 真实鸽子位图 + CSS 动画光层：柔光晕、光环呼吸、星尘环、celebrating 撒光点
// 状态：idle | listening | comforting | praying | celebrating | resting
//
// 姿态（mood）与状态（state）是两层，姿态机本身在 guardianMood.js。
import './guardian.css'
import { t } from '../../i18n/runtime'
import { prefersReducedMotion } from '../../prefersReducedMotion'
import { GUARDIAN_MOODS, MOOD_BY_SPRITE_STATE } from './guardianMood'

const SPARKLES = [0, 60, 120, 180, 240, 300]
const DOVE_SRC = '/guardian/dove.png'

const MOOD_LABEL = Object.freeze({
  idle: t("安静地陪着你"),
  listening: t("正在听你说"),
  encouraging: t("在为你打气"),
  concerned: t("正在关切地陪着你"),
  celebrating: t("在为你欢喜"),
})

export default function GuardianSprite({ state = 'idle', mood, size = 64 }) {
  const posture = GUARDIAN_MOODS.includes(mood) ? mood : (MOOD_BY_SPRITE_STATE[state] || 'idle')
  // 减弱动态效果：姿态仍然成立（它还是低着头 / 抬着头），只是不再动
  const still = prefersReducedMotion()

  return (
    <div
      className={`guardian-posture guardian-posture--${posture}${still ? ' guardian-still' : ''}`}
      style={{ position: 'relative', width: size, height: size }}
      role="img"
      aria-label={`${t("守护者和平鸽")} · ${MOOD_LABEL[posture] || MOOD_LABEL.idle}`}
      data-mood={posture}
    >
      {/* 底层柔光（模糊大光晕，随状态变色/呼吸） */}
      <div className={`guardian-glow guardian-glow--${state}`} />

      {/* 光环 + 旋转星尘环（纯装饰，衬在鸽子后面） */}
      <svg viewBox="0 0 72 72" width={size} height={size}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }} aria-hidden="true">
        <defs>
          <radialGradient id="gdHalo" cx="50%" cy="48%" r="50%">
            <stop offset="52%" stopColor="#ffe9c4" stopOpacity="0" />
            <stop offset="80%" stopColor="#ffe9c4" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#ffe9c4" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle className="guardian-halo" cx="36" cy="38" r="33" fill="url(#gdHalo)" />
        <circle className="guardian-ring" cx="36" cy="38" r="27"
          fill="none" stroke="#fff3d8" strokeOpacity="0.4"
          strokeWidth="1" strokeDasharray="2 9" strokeLinecap="round" />
      </svg>

      {/* celebrating 时的扩散光点；减弱动态效果时整组不出现（它本身就是一段位移动画） */}
      {posture === 'celebrating' && !still && SPARKLES.map((angle) => (
        <span
          key={angle}
          className="guardian-sparkle"
          style={{
            '--gx': `${Math.cos((angle * Math.PI) / 180) * (size * 0.56)}px`,
            '--gy': `${Math.sin((angle * Math.PI) / 180) * (size * 0.56)}px`,
            animationDelay: `${(angle / 360) * 0.4}s`,
          }}
        />
      ))}

      {/* 和平鸽本体（保留 body 类的轻微浮动/状态动画）；无障碍标签由外层承担 */}
      <img
        src={DOVE_SRC}
        alt=""
        aria-hidden="true"
        draggable="false"
        className={`guardian-body guardian-body--${state}`}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
          userSelect: 'none',
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.28))',
        }}
      />
    </div>
  )
}
