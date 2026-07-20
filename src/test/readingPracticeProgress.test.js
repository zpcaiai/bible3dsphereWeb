import { beforeEach, describe, expect, it } from 'vitest'
import {
  emptyReadingPracticeRecord,
  listReadingPracticeRecords,
  readReadingPracticeRecord,
  readingPracticePercent,
  writeReadingPracticeRecord,
} from '../readingPracticeProgress'

describe('reading practice progress', () => {
  beforeEach(() => window.localStorage.clear())

  it('keeps detailed practice records separated by user, plan, and day', () => {
    const first = writeReadingPracticeRecord(window.localStorage, 'one@example.com', {
      ...emptyReadingPracticeRecord('john21', 'd001'),
      checkedStepIds: ['settle', 'read-0'],
      totalSteps: 5,
      insight: '道成了肉身',
    })
    writeReadingPracticeRecord(window.localStorage, 'two@example.com', {
      ...emptyReadingPracticeRecord('john21', 'd001'),
      checkedStepIds: ['settle'],
      totalSteps: 5,
    })

    expect(readReadingPracticeRecord(window.localStorage, 'one@example.com', 'john21', 'd001')).toMatchObject({
      insight: '道成了肉身',
      checkedStepIds: ['settle', 'read-0'],
    })
    expect(readingPracticePercent(first, 5)).toBe(43)
    expect(listReadingPracticeRecords(window.localStorage, 'one@example.com', 'john21')).toHaveLength(1)
  })

  it('returns a safe empty record when stored data is invalid', () => {
    window.localStorage.setItem('devotion-reading-practice:v1:guest:psalms30:d001', '{broken')
    expect(readReadingPracticeRecord(window.localStorage, 'guest', 'psalms30', 'd001')).toEqual(
      emptyReadingPracticeRecord('psalms30', 'd001'),
    )
  })
})
