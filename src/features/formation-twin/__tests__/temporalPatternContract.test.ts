import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('temporal pattern frontend contract', () => {
  it('keeps lifecycle, evidence, scope and trajectory direction explicit', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/features/formation-twin/temporalPatternContract.ts'), 'utf8')
    for (const field of ['lifecycle_status', 'supporting_evidence', 'counterevidence', 'review_due_at', 'scope_kind', 'current_direction']) {
      expect(source).toContain(field)
    }
  })

  it('does not define spiritual or personality score fields', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/features/formation-twin/temporalPatternContract.ts'), 'utf8').toLowerCase()
    for (const field of ['personality_score', 'spiritual_growth_score', 'holiness_score', 'idol_strength', 'sin_severity', 'salvation_probability', 'spiritual_rank']) {
      expect(source).not.toContain(field)
    }
  })
})
