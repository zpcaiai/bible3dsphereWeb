import { afterEach, describe, expect, it, vi } from 'vitest'

import { crisisApi } from '../lib/api'

describe('crisis API contract', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('uses the single /api/crisis prefix', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ riskLevel: 'green' }),
    }))

    await crisisApi.triage('I am safe right now', 'en', false)

    expect(fetch).toHaveBeenCalledWith('/api/crisis/triage', expect.objectContaining({ method: 'POST' }))
  })
})
