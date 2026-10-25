import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { BEACON_URL, verifyCanonicalHTML, verifyAnalyticsTraffic } from '../../scripts/verify-canonical-html.mjs'

const source = '9e736ac26813d9c21838bc8e0a06e8d78d50feb5'
const html = readFileSync('index.html')
const digest = value => createHash('sha256').update(value).digest('hex')
const manifest = { sourceCommit: source, files: { 'index.html': digest(html) } }
const headers = { 'content-security-policy': `script-src 'self' ${BEACON_URL}`, 'cache-control': 'public, max-age=0, must-revalidate, no-transform' }
const input = () => ({ html, expectedHTML: html, manifest: structuredClone(manifest), expectedManifest: structuredClone(manifest), expectedSource: source, headers: { ...headers }, production: true })
const traffic = () => [
  { kind: 'response', url: BEACON_URL, method: 'GET', path: '/beacon.min.js', status: 200 },
  { kind: 'request', url: 'https://cloudflareinsights.com/cdn-cgi/rum', method: 'POST', path: '/cdn-cgi/rum' },
  { kind: 'response', url: 'https://cloudflareinsights.com/cdn-cgi/rum', method: 'POST', path: '/cdn-cgi/rum', status: 204 },
]

describe('strict canonical HTML verifier', () => {
  it('accepts exact raw bytes and the actual expected manifest', () => {
    expect(verifyCanonicalHTML(input())).toMatchObject({ rawHTMLBytesEqual: true, rawHTMLSHA256: digest(html), beaconCount: 1 })
  })
  it('rejects an appended edge beacon rather than normalizing it away', () => {
    const value = input();value.html = Buffer.concat([html, Buffer.from('<script data-cf-beacon="{}"></script>')])
    expect(() => verifyCanonicalHTML(value)).toThrow('no normalization allowed')
  })
  it('rejects whitespace-only raw changes', () => {
    const value = input();value.html = Buffer.concat([html, Buffer.from('\n')])
    expect(() => verifyCanonicalHTML(value)).toThrow('no normalization allowed')
  })
  it('rejects the wrong source and forged full-map metadata', () => {
    const wrongSource = input();wrongSource.manifest.sourceCommit = '0'.repeat(40)
    expect(() => verifyCanonicalHTML(wrongSource)).toThrow('source differs')
    const wrongMap = input();wrongMap.manifest.files['assets/unverified.js'] = '0'.repeat(64)
    expect(() => verifyCanonicalHTML(wrongMap)).toThrow('actual CI build')
  })
  it('rejects a missing effective no-transform header or beacon CSP permission', () => {
    const cache = input();cache.headers['cache-control'] = 'public, max-age=0, must-revalidate'
    expect(() => verifyCanonicalHTML(cache)).toThrow('no-transform')
    const csp = input();csp.headers['content-security-policy'] = "script-src 'self'"
    expect(() => verifyCanonicalHTML(csp)).toThrow('CSP blocks')
  })
  it('keeps preview explicitly separate from production header acceptance', () => {
    const value = input();value.production = false;delete value.headers['cache-control']
    expect(verifyCanonicalHTML(value).rawHTMLBytesEqual).toBe(true)
    value.production = true
    expect(() => verifyCanonicalHTML(value)).toThrow('cache policy')
  })
})

describe('analytics traffic assertions', () => {
  it('requires actual accepted POST metadata for production', () => {
    expect(verifyAnalyticsTraffic(traffic(), true).acceptedPOSTResponses).toBe(1)
    expect(() => verifyAnalyticsTraffic(traffic().slice(0, 2), true)).toThrow('No accepted real analytics POST')
  })
  it('rejects script failure and duplicate loads', () => {
    const failed = traffic();failed[0].status = 403
    expect(() => verifyAnalyticsTraffic(failed, true)).toThrow('did not load')
    const duplicate = traffic();duplicate.push({ ...duplicate[0] })
    expect(() => verifyAnalyticsTraffic(duplicate, true)).toThrow('exactly once')
  })
  it('does not count rejected or absent requests as acceptance', () => {
    const rejected = traffic();rejected[2].status = 403
    expect(() => verifyAnalyticsTraffic(rejected, true)).toThrow('No accepted real analytics POST')
    expect(() => verifyAnalyticsTraffic(traffic().slice(0, 1), true)).toThrow('No actual browser-generated')
  })
  it('does not promote preview script/CSP coverage to provider acceptance', () => {
    expect(verifyAnalyticsTraffic(traffic().slice(0, 2), false)).toMatchObject({ acceptedPOSTResponses: 0, acceptance: 'PREVIEW_SCRIPT_AND_CSP_ONLY_NOT_PROVIDER_ACCEPTANCE' })
  })
  it('rejects a late accepted POST even when the event loop resumes after the deadline', () => {
    const rows = traffic().map((row, index) => ({ ...row, atMs: index === 2 ? 5001 : 100 }))
    expect(() => verifyAnalyticsTraffic(rows, true, 5000)).toThrow('No accepted real analytics POST')
    rows[2].atMs = 5000
    expect(verifyAnalyticsTraffic(rows, true, 5000).acceptedPOSTResponses).toBe(1)
  })
})
