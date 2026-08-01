import { describe, expect, it } from 'vitest'
import {
  BATCHES,
  MODULE_MANIFEST,
  TRACKS,
  assessAiRole,
  createFormationPlan,
  evaluateReleaseEvidence,
  filterApprovedContent,
  recommendTrack,
  validateLearnerContext,
} from '../program'

describe('AI formation program contracts', () => {
  it('registers one module, four tracks and twelve ordered batches', () => {
    expect(MODULE_MANIFEST.moduleId).toBe('sunday_school.ai_formation')
    expect(MODULE_MANIFEST.route).toBe('/sunday-school/ai-formation')
    expect(TRACKS).toHaveLength(4)
    expect(BATCHES.map((item) => item.id)).toEqual(Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0')))
  })

  it('requires guardian confirmation for minors and rejects unknown fields', () => {
    const base = { role: 'learner', age_band: '13_15', goals: ['ai_discernment'], consent: { data_minimization_accepted: true, guardian_confirmed: true } }
    expect(validateLearnerContext(base).version).toBe('1.0.0')
    expect(() => validateLearnerContext({ ...base, hiddenProfile: 'x' })).toThrow(/unknown/i)
    expect(() => validateLearnerContext({ ...base, consent: { data_minimization_accepted: true, guardian_confirmed: false } })).toThrow(/guardian/i)
    expect(recommendTrack(validateLearnerContext(base))).toBe('child_youth_formation')
  })

  it('caps plans at approved horizons and three practices without scoring', () => {
    const plan = createFormationPlan({ horizonDays: 30, priorityDomains: ['attention', 'rest'], practiceIds: ['attention.pause', 'body.rest'], startsOn: '2026-07-31' })
    expect(plan.spiritual_score_generated).toBe(false)
    expect(plan.grace_before_practice).toBe(true)
    expect(() => createFormationPlan({ horizonDays: 21, priorityDomains: ['attention'], practiceIds: ['x'], startsOn: '2026-07-31' })).toThrow(/horizon/i)
    expect(() => createFormationPlan({ horizonDays: 30, priorityDomains: ['a'], practiceIds: ['1', '2', '3', '4'], startsOn: '2026-07-31' })).toThrow(/three/i)
  })

  it('keeps final moral and divine authority human-owned', () => {
    expect(assessAiRole({ requestedRole: 'divine_messenger', stakes: 'high' })).toMatchObject({ decision: 'prohibited_substitution', finalDecisionOwner: 'human' })
    expect(assessAiRole({ requestedRole: 'verifier', stakes: 'medium' })).toMatchObject({ decision: 'assist_with_human_ownership', finalDecisionOwner: 'human' })
  })

  it('publishes only explicitly approved versions and fails release closed', () => {
    expect(filterApprovedContent([
      { id: 'draft', reviewStatus: 'theology_review' },
      { id: 'approved', reviewStatus: 'approved', publishedAt: '2026-07-31T00:00:00Z' },
    ]).map((item) => item.id)).toEqual(['approved'])
    expect(evaluateReleaseEvidence([])).toMatchObject({ status: 'NOT_CERTIFIED', automatedApproval: false })
  })
})
