import { describe, expect, it } from 'vitest'
import {
  DATING_PRIORITY_PATH,
  isDatingPriorityPath,
} from '../datingPriorityRoute'

describe('dating priority standalone route', () => {
  it('recognizes the canonical path with or without a trailing slash', () => {
    expect(DATING_PRIORITY_PATH).toBe('/dating-priority')
    expect(isDatingPriorityPath('/dating-priority')).toBe(true)
    expect(isDatingPriorityPath('/dating-priority/')).toBe(true)
  })

  it('does not treat the home page or similar paths as the survey', () => {
    expect(isDatingPriorityPath('/')).toBe(false)
    expect(isDatingPriorityPath('/dating-priority-results')).toBe(false)
  })
})
