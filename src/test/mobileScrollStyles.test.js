import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const styles = readFileSync('src/styles.css', 'utf8')

describe('mobile homepage scrolling', () => {
  it('keeps the app shell vertically scrollable with native touch momentum', () => {
    const shellRule = styles.match(/\.mobile-app-shell\s*\{([\s\S]*?)\}/)?.[1] || ''

    expect(shellRule).toContain('overflow-y: auto')
    expect(shellRule).toContain('-webkit-overflow-scrolling: touch')
    expect(shellRule).toContain('touch-action: pan-y pinch-zoom')
  })

  it('lets vertical gestures starting on the 3D canvas scroll the page', () => {
    expect(styles).toMatch(/\.mobile-sphere-stage canvas\s*\{[\s\S]*?touch-action:\s*pan-y pinch-zoom !important/)
  })
})
