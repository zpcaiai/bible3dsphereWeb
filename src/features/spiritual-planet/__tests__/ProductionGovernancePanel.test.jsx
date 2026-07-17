import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { setRuntimeLang } from '../../../i18n/runtime'
import ProductionGovernancePanel from '../ProductionGovernancePanel'
import { setGovernanceKillSwitch } from '../../formation-twin/productionGovernanceApi'

vi.mock('../../formation-twin/productionGovernanceApi', () => ({
  getGovernanceDataQuality: vi.fn(async () => ({ ok: false, publication_blockers: 1 })),
  getGovernanceRedTeam: vi.fn(async () => ({ pass: true, caught_count: 7, case_count: 7 })),
  getGovernanceSlo: vi.fn(async () => ({ targets: { crisis_route_availability: { target: 0.9999, degrade: 'STATIC_CRISIS_AND_HUMAN_SUPPORT' } } })),
  listEvaluationRuns: vi.fn(async () => ({ runs: [{ id: 'eval-1', run_type: 'SAFETY', component_version: '1.0.0', component_id: 'scenario', status: 'PASSED' }] })),
  listGovernanceIncidents: vi.fn(async () => ({ incidents: [] })),
  listGovernanceKillSwitches: vi.fn(async () => ({ kill_switches: [{ id: 'switch-1', switch_key: 'formation-scenario-simulation', scope_type: 'TASK_FAMILY', scope_reference: 'SCENARIO_SIMULATION', active: false }] })),
  listGovernanceReleases: vi.fn(async () => ({ releases: [{ id: 'release-1', release_key: 'batch10', version: '1.0.0', deployment_stage: 'DEVELOPMENT', approval_status: 'BLOCKED', blocker_codes_json: ['BATCH_08_RELATIONAL_COLLABORATION_NOT_AVAILABLE'] }] })),
  listGovernedComponents: vi.fn(async () => ({ components: [{ id: 'component-1', component_type: 'RULE', version: '1.0.0', component_id: 'scenario', approval_status: 'APPROVED', activated_at: '2026-07-17T00:00:00Z' }] })),
  setGovernanceKillSwitch: vi.fn(async () => ({ ok: true })),
}))

describe('ProductionGovernancePanel', () => {
  beforeEach(() => { setRuntimeLang('zh'); vi.spyOn(window, 'prompt').mockReturnValue('SAFETY_CONTAINMENT') })
  afterEach(() => { cleanup(); vi.restoreAllMocks(); setRuntimeLang('zh') })

  it('shows fail-closed Batch 08 status and release blockers without user data', async () => {
    render(<ProductionGovernancePanel />)
    expect(await screen.findByText('生产治理与发布门禁')).toBeTruthy()
    expect(screen.getByText(/Batch 08 关系协作尚未落地/)).toBeTruthy()
    expect(screen.getByText('7/7')).toBeTruthy()
    expect(document.body.textContent).not.toContain('用户日记')
    expect(document.body.textContent).not.toContain('危机正文：')
  })

  it('lists release blocker evidence and fixed component versions', async () => {
    render(<ProductionGovernancePanel />)
    await screen.findByText('生产治理与发布门禁')
    fireEvent.click(screen.getByRole('tab', { name: '发布' }))
    expect(screen.getByText('BATCH_08_RELATIONAL_COLLABORATION_NOT_AVAILABLE')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: '组件版本' }))
    expect(screen.getByText('scenario')).toBeTruthy()
    expect(screen.getByText('当前激活的固定版本')).toBeTruthy()
  })

  it('requires an auditable reason before activating a kill switch', async () => {
    render(<ProductionGovernancePanel />)
    await screen.findByText('生产治理与发布门禁')
    fireEvent.click(screen.getByRole('tab', { name: '紧急停用' }))
    fireEvent.click(screen.getByRole('button', { name: '紧急停用' }))
    await waitFor(() => expect(setGovernanceKillSwitch).toHaveBeenCalledWith('switch-1', true, 'SAFETY_CONTAINMENT'))
  })

  it('shows the crisis SLO and its safe degradation route', async () => {
    render(<ProductionGovernancePanel />)
    await screen.findByText('生产治理与发布门禁')
    fireEvent.click(screen.getByRole('tab', { name: 'SLO' }))
    expect(screen.getByText('crisis_route_availability')).toBeTruthy()
    expect(screen.getByText(/STATIC_CRISIS_AND_HUMAN_SUPPORT/)).toBeTruthy()
  })
})
