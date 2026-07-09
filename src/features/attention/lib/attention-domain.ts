import { AttentionCategoryLabel, AttentionPullLabel, SCRIPTURE_LIBRARY } from './constants'

export function calculateDailySummary(entries = []) {
  const categoryMinutes = {
    worship: 0,
    mission: 0,
    relationship: 0,
    restoration: 0,
    captured: 0,
  }
  const pullStats = new Map()
  for (const entry of entries || []) {
    const category = entry.category
    const minutes = Number(entry.durationMinutes || 0)
    if (categoryMinutes[category] != null) categoryMinutes[category] += minutes
    for (const pull of entry.pulls || []) {
      const current = pullStats.get(pull) || { pull, label: AttentionPullLabel[pull] || pull, count: 0, minutes: 0 }
      current.count += 1
      current.minutes += minutes
      pullStats.set(pull, current)
    }
  }
  const investedMinutes = categoryMinutes.worship + categoryMinutes.mission + categoryMinutes.relationship + categoryMinutes.restoration
  return {
    totalMinutes: investedMinutes + categoryMinutes.captured,
    investedMinutes,
    capturedMinutes: categoryMinutes.captured,
    categoryMinutes,
    entriesCount: entries.length,
    topPulls: Array.from(pullStats.values()).sort((a, b) => b.count - a.count || b.minutes - a.minutes).slice(0, 5),
  }
}

export function actualFocusMinutes(session, now = new Date()) {
  if (!session) return 0
  if (session.actualMinutes) return Number(session.actualMinutes)
  const started = new Date(session.startedAt).getTime()
  if (!Number.isFinite(started)) return 0
  return Math.max(1, Math.floor((now.getTime() - started) / 60000))
}

export function calculateIntensity(score) {
  if (score <= 0) return 'none'
  if (score < 15) return 'low'
  if (score < 35) return 'medium'
  return 'high'
}

export const WARFARE_PATTERNS = [
  pattern('fomo_information_anxiety', '资讯焦虑与错失恐惧', '资讯焦虑', ['fomo', 'anxiety'], '你可能在用更多资讯寻找安全感，害怕错过机会、落后趋势或失去掌控。', ['psalm_46_10', 'philippians_4_6_7']),
  pattern('anxiety_control', '焦虑与控制欲', '焦虑控制', ['anxiety', 'control'], '你可能在不确定中试图通过反复确认、规划、查看或掌控来获得安全感。', ['psalm_46_10', 'philippians_4_6_7']),
  pattern('comparison_identity', '比较与身份焦虑', '比较身份', ['comparison', 'vanity'], '你的注意力可能被别人的成就、速度、财富、影响力或评价牵引。', ['galatians_1_10', 'romans_12_2']),
  pattern('lust_escape_shame', '情欲试探与逃避牵引', '情欲逃避', ['lust', 'escape'], '这类牵引可能不只是欲望本身，也可能和疲惫、孤独、压力、无聊或逃避有关。', ['first_corinthians_6_12', 'proverbs_4_23']),
  pattern('greed_consumerism_security', '消费主义、贪婪与安全感', '消费安全感', ['greed', 'consumerism'], '你的注意力可能被“得到更多就会更安全、更有价值”的声音牵引。', ['matthew_6_21', 'proverbs_4_23']),
  pattern('fatigue_escape_algorithm', '疲惫、逃避与算法牵引', '疲惫逃避', ['fatigue', 'escape', 'algorithm'], '你可能在疲惫、空虚或任务压力下，被算法提供的即时刺激牵走。', ['matthew_11_28', 'psalm_46_10']),
  pattern('people_pleasing_approval', '讨好人、认可焦虑与过度回应', '讨好认可', ['people_pleasing', 'anxiety'], '你的注意力可能过度被别人的期待、消息、评价和反应牵引。', ['galatians_1_10', 'colossians_3_2']),
  pattern('anger_controversy', '争论、怒气与情绪喂养', '争论怒气', ['control', 'vanity'], '你的注意力可能被争论、热点、评论区或证明自己正确的冲动牵引。', ['romans_12_2', 'proverbs_4_23']),
  pattern('numbness_escape', '麻木、空虚与无目的逃避', '麻木逃避', ['escape', 'boredom'], '有时注意力不是被强烈欲望牵引，而是在麻木、空虚或无方向中慢慢流失。', ['matthew_11_28', 'psalm_46_10']),
]

function pattern(key, label, shortLabel, primaryPulls, description, scriptureIds) {
  return {
    key,
    label,
    shortLabel,
    description,
    primaryPulls,
    relatedPulls: [],
    commonTriggers: ['任务困难时', '疲惫或不确定时', '睡前或独处时'],
    commonBehaviors: ['反复查看', '无目的停留', '用更多刺激代替安静行动'],
    possibleRoots: ['安全感转向可见事物', '用刺激或掌控缓解不安', '疲惫时防线降低'],
    gospelTruth: '看见这个模式不是为了定罪，而是为了在恩典中重新归回。',
    scriptureSuggestions: scriptureIds.map((id) => {
      const s = SCRIPTURE_LIBRARY.find((item) => item.id === id) || SCRIPTURE_LIBRARY[0]
      return { reference: s.reference, text: s.text, reason: '这段经文适合回应当前牵引。' }
    }),
    boundaryTemplates: {
      digital: ['把高牵引来源放到固定窗口。'],
      time: ['给这类活动设定清楚结束时间。'],
      spiritual: ['想被牵走时，先祷告 30 秒。'],
    },
    replacementPractices: ['做 5 分钟使命专注', '写下真实需要', '散步或安静祷告'],
    escapePlanTemplates: ['关闭页面', '离开当前场景', '打开今天的使命任务'],
    reflectionQuestions: ['我真正害怕或渴望什么？', '今天神托付我忠心的一步是什么？'],
    gentleWarning: '这张地图不是控诉，而是归回路线。',
  }
}

export function getPatternDefinition(key) {
  return WARFARE_PATTERNS.find((item) => item.key === key) || WARFARE_PATTERNS[0]
}

export function buildPlanDraftFromPattern(pattern) {
  const def = typeof pattern === 'string' ? getPatternDefinition(pattern) : pattern
  const scripture = def.scriptureSuggestions?.[0] || {}
  return {
    patternKey: def.key,
    title: `${def.shortLabel || def.label}守心计划`,
    description: def.description,
    primaryPulls: def.primaryPulls || [],
    triggerSituations: (def.commonTriggers || []).slice(0, 3),
    vulnerableTimes: [],
    commonBehaviors: (def.commonBehaviors || []).slice(0, 3),
    possibleRoot: def.possibleRoots?.[0] || '',
    gospelTruth: def.gospelTruth || '',
    scriptureReference: scripture.reference || '',
    scriptureText: scripture.text || '',
    digitalBoundary: def.boundaryTemplates?.digital?.[0] || '',
    timeBoundary: def.boundaryTemplates?.time?.[0] || '',
    spiritualBoundary: def.boundaryTemplates?.spiritual?.[0] || '',
    replacementPractice: def.replacementPractices?.[0] || '',
    escapePlan: def.escapePlanTemplates?.[0] || '',
    accountabilityPrompt: def.key === 'lust_escape_shame' ? '如果这个模式反复出现，可以找一位可信任、成熟、有恩典的守望伙伴同行。' : '如果连续两天被牵引，可以告诉一位守望伙伴。',
    sourceType: 'manual',
  }
}

export function emptyDailySummary() {
  return calculateDailySummary([])
}

export function categoryLabel(category) {
  return AttentionCategoryLabel[category] || category
}
