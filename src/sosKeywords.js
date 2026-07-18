// SOS 关键词检测 — 独立小模块，供所有自由文本入口同步检测。
// 保持纯函数与零 UI 依赖，避免业务入口各自维护一套不一致的规则。
export const SOS_KEYWORDS = [
  '绝望', '放弃', '活不下去', '不想活', '不想再活', '结束生命', '结束自己',
  '自杀', '自傷', '自伤', '自殘', '自残', '伤害自己', '傷害自己', '杀了自己',
  '失去信仰', '看不见神', '神在哪里', '抛弃',
  'suicide', 'suicidal', 'kill myself', 'end my life', 'self-harm', 'self harm',
]

export function checkSOSKeywords(text) {
  if (!text) return false
  const normalized = String(text).toLowerCase()
  return SOS_KEYWORDS.some((keyword) => normalized.includes(keyword.toLowerCase()))
}
