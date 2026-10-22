const GROUNDING_LEVELS = new Set([
  'G5_DIRECT_SCRIPTURE', 'G4_STRONG_SCRIPTURAL_FACT', 'G3_SCRIPTURAL_INFERENCE',
  'G2_HISTORICAL_RECONSTRUCTION', 'G1_INTERPRETIVE_POSSIBILITY', 'G0_UNSUPPORTED',
])

export function validateDigitalHumanResponse(value, expectedCharacterId) {
  if (!value || typeof value !== 'object') throw new Error('数字人物响应不是对象')
  if (value.characterId !== expectedCharacterId) throw new Error('人物身份与当前 Avatar 不一致')
  if (typeof value.speechApproved !== 'boolean') throw new Error('发声许可必须是明确布尔值')
  if (!['DRAFT', 'THEOLOGY_REVIEW', 'APPROVED', 'WITHDRAWN'].includes(value.contentReviewState)) throw new Error('内容审核状态无效')
  if (!['FACT', 'EVENT', 'THEOLOGY', 'DEVOTIONAL', 'UNSUPPORTED'].includes(value.answerType)) throw new Error('回答类型无效')
  if (typeof value.spokenText !== 'string' || !value.spokenText.trim() || value.spokenText.length > 2400
    || typeof value.displayText !== 'string' || !value.displayText.trim() || value.displayText.length > 4000) throw new Error('回答正文无效')
  if (!GROUNDING_LEVELS.has(value.groundingLevel)) throw new Error('未知的经文证据等级')
  if (!Array.isArray(value.references) || !Array.isArray(value.warnings)) throw new Error('响应缺少证据或警告字段')
  if (value.references.length > 24 || value.warnings.length > 24 || value.references.some((item) =>
    !['SCRIPTURE', 'HISTORY', 'COMMENTARY', 'INTERNAL_REVIEW'].includes(item?.sourceType)
      || typeof item?.locator !== 'string' || !item.locator.trim() || item.locator.length > 120
      || !['DIRECT', 'STRONG', 'INFERRED', 'CONTEXT_ONLY'].includes(item?.claimSupport))) throw new Error('证据结构无效')
  if (value.groundingLevel === 'G0_UNSUPPORTED' && value.answerType !== 'UNSUPPORTED') throw new Error('无证据内容不得作为事实输出')
  if (['G5_DIRECT_SCRIPTURE', 'G4_STRONG_SCRIPTURAL_FACT'].includes(value.groundingLevel)
      && !value.references.some((item) => item?.sourceType === 'SCRIPTURE' && item?.locator)) {
    throw new Error('高等级回答缺少可定位经文')
  }
  if (value.speechApproved && value.contentReviewState !== 'APPROVED') throw new Error('未审核内容不得发声')
  if (value.speechApproved && value.groundingLevel === 'G0_UNSUPPORTED') throw new Error('无证据内容不得发声')
  if (!/^[a-f0-9]{64}$/.test(value.contentSha256 || '')) throw new Error('内容版本未绑定有效哈希')
  return value
}

export function validateCharacterProfile(value) {
  if (!value || typeof value !== 'object' || !/^[a-z0-9_-]+$/.test(value.id || '')) throw new Error('人物配置无效')
  if (!value.avatar || !value.voice || !Array.isArray(value.recommendedQuestions)) throw new Error('人物配置不完整')
  if (value.runtimeReady) {
    if (value.avatar.reviewState !== 'APPROVED' || value.voice.reviewState !== 'APPROVED') throw new Error('未审核资产不能进入运行态')
    if (!value.avatar.modelUrl || !value.voice.voiceId) throw new Error('运行态人物缺少 Avatar 或 Voice')
  }
  return value
}
