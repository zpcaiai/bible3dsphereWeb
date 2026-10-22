import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('digital human deployment boundary', () => {
  it('allows only the exact default provider frame origin consistently in both deployment paths', () => {
    const config = JSON.parse(readFileSync(resolve('vercel.json'), 'utf8'))
    const vercel = config.headers[0].headers.find((item) => item.key === 'Content-Security-Policy').value
    const nginx = readFileSync(resolve('nginx.conf'), 'utf8')
    const nginxPolicies = [...nginx.matchAll(/add_header Content-Security-Policy "([^"]+)"/g)].map((match) => match[1])
    expect(nginxPolicies).toHaveLength(2)
    for (const policy of [vercel, ...nginxPolicies]) {
      const frames = policy.split(';').map((item) => item.trim()).find((item) => item.startsWith('frame-src '))
      expect(frames.split(/\s+/)).toContain('https://metaperson.avatarsdk.com')
      expect(frames).not.toContain('*')
      expect(frames).not.toMatch(/(?:^|\s)https:(?:\s|$)/)
      expect(policy).toContain("object-src 'none'")
      expect(policy).toContain("frame-ancestors 'none'")
    }
    expect(new Set([vercel, ...nginxPolicies]).size).toBe(1)
  })
})
