import { beforeAll, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { Script } from 'node:vm'
import { JSDOM } from 'jsdom'

const html = readFileSync(resolve('index.html'), 'utf8')
const deployment = JSON.parse(readFileSync(resolve('vercel.json'), 'utf8'))
const beaconURL = 'https://static.cloudflareinsights.com/beacon.min.js'
const bootstrap = new Script(readFileSync(resolve('public/js/lang-init.js'), 'utf8'), { filename: 'public/js/lang-init.js' })
let document, beacons, context
beforeAll(async () => {
  const dom = new JSDOM(html, { url: 'https://holiness.uk/', runScripts: 'outside-only' })
  context = dom.getInternalVMContext()
  const ready = new Promise(resolve => dom.window.document.addEventListener('DOMContentLoaded', resolve, { once: true }))
  bootstrap.runInContext(context)
  await ready
  document = dom.window.document
  beacons = [...document.querySelectorAll('script[data-cf-beacon]')]
})
const cacheHeadersFor = pathname => deployment.headers
  .filter(rule => new RegExp(`^${rule.source}$`).test(pathname))
  .flatMap(rule => rule.headers)
  .filter(header => header.key.toLowerCase() === 'cache-control')
const csp = deployment.headers.flatMap(rule => rule.headers)
  .find(header => header.key.toLowerCase() === 'content-security-policy').value

describe('canonical HTML integrity with the existing analytics service', () => {
  it('keeps the original HTML free of edge or source-injected analytics tags', () => {
    expect(new JSDOM(html).window.document.querySelectorAll('script[data-cf-beacon]')).toHaveLength(0)
  })
  it('embeds exactly one nonblocking standard provider module in the body', () => {
    expect(beacons).toHaveLength(1)
    expect(beacons[0].src).toBe(beaconURL)
    expect(beacons[0].type).toBe('module')
    expect(beacons[0].hasAttribute('async')).toBe(true)
    expect(beacons[0].parentElement).toBe(document.body)
    expect(beacons[0].textContent).toBe('')
  })

  it('reuses the publicly served site identity and original proxy metadata', () => {
    expect(beacons).toHaveLength(1)
    const configuration = JSON.parse(beacons[0].dataset.cfBeacon)
    expect(Object.keys(configuration)).toEqual(['version', 'token', 'r', 'spa'])
    expect(createHash('sha256').update(configuration.token).digest('hex'))
      .toBe('4d52b65daf1a65696bbd3bcda4131d1042987ce085dd48447cd2b897d0f12023')
  })

  it('preserves the complete original edge beacon metadata byte identity', () => {
    expect(createHash('sha256').update(beacons[0].dataset.cfBeacon).digest('hex'))
      .toBe('38d12d8ab8604c6ad9475a453416cb6f24cc238783d0ce59975a4b8d0c52ec8c')
    expect(JSON.parse(beacons[0].dataset.cfBeacon)).toMatchObject({ version: '2024.11.0', r: 1, spa: 2 })
  })

  it('does not duplicate the provider when the existing boot entry runs twice', () => {
    bootstrap.runInContext(context)
    expect(document.querySelectorAll('script[data-cf-beacon]')).toHaveLength(1)
  })

  it.each(['/', '/index.html', '/seekers', '/caregiver/', '/amor-survey', '/amor-survey/stats', '/attention/admin', '/sunday-school/ai-formation/scenarios'])('prevents edge mutation of app HTML at %s', pathname => {
    expect(cacheHeadersFor(pathname)).toEqual([
      { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate, no-transform' },
    ])
  })

  it.each(['/api', '/api/health', '/api/digital-human/david/study', '/assets', '/assets/index-abc.js', '/js/lang-init.js', '/release-manifest.json', '/sw.js', '/portraits/david.webp', '/privacy.html'])('does not override API or static file cache policy at %s', pathname => {
    expect(cacheHeadersFor(pathname)).toEqual([])
  })

  it('allows only the exact documented beacon script in addition to the previous script policy', () => {
    const scriptPolicy = csp.split(';').map(value => value.trim()).find(value => value.startsWith('script-src '))
    expect(scriptPolicy.split(/\s+/)).toEqual([
      'script-src', "'self'", 'blob:', 'https://cdn.jsdelivr.net', beaconURL,
    ])
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'")
    expect(csp).not.toContain('script-src *')
  })

  it('preserves the existing API destination and global security headers', () => {
    expect(deployment.rewrites).toEqual([
      { source: '/api/:path*', destination: 'https://stephenzao-biblesphere.hf.space/api/:path*' },
      { source: '/(.*)', destination: '/index.html' },
    ])
    const global = deployment.headers.find(rule => rule.source === '/(.*)').headers
    expect(global.filter(header => header.key !== 'Content-Security-Policy')).toEqual([
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'geolocation=(self), microphone=(self), camera=()' },
    ])
  })
})
