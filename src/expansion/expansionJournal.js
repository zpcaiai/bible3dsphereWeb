function textValue(value) {
  if (value == null || value === '') return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join('\n')
  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([key]) => !['raw', 'debug', 'metadata'].includes(key))
      .map(([key, item]) => {
        const rendered = textValue(item)
        return rendered ? `${key}：${rendered}` : ''
      })
      .filter(Boolean)
      .join('\n')
  }
  return ''
}
function firstText(result, keys) {
  for (const key of keys) {
    const rendered = textValue(result?.[key])
    if (rendered) return rendered
  }
  return ''
}

export function buildExpansionJournalPayload({ feature, input, result, date = new Date().toISOString().slice(0, 10) }) {
  const title = `专题灵修 · ${feature?.name || '今日操练'}`
  const scripture = firstText(result, ['scripture', 'scriptures', 'verse', 'verses', 'biblical_anchor'])
  const summary = firstText(result, ['summary', 'reflection', 'meditation', 'analysis', 'comfort', 'encouragement'])
  const application = firstText(result, ['practice', 'application', 'action', 'actions', 'next_step', 'steps'])
  const prayer = firstText(result, ['prayer', 'guided_prayer', 'closing_prayer'])
  const covered = new Set([
    'scripture', 'scriptures', 'verse', 'verses', 'biblical_anchor',
    'summary', 'reflection', 'meditation', 'analysis', 'comfort', 'encouragement',
    'practice', 'application', 'action', 'actions', 'next_step', 'steps',
    'prayer', 'guided_prayer', 'closing_prayer', 'raw', 'debug', 'metadata',
  ])
  const remaining = Object.entries(result || {})
    .filter(([key]) => !covered.has(key))
    .map(([key, value]) => {
      const rendered = textValue(value)
      return rendered ? `${key}：${rendered}` : ''
    })
    .filter(Boolean)
    .join('\n\n')

  return {
    date,
    title,
    scripture,
    observation: input ? `我带来的处境：\n${textValue(input)}` : '',
    reflection: [summary, remaining].filter(Boolean).join('\n\n'),
    application,
    prayer,
    mood: '',
  }
}
