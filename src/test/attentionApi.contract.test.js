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
})
