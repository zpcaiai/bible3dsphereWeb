import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { MIRROR_CHARACTERS, MIRROR_THEMES } from '../mirrorData'
import catalogueJson from '../mirrorData.json?raw'

describe('lazy mirror catalogue data integrity', () => {
  it('preserves every field and entry of the original catalogue', () => {
    const catalogue = { MIRROR_CHARACTERS, MIRROR_THEMES }
    expect(catalogue).toEqual(JSON.parse(catalogueJson))
    expect(MIRROR_CHARACTERS).toHaveLength(718)
    expect(MIRROR_THEMES).toHaveLength(15)
    // Digest of the canonical exports captured before the cold-start repair.
    expect(createHash('sha256').update(JSON.stringify(catalogue)).digest('hex'))
      .toBe('5c3e22047327a00d2b1e97c7dcbe105076db9bf3e8a2e22799dc42f4640ffe77')
  })
})
