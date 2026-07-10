import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import AttentionPage from '../features/attention/app/AttentionPage'

const okJson = (body) => ({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue(body),
})

describe('AttentionPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson({ exists: false, covenant: null })))
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('renders dashboard empty state and starts covenant form', async () => {
    const { getByText, getAllByText } = render(<AttentionPage user={{ email: 'a@example.com' }} token="token-a" onBack={() => {}} />)

    await waitFor(() => expect(getAllByText('今日尚未立约').length).toBeGreaterThan(0))
    fireEvent.click(getByText('开始今日立约'))

    expect(getByText('今日注意力立约')).toBeTruthy()
    expect(getByText('今天你最想把注意力献给什么？')).toBeTruthy()
  })

  it('fills suggestions into empty boundary fields', async () => {
    global.fetch.mockResolvedValueOnce(okJson({ exists: false, covenant: null }))
    global.fetch.mockResolvedValueOnce(okJson({
      suggestedDigitalBoundary: '上午不看 AI 资讯',
      suggestedTimeBoundary: '30 分钟',
      suggestedSpiritualBoundary: '先祷告 30 秒',
      suggestedScripture: { reference: '诗篇 46:10', text: '你们要休息，要知道我是神。' },
      suggestedPrayer: '主啊，帮助我归回。',
    }))
    const { getByText, getByDisplayValue } = render(<AttentionPage user={{ email: 'a@example.com' }} token="token-a" onBack={() => {}} initialSection="covenant" />)

    await waitFor(() => expect(getByText('生成今日守心建议')).toBeTruthy())
    fireEvent.click(getByText('生成今日守心建议'))

    await waitFor(() => expect(getByDisplayValue('上午不看 AI 资讯')).toBeTruthy())
  })

  it('renders diagnosis tools', async () => {
    const { getByText } = render(<AttentionPage user={{ email: 'a@example.com' }} token="token-a" onBack={() => {}} initialSection="diagnosis" />)

    await waitFor(() => expect(getByText('AI 守心洞察')).toBeTruthy())
    expect(getByText('生成今日洞察')).toBeTruthy()
    expect(getByText('现在被牵引了吗？')).toBeTruthy()
    expect(getByText('问守心 Agent')).toBeTruthy()
  })

  it('renders warfare map shell', async () => {
    global.fetch.mockResolvedValue(okJson({ map: { summary: {}, patternScores: [], activePlans: [], recentDiagnosisPatterns: [] } }))
    const { getByText } = render(<AttentionPage user={{ email: 'a@example.com' }} token="token-a" onBack={() => {}} initialSection="warfare" />)

    await waitFor(() => expect(getByText('注意力争战地图')).toBeTruthy())
    expect(getByText('最近 7 天')).toBeTruthy()
    expect(getByText('模式地图')).toBeTruthy()
  })

  it('renders reports page without score shame language', async () => {
    global.fetch.mockImplementation((url) => {
      if (String(url).includes('/attention/reports/weekly/history')) return Promise.resolve(okJson({ reports: [] }))
      if (String(url).includes('/attention/growth')) return Promise.resolve(okJson({ trend: { range: { days: 30 }, points: [], summary: {} } }))
      if (String(url).includes('/attention/reports/weekly')) return Promise.resolve(okJson({ exists: false, report: null, weekStart: '2026-07-06', weekEnd: '2026-07-12' }))
      return Promise.resolve(okJson({ exists: false, covenant: null }))
    })
    const { getByText, queryByText } = render(<AttentionPage user={{ email: 'a@example.com' }} token="token-a" onBack={() => {}} initialSection="reports" />)

    await waitFor(() => expect(getByText('守心周报')).toBeTruthy())
    expect(getByText('守心评分是节奏指标，不是属灵身份，也不是神对你的评价。它只帮助你看见：哪些节奏正在建立，哪些地方需要温柔留意。')).toBeTruthy()
    expect(getByText('这周还没有生成守心周报')).toBeTruthy()
    expect(queryByText('表现很差')).toBeFalsy()
  })

  it('renders accountability privacy and group screens', async () => {
    global.fetch.mockImplementation((url) => {
      const path = String(url)
      if (path.includes('/attention/accountability/partners/invitations')) return Promise.resolve(okJson({ received: [], sent: [] }))
      if (path.includes('/attention/accountability/partners')) return Promise.resolve(okJson({ relationships: [] }))
      if (path.includes('/attention/accountability/prayer-requests')) return Promise.resolve(okJson({ prayerRequests: [] }))
      if (path.includes('/attention/accountability/shares')) return Promise.resolve(okJson({ shares: [] }))
      return Promise.resolve(okJson({ exists: false, covenant: null }))
    })
    const accountability = render(<AttentionPage user={{ email: 'a@example.com' }} token="token-a" onBack={() => {}} initialSection="accountability" />)
    await waitFor(() => expect(accountability.getByText('同伴守望')).toBeTruthy())
    expect(accountability.getByText('邀请守望伙伴')).toBeTruthy()
    cleanup()

    global.fetch.mockImplementation((url) => {
      const path = String(url)
      if (path.includes('/attention/privacy')) return Promise.resolve(okJson({
        settings: {
          defaultPartnerVisibility: 'status_only',
          defaultGroupVisibility: 'status_only',
          defaultChallengeVisibility: 'status_only',
          shareScoresWithPartners: false,
          shareScoresWithGroups: false,
          shareWeeklyReportSummary: false,
          shareWarfarePlanProgress: false,
          sharePrayerRequests: true,
          hideSensitiveCategories: ['lust'],
          allowPartnerReminders: true,
          allowGroupChallengeReminders: true,
          requirePreviewBeforeSharing: true,
        },
      }))
      return Promise.resolve(okJson({ exists: false, covenant: null }))
    })
    const privacy = render(<AttentionPage user={{ email: 'a@example.com' }} token="token-a" onBack={() => {}} initialSection="privacy" />)
    await waitFor(() => expect(privacy.getByText('守心隐私')).toBeTruthy())
    expect(privacy.getByText('敏感内容保护')).toBeTruthy()
    cleanup()

    global.fetch.mockImplementation((url) => {
      const path = String(url)
      if (path.includes('/attention/challenges/templates')) return Promise.resolve(okJson({ templates: [] }))
      if (path.includes('/attention/challenges/mine')) return Promise.resolve(okJson({ challenges: [] }))
      if (path.includes('/attention/groups')) return Promise.resolve(okJson({ groups: [] }))
      return Promise.resolve(okJson({ exists: false, covenant: null }))
    })
    const groups = render(<AttentionPage user={{ email: 'a@example.com' }} token="token-a" onBack={() => {}} initialSection="groups" />)
    await waitFor(() => expect(groups.getByText('守心小组')).toBeTruthy())
    expect(groups.getByText('温柔挑战模板')).toBeTruthy()
  })

  it('renders admin aggregate-only screen for admin users', async () => {
    global.fetch.mockImplementation((url) => {
      const path = String(url)
      if (path.includes('/attention/admin/overview')) return Promise.resolve(okJson({
        metrics: {
          activeAttentionUsers7d: 3,
          dailyCovenants7d: 5,
          focusSessions7d: 4,
          ledgerEntries7d: 8,
          reviews7d: 2,
          diagnoses7d: 1,
          groupsActive: 1,
          prayerRequestsOpen: 2,
          crisisSafetyTriggers7d: 0,
        },
        health: { checks: { database: 'ok', privacyDefaults: 'ok' } },
      }))
      if (path.includes('/attention/admin/audit')) return Promise.resolve(okJson({ checks: [{ key: 'admin_route_role_protected', status: 'pass', message: 'protected' }] }))
      if (path.includes('/attention/admin/content-library')) return Promise.resolve(okJson({ contentLibrary: { scriptureCount: 10, warfarePatternCount: 9, challengeTemplateCount: 9, scoreRuleVersion: 'v1' } }))
      return Promise.resolve(okJson({ exists: false, covenant: null }))
    })
    const { getByText, queryByText } = render(<AttentionPage user={{ email: 'admin@example.com', is_admin: true }} token="token-a" onBack={() => {}} initialSection="admin" />)

    await waitFor(() => expect(getByText('守心运营后台')).toBeTruthy())
    expect(getByText('7 天聚合指标')).toBeTruthy()
    expect(getByText('安全审计摘要')).toBeTruthy()
    expect(queryByText('raw prayer')).toBeFalsy()
  })
})
