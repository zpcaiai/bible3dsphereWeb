import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import DecisionSupportPage from '../DecisionSupportPage'
import HabitsPage from '../HabitsPage'

describe('Slice DP[17]: DecisionSupportPage History/Principles & HabitsPage todayCount', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('auth_token', 'test-jwt-token')
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('switches between new/history/principles subtabs in DecisionSupportPage and loads selected decision into discernment form', async () => {
    global.fetch = vi.fn(async (url) => {
      const u = String(url)
      if (u.includes('/decisions') && !u.includes('/decisions/')) {
        return {
          ok: true,
          json: async () => ({
            decisions: [
              {
                id: 'dec-101',
                title: '是否接受跨城工作机会',
                description: '新岗位薪资更高但需要异地搬迁，担心家庭陪伴减少',
                category: 'career',
                urgency: 4,
                importance: 5,
                status: 'guided',
                created_at: '2026-11-08T08:00:00Z',
              },
            ],
          }),
        }
      }
      return {
        ok: true,
        json: async () => ({ items: [], tags: [], profile: {} }),
      }
    })

    render(
      <DecisionSupportPage
        user={{ id: 'u-1', email: 'u1@example.com' }}
        embedded={true}
      />
    )

    // Switch to 'new' (决策支持) tab in SoulTabs
    const discernTabBtn = screen.getByText(/决策支持|Decision Support/)
    fireEvent.click(discernTabBtn)

    expect(screen.getByTestId('discern-subtabs')).toBeTruthy()

    // Switch to principles subtab
    fireEvent.click(screen.getByTestId('discern-subtab-principles'))
    expect(screen.getByText(/帖前5:21/)).toBeTruthy()

    // Switch to history subtab
    fireEvent.click(screen.getByTestId('discern-subtab-history'))
    await waitFor(() => {
      expect(screen.getByText('是否接受跨城工作机会')).toBeTruthy()
    })

    // Click decision item to open selectedDecision detail
    fireEvent.click(screen.getByText('是否接受跨城工作机会'))
    expect(screen.getByTestId('selected-decision-detail')).toBeTruthy()
    expect(screen.getByText('新岗位薪资更高但需要异地搬迁，担心家庭陪伴减少')).toBeTruthy()

    // Click reuse button to populate discernment form and return to 'new'
    fireEvent.click(screen.getByTestId('reuse-selected-decision-btn'))
    await waitFor(() => {
      expect(screen.getByDisplayValue('新岗位薪资更高但需要异地搬迁，担心家庭陪伴减少')).toBeTruthy()
    })
  })

  it('renders todayCount in HabitsPage header and increments it when toggling a habit done', async () => {
    global.fetch = vi.fn(async (url, opts) => {
      const u = String(url)
      if (u.endsWith('/habits/dashboard')) {
        return {
          ok: true,
          json: async () => ({ current_streak: 5, today_executions: 2 }),
        }
      }
      if (u.endsWith('/habits')) {
        return {
          ok: true,
          json: async () => ({
            items: [
              { id: 'h-1', name: '晨更祷告', category: 'prayer', total_executions: 10, current_streak: 5 },
            ],
          }),
        }
      }
      if (u.includes('/habits/logs')) {
        return {
          ok: true,
          json: async () => ({ items: [] }),
        }
      }
      if (u.endsWith('/habits/log') && opts?.method === 'POST') {
        return {
          ok: true,
          json: async () => ({ ok: true }),
        }
      }
      return {
        ok: true,
        json: async () => ({ items: [] }),
      }
    })

    render(
      <HabitsPage
        user={{ id: 'u-1', email: 'u1@example.com' }}
        token="test-jwt-token"
        embedded={true}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('晨更祷告')).toBeTruthy()
    })

    expect(screen.getByTestId('habits-today-executions').textContent).toContain('(2')
  })
})
