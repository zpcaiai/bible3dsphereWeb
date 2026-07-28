/**
 * Tests for runtime i18n helpers that localize backend-provided emotion names.
 */
import { afterEach, describe, expect, it } from 'vitest'
import autoEn from '../i18n/auto-en'
import { mergeAutoEn } from '../i18n/translations'
import {
  emotionZhKey,
  featureLabel,
  formatEmotionList,
  localizeEmotionName,
  setRuntimeLang,
  t,
} from '../i18n/runtime'

describe('runtime emotion localization', () => {
  afterEach(() => {
    setRuntimeLang('zh')
  })

  it('renders Chinese backend emotion names as English in EN mode', () => {
    setRuntimeLang('en')

    expect(localizeEmotionName('焦虑')).toBe('Anxiety')
    expect(localizeEmotionName('平安')).toBe('Peace')
    expect(formatEmotionList(['焦虑', '平安'])).toBe('Anxiety, Peace')
  })

  it('maps English emotion names back to Chinese keys for local data matching', () => {
    expect(emotionZhKey('Anxiety')).toBe('焦虑')
    expect(emotionZhKey('Peace')).toBe('平安')
  })

  it('uses English feature labels in EN mode', () => {
    setRuntimeLang('en')

    expect(featureLabel({ zh_label: '焦虑', short_en: 'Anxiety' })).toBe('Anxiety')
    expect(featureLabel({ zh_label: '焦虑', short_en: 'Anxiety' }, { withEn: true })).toBe('Anxiety')
  })

  it('keeps bilingual sphere labels in Chinese mode', () => {
    expect(featureLabel({ zh_label: '焦虑', short_en: 'Anxiety' }, { withEn: true })).toBe('焦虑(Anxiety)')
  })

  it('keeps every requested homepage button English-only in EN mode', () => {
    setRuntimeLang('en')
    const keys = [
      'home.quick.voice',
      'home.quick.communion',
      'home.quick.mirrorGraph',
      'home.quick.bibleMaps',
      'home.quick.pilgrimProgress',
      'home.snapshot.soulQuestion',
      'home.snapshot.worldview',
      'home.snapshot.quickDevotion',
      'home.snapshot.growthMap',
      'home.snapshot.growth',
      'home.snapshot.partner',
      'home.snapshot.bibleReading',
      'home.snapshot.mccheyne',
      'home.snapshot.memoryDeck',
      'home.snapshot.personalSearch',
      'home.snapshot.exportData',
      'home.snapshot.formationTwinTitle',
      'home.snapshot.formationTwinSubtitle',
      'home.pour.prompt.pain',
      'home.pour.prompt.anxiety',
      'home.pour.prompt.injustice',
      'home.pour.prompt.prayerFatigue',
      'home.pour.prompt.marriage',
      'home.pour.prompt.repeatedSin',
      'home.pour.prompt.closerToGod',
      'home.pour.polishing',
      'home.pour.polish',
      'home.pour.praying',
      'home.pour.wordOfGrace',
      'home.pour.thinking',
      'home.pour.ask',
      'home.pour.bibleSearch',
      'home.pour.question.scripture',
      'home.pour.question.presence',
      'home.pour.question.suffering',
    ]

    for (const key of keys) {
      expect(t(key), key).not.toMatch(/[一-鿿]/)
    }
  })

  it('localizes the new maturity and multimodal presentation copy', () => {
    mergeAutoEn(autoEn)
    setRuntimeLang('en')
    const keys = [
      '第一类：与神的关系（核心根基）',
      '生命成熟度阶段',
      '成熟稳固期',
      '我每天/每周与神亲密相交（读经+祷告）的时间和品质如何？是否流于形式？',
      '每周写一篇与神相遇的日记',
      '个人灵修计划执行',
      '生成成长图卡',
      '晨光',
      '深海',
      '橄榄',
      '墨夜',
      '静蓝',
    ]

    for (const key of keys) {
      expect(t(key), key).not.toMatch(/[一-鿿]/)
    }

    expect(t('{title}：{items}', { title: 'Growth', items: 'Hope 8, Peace 7' }))
      .toBe('Growth: Hope 8, Peace 7')
  })
})
