import { describe, expect, it } from 'vitest'
import { buildFormationTwinSnapshot, FORMATION_TWIN_INTEGRATIONS } from '../formationTwinModel'

describe('formation twin model', () => {
  it('fails closed when no authorized summary data is available', () => {
    const snapshot = buildFormationTwinSnapshot()

    expect(snapshot.status).toBe('insufficient_data')
    expect(snapshot.facts).toEqual([])
    expect(snapshot.message).toContain('没有足够')
  })

  it('keeps observations and system summaries explicitly separated', () => {
    const snapshot = buildFormationTwinSnapshot({
      dailySnapshot: {
        last_emotion: '焦虑',
        has_devotion_today: false,
        pending_prayers: 2,
        trajectory_label: '正在恢复',
        trajectory_icon: '🌱',
      },
      emotionTrajectory: {
        count: 7,
        dominant_emotion: '盼望',
      },
    })

    expect(snapshot.status).toBe('available')
    expect(snapshot.facts).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'last-emotion', statementType: '用户记录' }),
      expect.objectContaining({ key: 'devotion-today', statementType: '可观察事实', value: '尚未记录' }),
      expect.objectContaining({ key: 'trajectory', statementType: '系统摘要' }),
    ]))
    expect(snapshot.facts.some((fact) => /分数|得救|圣灵同在/.test(fact.label + fact.value))).toBe(false)
  })

  it('connects four formation stages to existing destinations', () => {
    expect(FORMATION_TWIN_INTEGRATIONS.map((group) => group.key)).toEqual(['observe', 'practice', 'review', 'care'])
    expect(FORMATION_TWIN_INTEGRATIONS.flatMap((group) => group.items)).toHaveLength(12)
    expect(FORMATION_TWIN_INTEGRATIONS.flatMap((group) => group.items).map((item) => item.target)).toContain('sos')
  })
})
