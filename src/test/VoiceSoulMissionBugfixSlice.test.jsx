import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import VoiceRoomPage from '../VoiceRoomPage'
import SoulDashboard from '../components/SoulDashboard'
import OrdoAmorisDashboard from '../features/spiritual-formation/components/ordo-amoris/OrdoAmorisDashboard'

describe('Slice DP[16] & DP[18]: OrdoAmoris Safe Storage, VoiceRoom Leave Group & SoulDashboard Insight/Signals', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('auth_token', 'test-jwt-token')
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('recovers gracefully when OrdoAmorisDashboard localStorage contains malformed JSON', () => {
    localStorage.setItem('spiritualFormation.ordoAmoris.records', '{corrupted-json')
    render(<OrdoAmorisDashboard userId="u-test" />)

    const saveBtn = screen.getByRole('button', { name: /保存今日重排/i })
    expect(() => fireEvent.click(saveBtn)).not.toThrow()

    const stored = JSON.parse(localStorage.getItem('spiritualFormation.ordoAmoris.records') || '[]')
    expect(Array.isArray(stored)).toBe(true)
    expect(stored.length).toBe(1)
    expect(stored[0].userId).toBe('u-test')
  })

  it('leaves a voice group via leaveVoiceGroup button in VoiceRoomPage', async () => {
    const fetchCalls = []
    global.fetch = vi.fn(async (url, opts) => {
      const u = String(url)
      fetchCalls.push({ url: u, method: opts?.method || 'GET' })
      if (u.includes('/voice/status')) {
        return {
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({ enabled: true }),
        }
      }
      if (u.endsWith('/groups/g-77/leave') && opts?.method === 'POST') {
        return {
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({ ok: true }),
        }
      }
      if (u.includes('/groups')) {
        return {
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({
            groups: [
              { id: 'g-77', name: '周三晚祷告会', join_code: 'PRAY77', member_count: 4, max_members: 12, is_owner: false },
            ],
          }),
        }
      }
      return {
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({}),
      }
    })

    render(
      <VoiceRoomPage
        user={{ id: 'u-1', name: 'Tester' }}
        token="test-jwt-token"
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/周三晚祷告会/)).toBeTruthy()
    })

    const leaveBtn = screen.getByTestId('voice-group-leave-g-77')
    fireEvent.click(leaveBtn)

    await waitFor(() => {
      expect(fetchCalls.some((c) => c.url.endsWith('/groups/g-77/leave') && c.method === 'POST')).toBe(true)
    })
  })

  it('renders insight and 3 signals cards in SoulDashboard and normalizes object /sfds/decisions responses', async () => {
    global.fetch = vi.fn(async (url) => {
      const u = String(url)
      if (u.includes('/habits/dashboard')) {
        return {
          ok: true,
          json: async () => ({ current_streak: 9, today_executions: 1 }),
        }
      }
      if (u.includes('/sfds/decisions')) {
        return {
          ok: true,
          json: async () => ({
            decisions: [{ id: 'd-1', title: '服事呼召分辨', category: 'calling' }],
          }),
        }
      }
      return {
        ok: true,
        json: async () => ({
          profile: {
            state_vector: {
              spiritual_clarity: 0.78,
              emotional_stability: 0.72,
              resilience: 0.75,
            },
          },
        }),
      }
    })

    render(<SoulDashboard user={{ id: 'u-1', email: 'u1@example.com' }} />)

    await waitFor(() => {
      expect(screen.getByTestId('soul-dashboard-insight')).toBeTruthy()
      expect(screen.getByTestId('soul-dashboard-signals')).toBeTruthy()
    })

    expect(screen.getByTestId('soul-dashboard-signals').textContent).toContain('9 天')
  })
})
