export const DEVOTION_TOPICS = {
  lament: { key: 'lament', emoji: '🕯️', name: '哀歌 · 向神倾诉', sub: '在痛苦和失落中诚实来到神面前' },
  hope: { key: 'hope', emoji: '🌅', name: '复活盼望', sub: '在漫长等候中重新看见盼望' },
  contemplation: { key: 'contemplation', emoji: '🌫️', name: '默观 · 在神爱里安息', sub: '让焦虑的心慢下来' },
  providence: { key: 'providence', emoji: '🌤️', name: '神的护理', sub: '在失控感中学习信靠' },
  burnout: { key: 'burnout', emoji: '🪫', name: '耗竭 · 服事倦怠', sub: '先被喂养，再继续给予' },
  tender: { key: 'tender', emoji: '🫶', name: '温柔谦卑', sub: '在羞愧中看见基督的慈心' },
  assurance: { key: 'assurance', emoji: '🛡️', name: '得救的确据', sub: '把反复自责带回福音' },
  anger: { key: 'anger', emoji: '😤', name: '在神面前处理愤怒', sub: '辨认愤怒，并选择真实回应' },
  forgiveness: { key: 'forgiveness', emoji: '🕊️', name: '饶恕与和好', sub: '在伤害中走向有边界的饶恕' },
  loneliness: { key: 'loneliness', emoji: '🌑', name: '孤单 · 被看不见的痛', sub: '让孤单被听见、被陪伴' },
  doubt: { key: 'doubt', emoji: '❓', name: '与怀疑同行', sub: '不压抑问题，也不独自承受' },
  worddelight: { key: 'worddelight', emoji: '🍯', name: '爱慕神的话', sub: '把“应该读经”转向真实渴慕' },
  knowgod: { key: 'knowgod', emoji: '✨', name: '认识神 · 属性默想', sub: '从此刻需要进入对神的认识' },
  eucharisteo: { key: 'eucharisteo', emoji: '🙏', name: '感恩 · 数算恩典', sub: '在普通一天里重新看见恩典' },
}

export const DEVOTION_SITUATIONS = [
  { label: '焦虑或失控', keys: ['contemplation', 'providence'] },
  { label: '悲伤或等候', keys: ['lament', 'hope'] },
  { label: '疲惫或麻木', keys: ['burnout', 'worddelight'] },
  { label: '羞愧或自责', keys: ['tender', 'assurance'] },
  { label: '愤怒或受伤', keys: ['anger', 'forgiveness'] },
  { label: '孤单或怀疑', keys: ['loneliness', 'doubt'] },
]

export function needsSafetyFirst(snapshot) {
  const signal = [snapshot?.last_emotion, snapshot?.trajectory_label].filter(Boolean).join(' ').toLowerCase()
  return /(自伤|自杀|轻生|不想活|无法保证安全|suicid|self[- ]?harm|unsafe)/.test(signal)
}

export function recommendExpansionTopics(snapshot) {
  const signal = [snapshot?.last_emotion, snapshot?.trajectory_label].filter(Boolean).join(' ').toLowerCase()
  const rules = [
    [/(焦虑|害怕|恐惧|anxi|fear|失控)/, ['contemplation', 'providence']],
    [/(悲伤|哀伤|失落|等待|sad|grief|loss)/, ['lament', 'hope']],
    [/(疲惫|耗竭|麻木|累|burn|tired|numb)/, ['burnout', 'worddelight']],
    [/(羞愧|羞耻|内疚|罪疚|guilt|shame)/, ['tender', 'assurance']],
    [/(愤怒|生气|苦毒|anger|angry)/, ['anger', 'forgiveness']],
    [/(孤单|孤独|lonely|alone)/, ['loneliness', 'knowgod']],
    [/(怀疑|迷茫|困惑|doubt|confus)/, ['doubt', 'providence']],
    [/(感恩|喜乐|平安|grateful|joy|peace)/, ['eucharisteo', 'knowgod']],
  ]
  const matched = rules.find(([pattern]) => pattern.test(signal))?.[1] || ['knowgod', 'worddelight']
  return matched.map((key) => DEVOTION_TOPICS[key])
}
