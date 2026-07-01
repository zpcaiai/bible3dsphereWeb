// expansionEndpoints.js — 内容与神学扩充：全部 12 模块的 api.js 风格调用（content-theology-expansion）
//
// 供并行进程/任意前端直接 import 使用；风格对齐既有 src/api.js 的 submitCheckup（Bearer token）。
// token 省略时回退到 ../auth 的 getToken()。所有端点见 docs/EXPANSION_API.md。
import { getToken } from '../auth'

const API_BASE = (import.meta.env.VITE_API_BASE?.trim()) || '/api'

function headers(json, token) {
  const t = token ?? ((typeof getToken === 'function') ? getToken() : null)
  const o = {}
  if (json) o['Content-Type'] = 'application/json'
  if (t) o.Authorization = `Bearer ${t}`
  return o
}
async function GET(path, token) {
  const r = await fetch(`${API_BASE}${path}`, { headers: headers(false, token) })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d.detail || '加载失败')
  return d
}
async function POST(path, body, token) {
  const r = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: headers(true, token), body: JSON.stringify(body || {}) })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d.detail || '提交失败')
  return d
}

// ── 1) 哀歌 lament（Vroegop 四步） ──
export const lamentMeta = (token) => GET('/lament/meta', token)
export const lamentCompose = (text, situation, token) => POST('/lament/compose', { text, situation, use_ai: true }, token)
export const lamentHistory = (token, limit = 20) => GET(`/lament/history?limit=${limit}`, token)
export const lamentLatest = (token) => GET('/lament/latest', token)

// ── 2) 情感真伪辨 affections（爱德华兹） ──
export const affectionsMeta = (token) => GET('/affections/meta', token)
export const affectionsAssess = (ratings, text, token) => POST('/affections/assess', { ratings, text, use_ai: true }, token)
export const affectionsHistory = (token, limit = 20) => GET(`/affections/history?limit=${limit}`, token)
export const affectionsLatest = (token) => GET('/affections/latest', token)

// ── 3) 失序之爱→重排 ordo（奥古斯丁；注意 /api/ordo，非既有 /api/ordo-amoris 星图） ──
export const ordoMeta = (token) => GET('/ordo/meta', token)
export const ordoAnalyze = (loves, text, token) => POST('/ordo/analyze', { loves, text, use_ai: true }, token)
export const ordoHistory = (token, limit = 20) => GET(`/ordo/history?limit=${limit}`, token)
export const ordoLatest = (token) => GET('/ordo/latest', token)

// ── 4) 温柔谦卑 tender（Ortlund，抗羞耻） ──
export const tenderMeta = (token) => GET('/tender/meta', token)
export const tenderComfort = (text, token) => POST('/tender/comfort', { text, use_ai: true }, token)
export const tenderHistory = (token, limit = 20) => GET(`/tender/history?limit=${limit}`, token)
export const tenderLatest = (token) => GET('/tender/latest', token)

// ── 5) 文化礼仪→反礼仪 liturgy（J.K.A.Smith） ──
export const liturgyMeta = (token) => GET('/liturgy/meta', token)
export const liturgyAnalyze = (habit, token) => POST('/liturgy/analyze', { habit, use_ai: true }, token)
export const liturgyHistory = (token, limit = 20) => GET(`/liturgy/history?limit=${limit}`, token)
export const liturgyLatest = (token) => GET('/liturgy/latest', token)

// ── 6) 诸灵分辨·安慰/枯竭 spirits（依纳爵） ──
export const spiritsMeta = (token) => GET('/spirits/meta', token)
export const spiritsDiscern = (text, token) => POST('/spirits/discern', { text, use_ai: true }, token)
export const spiritsHistory = (token, limit = 20) => GET(`/spirits/history?limit=${limit}`, token)
export const spiritsLatest = (token) => GET('/spirits/latest', token)

// ── 7) 与基督联合 union ──
export const unionMeta = (token) => GET('/union/meta', token)
export const unionAssess = (struggle, token) => POST('/union/assess', { struggle, use_ai: true }, token)
export const unionHistory = (token, limit = 20) => GET(`/union/history?limit=${limit}`, token)
export const unionLatest = (token) => GET('/union/latest', token)

// ── 8) 以神为乐 delight（派博·基督徒享乐主义） ──
export const delightMeta = (token) => GET('/delight/meta', token)
export const delightReframe = (duty, token) => POST('/delight/reframe', { duty, use_ai: true }, token)
export const delightHistory = (token, limit = 20) => GET(`/delight/history?limit=${limit}`, token)
export const delightLatest = (token) => GET('/delight/latest', token)

// ── 9) 情感健康属灵 eh（Scazzero） ──
export const ehMeta = (token) => GET('/eh/meta', token)
export const ehAssess = (ratings, text, token) => POST('/eh/assess', { ratings, text, use_ai: true }, token)
export const ehHistory = (token, limit = 20) => GET(`/eh/history?limit=${limit}`, token)
export const ehLatest = (token) => GET('/eh/latest', token)

// ── 10) 基督徒知足 contentment（伯罗斯） ──
export const contentmentMeta = (token) => GET('/contentment/meta', token)
export const contentmentAnalyze = (lack, token) => POST('/contentment/analyze', { lack, use_ai: true }, token)
export const contentmentHistory = (token, limit = 20) => GET(`/contentment/history?limit=${limit}`, token)
export const contentmentLatest = (token) => GET('/contentment/latest', token)

// ── 11) 认识神·属性默想 knowgod（巴刻/陶恕/里夫斯） ──
export const knowgodMeta = (token) => GET('/knowgod/meta', token)
export const knowgodMeditate = ({ need, attribute } = {}, token) => POST('/knowgod/meditate', { need, attribute, use_ai: true }, token)
export const knowgodHistory = (token, limit = 20) => GET(`/knowgod/history?limit=${limit}`, token)
export const knowgodLatest = (token) => GET('/knowgod/latest', token)

// ── 13) 心意更新 renovation（魏乐德 VIM×五维） ──
export const renovationMeta = (token) => GET('/renovation/meta', token)
export const renovationAssess = (ratings, text, token) => POST('/renovation/assess', { ratings, text, use_ai: true }, token)
export const renovationHistory = (token, limit = 20) => GET(`/renovation/history?limit=${limit}`, token)
export const renovationLatest = (token) => GET('/renovation/latest', token)

// ── 14) 华人本土灵修 chinese（倪柝声/王明道/唐崇荣/宋尚节） ──
export const chineseMeta = (token) => GET('/chinese/meta', token)
export const chineseSearch = (q, author, token) => GET(`/chinese/search?q=${encodeURIComponent(q || '')}${author ? `&author=${encodeURIComponent(author)}` : ''}`, token)
export const chineseMeditate = (need, token) => POST('/chinese/meditate', { need, use_ai: true }, token)
export const chineseHistory = (token, limit = 20) => GET(`/chinese/history?limit=${limit}`, token)
export const chineseLatest = (token) => GET('/chinese/latest', token)

// ── 12) 推荐书目 + 圣诗 resources ──
export const resourceMeta = (token) => GET('/resources/meta', token)
export const resourceBooks = (continent, token) => GET(`/resources/books${continent ? `?continent=${encodeURIComponent(continent)}` : ''}`, token)
export const resourceHymns = (token) => GET('/resources/hymns', token)
export const resourceBookmark = (slug, kind, token) => POST('/resources/bookmark', { slug, kind: kind || 'book' }, token)
export const resourceBookmarks = (token) => GET('/resources/bookmarks', token)


// ── 扩充第二辑（13 个新引擎，统一 analyze + {text}）──
export const assuranceMeta = (token) => GET('/assurance/meta', token)
export const assuranceAnalyze = (text, token) => POST('/assurance/analyze', { text, use_ai: true }, token)
export const assuranceHistory = (token, limit = 20) => GET(`/assurance/history?limit=${limit}`, token)
export const assuranceLatest = (token) => GET('/assurance/latest', token)
export const forgivenessMeta = (token) => GET('/forgiveness/meta', token)
export const forgivenessAnalyze = (text, token) => POST('/forgiveness/analyze', { text, use_ai: true }, token)
export const forgivenessHistory = (token, limit = 20) => GET(`/forgiveness/history?limit=${limit}`, token)
export const forgivenessLatest = (token) => GET('/forgiveness/latest', token)
export const fellowshipMeta = (token) => GET('/fellowship/meta', token)
export const fellowshipAnalyze = (text, token) => POST('/fellowship/analyze', { text, use_ai: true }, token)
export const fellowshipHistory = (token, limit = 20) => GET(`/fellowship/history?limit=${limit}`, token)
export const fellowshipLatest = (token) => GET('/fellowship/latest', token)
export const ruleoflifeMeta = (token) => GET('/rule-of-life/meta', token)
export const ruleoflifeAnalyze = (text, token) => POST('/rule-of-life/analyze', { text, use_ai: true }, token)
export const ruleoflifeHistory = (token, limit = 20) => GET(`/rule-of-life/history?limit=${limit}`, token)
export const ruleoflifeLatest = (token) => GET('/rule-of-life/latest', token)
export const feargodMeta = (token) => GET('/fear-of-god/meta', token)
export const feargodAnalyze = (text, token) => POST('/fear-of-god/analyze', { text, use_ai: true }, token)
export const feargodHistory = (token, limit = 20) => GET(`/fear-of-god/history?limit=${limit}`, token)
export const feargodLatest = (token) => GET('/fear-of-god/latest', token)
export const eucharisteoMeta = (token) => GET('/eucharisteo/meta', token)
export const eucharisteoAnalyze = (text, token) => POST('/eucharisteo/analyze', { text, use_ai: true }, token)
export const eucharisteoHistory = (token, limit = 20) => GET(`/eucharisteo/history?limit=${limit}`, token)
export const eucharisteoLatest = (token) => GET('/eucharisteo/latest', token)
export const holinessMeta = (token) => GET('/holiness/meta', token)
export const holinessAnalyze = (text, token) => POST('/holiness/analyze', { text, use_ai: true }, token)
export const holinessHistory = (token, limit = 20) => GET(`/holiness/history?limit=${limit}`, token)
export const holinessLatest = (token) => GET('/holiness/latest', token)
export const neighborMeta = (token) => GET('/neighbor-love/meta', token)
export const neighborAnalyze = (text, token) => POST('/neighbor-love/analyze', { text, use_ai: true }, token)
export const neighborHistory = (token, limit = 20) => GET(`/neighbor-love/history?limit=${limit}`, token)
export const neighborLatest = (token) => GET('/neighbor-love/latest', token)
export const hopeMeta = (token) => GET('/hope/meta', token)
export const hopeAnalyze = (text, token) => POST('/hope/analyze', { text, use_ai: true }, token)
export const hopeHistory = (token, limit = 20) => GET(`/hope/history?limit=${limit}`, token)
export const hopeLatest = (token) => GET('/hope/latest', token)
export const prayerschoolMeta = (token) => GET('/prayer-school/meta', token)
export const prayerschoolAnalyze = (text, token) => POST('/prayer-school/analyze', { text, use_ai: true }, token)
export const prayerschoolHistory = (token, limit = 20) => GET(`/prayer-school/history?limit=${limit}`, token)
export const prayerschoolLatest = (token) => GET('/prayer-school/latest', token)
export const contemplationMeta = (token) => GET('/contemplation/meta', token)
export const contemplationAnalyze = (text, token) => POST('/contemplation/analyze', { text, use_ai: true }, token)
export const contemplationHistory = (token, limit = 20) => GET(`/contemplation/history?limit=${limit}`, token)
export const contemplationLatest = (token) => GET('/contemplation/latest', token)
export const incarnationMeta = (token) => GET('/incarnation/meta', token)
export const incarnationAnalyze = (text, token) => POST('/incarnation/analyze', { text, use_ai: true }, token)
export const incarnationHistory = (token, limit = 20) => GET(`/incarnation/history?limit=${limit}`, token)
export const incarnationLatest = (token) => GET('/incarnation/latest', token)
export const wisdomMeta = (token) => GET('/wisdom/meta', token)
export const wisdomAnalyze = (text, token) => POST('/wisdom/analyze', { text, use_ai: true }, token)
export const wisdomHistory = (token, limit = 20) => GET(`/wisdom/history?limit=${limit}`, token)
export const wisdomLatest = (token) => GET('/wisdom/latest', token)

// 便捷映射：featureKey → { prefix, action, meta, run } —— 供动态调用。
export const EXPANSION_MODULES = {
  lament: { prefix: 'lament', action: 'compose', meta: lamentMeta, run: lamentCompose },
  affections: { prefix: 'affections', action: 'assess', meta: affectionsMeta, run: affectionsAssess },
  ordo: { prefix: 'ordo', action: 'analyze', meta: ordoMeta, run: ordoAnalyze },
  tender: { prefix: 'tender', action: 'comfort', meta: tenderMeta, run: tenderComfort },
  liturgy: { prefix: 'liturgy', action: 'analyze', meta: liturgyMeta, run: liturgyAnalyze },
  spirits: { prefix: 'spirits', action: 'discern', meta: spiritsMeta, run: spiritsDiscern },
  union: { prefix: 'union', action: 'assess', meta: unionMeta, run: unionAssess },
  delight: { prefix: 'delight', action: 'reframe', meta: delightMeta, run: delightReframe },
  eh: { prefix: 'eh', action: 'assess', meta: ehMeta, run: ehAssess },
  contentment: { prefix: 'contentment', action: 'analyze', meta: contentmentMeta, run: contentmentAnalyze },
  knowgod: { prefix: 'knowgod', action: 'meditate', meta: knowgodMeta, run: knowgodMeditate },
  renovation: { prefix: 'renovation', action: 'assess', meta: renovationMeta, run: renovationAssess },
  chinese: { prefix: 'chinese', action: 'meditate', meta: chineseMeta, run: chineseMeditate },
  resources: { prefix: 'resources', action: null, meta: resourceMeta, run: null },
  assurance: { prefix: 'assurance', action: 'analyze', meta: assuranceMeta, run: assuranceAnalyze },
  forgiveness: { prefix: 'forgiveness', action: 'analyze', meta: forgivenessMeta, run: forgivenessAnalyze },
  fellowship: { prefix: 'fellowship', action: 'analyze', meta: fellowshipMeta, run: fellowshipAnalyze },
  ruleoflife: { prefix: 'rule-of-life', action: 'analyze', meta: ruleoflifeMeta, run: ruleoflifeAnalyze },
  feargod: { prefix: 'fear-of-god', action: 'analyze', meta: feargodMeta, run: feargodAnalyze },
  eucharisteo: { prefix: 'eucharisteo', action: 'analyze', meta: eucharisteoMeta, run: eucharisteoAnalyze },
  holiness: { prefix: 'holiness', action: 'analyze', meta: holinessMeta, run: holinessAnalyze },
  neighbor: { prefix: 'neighbor-love', action: 'analyze', meta: neighborMeta, run: neighborAnalyze },
  hope: { prefix: 'hope', action: 'analyze', meta: hopeMeta, run: hopeAnalyze },
  prayerschool: { prefix: 'prayer-school', action: 'analyze', meta: prayerschoolMeta, run: prayerschoolAnalyze },
  contemplation: { prefix: 'contemplation', action: 'analyze', meta: contemplationMeta, run: contemplationAnalyze },
  incarnation: { prefix: 'incarnation', action: 'analyze', meta: incarnationMeta, run: incarnationAnalyze },
  wisdom: { prefix: 'wisdom', action: 'analyze', meta: wisdomMeta, run: wisdomAnalyze },
}
