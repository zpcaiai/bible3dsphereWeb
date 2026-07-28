// recitationScore.js — 背经复诵评分（纯函数，便于单测）。
//
// 中文按「字」比对，拉丁语按「词」比对；忽略标点、空白、大小写与常见异体。
// 返回准确率 + 逐 token 的对齐结果，供 UI 高亮「漏字 / 错字 / 多字」。

const PUNCT = /[\s　-〿＀-￯!-/:-@[-`{-~“”‘’—…、。，；：？！《》〈〉·]/g
const CJK = /[一-鿿]/

export function normalizeRecitation(text) {
  return String(text ?? '').replace(PUNCT, '').toLowerCase()
}

/** 中文逐字、英文逐词的分词。 */
export function tokenizeRecitation(text) {
  const clean = String(text ?? '').replace(/[　-〿＀-￯!-/:-@[-`{-~“”‘’—…]/g, ' ')
  const tokens = []
  const parts = clean.split(/\s+/).filter(Boolean)
  parts.forEach((part) => {
    if (CJK.test(part)) {
      // 中英混排：中文逐字拆，连续的拉丁/数字段整体作为一个 token
      let buf = ''
      for (const ch of part) {
        if (CJK.test(ch)) {
          if (buf) { tokens.push(buf.toLowerCase()); buf = '' }
          tokens.push(ch)
        } else {
          buf += ch
        }
      }
      if (buf) tokens.push(buf.toLowerCase())
    } else {
      tokens.push(part.toLowerCase())
    }
  })
  return tokens
}

/** 标准 Levenshtein 编辑距离 + 回溯出对齐操作序列。 */
export function alignTokens(target, spoken) {
  const n = target.length
  const m = spoken.length
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1))
  for (let i = 0; i <= n; i += 1) dp[i][0] = i
  for (let j = 0; j <= m; j += 1) dp[0][j] = j
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      const cost = target[i - 1] === spoken[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }

  const ops = []
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + (target[i - 1] === spoken[j - 1] ? 0 : 1)) {
      ops.push({ type: target[i - 1] === spoken[j - 1] ? 'ok' : 'wrong', target: target[i - 1], spoken: spoken[j - 1], index: i - 1 })
      i -= 1; j -= 1
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      ops.push({ type: 'missing', target: target[i - 1], spoken: null, index: i - 1 })
      i -= 1
    } else {
      ops.push({ type: 'extra', target: null, spoken: spoken[j - 1], index: i })
      j -= 1
    }
  }
  ops.reverse()
  return { distance: dp[n][m], ops }
}

/**
 * 评分。
 * @returns {{accuracy:number, distance:number, ops:Array, targetTokens:Array, spokenTokens:Array, verdict:string}}
 */
export function scoreRecitation(targetText, spokenText) {
  const targetTokens = tokenizeRecitation(targetText)
  const spokenTokens = tokenizeRecitation(spokenText)
  if (!targetTokens.length) {
    return { accuracy: 0, distance: 0, ops: [], targetTokens, spokenTokens, verdict: 'empty' }
  }
  const { distance, ops } = alignTokens(targetTokens, spokenTokens)
  const accuracy = Math.max(0, Math.round((1 - distance / targetTokens.length) * 100))
  let verdict = 'again'
  if (accuracy >= 95) verdict = 'mastered'
  else if (accuracy >= 80) verdict = 'close'
  else if (accuracy >= 50) verdict = 'partial'
  return { accuracy, distance, ops, targetTokens, spokenTokens, verdict }
}

export const RECITATION_VERDICT_COPY = Object.freeze({
  mastered: '几乎一字不差，可以放心把它带进今天。',
  close: '非常接近了，只差几个字。',
  partial: '记住了一半，再来一次会更稳。',
  again: '先跟着听一遍，再试着复诵。',
  empty: '还没有可比对的经文。',
})
