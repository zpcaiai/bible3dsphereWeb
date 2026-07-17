export const CAPACITY_MODES = ['MICRO_ONLY', 'NORMAL', 'REFLECTION_ONLY', 'STORE_ONLY'] as const
export const INTERVENTION_DECISIONS = ['accept', 'modify', 'alternative', 'defer', 'skip', 'reject', 'smaller', 'no-action'] as const
export const TARGET_MODULES = [
  'FORMATION_ENGINE', 'PRAYER_OS', 'HOLY_HABIT_ENGINE', 'ATTENTION_OS', 'REST',
  'RELATIONAL_SUPPORT', 'PROFESSIONAL_SUPPORT', 'CRISIS_CARE', 'NO_ACTION',
] as const

export type CapacityMode = typeof CAPACITY_MODES[number]
export type InterventionDecision = typeof INTERVENTION_DECISIONS[number]
export type InterventionTargetModule = typeof TARGET_MODULES[number]

export interface ReflectionSourceReference {
  reference_type: string
  reference_id: string
}

export interface ReflectionMirror {
  id: string
  headline: string
  mirror_text: string
  source_references_json: ReflectionSourceReference[]
  limitations_json: string[]
  status: string
}

export interface InterventionProposal {
  id: string
  intervention_type: string
  title: string
  description: string
  rationale: string
  estimated_duration_minutes: number
  effort_level: string
  target_module: InterventionTargetModule
  required_user_confirmation: true
  one_time: boolean
  reminder_enabled: false
  decision_status: string
}

export interface EffectReviewInput {
  execution_status: 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'NOT_STARTED' | 'STOPPED' | 'FORGOTTEN' | 'NO_LONGER_RELEVANT' | 'DECLINED_AFTER_ACCEPTANCE' | 'UNKNOWN'
  helpfulness?: 'NOT_HELPFUL' | 'SLIGHTLY_HELPFUL' | 'HELPFUL' | 'VERY_HELPFUL' | 'UNCERTAIN'
  burden?: 'VERY_LOW' | 'LOW' | 'ACCEPTABLE' | 'HIGH' | 'TOO_HIGH'
  preferred_adjustment?: string
}

export function isConsentGatedProposal(value: Partial<InterventionProposal>) {
  return value.required_user_confirmation === true && value.reminder_enabled === false
}

export function hasSensitiveRoutingFields(payload: Record<string, unknown>) {
  const forbidden = new Set([
    'journal_text', 'prayer_text', 'confession_text', 'temptation_text', 'voice_transcript',
    'crisis_text', 'third_party_identity', 'full_formation_chain', 'spiritual_growth_score',
    'obedience_score', 'salvation_probability',
  ])
  return Object.keys(payload).some((key) => forbidden.has(key.toLowerCase()))
}
