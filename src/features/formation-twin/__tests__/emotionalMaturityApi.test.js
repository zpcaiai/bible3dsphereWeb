import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createGrowthRoute,
  getGrowthRoute,
  getProfile,
  runTriage,
} from '../emotionalMaturityApi'

afterEach(() => vi.restoreAllMocks())

function response(body = { ok: true }) {
  return { ok: true, json: async () => body }
}

describe('emotional maturity API contract', () => {
  it('sends the consent-created session id to safety triage', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response())
    await runTriage({ session_id: 'session-1', free_text: '' })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/emotional-maturity\/triage$/),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ session_id: 'session-1', free_text: '' }),
      }),
    )
  })

  it('reads profile and latest route without creating records', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response())
    await getProfile()
    await getGrowthRoute()
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/profile$/)
    expect(fetchMock.mock.calls[0][1].method).toBeUndefined()
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Content-Type')
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/route$/)
    expect(fetchMock.mock.calls[1][1].method).toBeUndefined()
  })

  it('normalizes structured API errors without exposing object stringification', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ detail: { message: 'assessment item was not presented' } }),
    })
    await expect(getProfile()).rejects.toThrow('assessment item was not presented')
  })

  it('creates a growth route only through explicit POST', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(response())
    await createGrowthRoute('profile-1', 2)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/route$/),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ emd_profile_id: 'profile-1', max_dimensions: 2 }),
      }),
    )
  })
})
