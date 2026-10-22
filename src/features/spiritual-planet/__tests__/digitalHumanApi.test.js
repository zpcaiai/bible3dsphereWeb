import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDigitalHumanTurn, getDigitalHumanStudy } from '../digital-human/api'

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

describe('digital human request lifecycle', () => {
  it('encodes study identity and uses same-origin session credentials', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ characterId: 'david' }) })
    vi.stubGlobal('fetch', fetch)
    expect(await getDigitalHumanStudy('david')).toEqual({ characterId: 'david' })
    expect(fetch.mock.calls[0][0]).toMatch(/characters\/david\/study$/)
    expect(fetch.mock.calls[0][1].credentials).toBe('same-origin')
  })

  it('aborts an owned pending request when the caller leaves the character', async () => {
    vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })))
    const controller = new AbortController()
    const pending = createDigitalHumanTurn({ characterId: 'david', question: 'test' }, { signal: controller.signal })
    const assertion = expect(pending).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    await assertion
  })

  it('reports timeout as unconfirmed, not a completed turn', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
    })))
    const pending = createDigitalHumanTurn({ characterId: 'david', question: 'test' }, { timeoutMs: 20 })
    const assertion = expect(pending).rejects.toThrow('本次未确认完成')
    await vi.advanceTimersByTimeAsync(21)
    await assertion
  })
})
