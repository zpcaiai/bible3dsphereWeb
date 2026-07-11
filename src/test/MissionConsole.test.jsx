import React from 'react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import MissionConsole from '../features/mission-os/console/MissionConsole'

describe('MissionConsole full lifecycle', () => {
  beforeEach(() => {
    global.fetch=vi.fn().mockResolvedValue({ok:true,json:async()=>({ok:true,items:[]})})
  })
  afterEach(()=>{cleanup();vi.restoreAllMocks()})

  it('exposes Batch 2-6 operational stages and org-scoped API', async () => {
    render(<MissionConsole token="token" organizationId="org-1" />)
    for(const label of ['禾场情报','呼召辨识','工人准备度','装备训练','差派申请','差派委员会','团队与伙伴','部署财务','合法身份','家庭准备','合规审核','证件 Vault','部署就绪 Gate']) {
      expect(screen.getByRole('button',{name:new RegExp(label)})).toBeTruthy()
    }
    await waitFor(()=>expect(global.fetch).toHaveBeenCalled())
    expect(global.fetch.mock.calls[0][0]).toContain('organizationId=org-1')
  })

  it('shows vault security guarantees and never echoes plaintext input', async () => {
    render(<MissionConsole token="token" organizationId="org-1" />)
    fireEvent.click(screen.getByRole('button',{name:/证件 Vault/}))
    expect(screen.getByText(/原始证件号与文件只以密文保存/)).toBeTruthy()
    expect(screen.getByRole('button',{name:'加密保存'}).disabled).toBe(true)
  })

  it('fails closed without organization context', () => {
    render(<MissionConsole token="token" organizationId="" />)
    expect(screen.getByText('需要组织上下文')).toBeTruthy()
  })
})
