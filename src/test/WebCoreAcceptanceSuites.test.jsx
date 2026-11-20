import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

const apiMocks = vi.hoisted(() => ({
  fetchPrayers: vi.fn(),
  amenPrayer: vi.fn(),
  submitPrayer: vi.fn(),
  updatePrayer: vi.fn(),
  deletePrayer: vi.fn(),
  restorePrayer: vi.fn(),
  updatePrayerStatus: vi.fn(),
  runQuery: vi.fn(),
  transcribeAudioBlob: vi.fn(),
  fetchJournals: vi.fn(),
  fetchMilestones: vi.fn(),
  fetchEmotionTrajectory: vi.fn(),
  loadSpiritualFormationData: vi.fn(),
  hydrateBatch14LocalCaches: vi.fn(),
}))

vi.mock('../api', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    fetchPrayers: (...args) => apiMocks.fetchPrayers(...args),
    amenPrayer: (...args) => apiMocks.amenPrayer(...args),
    submitPrayer: (...args) => apiMocks.submitPrayer(...args),
    updatePrayer: (...args) => apiMocks.updatePrayer(...args),
    deletePrayer: (...args) => apiMocks.deletePrayer(...args),
    restorePrayer: (...args) => apiMocks.restorePrayer(...args),
    updatePrayerStatus: (...args) => apiMocks.updatePrayerStatus(...args),
    runQuery: (...args) => apiMocks.runQuery(...args),
    transcribeAudioBlob: (...args) => apiMocks.transcribeAudioBlob(...args),
    fetchJournals: (...args) => apiMocks.fetchJournals(...args),
    fetchMilestones: (...args) => apiMocks.fetchMilestones(...args),
    fetchEmotionTrajectory: (...args) => apiMocks.fetchEmotionTrajectory(...args),
  }
})

vi.mock('../features/spiritual-formation/lib/apiStorage', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    loadSpiritualFormationData: (...args) => apiMocks.loadSpiritualFormationData(...args),
  }
})

vi.mock('../features/spiritual-formation/lib/batch14Api', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    hydrateBatch14LocalCaches: (...args) => apiMocks.hydrateBatch14LocalCaches(...args),
  }
})

import PrayerWallPage from '../PrayerWallPage'
import SoulDashboard from '../components/SoulDashboard'
import BibleMapsPage from '../BibleMapsPage'
import SpiritualFormationPage from '../features/spiritual-formation/app/SpiritualFormationPage'
import { DEFAULT_YEAR, DISCLAIMER, LAYERS } from '../features/bible-map/domain/constants'
import { handleExpansionTarget, withExpansionChips } from '../expansion/planetEntries'
import { setRuntimeLang } from '../i18n/runtime'

describe('WebCoreAcceptanceSuites — Real Component & Contract Prechecks', () => {
  const origFetch = globalThis.fetch

  beforeEach(() => {
    setRuntimeLang('zh')
    localStorage.clear()
    sessionStorage.clear()
    vi.clearAllMocks()

    apiMocks.fetchPrayers.mockResolvedValue({
      total: 2,
      items: [
        {
          id: 'pw-101',
          nickname: '马可',
          content: '求主看顾教会本周的探访服事。',
          amen_count: 3,
          created_at: '2026-11-19T10:00:00Z',
          updated_at: '2026-11-19T10:00:00Z',
        },
        {
          id: 'pw-102',
          nickname: '路加',
          content: '为病痛中的肢体代祷，求赐安慰。',
          amen_count: 1,
          status: 'waiting',
          created_at: '2026-11-18T08:30:00Z',
          updated_at: '2026-11-18T08:30:00Z',
        },
      ],
    })
    apiMocks.amenPrayer.mockResolvedValue({ success: true })
    apiMocks.submitPrayer.mockResolvedValue({ id: 'pw-103', success: true })
    apiMocks.fetchJournals.mockResolvedValue({ items: [], total: 0 })
    apiMocks.fetchMilestones.mockResolvedValue([])
    apiMocks.fetchEmotionTrajectory.mockResolvedValue({ points: [] })
    apiMocks.loadSpiritualFormationData.mockResolvedValue({
      dailyExamens: [],
      thoughtEntries: [],
      graceRecoveryEntries: [],
      holyLifeDayLogs: [],
      horariumDayLogs: [],
      plans: [],
      activePlan: null,
    })
    apiMocks.hydrateBatch14LocalCaches.mockResolvedValue({ hydrated: false })

    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ items: [], decisions: [], habits: [], executions: [] }),
    }))
  })

  afterEach(() => {
    cleanup()
    globalThis.fetch = origFetch
  })

  it('mounts PrayerWallPage, renders live prayer cards, handles amen, and opens compose sheet', async () => {
    render(
      <PrayerWallPage
        user={{ id: 'u-1', nickname: '提摩太', email: 'timothy@example.com' }}
        token="cookie-session"
        onBack={() => {}}
      />,
    )

    await screen.findByText('求主看顾教会本周的探访服事。')
    expect(screen.getByText('为病痛中的肢体代祷，求赐安慰。')).toBeTruthy()
    expect(screen.getByText(/共 2 条祷告/)).toBeTruthy()

    const amenButtons = screen.getAllByRole('button', { name: /同心/ })
    fireEvent.click(amenButtons[0])
    await waitFor(() => expect(apiMocks.amenPrayer).toHaveBeenCalledWith('pw-101', 'cookie-session'))
    expect(screen.getByText('已同心')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '提交祷告' }))
    expect(await screen.findByText('📝 提交代祷')).toBeTruthy()
    expect(screen.getByText('以提摩太的名义提交代祷')).toBeTruthy()
  })

  it('mounts SoulDashboard with structured insight card and quick-entry overlays without Bearer cookie-session', async () => {
    render(
      <SoulDashboard
        user={{ id: 'u-soul-1', nickname: '彼得' }}
        token="cookie-session"
        onNeedAuth={() => {}}
      />,
    )

    const insightBox = await screen.findByTestId('soul-dashboard-insight')
    expect(insightBox.textContent.trim().length).toBeGreaterThan(8)
    expect(insightBox.textContent).not.toContain('undefined')

    expect(screen.getByTestId('soul-entry-ai-tutor')).toBeTruthy()
    expect(screen.getByTestId('soul-entry-personal-search')).toBeTruthy()
    expect(screen.getByTestId('soul-entry-spiritual-memory')).toBeTruthy()
    expect(screen.getByTestId('soul-entry-crisis-care')).toBeTruthy()

    for (const [, init] of globalThis.fetch.mock.calls) {
      const authHeader = init?.headers?.Authorization || init?.headers?.authorization || ''
      expect(authHeader).not.toContain('cookie-session')
    }
  })

  it('mounts BibleMapsPage, renders historical sections and Atlas callback, and validates constants.ts', async () => {
    const onOpenAtlas = vi.fn()
    render(<BibleMapsPage onBack={() => {}} onOpenAtlas={onOpenAtlas} />)

    expect(screen.getByRole('heading', { name: '🗺 圣经地图' })).toBeTruthy()
    expect(screen.getByText(/耶路撒冷圣城变迁与圣殿结构/)).toBeTruthy()

    const atlasBtn = screen.getByRole('button', { name: /圣经地图集/ })
    fireEvent.click(atlasBtn)
    expect(onOpenAtlas).toHaveBeenCalledTimes(1)

    expect(DEFAULT_YEAR).toBe(-1200)
    expect(LAYERS.map((l) => l.id)).toEqual([
      'tribes',
      'empires',
      'all',
      'prophecies',
      'campaigns',
      'people',
    ])
    expect(DISCLAIMER).toContain('教学用途')
  })

  it('mounts SpiritualFormationPage in local and synced modes and navigates tabs without spiritual scores', async () => {
    render(
      <SpiritualFormationPage
        user={{ id: 'u-sf-1', email: 'grace@example.com' }}
        token="cookie-session"
        onBack={() => {}}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Sin Pattern to New Creation Transformation Engine' }),
    ).toBeTruthy()
    await waitFor(() => expect(apiMocks.loadSpiritualFormationData).toHaveBeenCalledWith('cookie-session'))
    await screen.findByText(/已同步到后端数据库/)

    const nav = screen.getByRole('navigation', { name: 'Spiritual formation sections' })
    expect(nav).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '罪模式库' }))
    expect(screen.queryByText('Current active plan')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '首页' }))
    expect(await screen.findByText('Current active plan')).toBeTruthy()
  })

  it('wires planetEntries expansion chips and exp: route dispatch immutably', () => {
    const baseContinents = [
      { name: '回到福音', chips: [['罗马书', 'romans']] },
      { name: '与神同行', chips: [['每日灵修', 'devotion']] },
    ]
    const augmented = withExpansionChips(baseContinents)
    expect(baseContinents[0].chips).toHaveLength(1)
    expect(augmented[0].chips.some(([, target]) => target === 'exp:union')).toBe(true)
    expect(augmented[1].chips.some(([, target]) => target === 'exp:')).toBe(true)

    const openExpansion = vi.fn()
    expect(handleExpansionTarget('exp:lament', openExpansion)).toBe(true)
    expect(openExpansion).toHaveBeenCalledWith('lament')
    expect(handleExpansionTarget('prayer-wall', openExpansion)).toBe(false)
  })
})
