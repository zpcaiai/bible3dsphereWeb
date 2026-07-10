import { afterEach, describe, expect, it, vi } from 'vitest'

const CJK = /[\u3400-\u9fff]/

describe('new feature static English coverage', () => {
  afterEach(() => {
    localStorage.removeItem('app-lang')
    vi.resetModules()
  })

  it('localizes attention routes and creed content before first render', async () => {
    localStorage.setItem('app-lang', 'en')
    vi.resetModules()
    const autoEn = (await import('../i18n/auto-en')).default
    const { mergeAutoEn } = await import('../i18n/translations')
    mergeAutoEn(autoEn)

    const { ATTENTION_ROUTES } = await import('../features/attention/lib/integration/route-registry')
    const { creedCatechismItems, catechismPathways } = await import('../features/spiritual-formation/data/creedCatechismSeed')

    expect(JSON.stringify(ATTENTION_ROUTES)).not.toMatch(CJK)
    expect(JSON.stringify(creedCatechismItems)).not.toMatch(CJK)
    expect(JSON.stringify(catechismPathways)).not.toMatch(CJK)
  })
})
