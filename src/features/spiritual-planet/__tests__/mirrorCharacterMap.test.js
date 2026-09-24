import { describe, expect, it } from 'vitest'
import { MIRROR_CHARACTERS } from '../../../mirrorData'
import {
  DIGITAL_HUMAN_MIRROR_CHARACTER_COUNT,
  MIRROR_DIGITAL_HUMAN_IDS,
  getMirrorDigitalHumanId,
} from '../digital-human/mirrorCharacterMap'

describe('100-person Mirror to digital-human identity bridge', () => {
  it('maps all 100 canonical digital humans to existing, unique Mirror cards', () => {
    const entries = Object.entries(MIRROR_DIGITAL_HUMAN_IDS)
    const mirrorIds = new Set(MIRROR_CHARACTERS.map((character) => character.id))
    const characterIds = entries.map(([, characterId]) => characterId)

    expect(entries).toHaveLength(DIGITAL_HUMAN_MIRROR_CHARACTER_COUNT)
    expect(new Set(characterIds).size).toBe(DIGITAL_HUMAN_MIRROR_CHARACTER_COUNT)
    expect(entries.every(([mirrorId]) => mirrorIds.has(Number(mirrorId)))).toBe(true)
  })

  it('keeps same-name and similarly named people on distinct stable identities', () => {
    expect(getMirrorDigitalHumanId({ id: 11, name: '约瑟' })).toBe('joseph')
    expect(getMirrorDigitalHumanId({ id: 99, name: '约瑟（耶稣父亲）' })).toBe('joseph_of_nazareth')
    expect(getMirrorDigitalHumanId({ id: 466, name: '亚利马太的约瑟' })).toBe('joseph_arimathea')
    expect(getMirrorDigitalHumanId({ id: 213, name: '腓力' })).toBe('philip_apostle')
    expect(getMirrorDigitalHumanId({ id: 796, name: '腓利（传福音者）' })).toBe('philip_evangelist')
  })

  it('does not turn Jesus or unreviewed lookalike names into an ordinary role-play avatar', () => {
    expect(getMirrorDigitalHumanId({ id: 274, name: '耶稣基督' })).toBeNull()
    expect(getMirrorDigitalHumanId({ id: 335, name: 'David Livingstone 大卫·李文斯顿' })).toBeNull()
    expect(getMirrorDigitalHumanId({ name: '大卫' })).toBeNull()
  })
})
