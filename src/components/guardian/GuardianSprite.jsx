// 小鸽子 Dove —— 圣灵的象征（太3:16），口衔橄榄枝（创8:11）
// 纯 SVG + CSS 动画，立体感来自：径向渐变高光、内核柔光、光环、星光点缀
// 状态：idle | listening | comforting | praying | celebrating | resting
// （复用 guardian.css 原有动画类名：glow/body/halo/ring/core/sprout/star/sparkle）
import './guardian.css'

const SPARKLES = [0, 60, 120, 180, 240, 300]

export default function GuardianSprite({ state = 'idle', size = 64 }) {
  const eyesClosed = state === 'praying' || state === 'resting'

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
          {/* 外圈光环（柔金） */}
          <radialGradient id="gdHalo" cx="50%" cy="46%" r="50%">
            <stop offset="55%" stopColor="#ffe9c4" stopOpacity="0" />
            <stop offset="82%" stopColor="#ffe9c4" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#ffe9c4" stopOpacity="0" />
          </radialGradient>
          {/* 鸽身：偏左上高光的径向渐变 → 立体感（暖白） */}
          <radialGradient id="gdBody" cx="38%" cy="28%" r="85%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#f4f7fc" />
            <stop offset="78%" stopColor="#dde6f2" />
            <stop offset="100%" stopColor="#bfcde0" />
          </radialGradient>
          {/* 翅膀 */}
          <linearGradient id="gdWing" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#e9eff8" />
            <stop offset="100%" stopColor="#c7d4e6" />
          </linearGradient>
          {/* 内核柔光 */}
          <radialGradient id="gdCore" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="55%" stopColor="#fdf6e3" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffe9c4" stopOpacity="0" />
          </radialGradient>
          {/* 橄榄叶 */}
          <linearGradient id="gdLeaf" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#5fb86a" />
            <stop offset="100%" stopColor="#a5e08f" />
          </linearGradient>
          <filter id="gdBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>

        {/* 光环（缓慢呼吸） */}
        <circle className="guardian-halo" cx="36" cy="38" r="33" fill="url(#gdHalo)" />

        {/* 旋转星尘环（虚线细环，极轻） */}
        <circle
          className="guardian-ring"
          cx="36" cy="38" r="27"
          fill="none" stroke="#fff3d8" strokeOpacity="0.4"
          strokeWidth="1" strokeDasharray="2 9" strokeLinecap="round"
        />

        {/* 内核柔光（轻微脉动，衬在鸽身后） */}
        <ellipse className="guardian-core" cx="36" cy="40" rx="15" ry="13" fill="url(#gdCore)" />

        {/* 尾羽（左后方三根） */}
        <path d="M9 47 L24 40.5 L25.5 47 L12 51.5 Z" fill="url(#gdWing)" />
        <path d="M11 42 L25 39 L24.5 44 L12 46.5 Z" fill="#ffffff" opacity="0.85" />
        <path d="M24 40 L25.5 47 L21 49 Z" fill="#b6c5da" opacity="0.6" filter="url(#gdBlur)" />

        {/* 鸽身（胸圆润、向右上收成颈部） */}
        <path
          d="M22 40
             C22 32.5, 29 27.5, 37 27.5
             C44 27.5, 49.5 30, 51.5 25.5
             C53 28, 52.5 31.5, 50 34
             C53.5 38, 53 45, 48 49.5
             C43.5 53.5, 35 54.5, 29 51.5
             C24.5 49.2, 22 45, 22 40 Z"
          fill="url(#gdBody)"
        />
        {/* 腹部内阴影 → 体积感 */}
        <path
          d="M27 50 C32 54, 43 53.5, 47.5 49 C44 54, 31 55.5, 27 50 Z"
          fill="#9fb0c8" opacity="0.5" filter="url(#gdBlur)"
        />
        {/* 胸口弧形高光 → 釉面感 */}
        <path
          d="M26.5 35 C24.8 38, 24.3 42, 25.5 45.5 C26.8 41.5, 28.5 37.5, 31 34.2 C29.4 34.1, 27.8 34.3, 26.5 35 Z"
          fill="#ffffff" opacity="0.65" filter="url(#gdBlur)"
        />

        {/* 头部 + 颈 */}
        <circle cx="51" cy="26.5" r="7.2" fill="url(#gdBody)" />
        {/* 喙 */}
        <path d="M57.6 25.2 L63.2 26.8 L57.8 28.6 Z" fill="#f0a04a" />
        <path d="M57.6 25.2 L63.2 26.8 L58.2 26.9 Z" fill="#ffc070" />

        {/* 口衔橄榄枝（复用 sprout 摇曳动画） */}
        <g className="guardian-sprout">
          <path d="M62.5 26.6 C64.5 24.5, 66 22, 66.8 19" stroke="#7ac77f" strokeWidth="1.4"
            fill="none" strokeLinecap="round" />
          <path d="M65 23 C62.6 22.9, 61 21.5, 60.5 19.2 C63 19.3, 64.7 20.7, 65 23 Z"
            fill="url(#gdLeaf)" />
          <path d="M66 20.5 C68.2 20.2, 69.7 18.9, 70.2 16.8 C67.8 16.9, 66.3 18.3, 66 20.5 Z"
            fill="url(#gdLeaf)" opacity="0.9" />
        </g>

        {/* 翅膀（扬起，三段羽尖） */}
        <path
          d="M30 38
             C27 28, 32 17.5, 44 14
             C41.5 18.5, 41 22, 42.5 24.5
             C38.5 25.5, 36.5 28, 36.8 31
             C33.8 32.5, 31.5 35, 30 38 Z"
          fill="url(#gdWing)"
        />
        <path
          d="M30 38 C29 31, 32.5 23, 40 19.5 C36 24.5, 34.5 30, 34.8 34.5 C32.8 35.4, 31.2 36.6, 30 38 Z"
          fill="#ffffff" opacity="0.7"
        />
        {/* 翅根阴影衔接 */}
        <path d="M30 38 C32 36, 35 34.8, 38 35 C35 37.5, 32.5 38.5, 30 38 Z"
          fill="#aebfd6" opacity="0.55" filter="url(#gdBlur)" />

        {/* 环绕星光（四角星，错峰闪烁） */}
        <path className="guardian-star guardian-star--1"
          d="M12 24 L13 26.6 L15.6 27.6 L13 28.6 L12 31.2 L11 28.6 L8.4 27.6 L11 26.6 Z"
          fill="#fff3d8" />
        <path className="guardian-star guardian-star--2"
          d="M61 39 L61.8 41 L63.8 41.8 L61.8 42.6 L61 44.6 L60.2 42.6 L58.2 41.8 L60.2 41 Z"
          fill="#fff3d8" />
        <circle className="guardian-star guardian-star--3" cx="17" cy="56" r="1.3" fill="#fff3d8" />

        {/* 眼睛 */}
        {eyesClosed ? (
          <path d="M51.5 26 q2.4 2 4.8 0" stroke="#5b6a80" strokeWidth="1.6"
            fill="none" strokeLinecap="round" />
        ) : (
          <g>
            <ellipse cx="53.4" cy="25.8" rx="1.7" ry="2.1" fill="#3c4a5e" />
            <circle cx="54" cy="25" r="0.65" fill="#ffffff" />
          </g>
        )}
        {/* 腮红 */}
        <ellipse cx="49" cy="30.5" rx="2" ry="1.2" fill="#ffb09a" opacity="0.5" />
      </svg>
    </div>
  )
}
