import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hydrateBatch14LocalCaches, setBatch14AuthToken, syncBatch14Record } from '../lib/batch14Api'

describe('batch14Api sync bridge', () => {
  beforeEach(() => {
    localStorage.clear()
    setBatch14AuthToken('')
    vi.restoreAllMocks()
  })

  it('posts a local Batch 1-4 record when an auth token exists', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, record: { id: 'focus_1' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
    vi.stubGlobal('fetch', fetchMock)
    setBatch14AuthToken('token-1')

    syncBatch14Record('virtue_vice', 'focuses', { id: 'focus_1', userId: 'u1', status: 'active' })

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/spiritual-formation/batch1-4/records/virtue_vice/focuses')
    expect(init.headers.Authorization).toBe('Bearer token-1')
    expect(JSON.parse(init.body).payload.id).toBe('focus_1')
  })

  it('hydrates remote payloads into the matching local cache', async () => {
    const fetchMock = vi.fn(async (url) => {
      const items = url.includes('/records/scripture/memory_items')
        ? [{ payload: { id: 'memory_1', userId: 'u1', verseId: 'john_15_5' } }]
        : []
      return new Response(JSON.stringify({ ok: true, items }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await hydrateBatch14LocalCaches('token-2')

    expect(result.hydrated).toBe(1)
    const memoryItems = JSON.parse(localStorage.getItem('scriptureFormation.memoryItems'))
    expect(memoryItems).toEqual([{ id: 'memory_1', userId: 'u1', verseId: 'john_15_5' }])
  })
})
