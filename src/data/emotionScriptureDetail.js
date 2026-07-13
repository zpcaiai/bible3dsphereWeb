import emotionScriptureMatches from './emotionScriptureMatches.json'

export function getCuratedEmotionScriptureDetail(feature) {
  if (feature?.label_origin !== 'anthropic-emotions-2026-curated') return null
  const mapped = emotionScriptureMatches[feature.short_en]
  if (!mapped) return null
  return {
    feature_key: feature.feature_key,
    feature_id: feature.feature_id,
    layer: feature.layer,
    source_keyword: feature.short_en,
    zh_label: feature.zh_label,
    short_en: feature.short_en,
    ...mapped,
  }
}

export { emotionScriptureMatches }
