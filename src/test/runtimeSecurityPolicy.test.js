import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const projectFile = (path) => readFileSync(path, 'utf8')

describe('3D runtime security policy', () => {
  it('allows Troika text workers to rehydrate generated modules without inline scripts', () => {
    const config = JSON.parse(projectFile('vercel.json'))
    const csp = config.headers[0].headers.find((header) => header.key === 'Content-Security-Policy').value
    const scriptSrc = csp.split(';').find((directive) => directive.trim().startsWith('script-src'))
    const workerSrc = csp.split(';').find((directive) => directive.trim().startsWith('worker-src'))

    expect(scriptSrc).toContain("'self' blob:")
    expect(scriptSrc).not.toContain("'unsafe-inline'")
    expect(workerSrc).toContain("'self' blob:")
  })

  it('keeps the container policy aligned and expires the broken worker cache', () => {
    const nginx = projectFile('nginx.conf')
    const serviceWorker = projectFile('public/sw.js')

    expect(nginx.match(/script-src 'self' blob:/g)).toHaveLength(2)
    expect(nginx).not.toMatch(/script-src[^;]*'unsafe-inline'/)
    expect(serviceWorker).toContain("CACHE_VERSION = 'emotion-sphere-2025-v5'")
  })
})
