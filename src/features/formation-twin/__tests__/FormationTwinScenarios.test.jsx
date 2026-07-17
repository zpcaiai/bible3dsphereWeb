import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { setRuntimeLang } from '../../../i18n/runtime'
import FormationTwinScenarios from '../FormationTwinScenarios'
import {
  convertScenarioToProposal, createComplianceRequest, createFormationScenario,
  deleteFormationScenario, markFormationScenarioInaccurate,
} from '../productionGovernanceApi'

vi.mock('../productionGovernanceApi', () => ({
  convertScenarioToProposal: vi.fn(async () => ({ proposal: { execution_status: 'NOT_EXECUTED' } })),
  createComplianceRequest: vi.fn(async () => ({ request_id: 'request-1', status: 'PROCESSING_RESTRICTED' })),
  createFormationScenario: vi.fn(async () => ({ scenario })),
  deleteFormationScenario: vi.fn(async () => ({ ok: true })),
  getComplianceDataMap: vi.fn(async () => ({ notices: ['Scenario 是有限情景，不是预测。'], data_categories: [{ category: '有限 Scenario', purpose: '比较短期可能性', retention: '默认 60 天' }] })),
  getGovernedSystemStatus: vi.fn(async () => ({ status: 'AVAILABLE', batch_08_relational_collaboration: 'NOT_AVAILABLE' })),
  listApprovedThirdParties: vi.fn(async () => ({ third_parties: [] })),
  listFormationScenarios: vi.fn(async () => ({ scenarios: [scenario] })),
  markFormationScenarioInaccurate: vi.fn(async () => ({ ok: true })),
}))

const branch = (id, label) => ({
  branch_id: id, label, description: '可能值得观察，目前无法确定。',
  plausible_near_term_effects: [{ effect_type: 'UNCLEAR', description: '可能有变化，也可能没有明显变化。' }],
  possible_tradeoffs: ['可能增加一点负担。'], uncertainty_factors: ['外部环境无法确定。'],
  observation_plan: ['观察负担与恢复速度。'], action_required: false,
})

const scenario = {
  id: 'scenario-1', title: '未来七天的三个分支', horizon: 'NEXT_7_DAYS',
  user_review_status: 'DRAFT', created_at: '2026-07-17T12:00:00Z',
  non_prediction_notice: '这是基于你确认资料和可见假设的有限情景比较，不是预测、概率、神的旨意或人生结论。',
  assumptions: [{ assumption_type: 'USER_DEFINED_BASELINE', description: '当前负担保持不变。', source_kind: 'USER_DEFINED', user_confirmed: true }],
  branches: [branch('a', 'A · 维持当前方式'), branch('b', 'B · 增加一个最小保护因素'), branch('c', 'C · 尝试已确认的替代回应')],
  evidence_matrix: { supporting_evidence: [{}], counterevidence: [], limitations: ['关联不能证明因果。'] },
  major_decision_limited: false,
}

describe('FormationTwinScenarios', () => {
  beforeEach(() => {
    setRuntimeLang('zh'); vi.clearAllMocks()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })
  afterEach(() => { cleanup(); vi.restoreAllMocks(); setRuntimeLang('zh') })

  it('shows three bounded branches, assumptions and no probability or oracle copy', async () => {
    render(<FormationTwinScenarios user={{ email: 'user@example.com' }} onSafety={vi.fn()} />)
    expect(await screen.findByText('未来七天的三个分支')).toBeTruthy()
    expect(screen.getByText('A · 维持当前方式')).toBeTruthy()
    expect(screen.getByText('B · 增加一个最小保护因素')).toBeTruthy()
    expect(screen.getByText('C · 尝试已确认的替代回应')).toBeTruthy()
    expect(document.body.textContent).toContain('不是预测')
    expect(document.body.textContent).not.toContain('复发概率')
    expect(document.body.textContent).not.toContain('神推荐')
  })

  it('exposes all five scenario information architecture routes', () => {
    render(<FormationTwinScenarios user={{ email: 'user@example.com' }} />)
    const routes = Array.from(document.querySelectorAll('[data-scenario-route]')).map((item) => item.dataset.scenarioRoute)
    expect(routes).toHaveLength(5)
    expect(routes).toContain('/formation-twin/scenarios/new')
    expect(routes).toContain('/formation-twin/scenarios/settings')
  })

  it('requires visible confirmation and sends only a user-authored bounded assumption', async () => {
    render(<FormationTwinScenarios user={{ email: 'user@example.com' }} />)
    fireEvent.click(screen.getByRole('tab', { name: '新建比较' }))
    fireEvent.change(screen.getByLabelText('想观察的问题'), { target: { value: '未来七天值得观察什么？' } })
    fireEvent.change(screen.getByLabelText('情景名称'), { target: { value: '七天观察' } })
    fireEvent.change(screen.getByLabelText('由你确认的基线或假设'), { target: { value: '当前工作负担较高。' } })
    const submit = screen.getByRole('button', { name: '生成最多三个分支' })
    expect(submit.disabled).toBe(true)
    fireEvent.click(screen.getByLabelText('我确认这是自己的假设；我理解结果不是预测，也不会自动执行行动。'))
    fireEvent.click(submit)
    await waitFor(() => expect(createFormationScenario).toHaveBeenCalledWith(expect.objectContaining({
      baseline_snapshot_ids: [], user_review_status: 'DRAFT', safety_level: 'NONE',
      assumptions: [expect.objectContaining({ description: '当前工作负担较高。', user_confirmed: true, source_kind: 'USER_DEFINED' })],
    })))
  })

  it('requires a second explicit click before converting a branch to a non-executing proposal', async () => {
    render(<FormationTwinScenarios user={{ email: 'user@example.com' }} />)
    await screen.findByText('未来七天的三个分支')
    fireEvent.click(screen.getAllByRole('button', { name: '转成待确认行动提案' })[0])
    await waitFor(() => expect(convertScenarioToProposal).toHaveBeenCalledWith('scenario-1', 'a'))
    expect(window.confirm).toHaveBeenCalled()
  })

  it('lets the user mark an unhelpful scenario without penalty and delete it', async () => {
    render(<FormationTwinScenarios user={{ email: 'user@example.com' }} />)
    await screen.findByText('未来七天的三个分支')
    fireEvent.click(screen.getByRole('button', { name: '这次比较没有意义' }))
    await waitFor(() => expect(markFormationScenarioInaccurate).toHaveBeenCalledWith('scenario-1'))
    fireEvent.click(screen.getByRole('button', { name: '删除' }))
    await waitFor(() => expect(deleteFormationScenario).toHaveBeenCalledWith('scenario-1'))
  })

  it('shows transparent processing and separate profiling restriction controls', async () => {
    render(<FormationTwinScenarios user={{ email: 'user@example.com' }} />)
    fireEvent.click(screen.getByRole('tab', { name: '数据与透明' }))
    expect(await screen.findByText('Scenario 是有限情景，不是预测。')).toBeTruthy()
    expect(screen.getByText('当前治理注册表没有已批准并公开的第三方处理者。')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: '设置' }))
    fireEvent.click(screen.getByRole('button', { name: '反对模型 Profiling' }))
    await waitFor(() => expect(createComplianceRequest).toHaveBeenCalledWith('OBJECT_TO_MODEL_PROCESSING', { formation_twin: true }))
  })
})
