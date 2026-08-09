import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const APP_SOURCE = readFileSync(join(process.cwd(), 'src/App.jsx'), 'utf8')

describe('homepage quick links', () => {
  it('places the nations oracle link immediately after Pilgrim Progress', () => {
    const pilgrimEntry = "{ icon: '🚶', labelKey: 'home.quick.pilgrimProgress', url: 'https://pilgrims.holiness.uk/' },"
    const oracleEntry = "{ icon: '📜', labelKey: 'home.quick.oracles', url: 'https://holiness.uk/oracles.html' },"

    expect(APP_SOURCE).toContain(`${pilgrimEntry}\n                  ${oracleEntry}`)
  })

  it('keeps the homepage quick links in a single flex row', () => {
    expect(APP_SOURCE).toContain("<div style={{ display: 'flex', gap: '4px', margin: '0 0 4px' }}>")
    expect(APP_SOURCE).not.toContain("flexWrap: 'wrap', gap: '4px', margin: '0 0 4px'")
  })
})
