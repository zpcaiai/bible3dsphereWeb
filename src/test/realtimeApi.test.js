import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../auth', () => ({
  getToken: () => 'session-token',
  hasRealToken: () => true,
}))

import { buildWsUrl } from '../realtime/realtimeApi'

describe('realtime WebSocket tickets', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('uses the in-memory Bearer token when exchanging for a short-lived ticket', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ ticket: 'short-lived-ticket' }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const url = await buildWsUrl()

    expect(fetchMock).toHaveBeenCalledWith('/api/rtc/ws-ticket', expect.objectContaining({
      method: 'POST',
      credentials: 'same-origin',
      headers: expect.objectContaining({ Authorization: 'Bearer session-token' }),
    }))
    expect(url).toContain('/api/ws/rtc?ticket=short-lived-ticket')
    expect(url).not.toContain('session-token')
  })

  it('preserves status and retry timing from readiness failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      headers: new Headers({
        'content-type': 'application/json',
        'retry-after': '5',
      }),
      json: async () => ({ detail: 'runtime initialization in progress' }),
    }))

    await expect(buildWsUrl()).rejects.toMatchObject({
      status: 503,
      retryAfterMs: 5000,
      message: 'runtime initialization in progress',
    })
  })
})
