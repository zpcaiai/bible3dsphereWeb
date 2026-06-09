// 统一「返回上一页」醒目图标：圆形磨砂 + 白色左箭头。
// 用法：<BackButton onClick={onBack} />  —— 替换各页左上角五花八门的返回按钮。
import { t } from './i18n/runtime'

export default function BackButton({ onClick, ariaLabel, title, style, size = 40, className = '' }) {
  const label = ariaLabel || t('返回上一页')
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={title || label}
      className={`app-back-btn ${className}`.trim()}
      style={size !== 40 ? { width: size, height: size, ...style } : style}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  )
}
