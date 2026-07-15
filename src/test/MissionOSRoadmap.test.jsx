import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

import MissionOSRoadmap from '../features/mission-os/roadmap/MissionOSRoadmap'


const roadmap = {
  hasJourney: true,
  summary: {
    progress: 38,
    completedItems: 8,
    totalItems: 21,
    blockedItems: 1,
    currentStageKey: 'training',
    currentStageTitle: '装备与实践',
  },
  principles: [
    'AI 不作最终差派决定。',
    '家庭成员保有可撤回的同意权。',
    '硬阻塞不能被进度分数抵消。',
  ],
  stages: [
    {
      key: 'calling', number: 1, title: '聆听与辨识', eyebrow: '群体辨识', description: '记录反思。',
      status: 'complete', progress: 100, workspacePanel: 'calling', actionLabel: '继续呼召辨识',
      items: [{ key: 'journey', label: '已开始呼召旅程', status: 'complete', optional: false, detail: 'completed' }],
    },
    {
      key: 'training', number: 3, title: '装备与实践', eyebrow: '回应真实缺口', description: '完成训练。',
      status: 'blocked', progress: 50, workspacePanel: 'training', actionLabel: '查看装备计划',
      items: [{ key: 'gap', label: '解决阻塞缺口', status: 'blocked', optional: false, detail: '需要导师复核' }],
    },
  ],
}


describe('MissionOSRoadmap', () => {
  afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks() })

  it('loads an organization-scoped evidence roadmap and opens the matching workspace panel', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, roadmap }) })
    const open = vi.fn()
    render(<MissionOSRoadmap token="token" organizationId="org-1" onOpenWorkspace={open} />)

    await waitFor(() => expect(screen.getByText('我的宣教旅程')).toBeTruthy())
    expect(global.fetch.mock.calls[0][0]).toContain('/v1/mission/roadmap?organizationId=org-1')
    expect(global.fetch.mock.calls[0][1].headers['X-Tenant-Id']).toBe('org-1')
    expect(screen.getByText('38%')).toBeTruthy()
    expect(screen.getByText('解决阻塞缺口')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /查看装备计划/ }))
    expect(open).toHaveBeenCalledWith('training')
  })

  it('does not invent a roadmap without an organization context', () => {
    global.fetch = vi.fn()
    const open = vi.fn()
    render(<MissionOSRoadmap token="token" organizationId="" onOpenWorkspace={open} />)
    expect(screen.getByText('先选择所属组织')).toBeTruthy()
    expect(global.fetch).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '前往工作台选择' }))
    expect(open).toHaveBeenCalledWith('calling')
  })
})
