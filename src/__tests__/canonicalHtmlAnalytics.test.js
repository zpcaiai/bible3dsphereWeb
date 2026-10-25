import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { JSDOM } from 'jsdom'

const html = readFileSync(resolve('index.html'), 'utf8')
const deployment = JSON.parse(readFileSync(resolve('vercel.json'), 'utf8'))
const beaconURL = 'https://static.cloudflareinsights.com/beacon.min.js'
const document = new JSDOM(html).window.document
const beacons = [...document.querySelectorAll('script[data-cf-beacon]')]
const cacheHeadersFor = pathname => deployment.headers
  .filter(rule => new RegExp(`^${rule.source}$`).test(pathname))
  .flatMap(rule => rule.headers)
  .filter(header => header.key.toLowerCase() === 'cache-control')
const csp = deployment.headers.flatMap(rule => rule.headers)
  .find(header => header.key.toLowerCase() === 'content-security-policy').value

describe('canonical HTML integrity with the existing analytics service', () => {
  it('embeds exactly one nonblocking standard provider module in the body', () => {
    expect(beacons).toHaveLength(1)
    expect(beacons[0].src).toBe(beaconURL)
    expect(beacons[0].type).toBe('module')
    expect(beacons[0].hasAttribute('async')).toBe(true)
    expect(beacons[0].parentElement).toBe(document.body)
    expect(beacons[0].textContent).toBe('')
  })

  it('reuses the publicly served site identity without unrelated provider fields', () => {
    expect(beacons).toHaveLength(1)
    const configuration = JSON.parse(beacons[0].dataset.cfBeacon)
    expect(Object.keys(configuration)).toEqual(['token'])
    expect(createHash('sha256').update(configuration.token).digest('hex'))
      .toBe('4d52b65daf1a65696bbd3bcda4131d1042987ce085dd48447cd2b897d0f12023')
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
