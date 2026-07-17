export const CYCLE_STAGES = [
  'TRIGGER', 'VULNERABILITY', 'EMOTIONAL_ESCALATION', 'URGE', 'TEMPTATION',
  'CHOICE_POINT', 'BEHAVIOR_INITIATION', 'BEHAVIOR_CONTINUATION',
  'IMMEDIATE_OUTCOME', 'SHAME_OR_CONCEALMENT', 'ISOLATION', 'RECOVERY',
  'RECONNECTION', 'LEARNING',
] as const

export const WARNING_LEVELS = [
  'NO_WARNING', 'AWARENESS', 'PROTECTION_SUGGESTED',
  'IMMEDIATE_SUPPORT_SUGGESTED', 'CRISIS_HANDOFF',
] as const

export const PROTECTION_ROUTES = [
  '/formation-twin/protection',
  '/formation-twin/protection/current',
  '/formation-twin/protection/cycles',
  '/formation-twin/protection/cycles/[id]',
  '/formation-twin/protection/plans',
  '/formation-twin/protection/plans/[id]',
  '/formation-twin/protection/warnings',
  '/formation-twin/protection/recovery',
  '/formation-twin/protection/support-people',
  '/formation-twin/protection/settings',
] as const

export const GENERIC_PROTECTION_NOTIFICATION = '你有一项可选的保护提醒。'

export type CycleStage = typeof CYCLE_STAGES[number]
export type WarningLevel = typeof WARNING_LEVELS[number]

export interface EarlyWarning {
  id: string
  warning_level: Exclude<WarningLevel, 'NO_WARNING'>
  title: string
  message: string
  active_condition_summaries_json: string[]
  active_protection_summaries_json: string[]
  unknown_conditions_json: string[]
  counterevidence_json: string[]
  uncertainty_notes_json: string[]
  sharing_status: 'PRIVATE' | 'USER_INITIATED'
}

export interface ProtectionAction {
  id: string
  action_type: string
  title: string
  description: string
  target_module: string
  decision_status: string
  user_confirmed: boolean
  sensitive_context_included: false
}

const PROHIBITED_ROUTING_FIELDS = new Set([
  'relapse_probability', 'sin_risk_score', 'purity_score', 'sobriety_rank',
  'obedience_score', 'spiritual_risk_score', 'salvation_probability',
  'journal_text', 'confession_text', 'temptation_text', 'behavior_text',
  'browser_history', 'message_content', 'internal_risk_band', 'third_party_identity',
])

const SENSITIVE_NOTIFICATION_TERMS = [
  '色情', '赌博', '酒精', '复发', '罪', '冲动', '试探',
  'porn', 'gambling', 'relapse', 'temptation', 'urge',
]

export function temptationIsBehavior(stage: CycleStage) {
  return stage === 'BEHAVIOR_INITIATION' || stage === 'BEHAVIOR_CONTINUATION'
}

export function hasProhibitedRiskFields(payload: Record<string, unknown>) {
  return Object.keys(payload).some((key) => PROHIBITED_ROUTING_FIELDS.has(key.toLowerCase()))
}

export function protectionNotification(content: string) {
  const normalized = content.toLowerCase()
  return SENSITIVE_NOTIFICATION_TERMS.some((item) => normalized.includes(item.toLowerCase()))
    ? GENERIC_PROTECTION_NOTIFICATION
    : content
}

export function isPrivateDraft(request: { delivery_status?: string; user_confirmed?: boolean }) {
  return request.delivery_status === 'DRAFT' && request.user_confirmed !== true
}
