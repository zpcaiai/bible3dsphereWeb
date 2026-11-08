import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import BibleReadingPage from '../BibleReadingPage.jsx'
import GroupHubPage from '../GroupHubPage.jsx'
import CareDashboardPage from '../CareDashboardPage.jsx'
import OnboardingPage from '../OnboardingPage.jsx'
import CommunionPage from '../CommunionPage.jsx'
import { getJson } from '../lib/offlinePack.js'

function installJsdomCacheStorage() {
  const prefix = '__test_cache_v1__:'
  globalThis.caches = {
    async open(cacheName) {
      const ns = `${prefix}${cacheName}:`
      return {
        async put(reqUrl, response) {
          const text = await response.text()
          sessionStorage.setItem(`${ns}${reqUrl}`, text)
        },
        async match(reqUrl) {
          const raw = sessionStorage.getItem(`${ns}${reqUrl}`)
          if (raw == null) return undefined
          return new Response(raw, { headers: { 'Content-Type': 'application/json' } })
        },
        async keys() {
          const out = []
          for (let i = 0; i < sessionStorage.length; i += 1) {
            const k = sessionStorage.key(i)
            if (k && k.startsWith(ns)) {
              out.push({ url: k.slice(ns.length) })
            }
          }
          return out
        },
      }
    },
  }
}

describe('Slice 6: BibleReadingPage Offline Pack Caching & App Route Wiring', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    installJsdomCacheStorage()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('caches read chapters, prefetches chapter + 1, and falls back to offlinePack when network is down', async () => {
    let networkOnline = true
    global.fetch = vi.fn(async (url) => {
      const str = String(url)
      if (str.includes('/bible-reading/progress')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ ok: true, items: [], by_book: {} }),
        }
      }
      if (str.includes('/scripture')) {
        if (!networkOnline) {
          throw new Error('Network offline')
        }
        const u = new URL(str, 'http://localhost')
        const ref = u.searchParams.get('ref') || '马太福音1'
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            ref,
            verses: [
              { verse: 1, text: `${ref}第1节经文内容` },
              { verse: 2, text: `${ref}第2节经文内容` },
            ],
          }),
        }
      }
      return { ok: true, status: 200, json: async () => ({}) }
    })

    const { unmount } = render(
      <BibleReadingPage
        user={{ id: 'u-1', email: 'reader@test.org' }}
        token="tok-reader"
        onBack={() => {}}
      />
    )

    const matthewBook = await screen.findByText('马太福音')
    fireEvent.click(matthewBook)

    const ch1Btn = await screen.findByRole('button', { name: '1' })
    fireEvent.click(ch1Btn)

    expect(await screen.findByText('马太福音1第1节经文内容')).toBeTruthy()

    // Wait for chapter 1 cache + chapter 2 prefetch to complete
    await waitFor(async () => {
      const ch1Cached = await getJson('scripture', '马太福音1')
      const ch2Prefetched = await getJson('scripture', '马太福音2')
      expect(ch1Cached?.verses).toHaveLength(2)
      expect(ch2Prefetched?.verses?.[0]?.text).toBe('马太福音2第1节经文内容')
    })

    const countEl = await screen.findByTestId('bible-offline-pack-count')
    expect(countEl.textContent).toContain('2')

    // Simulate going offline and navigating to prefetched chapter 2
    networkOnline = false
    unmount()

    render(
      <BibleReadingPage
        user={{ id: 'u-1', email: 'reader@test.org' }}
        token="tok-reader"
        onBack={() => {}}
      />
    )

    fireEvent.click(await screen.findByText('马太福音'))
    fireEvent.click(await screen.findByRole('button', { name: '2' }))

    expect(await screen.findByText('马太福音2第1节经文内容')).toBeTruthy()
    const badgeEl = await screen.findByTestId('bible-offline-pack-badge')
    expect(badgeEl.textContent).toContain('离线包已缓存')
  })

  it('wires GroupHubPage, CareDashboardPage, OnboardingPage, and CommunionPage onOpenVoice cleanly', async () => {
    global.fetch = vi.fn(async (url) => {
      const str = String(url)
      if (str.includes('/voice/groups') || str.includes('/voice-groups')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            groups: [{ id: 'g-1', name: '周三查经守望组', member_count: 12 }],
          }),
        }
      }
      if (str.includes('/meetings/upcoming')) {
        return { ok: true, status: 200, json: async () => ({ success: true, data: [] }) }
      }
      if (str.includes('/minutes')) {
        return { ok: true, status: 200, json: async () => ({ success: true, data: [] }) }
      }
      if (str.includes('/care/groups/ch-1/care-dashboard')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            summary: {
              members_count: 8,
              prayer_requests_count: 2,
              needs_followup_count: 1,
              high_risk_count: 0,
            },
            items: [],
          }),
        }
      }
      if (str.includes('/care/groups/ch-1/formation-flags')) {
        return { ok: true, status: 200, json: async () => ({ window_days: 14, items: [] }) }
      }
      if (str.includes('/friends')) {
        return { ok: true, status: 200, json: async () => ({ friends: [], incoming: [], outgoing: [] }) }
      }
      return { ok: true, status: 200, json: async () => ({}) }
    })

    const onOpenPanel = vi.fn()
    const { unmount: unmountHub } = render(
      <GroupHubPage
        user={{ id: 'u-1', email: 'leader@test.org' }}
        token="tok-leader"
        onBack={() => {}}
        onOpenPanel={onOpenPanel}
      />
    )
    const groupNodes = await screen.findAllByText('周三查经守望组')
    expect(groupNodes.length).toBeGreaterThanOrEqual(1)
    unmountHub()

    const { unmount: unmountCare } = render(
      <CareDashboardPage
        user={{ id: 'u-1', email: 'leader@test.org' }}
        token="tok-leader"
        churchId="ch-1"
        onBack={() => {}}
      />
    )
    expect(await screen.findByText('小组关怀面板')).toBeTruthy()
    expect(await screen.findByText('暂无需要关注的关怀信号。')).toBeTruthy()
    unmountCare()

    const { unmount: unmountOnboarding } = render(
      <OnboardingPage onBack={() => {}} onNavigate={() => {}} />
    )
    expect(screen.getByText('从这里开始')).toBeTruthy()
    unmountOnboarding()

    const onOpenVoice = vi.fn()
    const { unmount: unmountCommunion } = render(
      <CommunionPage
        user={{ id: 'u-1', email: 'leader@test.org' }}
        onBack={() => {}}
        onOpenVoice={onOpenVoice}
      />
    )
    const groupVoiceBtn = await screen.findByRole('button', { name: /多人语音通话/ })
    fireEvent.click(groupVoiceBtn)
    expect(onOpenVoice).toHaveBeenCalledTimes(1)
    unmountCommunion()
  })
})
