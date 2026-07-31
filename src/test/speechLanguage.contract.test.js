import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC_ROOT = path.resolve(process.cwd(), 'src')

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(absolute)
    if (!/\.(js|jsx|ts|tsx)$/.test(entry.name) || /\.test\./.test(entry.name)) return []
    return [absolute]
  })
}

describe('speech language source contract', () => {
  it('routes every browser speech utterance through the EN speech-text guard', () => {
    const violations = sourceFiles(SRC_ROOT)
      .filter((file) => fs.readFileSync(file, 'utf8').includes('new SpeechSynthesisUtterance'))
      .filter((file) => !fs.readFileSync(file, 'utf8').includes('prepareSpeechText'))
      .map((file) => path.relative(SRC_ROOT, file))

    expect(violations).toEqual([])
  })
})
