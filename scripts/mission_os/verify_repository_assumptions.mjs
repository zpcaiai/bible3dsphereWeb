import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const web = resolve(import.meta.dirname, '../..')
const api = resolve(web, '../bible3dsphere')
const checks = [
  ['web package', resolve(web, 'package.json')],
  ['web mission UI', resolve(web, 'src/components/mission-bridge/MissionBridgePanel.jsx')],
  ['backend guidelines', resolve(api, 'AGENTS.md')],
  ['backend entrypoint', resolve(api, 'backend/main.py')],
  ['backend migration directory', resolve(api, 'backend/migrations')],
  ['backend tests', resolve(api, 'backend/tests')],
  ['MissionBridge migration', resolve(api, 'backend/migrations/0151_mission_bridge.sql')],
]

let failed = false
for (const [label, path] of checks) {
  const ok = existsSync(path)
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: ${path}`)
  failed ||= !ok
}

const pkg = JSON.parse(readFileSync(resolve(web, 'package.json'), 'utf8'))
for (const command of ['build', 'test']) {
  const ok = Boolean(pkg.scripts?.[command])
  console.log(`${ok ? 'PASS' : 'FAIL'} package script ${command}`)
  failed ||= !ok
}

if (failed) process.exit(1)
