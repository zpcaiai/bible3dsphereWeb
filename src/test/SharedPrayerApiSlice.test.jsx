import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SharedPrayerPage from '../SharedPrayerPage.jsx'
import PersonalSearchPage from '../PersonalSearchPage.jsx'
import {
  attentionApi,
  deletePersonalNote,
  fetchJournals,
  fetchPersonalNotes,
  fetchPrayers,
  fetchSharedPrayer,
  formationApi,
  savePersonalNote,
  searchPersonal,
  transcribeAudioBlob,
} from '../api.js'

describe('Slice w1: SharedPrayerPage (/prayer-share), real GET /api/personal/search & COOKIE_SESSION_SENTINEL hygiene', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.useRealTimers()
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

  it('calls GET /api/personal/search with AbortSignal, omits Bearer cookie-session, and ignores un-namespaced localStorage notes', async () => {
    const calls = []
    global.fetch = vi.fn(async (url, init) => {
      calls.push({ url: String(url), init })
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          query: '安静',
          total: 2,
          counts: { devotion: 1, personal_note: 1, sermon: 0, prayer: 0, minutes: 0, memory: 0 },
          groups: {
            devotion: [{ id: 'j-1', source: 'devotion', title: '旷野盼望', date: '2026-11-19', snippet: '在安静中等候神', scripture: '诗篇 46:10' }],
            personal_note: [{ id: 'n-1', source: 'personal_note', title: '守望随笔', date: '2026-11-19', snippet: '安静默想', scripture: '' }],
            sermon: [],
            prayer: [],
            minutes: [],
            memory: [],
          },
          results: [
            { id: 'j-1', source: 'devotion', title: '旷野盼望', date: '2026-11-19', snippet: '在安静中等候神', scripture: '诗篇 46:10' },
            { id: 'n-1', source: 'personal_note', title: '守望随笔', date: '2026-11-19', snippet: '安静默想', scripture: '' },
          ],
        }),
      }
    })

    // Seed un-namespaced cross-account localStorage keys that MUST NOT leak into searchPersonal
    localStorage.setItem('personal_notes', JSON.stringify([{ id: 'leaked-note', content: '他人的安静隐私笔记' }]))
    localStorage.setItem('journal_entries', JSON.stringify([{ id: 'leaked-journal', reflection: '他人的安静日记' }]))

    const controller = new AbortController()
    const res = await searchPersonal('安静', 'cookie-session', { signal: controller.signal, limit: 30 })

    expect(calls).toHaveLength(1)
    expect(calls[0].url).toContain('/api/personal/search?q=%E5%AE%89%E9%9D%99&limit=30&offset=0')
    expect(calls[0].init.headers.Authorization).toBeUndefined()
    expect(calls[0].init.credentials).toBe('same-origin')
    expect(calls[0].init.signal).toBe(controller.signal)
    expect(res.total).toBe(2)
    expect(res.results.map((r) => r.id)).toEqual(['j-1', 'n-1'])
  })

  it('propagates HTTP 401/403/500 errors from searchPersonal without swallowing failures', async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      status: 401,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ detail: 'Authentication required' }),
    }))

    await expect(searchPersonal('恩典', 'cookie-session')).rejects.toThrow('Authentication required')
  })

  it('never leaks Authorization: Bearer cookie-session across personal, prayer, formation, or speech APIs and passes X-Timezone on listFocusSessions', async () => {
    const captured = []
    global.fetch = vi.fn(async (url, init = {}) => {
      captured.push({ url: String(url), init })
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ items: [], sessions: [], transcript: '平安', ok: true }),
      }
    })

    await fetchPrayers(20, 0, 'cookie-session')
    await fetchJournals('cookie-session', 20, 0)
    await fetchPersonalNotes('cookie-session')
    await savePersonalNote({ id: 'n1', date: '2026-11-20', content: 'test' }, 'cookie-session')
    await deletePersonalNote('n1', 'cookie-session')
    await formationApi.prayerToday('cookie-session')
    await attentionApi.listFocusSessions({ limit: 10 }, 'cookie-session', 'Asia/Shanghai')

    const ac = new AbortController()
    const blob = new Blob(['audio-bytes'], { type: 'audio/ogg;codecs=opus' })
    const speechRes = await transcribeAudioBlob(blob, 'zh-CN', {
      token: 'cookie-session',
      signal: ac.signal,
      timeoutMs: 15000,
    })
    expect(speechRes.transcript).toBe('平安')

    for (const call of captured) {
      expect(call.init?.headers?.Authorization).toBeUndefined()
      expect(call.init?.credentials).toBe('same-origin')
    }
    const focusCall = captured.find((c) => c.url.includes('/attention/focus-sessions'))
    expect(focusCall.init.headers['X-Timezone']).toBe('Asia/Shanghai')
  })

  it('renders all returned groups in PersonalSearchPage, isolates memoryDeck by owner, and offers retry on failure', async () => {
    localStorage.setItem('bible-sphere-user', JSON.stringify({ id: 'user-alice' }))
    localStorage.setItem(
      'memory-deck-v1',
      JSON.stringify([
        { id: 'mem-alice', userId: 'user-alice', ref: '腓立比书 4:7', textCuv: '神所赐出人意外的平安' },
        { id: 'mem-bob', userId: 'user-bob', ref: '约翰福音 14:27', textCuv: '我留下平安给你们（Bob 私密卡片）' },
      ]),
    )

    let attempt = 0
    global.fetch = vi.fn(async () => {
      attempt += 1
      if (attempt === 1) {
        return {
          ok: false,
          status: 500,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ detail: '数据库连接超时' }),
        }
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          success: true,
          query: '平安',
          total: 5,
          counts: { devotion: 1, personal_note: 1, sermon: 1, prayer: 1, minutes: 1, memory: 0 },
          groups: {
            devotion: [{ id: 'd1', source: 'devotion', title: '晨更平安', date: '2026-11-20', snippet: '基督里的平安', scripture: '约 14:27' }],
            personal_note: [{ id: 'pn1', source: 'personal_note', title: '随笔记录', date: '2026-11-20', snippet: '心中的平安', scripture: '' }],
            sermon: [{ id: 's1', source: 'sermon', title: '主日讲道', date: '2026-11-17', snippet: '福音赐平安', scripture: '弗 2:14' }],
            prayer: [{ id: 'p1', source: 'prayer', title: '晚祷', date: '2026-11-19', snippet: '求赐家庭平安', scripture: '' }],
            minutes: [{ id: 'm1', source: 'minutes', title: '小组纪要', date: '2026-11-18', snippet: '彼此问安享平安', scripture: '' }],
            memory: [],
          },
          results: [],
        }),
      }
    })

    render(<PersonalSearchPage token="cookie-session" user={{ id: 'user-alice' }} onBack={() => {}} onOpenPanel={() => {}} />)

    const input = screen.getByPlaceholderText(/搜灵修日记/)
    fireEvent.change(input, { target: { value: '平安' } })

    const errAlert = await screen.findByTestId('personal-search-error', {}, { timeout: 2500 })
    expect(errAlert.textContent).toContain('数据库连接超时')

    fireEvent.click(screen.getByTestId('personal-search-retry'))

    await waitFor(() => {
      expect(screen.getByTestId('personal-search-group-devotion')).toBeTruthy()
      expect(screen.getByTestId('personal-search-group-personal_note')).toBeTruthy()
      expect(screen.getByTestId('personal-search-group-sermon')).toBeTruthy()
      expect(screen.getByTestId('personal-search-group-prayer')).toBeTruthy()
      expect(screen.getByTestId('personal-search-group-minutes')).toBeTruthy()
      expect(screen.getByTestId('personal-search-group-memory')).toBeTruthy()
    })

    expect(screen.getByText(/腓立比书/)).toBeTruthy()
    expect(screen.queryByText(/Bob 私密卡片/)).toBeNull()
  })
})
