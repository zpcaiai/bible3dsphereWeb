import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import SpiritualPlanetPlatformPage from '../SpiritualPlanetPlatformPage'

function json(data) {
  return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) })
}

function installFetch(overrides = {}) {
  const mock = vi.fn((url, options = {}) => {
    const path = String(url)
    if (options.method === 'PUT' && path.includes('/context/consents/')) return json({ ok: true, status: 'ACTIVE' })
    if (options.method === 'POST' && path.includes('/recommendations/')) return json({ ok: true, decision: 'ACCEPTED' })
    if (options.method === 'POST' && path.includes('/actions/')) return json({ ok: true, status: 'COMPLETED' })
    if (path.includes('/home')) return json(overrides.home || { ok: true, home: { data_status: 'INSUFFICIENT_DATA', message: '目前没有足够记录形成完整镜像。你可以进行一次简短签到，或直接进入需要的模块。', current_state: { capacity_mode: 'NORMAL', safety_summary: { level: 'NONE' } }, mirror: {}, actions: [], focus_action: null, grace_and_protection: null } })
    if (path.includes('/recommendations/current')) return json(overrides.recommendation || { ok: true, recommendation: null })
    if (path.includes('/actions')) return json(overrides.actions || { ok: true, actions: [] })
    if (path.includes('/timeline')) return json(overrides.timeline || { ok: true, timeline: [] })
    if (path.includes('/context/consents')) return json(overrides.consents || { ok: true, consents: [] })
    if (path.includes('/context/access-log')) return json(overrides.accesses || { ok: true, accesses: [] })
    if (path.includes('/search')) return json(overrides.search || { ok: true, results: [] })
    return json({ ok: true })
  })
  globalThis.fetch = mock
  return mock
}

describe('SpiritualPlanetPlatformPage', () => {
  let originalFetch
  beforeEach(() => { originalFetch = globalThis.fetch; installFetch() })
  afterEach(() => { cleanup(); globalThis.fetch = originalFetch; vi.restoreAllMocks() })

  it('renders the unified IA, an always-available safety path and honest insufficient data', async () => {
    const onOpen = vi.fn()
    render(<SpiritualPlanetPlatformPage user={{ email: 'user@example.com' }} onBack={() => {}} onOpen={onOpen} />)
    expect(screen.getByText('属灵星球')).toBeTruthy()
    expect(screen.getByRole('navigation', { name: '属灵星球导航' })).toBeTruthy()
    expect(await screen.findByText('安全入口始终可用')).toBeTruthy()
    expect(await screen.findByText(/目前没有足够记录形成完整镜像/)).toBeTruthy()
    fireEvent.click(screen.getByText('打开安全帮助'))
    expect(onOpen).toHaveBeenCalledWith('sos')
    expect(document.body.textContent).not.toContain('属灵总分')
  })

  it('keeps source modules as destinations instead of copying their editing flows', async () => {
    const onOpen = vi.fn()
    render(<SpiritualPlanetPlatformPage user={{ email: 'user@example.com' }} onBack={() => {}} onOpen={onOpen} />)
    await screen.findByText(/目前没有足够记录/)
    fireEvent.click(screen.getByRole('button', { name: /孪生/ }))
    fireEvent.click(screen.getByText('打开孪生'))
    expect(onOpen).toHaveBeenCalledWith('formation-twin')
    expect(screen.getByText(/Pending 不会当作事实/)).toBeTruthy()
  })

  it('shows one recommendation and sends an explicit user confirmation decision', async () => {
    const fetchMock = installFetch({
      home: { ok: true, home: { data_status: 'AVAILABLE', current_state: { capacity_mode: 'LOW', safety_summary: { level: 'NONE' }, confirmed_theme: 'GRACE_EVIDENCE' }, mirror: { summary: '简短镜像', question: '今天保留什么？' }, actions: [], focus_action: null } },
      recommendation: { ok: true, recommendation: { id: 'r-1', source_module: 'platform_orchestrator', title: '两分钟安静', description: '可随时停止', estimated_duration_minutes: 2 } },
    })
    render(<SpiritualPlanetPlatformPage user={{ email: 'user@example.com' }} onBack={() => {}} onOpen={() => {}} />)
    expect(await screen.findByText('两分钟安静')).toBeTruthy()
    fireEvent.click(screen.getByText('接受'))
    await waitFor(() => expect(fetchMock.mock.calls.some(([url, options]) => String(url).includes('/recommendations/r-1/accept') && options.method === 'POST')).toBe(true))
  })

  it('exposes consent controls and user-visible access audit without technical health data', async () => {
    const fetchMock = installFetch({
      accesses: { ok: true, accesses: [{ id: 'audit-1', requester_module: 'prayer', purpose: 'GENERATE_PRAYER_PROMPT', projection_name: 'prayer_context_v1', decision: 'ALLOWED', reason_codes: ['ALLOWED_MINIMUM_PROJECTION'], created_at: '2026-07-17T10:00:00Z' }] },
    })
    render(<SpiritualPlanetPlatformPage user={{ email: 'user@example.com' }} onBack={() => {}} onOpen={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /隐私/ }))
    expect(await screen.findByText('上下文授权')).toBeTruthy()
    expect(screen.getByText('谁为哪个用途读取过')).toBeTruthy()
    expect(screen.getByText(/ALLOWED_MINIMUM_PROJECTION/)).toBeTruthy()
    fireEvent.click(screen.getAllByText('允许')[0])
    await waitFor(() => expect(fetchMock.mock.calls.some(([url, options]) => String(url).includes('/context/consents/prayer_context_v1') && options.method === 'PUT')).toBe(true))
    expect(document.body.textContent).not.toContain('Integration Health')
  })

  it('states the non-scoring and non-comparison boundaries', async () => {
    render(<SpiritualPlanetPlatformPage user={{ email: 'user@example.com' }} onBack={() => {}} onOpen={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /隐私/ }))
    expect(await screen.findByText(/不生成属灵总分/)).toBeTruthy()
    expect(screen.getByText(/不让多个 Agent 竞争输出/)).toBeTruthy()
  })
})
