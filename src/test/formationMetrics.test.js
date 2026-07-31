import { describe, expect, it } from 'vitest'
import { resolveFormationMetric } from '../lib/formationMetrics'

describe('resolveFormationMetric', () => {
  it('prefers the latest complete analysis result', () => {
    expect(resolveFormationMetric(
      { formation: { formation_score: 0.62, drift_score: 0.14 } },
      { data_points: 1, formation_curve: [{ formation_score: 0.48, drift_score: 0.2 }] },
    )).toEqual({ score: 0.62, driftScore: 0.14, source: 'last-result' })
  })

  it('falls back to the latest real dashboard curve point', () => {
    expect(resolveFormationMetric(null, {
      data_points: 2,
      formation_curve: [
        { formation_score: 0.41, drift_score: 0.09 },
        { formation_score: 0.57, drift_score: 0.12 },
      ],
    })).toEqual({ score: 0.57, driftScore: 0.12, source: 'dashboard' })
  })

  it('does not present preview data as the user formation score', () => {
    expect(resolveFormationMetric(null, {
      is_mock: true,
      data_points: 6,
      formation_curve: [{ formation_score: 0.7, drift_score: 0.05 }],
    })).toEqual({ score: null, driftScore: null, source: 'none' })
  })

  it('treats an unknown arc without a numeric metric as no data', () => {
    expect(resolveFormationMetric(
      { formation: { formation_score: 'unknown' } },
      { data_points: 0, formation_arc: 'unknown' },
    )).toEqual({ score: null, driftScore: null, source: 'none' })
  })

  it('keeps a valid zero score', () => {
    expect(resolveFormationMetric(
      { formation: { formation_score: 0, drift_score: 0 } },
      null,
    )).toEqual({ score: 0, driftScore: 0, source: 'last-result' })
  })
})
