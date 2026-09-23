import { describe, expect, it } from 'vitest'
import { validateDigitalHumanResponse } from '../digital-human/contracts'

const base = {
  characterId: 'david', answerType: 'EVENT', spokenText: '经文记载……', displayText: '经文记载……',
  references: [{ sourceType: 'SCRIPTURE', locator: '1 Samuel 24', claimSupport: 'DIRECT' }],
  groundingLevel: 'G5_DIRECT_SCRIPTURE', warnings: [], contentVersion: '1.3.0',
  contentSha256: 'a'.repeat(64), contentReviewState: 'APPROVED', speechApproved: true,
}

describe('digital-human response gate', () => {
  it('accepts a character-bound grounded response', () => {
    expect(validateDigitalHumanResponse(base, 'david')).toBe(base)
  })

  it('rejects persona and avatar mismatches', () => {
    expect(() => validateDigitalHumanResponse(base, 'paul')).toThrow(/人物身份/)
  })

  it('rejects high-grounding output without scripture', () => {
    expect(() => validateDigitalHumanResponse({ ...base, references: [] }, 'david')).toThrow(/经文/)
  })

  it('rejects speech before human review', () => {
    expect(() => validateDigitalHumanResponse({ ...base, contentReviewState: 'THEOLOGY_REVIEW' }, 'david')).toThrow(/未审核/)
  })
})
