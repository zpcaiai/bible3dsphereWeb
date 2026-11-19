import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SharedPrayerPage from '../SharedPrayerPage.jsx'
import { fetchSharedPrayer, searchPersonal } from '../api.js'

describe('Slice 7 / Stage 1 s1: SharedPrayerPage (/prayer-share) & searchPersonal', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('loads a public shared prayer via /api/prayer-share/{token} and posts /amen without hitting /prayers/shared', async () => {
    let amenCalls = 0
    const seenUrls = []
    global.fetch = vi.fn(async (url, init) => {
      const str = String(url)
      seenUrls.push(str)
      if (str.includes('/prayer-share/tok-pray-88/amen') && init?.method === 'POST') {
        amenCalls += 1
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, amen_count: 5 }),
        }
      }
      if (str.includes('/prayer-share/tok-pray-88')) {
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
    expect(seenUrls.some((u) => u.includes('/prayers/shared/'))).toBe(false)
  })

  it('surfaces backend 404 error cleanly when shared prayer token is missing', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 404,
      json: async () => ({ detail: 'Shared prayer not found' }),
    }))

    await expect(fetchSharedPrayer('missing-tok')).rejects.toThrow('Shared prayer not found')
  })

  it('aggregates /devotion/journals and /personal/notes in searchPersonal with deduplicated localStorage fallback', async () => {
    const requestedUrls = []
    global.fetch = vi.fn(async (url) => {
      const str = String(url)
      requestedUrls.push(str)
      const headers = new Headers({ 'content-type': 'application/json' })
      if (str.includes('/devotion/journals')) {
        return {
          ok: true,
          status: 200,
          headers,
          json: async () => ({
            items: [{ id: 'j-1', date: '2026-11-19', title: '旷野盼望', reflection: '在安静中等候神' }],
            total: 1,
          }),
        }
      }
      if (str.includes('/personal/notes')) {
        return {
          ok: true,
          status: 200,
          headers,
          json: async () => ({
            items: [{ id: 'n-1', date: '2026-11-19', content: '为教会同工守望代祷' }],
          }),
        }
      }
      return { ok: false, status: 404, headers, json: async () => ({ detail: 'Unexpected URL' }) }
    })

    localStorage.setItem(
      'personal_notes',
      JSON.stringify([
        { id: 'n-1', date: '2026-11-19', content: '为教会同工守望代祷' },
        { id: 'n-local', date: '2026-11-18', content: '本地安静默想笔记' },
      ]),
    )
    localStorage.setItem('journal_entries', '{corrupted-json')

    const res = await searchPersonal('安静', 'jwt-tok-1')
    expect(requestedUrls.some((u) => u.includes('/personal/search'))).toBe(false)
    expect(requestedUrls.some((u) => u.includes('/devotion/journals'))).toBe(true)
    expect(requestedUrls.some((u) => u.includes('/personal/notes'))).toBe(true)
    expect(res.query).toBe('安静')
    expect(res.total).toBe(2)
    expect(res.results.map((r) => r.id)).toEqual(['j-1', 'n-local'])
  })
})
