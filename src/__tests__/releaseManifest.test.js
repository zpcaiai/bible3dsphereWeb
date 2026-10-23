// @vitest-environment node
import { afterEach, expect, test } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { writeReleaseManifest } from '../../scripts/write-release-manifest.mjs'

const roots = []
afterEach(() => { for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }) })
function build() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-manifest-'))
  roots.push(dir)
  fs.mkdirSync(path.join(dir, 'assets'))
  fs.writeFileSync(path.join(dir, 'index.html'), '<script src="/assets/main.js"></script>')
  fs.writeFileSync(path.join(dir, 'assets/main.js'), 'export const actual = 42')
  return dir
}
test('records actual index and asset bytes, and detects changed bytes', () => {
  const dir = build(), commit = 'a'.repeat(40)
  const first = writeReleaseManifest(dir, commit)
  expect(first.sourceCommit).toBe(commit)
  expect(Object.keys(first.files)).toEqual(['index.html', 'assets/main.js'])
  expect(first.files['assets/main.js']).toBe(createHash('sha256').update(fs.readFileSync(path.join(dir, 'assets/main.js'))).digest('hex'))
  expect(JSON.parse(fs.readFileSync(path.join(dir, 'release-manifest.json'), 'utf8'))).toEqual(first)
  fs.appendFileSync(path.join(dir, 'assets/main.js'), '\nexport const changed = true')
  expect(writeReleaseManifest(dir, commit).files['assets/main.js']).not.toBe(first.files['assets/main.js'])
})
test('refuses missing or abbreviated source and absent real build output', () => {
  const dir = build()
  for (const commit of [undefined, '', 'abc123', 'z'.repeat(40)]) expect(() => writeReleaseManifest(dir, commit)).toThrow('complete source commit')
  fs.unlinkSync(path.join(dir, 'assets/main.js'))
  fs.rmdirSync(path.join(dir, 'assets'))
  expect(() => writeReleaseManifest(dir, 'a'.repeat(40))).toThrow()
})
