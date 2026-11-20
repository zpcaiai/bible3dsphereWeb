import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import AttentionPage from '../features/attention/app/AttentionPage'

const okJson = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: vi.fn(() => 'application/json') },
  json: vi.fn().mockResolvedValue(body),
})

describe('Attention FocusScreen A4 closure (bible-attention-a4-01a1aa04)', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/attention/focus')
    window.sessionStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('serializes start, interrupt, and end mutations via busyRef and updates history on interrupt', async () => {
    let resolveStart
    let resolveInterrupt
    let resolveEnd
    let startCalls = 0
    let interruptCalls = 0
    let endCalls = 0

    vi.stubGlobal('fetch', vi.fn((url, options = {}) => {
      const path = String(url)
      if (path.includes('/focus-sessions/active')) {
        return Promise.resolve(okJson({ active: null }))
      }
      if (path.includes('/focus-sessions/focus-99/interrupt') && options.method === 'POST') {
        interruptCalls += 1
        return new Promise((res) => { resolveInterrupt = res })
      }
      if (path.includes('/focus-sessions/focus-99/end') && options.method === 'POST') {
        endCalls += 1
        return new Promise((res) => { resolveEnd = res })
      }
      if (path.includes('/focus-sessions') && options.method === 'POST') {
        startCalls += 1
        return new Promise((res) => { resolveStart = res })
      }
      if (path.includes('/focus-sessions')) {
        return Promise.resolve(okJson({ sessions: [] }))
      }
      if (path.includes('/attention/entries')) {
        return Promise.resolve(okJson({ entries: [], summary: { entriesCount: 0, investedMinutes: 0, capturedMinutes: 0, categoryMinutes: {} } }))
      }
      return Promise.resolve(okJson({ exists: false, covenant: null }))
    }))

    render(<AttentionPage user={{ email: 'u@example.com' }} token="token-a4" onBack={() => {}} initialSection="focus" />)

    const startBtn = await screen.findByRole('button', { name: '开始专注' })
    fireEvent.click(startBtn)
    fireEvent.click(startBtn)
    expect(startCalls).toBe(1)

    await act(async () => {
      resolveStart(okJson({
        session: {
          id: 'focus-99',
          focusType: 'mission',
          plannedMinutes: 25,
          intention: '系统回归验证',
          startedAt: new Date().toISOString(),
          interrupted: false,
        },
      }))
    })

    expect(await screen.findByText('专注进行中')).toBeTruthy()

    const reasonInput = screen.getByLabelText('只在需要记录中断时填写')
    fireEvent.change(reasonInput, { target: { value: '临时消息弹窗' } })
    const interruptBtn = screen.getByRole('button', { name: '记录中断' })

    fireEvent.click(interruptBtn)
    fireEvent.click(interruptBtn)
    expect(interruptCalls).toBe(1)

    await act(async () => {
      resolveInterrupt(okJson({
        session: {
          id: 'focus-99',
          focusType: 'mission',
          plannedMinutes: 25,
          intention: '系统回归验证',
          startedAt: new Date().toISOString(),
          interrupted: true,
        },
      }))
    })

    expect(await screen.findByTestId('focus-status-banner')).toBeTruthy()
    expect(screen.getByTestId('focus-history-item-focus-99').textContent).toContain('有中断')

    const endBtn = screen.getByRole('button', { name: '结束专注' })
    fireEvent.click(endBtn)
    fireEvent.click(endBtn)
    expect(endCalls).toBe(1)

    await act(async () => {
      resolveEnd(okJson({
        session: {
          id: 'focus-99',
          focusType: 'mission',
          plannedMinutes: 25,
          actualMinutes: 12,
          intention: '系统回归验证',
          interrupted: true,
          endedAt: new Date().toISOString(),
        },
      }))
    })

    expect(await screen.findByRole('heading', { level: 1, name: '注意力账本' })).toBeTruthy()
  })

  it('automatically recovers existing active session on HTTP 409 ACTIVE_FOCUS_SESSION_EXISTS', async () => {
    let activeCalls = 0
    const serverActive = {
      id: 'focus-conflict-1',
      focusType: 'worship',
      plannedMinutes: 30,
      intention: '晨间读经守望',
      startedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    }

    vi.stubGlobal('fetch', vi.fn((url, options = {}) => {
      const path = String(url)
      if (path.includes('/focus-sessions/active')) {
        activeCalls += 1
        return Promise.resolve(okJson({ active: activeCalls === 1 ? null : serverActive }))
      }
      if (path.includes('/focus-sessions') && options.method === 'POST') {
        return Promise.resolve(okJson({
          detail: {
            code: 'ACTIVE_FOCUS_SESSION_EXISTS',
            message: '已有进行中的专注时段',
          },
        }, 409))
      }
      if (path.includes('/focus-sessions')) {
        return Promise.resolve(okJson({ sessions: [] }))
      }
      return Promise.resolve(okJson({ exists: false, covenant: null }))
    }))

    render(<AttentionPage user={{ email: 'u@example.com' }} token="token-a4" onBack={() => {}} initialSection="focus" />)

    const startBtn = await screen.findByRole('button', { name: '开始专注' })
    fireEvent.click(startBtn)

    expect(await screen.findByText('专注进行中')).toBeTruthy()
    expect(screen.getByTestId('focus-status-banner').textContent).toContain('已恢复正在进行的专注时段')
    expect(screen.getByText('晨间读经守望')).toBeTruthy()
  })

  it('renders live MM:SS countdown and immediately recalculates on visibilitychange and window focus', async () => {
    vi.useFakeTimers()
    const t0 = new Date('2026-11-20T08:00:00.000Z').getTime()
    vi.setSystemTime(t0)

    vi.stubGlobal('fetch', vi.fn((url) => {
      const path = String(url)
      if (path.includes('/focus-sessions/active')) {
        return Promise.resolve(okJson({
          active: {
            id: 'focus-timer-1',
            focusType: 'mission',
            plannedMinutes: 25,
            intention: '深度写作',
            startedAt: new Date(t0).toISOString(),
          },
        }))
      }
      if (path.includes('/focus-sessions')) {
        return Promise.resolve(okJson({ sessions: [] }))
      }
      return Promise.resolve(okJson({ exists: false, covenant: null }))
    }))

    render(<AttentionPage user={{ email: 'u@example.com' }} token="token-a4" onBack={() => {}} initialSection="focus" />)

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    const countdown = screen.getByTestId('focus-countdown-mmss')
    expect(countdown.textContent).toBe('25:00')

    // Tick 3 seconds forward via interval
    await act(async () => {
      vi.advanceTimersByTime(3000)
    })
    expect(countdown.textContent).toBe('24:57')

    // Simulate mobile tab backgrounding for 10 minutes without interval ticks, then visibilitychange
    await act(async () => {
      vi.setSystemTime(t0 + 10 * 60_000 + 15_000)
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(countdown.textContent).toBe('14:45')

    // Simulate another 2 minutes jump + window focus event
    await act(async () => {
      vi.setSystemTime(t0 + 12 * 60_000 + 15_000)
      window.dispatchEvent(new Event('focus'))
    })
    expect(countdown.textContent).toBe('12:45')
  })

  it('displays honest < 1 分钟 (0 分钟) when actualMinutes === 0 instead of substituting 25 plannedMinutes', async () => {
    const startedIso = new Date(Date.now() - 12_000).toISOString()
    vi.stubGlobal('fetch', vi.fn((url, options = {}) => {
      const path = String(url)
      if (path.includes('/focus-sessions/active')) {
        return Promise.resolve(okJson({
          active: {
            id: 'focus-zero-1',
            focusType: 'mission',
            plannedMinutes: 25,
            intention: '短暂试运行',
            startedAt: startedIso,
          },
        }))
      }
      if (path.includes('/focus-sessions/focus-zero-1/end') && options.method === 'POST') {
        return Promise.resolve(okJson({
          session: {
            id: 'focus-zero-1',
            focusType: 'mission',
            plannedMinutes: 25,
            actualMinutes: 0,
            intention: '短暂试运行',
            endedAt: new Date().toISOString(),
          },
        }))
      }
      if (path.includes('/focus-sessions')) {
        return Promise.resolve(okJson({
          sessions: [
            {
              id: 'focus-zero-hist',
              focusType: 'mission',
              plannedMinutes: 25,
              actualMinutes: 0,
              endedAt: new Date().toISOString(),
            },
          ],
        }))
      }
      if (path.includes('/attention/entries')) {
        return Promise.resolve(okJson({ entries: [], summary: { entriesCount: 0, investedMinutes: 0, capturedMinutes: 0, categoryMinutes: {} } }))
      }
      return Promise.resolve(okJson({ exists: false, covenant: null }))
    }))

    render(<AttentionPage user={{ email: 'u@example.com' }} token="token-a4" onBack={() => {}} initialSection="focus" />)

    const histItem = await screen.findByTestId('focus-history-item-focus-zero-hist')
    expect(histItem.textContent).toContain('< 1 分钟')
    expect(histItem.textContent).toContain('0 分钟')
    expect(histItem.textContent).not.toContain('25 分钟')

    fireEvent.click(screen.getByRole('button', { name: '结束专注' }))
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: '注意力账本' })).toBeTruthy())
    expect(screen.getByDisplayValue('0')).toBeTruthy()
    expect(screen.queryByDisplayValue('25')).toBeNull()
  })
})
