import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import AttentionPage from '../features/attention/app/AttentionPage'

const okJson = (body) => ({
  ok: true,
  status: 200,
  headers: { get: vi.fn(() => 'application/json') },
  json: vi.fn().mockResolvedValue(body),
})

describe('attention integrated journeys', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/attention')
    window.sessionStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('keeps route state in browser history and blocks ordinary admin access before API calls', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson({ exists: false, covenant: null })))
    const view = render(<AttentionPage user={{ email: 'user@example.com' }} token="token-a" onBack={() => {}} />)

    await waitFor(() => expect(view.getByRole('heading', { level: 1, name: '守心' })).toBeTruthy())
    fireEvent.click(view.getAllByRole('button', { name: '每日立约' })[0])
    expect(window.location.pathname).toBe('/attention/covenant')
    expect(view.getByRole('heading', { level: 1, name: '今日注意力立约' })).toBeTruthy()

    act(() => {
      window.history.replaceState({}, '', '/attention')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    await waitFor(() => expect(view.getByRole('heading', { level: 1, name: '守心' })).toBeTruthy())
    cleanup()

    window.history.replaceState({}, '', '/attention/admin')
    const ordinary = render(<AttentionPage user={{ email: 'user@example.com' }} token="token-a" onBack={() => {}} initialSection="admin" />)
    expect(ordinary.getByRole('heading', { level: 1, name: '无权访问运营后台' })).toBeTruthy()
    expect(global.fetch.mock.calls.some(([url]) => String(url).includes('/attention/admin/'))).toBe(false)
  })

  it('closes a focus session and prefills the ledger with actual minutes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url, options = {}) => {
      const path = String(url)
      if (path.includes('/focus-sessions/active')) return Promise.resolve(okJson({ active: { id: 'focus-1', focusType: 'mission', plannedMinutes: 25, intention: '完成发布检查', startedAt: new Date(Date.now() - 20 * 60000).toISOString() } }))
      if (path.includes('/focus-sessions/focus-1/end') && options.method === 'POST') return Promise.resolve(okJson({ session: { id: 'focus-1', focusType: 'mission', plannedMinutes: 25, actualMinutes: 20, intention: '完成发布检查', endedAt: new Date().toISOString() } }))
      if (path.includes('/focus-sessions')) return Promise.resolve(okJson({ sessions: [] }))
      if (path.includes('/attention/entries')) return Promise.resolve(okJson({ entries: [], summary: { entriesCount: 0, investedMinutes: 0, capturedMinutes: 0, categoryMinutes: {} } }))
      return Promise.resolve(okJson({ exists: false, covenant: null }))
    }))
    const view = render(<AttentionPage user={{ email: 'user@example.com' }} token="token-a" onBack={() => {}} initialSection="focus" />)

    await waitFor(() => expect(view.getByText('专注进行中')).toBeTruthy())
    fireEvent.change(view.getByLabelText('结束时的一句话复盘'), { target: { value: '完成核心任务' } })
    fireEvent.click(view.getByRole('button', { name: '结束专注' }))

    await waitFor(() => expect(view.getByRole('heading', { level: 1, name: '注意力账本' })).toBeTruthy())
    expect(view.getByDisplayValue('完成发布检查')).toBeTruthy()
    expect(view.getByDisplayValue('20')).toBeTruthy()
  })

  it('requires an explicit preview before sharing a weekly report', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url, options = {}) => {
      const path = String(url)
      if (path.includes('/partners/invitations')) return Promise.resolve(okJson({ received: [], sent: [] }))
      if (path.endsWith('/attention/accountability/partners?status=all')) return Promise.resolve(okJson({ relationships: [{ id: 'rel-1', status: 'active', currentUserRole: 'requester', partnerUser: { id: 'ben@example.test', displayName: 'Ben' } }] }))
      if (path.includes('/prayer-requests')) return Promise.resolve(okJson({ prayerRequests: [] }))
      if (path.includes('/shares/preview') && options.method === 'POST') return Promise.resolve(okJson({ preview: { summary: '脱敏周报摘要', scoreIncluded: false, sensitiveRedactions: [] } }))
      if (path.includes('/shares') && options.method === 'POST') return Promise.resolve(okJson({ share: { id: 'share-1' } }))
      if (path.includes('/shares')) return Promise.resolve(okJson({ shares: [] }))
      if (path.includes('/reports/weekly/history')) return Promise.resolve(okJson({ reports: [{ id: 'report-1', weekStart: '2026-07-06', weekEnd: '2026-07-12' }] }))
      if (path.endsWith('/attention/privacy')) return Promise.resolve(okJson({ settings: { shareScoresWithPartners: false, requirePreviewBeforeSharing: true } }))
      return Promise.resolve(okJson({ exists: false, covenant: null }))
    }))
    const view = render(<AttentionPage user={{ email: 'alice@example.test' }} token="token-a" onBack={() => {}} initialSection="accountability" />)

    await waitFor(() => expect(view.getAllByRole('option', { name: 'Ben' }).length).toBe(3))
    const selects = view.getAllByRole('combobox')
    fireEvent.change(selects[1], { target: { value: 'ben@example.test' } })
    fireEvent.change(selects[2], { target: { value: 'report-1' } })
    fireEvent.click(view.getByRole('button', { name: '预览分享' }))
    await waitFor(() => expect(view.getByRole('dialog', { name: '分享预览' })).toBeTruthy())
    expect(view.getByText(/评分：不包含/)).toBeTruthy()
    fireEvent.click(view.getByRole('button', { name: '确认分享' }))

    await waitFor(() => expect(global.fetch.mock.calls.some(([url, options]) => String(url).includes('/accountability/shares') && options?.method === 'POST')).toBe(true))
  })
})
