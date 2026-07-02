// expansionApi.js — 内容与神学扩充：自包含 API 助手（content-theology-expansion 批次）
// 刻意不修改既有 src/api.js；只读式引用 getToken。
import { getToken } from '../auth'
import { getRuntimeLang } from '../i18n/runtime'

const API_BASE = (import.meta.env.VITE_API_BASE?.trim()) || '/api'

const META = {
  affections: {
    principle: '真实的属灵情感会把人带向基督、谦卑、爱与顺服，而不是自我证明。',
    true_signs: [
      { key: 'christ_centered', name: '以基督为中心', hint: '不是只追求体验，而是更爱基督。' },
      { key: 'humility', name: '谦卑', hint: '更愿意承认需要恩典。' },
      { key: 'love', name: '爱', hint: '更愿意爱神与邻舍。' },
      { key: 'obedience', name: '顺服', hint: '情感结出具体顺服。' },
    ],
  },
  eh: {
    principle: '情感成熟不是压住情绪，而是在神面前诚实、命名、分辨，并以爱回应。',
    dimensions: [
      { key: 'awareness', name: '情绪觉察', hint: '我能诚实命名里面发生了什么。' },
      { key: 'limits', name: '界限', hint: '我能承认限制，而不是用属灵话语硬撑。' },
      { key: 'repair', name: '修复', hint: '冲突后愿意悔改、饶恕、重建。' },
      { key: 'sabbath', name: '安息', hint: '我能停下来信靠神。' },
    ],
  },
  renovation: {
    principle: '心意更新从愿景、意愿与操练开始，在恩典中形成新的爱与行动。',
    dimensions: [
      { key: 'vision', name: '愿景', hint: '我看见在基督里要成为什么样的人。' },
      { key: 'intention', name: '意愿', hint: '我愿意把真实选择交给神。' },
      { key: 'means', name: '操练', hint: '我有小而真实的顺服节律。' },
      { key: 'community', name: '群体', hint: '我不是独自塑造。' },
    ],
  },
  knowgod: {
    principle: '认识神不是抽象知识，而是在处境中默想祂的属性，并回应祂。',
    attributes: [
      { key: 'goodness', name: '良善' },
      { key: 'holiness', name: '圣洁' },
      { key: 'wisdom', name: '智慧' },
      { key: 'fatherly_love', name: '父爱' },
      { key: 'sovereignty', name: '主权' },
      { key: 'mercy', name: '怜悯' },
    ],
  },
}

const META_EN = {
  affections: {
    principle: 'True spiritual affections move a person toward Christ, humility, love, and obedience rather than self-proof.',
    true_signs: [
      { key: 'christ_centered', name: 'Christ-centered', hint: 'Not just seeking an experience, but loving Christ more.' },
      { key: 'humility', name: 'Humility', hint: 'More willing to admit the need for grace.' },
      { key: 'love', name: 'Love', hint: 'More willing to love God and neighbor.' },
      { key: 'obedience', name: 'Obedience', hint: 'Affection bears concrete obedience.' },
    ],
  },
  eh: {
    principle: 'Emotional maturity does not suppress emotion; it names, discerns, and responds in love before God.',
    dimensions: [
      { key: 'awareness', name: 'Emotional awareness', hint: 'I can honestly name what is happening within me.' },
      { key: 'limits', name: 'Limits', hint: 'I can admit limits instead of forcing spiritual language over exhaustion.' },
      { key: 'repair', name: 'Repair', hint: 'After conflict, I am willing to repent, forgive, and rebuild.' },
      { key: 'sabbath', name: 'Rest', hint: 'I can stop and trust God.' },
    ],
  },
  renovation: {
    principle: 'Renovation begins with vision, intention, and practices that form new loves and actions by grace.',
    dimensions: [
      { key: 'vision', name: 'Vision', hint: 'I can see the kind of person I am becoming in Christ.' },
      { key: 'intention', name: 'Intention', hint: 'I am willing to yield real choices to God.' },
      { key: 'means', name: 'Practices', hint: 'I have small, concrete rhythms of obedience.' },
      { key: 'community', name: 'Community', hint: 'I am not being formed alone.' },
    ],
  },
  knowgod: {
    principle: 'Knowing God is not abstract information; it meditates on his attributes in a real situation and responds to him.',
    attributes: [
      { key: 'goodness', name: 'Goodness' },
      { key: 'holiness', name: 'Holiness' },
      { key: 'wisdom', name: 'Wisdom' },
      { key: 'fatherly_love', name: 'Fatherly love' },
      { key: 'sovereignty', name: 'Sovereignty' },
      { key: 'mercy', name: 'Mercy' },
    ],
  },
}

const MODULE_META = {
  lament: '把痛苦带到神面前：转向、倾诉、求告、信靠。',
  union: '在基督里先领受身份，再回应谎言与控告。',
  delight: '责任不是终点，神自己是喜乐的源头。',
  contentment: '知足不是否认缺乏，而是在基督里学习自由。',
  tender: '基督温柔谦卑，祂接近疲乏和羞愧的人。',
  liturgy: '习惯会训练爱；反礼仪把爱重新转向神。',
  ordo: '爱的次序决定人的自由、恐惧与盼望。',
  spirits: '分辨安慰与枯竭，寻找更靠近神的下一步。',
  chinese: '在华人属灵传统中寻找受苦、忠心、治死己和跟随主的亮光。',
}

const MODULE_META_EN = {
  lament: 'Bring pain before God: turn, complain, ask, and trust.',
  union: 'Receive your identity in Christ before answering lies and accusation.',
  delight: 'Duty is not the end; God himself is the source of joy.',
  contentment: 'Contentment does not deny lack; it learns freedom in Christ.',
  tender: 'Christ is gentle and lowly; he draws near to the weary and ashamed.',
  liturgy: 'Habits train love; counter-liturgies turn love back toward God.',
  ordo: 'The order of loves shapes freedom, fear, and hope.',
  spirits: 'Discern consolation and desolation, then look for one step nearer to God.',
  chinese: 'Draw on Chinese devotional voices for suffering, faithfulness, self-denial, and following Christ.',
}

const BOOKS = [
  { slug: 'knowing-god', continent: 'A', priority: 3, zh: '认识神', en: 'Knowing God', author: 'J. I. Packer', blurb: '把神的属性带回敬拜、信靠与顺服。', blurbEn: 'Bring God’s attributes back into worship, trust, and obedience.', public_domain: false },
  { slug: 'gentle-lowly', continent: 'B', priority: 3, zh: '柔和谦卑', en: 'Gentle and Lowly', author: 'Dane Ortlund', blurb: '帮助羞愧、软弱的人重新看见基督的心。', blurbEn: 'Helps the ashamed and weak see the heart of Christ again.', public_domain: false },
  { slug: 'religious-affections', continent: 'C', priority: 2, zh: '宗教情感', en: 'Religious Affections', author: 'Jonathan Edwards', blurb: '分辨真实属灵情感与短暂热情。', blurbEn: 'Discerns true spiritual affections from temporary intensity.', public_domain: true },
  { slug: 'rare-jewel', continent: 'E', priority: 2, zh: '知足的珍宝', en: 'The Rare Jewel of Christian Contentment', author: 'Jeremiah Burroughs', blurb: '在缺乏与等待中学习基督徒知足。', blurbEn: 'Learns Christian contentment in lack and waiting.', public_domain: true },
]

const HYMNS = [
  { slug: 'amazing-grace', zh: '奇异恩典', en: 'Amazing Grace', era: '18c', theme: 'grace' },
  { slug: 'it-is-well', zh: '我心灵得安宁', en: 'It Is Well with My Soul', era: '19c', theme: 'suffering' },
  { slug: 'how-great-thou-art', zh: '祢真伟大', en: 'How Great Thou Art', era: '20c', theme: 'worship' },
]

function authHeaders(json) {
  const t = (typeof getToken === 'function') ? getToken() : null
  const h = {}
  if (json) h['Content-Type'] = 'application/json'
  if (t) h['Authorization'] = `Bearer ${t}`
  return h
}

export function hasToken() {
  try { return !!(typeof getToken === 'function' && getToken()) } catch { return false }
}

// 稳健解析响应：区分「HTTP 错误」「非 JSON（HTML/空）」「正常 JSON」，
// 避免把后端 404/休眠返回的 HTML 静默吞成 {} 导致「提交后什么都不显示」。
async function readJson(r, failMsg) {
  const raw = await r.text().catch(() => '')
  let d = null
  try { d = raw ? JSON.parse(raw) : null } catch { d = null }
  if (!r.ok) {
    if (r.status === 401) throw new Error('请先登录后再使用此功能。')
    const detail = (d && (d.detail || d.message)) || ''
    throw new Error(detail ? `${failMsg}：${detail}` : `${failMsg}（HTTP ${r.status}）`)
  }
  if (d == null || typeof d !== 'object') {
    // 收到了 HTML / 空响应：后端该路由未部署、服务未启动，或被前端兜底页拦截
    throw new Error('后端接口暂不可用：该功能的服务端可能尚未部署或未启动（返回了非 JSON）。请确认后端已部署并唤醒后重试。')
  }
  return d
}

function textFromBody(body = {}) {
  const value = body.text || body.struggle || body.duty || body.lack || body.habit || body.need || body.attribute || ''
  if (Array.isArray(body.loves) && body.loves.length) return body.loves.join('、')
  return String(value || '').trim()
}

function hasCrisisLanguage(text) {
  return /自杀|自殘|自残|活不下去|suicide|kill myself|self-harm/i.test(text)
}

function isEn() {
  return getRuntimeLang() === 'en'
}

function localMeta(prefix) {
  if (isEn()) {
    return META_EN[prefix] || {
      principle: MODULE_META_EN[prefix] || 'This local formation engine names the situation honestly, returns to gospel truth, and chooses one small concrete next step.',
      dimensions: [
        { key: 'honesty', name: 'Honesty', hint: 'Bring the real situation before God.' },
        { key: 'gospel', name: 'Gospel', hint: 'Answer the inner voice with the truth of Christ.' },
        { key: 'practice', name: 'Practice', hint: 'Put it into one concrete action.' },
      ],
    }
  }
  return META[prefix] || {
    principle: MODULE_META[prefix] || '这是一个本地可用的属灵塑造引擎：先诚实命名处境，再回到福音真理，并选择一个小而真实的下一步。',
    dimensions: [
      { key: 'honesty', name: '诚实', hint: '把真实处境带到神面前。' },
      { key: 'gospel', name: '福音', hint: '用基督的真理回应心里的声音。' },
      { key: 'practice', name: '操练', hint: '落到一个具体行动。' },
    ],
  }
}

function localResult(prefix, action, body = {}) {
  const text = textFromBody(body)
  const crisis = hasCrisisLanguage(text)
  if (isEn()) {
    const summaryEn = text
      ? `You brought this: ${text}. Name it honestly first, then slow down before God.`
      : 'Name the real situation in one sentence, then receive gospel truth.'
    return {
      local_only: true,
      engine: prefix,
      action,
      crisis,
      crisis_note: crisis ? 'If you may harm yourself or someone else, contact local emergency services, a trusted person, a pastor, or a crisis line now. This tool cannot replace immediate help from real people.' : '',
      summary: summaryEn,
      gospel_truth: 'You are not accepted by God through performance, emotional intensity, or control. In Christ, grace comes first, and then invites your response.',
      scripture: { ref: 'Psalm 34:18', text: 'The LORD is near to the brokenhearted and saves the crushed in spirit.' },
      practice: crisis ? 'Pause ordinary formation work and contact a real person while confirming safety.' : 'Do one 5-minute action today: pray one sentence, write one truth, contact one trusted person, or complete one concrete act of obedience. Do not turn it into self-proof.',
      prayer: 'Lord, help me come honestly before you without hiding or forcing myself to hold everything together. Let me receive grace in Christ and take one small, real step of obedience. Amen.',
    }
  }
  const summary = text
    ? `你带来的是：${text}。先诚实承认它，再在神面前慢下来。`
    : '先用一句话命名真实处境，再领受福音真理。'
  return {
    local_only: true,
    engine: prefix,
    action,
    crisis,
    crisis_note: crisis ? '如果你此刻有伤害自己或他人的冲动，请立刻联系当地紧急服务、可信任的人、牧者或专业危机热线。这个工具不能替代真实人的即时帮助。' : '',
    summary,
    gospel_truth: '你不是靠表现、情绪强度或掌控力被神接纳；在基督里，恩典先临到你，然后才邀请你回应。',
    scripture: { ref: 'Psalm 34:18', text: '耶和华靠近伤心的人，拯救灵性痛悔的人。' },
    practice: crisis ? '先暂停普通操练，联系一个真实的人并确认安全。' : '今天只做一个 5 分钟行动：祷告一句、写下一句真理、联系一个可信任的人，或完成一个具体顺服。不要把它变成证明自己的任务。',
    prayer: '主啊，求你帮助我诚实来到你面前，不用隐藏，也不靠自己硬撑。让我在基督里领受恩典，并走出一个小而真实的顺服。阿们。',
  }
}

export async function getMeta(prefix) {
  try {
    const r = await fetch(`${API_BASE}/${prefix}/meta?lang=${getRuntimeLang()}`, { headers: authHeaders(false) })
    return await readJson(r, '加载失败')
  } catch {
    return localMeta(prefix)
  }
}

export async function runAction(prefix, path, body) {
  try {
    const r = await fetch(`${API_BASE}/${prefix}/${path}`, {
      method: 'POST', headers: authHeaders(true), body: JSON.stringify({ lang: getRuntimeLang(), ...(body || {}) }),
    })
    return await readJson(r, '提交失败')
  } catch {
    return localResult(prefix, path, body)
  }
}

export async function getBooks(continent) {
  const q = continent ? `?continent=${encodeURIComponent(continent)}` : ''
  try {
    const r = await fetch(`${API_BASE}/resources/books${q}`, { headers: authHeaders(false) })
    return await readJson(r, '加载失败')
  } catch {
    const books = continent ? BOOKS.filter((book) => book.continent === continent) : BOOKS
    return { books, local_only: true }
  }
}

export async function getHymns() {
  try {
    const r = await fetch(`${API_BASE}/resources/hymns`, { headers: authHeaders(false) })
    return await readJson(r, '加载失败')
  } catch {
    return { hymns: HYMNS, local_only: true }
  }
}
