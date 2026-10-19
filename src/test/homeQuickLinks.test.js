import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const APP_SOURCE = readFileSync(join(process.cwd(), 'src/App.jsx'), 'utf8')
const STYLES = readFileSync(join(process.cwd(), 'src/styles.css'), 'utf8')

describe('homepage quick links', () => {
  it('exposes the public Seekers Class page as a same-tab link', () => {
    expect(APP_SOURCE).toContain("{ icon: '📚', labelKey: 'home.quick.seekers', href: '/seekers' },")
    expect(APP_SOURCE).toContain("href={item.href}")
  })

  it('places the nations oracle link immediately after Pilgrim Progress', () => {
    const pilgrimEntry = "{ icon: '🚶', labelKey: 'home.quick.pilgrimProgress', url: 'https://pilgrims.holiness.uk/' },"
    const oracleEntry = "{ icon: '📜', labelKey: 'home.quick.oracles', url: 'https://holiness.uk/oracles.html' },"

    expect(APP_SOURCE).toContain(`${pilgrimEntry}\n                  ${oracleEntry}`)
  })

  it('uses a responsive grid so mobile labels do not overlap', () => {
    expect(APP_SOURCE).toContain('<div className="home-quick-links">')
    expect(APP_SOURCE).toContain('className="home-quick-link"')
    expect(STYLES).toMatch(/\.home-quick-links\s*\{[\s\S]*?grid-template-columns:\s*repeat\(7, minmax\(0, 1fr\)\)/)
    expect(STYLES).toMatch(/@media \(max-width: 767px\)[\s\S]*?\.home-quick-links\s*\{[\s\S]*?repeat\(3, minmax\(0, 1fr\)\)/)
    expect(STYLES).toMatch(/@media \(max-width: 480px\)[\s\S]*?\.home-quick-links\s*\{[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/)
    expect(STYLES).toMatch(/\.home-quick-link\s*\{[\s\S]*?min-height:\s*44px/)
  })
})
