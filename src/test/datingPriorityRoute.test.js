import { describe, expect, it } from 'vitest'
import {
  DATING_PRIORITY_PATH,
  isDatingPriorityPath,
} from '../datingPriorityRoute'

describe('dating priority standalone route', () => {
  it('recognizes the canonical path with or without a trailing slash', () => {
    expect(DATING_PRIORITY_PATH).toBe('/desire-survey')
    expect(isDatingPriorityPath('/desire-survey')).toBe(true)
    expect(isDatingPriorityPath('/desire-survey/')).toBe(true)
  })

  it('does not treat the home page or similar paths as the survey', () => {
    expect(isDatingPriorityPath('/')).toBe(false)
    expect(isDatingPriorityPath('/desire-survey-results')).toBe(false)
    expect(isDatingPriorityPath('/dating-priority')).toBe(false)
  })
})
