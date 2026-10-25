// A new exact-source experiment, not a reconstruction of the historical event.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawn, execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { chromium, expect } from '@playwright/test'
import { startCausalWitness } from './graph-entry-witness.mjs'

const ORIGINAL = '45680bb247f681ceaff215310fd4b7a163aff17d'
const self = fileURLToPath(import.meta.url)
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const sha = value => crypto.createHash('sha256').update(value).digest('hex')
const root = path.resolve(process.env.GRAPH_LEGACY_EVIDENCE_DIR || '')
if (!process.env.GRAPH_LEGACY_EVIDENCE_DIR) throw Error('Explicit legacy evidence directory required')
const write = (name, value) => fs.writeFileSync(path.join(root, name), JSON.stringify(value, null, 2), { flag: 'wx' })

async function probe() {
  const width = Number(process.argv[3])
  if (![320, 390].includes(width)) throw Error('Explicit original mobile viewport required')
  const result = { scope: 'NEW_INSTRUMENTED_ORIGINAL_SOURCE_EXPERIMENT_NOT_HISTORICAL_EVENT', pid: process.pid, harnessSourceSHA: process.env.GITHUB_SHA, originalSourceSHA: ORIGINAL, width, viewport: { width, height: 844 }, startedAt: Date.now(), originalAssertionMs: 5000, headingOutcome: 'NOT_RUN', phase: 'setup', onboarding: [], parentSamples: [], observedTurnPOSTs: 0 }
  const deadlineAt = result.startedAt + 120000
  let browser, context, page, witness, stopped
  const stop = () => {
    if (witness && !stopped) stopped = witness.finish({ name: 'graph-heading-visible', assertionMs: 5000, startAt: result.assertStartAt ?? null, endAt: result.assertEndAt ?? null, outcome: result.headingOutcome }).then(value => ({ value }), error => ({ errorName: error.name }))
  }
  const timer = setTimeout(() => { result.caseDeadlineTriggeredAt = Date.now();context?.close().catch(() => {}) }, Math.max(0, deadlineAt - Date.now()))
  const sample = setInterval(() => result.parentSamples.push({ at: Date.now(), load: os.loadavg() }), 2000)
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true })
    result.browserVersion = browser.version()
    context = await browser.newContext({ baseURL: process.env.GRAPH_LEGACY_BASE_URL, viewport: result.viewport, isMobile: true, hasTouch: true })
    page = await context.newPage();page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(30000)
    page.on('request', request => { if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/v1/digital-human/turns') result.observedTurnPOSTs++ })
    await page.addInitScript(() => localStorage.setItem('app-lang', 'zh'))
    await page.addLocatorHandler(page.getByRole('button', { name: '暂时跳过', exact: true }), async button => { result.onboarding.push({ stage: 'start', at: Date.now() });await button.click();result.onboarding.push({ stage: 'end', at: Date.now() }) })
    result.phase = 'login';await page.goto('/')
    await page.getByRole('button', { name: '🔑 登录', exact: true }).click()
    const account = await page.getByLabel('默认登录账号', { exact: true }).locator('code').allTextContents()
    expect(account).toHaveLength(2)
    await page.getByLabel('邮箱', { exact: true }).fill(account[0]);await page.getByLabel('密码', { exact: true }).fill(account[1])
    const login = page.waitForResponse(response => response.url().endsWith('/api/auth/email/login')).then(response => ({ response }), error => ({ error }))
    await page.getByRole('button', { name: '🔑 登录', exact: true }).click()
    const auth = await login;if (auth.error) throw auth.error
    result.loginHTTP = auth.response.status();expect(result.loginHTTP).toBe(200)
    await expect(page.getByRole('button', { name: '退出登录', exact: true })).toBeVisible({ timeout: 5000 })
    result.phase = 'witness';witness = await startCausalWitness(page, { deadlineAt })
    result.phase = 'tap';result.beforeTapAt = Date.now();witness.mark('before-tap')
    await page.getByRole('button', { name: '人物图谱', exact: false }).tap()
    result.graphTapCompleted = true;witness.mark('tap-complete')
    result.phase = 'heading';result.assertStartAt = Date.now();witness.mark('heading-expect-start')
    await expect(page.getByRole('heading', { name: '关系图谱', exact: true })).toBeVisible({ timeout: 5000 })
    result.assertEndAt = Date.now();result.headingOutcome = 'PASS';witness.mark('heading-expect-pass');stop()
  } catch (error) {
    result.failureAt = Date.now();result.errorName = error.name
    if (result.phase === 'heading') { result.assertEndAt = result.failureAt;result.headingOutcome = 'FAIL';witness?.mark('heading-expect-fail') }
    // Never serialize auth values, arbitrary page text or actionability DOM logs.
    stop()
  } finally {
    if (page && result.loginHTTP === 200 && result.graphTapCompleted && !await page.getByLabel('默认登录账号', { exact: true }).isVisible().catch(() => true)) {
      try { await page.screenshot({ path: path.join(root, 'entry-' + result.headingOutcome + '.png') });result.screenshot = 'entry-' + result.headingOutcome + '.png' }
      catch (error) { result.captureErrorName = error.name }
    }
    stop()
    if (stopped) {
      const value = await stopped
      if (value.value) { write('causal-witness.json', value.value);result.witness = { status: value.value.status, file: 'causal-witness.json', sha256: sha(fs.readFileSync(path.join(root, 'causal-witness.json'))) } }
      else result.witnessErrorName = value.errorName
    }
    clearInterval(sample);clearTimeout(timer)
    if (context) await context.close().then(() => { result.contextCloseConfirmed = true }, error => { result.contextCloseErrorName = error.name })
    if (browser) await browser.close().then(() => { result.browserCloseConfirmed = true }, error => { result.browserCloseErrorName = error.name })
    result.endedAt = Date.now()
    result.functionalAssertionExit = result.headingOutcome === 'PASS' ? 0 : result.headingOutcome === 'FAIL' ? 1 : null
    result.recordComplete = result.loginHTTP === 200 && Boolean(result.witness?.status === 'CAPTURED_BOUNDED') && Boolean(result.screenshot) && !result.captureErrorName && !result.caseDeadlineTriggeredAt && result.contextCloseConfirmed === true && result.browserCloseConfirmed === true && !result.contextCloseErrorName && !result.browserCloseErrorName && result.observedTurnPOSTs === 0
    result.scopeLimits = 'Current runtime, service and account state differ from the historical event. NOT_RUN headings and failed assertions remain unfinished/failed, never product acceptance.'
    write('case-result.json', result)
  }
  process.exitCode = !result.recordComplete ? 2 : result.headingOutcome === 'PASS' ? 0 : result.headingOutcome === 'FAIL' ? 1 : 2
}

async function experiment() {
  fs.mkdirSync(root, { recursive: false })
  const startedAt = Date.now(), deadlineAt = startedAt + 300000
  const receipt = { scope: 'DIAGNOSTIC_ORIGINAL_SOURCE_EXPERIMENT_NOT_PRODUCT_ACCEPTANCE', executed: true, pid: process.pid, harnessSourceSHA: process.env.GITHUB_SHA, originalSourceSHA: ORIGINAL, startedAt, status: 'INCOMPLETE', phases: [], gate: [], cases: [], external: 'NOT_COMPLETED/NOT_VERIFIED/NOT_APPROVED', historicalUniqueRoot: 'UNKNOWN' }
  let preview, previewLog, previewClosed
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 16 * 1024 ** 2 }).trim()
  const remaining = () => { const value = deadlineAt - Date.now();if (value <= 0) throw Error('Original300s experiment budget exhausted');return value }
  const phase = async (name, command, args, options = {}) => {
    const log = path.join(root, name + '.log'), fd = fs.openSync(log, 'wx')
    const budget = Math.max(1, Math.floor(Math.min(remaining(), options.budget ?? 300000) / 1000))
    const argv = ['--kill-after=5s', budget + 's', command, ...args]
    const row = { name, command: ['timeout', ...argv], cwd: options.cwd ?? process.cwd(), startedAt: Date.now(), executed: false }
    receipt.phases.push(row)
    try {
      const child = spawn('timeout', argv, { cwd: row.cwd, env: options.env ?? process.env, stdio: ['ignore', fd, fd] })
      row.pid = child.pid;row.executed = Boolean(child.pid)
      const code = await new Promise((resolve, reject) => { child.once('error', reject);child.once('exit', (code, signal) => { row.signal = signal;resolve(code) }) })
      row.exit_code = code
      if (!options.observeExit) expect(code).toBe(0)
      return row
    } finally { fs.closeSync(fd);row.endedAt = Date.now();row.log = path.basename(log);row.sha256 = sha(fs.readFileSync(log)) }
  }
  const admission = async stage => {
    for (let index = 0; index < 2; index++) {
      if (index) await pause(10000)
      const at = performance.now();await pause(2000)
      const disk = fs.statfsSync(process.cwd())
      const row = { stage, at: Date.now(), load: os.loadavg(), cpus: os.cpus().length, freeBytes: disk.bavail * disk.bsize, twoSecondSampleActualSeconds: (performance.now() - at) / 1000 }
      row.loadLimit = Math.min(32, 4 * row.cpus);receipt.gate.push(row)
      expect(row.load[0]).toBeLessThanOrEqual(row.loadLimit);expect(row.freeBytes).toBeGreaterThanOrEqual(2 * 1024 ** 3);expect(row.twoSecondSampleActualSeconds).toBeLessThanOrEqual(3)
      remaining()
    }
  }
  try {
    await admission('before-original-build')
    await phase('fetch-original', 'git', ['fetch', '--depth', '1', 'origin', ORIGINAL], { budget: 60000 })
    expect(git('rev-parse', ORIGINAL)).toBe(ORIGINAL);receipt.originalTree = git('rev-parse', ORIGINAL + '^{tree}')
    const sourceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'graph-original-source-'))
    const archive = path.join(sourceRoot, 'original-source.tar'), source = path.join(sourceRoot, 'source');fs.mkdirSync(source)
    await phase('archive-original', 'git', ['archive', '--format=tar', '--output', archive, ORIGINAL])
    receipt.archiveSHA256 = sha(fs.readFileSync(archive))
    await phase('extract-original', 'tar', ['-xf', archive, '-C', source])
    const entries = execFileSync('git', ['ls-tree', '-r', '-z', ORIGINAL], { maxBuffer: 16 * 1024 ** 2 }).toString().split('\0').filter(Boolean).map(entry => {
      const [meta, name] = entry.split('\t');const [mode, type, blob] = meta.split(' ')
      expect(mode).not.toBe('120000');expect(type).toBe('blob');expect(path.resolve(source, name).startsWith(source + path.sep)).toBe(true)
      return { name, blob }
    })
    const inventory = () => Object.fromEntries(entries.map(({ name, blob }) => {
      const bytes = fs.readFileSync(path.join(source, name))
      expect(crypto.createHash('sha1').update(Buffer.from('blob ' + bytes.length + '\0')).update(bytes).digest('hex')).toBe(blob)
      return [name, sha(bytes)]
    }))
    const before = inventory();write('original-source-before.json', before)
    receipt.originalSourceFileCount = entries.length
    receipt.originalSourceBytes = entries.reduce((sum, item) => sum + fs.statSync(path.join(source, item.name)).size, 0)
    expect(sha(fs.readFileSync(path.join(source, 'package-lock.json')))).toBe(sha(fs.readFileSync('package-lock.json')))
    receipt.lockSHA256 = sha(fs.readFileSync('package-lock.json'));receipt.nodeVersion = process.version
    expect(fs.existsSync(path.join(source, 'node_modules'))).toBe(false)
    fs.symlinkSync(path.join(process.cwd(), 'node_modules'), path.join(source, 'node_modules'), 'dir')
    const environment = { ...process.env, VITE_LOCAL_API_TARGET: 'https://holiness.uk' }
    await phase('build-original', 'npm', ['run', 'build'], { cwd: source, env: environment })
    expect(inventory()).toEqual(before)
    write('original-source-after-build.json', inventory())
    const distFiles = {}
    const walk = directory => { for (const item of fs.readdirSync(directory, { withFileTypes: true })) { const file = path.join(directory, item.name);if (item.isDirectory()) walk(file);else if (item.isFile()) distFiles[path.relative(path.join(source, 'dist'), file)] = sha(fs.readFileSync(file));else throw Error('Unexpected compiled source file type') } }
    walk(path.join(source, 'dist'));write('original-build-manifest.json', distFiles)
    previewLog = fs.openSync(path.join(root, 'original-preview.log'), 'wx')
    // Original npm preview is exactly `vite preview`. Own its actual Node process
    // directly, so npm/sh wrappers cannot exit ahead of the server they started.
    const previewArgs = [path.join(source, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '4174', '--strictPort']
    preview = spawn(process.execPath, previewArgs, { cwd: source, env: environment, detached: true, stdio: ['ignore', previewLog, previewLog] })
    previewClosed = new Promise(resolve => {
      preview.once('error', error => resolve({ errorName: error.name }))
      preview.once('close', (exit_code, signal) => resolve({ exit_code, signal }))
    })
    receipt.preview = { pid: preview.pid, ownedProcessGroup: true, cwd: source, command: [process.execPath, ...previewArgs], originalNpmScript: 'vite preview' }
    expect(Number.isInteger(preview.pid) && preview.pid > 0).toBe(true)
    let ready = false
    for (let attempt = 1; attempt <= 30; attempt++) {
      remaining();expect(preview.exitCode).toBeNull()
      try {
        const response = await fetch('http://127.0.0.1:4174/', { signal: AbortSignal.timeout(Math.min(2000, remaining())) })
        const bytes = Buffer.from(await response.arrayBuffer())
        if (response.status === 200 && sha(bytes) === distFiles['index.html']) { receipt.preview.servedHTMLSHA256 = sha(bytes);ready = true;break }
      } catch { /* bounded readiness only; no page/assertion prewarming */ }
      await pause(1000)
    }
    expect(ready).toBe(true);await admission('before-original-browser-cases')
    for (const width of [390, 320]) {
      const caseRoot = path.join(root, String(width));fs.mkdirSync(caseRoot)
      const row = await phase('original-case-' + width, process.execPath, [self, 'probe', String(width)], { observeExit: true, budget: 120000, env: { ...environment, GRAPH_LEGACY_EVIDENCE_DIR: caseRoot, GRAPH_LEGACY_BASE_URL: 'http://127.0.0.1:4174' } })
      const file = path.join(caseRoot, 'case-result.json'), value = JSON.parse(fs.readFileSync(file, 'utf8'))
      receipt.cases.push({ width, commandPID: row.pid, childPID: value.pid, exit_code: row.exit_code, result: path.relative(root, file), sha256: sha(fs.readFileSync(file)), headingOutcome: value.headingOutcome })
      expect(value.recordComplete).toBe(true);expect(value.originalSourceSHA).toBe(ORIGINAL);expect(value.observedTurnPOSTs).toBe(0)
      expect([0, 1, 2]).toContain(row.exit_code)
      if (value.headingOutcome === 'PASS') expect(row.exit_code).toBe(0)
      if (value.headingOutcome === 'FAIL') expect(row.exit_code).toBe(1)
      expect(['PASS', 'FAIL']).toContain(value.headingOutcome)
    }
    expect(inventory()).toEqual(before);write('original-source-after-cases.json', inventory())
    expect(preview.exitCode).toBeNull();receipt.status = 'DIAGNOSTIC_OBSERVATIONS_COMPLETE_NOT_PRODUCT_PASS'
  } catch (error) { receipt.errorName = error.name;process.exitCode = 1 }
  finally {
    if (preview?.pid) {
      try { process.kill(-preview.pid, 'SIGTERM');receipt.preview.cleanup = 'SIGTERM_SENT_TO_OWNED_GROUP' } catch (error) { receipt.preview.cleanupErrorName = error.name }
      const closed = await Promise.race([previewClosed, pause(5000).then(() => null)])
      receipt.preview.closeObservation = closed
      let groupExists = true
      try { process.kill(-preview.pid, 0) } catch (error) { if (error.code === 'ESRCH') groupExists = false }
      if (groupExists) {
        try {
          receipt.preview.remainingGroupProcesses = execFileSync('ps', ['-eo', 'pid=,ppid=,pgid=,stat=,comm='], { encoding: 'utf8', timeout: 2000 }).split('\n').map(line => line.trim().split(/\s+/)).filter(parts => Number(parts[2]) === preview.pid).map(parts => ({ pid: Number(parts[0]), ppid: Number(parts[1]), pgid: Number(parts[2]), state: parts[3], name: parts.slice(4).join(' ') }))
        } catch (error) { receipt.preview.processStateErrorName = error.name }
      }
      receipt.preview.cleanup = closed && !groupExists ? 'OWNED_GROUP_EXIT_OBSERVED' : 'UNCONFIRMED'
      if (receipt.preview.cleanup !== 'OWNED_GROUP_EXIT_OBSERVED') { receipt.status = 'INCOMPLETE';process.exitCode = 1 }
    }
    if (previewLog !== undefined) fs.closeSync(previewLog)
    receipt.endedAt = Date.now();write('experiment-receipt.json', receipt)
    const files = {}
    const collect = directory => { for (const item of fs.readdirSync(directory, { withFileTypes: true })) { const file = path.join(directory, item.name);if (item.isDirectory()) collect(file);else if (item.isFile()) files[path.relative(root, file)] = sha(fs.readFileSync(file)) } }
    collect(root);write('manifest.json', files)
    process.stdout.write(JSON.stringify({ status: receipt.status, originalSourceSHA: ORIGINAL, cases: receipt.cases, scope: receipt.scope, historicalUniqueRoot: 'UNKNOWN' }) + '\n')
  }
}

if (process.argv[2] === 'probe') await probe()
else if (!process.argv[2] || process.argv[2] === 'run') await experiment()
else throw Error('Unsupported original-source experiment mode')
