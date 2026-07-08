import { afterEach, describe, expect, it, vi } from 'vitest'
import { setRuntimeLang } from '../i18n/runtime'
import { assuranceAnalyze, assuranceMeta } from '../expansion/expansionEndpoints'

vi.mock('../auth', () => ({
  getToken: () => 'test-token',
}))

describe('expansionEndpoints contract', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    setRuntimeLang('zh')
  })

  it('adds lang to GET query strings', async () => {
    setRuntimeLang('en')
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ ok: true }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    await assuranceMeta()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/assurance/meta?lang=en',
      { headers: { Authorization: 'Bearer test-token' } },
    )
  })

  it('adds lang to POST bodies', async () => {
    setRuntimeLang('en')
    const fetchMock = vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ ok: true }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    await assuranceAnalyze('I need assurance')

    const [, options] = fetchMock.mock.calls[0]
    expect(JSON.parse(options.body)).toMatchObject({
      lang: 'en',
      text: 'I need assurance',
      use_ai: true,
    })
  })

  it('uses English helper errors in EN mode', async () => {
    setRuntimeLang('en')
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      text: async () => '<html>not json</html>',
    })))

    await expect(assuranceMeta()).rejects.toThrow('Backend endpoint unavailable')
  })
})
