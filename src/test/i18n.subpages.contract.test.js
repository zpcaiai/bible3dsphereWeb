import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import autoEn from '../i18n/auto-en.js'
import { mergeAutoEn, translations } from '../i18n/translations'

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CJK = /[一-鿿]/

function sourceFiles(dir = SRC) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(fullPath)
    return /\.(jsx?|tsx?)$/.test(entry.name) ? [fullPath] : []
  })
}

function explicitTranslationKeys() {
  const keys = new Set()
  const call = /\b(?:i18nT|t)\(\s*(["'])((?:\\.|(?!\1).)*?)\1/g
  for (const file of sourceFiles()) {
    const source = fs.readFileSync(file, 'utf8')
    let match
    while ((match = call.exec(source))) {
      const key = match[2].replace(/\\"/g, '"').replace(/\\'/g, "'")
      if (CJK.test(key)) keys.add(key)
    }
  }
  return [...keys]
}

describe('EN subpage coverage contract', () => {
  it('has a local, CJK-free English value for every explicit subpage translation key', () => {
    mergeAutoEn(autoEn)
    const keys = explicitTranslationKeys()
    const missing = keys.filter((key) => !(key in translations.en))
    const leaking = keys.filter((key) => CJK.test(String(translations.en[key] || '')))

    expect(keys.length).toBeGreaterThan(4200)
    expect(missing).toEqual([])
    expect(leaking).toEqual([])
  })

  it('keeps every Soul Dashboard overlay trigger connected to a render branch', () => {
    const source = fs.readFileSync(path.join(SRC, 'components/SoulDashboard.jsx'), 'utf8')
    const triggers = new Set([...source.matchAll(/setOverlay\(["']([^"']+)["']\)/g)].map((match) => match[1]))
    const branches = new Set([...source.matchAll(/overlay === ["']([^"']+)["']/g)].map((match) => match[1]))

    expect(branches.size).toBeGreaterThanOrEqual(50)
    expect([...triggers].filter((overlay) => !branches.has(overlay))).toEqual([])
  })

  it('keeps the global visible-text guard mounted above every main panel and overlay', () => {
    const mainSource = fs.readFileSync(path.join(SRC, 'main.jsx'), 'utf8')
    const appSource = fs.readFileSync(path.join(SRC, 'App.jsx'), 'utf8')
    const panels = new Set([...appSource.matchAll(/activePanel === ["']([^"']+)["']/g)].map((match) => match[1]))

    expect(mainSource).toContain('<EnglishVisibleTextGuard />')
    expect(panels.size).toBeGreaterThanOrEqual(31)
  })
})
