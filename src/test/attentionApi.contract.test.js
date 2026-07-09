import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { attentionApi } from '../api'

const okJson = (body = { ok: true }) => ({
  ok: true,
  status: 200,
  headers: { get: vi.fn(() => 'application/json') },
  json: vi.fn().mockResolvedValue(body),
})

const lastFetch = () => {
  const [url, options = {}] = global.fetch.mock.calls.at(-1)
  return { url, options }
}

describe('attention api contracts', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson({ exists: false, covenant: null })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('fetches today covenant with bearer auth and timezone', async () => {
    await attentionApi.today('token-a', 'Asia/Shanghai')
    const { url, options } = lastFetch()
    expect(url).toBe('/api/attention/covenant/today')
    expect(options.headers.Authorization).toBe('Bearer token-a')
    expect(options.headers['X-Timezone']).toBe('Asia/Shanghai')
  })

  it('creates covenant with the expected path', async () => {
    global.fetch.mockResolvedValueOnce(okJson({ covenant: { id: 'c1' } }))
    await attentionApi.createCovenant({ primaryOffering: 'work', riskPulls: [] }, 'token-a')
    const { url, options } = lastFetch()
    expect(url).toBe('/api/attention/covenant')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({ primaryOffering: 'work', riskPulls: [] })
  })

  it('updates covenant by id', async () => {
    global.fetch.mockResolvedValueOnce(okJson({ covenant: { id: 'c1' } }))
    await attentionApi.updateCovenant('c1', { primaryOffering: 'edit', riskPulls: [] }, 'token-a')
    const { url, options } = lastFetch()
    expect(url).toBe('/api/attention/covenant/c1')
    expect(options.method).toBe('PUT')
  })

  it('lists covenant history with date range', async () => {
    global.fetch.mockResolvedValueOnce(okJson({ covenants: [] }))
    await attentionApi.listCovenants({ from: '2026-07-01', to: '2026-07-09' }, 'token-a')
    const { url } = lastFetch()
    expect(url).toBe('/api/attention/covenants?from=2026-07-01&to=2026-07-09')
  })

  it('calls deterministic suggest endpoint', async () => {
    global.fetch.mockResolvedValueOnce(okJson({ suggestedDigitalBoundary: '固定窗口' }))
    await attentionApi.suggestCovenant({ riskPulls: ['fomo'] }, 'token-a')
    const { url, options } = lastFetch()
    expect(url).toBe('/api/attention/covenant/suggest')
    expect(options.method).toBe('POST')
  })

  it('starts and ends focus sessions on expected endpoints', async () => {
    global.fetch.mockResolvedValueOnce(okJson({ session: { id: 's1' } }))
    await attentionApi.startFocusSession({ focusType: 'mission', plannedMinutes: 25 }, 'token-a')
    expect(lastFetch().url).toBe('/api/attention/focus-sessions')
    global.fetch.mockResolvedValueOnce(okJson({ session: { id: 's1' } }))
    await attentionApi.endFocusSession('s1', { closingReflection: 'done' }, 'token-a')
    const { url, options } = lastFetch()
    expect(url).toBe('/api/attention/focus-sessions/s1/end')
    expect(options.method).toBe('POST')
  })

  it('creates ledger entries and diagnosis generation requests', async () => {
    global.fetch.mockResolvedValueOnce(okJson({ entry: { id: 'e1' } }))
    await attentionApi.createEntry({ category: 'mission', activityName: 'work', durationMinutes: 30 }, 'token-a')
    expect(lastFetch().url).toBe('/api/attention/entries')
    global.fetch.mockResolvedValueOnce(okJson({ diagnosis: { title: '洞察' } }))
    await attentionApi.generateDiagnosis({ diagnosisType: 'daily', save: true }, 'token-a')
    expect(lastFetch().url).toBe('/api/attention/diagnosis/generate')
  })

  it('loads warfare map and creates plan check-ins', async () => {
    global.fetch.mockResolvedValueOnce(okJson({ map: {} }))
    await attentionApi.warfareMap({ days: 14 }, 'token-a')
    expect(lastFetch().url).toBe('/api/attention/warfare/map?days=14')
    global.fetch.mockResolvedValueOnce(okJson({ checkin: { id: 'c1' } }))
    await attentionApi.savePlanCheckin('p1', { status: 'returned' }, 'token-a')
    expect(lastFetch().url).toBe('/api/attention/warfare/plans/p1/checkins')
  })

  it('calls score report and growth endpoints', async () => {
    global.fetch.mockResolvedValueOnce(okJson({ score: {} }))
    await attentionApi.dailyScore({ date: '2026-07-09', force: true }, 'token-a', 'Asia/Shanghai')
    expect(lastFetch().url).toBe('/api/attention/scores/daily?date=2026-07-09&force=true')
    expect(lastFetch().options.headers['X-Timezone']).toBe('Asia/Shanghai')

    global.fetch.mockResolvedValueOnce(okJson({ report: {} }))
    await attentionApi.generateWeeklyReport({ weekStart: '2026-07-06', forceRegenerate: true }, 'token-a')
    expect(lastFetch().url).toBe('/api/attention/reports/weekly/generate')
    expect(JSON.parse(lastFetch().options.body)).toEqual({ weekStart: '2026-07-06', forceRegenerate: true })

    global.fetch.mockResolvedValueOnce(okJson({ reports: [] }))
    await attentionApi.weeklyReportHistory({ limit: 12 }, 'token-a')
    expect(lastFetch().url).toBe('/api/attention/reports/weekly/history?limit=12')

    global.fetch.mockResolvedValueOnce(okJson({ trend: {} }))
    await attentionApi.growthTrend({ days: 90 }, 'token-a')
    expect(lastFetch().url).toBe('/api/attention/growth?days=90')
  })

  it('calls accountability privacy partner share and prayer endpoints', async () => {
    global.fetch.mockResolvedValueOnce(okJson({ settings: {} }))
    await attentionApi.privacy('token-a')
    expect(lastFetch().url).toBe('/api/attention/privacy')

    global.fetch.mockResolvedValueOnce(okJson({ relationship: {} }))
    await attentionApi.invitePartner({ partnerUserId: 'b@example.com' }, 'token-a')
    expect(lastFetch().url).toBe('/api/attention/accountability/partners/invite')

    global.fetch.mockResolvedValueOnce(okJson({ share: {} }))
    await attentionApi.createShare({ scope: 'partner', sourceType: 'weekly_report' }, 'token-a')
    expect(lastFetch().url).toBe('/api/attention/accountability/shares')

    global.fetch.mockResolvedValueOnce(okJson({ prayerRequest: {} }))
    await attentionApi.createPrayerRequest({ targetUserId: 'b@example.com', title: '请代祷' }, 'token-a')
    expect(lastFetch().url).toBe('/api/attention/accountability/prayer-requests')
  })

  it('calls group and challenge endpoints', async () => {
    global.fetch.mockResolvedValueOnce(okJson({ group: {} }))
    await attentionApi.createGroup({ name: '同行小组' }, 'token-a')
    expect(lastFetch().url).toBe('/api/attention/groups')

    global.fetch.mockResolvedValueOnce(okJson({ templates: [] }))
    await attentionApi.challengeTemplates('token-a')
    expect(lastFetch().url).toBe('/api/attention/challenges/templates')

    global.fetch.mockResolvedValueOnce(okJson({ challenge: {} }))
    await attentionApi.createGroupChallenge('g1', { title: '5 天立约' }, 'token-a')
    expect(lastFetch().url).toBe('/api/attention/groups/g1/challenges')

    global.fetch.mockResolvedValueOnce(okJson({ checkin: {} }))
    await attentionApi.saveChallengeCheckin('g1', 'c1', { completed: true }, 'token-a')
    expect(lastFetch().url).toBe('/api/attention/groups/g1/challenges/c1/checkins')
  })
})
