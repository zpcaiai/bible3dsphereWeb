import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveConfig } from 'vite'
import { resolvePublicApiBase } from '../../scripts/production-build-contract.mjs'

const deployment = JSON.parse(readFileSync(resolve('vercel.json'), 'utf8'))

describe('public production build contract', () => {
  it('uses actual Vite configuration to exclude unrelated keys and deployment metadata', async () => {
    const inputs = {
      VITE_DEEPGRAM_API_KEY: 'regression-only-unused-provider-input',
      VITE_VERCEL_DEPLOYMENT_ID: 'regression-only-deployment-metadata',
      NEXT_PUBLIC_VERCEL_OBSERVABILITY_CLIENT_CONFIG: 'regression-only-metadata',
      VITE_MAPBOX_TOKEN: 'regression-only-public-map-token',
      VITE_ATTENTION_GROUPS_ENABLED: 'false',
      VITE_HYMN_AUDIO_BASE: 'https://audio.example/hymns',
    }
    const before = Object.fromEntries(Object.keys(inputs).map(key => [key, process.env[key]]))
    try {
      Object.assign(process.env, inputs)
      const actual = await resolveConfig({ logLevel: 'silent' }, 'build', 'production')
      expect(actual.env).not.toHaveProperty('VITE_DEEPGRAM_API_KEY')
      expect(actual.env).not.toHaveProperty('VITE_VERCEL_DEPLOYMENT_ID')
      expect(actual.env).not.toHaveProperty('NEXT_PUBLIC_VERCEL_OBSERVABILITY_CLIENT_CONFIG')
      expect(actual.env.VITE_MAPBOX_TOKEN).toBe(inputs.VITE_MAPBOX_TOKEN)
      expect(actual.env.VITE_ATTENTION_GROUPS_ENABLED).toBe('false')
      expect(actual.env.VITE_HYMN_AUDIO_BASE).toBe(inputs.VITE_HYMN_AUDIO_BASE)
    } finally {
      for (const [key, value] of Object.entries(before)) {
        if (value === undefined) delete process.env[key]
        else process.env[key] = value
      }
    }
  })
  it('uses the committed same-origin default when the build input is absent', () => {
    expect(deployment.env.VITE_API_BASE).toBe('/api')
    expect(resolvePublicApiBase(deployment, {})).toBe('/api')
  })
  it('preserves an explicit custom deployment API', () => {
    expect(resolvePublicApiBase(deployment, { VITE_API_BASE: 'https://custom.example/api' })).toBe('https://custom.example/api')
  })
  it('preserves an explicit empty input for the existing application fallback', () => {
    expect(resolvePublicApiBase(deployment, { VITE_API_BASE: '' })).toBe('')
  })
  it('rejects a missing committed default', () => {
    expect(() => resolvePublicApiBase({ env: {} }, {})).toThrow('Committed public API base')
  })
  it('rejects a malformed committed default', () => {
    expect(() => resolvePublicApiBase({ env: { VITE_API_BASE: 42 } }, {})).toThrow('Committed public API base')
  })
  it('rejects a malformed explicit input', () => {
    expect(() => resolvePublicApiBase(deployment, { VITE_API_BASE: 42 })).toThrow('must be a string')
  })
})
