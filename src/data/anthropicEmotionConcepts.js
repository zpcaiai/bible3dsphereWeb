export const ANTHROPIC_EMOTION_SOURCE = 'https://transformer-circuits.pub/2026/emotions/index.html'

// Appendix: "Full list of emotions" (Sofroniew et al., Anthropic, 2026).
export const ANTHROPIC_EMOTION_TERMS = `afraid, alarmed, alert, amazed, amused, angry, annoyed, anxious, aroused, ashamed, astonished, at ease, awestruck, bewildered, bitter, blissful, bored, brooding, calm, cheerful, compassionate, contemptuous, content, defiant, delighted, dependent, depressed, desperate, disdainful, disgusted, disoriented, dispirited, distressed, disturbed, docile, droopy, dumbstruck, eager, ecstatic, elated, embarrassed, empathetic, energized, enraged, enthusiastic, envious, euphoric, exasperated, excited, exuberant, frightened, frustrated, fulfilled, furious, gloomy, grateful, greedy, grief-stricken, grumpy, guilty, happy, hateful, heartbroken, hope, hopeful, horrified, hostile, humiliated, hurt, hysterical, impatient, indifferent, indignant, infatuated, inspired, insulted, invigorated, irate, irritated, jealous, joyful, jubilant, kind, lazy, listless, lonely, loving, mad, melancholy, miserable, mortified, mystified, nervous, nostalgic, obstinate, offended, on edge, optimistic, outraged, overwhelmed, panicked, paranoid, patient, peaceful, perplexed, playful, pleased, proud, puzzled, rattled, reflective, refreshed, regretful, rejuvenated, relaxed, relieved, remorseful, resentful, resigned, restless, sad, safe, satisfied, scared, scornful, self-confident, self-conscious, self-critical, sensitive, sentimental, serene, shaken, shocked, skeptical, sleepy, sluggish, smug, sorry, spiteful, stimulated, stressed, stubborn, stuck, sullen, surprised, suspicious, sympathetic, tense, terrified, thankful, thrilled, tired, tormented, trapped, triumphant, troubled, uneasy, unhappy, unnerved, unsettled, upset, valiant, vengeful, vibrant, vigilant, vindictive, vulnerable, weary, worn out, worried, worthless`
  .split(', ')

const concept = (en, zh, category) => ({ en, zh, category })

// Homepage curation: recognizable present-moment states, useful in pastoral
// reflection, broad valence/arousal coverage, and fewer near-duplicate labels.
export const CURATED_ANTHROPIC_EMOTIONS = [
  concept('at ease', '安然自在', 'restorative'),
  concept('awestruck', '敬畏惊叹', 'restorative'),
  concept('calm', '平静', 'restorative'),
  concept('cheerful', '愉快', 'restorative'),
  concept('compassionate', '心怀怜悯', 'restorative'),
  concept('content', '知足', 'restorative'),
  concept('delighted', '欣喜', 'restorative'),
  concept('eager', '热切期待', 'restorative'),
  concept('elated', '欢欣鼓舞', 'restorative'),
  concept('empathetic', '感同身受', 'restorative'),
  concept('energized', '精力充沛', 'restorative'),
  concept('enthusiastic', '热情高涨', 'restorative'),
  concept('excited', '兴奋', 'restorative'),
  concept('fulfilled', '充实满足', 'restorative'),
  concept('grateful', '感恩', 'restorative'),
  concept('happy', '快乐', 'restorative'),
  concept('hopeful', '充满希望', 'restorative'),
  concept('inspired', '深受鼓舞', 'restorative'),
  concept('invigorated', '精神振奋', 'restorative'),
  concept('joyful', '喜悦', 'restorative'),
  concept('loving', '充满爱意', 'restorative'),
  concept('optimistic', '乐观', 'restorative'),
  concept('peaceful', '内心平安', 'restorative'),
  concept('pleased', '愉悦', 'restorative'),
  concept('relaxed', '放松', 'restorative'),
  concept('relieved', '如释重负', 'restorative'),
  concept('safe', '安心', 'restorative'),
  concept('satisfied', '满足', 'restorative'),
  concept('serene', '宁静', 'restorative'),
  concept('thankful', '感激', 'restorative'),

  concept('alert', '警觉', 'complex'),
  concept('amazed', '惊奇', 'complex'),
  concept('bewildered', '茫然困惑', 'complex'),
  concept('embarrassed', '尴尬', 'complex'),
  concept('infatuated', '痴迷', 'complex'),
  concept('nostalgic', '怀旧', 'complex'),
  concept('reflective', '沉思', 'complex'),
  concept('self-conscious', '局促不安', 'complex'),
  concept('surprised', '惊讶', 'complex'),
  concept('unsettled', '心绪不宁', 'complex'),
  concept('vulnerable', '脆弱', 'complex'),
  concept('amused', '被逗乐', 'complex'),
  concept('disoriented', '茫然失措', 'complex'),
  concept('proud', '自豪', 'complex'),
  concept('shocked', '震惊', 'complex'),

  concept('ashamed', '羞愧', 'low'),
  concept('bitter', '苦涩', 'low'),
  concept('bored', '无聊', 'low'),
  concept('brooding', '郁结', 'low'),
  concept('depressed', '情绪低落', 'low'),
  concept('desperate', '绝望', 'low'),
  concept('dispirited', '灰心', 'low'),
  concept('grief-stricken', '悲痛欲绝', 'low'),
  concept('guilty', '内疚', 'low'),
  concept('heartbroken', '心碎', 'low'),
  concept('hurt', '受伤', 'low'),
  concept('listless', '无精打采', 'low'),
  concept('lonely', '孤独', 'low'),
  concept('miserable', '痛苦不堪', 'low'),
  concept('regretful', '后悔', 'low'),
  concept('remorseful', '懊悔', 'low'),
  concept('sad', '悲伤', 'low'),
  concept('sorry', '歉疚', 'low'),
  concept('tired', '疲惫', 'low'),
  concept('troubled', '烦恼', 'low'),
  concept('weary', '心力交瘁', 'low'),
  concept('worthless', '毫无价值感', 'low'),

  concept('afraid', '害怕', 'fear'),
  concept('alarmed', '惊慌', 'fear'),
  concept('anxious', '焦虑', 'fear'),
  concept('distressed', '痛苦不安', 'fear'),
  concept('frightened', '惊恐', 'fear'),
  concept('nervous', '紧张', 'fear'),
  concept('on edge', '神经紧绷', 'fear'),
  concept('overwhelmed', '不堪重负', 'fear'),
  concept('panicked', '恐慌', 'fear'),
  concept('restless', '坐立不安', 'fear'),
  concept('stressed', '压力沉重', 'fear'),
  concept('tense', '身心紧绷', 'fear'),
  concept('trapped', '受困', 'fear'),
  concept('worried', '担忧', 'fear'),

  concept('angry', '愤怒', 'anger'),
  concept('annoyed', '心烦', 'anger'),
  concept('contemptuous', '轻蔑', 'anger'),
  concept('disgusted', '厌恶', 'anger'),
  concept('enraged', '暴怒', 'anger'),
  concept('envious', '羡慕嫉妒', 'anger'),
  concept('frustrated', '挫败', 'anger'),
  concept('humiliated', '感到受辱', 'anger'),
  concept('impatient', '不耐烦', 'anger'),
  concept('irritated', '烦躁', 'anger'),
  concept('jealous', '嫉妒', 'anger'),
  concept('indignant', '愤慨', 'anger'),
  concept('offended', '感到被冒犯', 'anger'),
  concept('resentful', '怨恨', 'anger'),
  concept('upset', '心烦意乱', 'anger'),
]

const LEGACY_ALIASES = {
  desire: 'eager',
  loneliness: 'lonely',
  longing: 'hopeful',
  happiness: 'happy',
  infatuation: 'infatuated',
  relief: 'relieved',
  serenity: 'serene',
  solitude: 'reflective',
  joy: 'joyful',
  pleasure: 'pleased',
  compassion: 'compassionate',
  gladness: 'cheerful',
  gratitude: 'grateful',
  yearning: 'hopeful',
  rapture: 'elated',
  dread: 'afraid',
  craving: 'restless',
  enjoyment: 'content',
  affection: 'loving',
  regret: 'regretful',
  uncertainty: 'unsettled',
  isolation: 'vulnerable',
  anticipation: 'eager',
  hope: 'optimistic',
  satisfaction: 'satisfied',
  tranquility: 'peaceful',
  fulfillment: 'fulfilled',
  remorse: 'remorseful',
  anguish: 'distressed',
  exuberance: 'energized',
  fear: 'frightened',
  bliss: 'delighted',
  guilt: 'guilty',
  comprehension: 'amazed',
  eagerness: 'enthusiastic',
  excitement: 'excited',
  worry: 'worried',
  optimism: 'hopeful',
  thankfulness: 'thankful',
  empathy: 'empathetic',
  fervor: 'inspired',
  invigoration: 'invigorated',
  grief: 'grief-stricken',
  sorrow: 'sad',
  anxiety: 'anxious',
  fascination: 'awestruck',
  interest: 'alert',
  curiosity: 'surprised',
  peace: 'calm',
  security: 'safe',
  lightness: 'relaxed',
  comfort: 'at ease',
  sadness: 'depressed',
  despair: 'desperate',
  hopelessness: 'dispirited',
  loss: 'heartbroken',
  emptiness: 'listless',
  shame: 'ashamed',
  embarrassment: 'embarrassed',
  nervousness: 'nervous',
  panic: 'panicked',
  anger: 'angry',
  rage: 'enraged',
  irritation: 'irritated',
  impatience: 'impatient',
  disgust: 'disgusted',
  contempt: 'contemptuous',
  jealousy: 'jealous',
  envy: 'envious',
}

function fallbackPosition(index, total) {
  const y = 1 - ((index + 0.5) / total) * 2
  const radius = Math.sqrt(Math.max(0, 1 - y * y))
  const theta = index * Math.PI * (3 - Math.sqrt(5))
  return { x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius }
}

export function curateAnthropicEmotionLayout(layoutItems = []) {
  const anchors = Array.isArray(layoutItems) ? layoutItems : []
  const available = new Map(CURATED_ANTHROPIC_EMOTIONS.map((item) => [item.en, item]))
  const assignments = new Array(CURATED_ANTHROPIC_EMOTIONS.length)

  anchors.slice(0, assignments.length).forEach((anchor, index) => {
    const legacyTerm = String(anchor.short_en || '').toLowerCase()
    const target = LEGACY_ALIASES[legacyTerm] || legacyTerm
    if (available.has(target)) {
      assignments[index] = available.get(target)
      available.delete(target)
    }
  })

  const remaining = [...available.values()]
  for (let index = 0; index < assignments.length; index += 1) {
    if (!assignments[index]) assignments[index] = remaining.shift()
  }

  return assignments.map((emotion, index) => {
    const anchor = anchors[index] || {}
    const position = Number.isFinite(anchor.x) && Number.isFinite(anchor.y) && Number.isFinite(anchor.z)
      ? { x: anchor.x, y: anchor.y, z: anchor.z }
      : fallbackPosition(index, assignments.length)
    return {
      ...anchor,
      ...position,
      feature_key: anchor.feature_key || `anthropic-emotion:${emotion.en.replaceAll(' ', '-')}`,
      feature_id: anchor.feature_id || emotion.en,
      layer: anchor.layer || 'anthropic-emotion-concept',
      model_id: anchor.model_id || 'anthropic-emotions-2026',
      retrieval_explanation: anchor.explanation || '',
      explanation: `Anthropic 2026 情绪概念：${emotion.zh}（${emotion.en}）`,
      source_keyword: emotion.en,
      short_en: emotion.en,
      zh_label: emotion.zh,
      emotion_category: emotion.category,
      label_origin: 'anthropic-emotions-2026-curated',
      source_reference: ANTHROPIC_EMOTION_SOURCE,
    }
  })
}
