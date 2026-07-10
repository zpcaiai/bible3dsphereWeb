import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const here = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(here, '../..')
const backendRoot = resolve(webRoot, '../bible3dsphere')

export function runBackendAttentionScript(name) {
  const script = resolve(backendRoot, 'backend/scripts/attention', name)
  if (!existsSync(script)) {
    console.error(`Backend attention script not found: ${script}`)
    process.exit(1)
  }
  const python = existsSync(resolve(backendRoot, '.venv/bin/python'))
    ? resolve(backendRoot, '.venv/bin/python')
    : 'python3'
  const result = spawnSync(python, [script], {
    cwd: backendRoot,
    stdio: 'inherit',
    env: { ...process.env, PYTHONPATH: resolve(backendRoot, 'backend') },
  })
  process.exit(result.status ?? 1)
}
