import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import FormationTwinFormation from '../FormationTwinFormation'
import * as api from '../formationTwinApi'

vi.mock('../formationTwinApi', () => ({
  addFormationChainEdge: vi.fn(), addFormationChainNode: vi.fn(),
  bulkDismissFormationReviews: vi.fn(), createFormationChain: vi.fn(), createFormationNode: vi.fn(),
  deleteFormationChain: vi.fn(), deleteFormationNode: vi.fn(), duplicateFormationChain: vi.fn(),
  getFormationContext: vi.fn(), getFormationDataQuality: vi.fn(), getFormationGraphStatus: vi.fn(),
  getFormationSettings: vi.fn(), getFormationState: vi.fn(), listFormationChains: vi.fn(),
  listFormationNodes: vi.fn(), listFormationReviewQueue: vi.fn(), rebuildFormationState: vi.fn(),
  removeFormationChainEdge: vi.fn(), removeFormationChainNode: vi.fn(),
  reviewFormationNode: vi.fn(), setFormationChainStatus: vi.fn(), syncFormationChainGraph: vi.fn(),
  updateFormationChain: vi.fn(), updateFormationSettings: vi.fn(),
}))

const snapshot = {
  data_status: 'AVAILABLE',
  user_reported_items: [{ id: 'u1', node_type: 'BELIEF_STATEMENT', content: '我主动写下的信念', source_kind: 'USER_REPORT', scope: 'THIS_EVENT_ONLY' }],
  observed_relations: [{ id: 'o1', node_type: 'LIFE_EVENT', content: '记录到一次生命事件', source_kind: 'OBSERVATION', scope: 'THIS_EVENT_ONLY' }],
  confirmed_patterns: [],
  pending_hypotheses: [{ id: 'm1', node_type: 'DESIRE', content: '可能的候选', source_kind: 'MODEL', statement_type: 'MODEL_FORMATION_HYPOTHESIS', scope: 'THIS_EVENT_ONLY', confidence: .61, alternatives: ['也可能只是当时很疲倦'] }],
  grace_and_recovery: [], reflective_questions: [], limitations: ['不判断救恩或神的旨意。'],
  record_coverage: { active_nodes: 3, active_chains: 1 },
}

describe('FormationTwinFormation', () => {
  beforeEach(() => {
    api.getFormationState.mockResolvedValue({ snapshot })
    api.getFormationDataQuality.mockResolvedValue({ quality_passed: true })
    api.listFormationNodes.mockResolvedValue({ items: [] })
    api.listFormationChains.mockResolvedValue({ items: [] })
    api.listFormationReviewQueue.mockResolvedValue({ items: snapshot.pending_hypotheses })
    api.createFormationNode.mockResolvedValue({ ok: true, node_id: 'new' })
    api.rebuildFormationState.mockResolvedValue({ ok: true, status: 'REBUILT', nodes_created: 3, chains_created: 1 })
  })
  afterEach(() => { cleanup(); vi.clearAllMocks() })

  it('keeps reports, observations, model candidates, and confirmations in separate sections', async () => {
    render(<FormationTwinFormation />)
    expect(await screen.findByText('我主动写下的信念')).toBeTruthy()
    expect(screen.getByText('事实与规则关联')).toBeTruthy()
    expect(screen.getByText('等待我审阅的候选')).toBeTruthy()
    expect(screen.getByText('模型候选，待确认')).toBeTruthy()
    expect(document.body.textContent).not.toContain('属灵分数')
  })

  it('stores a manual belief as the user report without confidence', async () => {
    render(<FormationTwinFormation />)
    fireEvent.click(screen.getByRole('tab', { name: '身份与信念' }))
    await screen.findByText('这里还没有记录。上面的引导问题只是邀请，不会自动生成结论。')
    fireEvent.change(screen.getByRole('combobox', { name: '记录类型' }), { target: { value: 'BELIEF_STATEMENT' } })
    fireEvent.change(screen.getByRole('textbox', { name: '你当时明确相信或想到什么？' }), { target: { value: '我担心自己会失败' } })
    fireEvent.click(screen.getByRole('button', { name: '按我的表达保存' }))
    await waitFor(() => expect(api.createFormationNode).toHaveBeenCalledWith({ node_type: 'BELIEF_STATEMENT', content: '我担心自己会失败', scope: 'THIS_EVENT_ONLY' }))
  })

  it('does not rebuild until the user explicitly requests it', async () => {
    render(<FormationTwinFormation />)
    expect(api.rebuildFormationState).not.toHaveBeenCalled()
    fireEvent.click(await screen.findByRole('button', { name: '从授权事件重建' }))
    await waitFor(() => expect(api.rebuildFormationState).toHaveBeenCalledTimes(1))
  })
})
