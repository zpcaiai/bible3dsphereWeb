// @vitest-environment node
import { afterEach, expect, test } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { writeReleaseManifest } from '../../scripts/write-release-manifest.mjs'

const roots = []
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true }) })
function output() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'runtime-manifest-'))
  roots.push(root)
  fs.mkdirSync(path.join(root, 'assets'))
  fs.mkdirSync(path.join(root, 'js'))
  fs.writeFileSync(path.join(root, 'index.html'), '<script src="/js/lang-init.js"></script>')
  fs.writeFileSync(path.join(root, 'assets/main.js'), 'export const native = true')
  fs.writeFileSync(path.join(root, 'js/lang-init.js'), 'document.documentElement.lang = "en"')
  fs.writeFileSync(path.join(root, 'js/sw-cleanup.js'), 'navigator.serviceWorker.getRegistrations()')
  return root
}

test('binds both real public boot file bytes without changing the historical app-map scope', () => {
  const root = output(), manifest = writeReleaseManifest(root, 'a'.repeat(40))
  expect(Object.keys(manifest.files)).toEqual(['index.html', 'assets/main.js'])
  expect(Object.keys(manifest.runtimeFiles)).toEqual(['js/sw-cleanup.js', 'js/lang-init.js'])
  for (const file of Object.keys(manifest.runtimeFiles)) {
    expect(manifest.runtimeFiles[file]).toBe(createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex'))
  }
  expect(JSON.parse(fs.readFileSync(path.join(root, 'release-manifest.json')))).toEqual(manifest)
})

test('detects changed public code while preserving the exact original app map', () => {
  const root = output(), before = writeReleaseManifest(root, 'a'.repeat(40))
  fs.appendFileSync(path.join(root, 'js/lang-init.js'), '\ndocument.title = "Changed"')
  const after = writeReleaseManifest(root, 'a'.repeat(40))
  expect(after.files).toEqual(before.files)
  expect(after.runtimeFiles['js/lang-init.js']).not.toBe(before.runtimeFiles['js/lang-init.js'])
})

test('fails closed on a partially missing public bootstrap', () => {
  const root = output()
  fs.unlinkSync(path.join(root, 'js/lang-init.js'))
  expect(() => writeReleaseManifest(root, 'a'.repeat(40))).toThrow('Incomplete public bootstrap')
})

test('rejects a bootstrap symlink instead of publishing another path identity', () => {
  const root = output()
  fs.unlinkSync(path.join(root, 'js/lang-init.js'))
  fs.symlinkSync(path.join(root, 'assets/main.js'), path.join(root, 'js/lang-init.js'))
  expect(() => writeReleaseManifest(root, 'a'.repeat(40))).toThrow('Unexpected public bootstrap type')
})
