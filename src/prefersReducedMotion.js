// 读取系统「减弱动态效果」偏好（模块级缓存，随系统设置实时更新）。
// 用于在 requestAnimationFrame / useFrame 动画循环中跳过装饰性运动（如自转），
// 对晕动症用户与低端设备更友好。CSS 层面的动效已在 styles.css 中处理。
let _reduced = false
try {
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    _reduced = !!mq.matches
    const onChange = (e) => { _reduced = !!e.matches }
    if (mq.addEventListener) mq.addEventListener('change', onChange)
    else if (mq.addListener) mq.addListener(onChange)
  }
} catch { /* ignore */ }

export function prefersReducedMotion() {
  return _reduced
}
