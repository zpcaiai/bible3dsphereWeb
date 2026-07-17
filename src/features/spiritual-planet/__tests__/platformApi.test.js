import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PLATFORM_API_ROOT,
  createDeletionManifest,
  decideRecommendation,
  getContextAccessLog,
  getCurrentRecommendation,
  getUnifiedHome,
  getUnifiedTimeline,
  listContextConsents,
  listUnifiedActions,
  searchUnifiedData,
  setContextConsent,
  transitionUnifiedAction,
} from '../platformApi'

afterEach(() => vi.restoreAllMocks())

function response(data = { ok: true }, ok = true) {
  return Promise.resolve({ ok, status: ok ? 200 : 403, json: () => Promise.resolve(data) })
}

describe('Spiritual Planet API client', () => {
  it('uses the versioned platform root and same-origin credentials', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() => response())
    await getUnifiedHome()
    expect(PLATFORM_API_ROOT).toContain('/v1/platform')
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/v1/platform/home'), expect.objectContaining({ credentials: 'same-origin' }))
  })

  it('maps recommendation decisions and action transitions to explicit POST endpoints', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() => response())
    await getCurrentRecommendation()
    await decideRecommendation('r-1', 'smaller')
    await transitionUnifiedAction('a-1', 'complete')
    expect(fetchMock.mock.calls[0][0]).toContain('/recommendations/current')
    expect(fetchMock.mock.calls[1][0]).toContain('/recommendations/r-1/smaller')
    expect(fetchMock.mock.calls[1][1].method).toBe('POST')
    expect(fetchMock.mock.calls[2][0]).toContain('/actions/a-1/complete')
  })

  it('encodes timeline, restricted search, consent, access audit and deletion routes', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() => response())
    await listUnifiedActions('CONFIRMED')
    await getUnifiedTimeline('formation_twin')
    await searchUnifiedData('恩典 与 盼望', ['formation_twin'])
    await listContextConsents()
    await getContextAccessLog()
    await setContextConsent('prayer_context_v1', { requester_module: 'prayer', purpose: 'GENERATE_PRAYER_PROMPT', active: true })
    await createDeletionManifest({ source_module: 'platform_orchestrator', source_record_type: 'unified_action', source_record_ids: ['a-1'] })
    const urls = fetchMock.mock.calls.map((call) => call[0])
    expect(urls[0]).toContain('status=CONFIRMED')
    expect(urls[1]).toContain('module=formation_twin')
    expect(urls[2]).toContain('q=%E6%81%A9%E5%85%B8+%E4%B8%8E+%E7%9B%BC%E6%9C%9B')
    expect(urls[2]).toContain('modules=formation_twin')
    expect(urls[3]).toContain('/context/consents')
    expect(urls[4]).toContain('/context/access-log')
    expect(urls[5]).toContain('/context/consents/prayer_context_v1')
    expect(urls[6]).toContain('/deletions')
  })

  it('surfaces structured deny reason codes without leaking response bodies', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => response({ detail: { code: 'CONTEXT_DENIED', reason_codes: ['USER_CONSENT_REQUIRED'] } }, false))
    await expect(getUnifiedHome()).rejects.toThrow('CONTEXT_DENIED')
  })
})
