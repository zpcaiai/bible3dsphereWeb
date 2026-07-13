import { describe, expect, it } from 'vitest'
import {
  ANTHROPIC_EMOTION_TERMS,
  CURATED_ANTHROPIC_EMOTIONS,
  curateAnthropicEmotionLayout,
} from '../data/anthropicEmotionConcepts'
import { emotionScriptureMatches, getCuratedEmotionScriptureDetail } from '../data/emotionScriptureDetail'

describe('Anthropic emotion concept curation', () => {
  it('selects 96 unique concepts exclusively from the published 171-term appendix', () => {
    const selected = CURATED_ANTHROPIC_EMOTIONS.map((item) => item.en)
    expect(ANTHROPIC_EMOTION_TERMS).toHaveLength(171)
    expect(selected).toHaveLength(96)
    expect(new Set(selected).size).toBe(96)
    expect(selected.every((term) => ANTHROPIC_EMOTION_TERMS.includes(term))).toBe(true)
    expect(CURATED_ANTHROPIC_EMOTIONS.every((item) => item.zh.trim())).toBe(true)
  })

  it('keeps retrieval anchors while replacing legacy homepage labels', () => {
    const layout = curateAnthropicEmotionLayout([
      { feature_key: 'legacy:1', feature_id: '1', short_en: 'anxiety', explanation: 'legacy', x: 1, y: 0, z: 0 },
    ])
    expect(layout).toHaveLength(96)
    expect(layout[0]).toMatchObject({
      feature_key: 'legacy:1',
      feature_id: '1',
      short_en: 'anxious',
      zh_label: '焦虑',
      retrieval_explanation: 'legacy',
      label_origin: 'anthropic-emotions-2026-curated',
      x: 1,
      y: 0,
      z: 0,
    })
    expect(new Set(layout.map((item) => item.short_en)).size).toBe(96)
  })

  it('can build a complete deterministic layout without a backend response', () => {
    const first = curateAnthropicEmotionLayout([])
    const second = curateAnthropicEmotionLayout([])
    expect(first).toEqual(second)
    expect(first.every((item) => Number.isFinite(item.x) && Number.isFinite(item.y) && Number.isFinite(item.z))).toBe(true)
  })

  it('maps every curated emotion to three aligned CUV and ESV verses', () => {
    const selected = CURATED_ANTHROPIC_EMOTIONS.map((item) => item.en)
    expect(Object.keys(emotionScriptureMatches).sort()).toEqual([...selected].sort())
    selected.forEach((term) => {
      const mapping = emotionScriptureMatches[term]
      expect(mapping.matches.cuv).toHaveLength(3)
      expect(mapping.matches.esv).toHaveLength(3)
      expect(mapping.matches.cuv.map((verse) => verse.pk_id)).toEqual(mapping.matches.esv.map((verse) => verse.pk_id))
      expect(mapping.matches.cuv.every((verse) => verse.raw_text.trim())).toBe(true)
      expect(mapping.matches.esv.every((verse) => verse.raw_text.trim())).toBe(true)
    })

    const anxious = getCuratedEmotionScriptureDetail({
      feature_key: 'legacy:anxiety',
      feature_id: 'anxiety',
      short_en: 'anxious',
      zh_label: '焦虑',
      label_origin: 'anthropic-emotions-2026-curated',
    })
    expect(anxious.matches.cuv.map((verse) => `${verse.book_name}${verse.chapter}:${verse.verse}`)).toContain('以赛亚书41:10')
  })
})
