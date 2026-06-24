/**
 * Request-contract tests for the Gift & Calling OS (/api/gift) helpers in src/api.js.
 *
 * Mocks fetch and asserts that frontend helpers keep backend paths, methods,
 * auth headers, and JSON payload shapes aligned with routers/gift_calling.py.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../api'

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

describe('gift api request contracts', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson()))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('fetchGiftMeta is a public GET without auth', async () => {
    await api.fetchGiftMeta()
    const { url, options } = lastFetch()
    expect(url).toBe('/api/gift/meta')
    expect(jsonHeaders(options).Authorization).toBeUndefined()
  })

  it.each([
    ['fetchGiftProfile', () => api.fetchGiftProfile('token-a'), '/api/gift/profile'],
    ['fetchGiftHistory', () => api.fetchGiftHistory('token-a', 15), '/api/gift/history?limit=15'],
    ['fetchGiftAssessment', () => api.fetchGiftAssessment(7, 'token-a'), '/api/gift/assessment/7'],
    ['fetchGiftFeedback', () => api.fetchGiftFeedback('token-a'), '/api/gift/feedback'],
    ['fetchGiftReviews', () => api.fetchGiftReviews('token-a', 10), '/api/gift/review?limit=10'],
  ])('%s sends bearer auth for protected reads', async (_name, call, expectedUrl) => {
    await call()
    const { url, options } = lastFetch()
    expect(url).toBe(expectedUrl)
    expect(jsonHeaders(options).Authorization).toBe('Bearer token-a')
  })

  it.each([
    [
      'assessGift',
      () => api.assessGift({ experiences: 'AI 与神学', use_ai: false, theological_boundary_ack: true }, 'token-a'),
      '/api/gift/assess',
      'POST',
      { experiences: 'AI 与神学', use_ai: false, theological_boundary_ack: true },
    ],
    [
      'submitGiftFeedback',
      () => api.submitGiftFeedback({ source_type: 'pastor', scores: { clarity: 5 }, confirmed_gifts: ['教导'] }, 'token-a'),
      '/api/gift/feedback',
      'POST',
      { source_type: 'pastor', scores: { clarity: 5 }, confirmed_gifts: ['教导'] },
    ],
    [
      'submitGiftReview',
      () => api.submitGiftReview({ review_type: 'self_review', observations: '弟兄被造就' }, 'token-a'),
      '/api/gift/review',
      'POST',
      { review_type: 'self_review', observations: '弟兄被造就' },
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
})
