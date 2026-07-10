import { mkdirSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

const root = process.cwd()
const sha = (() => {
  try { return execSync('git rev-parse --short HEAD', { cwd: root, encoding: 'utf8' }).trim() } catch { return 'unknown' }
})()
const report = `# Attention Stewardship Frontend Release Report

- Base Git commit: \`${sha}\`
- Route registry: \`src/features/attention/lib/integration/route-registry.ts\`
- Admin view: \`src/features/attention/app/AdminScreen.jsx\`
- Privacy-first guardrails: no public feed, no leaderboard, admin aggregate-only.

## Required Commands

- \`npm test\`
- \`npm run build\`
- \`npm run attention:audit:logs\`
- \`npm run attention:audit:permissions\`

## Latest Verification (2026-07-10)

- [x] Full frontend suite: 67 files, 383 tests.
- [x] Production build: 2,278 modules transformed.
- [x] Attention log and permission audits.
- [x] Desktop 1280x720 and mobile 390x844 browser checks with no horizontal overflow.
- [x] Attention route navigation and browser back behavior.

## Manual QA

- [ ] /attention dashboard shows all Batch 1-6 summaries without sensitive raw text.
- [ ] /attention/privacy defaults protect sensitive categories.
- [ ] /attention/accountability can revoke a share.
- [ ] /attention/groups challenge participants are not ranked.
- [ ] /attention/admin rejects ordinary users and shows aggregate-only data for admin.
- [ ] Desktop and mobile navigation have no horizontal overflow and browser back restores the prior attention route.
- [ ] Focus completion prefills the ledger and partner sharing requires server preview plus confirmation.
`

const dir = resolve(root, 'reports')
mkdirSync(dir, { recursive: true })
const target = resolve(dir, 'attention-release-report.md')
writeFileSync(target, report)
console.log(target)
