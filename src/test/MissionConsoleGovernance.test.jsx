import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MissionConsole, { STAGES } from '../features/mission-os/console/MissionConsole'

describe('Slice 5: MissionConsole B1 Governance Consoles Integration', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = async (input) => {
      const url = String(input)
      if (url.includes('/productization/orgs')) {
        return new Response(JSON.stringify({ organizations: [{ id: 'org-1', name: '恩典宣教差会', organization_type: 'mission_agency', my_role: 'admin' }] }), { status: 200 })
      }
      if (url.includes('/v1/mission/organizations/org-1')) {
        return new Response(JSON.stringify({ organization: { id: 'org-1', name: '恩典宣教差会', missionKind: 'mission_agency', legalName: 'Grace Mission Agency', countryCode: 'SG' }, relationships: [] }), { status: 200 })
      }
      if (url.includes('/mission/features')) {
        return new Response(JSON.stringify({ flags: [{ key: 'mission_os.outbox_worker', riskLevel: 'high', defaultValue: true, description: '异步事件投递开关' }] }), { status: 200 })
      }
      if (url.includes('/mission/incidents')) {
        return new Response(JSON.stringify({ items: [{ id: 'inc-1', riskLevel: 'L2', category: 'credential_expiry', status: 'open', assignedTo: '安全专员A' }] }), { status: 200 })
      }
      if (url.includes('/mission/audit')) {
        return new Response(JSON.stringify({ items: [{ id: 'aud-1', action: 'feature.override', result: 'success', resourceType: 'feature_flag', resourceId: 'mission_os.outbox_worker', changedFields: ['value'] }] }), { status: 200 })
      }
      if (url.includes('/system/outbox')) {
        return new Response(JSON.stringify({ items: [{ id: 'out-1', eventType: 'mission.gate.evaluated', deadLetter: false, attempts: 2, error: '连接超时' }] }), { status: 200 })
      }
      return new Response(JSON.stringify({ items: [] }), { status: 200 })
    }
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('registers and switches across all 5 B1 governance consoles in MissionConsole', async () => {
    const stageKeys = STAGES.map((s) => s[0])
    expect(stageKeys).toEqual(expect.arrayContaining(['organization', 'features', 'incidents', 'audit', 'outbox']))

    render(<MissionConsole token="tok-admin" organizationId="org-1" initialPanel="features" />)

    // Features panel
    await waitFor(() => {
      expect(screen.getByText('mission_os.outbox_worker')).toBeTruthy()
      expect(screen.getByText('异步事件投递开关')).toBeTruthy()
    })

    // Switch to Incidents panel (安全事件)
    fireEvent.click(screen.getByRole('button', { name: /安全事件/ }))
    await waitFor(() => {
      expect(screen.getByText(/L2 · credential_expiry/)).toBeTruthy()
      expect(screen.getByText(/安全专员A/)).toBeTruthy()
    })

    // Switch to Audit panel (审计血缘)
    fireEvent.click(screen.getByRole('button', { name: /审计血缘/ }))
    await waitFor(() => {
      expect(screen.getByText('feature.override')).toBeTruthy()
      expect(screen.getByText(/mission_os\.outbox_worker/)).toBeTruthy()
    })

    // Switch to Outbox panel (事件投递)
    fireEvent.click(screen.getByRole('button', { name: /事件投递/ }))
    await waitFor(() => {
      expect(screen.getByText('mission.gate.evaluated')).toBeTruthy()
      expect(screen.getByText('审计后重试')).toBeTruthy()
    })

    // Switch to Organization profile panel (组织画像)
    fireEvent.click(screen.getByRole('button', { name: /组织画像/ }))
    await waitFor(() => {
      expect(screen.getByDisplayValue('Grace Mission Agency')).toBeTruthy()
    })
  })
})
