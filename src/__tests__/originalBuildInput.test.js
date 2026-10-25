// @vitest-environment node
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { assertPublishableBuildOutput, canonicalPublicBuildEnvironment, loadCanonicalPublicBuildEnvironment, privateBuildValues, recoverOriginalBuildEnvironment } from '../../scripts/original-build-input.mjs'

const source = 'a'.repeat(40), api = 'https://compile-only.example/api'
const moduleFor = extra => Buffer.from(`const input={BASE_URL:"/",MODE:"production",DEV:!1,PROD:!0,SSR:!1,VITE_API_BASE:${JSON.stringify(api)},VITE_VERCEL_GIT_COMMIT_SHA:${JSON.stringify(source)}${extra}};`)
const expected = bytes => ({ sha256: createHash('sha256').update(bytes).digest('hex'), source, api })

describe('hash-bound original compiler input, never provider execution', () => {
  it('recovers exact opaque string data without interpolation', () => {
    const bytes = moduleFor(',VITE_SERVICE_TOKEN:"compiler-test-$literal\\nvalue"')
    const env = recoverOriginalBuildEnvironment(bytes, expected(bytes))
    expect(Object.getPrototypeOf(env)).toBe(null)
    expect(env.VITE_SERVICE_TOKEN).toBe('compiler-test-$literal\nvalue')
    expect(env.VITE_API_BASE).toBe(api)
  })
  it('rejects altered bytes before parsing', () => {
    const bytes = moduleFor('')
    expect(() => recoverOriginalBuildEnvironment(Buffer.concat([bytes, Buffer.from(' ')]), expected(bytes))).toThrow('digest mismatch')
  })
  it('decodes minified multiline constant templates exactly', () => {
    const bytes = moduleFor(',VITE_VERCEL_GIT_COMMIT_MESSAGE:`compiler-test first\nsecond`')
    expect(recoverOriginalBuildEnvironment(bytes, expected(bytes)).VITE_VERCEL_GIT_COMMIT_MESSAGE).toBe('compiler-test first\nsecond')
  })
  it('rejects interpolation without executing template expressions', () => {
    const bytes = moduleFor(',VITE_SERVICE_TOKEN:`compiler-test-${globalThis.__inputExecuted=true}`')
    globalThis.__inputExecuted = false
    expect(() => recoverOriginalBuildEnvironment(bytes, expected(bytes))).toThrow('template contains an expression')
    expect(globalThis.__inputExecuted).toBe(false)
    delete globalThis.__inputExecuted
  })
  it('rejects a different source identity without printing values', () => {
    const bytes = moduleFor('')
    expect(() => recoverOriginalBuildEnvironment(bytes, { ...expected(bytes), source: 'b'.repeat(40) })).toThrow('source identity mismatch')
  })
  it('rejects a different API identity', () => {
    const bytes = moduleFor('')
    expect(() => recoverOriginalBuildEnvironment(bytes, { ...expected(bytes), api: '/different' })).toThrow('API identity mismatch')
  })
  it('never executes expressions from the module', () => {
    const bytes = moduleFor(',VITE_SERVICE_TOKEN:(globalThis.__inputExecuted=true,"compiler-test")')
    globalThis.__inputExecuted = false
    expect(() => recoverOriginalBuildEnvironment(bytes, expected(bytes))).toThrow('not a string literal')
    expect(globalThis.__inputExecuted).toBe(false)
    delete globalThis.__inputExecuted
  })
  it('rejects duplicate, computed, spread and nonpublic properties', () => {
    for (const extra of [',VITE_API_BASE:"duplicate"', ',["VITE_EXTRA"]:"computed"', ',...other', ',NODE_OPTIONS:"unrelated"']) {
      const bytes = moduleFor(extra)
      expect(() => recoverOriginalBuildEnvironment(bytes, expected(bytes))).toThrow()
    }
  })
  it('rejects missing or ambiguous environment objects', () => {
    for (const bytes of [Buffer.from('const unrelated={};'), Buffer.concat([moduleFor(''), Buffer.from('\n'), Buffer.from(moduleFor('').toString().replace('const input=', 'const second='))])]) {
      expect(() => recoverOriginalBuildEnvironment(bytes, expected(bytes))).toThrow('missing or ambiguous')
    }
  })
  it('refuses to publish private compiler inputs in logs or assets', () => {
    const values = privateBuildValues({ VITE_SERVICE_TOKEN: 'compiler-test-private-value', VITE_API_BASE: api })
    expect(() => assertPublishableBuildOutput(Buffer.from('npm run build exited 0'), values)).not.toThrow()
    expect(() => assertPublishableBuildOutput(Buffer.from('compiler-test-private-value'), values)).toThrow('publication refused')
  })
  it('rejects JSON escaping and decoded Unicode JS literals without executing them', () => {
    const secret = 'compiler-test-"quoted"\\backslash\nnewline'
    expect(() => assertPublishableBuildOutput(Buffer.from(JSON.stringify({ value: secret })), [secret])).toThrow('publication refused')
    const escaped = Array.from(secret).map(char => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0')).join('')
    expect(() => assertPublishableBuildOutput(Buffer.from('const value="' + escaped + '";'), [secret], true)).toThrow('publication refused')
  })
  it('permits declared public tokens while withholding unrelated service inputs', () => {
    const values = privateBuildValues({ VITE_MAPBOX_TOKEN: 'compiler-test-public-map', VITE_CESIUM_TOKEN: 'compiler-test-public-cesium', VITE_SERVICE_TOKEN: 'compiler-test-private-service' })
    expect(values).toEqual(['compiler-test-private-service'])
    expect(() => assertPublishableBuildOutput(Buffer.from('const token="compiler-test-public-map";'), values, true)).not.toThrow()
  })
  it('copies supported public defaults without the historical API, provider keys or metadata', () => {
    const value = canonicalPublicBuildEnvironment({}, { VITE_MAPBOX_TOKEN: 'compiler-test-public-map', VITE_API_BASE: api, VITE_DEEPGRAM_API_KEY: 'compiler-test-private', VITE_VERCEL_ENV: 'production' })
    expect(value).toEqual({ VITE_MAPBOX_TOKEN: 'compiler-test-public-map' })
  })
  it('preserves explicit public overrides including empty values', () => {
    expect(canonicalPublicBuildEnvironment({ VITE_API_BASE: '/custom', VITE_MAPBOX_TOKEN: '' }, { VITE_API_BASE: api, VITE_MAPBOX_TOKEN: 'compiler-test-default' })).toEqual({ VITE_API_BASE: '/custom', VITE_MAPBOX_TOKEN: '' })
  })
  it('needs no remote defaults when public map configuration is explicit', async () => {
    await expect(loadCanonicalPublicBuildEnvironment({ VITE_MAPBOX_TOKEN: '', VITE_DEEPGRAM_API_KEY: 'compiler-test-private' })).resolves.toEqual({ VITE_MAPBOX_TOKEN: '' })
  })
})
