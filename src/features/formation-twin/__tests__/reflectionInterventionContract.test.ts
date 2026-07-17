import { describe, expect, it } from 'vitest'
import {
  CAPACITY_MODES,
  INTERVENTION_DECISIONS,
  hasSensitiveRoutingFields,
  isConsentGatedProposal,
} from '../reflectionInterventionContract'

describe('reflection intervention contract', () => {
  it('keeps explicit capacity and user-decision options', () => {
    expect(CAPACITY_MODES).toEqual(['MICRO_ONLY', 'NORMAL', 'REFLECTION_ONLY', 'STORE_ONLY'])
    expect(INTERVENTION_DECISIONS).toContain('smaller')
    expect(INTERVENTION_DECISIONS).toContain('no-action')
  })

  it('requires confirmation and no hidden reminder', () => {
    expect(isConsentGatedProposal({ required_user_confirmation: true, reminder_enabled: false })).toBe(true)
    expect(isConsentGatedProposal({ required_user_confirmation: true, reminder_enabled: true as false })).toBe(false)
  })

  it('rejects sensitive and spiritual-scoring routing fields', () => {
    expect(hasSensitiveRoutingFields({ journal_text: 'secret' })).toBe(true)
    expect(hasSensitiveRoutingFields({ obedience_score: 1 })).toBe(true)
    expect(hasSensitiveRoutingFields({ action_type: 'REST', duration_minutes: 1 })).toBe(false)
  })
})
