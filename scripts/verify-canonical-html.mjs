import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, statfsSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { execFileSync } from 'node:child_process'
import os from 'node:os'
import { URL } from 'node:url'
import { JSDOM } from 'jsdom'
import { chromium } from '@playwright/test'

export const BEACON_URL = 'https://static.cloudflareinsights.com/beacon.min.js'
const siteIdentitySHA256 = '4d52b65daf1a65696bbd3bcda4131d1042987ce085dd48447cd2b897d0f12023'
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')

export function verifyCanonicalHTML({ html, expectedHTML, manifest, expectedManifest, expectedSource, headers, production }) {
  assert.match(expectedSource, /^[a-f0-9]{40}$/)
  assert.equal(manifest.sourceCommit, expectedSource, 'Canonical source differs from this checkout')
  assert.deepEqual(manifest, expectedManifest, 'Canonical manifest differs from actual CI build')
  assert.equal(sha256(expectedHTML), expectedManifest.files['index.html'], 'Actual CI HTML differs from its manifest')
  assert.equal(sha256(html), sha256(expectedHTML), 'Canonical raw HTML differs from actual CI HTML; no normalization allowed')
  const document = new JSDOM(html.toString('utf8')).window.document
  const beacons = [...document.querySelectorAll('script[data-cf-beacon]')]
  assert.equal(beacons.length, 1, 'Exactly one existing-provider beacon is required')
  const beacon = beacons[0]
  assert.equal(beacon.getAttribute('src'), BEACON_URL)
  assert.equal(beacon.type, 'module')
  assert(beacon.hasAttribute('async'), 'Analytics must not delay app DOM readiness')
  assert.equal(beacon.parentElement, document.body)
  const config = JSON.parse(beacon.dataset.cfBeacon)
  assert.deepEqual(Object.keys(config), ['token'])
  assert.equal(sha256(config.token), siteIdentitySHA256, 'Existing analytics site identity changed')
  const policy = headers['content-security-policy'] || ''
  const scripts = policy.split(';').map(value => value.trim()).find(value => value.startsWith('script-src '))
  assert(scripts?.split(/\s+/).includes(BEACON_URL), 'Effective CSP blocks the exact analytics script')
  if (production) {
    const cache = (headers['cache-control'] || '').split(',').map(value => value.trim())
    for (const value of ['public', 'max-age=0', 'must-revalidate', 'no-transform']) assert(cache.includes(value), 'Effective HTML cache policy missing ' + value)
  }
  return { rawHTMLBytesEqual: true, rawHTMLSHA256: sha256(html), actualCIHTMLSHA256: sha256(expectedHTML), beaconCount: beacons.length, siteIdentitySHA256 }
}

export function verifyAnalyticsTraffic(input, production, deadlineMs = Infinity) {
  const rows = input.filter(row => deadlineMs === Infinity || Number.isFinite(row.atMs) && row.atMs <= deadlineMs)
  const scripts = rows.filter(row => row.kind === 'response' && row.url === BEACON_URL)
  assert.equal(scripts.length, 1, 'Beacon script must load exactly once per actual browser navigation')
  assert.equal(scripts[0].status, 200, 'Actual provider script did not load')
  const posts = rows.filter(row => row.method === 'POST' && row.path === '/cdn-cgi/rum')
  assert(posts.some(row => row.kind === 'request'), 'No actual browser-generated analytics request')
  const accepted = posts.filter(row => row.kind === 'response' && row.status >= 200 && row.status < 300)
  if (production) assert(accepted.length > 0, 'No accepted real analytics POST within original five-second observation')
  return { scriptLoads: scripts.length, actualPOSTRequests: posts.filter(row => row.kind === 'request').length, acceptedPOSTResponses: accepted.length,
    acceptance: production ? 'REAL_BROWSER_HTTP_ACCEPTED_NOT_DASHBOARD_CERTIFICATION' : 'PREVIEW_SCRIPT_AND_CSP_ONLY_NOT_PROVIDER_ACCEPTANCE' }
}

async function main() {
  const output = resolve(process.env.CANONICAL_HTML_EVIDENCE_DIR)
  mkdirSync(output, { recursive: false })
  const mode = process.env.CANONICAL_HTML_MODE || 'production'
  assert(['production', 'preview'].includes(mode))
  const production = mode === 'production'
  const base = new URL(process.env.CANONICAL_HTML_BASE_URL || 'https://holiness.uk')
  assert(production ? base.origin === 'https://holiness.uk' : ['http://127.0.0.1:4173', 'http://localhost:4173'].includes(base.origin))
  assert(base.pathname === '/' && !base.search && !base.hash && !base.username && !base.password)
  const env = { ...process.env };delete env.BUILD_REPRO_F7_INPUT_BASE64
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8', env, timeout: 5000 }).trim()
  const source = git('rev-parse', 'HEAD')
  const receipt = { executed: true, pid: process.pid, command: process.argv, mode, source, status: 'RUNNING', admission: [], pages: [], network: [],
    scope: 'Exact decoded HTTP entity bytes against this CI build; real Chrome script/CSP/analytics traffic. No historical cause, dashboard, digital-human provider, media or human approval.' }
  let browser
  const started = performance.now()
  const deadline = setTimeout(() => { receipt.status = 'FAILED_INCOMPLETE';receipt.error = 'Original120s probe budget exhausted';writeFileSync(join(output, 'canonical-html-receipt.json'), JSON.stringify(receipt, null, 2));process.exit(1) }, 120000)
  try {
    assert.equal(git('status', '--porcelain', '--untracked-files=no'), '', 'Tracked source must be clean')
    const expectedSource = process.env.EXPECTED_FRONTEND_SHA || source
    assert.equal(source, expectedSource)
    const expectedDirectory = resolve(process.env.CANONICAL_HTML_EXPECTED_DIR || 'dist')
    const expectedHTML = readFileSync(join(expectedDirectory, 'index.html'))
    const expectedManifestBytes = readFileSync(join(expectedDirectory, 'release-manifest.json'))
    const expectedManifest = JSON.parse(expectedManifestBytes)
    writeFileSync(join(output, 'actual-ci-index.html'), expectedHTML)
    writeFileSync(join(output, 'actual-ci-release-manifest.json'), expectedManifestBytes)
    for (let i = 0; i < 2; i++) {
      if (i) await new Promise(resolve => setTimeout(resolve, 10000))
      const at = performance.now();await new Promise(resolve => setTimeout(resolve, 2000))
      const disk = statfsSync(process.cwd())
      const sample = { load: os.loadavg(), cpus: os.cpus().length, freeBytes: disk.bavail * disk.bsize, sampleSeconds: (performance.now() - at) / 1000 }
      sample.loadLimit = Math.min(32, 4 * sample.cpus);receipt.admission.push(sample)
      assert(sample.load[0] <= sample.loadLimit && sample.freeBytes >= 2 * 1024 ** 3 && sample.sampleSeconds <= 3, 'Original resource admission failed')
    }
    browser = await chromium.launch({ channel: 'chrome', headless: true, env })
    receipt.browser = browser.version()
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })
    const manifestResponse = await context.request.get(new URL('/release-manifest.json', base).href, { timeout: 25000 })
    assert.equal(manifestResponse.status(), 200)
    const manifestBytes = await manifestResponse.body();writeFileSync(join(output, 'canonical-release-manifest.response'), manifestBytes)
    const manifest = JSON.parse(manifestBytes)
    for (const [i, path] of ['/', '/index.html', '/seekers'].entries()) {
      const response = await context.request.get(new URL(path, base).href, { timeout: 25000 })
      assert.equal(response.status(), 200)
      const html = await response.body(), headers = response.headers()
      writeFileSync(join(output, `canonical-${i}.html`), html)
      writeFileSync(join(output, `canonical-${i}.headers.json`), JSON.stringify(headers, null, 2))
      receipt.pages.push({ path, ...verifyCanonicalHTML({ html, expectedHTML, manifest, expectedManifest, expectedSource, headers, production }) })
    }
    const page = await context.newPage()
    await page.addInitScript(() => {
      window.__analyticsCSPViolations = []
      document.addEventListener('securitypolicyviolation', event => {
        if (event.blockedURI.includes('cloudflareinsights.com')) window.__analyticsCSPViolations.push({ directive: event.effectiveDirective, blockedURI: event.blockedURI.split('?')[0] })
      })
    })
    const relevant = input => {
      const url = new URL(input)
      if (url.origin === 'https://static.cloudflareinsights.com' || url.pathname === '/cdn-cgi/rum' && [base.origin, 'https://cloudflareinsights.com'].includes(url.origin)) return { url: url.origin + url.pathname, path: url.pathname }
    }
    page.on('request', request => { const url = relevant(request.url());if (url) receipt.network.push({ kind: 'request', ...url, method: request.method(), atMs: performance.now() - started }) })
    let providerScriptResponse
    page.on('response', response => {
      const url = relevant(response.url())
      if (url) receipt.network.push({ kind: 'response', ...url, method: response.request().method(), status: response.status(), atMs: performance.now() - started })
      if (response.url() === BEACON_URL) providerScriptResponse = response
    })
    page.on('requestfailed', request => { const url = relevant(request.url());if (url) receipt.network.push({ kind: 'failed', ...url, method: request.method(), error: request.failure()?.errorText, atMs: performance.now() - started }) })
    const navigation = await page.goto(base.href, { waitUntil: 'domcontentloaded', timeout: 30000 })
    assert.equal(navigation.status(), 200)
    const navHTML = await navigation.body();writeFileSync(join(output, 'browser-navigation.html'), navHTML)
    verifyCanonicalHTML({ html: navHTML, expectedHTML, manifest, expectedManifest, expectedSource, headers: navigation.headers(), production })
    assert.equal(await page.locator('script[data-cf-beacon]').count(), 1)
    const observationStart = performance.now()
    receipt.analyticsDeadlineMs = observationStart - started + 5000
    while (performance.now() - observationStart < 5000) {
      const script = receipt.network.find(row => row.kind === 'response' && row.url === BEACON_URL)
      const post = receipt.network.find(row => row.method === 'POST' && row.path === '/cdn-cgi/rum' && (production ? row.kind === 'response' && row.status >= 200 && row.status < 300 : row.kind === 'request'))
      if (script && post) break
      await new Promise(resolve => setTimeout(resolve, 50))
    }
    receipt.analyticsObservationMs = performance.now() - observationStart
    receipt.analytics = verifyAnalyticsTraffic(receipt.network, production, receipt.analyticsDeadlineMs)
    const providerBytes = await providerScriptResponse.body()
    writeFileSync(join(output, 'actual-provider-beacon.js'), providerBytes)
    receipt.actualProviderScript = { url: BEACON_URL, bytes: providerBytes.length, sha256: sha256(providerBytes) }
    receipt.analyticsCSPViolations = await page.evaluate(() => window.__analyticsCSPViolations)
    assert.deepEqual(receipt.analyticsCSPViolations, [], 'Actual browser CSP blocked analytics')
    await page.screenshot({ path: join(output, 'browser-390.png'), fullPage: false })
    assert.equal(git('status', '--porcelain', '--untracked-files=no'), '')
    assert(performance.now() - started < 120000)
    receipt.status = 'PASS'
  } catch (error) {
    receipt.status = 'FAILED_INCOMPLETE';receipt.errorType = error.name;receipt.error = error.message;throw error
  } finally {
    try {
      if (browser) await browser.close()
    } finally {
      clearTimeout(deadline)
      receipt.elapsedSeconds = (performance.now() - started) / 1000
      if (receipt.elapsedSeconds >= 120) {
        receipt.status = 'FAILED_INCOMPLETE';receipt.budgetExceeded = true;process.exitCode = 1
      }
      writeFileSync(join(output, 'canonical-html-receipt.json'), JSON.stringify(receipt, null, 2))
      process.stdout.write(JSON.stringify(receipt) + '\n')
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve('scripts/verify-canonical-html.mjs')) await main()
