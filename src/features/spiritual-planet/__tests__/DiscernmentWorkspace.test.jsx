import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import DiscernmentWorkspace from '../DiscernmentWorkspace'

function response(data, ok = true) {
  return Promise.resolve({ ok, status: ok ? 200 : 400, json: () => Promise.resolve(data) })
}

const report = {
  case_id: 'case-1', review_status: 'ready',
  summary: '材料与功绩主义存在候选关联；这不是人物标签。',
  safety: { status: 'ready', actions: [] },
  observed_claims: [{ claim_id: 'c1', observation: '成功决定价值', evidence_level: 'E1' }],
  worldview_map: { status: 'candidate_map' },
  domain_pack_matches: [{ pack_id: 'meritocracy_successism', name: '功绩主义与成功崇拜', version: '1.0.0', cluster: '经济与欲望', score: 0.62, classification: 'mixed', fair_definition: '把成功变成价值与正当性的证明。', common_grace: ['鼓励责任', '重视努力', '认可贡献'] }],
  pride_hypotheses: [{ hypothesis_id: 'h1', pattern_id: 'competence_justification', name: '能力称义', observation: '我不能失败', interpretation_hypothesis: '能力可能承担身份重量。', evidence_level: 'H1', alternative_explanations: ['现实绩效压力'], counter_evidence_needed: ['能接受帮助'], socratic_follow_up: '失败会说明什么？' }],
  hypothesis_compositions: [], desire_map: [], virality_analysis: null,
  socratic_questions: [{ question_id: 'q1', stage: 'CLARIFY', difficulty: 'D0', text: '你所说的成功具体指什么？', purpose: '澄清', requires_consent: false }],
  gospel_bridge: { status: 'consent_required' }, limitations: [],
  quality_gates: { evidence_labeled: true, no_mind_reading: true, one_question_at_a_time: true },
  trace: [{ state: 'RECEIVED', batch: 1 }, { state: 'READY', batch: 1 }],
}

function installFetch() {
  const mock = vi.fn((url, options = {}) => {
    const path = String(url)
    if (path.endsWith('/discernment/cases') && options.method === 'POST') return response({ ok: true, case: { id: 'case-1', title: '成功与价值', review_status: 'ready' }, report })
    if (path.endsWith('/discernment/cases')) return response({ ok: true, cases: [] })
    if (path.includes('/cases/case-1/dialogue')) return response({ ok: true, session: { session_id: 'session-1', case_id: 'case-1', status: 'QUESTION_ASKED', stage: 'CLARIFY', difficulty: 'D0', current_question: { text: '你所说的成功具体指什么？' } } })
    if (path.includes('/dialogues/session-1/turns')) return response({ ok: true, session: { session_id: 'session-1', status: 'COMPLETED', stage: 'REVIEW', difficulty: 'D1', current_question: null } })
    if (path.includes('/cases/case-1/reviews')) return response({ ok: true, review: { id: 'review-1' } })
    return response({ ok: true })
  })
  globalThis.fetch = mock
  return mock
}

describe('DiscernmentWorkspace', () => {
  let originalFetch
  beforeEach(() => { originalFetch = globalThis.fetch; installFetch() })
  afterEach(() => { cleanup(); globalThis.fetch = originalFetch; vi.restoreAllMocks() })

  it('creates an explicitly consented case and renders evidence-governed hypotheses', async () => {
    const fetchMock = installFetch()
    render(<DiscernmentWorkspace />)
    fireEvent.change(screen.getByLabelText('案例标题'), { target: { value: '成功与价值' } })
    fireEvent.change(screen.getByLabelText('要分析的材料'), { target: { value: '只有成功我才有价值，我不能失败。' } })
    fireEvent.change(screen.getByLabelText('公开来源定位（可选，每行一个）'), { target: { value: 'https://example.com/public-talk\n公开视频：成功学演讲' } })
    fireEvent.change(screen.getByLabelText('你希望得到什么帮助'), { target: { value: '检验这个信念' } })
    fireEvent.click(screen.getByText('开始辨识'))
    expect(await screen.findByText(/材料与功绩主义存在候选关联/)).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: '自高假设' }))
    expect(screen.getByText('能力称义')).toBeTruthy()
    expect(screen.getByText('H1')).toBeTruthy()
    expect(screen.getByText(/不可写成稳定人格结论/)).toBeTruthy()
    const createCall = fetchMock.mock.calls.find(([url, options]) => String(url).endsWith('/discernment/cases') && options.method === 'POST')
    const payload = JSON.parse(createCall[1].body)
    expect(payload.consent_scope.allow_spiritual_analysis).toBe(true)
    expect(payload.consent_scope.allow_gospel_bridge).toBe(false)
    expect(payload.consent_scope.allow_longitudinal_memory).toBe(false)
    expect(payload.source_items).toHaveLength(2)
    expect(payload.source_items[0]).toMatchObject({ locator: 'https://example.com/public-talk', evidence_level: 'P1' })
    expect(payload.source_metadata.supplied_by_user).toBe(true)
  })

  it('runs one-question dialogue and lets the user request human review', async () => {
    const fetchMock = installFetch()
    render(<DiscernmentWorkspace />)
    fireEvent.change(screen.getByLabelText('案例标题'), { target: { value: '成功与价值' } })
    fireEvent.change(screen.getByLabelText('要分析的材料'), { target: { value: '只有成功我才有价值。' } })
    fireEvent.change(screen.getByLabelText('你希望得到什么帮助'), { target: { value: '检验这个信念' } })
    fireEvent.click(screen.getByText('开始辨识'))
    await screen.findByText(/材料与功绩主义/)
    fireEvent.click(screen.getByRole('tab', { name: '追问' }))
    fireEvent.click(screen.getByText('开始逐问对话'))
    expect(await screen.findByText('你所说的成功具体指什么？')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('回答当前问题'), { target: { value: '成功就是别人认可我的成果。' } })
    fireEvent.click(screen.getByText('提交并查看下一问'))
    expect(await screen.findByText(/本轮已经完成/)).toBeTruthy()
    fireEvent.click(screen.getByText('请求人工复核'))
    await waitFor(() => expect(fetchMock.mock.calls.some(([url, options]) => String(url).includes('/cases/case-1/reviews') && options.method === 'POST')).toBe(true))
  })

  it('states the non-diagnostic and crisis boundaries before submission', async () => {
    render(<DiscernmentWorkspace />)
    expect(screen.getByText(/不会读取人心、诊断人格、宣告附鬼/)).toBeTruthy()
    expect(screen.getByText(/纵向记忆（默认关闭，可撤回）/)).toBeTruthy()
  })
})
