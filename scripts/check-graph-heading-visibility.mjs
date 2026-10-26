import fs from 'node:fs'
import os from 'node:os'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'
import { startCausalWitness } from './graph-entry-witness.mjs'

const root = process.env.GRAPH_HEADING_VISIBILITY_DIR || os.tmpdir() + '/heading-visibility-' + process.pid + '-' + Date.now()
fs.mkdirSync(root, { recursive: false })
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const out = {
  scope: 'Actual Chrome DOM control for the diagnostic heading marker only. Zero backend calls; this is not a product graph regression, historical reproduction or certification.',
  command: process.argv, executed: true, pid: process.pid,
  sourceSHA: process.env.GITHUB_SHA || null,
  witnessSourceSHA256: crypto.createHash('sha256').update(fs.readFileSync(new URL('./graph-entry-witness.mjs', import.meta.url))).digest('hex'),
  gate: [], results: [], historicalUniqueRoot: 'UNKNOWN/BLOCKED_INCOMPLETE', certification: 'NOT_CERTIFIED',
}
let browser
try {
  for (let index = 0; index < 2; index++) {
    if (index) await pause(10000)
    const start = performance.now(); await pause(2000)
    const disk = fs.statfsSync(process.cwd())
    const row = { at: Date.now(), load: os.loadavg(), cpus: os.cpus().length, freeBytes: disk.bavail * disk.bsize, sampleSeconds: (performance.now() - start) / 1000 }
    row.loadLimit = Math.min(32, 4 * row.cpus)
    row.admitted = row.load[0] <= row.loadLimit && row.freeBytes >= 2 * 1024 ** 3 && row.sampleSeconds <= 3
    out.gate.push(row)
    if (!row.admitted) { out.status = 'NOT_RUN_RESOURCE_GATE'; process.exitCode = 2; break }
  }
  if (!process.exitCode) {
    browser = await chromium.launch({ channel: 'chrome', headless: true })
    out.browserVersion = browser.version()
    for (const positive of [false, true]) {
      const context = await browser.newContext({ viewport: { width: 320, height: 844 } })
      const page = await context.newPage()
      const deadlineAt = Date.now() + 120000
      const timer = setTimeout(() => { context.close().catch(() => {}) }, 120000)
      const row = { control: positive ? 'positive-box' : 'zero-box', expectedVisible: positive, startedAt: Date.now() }
      try {
        const dimensions = positive ? 'width:200px;height:24px;font-size:19px;line-height:24px' : 'width:0;height:0;font-size:0;line-height:0'
        await page.setContent(`<h2 style="display:block;visibility:visible;margin:0;padding:0;border:0;overflow:hidden;${dimensions}">关系图谱</h2>`)
        const heading = page.getByRole('heading', { name: '关系图谱', exact: true })
        row.box = await heading.evaluate(node => {
          const box = node.getBoundingClientRect()
          return { width: box.width, height: box.height, rects: node.getClientRects().length, visibility: getComputedStyle(node).visibility }
        })
        row.actualLocatorVisible = await heading.isVisible()
        assert.ok(row.box.rects > 0)
        assert.equal(row.box.visibility, 'visible')
        assert.equal(row.actualLocatorVisible, positive)
        const witness = await startCausalWitness(page, { deadlineAt })
        const value = await witness.finish({ name: 'diagnostic-heading-css-box-control', expectedVisible: positive })
        const filename = row.control + '-witness.json'
        fs.writeFileSync(root + '/' + filename, JSON.stringify(value, null, 2))
        row.witness = { file: filename, sha256: crypto.createHash('sha256').update(fs.readFileSync(root + '/' + filename)).digest('hex'), status: value.status }
        assert.deepEqual(value.errors, [])
        assert.ok(Object.values(value.dropped).every(count => count === 0))
        assert.ok(value.documents.some(event => event.kind === 'document-open'))
        assert.ok(value.documents.some(event => event.kind === 'observer-stats'))
        row.headingMarkers = value.documents.filter(event => event.kind === 'heading-visible').length
        assert.equal(row.headingMarkers, positive ? 1 : 0, 'Diagnostic marker must agree with actual CSS box visibility')
        row.status = 'PASS_NATIVE_COMPONENT_CONTROL'
      } catch (error) {
        row.status = 'FAIL_NATIVE_COMPONENT_CONTROL'; row.errorName = error.name; row.error = error.message; process.exitCode = 1
      } finally {
        clearTimeout(timer); row.endedAt = Date.now(); out.results.push(row); await context.close()
      }
    }
    out.status = process.exitCode ? 'FAIL_NATIVE_COMPONENT_CONTROL' : 'PASS_NATIVE_COMPONENT_CONTROL'
  }
} finally {
  if (browser) await browser.close()
  out.exit_code = process.exitCode || 0
  fs.writeFileSync(root + '/visibility-control-data.json', JSON.stringify(out, null, 2))
  process.stdout.write(JSON.stringify(out) + '\n')
}
