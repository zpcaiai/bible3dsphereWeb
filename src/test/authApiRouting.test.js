import { afterEach, expect, it, vi } from 'vitest'
import { authApiBase, fetchCurrentUser } from '../auth'

vi.mock('../api', () => ({ API_BASE: 'https://legacy.example/api' }))
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.removeItem('bible-sphere-user') })

it('keeps public-site login and session restoration on the same-origin proxy', () => {
  expect(authApiBase('holiness.uk')).toBe('/api')
  expect(authApiBase('www.holiness.uk')).toBe('/api')
})

it('preserves the configured authentication API on other deployments', () => {
  expect(authApiBase('localhost')).toBe('https://legacy.example/api')
  expect(authApiBase('other.example')).toBe('https://legacy.example/api')
})

it('restores the current session through the site proxy with same-origin cookies', async () => {
  vi.stubGlobal('window', { location: { hostname: 'holiness.uk' } })
  const fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ 'Content-Type': 'application/json' }), json: async () => ({ ok: true, user: { id: 7 } }) })
  vi.stubGlobal('fetch', fetch)
  expect(await fetchCurrentUser()).toEqual({ id: 7 })
  expect(fetch).toHaveBeenCalledWith('/api/auth/me', { credentials: 'same-origin' })
})
