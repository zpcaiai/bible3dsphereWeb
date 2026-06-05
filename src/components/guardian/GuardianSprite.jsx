// 光灵 Light Sprite —— 小火苗 × 小星光 × 小种子 × 小守护灵
// 象征：圣灵工作后的生命成长（火焰中长出嫩芽，周围环绕柔和星光）
// 纯 SVG + CSS 动画，立体感来自：径向渐变高光、内核光芒、光环、星光点缀
// 状态：idle | listening | comforting | praying | celebrating | resting
import './guardian.css'

const SPARKLES = [0, 60, 120, 180, 240, 300]

export default function GuardianSprite({ state = 'idle', size = 64 }) {
  const eyesClosed = state === 'praying' || state === 'resting'
  const smiling = state === 'idle' || state === 'listening' || state === 'celebrating'

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      {/* 底层柔光（DOM 层，模糊大光晕） */}
      <div className={`guardian-glow guardian-glow--${state}`} />

      {/* celebrating 时的扩散光点 */}
      {state === 'celebrating' && SPARKLES.map((angle) => (
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

      <svg
        viewBox="0 0 72 72"
        width={size}
        height={size}
        className={`guardian-body guardian-body--${state}`}
        style={{ position: 'relative', overflow: 'visible' }}
      >
        <defs>
          {/* 外圈光环 */}
          <radialGradient id="gsHalo" cx="50%" cy="46%" r="50%">
            <stop offset="55%" stopColor="#ffd9a0" stopOpacity="0" />
            <stop offset="82%" stopColor="#ffd9a0" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#ffd9a0" stopOpacity="0" />
          </radialGradient>
          {/* 身体：偏左上高光的径向渐变 → 立体球面感 */}
          <radialGradient id="gsBody" cx="38%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#fff4d8" />
            <stop offset="38%" stopColor="#ffd27a" />
            <stop offset="72%" stopColor="#ffae4f" />
            <stop offset="100%" stopColor="#f08a3c" />
          </radialGradient>
          {/* 内核光 */}
          <radialGradient id="gsCore" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#fff0c4" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffd27a" stopOpacity="0" />
          </radialGradient>
          {/* 嫩芽 */}
          <linearGradient id="gsLeaf" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#5fb86a" />
            <stop offset="100%" stopColor="#a5e08f" />
          </linearGradient>
          <filter id="gsBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>

        {/* 光环（缓慢呼吸） */}
        <circle className="guardian-halo" cx="36" cy="38" r="33" fill="url(#gsHalo)" />

        {/* 旋转星尘环（虚线细环，极轻） */}
        <circle
          className="guardian-ring"
          cx="36" cy="38" r="27"
          fill="none" stroke="#ffe9bd" strokeOpacity="0.4"
          strokeWidth="1" strokeDasharray="2 9" strokeLinecap="round"
        />

        {/* 身体：火苗轮廓（底部更圆 → 种子感） */}
        <path
          d="M36 9
             C39 17, 47 21, 51 29
             C55 37, 54 47, 48 53
             C44.5 56.6, 40.5 58.5, 36 58.5
             C31.5 58.5, 27.5 56.6, 24 53
             C18 47, 17 37, 21 29
             C25 21, 33 17, 36 9 Z"
          fill="url(#gsBody)"
        />
        {/* 底部内阴影 → 体积感 */}
        <path
          d="M24 50 C28 55.5, 44 55.5, 48 50 C44.5 56, 27.5 56, 24 50 Z"
          fill="#c96a28" opacity="0.45" filter="url(#gsBlur)"
        />
        {/* 左上弧形高光 → 釉面感 */}
        <path
          d="M27 20 C23.5 25, 21.5 31, 22.5 37 C24.5 31.5, 27 25.5, 31 21.5 C29.6 20.6, 28.2 20.1, 27 20 Z"
          fill="#ffffff" opacity="0.5" filter="url(#gsBlur)"
        />

        {/* 内核光芒（轻微脉动） */}
        <ellipse className="guardian-core" cx="36" cy="40" rx="11" ry="13" fill="url(#gsCore)" />

        {/* 顶端嫩芽：火焰中长出的新生命 🌱 */}
        <g className="guardian-sprout">
          <path d="M36 12 C36 9.5, 36 7.5, 36 5.5" stroke="#7ac77f" strokeWidth="1.6"
            fill="none" strokeLinecap="round" />
          <path d="M36 7.5 C33.4 7.2, 31.6 5.6, 31.2 3 C34 3.2, 35.8 4.8, 36 7.5 Z"
            fill="url(#gsLeaf)" />
          <path d="M36 6.5 C38.4 6.3, 40.2 4.9, 40.6 2.6 C38 2.7, 36.3 4.2, 36 6.5 Z"
            fill="url(#gsLeaf)" opacity="0.9" />
        </g>

        {/* 环绕星光（四角星，错峰闪烁） */}
        <path className="guardian-star guardian-star--1"
          d="M12 24 L13 26.6 L15.6 27.6 L13 28.6 L12 31.2 L11 28.6 L8.4 27.6 L11 26.6 Z"
          fill="#ffeec9" />
        <path className="guardian-star guardian-star--2"
          d="M59 18 L59.8 20 L61.8 20.8 L59.8 21.6 L59 23.6 L58.2 21.6 L56.2 20.8 L58.2 20 Z"
          fill="#ffeec9" />
        <circle className="guardian-star guardian-star--3" cx="58" cy="46" r="1.3" fill="#ffeec9" />

        {/* 表情 */}
        {eyesClosed ? (
          <g stroke="#6b4220" strokeWidth="1.7" fill="none" strokeLinecap="round">
            <path d="M29.5 42.5 q2.5 2.2 5 0" />
            <path d="M37.5 42.5 q2.5 2.2 5 0" />
          </g>
        ) : (
          <g>
            <ellipse cx="31.5" cy="42" rx="1.9" ry="2.4" fill="#5b3a1e" />
            <ellipse cx="40.5" cy="42" rx="1.9" ry="2.4" fill="#5b3a1e" />
            {/* 眼神高光 → 灵动 */}
            <circle cx="32.2" cy="41.2" r="0.7" fill="#ffffff" />
            <circle cx="41.2" cy="41.2" r="0.7" fill="#ffffff" />
          </g>
        )}
        {smiling && (
          <path d="M32.5 47.5 q3.5 2.8 7 0" stroke="#6b4220" strokeWidth="1.5"
            fill="none" strokeLinecap="round" />
        )}
        {/* 腮红 */}
        <ellipse cx="27" cy="46" rx="2.2" ry="1.3" fill="#ff9d6b" opacity="0.45" />
        <ellipse cx="45" cy="46" rx="2.2" ry="1.3" fill="#ff9d6b" opacity="0.45" />
      </svg>
    </div>
  )
}
