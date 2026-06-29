import { describe, it, expect } from 'vitest'
import { computeHorariumStreak, createHorariumDayLog, ensureHorariumEntries } from '../lib/horarium'
import { horariumHours } from '../data/horariumHours'
import type { HorariumDayLog } from '../types/spiritualFormation'

function logForDate(date: string, completedHourIds: string[]): HorariumDayLog {
  const base = createHorariumDayLog('u1', date)
  return {
    ...base,
    entries: base.entries.map((entry) =>
      completedHourIds.includes(entry.hourId) ? { ...entry, completed: true } : entry,
    ),
  }
}

describe('horarium hours data', () => {
  it('has six canonical hours with unique ids', () => {
    expect(horariumHours).toHaveLength(6)
    expect(new Set(horariumHours.map((h) => h.id)).size).toBe(6)
  })
})

describe('computeHorariumStreak', () => {
  const today = new Date('2026-06-29T08:00:00')

  it('returns zeros when nothing is completed', () => {
    const logs = [logForDate('2026-06-29', [])]
    expect(computeHorariumStreak(logs, today)).toEqual({ current: 0, longest: 0, total: 0 })
  })

  it('counts consecutive days back from today', () => {
    const logs = [
      logForDate('2026-06-29', ['third_hour']),
      logForDate('2026-06-28', ['evening']),
      logForDate('2026-06-27', ['compline']),
      logForDate('2026-06-24', ['early_morning']),
    ]
    expect(computeHorariumStreak(logs, today)).toEqual({ current: 3, longest: 3, total: 4 })
  })

  it('does not reset the streak when today is not yet done (counts from yesterday)', () => {
    const logs = [
      logForDate('2026-06-28', ['third_hour']),
      logForDate('2026-06-27', ['third_hour']),
    ]
    expect(computeHorariumStreak(logs, today)).toEqual({ current: 2, longest: 2, total: 2 })
  })

  it('tracks the longest run separately from the current run', () => {
    const logs = [
      logForDate('2026-06-29', ['third_hour']),
      logForDate('2026-06-20', ['third_hour']),
      logForDate('2026-06-19', ['third_hour']),
      logForDate('2026-06-18', ['third_hour']),
    ]
    const result = computeHorariumStreak(logs, today)
    expect(result.current).toBe(1)
    expect(result.longest).toBe(3)
    expect(result.total).toBe(4)
  })
})

describe('ensureHorariumEntries', () => {
  it('fills in all hours even if some are missing', () => {
    const partial = { ...createHorariumDayLog('u1', '2026-06-29'), entries: [] as HorariumDayLog['entries'] }
    const fixed = ensureHorariumEntries(partial)
    expect(fixed.entries).toHaveLength(horariumHours.length)
  })
})
