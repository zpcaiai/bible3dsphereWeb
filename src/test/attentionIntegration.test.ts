import { describe, expect, it } from 'vitest'
import { ATTENTION_ROUTES, visibleAttentionRoutes } from '../features/attention/lib/integration/route-registry'
import { attentionFeatureFlags } from '../features/attention/lib/integration/feature-flags'
import { redactAttentionLogPayload } from '../features/attention/lib/integration/log-safety'

describe('attention integration helpers', () => {
  it('keeps admin route protected and hidden for normal users', () => {
    const routes = Object.fromEntries(ATTENTION_ROUTES.map((route) => [route.key, route]))

    expect(routes.admin.requiresAdmin).toBe(true)
    expect(visibleAttentionRoutes(false).some((route) => route.key === 'admin')).toBe(false)
    expect(visibleAttentionRoutes(true).some((route) => route.key === 'admin')).toBe(true)
  })

  it('blocks demo seed flag in explicit frontend env override', () => {
    const flags = attentionFeatureFlags({ MODE: 'production', PROD: true, VITE_ATTENTION_DEMO_SEED_ENABLED: 'false' })

    expect(flags.ATTENTION_DEMO_SEED_ENABLED).toBe(false)
  })

  it('redacts sensitive attention log payload fields recursively', () => {
    const payload = redactAttentionLogPayload({
      note: 'raw note',
      nested: { prayer: 'raw prayer' },
      safeCount: 2,
    }) as Record<string, unknown>

    expect(payload.note).toBe('[REDACTED_ATTENTION_SENSITIVE]')
    expect((payload.nested as Record<string, unknown>).prayer).toBe('[REDACTED_ATTENTION_SENSITIVE]')
    expect(payload.safeCount).toBe(2)
  })
})
