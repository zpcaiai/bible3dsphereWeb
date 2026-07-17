export const EMOTION_SOURCE_KINDS = ['USER_REPORT', 'RULE', 'MODEL', 'USER_CONFIRMED'] as const
export const EMOTION_STATEMENT_TYPES = ['USER_REPORTED_FACT', 'RULE_DERIVED_METRIC', 'MODEL_INFERENCE', 'USER_CONFIRMED_INFERENCE'] as const
export type EmotionSourceKind = typeof EMOTION_SOURCE_KINDS[number]
export type EmotionStatementType = typeof EMOTION_STATEMENT_TYPES[number]

export interface EmotionObservation {
  id: string; emotion_label: string; custom_label?: string | null; intensity?: number | null
  source_kind: EmotionSourceKind; statement_type: EmotionStatementType; occurred_at: string
  confidence?: number | null; model_version?: string | null; prompt_version?: string | null
  rule_version?: string | null; evidence: Array<{ start_offset?: number; end_offset?: number }>
  user_review_status: string; processing_status: string; life_event_id?: string | null
}

export interface EmotionalSnapshot {
  id: string; snapshot_type: 'CURRENT_EMOTIONAL_STATE'|'DAILY_EMOTIONAL_SUMMARY'|'WEEKLY_EMOTIONAL_TREND'
  window_start: string; window_end: string; data_status: 'AVAILABLE'|'INSUFFICIENT_DATA'
  data_coverage: { observed_days:number; expected_days:number; coverage:number }
  user_reported: Record<string, unknown>; rule_derived: Record<string, unknown>
  possible_model_candidates: EmotionObservation[]; uncertainty: string[]; limitations: string[]
  version: number; engine_version: string
}

export function isGovernedEmotionObservation(value: EmotionObservation): boolean {
  if (!EMOTION_SOURCE_KINDS.includes(value.source_kind) || !EMOTION_STATEMENT_TYPES.includes(value.statement_type)) return false
  if (value.source_kind === 'USER_REPORT' && value.confidence != null) return false
  if (value.source_kind === 'MODEL' && (!value.model_version || !value.evidence?.length || value.user_review_status === 'NOT_REQUIRED')) return false
  if (value.source_kind === 'RULE' && !value.rule_version) return false
  return true
}
