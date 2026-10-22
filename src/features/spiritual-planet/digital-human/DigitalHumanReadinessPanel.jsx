const labels = {
  APPROVED: '审核已通过', PENDING_REVIEW: '等待人工审核', CONFIGURED: '配置已提供，运行待验证',
  INCOMPLETE: '材料尚未齐备', MISSING: '尚未提供', DECLARED: '已声明就绪，运行待验证', NOT_VERIFIED: '尚未验证',
}

export default function DigitalHumanReadinessPanel({ readiness }) {
  if (!readiness) return null
  return <details className="dh-study">
    <summary>数字人可用范围与待办</summary>
    <p>目录 {readiness.characterCount} 人 · 研读主题 {readiness.truthCaseCount} · 完整预设回答 {readiness.preparedAnswerCount} 条（覆盖 {readiness.preparedAnswerCharacterCount} 人）</p>
    <p>资产校验通过 {readiness.validatedAssetCharacterCount} 人 · 满足本地发声配置门 {readiness.runtimeReadyCharacterCount} 人。配置通过不代表真实语音已验收。</p>
    <p>当前支持预设回答、证据研读与同人物主题追问；尚不支持开放式生成对话。会话清空或离开页面后，不保留本次上下文。</p>
    <ul>{(readiness.requirements || []).map((item) => <li key={item.code}>{item.label}：{labels[item.state] || '状态未知'}</li>)}</ul>
    <p>真实供应商与设备链路尚未由此检查验证；产品认证未完成。</p>
  </details>
}
