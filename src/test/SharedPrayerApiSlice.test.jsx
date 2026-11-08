import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SharedPrayerPage from '../SharedPrayerPage.jsx'

describe('Slice 7: SharedPrayerPage & api.js fetchSharedPrayer / amenSharedPrayer', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('loads a public shared prayer by token and increments amen count on click', async () => {
    let amenCalls = 0
    global.fetch = vi.fn(async (url, init) => {
      const str = String(url)
      if (str.includes('/prayers/shared/tok-pray-88/amen') && init?.method === 'POST') {
        amenCalls += 1
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, amen_count: 5 }),
        }
      }
      if (str.includes('/prayers/shared/tok-pray-88')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: 88,
            nickname: '恩典姊妹',
            content: '求主看顾家庭与健康',
            amen_count: 4,
            created_at: '2026-11-08T00:00:00Z',
          }),
        }
      }
      return { ok: false, status: 404, json: async () => ({ detail: 'Not found' }) }
    })

    render(<SharedPrayerPage shareToken="tok-pray-88" />)

    expect(await screen.findByText('求主看顾家庭与健康')).toBeTruthy()
    expect(screen.getByText('恩典姊妹')).toBeTruthy()

    const amenBtn = screen.getByRole('button', { name: /同心代祷/ })
    fireEvent.click(amenBtn)

    expect(await screen.findByText(/已与他同心代祷/)).toBeTruthy()
    expect(amenCalls).toBe(1)
  })
})
