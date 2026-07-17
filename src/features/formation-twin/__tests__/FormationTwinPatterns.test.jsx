import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { setRuntimeLang } from '../../../i18n/runtime'
import FormationTwinPatterns from '../FormationTwinPatterns'
import { reviewFormationPattern } from '../formationTwinApi'

vi.mock('../formationTwinApi', () => ({
  completePatternReview: vi.fn(async () => ({ ok: true })),
  createLifeSeason: vi.fn(async () => ({ ok: true })),
  generatePatternReview: vi.fn(async () => ({ ok: true })),
  getCurrentFormationPatterns: vi.fn(async () => ({ patterns: [] })),
  listFormationPatternCandidates: vi.fn(async () => ({ patterns: [] })),
  listFormationTrajectories: vi.fn(async () => ({ trajectories: [] })),
  listLifeSeasons: vi.fn(async () => ({ life_seasons: [] })),
  listPatternReviews: vi.fn(async () => ({ reviews: [] })),
  rebuildFormationPatterns: vi.fn(async () => ({ ok: true })),
  reviewFormationPattern: vi.fn(async () => ({ ok: true })),
  setLifeSeasonActive: vi.fn(async () => ({ ok: true })),
  skipPatternReview: vi.fn(async () => ({ ok: true })),
}))

const pattern = {
  id: 'p-1',
  title: '受到压力后延长工作时间',
  description: '在当前项目阶段，多条记录出现相似的形成链结构。',
  pattern_type: 'TRIGGER_RESPONSE_PATTERN',
  lifecycle_status: 'CONFIRMED_CONTEXTUAL',
  scope: { scope_kind: 'LIFE_SEASON_SPECIFIC', user_description: '只适用于当前项目阶段' },
  confidence: { level: 'MODERATE', rationale: ['三组独立证据'] },
  first_observed_at: '2026-06-01T00:00:00Z',
  last_observed_at: '2026-07-10T00:00:00Z',
  review_due_at: '2026-08-10T00:00:00Z',
  supporting_evidence: [{ id: 'e-1', explanation: '用户确认的形成链', source_record_type: 'FORMATION_CHAIN', occurred_at: '2026-07-10T00:00:00Z' }],
  counterevidence: [{ id: 'e-2', explanation: '同样压力下选择了沟通', source_record_type: 'LIFE_EVENT', occurred_at: '2026-07-12T00:00:00Z' }],
  alternative_explanations: ['现实任务量也可能增加。'],
  limitations: ['主要记录来自当前项目阶段。'],
}

const emptyData = { current: [], candidates: [], trajectories: [], seasons: [], reviews: [] }

describe('FormationTwinPatterns', () => {
  beforeEach(() => {
    setRuntimeLang('zh')
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
    setRuntimeLang('zh')
  })

  it('shows scope, supporting evidence and counterevidence without a spiritual score', () => {
    render(<FormationTwinPatterns user={{ id: 'u-1' }} initialData={{ ...emptyData, current: [pattern] }} />)

    expect(screen.getByText('受到压力后延长工作时间')).toBeTruthy()
    expect(screen.getByText('只适用于当前项目阶段')).toBeTruthy()
    expect(screen.getByText('用户确认的形成链')).toBeTruthy()
    expect(screen.getByText('同样压力下选择了沟通')).toBeTruthy()
    expect(document.body.textContent).not.toContain('属灵成长百分比')
    expect(document.body.textContent).not.toContain('人格弱点排行')
  })

  it('keeps candidate separate and sends an explicit user confirmation', async () => {
    const candidate = { ...pattern, id: 'candidate-1', lifecycle_status: 'PENDING_USER_REVIEW' }
    render(<FormationTwinPatterns user={{ id: 'u-1' }} initialData={{ ...emptyData, candidates: [candidate] }} />)

    fireEvent.click(screen.getByRole('button', { name: '待我确认' }))
    fireEvent.click(screen.getByRole('button', { name: '这符合我' }))

    await waitFor(() => expect(reviewFormationPattern).toHaveBeenCalledWith('candidate-1', 'confirm', {}))
  })

  it('exposes all required internal information architecture routes', () => {
    render(<FormationTwinPatterns user={{ id: 'u-1' }} initialData={emptyData} />)
    const routes = Array.from(document.querySelectorAll('[data-route]')).map((node) => node.dataset.route)
    expect(routes).toEqual(expect.arrayContaining([
      '/formation-twin/patterns/current', '/formation-twin/patterns/candidates',
      '/formation-twin/trajectories', '/formation-twin/life-seasons',
      '/formation-twin/reviews', '/formation-twin/evidence',
    ]))
  })

  it('shows an honest insufficient-data state instead of inventing a curve', () => {
    render(<FormationTwinPatterns user={{ id: 'u-1' }} initialData={emptyData} />)
    expect(screen.getByText('目前没有已确认的长期模式')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '形成轨迹' }))
    expect(screen.getByText('数据不足，暂不绘制轨迹')).toBeTruthy()
  })
})
