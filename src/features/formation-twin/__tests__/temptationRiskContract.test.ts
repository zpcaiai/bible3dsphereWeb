import { describe, expect, it } from 'vitest'
import {
  CYCLE_STAGES,
  GENERIC_PROTECTION_NOTIFICATION,
  PROTECTION_ROUTES,
  hasProhibitedRiskFields,
  isPrivateDraft,
  protectionNotification,
  temptationIsBehavior,
} from '../temptationRiskContract'

describe('temptation risk contract', () => {
  it('keeps temptation and behavior as separate stages', () => {
    expect(CYCLE_STAGES).toContain('TEMPTATION')
    expect(temptationIsBehavior('TEMPTATION')).toBe(false)
    expect(temptationIsBehavior('BEHAVIOR_INITIATION')).toBe(true)
  })

  it('exposes the complete protection-center route contract', () => {
    expect(PROTECTION_ROUTES).toHaveLength(10)
    expect(PROTECTION_ROUTES).toContain('/formation-twin/protection/recovery')
    expect(PROTECTION_ROUTES).toContain('/formation-twin/protection/plans/[id]')
  })

  it('blocks scoring, internal bands and sensitive routing fields', () => {
    expect(hasProhibitedRiskFields({ relapse_probability: 0.8 })).toBe(true)
    expect(hasProhibitedRiskFields({ internal_risk_band: 'MULTIPLE_CONDITIONS' })).toBe(true)
    expect(hasProhibitedRiskFields({ action_type: 'LEAVE_ENVIRONMENT' })).toBe(false)
  })

  it('keeps sensitive notifications generic and support drafts private', () => {
    expect(protectionNotification('今晚有复发提醒')).toBe(GENERIC_PROTECTION_NOTIFICATION)
    expect(isPrivateDraft({ delivery_status: 'DRAFT', user_confirmed: false })).toBe(true)
    expect(isPrivateDraft({ delivery_status: 'SENT', user_confirmed: true })).toBe(false)
  })
})
