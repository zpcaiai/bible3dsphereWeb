/**
 * Request-contract tests for src/api.js.
 *
 * These tests mock fetch and assert that frontend helpers keep backend paths,
 * methods, auth headers, and JSON payload shapes aligned.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../api'
import { setRuntimeLang } from '../i18n/runtime'

const okJson = (body = { ok: true }) => ({
  ok: true,
  status: 200,
  headers: { get: vi.fn(() => 'application/json') },
  json: vi.fn().mockResolvedValue(body),
})

const jsonHeaders = (options = {}) => options.headers || {}
const lastFetch = () => {
  const [url, options = {}] = global.fetch.mock.calls.at(-1)
  return { url, options }
}

describe('api request contracts', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson()))
  })

  afterEach(() => {
    setRuntimeLang('zh')
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it.each([
    ['fetchJournals', () => api.fetchJournals('token-a', 2, 3), '/api/devotion/journals?limit=2&offset=3'],
    ['fetchPrayers', () => api.fetchPrayers(7, 4, 'token-a'), '/api/prayers?limit=7&offset=4'],
    ['fetchVoiceGroups', () => api.fetchVoiceGroups('token-a'), '/api/voice/groups'],
    ['fetchWaitingCases', () => api.fetchWaitingCases('token-a', 9), '/api/waiting/cases?limit=9'],
    ['fetchMyChurch', () => api.fetchMyChurch('token-a'), '/api/church/me'],
    ['fetchDiscipleProfile', () => api.fetchDiscipleProfile('token-a'), '/api/disciple/profile'],
    ['fetchDewToday', () => api.fetchDewToday(5, 'token-a'), '/api/dew/today?tier=5'],
    ['fetchAgentMeta', () => api.fetchAgentMeta('token-a'), '/api/agent/meta'],
  ])('%s sends bearer auth for protected reads', async (_name, call, expectedUrl) => {
    await call()

    const { url, options } = lastFetch()
    expect(url).toBe(expectedUrl)
    expect(jsonHeaders(options).Authorization).toBe('Bearer token-a')
  })

  it.each([
    [
      'saveJournal',
      () => api.saveJournal({ date: '2026-06-09', title: 'quiet', content: 'body' }, 'token-a'),
      '/api/devotion/journals',
      'POST',
      { date: '2026-06-09', title: 'quiet', content: 'body' },
    ],
    [
      'submitPrayer',
      () => api.submitPrayer('pray', true, 'token-a', true),
      '/api/prayers',
      'POST',
      { content: 'pray', is_anonymous: true, is_public: true },
    ],
    [
      'submitCheckin',
      () => api.submitCheckin({ emotionLabel: 'peace', note: 'steady' }, 'token-a'),
      '/api/user/checkin',
      'POST',
      { emotionLabel: 'peace', note: 'steady' },
    ],
    [
      'updateUserProfile',
      () => api.updateUserProfile({ nickname: 'Stephen' }, 'token-a'),
      '/api/user/profile',
      'PUT',
      { nickname: 'Stephen' },
    ],
    [
      'createVoiceGroup',
      () => api.createVoiceGroup('Morning', 'token-a', 12),
      '/api/voice/groups',
      'POST',
      { name: 'Morning', max_members: 12 },
    ],
    [
      'joinVoiceGroup',
      () => api.joinVoiceGroup('ABC123', 'token-a'),
      '/api/voice/groups/join',
      'POST',
      { join_code: 'ABC123' },
    ],
    [
      'createWaitingCase',
      () => api.createWaitingCase({ title: 'calling' }, 'token-a'),
      '/api/waiting/cases',
      'POST',
      { title: 'calling' },
    ],
    [
      'analyzeWaitingCase',
      () => api.analyzeWaitingCase('case-1', 'token-a', false),
      '/api/waiting/cases/case-1/analyze',
      'POST',
      { use_ai: false },
    ],
    [
      'diagnoseGospel',
      () => api.diagnoseGospel({ wound: 'fear' }, 'token-a'),
      '/api/gospel/diagnose',
      'POST',
      { wound: 'fear' },
    ],
    [
      'submitCheckup',
      () => api.submitCheckup({ anxious: 4 }, 'token-a'),
      '/api/checkup/submit',
      'POST',
      { ratings: { anxious: 4 }, use_ai: true },
    ],
    [
      'assessDisciple',
      () => api.assessDisciple({ practices: ['prayer'] }, 'token-a'),
      '/api/disciple/assess',
      'POST',
      { practices: ['prayer'] },
    ],
    [
      'chatAgent',
      () => api.chatAgent('spurgeon', [{ role: 'user', content: 'help' }], 'token-a'),
      '/api/agent/chat',
      'POST',
      { agent: 'spurgeon', messages: [{ role: 'user', content: 'help' }] },
    ],
  ])('%s sends the expected write request', async (_name, call, expectedUrl, method, body) => {
    await call()

    const { url, options } = lastFetch()
    expect(url).toBe(expectedUrl)
    expect(options.method).toBe(method)
    expect(jsonHeaders(options)['Content-Type']).toBe('application/json')
    expect(jsonHeaders(options).Authorization).toBe('Bearer token-a')
    expect(JSON.parse(options.body)).toEqual(body)
  })

  it.each([
    ['deleteJournal', () => api.deleteJournal('journal-1', 'token-a'), '/api/devotion/journals/journal-1', 'DELETE'],
    ['amenPrayer', () => api.amenPrayer('prayer-1', 'token-a'), '/api/prayers/prayer-1/amen', 'POST'],
    ['updatePrayerStatus', () => api.updatePrayerStatus('prayer-1', 'answered', 'token-a'), '/api/prayers/prayer-1/status', 'PATCH'],
    ['deletePrayer', () => api.deletePrayer('prayer-1', 'token-a'), '/api/prayers/prayer-1', 'DELETE'],
    ['completeWaitingPractice', () => api.completeWaitingPractice('practice-1', { reflection: 'done' }, 'token-a'), '/api/waiting/practices/practice-1/complete', 'POST'],
    ['leaveChurch', () => api.leaveChurch('token-a'), '/api/church/leave', 'POST'],
    ['endDiscipleRelationship', () => api.endDiscipleRelationship('rel-1', 'token-a'), '/api/disciple/network/rel-1/end', 'POST'],
  ])('%s keeps mutation endpoint and auth contract', async (_name, call, expectedUrl, method) => {
    await call()

    const { url, options } = lastFetch()
    expect(url).toBe(expectedUrl)
    expect(options.method).toBe(method)
    expect(jsonHeaders(options).Authorization).toBe('Bearer token-a')
  })

  it('normalizes community post payload before sending', async () => {
    await api.createCommunityPost(
      { content: 'hello', statusKey: 'peace', statusLabel: 'Peace', statusEmoji: ':dove:' },
      'token-a',
      true,
    )

    const { url, options } = lastFetch()
    expect(url).toBe('/api/community/feed')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({
      content: 'hello',
      status_key: 'peace',
      status_label: 'Peace',
      status_emoji: ':dove:',
      is_public: true,
    })
  })

  it.each([
    [
      'fetchVersePrayer',
      () => api.fetchVersePrayer('John 3:16', 'For God so loved the world'),
      { prayer: 'Lord, thank You.', reference: 'John 3:16' },
      '/api/verse-prayer',
    ],
    [
      'fetchMeditationQuestions',
      () => api.fetchMeditationQuestions('John 3:16', 'For God so loved the world'),
      { questions: ['What does this reveal about God?'] },
      '/api/meditation-questions',
    ],
  ])('%s sends X-Lang for generated verse content', async (_name, call, body, expectedUrl) => {
    setRuntimeLang('en')
    global.fetch.mockResolvedValueOnce(okJson(body))

    await call()

    const { url, options } = lastFetch()
    expect(url).toBe(expectedUrl)
    expect(options.method).toBe('POST')
    expect(jsonHeaders(options)['Content-Type']).toBe('application/json')
    expect(jsonHeaders(options)['X-Lang']).toBe('en')
  })
})
