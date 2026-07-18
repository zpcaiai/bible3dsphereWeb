import { describe, expect, it } from 'vitest'
import { checkSOSKeywords } from '../sosKeywords'

describe('checkSOSKeywords', () => {
  it('recognizes explicit Chinese and English crisis language case-insensitively', () => {
    expect(checkSOSKeywords('我最近有自伤的念头')).toBe(true)
    expect(checkSOSKeywords('I might KILL MYSELF')).toBe(true)
    expect(checkSOSKeywords('I need help with SELF-HARM urges')).toBe(true)
    expect(checkSOSKeywords('我今天有些焦虑，想安静祷告')).toBe(false)
  })
})
