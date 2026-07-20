import { beforeEach, describe, expect, it } from 'vitest'
import { mccheyneDayKey, mccheyneStreak, readMccheyneProgress, toggleMccheyneSlot } from '../mccheyneProgress'

describe('mccheyneProgress', () => {
  beforeEach(() => window.localStorage.clear())

  it('shares progress by user and isolates different users', () => {
    const date = new Date(2026, 6, 20, 12)
    toggleMccheyneSlot(window.localStorage, 'u1', date, 'f1')
    expect(readMccheyneProgress(window.localStorage, 'u1')[mccheyneDayKey(date)]).toEqual(['f1'])
    expect(readMccheyneProgress(window.localStorage, 'u2')).toEqual({})
  })

  it('counts consecutive fully completed local dates', () => {
    const today = new Date(2026, 6, 20, 12)
    const yesterday = new Date(2026, 6, 19, 12)
    let progress = {}
    for (const date of [today, yesterday]) {
      for (const slot of ['f1', 'f2', 'n1', 'ps']) progress = toggleMccheyneSlot(window.localStorage, 'u1', date, slot)
    }
    expect(mccheyneStreak(progress, today)).toBe(2)
  })
})
