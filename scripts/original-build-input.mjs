import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { parse } from '@babel/parser'
import { PUBLIC_BUILD_ENV_KEYS } from './production-build-contract.mjs'

export const ORIGINAL_BUILD_INPUT = Object.freeze({
  sha256: '6c845e87f3a3069ca5b90fda36f7105d0770868d22465dc633be7b9a1b67596d',
  source: 'f7fac42f96f6a45be8c1601df1fa7d0a37bff7d8',
  api: 'https://stephenzao-biblesphere.hf.space/api',
})

export async function fetchOriginalBuildEnvironment(budgetMs = 10000) {
  const deadline = Date.now() + budgetMs, attempts = []
  for (const origin of ['https://bible3dsphere-8qpybwrwn-zpchoney-6160s-projects.vercel.app', 'https://holiness.uk']) {
    const attempt = { url: origin + '/assets/JerusalemSandbox-AR_hnVIf.js' };attempts.push(attempt)
    try {
      const remaining = Math.min(5000, deadline - Date.now());assert(remaining > 0)
      const response = await fetch(attempt.url, { signal: AbortSignal.timeout(remaining) })
      attempt.http = response.status;assert(response.ok)
      const chunks = [];let size = 0
      for await (const chunk of response.body) { size += chunk.length;assert(size <= 1024 ** 2);chunks.push(chunk) }
      const bytes = Buffer.concat(chunks), environment = recoverOriginalBuildEnvironment(bytes, ORIGINAL_BUILD_INPUT)
      attempt.sha256 = ORIGINAL_BUILD_INPUT.sha256;attempt.bytes = bytes.length
      return { environment, proof: { attempts, sha256: ORIGINAL_BUILD_INPUT.sha256, keyNames: Object.keys(environment).sort(), mode: 'OPAQUE_COMPILER_INPUT_NOT_PROVIDER_AUTH' } }
    } catch { attempt.failed = true }
  }
  throw Error('Hash-bound original compiler input unavailable; no identity waiver')
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
    assert(property.value.type === 'StringLiteral', 'Original input value is not a string literal')
    environment[key] = property.value.value
  }
  assert(environment.VITE_VERCEL_GIT_COMMIT_SHA === expected.source, 'Original input source identity mismatch')
  assert(environment.VITE_API_BASE === expected.api, 'Original input API identity mismatch')
  return environment
}

export function privateBuildValues(environment) {
  return [...new Set(Object.entries(environment).filter(([key, value]) => /KEY|TOKEN|SECRET|OBSERVABILITY/.test(key) && value).map(([, value]) => value))]
}

export function assertPublishableBuildOutput(bytes, privateValues) {
  assert(!privateValues.some(value => bytes.includes(Buffer.from(value))), 'Private original input detected in output; publication refused')
}
