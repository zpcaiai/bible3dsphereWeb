/**
 * CrisisHelpButton — 常驻的醒目入口「我现在撑不住了」。
 * 比普通聊天入口更显眼。点击进入危机守护。
 */
export default function CrisisHelpButton({ onClick, label = '我现在撑不住了' }) {
  return (
    <button className="cc-help-button" type="button" onClick={onClick} aria-label={label}>
      <span aria-hidden="true">🆘</span>
      <span>{label}</span>
    </button>
  )
}
