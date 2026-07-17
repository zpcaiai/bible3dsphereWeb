export const PLATFORM_PROJECTIONS = {
  prayer_context_v1: ['user_selected_prayer_needs', 'confirmed_emotional_context', 'confirmed_fears', 'grace_factors', 'selected_scripture_themes'],
  habit_context_v1: ['user_selected_goal', 'capacity_mode', 'preferred_duration_minutes', 'blocked_intervention_types', 'confirmed_alternative_response'],
  attention_context_v1: ['user_confirmed_attention_pattern', 'preferred_boundary_type', 'risk_time_window', 'sensitive_reason_included'],
  calling_context_v1: ['active_life_seasons', 'user_confirmed_gifts', 'service_experience', 'capacity_constraints', 'unresolved_calling_questions'],
  church_context_v1: ['participation_goals', 'relationship_support_needs', 'pastoral_conversation_questions', 'church_experience_summaries'],
  mission_context_v1: ['confirmed_calling_directions', 'equipping_progress', 'language_culture_preparation', 'family_health_readiness', 'user_shared_constraints'],
} as const

export const UNIFIED_ACTION_STATUSES = [
  'PROPOSED', 'CONFIRMED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED',
  'PARTIAL', 'SKIPPED', 'STOPPED', 'CANCELLED', 'EXPIRED',
] as const

export type UnifiedActionStatus = typeof UNIFIED_ACTION_STATUSES[number]

export interface UnifiedActionReference {
  id: string
  source_module: string
  source_record_id: string
  title: string
  action_type: string
  status: UnifiedActionStatus
  estimated_duration_minutes?: number | null
  focus_action?: boolean
}

export interface UnifiedTimelineReference {
  source_module: string
  source_record_type: string
  source_record_id: string
  event_type: string
  occurred_at?: string | null
  display_route: string
}
