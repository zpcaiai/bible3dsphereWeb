// Real full-project builds, exact bytes and original native deadline. No service simulation.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
import { spawn, execFileSync } from 'node:child_process'
import { assertPublishableBuildOutput, canonicalPublicBuildEnvironment, fetchOriginalBuildEnvironment, privateBuildValues } from './original-build-input.mjs'

const ORIGINAL = 'f7fac42f96f6a45be8c1601df1fa7d0a37bff7d8'
// Pinned complete 311-entry file maps from the preserved real f7 CI/production manifests.
const ORACLES = { unset: '39da9a5cbc0c8648b8a56009d9c2f1131fbbf651cf5ba4ef7fb9c6d43c158495', crossOrigin: '2a2ddd48a894c4680b3cde87fe79f21d509d1078bc15c668b0eebf6bb9219e26' }
const root = path.resolve(process.argv[2]), seconds = Number(process.argv[3])
assert(Number.isFinite(seconds) && seconds > 0 && seconds <= 300)
fs.mkdirSync(root, { recursive: false })
const startedAt = Date.now(), deadlineAt = startedAt + seconds * 1000
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex')
const load = file => JSON.parse(fs.readFileSync(file, 'utf8'))
const write = (name, value) => fs.writeFileSync(path.join(root, name), JSON.stringify(value, null, 2), { flag: 'wx' })
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
const remaining = () => { const value = deadlineAt - Date.now();assert(value > 0, 'Original native budget exhausted');return value }
const filesHash = files => hash(JSON.stringify(Object.fromEntries(Object.entries(files).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0))))
const receipt = { executed: true, pid: process.pid, originalSource: ORIGINAL, harnessSource: process.env.GITHUB_SHA, startedAt, deadlineAt, originalNativeBudgetSeconds: 300, status: 'INCOMPLETE', phases: [], gate: [], builds: [], historicalUniqueRoot: 'UNKNOWN' }
let ownedSession = false, temporary, temporaryIdentity
let privateValues = []
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 16 * 1024 ** 2, timeout: Math.floor(remaining()) }).trim()
async function run(name, command, args, cwd, env = process.env, cap = 300000) {
  const file = path.join(root, name + '.log')
  const privateFile = name === 'build-crossOrigin' ? path.join(temporary, name + '.private.log') : file
  const fd = fs.openSync(privateFile, 'wx', 0o600)
  const budget = Math.floor(Math.min(remaining(), cap) / 1000);assert(budget > 0)
  const argv = ['--foreground', '--kill-after=1s', budget + 's', command, ...args]
  const row = { name, command: ['timeout', ...argv], cwd, startedAt: Date.now(), executed: false }
  receipt.phases.push(row)
  try {
    const child = spawn('timeout', argv, { cwd, env, stdio: ['ignore', fd, fd] })
    row.pid = child.pid;row.executed = Boolean(child.pid)
    row.exit_code = await new Promise((resolve, reject) => { child.once('error', reject);child.once('close', (code, signal) => { row.signal = signal;resolve(code) }) })
    assert.equal(row.exit_code, 0, name + ' failed')
  } finally {
    fs.closeSync(fd);row.endedAt = Date.now();row.log = path.basename(file)
    const raw = fs.readFileSync(privateFile)
    if (privateFile !== file) {
      try { assertPublishableBuildOutput(raw, privateValues);fs.writeFileSync(file, raw, { flag: 'wx', mode: 0o600 }) }
      catch {
        fs.writeFileSync(file, JSON.stringify({ privateOutputWithheld: true, rawBytes: raw.length, rawSHA256: hash(raw) }), { flag: 'wx' })
        row.rawOutputWithheld = true
      }
    }
    row.sha256 = hash(fs.readFileSync(file))
    assert(!row.rawOutputWithheld, 'Private build output withheld; strict experiment incomplete')
  }
}
function manifest(dist) {
  const declared = load(path.join(dist, 'release-manifest.json')), actual = {}
  actual['index.html'] = hash(fs.readFileSync(path.join(dist, 'index.html')))
  const walk = dir => { for (const item of fs.readdirSync(dir, { withFileTypes: true })) { const file = path.join(dir, item.name);if (item.isDirectory()) walk(file);else { assert(item.isFile());actual[path.relative(dist, file)] = hash(fs.readFileSync(file)) } } }
  walk(path.join(dist, 'assets'));assert.deepEqual(actual, declared.files)
  return declared
}
try {
  const pgid = Number(execFileSync('ps', ['-o', 'pgid=', '-p', String(process.pid)], { encoding: 'utf8', timeout: Math.floor(remaining()) }).trim())
  assert.equal(pgid, process.pid, 'Control builds require an exclusively owned native-runner session')
  ownedSession = true;receipt.processGroup = pgid
  const deployment = load('vercel.json')
  assert.equal(deployment.env.VITE_API_BASE, '/api')
  assert.equal(deployment.buildCommand, 'npm ci && VITE_API_BASE=/api npm run build')
  const current = manifest(path.resolve('dist'))
  assert.equal(current.sourceCommit, git('rev-parse', 'HEAD'))
  receipt.currentSource = current.sourceCommit;receipt.currentFilesSHA256 = filesHash(current.files)
  write('current-build-manifest.json', current)
  for (let index = 0; index < 2; index++) {
    if (index) await pause(10000)
    const at = performance.now();await pause(2000)
    const disk = fs.statfsSync(process.cwd()), row = { at: Date.now(), load: os.loadavg(), cpus: os.cpus().length, freeBytes: disk.bavail * disk.bsize, sampleSeconds: (performance.now() - at) / 1000 }
    row.loadLimit = Math.min(32, 4 * row.cpus);receipt.gate.push(row)
    assert(row.load[0] <= row.loadLimit && row.freeBytes >= 2 * 1024 ** 3 && row.sampleSeconds <= 3)
    remaining()
  }
  await run('fetch-source', 'git', ['fetch', '--depth', '1', 'origin', ORIGINAL], process.cwd(), process.env, 30000)
  assert.equal(git('rev-parse', ORIGINAL), ORIGINAL);receipt.originalTree = git('rev-parse', ORIGINAL + '^{tree}')
  temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'production-build-controls-'))
  temporaryIdentity = fs.lstatSync(temporary)
  const source = path.join(temporary, 'source'), archive = path.join(temporary, 'source.tar')
  fs.mkdirSync(source)
  await run('archive-source', 'git', ['archive', '--format=tar', '--output', archive, ORIGINAL], process.cwd())
  receipt.archiveSHA256 = hash(fs.readFileSync(archive))
  await run('extract-source', 'tar', ['-xf', archive, '-C', source], process.cwd())
  const entries = execFileSync('git', ['ls-tree', '-r', '-z', ORIGINAL], { maxBuffer: 16 * 1024 ** 2, timeout: Math.floor(remaining()) }).toString().split('\0').filter(Boolean).map(line => {
    const [meta, name] = line.split('\t'), [mode, kind, blob] = meta.split(' ')
    assert.equal(kind, 'blob');assert.notEqual(mode, '120000');assert(path.resolve(source, name).startsWith(source + path.sep));return { name, blob }
  })
  const inventory = () => Object.fromEntries(entries.map(({ name, blob }) => {
    const bytes = fs.readFileSync(path.join(source, name))
    assert.equal(crypto.createHash('sha1').update(Buffer.from('blob ' + bytes.length + '\0')).update(bytes).digest('hex'), blob)
    return [name, hash(bytes)]
  }))
  const before = inventory();write('source-before.json', before)
  assert.equal(hash(fs.readFileSync(path.join(source, 'package-lock.json'))), hash(fs.readFileSync('package-lock.json')))
  receipt.lockSHA256 = hash(fs.readFileSync('package-lock.json'));receipt.sourceFileCount = entries.length
  assert(!fs.existsSync(path.join(source, 'node_modules')))
  fs.symlinkSync(path.resolve('node_modules'), path.join(source, 'node_modules'), 'dir')
  const recovered = await fetchOriginalBuildEnvironment(Math.min(10000, Math.floor(remaining())))
  const originalEnvironment = recovered.environment
  receipt.inputRecovery = recovered.proof
  receipt.controlledVariableScope = 'COMPLETE_ORIGINAL_PREFIXED_BUILD_INPUTS_AND_CANONICAL_PUBLIC_PROFILE'
  privateValues = privateBuildValues(originalEnvironment)
  for (const [name, api] of [['unset', undefined], ['crossOrigin', 'https://stephenzao-biblesphere.hf.space/api'], ['canonical', '/api']]) {
    // This truthful archive-source identity is required by the existing postbuild writer;
    // it is not a claim that this CI control ran on Vercel or deployed anything.
    const environment = { ...process.env, VERCEL_GIT_COMMIT_SHA: ORIGINAL }
    for (const key of Object.keys(environment)) if (key.startsWith('VITE_') || key.startsWith('NEXT_PUBLIC_')) delete environment[key]
    if (name === 'crossOrigin') Object.assign(environment, originalEnvironment)
    if (name === 'canonical') Object.assign(environment, canonicalPublicBuildEnvironment({ VITE_API_BASE: api }, originalEnvironment))
    if (api !== undefined) environment.VITE_API_BASE = api
    await run('build-' + name, 'npm', ['run', 'build'], source, environment)
    assert.deepEqual(inventory(), before)
    const value = manifest(path.join(source, 'dist'));assert.equal(value.sourceCommit, ORIGINAL)
    const directory = path.join(root, name);fs.mkdirSync(directory)
    const html = fs.readFileSync(path.join(source, 'dist/index.html'));assertPublishableBuildOutput(html, privateValues)
    fs.writeFileSync(path.join(directory, 'index.html'), html, { flag: 'wx' })
    const startup = fs.readFileSync(path.join(source, 'dist/index.html'), 'utf8').match(/<script[^>]*type="module"[^>]*src="([^"]+)"/)[1].replace(/^\//, '')
    const mirrors = Object.keys(value.files).filter(file => /^assets\/MirrorPage-[A-Za-z0-9_-]+\.js$/.test(file));assert.equal(mirrors.length, 1)
    for (const [file, save] of [[startup, 'startup.js'], [mirrors[0], 'mirror.js']]) {
      const bytes = fs.readFileSync(path.join(source, 'dist', file));assertPublishableBuildOutput(bytes, privateValues, true)
      fs.writeFileSync(path.join(directory, save), bytes, { flag: 'wx' })
    }
    write(name + '-build-manifest.json', value)
    const row = { name, source: ORIGINAL, apiInput: api ?? 'UNSET', files: Object.keys(value.files).length, filesSHA256: filesHash(value.files), startupSHA256: value.files[startup], mirrorSHA256: value.files[mirrors[0]], manifest: name + '-build-manifest.json' }
    receipt.builds.push(row)
    if (name !== 'canonical') assert.equal(row.filesSHA256, ORACLES[name], 'Preserved real f7 build identity not reproduced')
    else assert.deepEqual(value.files, current.files, 'Canonical control differs from current real candidate bytes')
    remaining()
  }
  assert.notEqual(receipt.builds[0].filesSHA256, receipt.builds[1].filesSHA256)
  assert.deepEqual(inventory(), before);write('source-after.json', inventory())
  receipt.status = 'PASS_CONTROLLED_BUILD_INPUT_CAUSE_ONLY'
} catch (error) { receipt.errorName = error.name;receipt.error = error.message;process.exitCode = 1 }
finally {
  if (temporary) {
    const actual = fs.lstatSync(temporary)
    assert(actual.isDirectory() && !actual.isSymbolicLink() && actual.dev === temporaryIdentity.dev && actual.ino === temporaryIdentity.ino, 'Refuse cleanup of changed temporary owner')
    fs.rmSync(temporary, { recursive: true });receipt.privateTemporaryRemoved = !fs.existsSync(temporary)
  }
  receipt.endedAt = Date.now();write('parity-receipt.json', receipt)
  const all = {}
  const collect = dir => { for (const item of fs.readdirSync(dir, { withFileTypes: true })) { const file = path.join(dir, item.name);if (item.isDirectory()) collect(file);else if (item.isFile()) all[path.relative(root, file)] = hash(fs.readFileSync(file)) } }
  collect(root);write('evidence-manifest.json', all)
  process.stdout.write(JSON.stringify({ status: receipt.status, source: receipt.currentSource, originalSource: ORIGINAL, builds: receipt.builds, historicalUniqueRoot: 'UNKNOWN' }) + '\n')
  // The native runner created this exclusive session. On any failure stop only
  // its control-build descendants; the outer original300s deadline remains authoritative.
  if (process.exitCode && ownedSession) process.kill(-process.pid, 'SIGTERM')
}
