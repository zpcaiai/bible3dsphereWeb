import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { parse } from '@babel/parser'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { PUBLIC_BUILD_ENV_KEYS } from './production-build-contract.mjs'

export const ORIGINAL_BUILD_INPUT = Object.freeze({
  sha256: '6c845e87f3a3069ca5b90fda36f7105d0770868d22465dc633be7b9a1b67596d',
  source: 'f7fac42f96f6a45be8c1601df1fa7d0a37bff7d8',
  api: 'https://stephenzao-biblesphere.hf.space/api',
})

export function decodeOriginalBuildInputSnapshot(encoded, expected = ORIGINAL_BUILD_INPUT) {
  assert(typeof encoded === 'string' && encoded.length > 0 && encoded.length < 48 * 1024, 'Original input archive encoding outside bound')
  const bytes = Buffer.from(encoded, 'base64')
  assert(bytes.toString('base64') === encoded, 'Original input archive encoding is not canonical base64')
  const environment = recoverOriginalBuildEnvironment(bytes, expected)
  return { environment, proof: { mode: 'PRIVATE_REPOSITORY_INPUT_SNAPSHOT', archiveVariable: 'BUILD_REPRO_F7_INPUT_BASE64', sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, keyNames: Object.keys(environment).sort(), valuesPublished: false } }
}

export async function fetchOriginalBuildEnvironment(budgetMs = 10000) {
  if (process.env.BUILD_REPRO_F7_INPUT_BASE64) return decodeOriginalBuildInputSnapshot(process.env.BUILD_REPRO_F7_INPUT_BASE64)
  assert(process.env.GITHUB_ACTIONS !== 'true', 'Private original input archive required in CI; no mutable network fallback')
  const deadline = Date.now() + budgetMs, attempts = []
  for (const origin of ['https://holiness.uk']) {
    const attempt = { url: origin + '/assets/JerusalemSandbox-AR_hnVIf.js' };attempts.push(attempt)
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bible-original-input-')), identity = fs.lstatSync(directory)
    const bodyFile = path.join(directory, 'input.js');fs.closeSync(fs.openSync(bodyFile, 'wx', 0o600))
    try {
      const remaining = Math.min(5000, deadline - Date.now());assert(remaining > 0)
      // A private0600 body file prevents payload bytes from entering stdout or
      // logs. Only the HTTP status traverses the pipe; cleanup runs on failure.
      attempt.command = ['curl', '--http1.1', '--ipv4', '--compressed', '--fail', '--silent', '--max-time', String(remaining / 1000), '--max-filesize', String(1024 ** 2), '--output', bodyFile, '--write-out', '%{http_code}', attempt.url]
      attempt.startedAt = Date.now()
      const child = spawn(attempt.command[0], attempt.command.slice(1), { stdio: ['ignore', 'pipe', 'pipe'] })
      attempt.pid = child.pid;let status = ''
      const timer = setTimeout(() => { attempt.deadlineExceeded = true;child.kill('SIGTERM') }, remaining)
      child.stdout.on('data', chunk => { status += chunk.toString();if (status.length > 3) { attempt.boundsExceeded = true;child.kill('SIGTERM') } })
      child.stderr.on('data', () => {})
      try {
        attempt.exit_code = await new Promise((resolve, reject) => { child.once('error', reject);child.once('close', resolve) })
      } finally { clearTimeout(timer);attempt.endedAt = Date.now() }
      attempt.http = Number(status)
      assert(attempt.exit_code === 0 && !attempt.deadlineExceeded && !attempt.boundsExceeded && attempt.http === 200, 'Original input transport failure')
      assert(fs.statSync(bodyFile).size <= 1024 ** 2, 'Original input exceeds bound')
      const bytes = fs.readFileSync(bodyFile);attempt.sha256 = createHash('sha256').update(bytes).digest('hex')
      const environment = recoverOriginalBuildEnvironment(bytes, ORIGINAL_BUILD_INPUT)
      attempt.sha256 = ORIGINAL_BUILD_INPUT.sha256;attempt.bytes = bytes.length
      return { environment, proof: { attempts, sha256: ORIGINAL_BUILD_INPUT.sha256, keyNames: Object.keys(environment).sort(), mode: 'OPAQUE_COMPILER_INPUT_NOT_PROVIDER_AUTH' } }
    } catch (error) { attempt.failed = true;attempt.errorName = error.name }
    finally {
      const current = fs.lstatSync(directory)
      assert(current.isDirectory() && !current.isSymbolicLink() && current.dev === identity.dev && current.ino === identity.ino, 'Original input temporary owner changed')
      fs.rmSync(directory, { recursive: true });attempt.privateTemporaryRemoved = !fs.existsSync(directory)
    }
  }
  const error = Error('Hash-bound original compiler input unavailable; no identity waiver')
  error.attempts = attempts
  throw error
}

export function canonicalPublicBuildEnvironment(configured, original) {
  const environment = {}
  for (const key of PUBLIC_BUILD_ENV_KEYS) {
    // The historical cross-origin API is never a new canonical default.
    if (key !== 'VITE_API_BASE' && original[key] !== undefined) environment[key] = original[key]
    if (configured[key] !== undefined) environment[key] = configured[key]
  }
  return environment
}

export async function loadCanonicalPublicBuildEnvironment(configured) {
  if (configured.VITE_MAPBOX_TOKEN !== undefined || configured.NEXT_PUBLIC_MAPBOX_TOKEN !== undefined) return canonicalPublicBuildEnvironment(configured, {})
  // Ordinary local builds retain their existing MapLibre fallback. Only the
  // private archive can supply historical public defaults; never bootstrap
  // current builds by downloading a mutable old production asset.
  if (!process.env.BUILD_REPRO_F7_INPUT_BASE64) return canonicalPublicBuildEnvironment(configured, {})
  const { environment, proof } = await fetchOriginalBuildEnvironment()
  const result = canonicalPublicBuildEnvironment(configured, environment)
  console.info(JSON.stringify({ canonicalPublicBuildDefaults: { source: ORIGINAL_BUILD_INPUT.source, inputSHA256: proof.sha256, keyNames: Object.keys(result).sort() } }))
  return result
}

// Parse data from a hash-bound original compiled module. Never execute it, log
// its values, authenticate to a provider, or publish the recovered environment.
export function recoverOriginalBuildEnvironment(bytes, expected) {
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expected.sha256, 'Original input digest mismatch')
  let ast
  try { ast = parse(bytes.toString('utf8'), { sourceType: 'module' }) }
  catch { throw Error('Original input syntax invalid') }
  const candidates = [], stack = [ast]
  while (stack.length) {
    const node = stack.pop()
    if (!node || typeof node !== 'object') continue
    if (node.type === 'ObjectExpression') {
      const names = node.properties.map(p => p.key?.name ?? p.key?.value)
      if (['BASE_URL', 'MODE', 'DEV', 'PROD', 'SSR'].every(name => names.includes(name))) candidates.push(node)
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) stack.push(...value)
      else if (value && typeof value === 'object') stack.push(value)
    }
  }
  assert.equal(candidates.length, 1, 'Original input environment is missing or ambiguous')
  const environment = Object.create(null), names = new Set()
  for (const property of candidates[0].properties) {
    assert(property.type === 'ObjectProperty' && !property.computed && !property.method && !property.shorthand, 'Original input property is not literal data')
    const key = property.key.name ?? property.key.value
    assert(typeof key === 'string' && !names.has(key), 'Original input key is invalid or duplicated')
    names.add(key)
    if (['BASE_URL', 'MODE', 'DEV', 'PROD', 'SSR'].includes(key)) continue
    assert(/^(VITE_|NEXT_PUBLIC_)[A-Z0-9_]+$/.test(key), 'Original input contains a nonpublic namespace')
    const literal = property.value
    if (literal.type === 'TemplateLiteral') {
      assert(literal.expressions.length === 0 && literal.quasis.length === 1 && typeof literal.quasis[0].value.cooked === 'string', 'Original input template contains an expression')
      environment[key] = literal.quasis[0].value.cooked
    } else {
      assert(literal.type === 'StringLiteral', 'Original input value is not a string literal')
      environment[key] = literal.value
    }
  }
  assert(environment.VITE_VERCEL_GIT_COMMIT_SHA === expected.source, 'Original input source identity mismatch')
  assert(environment.VITE_API_BASE === expected.api, 'Original input API identity mismatch')
  return environment
}

export function privateBuildValues(environment) {
  return [...new Set(Object.entries(environment).filter(([key, value]) => !PUBLIC_BUILD_ENV_KEYS.includes(key) && /KEY|TOKEN|SECRET|OBSERVABILITY/.test(key) && value).map(([, value]) => value))]
}

export function assertPublishableBuildOutput(bytes, privateValues, javascript = false) {
  const containsPrivate = text => privateValues.some(value => text.includes(value))
  const variants = privateValues.flatMap(value => [value, JSON.stringify(value).slice(1, -1), JSON.stringify(JSON.stringify(value)).slice(1, -1)])
  assert(!variants.some(value => bytes.includes(Buffer.from(value))), 'Private original input detected in output; publication refused')
  if (!javascript) return
  let ast
  try { ast = parse(bytes.toString('utf8'), { sourceType: 'module' }) }
  catch { throw Error('Build output syntax invalid; publication refused') }
  const stack = [ast]
  while (stack.length) {
    const node = stack.pop()
    if (!node || typeof node !== 'object') continue
    if (node.type === 'StringLiteral') assert(!containsPrivate(node.value), 'Private decoded literal detected; publication refused')
    if (node.type === 'TemplateElement' && typeof node.value.cooked === 'string') assert(!containsPrivate(node.value.cooked), 'Private decoded template detected; publication refused')
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) stack.push(...value)
      else if (value && typeof value === 'object') stack.push(value)
    }
  }
}
