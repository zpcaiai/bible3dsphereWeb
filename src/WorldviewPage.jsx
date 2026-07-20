import { t as i18nT } from './i18n/runtime'
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { getToken } from './auth'
import { t } from './i18n/runtime'
import { AutoText } from './autoTranslate'
import SuggestField from './components/SuggestField'
import PlanExecutionPanel from './components/PlanExecutionPanel'
import {
  rewriteNarrative, diagnoseWorldview, fetchWorldviewProfile, fetchWorldviewAssessments,
} from './api'

// 世界观 · 生命叙事重写  —  接 /api/worldview/*
// i18n：静态文案走 t()（auto-en 词典 + 运行时机翻兜底）；后端动态/AI 文案走 <AutoText>。
const ACCENT = '#8c8cff'
const ACCENT_DIM = 'rgba(140,140,255,0.16)'
const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, marginBottom: 12 }
const lbl = { display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: '10px 0 5px' }
const inp = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13.5, fontFamily: 'inherit' }
const primaryBtn = { width: '100%', padding: 13, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#6a6aff,#8c5cff)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }
const tabBtn = (on) => ({ flex: 1, padding: '9px 6px', borderRadius: 10, fontSize: 12.5, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid ' + (on ? 'rgba(140,140,255,0.5)' : 'rgba(255,255,255,0.1)'), background: on ? ACCENT_DIM : 'transparent', color: on ? '#c7c8ff' : 'rgba(255,255,255,0.6)', fontWeight: on ? 700 : 400 })

// 偶像 key → 中文标签；显示时一律经 t() 本地化（EN 模式机翻）
const IDOL_LABELS = { success: '成就 / 成功', control: '掌控 / 确定', money: '金钱 / 安全感', relationship: '关系 / 被爱', technology: '技术 / 效率', victimhood: '受害者', spiritual_performance: '属灵表现', unknown: '（自动识别）' }
const IDOL_OPTS = [['', '（自动识别）'], ['success', '成就 / 成功'], ['control', '掌控 / 确定'], ['money', '金钱 / 安全感'], ['relationship', '关系 / 被爱'], ['technology', '技术 / 效率'], ['victimhood', '受害者'], ['spiritual_performance', '属灵表现']]
const SOURCE_OPTS = [['journal', '日记 / 随笔'], ['prayer', '祷告'], ['conversation', '对话'], ['decision', '决策处境'], ['suffering', '苦难 / 创伤']]
const OLD_NARR_OPTS = ['我必须成功，否则我就一文不值。', '我必须掌控一切，否则一切都会崩溃。', '只有足够的钱才能让我真正安全。', '没有某个人的爱，我就活不下去。', '跟不上技术 / 时代，我就会被淘汰。', '我是受害者，没人懂我，一切都怪别人。', '我必须表现得够属灵，神才会喜悦我。']
const DIAG_OPTS = ['最近我总是为工作的成败而焦虑…', '我很怕失去对生活的掌控…', '我觉得只有更多的钱才有安全感…', '我特别在意别人是否认可我…', '我常觉得自己是受害者、没人理解我…', '我灵修时总担心自己不够属灵、神不喜悦我…']

const idolLabel = (k) => t(IDOL_LABELS[k] || k)

const Chip = ({ children, tone }) => (
  <span style={{ display: 'inline-block', margin: '3px 5px 0 0', padding: '3px 9px', borderRadius: 999, fontSize: 11.5, border: '1px solid ' + (tone === 'warn' ? 'rgba(255,159,138,0.4)' : 'rgba(140,140,255,0.35)'), background: tone === 'warn' ? 'rgba(255,159,138,0.12)' : ACCENT_DIM, color: tone === 'warn' ? '#ffb3a0' : '#c7c8ff' }}>{children}</span>
)
// 动态/后端文案：EN 模式自动机翻
const D = ({ children }) => <AutoText>{typeof children === 'string' ? children : (children == null ? '' : String(children))}</AutoText>
const Err = ({ children }) => children ? <div style={{ color: '#ff6b6b', fontSize: 12, margin: '8px 0' }}>{children}</div> : null
const fmtScore = (x) => (x == null ? '—' : (x <= 1 ? Math.round(x * 100) : Math.round(x)))

function Disclaimer() {
  return <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, marginTop: 16 }}>
    {t('本系统提供辅助性的世界观辨识与生命叙事重写，不是最终定论。最终方向需要圣经、祷告、教会共同体与牧者印证；如遇危机请立即寻求帮助与专业支持。')}
  </p>
}

// ── 生命叙事重写 ─────────────────────────────────────────────────────────────
function NarrativeTab({ token, user }) {
  const [text, setText] = useState('')
  const [idol, setIdol] = useState('')
  const [useAi, setUseAi] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [r, setR] = useState(null)

  async function submit() {
    if (!token) { setErr(t('请先登录后再使用')); return }
    if (!text.trim() && !idol) { setErr(t('请写下旧叙事，或选择一个偶像类别')); return }
    setBusy(true); setErr(''); setR(null)
    try {
      const d = await rewriteNarrative({ text, idol_category: idol || undefined, use_ai: useAi, persist: true }, token)
      setR(d)
    } catch (e) { setErr(e.message || t('生成失败')) } finally { setBusy(false) }
  }

  return (
    <div>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 12 }}>
        {t('人不只活在概念里，也活在故事里。写下你心里反复出现的「旧叙事」（例如「我必须……否则……」），系统会辨识核心恐惧、隐藏偶像与谎言，并以福音重写出新叙事与操练。')}
      </div>
      <SuggestField label={i18nT('旧叙事 / 此刻的处境')} value={text} onChange={setText} accent={ACCENT}
        placeholder={i18nT('例如：我必须把每件事都做到完美，否则我就没有价值。')} options={OLD_NARR_OPTS} minHeight={84} />
      <label style={lbl}>{t('偶像类别（可选，留空则自动识别）')}</label>
      <select value={idol} onChange={(e) => setIdol(e.target.value)} style={inp}>
        {IDOL_OPTS.map(([k, z]) => <option key={k} value={k} style={{ color: '#000' }}>{t(z)}</option>)}
      </select>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'rgba(255,255,255,0.75)', margin: '12px 0 4px', cursor: 'pointer' }}>
        <input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} /> {t('启用 AI 润色（经文与操练保持确定性）')}
      </label>
      <Err>{err}</Err>
      <button onClick={submit} disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }}>{busy ? t('重写中…') : t('✍️ 生成福音新叙事')}</button>

      {r && (
        <div style={{ marginTop: 16 }}>
          <div style={card}>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{t('旧叙事')}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}><D>{r.oldNarrative}</D></div>
            {r.oldNarrativeTemplate && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{t('模板')}：<D>{r.oldNarrativeTemplate}</D></div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div style={{ ...card, margin: 0 }}><div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>{t('核心恐惧')}</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 1.6 }}><D>{r.coreFear}</D></div></div>
            <div style={{ ...card, margin: 0 }}><div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>{t('隐藏偶像')}</div><div style={{ fontSize: 13, color: '#ffb3a0', marginTop: 4, fontWeight: 600 }}>{idolLabel(r.hiddenIdol)}</div></div>
          </div>
          <div style={{ ...card, borderColor: 'rgba(255,159,138,0.25)' }}>
            <div style={{ fontSize: 11.5, color: 'rgba(255,159,138,0.8)', marginBottom: 4 }}>{t('核心谎言')}</div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}><D>{r.coreLie}</D></div>
          </div>
          <div style={{ ...card, background: 'rgba(245,181,63,0.08)', borderColor: 'rgba(245,181,63,0.3)' }}>
            <div style={{ fontSize: 11.5, color: '#f5d98f', marginBottom: 4 }}>{t('✝️ 福音真理')}</div>
            <div style={{ fontSize: 14, color: '#ffe9b8', lineHeight: 1.75 }}><D>{r.gospelTruth}</D></div>
          </div>
          <div style={{ ...card, background: 'linear-gradient(135deg, rgba(120,120,255,0.14), rgba(90,200,250,0.06))', borderColor: 'rgba(140,140,255,0.35)' }}>
            <div style={{ fontSize: 12, color: '#c7c8ff', marginBottom: 6, fontWeight: 700 }}>{t('✨ 新叙事')}</div>
            <div style={{ fontSize: 15, color: '#fff', lineHeight: 1.8 }}><D>{r.newNarrative}</D></div>
          </div>
          {(r.scriptureRefs?.length > 0 || r.recommendedBiblePersons?.length > 0) && (
            <div style={card}>
              {r.scriptureRefs?.length > 0 && <div style={{ marginBottom: 6 }}><span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>{t('经文')}：</span>{r.scriptureRefs.map((x, i) => <Chip key={i}><D>{x}</D></Chip>)}</div>}
              {r.recommendedBiblePersons?.length > 0 && <div><span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>{t('圣经人物')}：</span>{r.recommendedBiblePersons.map((x, i) => <Chip key={i}><D>{typeof x === 'string' ? x : x.name}</D></Chip>)}</div>}
            </div>
          )}
          {r.practicePlan?.length > 0 && (
            <div style={card}><div style={{ fontSize: 12.5, fontWeight: 700, color: ACCENT, marginBottom: 8 }}>{t('🌱 操练计划')}</div>
              {r.practicePlan.map((p, i) => <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 6 }}>· <D>{p}</D></div>)}
              <PlanExecutionPanel
                user={user}
                planId={`worldview-narrative:${r.id || r.hiddenIdol || 'current'}`}
                title="世界观操练执行"
                actions={r.practicePlan.map((practice, index) => ({ id: `practice-${index + 1}`, title: practice, cadence: 'daily' }))}
              />
            </div>
          )}
          {r.reflectionQuestions?.length > 0 && (
            <div style={card}><div style={{ fontSize: 12.5, fontWeight: 700, color: ACCENT, marginBottom: 8 }}>{t('🪞 省察问题')}</div>
              {r.reflectionQuestions.map((q, i) => <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, marginBottom: 6 }}>{i + 1}. <D>{q}</D></div>)}
            </div>
          )}
        </div>
      )}
      <Disclaimer />
    </div>
  )
}

// ── 世界观诊断 ───────────────────────────────────────────────────────────────
function DiagnoseTab({ token }) {
  const [text, setText] = useState('')
  const [src, setSrc] = useState('journal')
  const [useAi, setUseAi] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [r, setR] = useState(null)

  async function submit() {
    if (!token) { setErr(t('请先登录后再使用')); return }
    if (!text.trim()) { setErr(t('请先写下一段日记 / 祷告 / 处境')); return }
    setBusy(true); setErr(''); setR(null)
    try {
      const d = await diagnoseWorldview({ text, source_type: src, use_ai: useAi, persist: true }, token)
      setR(d)
    } catch (e) { setErr(e.message || t('诊断失败')) } finally { setBusy(false) }
  }

  const diag = r?.diagnosis || {}
  const idols = r?.idols?.suggestedTargets || []
  const chipText = (d) => (typeof d === 'string' ? d : (d.domain || d.name || d.category || ''))

  return (
    <div>
      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 12 }}>
        {t('把一段真实的日记、祷告或处境写下来，系统会先过「危机优先」守卫，再辨识其中的世界观倾向、底层信念与可能的偶像。安全优先——若检测到高危，会转向关怀而不做分析。')}
      </div>
      <SuggestField label={i18nT('日记 / 祷告 / 处境')} value={text} onChange={setText} accent={ACCENT}
        placeholder={i18nT('诚实地写下你近来的内心、挣扎或一段经历…')} options={DIAG_OPTS} minHeight={110} />
      <label style={lbl}>{t('来源类型')}</label>
      <select value={src} onChange={(e) => setSrc(e.target.value)} style={inp}>
        {SOURCE_OPTS.map(([k, z]) => <option key={k} value={k} style={{ color: '#000' }}>{t(z)}</option>)}
      </select>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'rgba(255,255,255,0.75)', margin: '12px 0 4px', cursor: 'pointer' }}>
        <input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} /> {t('启用 AI 增强分析')}
      </label>
      <Err>{err}</Err>
      <button onClick={submit} disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }}>{busy ? t('分析中…') : t('🧭 开始世界观诊断')}</button>

      {r?.blocked && (
        <div style={{ ...card, marginTop: 16, background: 'linear-gradient(135deg, rgba(255,69,58,0.12), rgba(255,69,58,0.03))', border: '1px solid rgba(255,69,58,0.35)', borderLeft: '4px solid #ff453a' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#ff6b6b', marginBottom: 8 }}>{t('🛟 你的安全最重要')}</div>
          <p style={{ fontSize: 13, color: '#ffd0cd', lineHeight: 1.75, margin: 0 }}>
            {r.crisis?.message
              ? <D>{r.crisis.message}</D>
              : t('看起来你正经历很沉重的时刻。此刻我们先不做分析。你并不孤单——请联系你信任的人，或当地的危机援助 / 专业支持。')}
          </p>
        </div>
      )}

      {r && !r.blocked && (
        <div style={{ marginTop: 16 }}>
          {diag.profileSummary && <div style={card}><div style={{ fontSize: 12.5, fontWeight: 700, color: ACCENT, marginBottom: 6 }}>{t('📋 概要')}</div><div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}><D>{diag.profileSummary}</D></div>
            {diag.overallScore != null && <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{t('圣经一致性')}：<b style={{ color: '#c7c8ff' }}>{fmtScore(diag.overallScore)}</b> / 100</div>}</div>}
          {diag.detectedDomains?.length > 0 && <div style={card}><span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>{t('涉及领域')}：</span>{diag.detectedDomains.map((d, i) => <Chip key={i}><D>{chipText(d)}</D></Chip>)}</div>}
          {idols.length > 0 && <div style={card}><span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>{t('可能的偶像')}：</span>{idols.map((d, i) => <Chip key={i} tone="warn">{typeof d === 'string' ? idolLabel(d) : <D>{chipText(d)}</D>}</Chip>)}</div>}
          {diag.dimensionScores?.length > 0 && (
            <div style={card}><div style={{ fontSize: 12.5, fontWeight: 700, color: ACCENT, marginBottom: 8 }}>{t('📊 维度')}</div>
              {diag.dimensionScores.map((ds, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}><span style={{ color: 'rgba(255,255,255,0.8)' }}><D>{ds.domain}</D></span><span style={{ color: '#c7c8ff', fontWeight: 700 }}>{fmtScore(ds.score)}</span></div>
                  {ds.explanation && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginTop: 2 }}><D>{ds.explanation}</D></div>}
                </div>
              ))}
            </div>
          )}
          {diag.extractedBeliefs?.length > 0 && (
            <div style={card}><div style={{ fontSize: 12.5, fontWeight: 700, color: ACCENT, marginBottom: 8 }}>{t('🧩 底层信念')}</div>
              {diag.extractedBeliefs.map((b, i) => (
                <div key={i} style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}><D>{b.beliefStatement}</D></div>
                  {b.biblicalCounterTruth && <div style={{ fontSize: 12.5, color: '#ffe9b8', lineHeight: 1.6, marginTop: 4 }}>✝️ <D>{b.biblicalCounterTruth}</D></div>}
                  {b.scriptureAnchors?.length > 0 && <div style={{ marginTop: 4 }}>{b.scriptureAnchors.map((s, j) => <Chip key={j}><D>{s}</D></Chip>)}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <Disclaimer />
    </div>
  )
}

// ── 世界观画像 ───────────────────────────────────────────────────────────────
function ProfileTab({ token }) {
  const [p, setP] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetchWorldviewProfile(token).then(setP).catch((e) => setErr(e.message)).finally(() => setLoading(false))
  }, [token])

  if (!token) return <div style={{ ...card, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>{t('请先登录查看你的世界观画像。')}</div>
  if (loading) return <div style={{ ...card, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>{t('加载中…')}</div>
  if (err) return <Err>{err}</Err>
  if (!p?.has_data) return <div style={{ ...card, textAlign: 'center', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{t('还没有世界观画像。先到「世界观诊断」做一次，系统会自动生成。')}</div>

  return (
    <div>
      {p.summary && <div style={card}><div style={{ fontSize: 12.5, fontWeight: 700, color: ACCENT, marginBottom: 6 }}>{t('🧭 画像概要')}</div><div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}><D>{p.summary}</D></div></div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div style={{ ...card, margin: 0, textAlign: 'center' }}><div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>{t('圣经一致性')}</div><div style={{ fontSize: 24, fontWeight: 800, color: '#c7c8ff', marginTop: 4 }}>{fmtScore(p.biblical_alignment_score)}</div><div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}>/ 100</div></div>
        <div style={{ ...card, margin: 0, textAlign: 'center' }}><div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>{t('成熟度 / 风险')}</div><div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginTop: 8 }}>{p.maturity_level ? <D>{p.maturity_level}</D> : '—'}</div><div style={{ fontSize: 11.5, color: p.risk_level && p.risk_level !== 'green' ? '#ffb3a0' : 'rgba(255,255,255,0.5)', marginTop: 2 }}>{p.risk_level || ''}</div></div>
      </div>
      {p.dominant_idols?.length > 0 && <div style={card}><span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>{t('主导偶像')}：</span>{p.dominant_idols.map((d, i) => <Chip key={i} tone="warn">{typeof d === 'string' ? idolLabel(d) : <D>{String(d)}</D>}</Chip>)}</div>}
      {p.strongest_domains?.length > 0 && <div style={card}><span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>{t('较稳固领域')}：</span>{p.strongest_domains.map((d, i) => <Chip key={i}><D>{String(d)}</D></Chip>)}</div>}
      {p.weakest_domains?.length > 0 && <div style={card}><span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)' }}>{t('需要成长')}：</span>{p.weakest_domains.map((d, i) => <Chip key={i} tone="warn"><D>{String(d)}</D></Chip>)}</div>}
      {p.current_growth_focus && <div style={card}><div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{t('当前成长焦点')}</div><div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}><D>{p.current_growth_focus}</D></div></div>}
      {p.last_assessed_at && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>{t('最近评估')}：{String(p.last_assessed_at).slice(0, 10)}</div>}
    </div>
  )
}

// ── 历史 ─────────────────────────────────────────────────────────────────────
function HistoryTab({ token }) {
  const [items, setItems] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    if (!token) return
    fetchWorldviewAssessments(token, 20).then((d) => setItems(d.assessments || [])).catch((e) => setErr(e.message))
  }, [token])
  if (!token) return <div style={{ ...card, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>{t('请先登录查看历史。')}</div>
  if (err) return <Err>{err}</Err>
  if (items == null) return <div style={{ ...card, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>{t('加载中…')}</div>
  if (items.length === 0) return <div style={{ ...card, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>{t('暂无历史诊断记录。')}</div>
  return (
    <div>
      {items.map((it) => (
        <div key={it.id} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: ACCENT, fontWeight: 600 }}>{t(it.source_type)}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{(it.created_at || '').slice(0, 10)}</span>
          </div>
          {it.summary && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}><D>{it.summary}</D></div>}
          <div style={{ marginTop: 4 }}>
            {(it.domains || []).map((d, i) => <Chip key={i}><D>{typeof d === 'string' ? d : (d.domain || d.name)}</D></Chip>)}
            {it.overall_score != null && <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginLeft: 6 }}>{t('一致性')} {fmtScore(it.overall_score)}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

const TABS = [['narrative', '✍️ 叙事重写'], ['diagnose', '🧭 世界观诊断'], ['profile', '🧩 我的画像'], ['history', '🗂 历史']]

export default function WorldviewPage({ onBack, user }) {
  const [tab, setTab] = useState('narrative')
  const token = getToken()
  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '16px 16px calc(env(safe-area-inset-bottom) + 96px)', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        {onBack && <BackButton onClick={onBack} />}
        <div>
          <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800 }}>{t('🧭 世界观 · 生命叙事')}</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{t('Kingdom Lens OS · 旧叙事 → 福音新叙事')}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, margin: '12px 0 16px' }}>
        {TABS.map(([k, z]) => <button key={k} onClick={() => setTab(k)} style={tabBtn(tab === k)}>{t(z)}</button>)}
      </div>
      {tab === 'narrative' && <NarrativeTab token={token} user={user} />}
      {tab === 'diagnose' && <DiagnoseTab token={token} />}
      {tab === 'profile' && <ProfileTab token={token} />}
      {tab === 'history' && <HistoryTab token={token} />}
    </div>
  )
}
