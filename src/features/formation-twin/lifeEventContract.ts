export const LIFE_EVENT_TYPES = [
  'DAILY_CHECKIN', 'JOURNAL_ENTRY', 'VOICE_JOURNAL', 'PRAYER_ACTIVITY', 'DEVOTION_ACTIVITY',
  'HABIT_ACTIVITY', 'ATTENTION_ACTIVITY', 'CHURCH_ACTIVITY', 'RELATIONSHIP_EVENT', 'CALLING_ACTIVITY',
  'FORMATION_ACTIVITY', 'CRISIS_STATUS_EVENT', 'USER_CORRECTION', 'EXTERNAL_MODULE_EVENT', 'OTHER',
] as const

export const LIFE_EVENT_STATUSES = [
  'RECEIVED', 'BLOCKED_NO_CONSENT', 'ROUTED_TO_CRISIS', 'ACCEPTED', 'REJECTED', 'QUARANTINED',
  'SUPERSEDED', 'EXCLUDED', 'DELETED',
] as const

export const STATEMENT_TYPES = ['USER_REPORTED_FACT', 'OBSERVED_EVENT', 'USER_CONFIRMED_PATTERN'] as const
export const PROCESSING_PREFERENCES = ['STORE_ONLY', 'ALLOW_FUTURE_ANALYSIS', 'EXCLUDE_FROM_TWIN'] as const

export type LifeEventType = typeof LIFE_EVENT_TYPES[number]
export type LifeEventStatus = typeof LIFE_EVENT_STATUSES[number]
export type StatementType = typeof STATEMENT_TYPES[number]
export type ProcessingPreference = typeof PROCESSING_PREFERENCES[number]

export interface LifeEventSource {
  source_type: string
  source_module: string
  source_record_id?: string | null
  source_event_id?: string | null
  source_version: string
}

export interface CanonicalLifeEvent {
  event_id: string
  tenant_id: string
  profile_id: string
  subject_user_id: string
  event_type: LifeEventType
  event_subtype?: string | null
  event_version: string
  occurred_at: string
  recorded_at: string
  timezone: string
  source: LifeEventSource
  context: Record<string, unknown>
  self_report?: Record<string, unknown> | null
  behavioral_facts: Array<Record<string, unknown>>
  spiritual_practice_facts: Array<Record<string, unknown>>
  relationship_facts: Array<Record<string, unknown>>
  content_reference?: Record<string, unknown> | null
  safety: { screened: boolean; safety_level: 'NONE' | 'CONCERN' | 'ELEVATED' | 'IMMINENT'; route_reference?: string | null }
  consent: { consent_scope: string; policy_version: string; processing_preference: ProcessingPreference }
  provenance: {
    statement_types: StatementType[]
    normalization_version: string
    processing_steps: string[]
    accepted_fields: string[]
    discarded_field_names: string[]
    discarded_values_stored: false
  }
  data_classification: 'HIGHLY_SENSITIVE'
  status: LifeEventStatus
  created_at: string
}

const SENSITIVE_KEYS = new Set([
  'content', 'raw_content', 'full_text', 'journal_text', 'prayer_text', 'transcript', 'crisis_text',
  'private_note', 'confession_text', 'medical_details', 'legal_details', 'method_details',
])

function containsSensitiveKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsSensitiveKey)
  if (!value || typeof value !== 'object') return false
  return Object.entries(value).some(([key, child]) => SENSITIVE_KEYS.has(key) || containsSensitiveKey(child))
}

export function validateCanonicalLifeEvent(event: CanonicalLifeEvent): boolean {
  if (!LIFE_EVENT_TYPES.includes(event.event_type) || !LIFE_EVENT_STATUSES.includes(event.status)) return false
  if (!event.event_version || !event.source.source_version || !event.provenance.normalization_version) return false
  if (!event.occurred_at.includes('T') || Number.isNaN(Date.parse(event.occurred_at))) return false
  if (!event.recorded_at.includes('T') || Number.isNaN(Date.parse(event.recorded_at))) return false
  if (!event.provenance.statement_types.length || event.provenance.statement_types.some((item) => !STATEMENT_TYPES.includes(item))) return false
  return !containsSensitiveKey([
    event.self_report, event.behavioral_facts, event.spiritual_practice_facts, event.relationship_facts,
  ])
}
