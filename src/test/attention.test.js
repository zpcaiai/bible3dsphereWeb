import { describe, expect, it } from 'vitest'
import { AttentionPull } from '../features/attention/lib/types'
import { getUserLocalDate, stableAttentionReminder } from '../features/attention/lib/date'
import { buildAttentionCovenantSuggestion } from '../features/attention/lib/suggest'
import { mapCovenantDbToDto } from '../features/attention/lib/covenant-service'
import { validateRiskPulls } from '../features/attention/lib/validators'
import { calculateDailySummary, calculateIntensity, WARFARE_PATTERNS, buildPlanDraftFromPattern } from '../features/attention/lib/attention-domain'

describe('attention domain helpers', () => {
  it('validates risk pulls against the enum', () => {
    expect(validateRiskPulls([AttentionPull.FOMO, AttentionPull.ANXIETY])).toEqual(['fomo', 'anxiety'])
    expect(() => validateRiskPulls(['bad_pull'])).toThrow('无效')
  })

  it('formats local date as YYYY-MM-DD with fallback timezone', () => {
    expect(getUserLocalDate(null, new Date('2026-07-09T02:30:00.000Z'))).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('selects stable reminders by date', () => {
    expect(stableAttentionReminder('2026-07-09')).toBe(stableAttentionReminder('2026-07-09'))
  })

  it('generates deterministic fomo and anxiety suggestions', () => {
    expect(buildAttentionCovenantSuggestion({ riskPulls: ['fomo'] }).suggestedDigitalBoundary).toContain('上午不看')
    expect(buildAttentionCovenantSuggestion({ riskPulls: ['anxiety'] }).suggestedSpiritualBoundary).toContain('交托祷告')
  })

  it('maps snake_case covenant rows to camelCase DTOs', () => {
    const dto = mapCovenantDbToDto({
      id: 'c1',
      covenant_date: '2026-07-09',
      primary_offering: '完成守心模块',
      risk_pulls: ['fomo'],
      created_at: '2026-07-09T00:00:00Z',
      updated_at: '2026-07-09T00:00:00Z',
    })
    expect(dto.primaryOffering).toBe('完成守心模块')
    expect(dto.riskPulls).toEqual(['fomo'])
  })

  it('calculates daily ledger summary and top pulls', () => {
    const summary = calculateDailySummary([
      { category: 'mission', durationMinutes: 60, pulls: [] },
      { category: 'captured', durationMinutes: 30, pulls: ['fomo', 'anxiety'] },
      { category: 'captured', durationMinutes: 15, pulls: ['fomo'] },
    ])
    expect(summary.investedMinutes).toBe(60)
    expect(summary.capturedMinutes).toBe(45)
    expect(summary.topPulls[0].pull).toBe('fomo')
  })

  it('maps warfare intensity thresholds', () => {
    expect(calculateIntensity(0)).toBe('none')
    expect(calculateIntensity(1)).toBe('low')
    expect(calculateIntensity(15)).toBe('medium')
    expect(calculateIntensity(35)).toBe('high')
  })

  it('provides nine warfare patterns and plan drafts', () => {
    expect(WARFARE_PATTERNS).toHaveLength(9)
    const draft = buildPlanDraftFromPattern('fomo_information_anxiety')
    expect(draft.title).toContain('守心计划')
    expect(draft.primaryPulls).toContain('fomo')
  })
})
