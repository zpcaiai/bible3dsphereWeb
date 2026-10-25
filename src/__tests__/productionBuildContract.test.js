import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolvePublicApiBase } from '../../scripts/production-build-contract.mjs'

const deployment = JSON.parse(readFileSync(resolve('vercel.json'), 'utf8'))

describe('public production build contract', () => {
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
