import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const files = [
  'src/features/attention/app/AttentionPage.jsx',
  'src/features/attention/app/AccountabilityScreen.jsx',
  'src/features/attention/app/GroupsScreen.jsx',
  'src/features/attention/app/PrivacyScreen.jsx',
  'src/features/attention/app/AdminScreen.jsx',
  'src/api.js',
]
const patterns = [
  'console.log(prayer',
  'console.log(note',
  'console.log(review',
  'console.log(prompt',
  'console.log(rawResponse',
  'console.log(interruptionReason',
  'console.log(prayerRequest',
  'console.log(sharePayload',
  'console.log(reflection',
  'logger.info({ body',
  'logger.error({ body',
]
const hits = []
for (const file of files) {
  const abs = resolve(root, file)
  const lines = readFileSync(abs, 'utf8').split('\n')
  lines.forEach((line, index) => {
    const compact = line.replace(/\s+/g, '')
    patterns.forEach((pattern) => {
      if (compact.includes(pattern.replace(/\s+/g, ''))) hits.push({ file, line: index + 1, pattern })
    })
  })
}
console.log(JSON.stringify({ ok: hits.length === 0, hits, scannedFiles: files.length }, null, 2))
if (hits.length) process.exit(1)
