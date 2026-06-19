import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import GuardianNetworkManager from '../components/GuardianNetworkManager'
import CaregiverInbox from '../components/CaregiverInbox'

describe('collaboration UI', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ items: [] }),
    })
  })
  afterEach(() => { cleanup(); vi.restoreAllMocks() })

  it('guardian form renders the add-contact section', () => {
    render(<GuardianNetworkManager guardians={[]} onAdd={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('添加守护人')).toBeTruthy()
  })

  it('caregiver inbox shows 回拨 when a callback phone is shared', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ items: [{ id: 's1', sharerEmail: 'a@b.com', scope: ['status'], contactPhone: '0912000111' }] }),
    })
    render(<CaregiverInbox heading="分享给你的人" />)
    await waitFor(() => expect(screen.getByText('回拨')).toBeTruthy())
  })

  it('caregiver inbox renders heading and empty state', async () => {
    render(<CaregiverInbox heading="分享给你的人" />)
    expect(screen.getByText('分享给你的人')).toBeTruthy()
    await waitFor(() => expect(screen.getByText('目前没有人分享给你。')).toBeTruthy())
  })
})
