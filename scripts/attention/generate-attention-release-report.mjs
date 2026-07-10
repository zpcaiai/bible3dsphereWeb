import { mkdirSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'

const root = process.cwd()
const manualApproved = String(process.env.ATTENTION_MANUAL_QA_APPROVED || '').toLowerCase() === 'true'

function gitSha() {
  const result = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' })
  return result.status === 0 ? result.stdout.trim() : 'unknown'
}

const checks = [
  { name: 'Full frontend suite', command: ['npm', ['test']] },
  { name: 'Production build', command: ['npm', ['run', 'build']] },
  { name: 'Attention log audit', command: ['npm', ['run', 'attention:audit:logs']] },
  { name: 'Attention security audit', command: ['npm', ['run', 'attention:audit:security']] },
  { name: 'Attention permission audit', command: ['npm', ['run', 'attention:audit:permissions']] },
  { name: 'Attention database smoke', command: ['npm', ['run', 'attention:smoke']] },
]

function summary(output) {
  const text = String(output || '')
  const tests = text.match(/Test Files\s+([^\n]+)\n\s+Tests\s+([^\n]+)/)
  if (tests) return `Test Files ${tests[1].trim()}; Tests ${tests[2].trim()}`
  const modules = text.match(/✓\s+(\d+) modules transformed/)
  if (modules) return `${modules[1]} modules transformed`
  const jsonOk = text.match(/"ok":\s*(true|false)/)
  if (jsonOk) return `ok=${jsonOk[1]}`
  const last = text.trim().split('\n').filter(Boolean).at(-1)
  return last ? last.slice(0, 240) : 'No command output'
}

const results = checks.map((check) => {
  const [bin, args] = check.command
  const result = spawnSync(bin, args, {
    cwd: root,
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 20 * 1024 * 1024,
  })
  const output = `${result.stdout || ''}\n${result.stderr || ''}`.trim()
  return {
    ...check,
    ok: result.status === 0,
    status: result.status,
    summary: summary(output),
  }
})

const automatedOk = results.every((item) => item.ok)
const releaseReady = automatedOk && manualApproved
const checkLines = results.map((item) => `- [${item.ok ? 'x' : ' '}] ${item.name}: ${item.summary}`).join('\n')
const report = `# Attention Stewardship Frontend Release Report

- Generated at: \`${new Date().toISOString()}\`
- Base Git commit: \`${gitSha()}\`
- Automated checks: **${automatedOk ? 'PASS' : 'FAIL'}**
- Manual QA approval: **${manualApproved ? 'CONFIRMED' : 'PENDING'}**
- Release ready: **${releaseReady ? 'YES' : 'NO'}**

## Automated Verification

${checkLines}

## Manual QA

These checks are never auto-claimed. Set \`ATTENTION_MANUAL_QA_APPROVED=true\` only after completing all items:

- [${manualApproved ? 'x' : ' '}] Desktop 1280x720 and mobile 390x844 have no page-level horizontal overflow.
- [${manualApproved ? 'x' : ' '}] Browser back restores the prior attention route.
- [${manualApproved ? 'x' : ' '}] Privacy defaults protect sensitive categories and raw prayer/review text.
- [${manualApproved ? 'x' : ' '}] Accountability share preview can be confirmed and revoked.
- [${manualApproved ? 'x' : ' '}] Group challenge participants are not ranked.
- [${manualApproved ? 'x' : ' '}] Ordinary users cannot access admin aggregates.
- [${manualApproved ? 'x' : ' '}] Focus completion prefills the ledger without exposing sensitive notes.
`

const dir = resolve(root, 'reports')
mkdirSync(dir, { recursive: true })
const target = resolve(dir, 'attention-release-report.md')
writeFileSync(target, report)
console.log(target)

if (!releaseReady) process.exit(1)
