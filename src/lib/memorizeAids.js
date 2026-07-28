// memorizeAids.js — 背经三件套的纯函数：分句跟读 / 遮词卡 / 复诵着色。
//
// 抽成独立模块而不是写在页面里，是因为这三件事都是「同样的输入必须给出同样的输出」
// 的纯计算，只有抽出来才能被单测钉死——尤其是遮词卡的确定性（见 maskVerse 的注释）。

// 用转义写字符类，避免不同编辑器/终端把源码里的 CJK 区间写坏
const CJK = /[㐀-鿿豈-﫿]/
const LATIN = /[A-Za-z0-9À-ɏ']/
const ZH_BREAK = '、，。；！？：…'   // 中文断句：顿号也断，跟读时短一点更容易复述
const LATIN_BREAK = '.!?;:'          // 拉丁语句末标点

/** 文本是否以中文（CJK）为主。中文按字、拉丁语按词，两条路的规则不同。 */
export function isCjkText(text) {
  return CJK.test(String(text ?? ''))
}

/** 计量单位：中文按「字」，拉丁语按「词」。用来估长度与留白时间。 */
export function countUnits(text) {
  const s = String(text ?? '')
  let cjk = 0
  for (const ch of s) if (CJK.test(ch)) cjk += 1
  const words = s
    .replace(/[㐀-鿿豈-﫿]/g, ' ')
    .split(/[^A-Za-z0-9À-ɏ']+/)
    .filter(Boolean).length
  return cjk + words
}

/** 太短的句子并进相邻句：单独一个「说」「他说」念出来没有意义。 */
function mergeShort(list, min, joiner) {
  const out = []
  let carry = ''
  list.forEach((clause) => {
    const cur = carry ? carry + joiner + clause : clause
    if (countUnits(cur) < min) { carry = cur; return }
    out.push(cur)
    carry = ''
  })
  if (carry) {
    if (out.length) out[out.length - 1] = out[out.length - 1] + joiner + carry
    else out.push(carry)
  }
  return out
}

/** 按标点切成小段，标点跟着前一段（朗读时该停顿的地方就在标点后）。 */
function splitOnPunct(text, breaks) {
  const out = []
  let buf = ''
  for (const ch of text) {
    buf += ch
    if (breaks.includes(ch)) { out.push(buf.trim()); buf = '' }
  }
  if (buf.trim()) out.push(buf.trim())
  return out.filter(Boolean)
}

function splitZh(text, { minChars = 5, maxChars = 20 } = {}) {
  const sized = []
  splitOnPunct(text, ZH_BREAK).forEach((clause) => {
    // 没有标点的长句（如整段引文）按长度硬切，免得一口气跟不下来
    let rest = clause
    while (countUnits(rest) > maxChars) {
      sized.push(rest.slice(0, maxChars))
      rest = rest.slice(maxChars)
    }
    if (rest) sized.push(rest)
  })
  return mergeShort(sized, minChars, '')
}

function splitLatin(text, { minWords = 4, maxWords = 14 } = {}) {
  const sized = []
  splitOnPunct(text, LATIN_BREAK).forEach((sentence) => {
    if (countUnits(sentence) <= maxWords) { sized.push(sentence); return }
    // 长句先在逗号处断，还长就按词数硬切
    splitOnPunct(sentence, ',').forEach((part) => {
      const words = part.split(/\s+/).filter(Boolean)
      if (words.length <= maxWords) { sized.push(part); return }
      for (let i = 0; i < words.length; i += maxWords) sized.push(words.slice(i, i + maxWords).join(' '))
    })
  })
  return mergeShort(sized, minWords, ' ')
}

/**
 * 分句：中文按 、，。；！？：… 断，拉丁语按 . ! ? ; : 断（长句再按逗号/词数切），
 * 两边都会把过短的句子并进邻句、把过长的句子切开。
 * @returns {string[]}
 */
export function splitVerseClauses(text, opts = {}) {
  const raw = String(text ?? '').replace(/\s+/g, ' ').trim()
  if (!raw) return []
  return isCjkText(raw) ? splitZh(raw, opts) : splitLatin(raw, opts)
}

/**
 * 留白时长：与句子长度成正比——跟读需要的时间约等于听的时间，
 * 太短会被催着走，太长会让人以为卡住了，所以夹在 3~9 秒之间。
 */
export function clausePauseSeconds(clause, { perUnit = 0.45, min = 3, max = 9 } = {}) {
  const units = countUnits(clause)
  if (!units) return min
  return Math.min(max, Math.max(min, Math.round(units * perUnit)))
}

/** 直接产出 useGuidedAudio 需要的 steps：说一句 → 留白让用户跟读 → 下一句。 */
export function buildClauseSteps(text, opts = {}) {
  return splitVerseClauses(text, opts).map((clause) => ({
    text: clause,
    label: clause,
    pauseAfter: clausePauseSeconds(clause, opts),
  }))
}

// ── 遮词卡 ──────────────────────────────────────────────────────────────
//
// 为什么种子必须来自经文本身、绝不能用 Math.random()：
// 遮词卡的全部价值在于「同一节经文 + 同一等级，遮住的永远是同一批字」。
// 若用 Math.random()，每次 React 重渲染（切 tab、倒计时 tick、父组件 setState）
// 都会重抽一批，用户每次看到的都是一道新题，形不成稳定的记忆锚点，
// 也无从判断「这一级我过了，可以升级」。用文本哈希当种子既可复现，
// 又不必把遮罩结果写进 localStorage。

/** FNV-1a 32 位哈希：短文本分布够均匀，实现只有几行且跨端一致。 */
export function hashSeed(text) {
  const s = String(text ?? '')
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** 由 (种子, 位置) 算出的固定分数 ∈ [0,1)，同一经文同一位置永远相同。 */
function scoreAt(seed, index) {
  let x = (seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0
  x = (x ^ (x << 13)) >>> 0
  x = (x ^ (x >>> 17)) >>> 0
  x = (x ^ (x << 5)) >>> 0
  return x / 4294967296
}

export const MASK_LEVELS = Object.freeze([
  Object.freeze({ level: 0, ratio: 0, label: '全文' }),
  Object.freeze({ level: 1, ratio: 0.25, label: '遮四分之一' }),
  Object.freeze({ level: 2, ratio: 0.5, label: '遮一半' }),
  Object.freeze({ level: 3, ratio: 0.75, label: '遮四分之三' }),
  Object.freeze({ level: 4, ratio: 1, label: '只留首字' }),
])

export const MASK_MAX_LEVEL = MASK_LEVELS.length - 1

export function clampMaskLevel(level) {
  const n = Math.round(Number(level) || 0)
  return Math.max(0, Math.min(MASK_MAX_LEVEL, n))
}

/**
 * 切成可遮的 token：中文一字一个、拉丁语一词一个，标点空格保持原样（不可遮）。
 * 所有 token 顺次拼回来必须等于原文，这样渲染时不会丢字。
 */
export function tokenizeForMask(text) {
  const src = String(text ?? '')
  const raw = []
  let buf = ''
  let clause = 0
  const flushWord = () => {
    if (!buf) return
    raw.push({ text: buf, kind: 'word', maskable: true, clause })
    buf = ''
  }
  for (const ch of src) {
    if (CJK.test(ch)) {
      flushWord()
      raw.push({ text: ch, kind: 'zh', maskable: true, clause })
    } else if (LATIN.test(ch)) {
      buf += ch
    } else {
      flushWord()
      raw.push({ text: ch, kind: 'sep', maskable: false, clause })
      if (ZH_BREAK.includes(ch) || LATIN_BREAK.includes(ch) || ch === ',') clause += 1
    }
  }
  flushWord()
  return raw.map((tk, index) => ({ ...tk, index, masked: false, hint: '' }))
}

/**
 * 渐进遮词。level 0 全文 / 1 遮 25% / 2 遮 50% / 3 遮 75% / 4 只留每句首字。
 * @returns {{level:number, tokens:Array, maskedCount:number, maskableCount:number}}
 */
export function maskVerse(text, level = 0) {
  const tokens = tokenizeForMask(text)
  const lv = clampMaskLevel(level)
  const maskable = tokens.filter((tk) => tk.maskable)
  if (lv <= 0 || !maskable.length) {
    return { level: lv, tokens, maskedCount: 0, maskableCount: maskable.length }
  }

  if (lv >= MASK_MAX_LEVEL) {
    // 只留首字：每一小句留第一个 token 当锚点，其余全遮；
    // 拉丁词额外给出首字母，否则整行会变成一片空白、连节奏都读不出来。
    const seen = new Set()
    maskable.forEach((tk) => {
      if (!seen.has(tk.clause)) { seen.add(tk.clause); return }
      tokens[tk.index].masked = true
      tokens[tk.index].hint = tk.kind === 'word' ? tk.text[0] : ''
    })
  } else {
    const seed = hashSeed(text)
    // 每个 token 拿一个只与「经文 + 位置」有关的固定分数，按分数从小到大遮。
    // 于是 25% 的集合必然是 50% 的子集、50% 又是 75% 的子集：
    // 升一级只会「再多遮几个」，已经背下来的空不会莫名其妙又被填回去。
    const ranked = maskable
      .map((tk) => ({ index: tk.index, score: scoreAt(seed, tk.index) }))
      .sort((a, b) => (a.score - b.score) || (a.index - b.index))
    const want = Math.max(1, Math.round(maskable.length * MASK_LEVELS[lv].ratio))
    ranked.slice(0, want).forEach(({ index }) => { tokens[index].masked = true })
  }

  return {
    level: lv,
    tokens,
    maskedCount: tokens.filter((tk) => tk.masked).length,
    maskableCount: maskable.length,
  }
}

/** 遮住的 token 占位宽度（em）：与原文宽度大致相等，揭开时排版不跳。 */
export function maskPlaceholderEm(token) {
  if (!token) return 1
  if (token.kind === 'zh') return 1
  return Math.max(1, String(token.text || '').length * 0.6)
}

// ── 复诵着色 ────────────────────────────────────────────────────────────

/**
 * 把 scoreRecitation 的 ops 摊成可直接渲染的序列。
 * ok=念对了、wrong=念错了、missing=漏掉（渲染成空档）、extra=多念的。
 * spaced 用来决定要不要补空格（拉丁词之间要，中文字之间不要）。
 */
export function buildRecitationTokens(result) {
  const ops = result?.ops || []
  return ops.map((op, i) => {
    const text = op.type === 'extra' ? String(op.spoken || '') : String(op.target || '')
    return {
      key: `${op.type}-${i}`,
      type: op.type,
      text,
      spoken: op.spoken == null ? '' : String(op.spoken),
      spaced: /[A-Za-z0-9À-ɏ]/.test(text),
    }
  }).filter((tk) => tk.text)
}

export default {
  isCjkText, countUnits, splitVerseClauses, clausePauseSeconds, buildClauseSteps,
  hashSeed, tokenizeForMask, maskVerse, maskPlaceholderEm, clampMaskLevel,
  buildRecitationTokens, MASK_LEVELS, MASK_MAX_LEVEL,
}
