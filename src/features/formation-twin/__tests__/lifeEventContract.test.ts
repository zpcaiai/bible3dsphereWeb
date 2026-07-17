import { describe, expect, it } from 'vitest'
import { validateCanonicalLifeEvent, type CanonicalLifeEvent } from '../lifeEventContract'

const sample: CanonicalLifeEvent = {
  event_id: 'c59ce554-6600-42ef-b1ec-1ee51a32d758', tenant_id: 'personal:test@example.com',
  profile_id: 'b5d74b93-b25d-4d05-8a01-fca63fe4bdad', subject_user_id: 'test@example.com',
  event_type: 'DAILY_CHECKIN', event_version: '1.0', occurred_at: '2026-07-17T09:00:00+08:00',
  recorded_at: '2026-07-17T01:01:00+00:00', timezone: 'Asia/Shanghai',
  source: { source_type: 'USER_STRUCTURED_INPUT', source_module: 'formation_twin', source_version: '1.0' },
  context: {}, self_report: { overall_state: 6, statement_type: 'USER_REPORTED_FACT' },
  behavioral_facts: [], spiritual_practice_facts: [], relationship_facts: [],
  safety: { screened: true, safety_level: 'NONE' },
  consent: { consent_scope: 'MANUAL_INPUT_PROCESSING', policy_version: '1.0', processing_preference: 'STORE_ONLY' },
  provenance: { statement_types: ['USER_REPORTED_FACT'], normalization_version: 'life-event-normalizer-1.0', processing_steps: ['schema_validation'], accepted_fields: ['overall_state'], discarded_field_names: [], discarded_values_stored: false },
  data_classification: 'HIGHLY_SENSITIVE', status: 'ACCEPTED', created_at: '2026-07-17T01:01:00+00:00',
}

describe('CanonicalLifeEvent TypeScript contract', () => {
  it('accepts a versioned, explicitly stated event', () => expect(validateCanonicalLifeEvent(sample)).toBe(true))
  it('rejects nested sensitive body and unsupported inference', () => {
    expect(validateCanonicalLifeEvent({ ...sample, self_report: { details: { transcript: 'synthetic secret' } } })).toBe(false)
    expect(validateCanonicalLifeEvent({ ...sample, provenance: { ...sample.provenance, statement_types: ['SYSTEM_INFERENCE' as never] } })).toBe(false)
  })
})
