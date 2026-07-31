import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  PLATFORM_API_ROOT,
  createDeletionManifest,
  createDiscernmentCase,
  createFormationEvent,
  createFormationReview,
  createCollaborationConsent,
  createCollaborationDisclosure,
  createTheologySource,
  createTheologyQuery,
  deleteExtendedDiscernmentData,
  exportExtendedDiscernmentData,
  getDiscernmentCertificationStatus,
  buildDiscernmentGospelPath,
  decideRecommendation,
  getContextAccessLog,
  getCurrentRecommendation,
  getUnifiedHome,
  getUnifiedTimeline,
  listDiscernmentCases,
  listContextConsents,
  listUnifiedActions,
  searchUnifiedData,
  setContextConsent,
  sendDiscernmentDialogueTurn,
  startDiscernmentDialogue,
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

  it('uses explicit versioned routes for discernment cases, dialogue and gospel paths', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() => response())
    await listDiscernmentCases()
    await createDiscernmentCase({ title: 'case' })
    await startDiscernmentDialogue('case-1', { preferred_depth: 'standard' })
    await sendDiscernmentDialogueTurn('session-1', { answer: 'answer' })
    await buildDiscernmentGospelPath('case-1', { preferred_depth: 'standard' })
    const calls = fetchMock.mock.calls
    expect(calls[0][0]).toContain('/v1/platform/discernment/cases')
    expect(calls[1][1].method).toBe('POST')
    expect(calls[2][0]).toContain('/cases/case-1/dialogue')
    expect(calls[3][0]).toContain('/dialogues/session-1/turns')
    expect(calls[4][0]).toContain('/cases/case-1/gospel-path')
    expect(calls.slice(1).every(([, options]) => options.credentials === 'same-origin')).toBe(true)
  })

  it('maps Batches 07-10 to explicit formation, collaboration, theology and privacy routes', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() => response())
    await createFormationEvent({ context: 'work' })
    await createFormationReview(30)
    await createCollaborationConsent({ recipient_email: 'mentor@example.test' })
    await createCollaborationDisclosure({ consent_id: 'grant-1' })
    await createTheologySource({ title: 'source' })
    await createTheologyQuery({ question: 'question' })
    await getDiscernmentCertificationStatus()
    await exportExtendedDiscernmentData()
    await deleteExtendedDiscernmentData()
    const calls = fetchMock.mock.calls
    expect(calls.map(([url]) => url)).toEqual(expect.arrayContaining([
      expect.stringContaining('/discernment/formation/events'),
      expect.stringContaining('/discernment/formation/reviews'),
      expect.stringContaining('/discernment/collaboration/consents'),
      expect.stringContaining('/discernment/collaboration/disclosures'),
      expect.stringContaining('/discernment/theology/sources'),
      expect.stringContaining('/discernment/theology/queries'),
      expect.stringContaining('/discernment/certification/status'),
      expect.stringContaining('/discernment/data-export'),
      expect.stringContaining('/discernment/extended-data'),
    ]))
    expect(calls.at(-1)[1].method).toBe('DELETE')
    expect(calls.every(([, options]) => options.credentials === 'same-origin')).toBe(true)
  })
})
