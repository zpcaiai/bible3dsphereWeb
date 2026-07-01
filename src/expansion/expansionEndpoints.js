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


// ── 扩充第三辑（10 个新引擎，统一 analyze + {text}）──
export const holyspiritMeta = (token) => GET('/holy-spirit/meta', token)
export const holyspiritAnalyze = (text, token) => POST('/holy-spirit/analyze', { text, use_ai: true }, token)
export const holyspiritHistory = (token, limit = 20) => GET(`/holy-spirit/history?limit=${limit}`, token)
export const holyspiritLatest = (token) => GET('/holy-spirit/latest', token)
export const adoptionMeta = (token) => GET('/adoption/meta', token)
export const adoptionAnalyze = (text, token) => POST('/adoption/analyze', { text, use_ai: true }, token)
export const adoptionHistory = (token, limit = 20) => GET(`/adoption/history?limit=${limit}`, token)
export const adoptionLatest = (token) => GET('/adoption/latest', token)
export const crossMeta = (token) => GET('/cross/meta', token)
export const crossAnalyze = (text, token) => POST('/cross/analyze', { text, use_ai: true }, token)
export const crossHistory = (token, limit = 20) => GET(`/cross/history?limit=${limit}`, token)
export const crossLatest = (token) => GET('/cross/latest', token)
export const fearofmanMeta = (token) => GET('/fear-of-man/meta', token)
export const fearofmanAnalyze = (text, token) => POST('/fear-of-man/analyze', { text, use_ai: true }, token)
export const fearofmanHistory = (token, limit = 20) => GET(`/fear-of-man/history?limit=${limit}`, token)
export const fearofmanLatest = (token) => GET('/fear-of-man/latest', token)
export const providenceMeta = (token) => GET('/providence/meta', token)
export const providenceAnalyze = (text, token) => POST('/providence/analyze', { text, use_ai: true }, token)
export const providenceHistory = (token, limit = 20) => GET(`/providence/history?limit=${limit}`, token)
export const providenceLatest = (token) => GET('/providence/latest', token)
export const repentanceMeta = (token) => GET('/repentance/meta', token)
export const repentanceAnalyze = (text, token) => POST('/repentance/analyze', { text, use_ai: true }, token)
export const repentanceHistory = (token, limit = 20) => GET(`/repentance/history?limit=${limit}`, token)
export const repentanceLatest = (token) => GET('/repentance/latest', token)
export const doubtMeta = (token) => GET('/doubt/meta', token)
export const doubtAnalyze = (text, token) => POST('/doubt/analyze', { text, use_ai: true }, token)
export const doubtHistory = (token, limit = 20) => GET(`/doubt/history?limit=${limit}`, token)
export const doubtLatest = (token) => GET('/doubt/latest', token)
export const generosityMeta = (token) => GET('/generosity/meta', token)
export const generosityAnalyze = (text, token) => POST('/generosity/analyze', { text, use_ai: true }, token)
export const generosityHistory = (token, limit = 20) => GET(`/generosity/history?limit=${limit}`, token)
export const generosityLatest = (token) => GET('/generosity/latest', token)
export const humilityMeta = (token) => GET('/humility/meta', token)
export const humilityAnalyze = (text, token) => POST('/humility/analyze', { text, use_ai: true }, token)
export const humilityHistory = (token, limit = 20) => GET(`/humility/history?limit=${limit}`, token)
export const humilityLatest = (token) => GET('/humility/latest', token)
export const worddelightMeta = (token) => GET('/word-delight/meta', token)
export const worddelightAnalyze = (text, token) => POST('/word-delight/analyze', { text, use_ai: true }, token)
export const worddelightHistory = (token, limit = 20) => GET(`/word-delight/history?limit=${limit}`, token)
export const worddelightLatest = (token) => GET('/word-delight/latest', token)


// ── 扩充第四辑（13 个新引擎，统一 analyze + {text}）──
export const angerMeta = (token) => GET('/anger/meta', token)
export const angerAnalyze = (text, token) => POST('/anger/analyze', { text, use_ai: true }, token)
export const angerHistory = (token, limit = 20) => GET(`/anger/history?limit=${limit}`, token)
export const angerLatest = (token) => GET('/anger/latest', token)
export const lonelinessMeta = (token) => GET('/loneliness/meta', token)
export const lonelinessAnalyze = (text, token) => POST('/loneliness/analyze', { text, use_ai: true }, token)
export const lonelinessHistory = (token, limit = 20) => GET(`/loneliness/history?limit=${limit}`, token)
export const lonelinessLatest = (token) => GET('/loneliness/latest', token)
export const perfectionismMeta = (token) => GET('/perfectionism/meta', token)
export const perfectionismAnalyze = (text, token) => POST('/perfectionism/analyze', { text, use_ai: true }, token)
export const perfectionismHistory = (token, limit = 20) => GET(`/perfectionism/history?limit=${limit}`, token)
export const perfectionismLatest = (token) => GET('/perfectionism/latest', token)
export const envyMeta = (token) => GET('/envy/meta', token)
export const envyAnalyze = (text, token) => POST('/envy/analyze', { text, use_ai: true }, token)
export const envyHistory = (token, limit = 20) => GET(`/envy/history?limit=${limit}`, token)
export const envyLatest = (token) => GET('/envy/latest', token)
export const burnoutMeta = (token) => GET('/burnout/meta', token)
export const burnoutAnalyze = (text, token) => POST('/burnout/analyze', { text, use_ai: true }, token)
export const burnoutHistory = (token, limit = 20) => GET(`/burnout/history?limit=${limit}`, token)
export const burnoutLatest = (token) => GET('/burnout/latest', token)
export const comfortMeta = (token) => GET('/comfort/meta', token)
export const comfortAnalyze = (text, token) => POST('/comfort/analyze', { text, use_ai: true }, token)
export const comfortHistory = (token, limit = 20) => GET(`/comfort/history?limit=${limit}`, token)
export const comfortLatest = (token) => GET('/comfort/latest', token)
export const prodigalMeta = (token) => GET('/prodigal/meta', token)
export const prodigalAnalyze = (text, token) => POST('/prodigal/analyze', { text, use_ai: true }, token)
export const prodigalHistory = (token, limit = 20) => GET(`/prodigal/history?limit=${limit}`, token)
export const prodigalLatest = (token) => GET('/prodigal/latest', token)
export const acediaMeta = (token) => GET('/acedia/meta', token)
export const acediaAnalyze = (text, token) => POST('/acedia/analyze', { text, use_ai: true }, token)
export const acediaHistory = (token, limit = 20) => GET(`/acedia/history?limit=${limit}`, token)
export const acediaLatest = (token) => GET('/acedia/latest', token)
export const conscienceMeta = (token) => GET('/conscience/meta', token)
export const conscienceAnalyze = (text, token) => POST('/conscience/analyze', { text, use_ai: true }, token)
export const conscienceHistory = (token, limit = 20) => GET(`/conscience/history?limit=${limit}`, token)
export const conscienceLatest = (token) => GET('/conscience/latest', token)
export const secondcomingMeta = (token) => GET('/second-coming/meta', token)
export const secondcomingAnalyze = (text, token) => POST('/second-coming/analyze', { text, use_ai: true }, token)
export const secondcomingHistory = (token, limit = 20) => GET(`/second-coming/history?limit=${limit}`, token)
export const secondcomingLatest = (token) => GET('/second-coming/latest', token)
export const chronicMeta = (token) => GET('/chronic-suffering/meta', token)
export const chronicAnalyze = (text, token) => POST('/chronic-suffering/analyze', { text, use_ai: true }, token)
export const chronicHistory = (token, limit = 20) => GET(`/chronic-suffering/history?limit=${limit}`, token)
export const chronicLatest = (token) => GET('/chronic-suffering/latest', token)
export const parentingMeta = (token) => GET('/parenting/meta', token)
export const parentingAnalyze = (text, token) => POST('/parenting/analyze', { text, use_ai: true }, token)
export const parentingHistory = (token, limit = 20) => GET(`/parenting/history?limit=${limit}`, token)
export const parentingLatest = (token) => GET('/parenting/latest', token)
export const agingMeta = (token) => GET('/aging/meta', token)
export const agingAnalyze = (text, token) => POST('/aging/analyze', { text, use_ai: true }, token)
export const agingHistory = (token, limit = 20) => GET(`/aging/history?limit=${limit}`, token)
export const agingLatest = (token) => GET('/aging/latest', token)

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
  anger: { prefix: 'anger', action: 'analyze', meta: angerMeta, run: angerAnalyze },
  loneliness: { prefix: 'loneliness', action: 'analyze', meta: lonelinessMeta, run: lonelinessAnalyze },
  perfectionism: { prefix: 'perfectionism', action: 'analyze', meta: perfectionismMeta, run: perfectionismAnalyze },
  envy: { prefix: 'envy', action: 'analyze', meta: envyMeta, run: envyAnalyze },
  burnout: { prefix: 'burnout', action: 'analyze', meta: burnoutMeta, run: burnoutAnalyze },
  comfort: { prefix: 'comfort', action: 'analyze', meta: comfortMeta, run: comfortAnalyze },
  prodigal: { prefix: 'prodigal', action: 'analyze', meta: prodigalMeta, run: prodigalAnalyze },
  acedia: { prefix: 'acedia', action: 'analyze', meta: acediaMeta, run: acediaAnalyze },
  conscience: { prefix: 'conscience', action: 'analyze', meta: conscienceMeta, run: conscienceAnalyze },
  secondcoming: { prefix: 'second-coming', action: 'analyze', meta: secondcomingMeta, run: secondcomingAnalyze },
  chronic: { prefix: 'chronic-suffering', action: 'analyze', meta: chronicMeta, run: chronicAnalyze },
  parenting: { prefix: 'parenting', action: 'analyze', meta: parentingMeta, run: parentingAnalyze },
  aging: { prefix: 'aging', action: 'analyze', meta: agingMeta, run: agingAnalyze },
  holyspirit: { prefix: 'holy-spirit', action: 'analyze', meta: holyspiritMeta, run: holyspiritAnalyze },
  adoption: { prefix: 'adoption', action: 'analyze', meta: adoptionMeta, run: adoptionAnalyze },
  cross: { prefix: 'cross', action: 'analyze', meta: crossMeta, run: crossAnalyze },
  fearofman: { prefix: 'fear-of-man', action: 'analyze', meta: fearofmanMeta, run: fearofmanAnalyze },
  providence: { prefix: 'providence', action: 'analyze', meta: providenceMeta, run: providenceAnalyze },
  repentance: { prefix: 'repentance', action: 'analyze', meta: repentanceMeta, run: repentanceAnalyze },
  doubt: { prefix: 'doubt', action: 'analyze', meta: doubtMeta, run: doubtAnalyze },
  generosity: { prefix: 'generosity', action: 'analyze', meta: generosityMeta, run: generosityAnalyze },
  humility: { prefix: 'humility', action: 'analyze', meta: humilityMeta, run: humilityAnalyze },
  worddelight: { prefix: 'word-delight', action: 'analyze', meta: worddelightMeta, run: worddelightAnalyze },
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
