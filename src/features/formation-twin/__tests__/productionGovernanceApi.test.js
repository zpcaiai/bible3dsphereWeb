import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  convertScenarioToProposal, createComplianceRequest, createFormationScenario,
  getGovernanceDataQuality, listGovernanceKillSwitches, listGovernanceReleases,
  setGovernanceKillSwitch,
} from '../productionGovernanceApi'

describe('production governance API', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('uses the versioned scenario, governance and compliance roots', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    await createFormationScenario({ title: 'x' })
    await convertScenarioToProposal('scenario-1', 'branch-1')
    await listGovernanceReleases()
    await getGovernanceDataQuality()
    await listGovernanceKillSwitches()
    await createComplianceRequest('OBJECT_TO_MODEL_PROCESSING', { formation_twin: true })
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      expect.stringContaining('/api/v1/formation-twin/scenarios'),
      expect.stringContaining('/api/v1/formation-twin/scenarios/scenario-1/convert-to-proposal'),
      expect.stringContaining('/api/v1/governance/releases'),
      expect.stringContaining('/api/v1/governance/data-quality'),
      expect.stringContaining('/api/v1/governance/kill-switches'),
      expect.stringContaining('/api/v1/compliance/requests/object-to-profiling'),
    ])
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ branch_id: 'branch-1', user_confirmed_conversion: true })
  })

  it('activates a kill switch with an auditable reason code', async () => {
    const fetcher = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    await setGovernanceKillSwitch('switch-1', true, 'SAFETY_CONTAINMENT')
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining('/kill-switches/switch-1/activate'), expect.objectContaining({ method: 'POST' }))
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ reason_code: 'SAFETY_CONTAINMENT' })
  })
})
