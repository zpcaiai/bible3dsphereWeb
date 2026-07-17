import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { buildWsUrl } = vi.hoisted(() => ({ buildWsUrl: vi.fn() }))

vi.mock('../realtime/realtimeApi', () => ({
  buildWsUrl,
  fetchDirectVoiceToken: vi.fn(),
  fetchVoiceEnabled: vi.fn(),
}))

import { RealtimeStore } from '../realtime/realtimeStore'

describe('RealtimeStore reconnect policy', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    buildWsUrl.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('does not retry a permanent ticket authentication failure', async () => {
    buildWsUrl.mockRejectedValue(Object.assign(new Error('Authentication required'), { status: 401 }))
    const store = new RealtimeStore()

    store.start({ email: 'user@example.com' })
    await vi.advanceTimersByTimeAsync(60000)

    expect(buildWsUrl).toHaveBeenCalledTimes(1)
    expect(store.enabled).toBe(false)
  })

  it('retries a transient startup failure after the server Retry-After delay', async () => {
    const sockets = []
    class MockWebSocket {
      constructor(url) {
        this.url = url
        sockets.push(this)
      }
      close() {}
    }
    vi.stubGlobal('WebSocket', MockWebSocket)
    buildWsUrl
      .mockRejectedValueOnce(Object.assign(new Error('starting'), { status: 503, retryAfterMs: 5000 }))
      .mockResolvedValueOnce('wss://example.test/api/ws/rtc?ticket=ready')
    const store = new RealtimeStore()

    store.start({ email: 'user@example.com' })
    await vi.advanceTimersByTimeAsync(4999)
    expect(buildWsUrl).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    expect(buildWsUrl).toHaveBeenCalledTimes(2)
    expect(sockets).toHaveLength(1)
  })
})
