/**
 * Tests for runtime i18n helpers that localize backend-provided emotion names.
 */
import { afterEach, describe, expect, it } from 'vitest'
import {
  emotionZhKey,
  featureLabel,
  formatEmotionList,
  localizeEmotionName,
  setRuntimeLang,
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
  })
})
