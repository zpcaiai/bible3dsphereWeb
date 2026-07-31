import { useCallback, useEffect, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import {
  buildDiscernmentGospelPath,
  createDiscernmentCase,
  deleteDiscernmentCase,
  getDiscernmentCase,
  listDiscernmentCases,
  pauseDiscernmentDialogue,
  sendDiscernmentDialogueTurn,
  startDiscernmentDialogue,
  submitDiscernmentReview,
} from './platformApi'
import ExtendedDiscernmentPanels from './ExtendedDiscernmentPanels'
import './discernmentWorkspace.css'

const INITIAL = {
  title: '', subject_type: 'self_reflection', raw_input: '', user_goal: '', faith_context: 'unknown',
  sensitivity: 'normal', allow_spiritual_analysis: true, allow_gospel_bridge: false,
  allow_public_content_analysis: false, allow_longitudinal_memory: false,
  source_locator_text: '', source_evidence_level: 'P1',
}

const SUBJECTS = [
  ['self_reflection', '自我省察'], ['idea', '思潮/观点'], ['person', '公众人物'],
  ['event', '热点事件'], ['product', '商品/课程'], ['media', '内容/媒体'], ['mixed', '复合案例'],
]

function EvidenceBadge({ level = 'E0' }) {
  return <span className="spd-evidence">{level}</span>
}

function StatusNotice({ report }) {
  if (!report) return null
  const status = report.review_status
  return (
    <section className={`spd-status ${status}`} role={status === 'blocked' ? 'alert' : 'status'}>
      <strong>{status === 'ready' ? i18nT('可作为辨识草案阅读') : status === 'human_review_required' ? i18nT('需要人工复核') : i18nT('普通分析已停止')}</strong>
      <p>{report.summary}</p>
      <small>{i18nT('这是可撤销的辨识辅助，不读取人心、不替神发言，也不判断任何人的得救状态。')}</small>
    </section>
  )
}

function ReportPanel({ active, report, onStartDialogue, onBuildGospel, onRequestReview, onDelete, busy }) {
  const [section, setSection] = useState('worldview')
  if (!report) return null
  const matches = report.domain_pack_matches || []
  const hypotheses = report.pride_hypotheses || []
  const questions = report.socratic_questions || []
  const virality = report.virality_analysis
  return (
    <div className="spd-report">
      <StatusNotice report={report} />
      {report.safety?.actions?.length > 0 && report.safety.status !== 'ready' && (
        <section className="spd-safety"><h3>{i18nT('安全优先')}</h3>{report.safety.actions.map((item) => <p key={item}>{item}</p>)}</section>
      )}
      <div className="spd-tabs" role="tablist" aria-label={i18nT('辨识报告分区')}>
        {[['worldview', '世界观'], ['pride', '自高假设'], ['virality', '传播'], ['questions', '追问'], ['trace', '审计']].map(([key, label]) => (
          <button type="button" role="tab" aria-selected={section === key} key={key} onClick={() => setSection(key)}>{i18nT(label)}</button>
        ))}
      </div>
      {section === 'worldview' && <section className="spd-section">
        <h3>{i18nT('复合世界观候选')}</h3>
        {!matches.length ? <p className="spd-muted">{i18nT('证据不足；系统只保留澄清问题。')}</p> : matches.map((item) => (
          <article className="spd-pack" key={item.pack_id}>
            <div><strong>{item.name}</strong><span>{item.cluster} · v{item.version}</span></div>
            <div className="spd-pack-score"><EvidenceBadge level={item.classification === 'clarify' ? '澄清' : item.classification} /><span>{Math.round(item.score * 100)}%</span></div>
            <p>{item.fair_definition}</p>
            <small>{i18nT('受造之善')}：{item.common_grace.join(' · ')}</small>
          </article>
        ))}
      </section>}
      {section === 'pride' && <section className="spd-section">
        <h3>{i18nT('自高、自义与隐性荣耀假设')}</h3>
        {!hypotheses.length ? <p className="spd-muted">{i18nT('没有生成深层假设，或你尚未授权属灵分析。')}</p> : hypotheses.map((item) => (
          <article className="spd-hypothesis" key={item.hypothesis_id}>
            <header><strong>{item.name}</strong><EvidenceBadge level={item.evidence_level} /></header>
            <p>{item.interpretation_hypothesis}</p>
            <dl><div><dt>{i18nT('观察')}</dt><dd>{item.observation}</dd></div><div><dt>{i18nT('替代解释')}</dt><dd>{item.alternative_explanations.slice(0, 2).join('；')}</dd></div><div><dt>{i18nT('反证')}</dt><dd>{item.counter_evidence_needed.slice(0, 2).join('；')}</dd></div></dl>
            <small>{i18nT('单次材料最高 H1；不可写成稳定人格结论。')}</small>
          </article>
        ))}
      </section>}
      {section === 'virality' && <section className="spd-section">
        <h3>{i18nT('人物—内容—平台—受众—传播分析')}</h3>
        {!virality ? <p className="spd-muted">{i18nT('本案例不属于人物、热点、商品或媒体分析。')}</p> : <>
          <div className="spd-metric-grid"><div><span>{i18nT('争议状态')}</span><strong>{virality.controversy.state}</strong></div><div><span>{i18nT('传播节点')}</span><strong>{virality.propagation_graph.nodes.length}</strong></div><div><span>{i18nT('未知因果残差')}</span><strong>{virality.virality_decomposition.unknown_residual ? 'YES' : 'NO'}</strong></div></div>
          <p>{virality.virality_decomposition.precision_warning}</p>
          <ul>{virality.counterfactuals.map((item) => <li key={item}>{item}</li>)}</ul>
          <small>{i18nT('批评传播不计为支持；隐藏动机、内部算法和未披露收入保持未知。')}</small>
        </>}
      </section>}
      {section === 'questions' && <section className="spd-section">
        <h3>{i18nT('一次只问一个问题')}</h3>
        <ol className="spd-questions">{questions.map((item) => <li key={item.question_id}><span>{item.stage} · {item.difficulty}</span><p>{item.text}</p>{item.requires_consent && <small>{i18nT('需要进入福音层的明确同意')}</small>}</li>)}</ol>
        {!!questions.length && <button className="spd-primary" type="button" disabled={busy} onClick={onStartDialogue}>{i18nT('开始逐问对话')}</button>}
      </section>}
      {section === 'trace' && <section className="spd-section">
        <h3>{i18nT('可审计状态链')}</h3>
        <div className="spd-trace">{report.trace.map((item, index) => <span key={`${item.state}-${index}`}>{item.state}<small>B{item.batch}</small></span>)}</div>
        <h4>{i18nT('质量门')}</h4><ul>{Object.entries(report.quality_gates || {}).map(([key, value]) => <li key={key}>{value ? '✓' : '○'} {key}</li>)}</ul>
      </section>}
      <div className="spd-report-actions">
        {active?.input?.consent_scope?.allow_gospel_bridge && <button type="button" disabled={busy} onClick={onBuildGospel}>{i18nT('生成完整福音路径')}</button>}
        <button type="button" disabled={busy} onClick={onRequestReview}>{i18nT('请求人工复核')}</button>
        <button type="button" className="danger" disabled={busy} onClick={onDelete}>{i18nT('撤回并删除')}</button>
      </div>
    </div>
  )
}

function DialoguePanel({ session, answer, setAnswer, busy, onSend, onConsent, onPause }) {
  if (!session) return null
  const question = session.current_question
  return (
    <section className="spd-dialogue">
      <header><div><span>{session.stage} · {session.difficulty}</span><h3>{i18nT('苏格拉底式属灵对话')}</h3></div><button type="button" onClick={onPause} disabled={busy}>{i18nT('暂停')}</button></header>
      {session.status === 'COMPLETED' ? <p>{i18nT('本轮已经完成；假设仍可被后续证据削弱或否证。')}</p> : session.status === 'PAUSED_BY_USER' ? <p>{i18nT('已按你的选择暂停。')}</p> : question ? <>
        <blockquote>{question.text}</blockquote>
        {session.stage === 'GOSPEL_INVITATION' ? <div className="spd-consent-actions"><button type="button" onClick={() => onConsent('accepted')}>{i18nT('愿意继续')}</button><button type="button" onClick={() => onConsent('later')}>{i18nT('以后再说')}</button><button type="button" onClick={() => onConsent('declined')}>{i18nT('不进入福音层')}</button></div> : <form onSubmit={onSend}><textarea aria-label={i18nT('回答当前问题')} value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={4000} /><div><small>{i18nT('可回答“不知道、不同意、跳过或暂停”。')}</small><button className="spd-primary" type="submit" disabled={busy || !answer.trim()}>{i18nT('提交并查看下一问')}</button></div></form>}
      </> : <p>{i18nT('对话当前没有待答问题。')}</p>}
    </section>
  )
}

function GospelPathPanel({ path }) {
  if (!path) return null
  if (!path.segments?.length) return <section className="spd-gospel"><h3>{i18nT('福音路径')}</h3><p>{path.invitation || path.reason}</p></section>
  return <section className="spd-gospel"><span>LAW · GOSPEL · UNION WITH CHRIST</span><h3>{i18nT('律法—福音—联合基督路径')}</h3><div>{path.segments.map((item, index) => <article key={item.segment_id}><b>{index + 1}</b><div><small>{item.tier} · v{item.pack_version}</small><h4>{item.name}</h4><p>{item.personalized_explanation}</p></div></article>)}</div><p className="spd-basis">{i18nT('所有操练都是蒙恩后的果子，不是赚取接纳或称义的条件。')}</p></section>
}

export default function DiscernmentWorkspace() {
  const [form, setForm] = useState(INITIAL)
  const [cases, setCases] = useState([])
  const [active, setActive] = useState(null)
  const [report, setReport] = useState(null)
  const [session, setSession] = useState(null)
  const [answer, setAnswer] = useState('')
  const [gospelPath, setGospelPath] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('new')

  const loadCases = useCallback(async () => {
    try { setCases((await listDiscernmentCases()).cases || []) } catch (caught) { setError(caught.message) }
  }, [])
  useEffect(() => { loadCases() }, [loadCases])

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const sourceItems = form.source_locator_text.split('\n').map((item) => item.trim()).filter(Boolean).map((locator, index) => ({
        source_type: 'public_reference', locator, quote: null, evidence_level: form.source_evidence_level,
        independence_group: `user-source-${index + 1}`, limitations: ['由用户提供定位，尚未由系统独立核验'],
      }))
      const payload = {
        title: form.title, subject_type: form.subject_type, raw_input: form.raw_input, user_goal: form.user_goal,
        faith_context: form.faith_context, sensitivity: form.sensitivity,
        source_metadata: { supplied_by_user: sourceItems.length > 0 }, source_items: sourceItems,
        consent_scope: {
          allow_spiritual_analysis: form.allow_spiritual_analysis,
          allow_gospel_bridge: form.allow_gospel_bridge,
          allow_public_content_analysis: form.allow_public_content_analysis,
          allow_longitudinal_memory: form.allow_longitudinal_memory,
        },
      }
      const data = await createDiscernmentCase(payload)
      setActive({ case: data.case, input: payload }); setReport(data.report); setSession(null); setGospelPath(null); setMode('report'); await loadCases()
    } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  const openCase = async (id) => {
    setBusy(true); setError('')
    try { const data = await getDiscernmentCase(id); setActive(data); setReport(data.report); setGospelPath(data.gospel_path); setSession(null); setMode('report') } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  const startDialogue = async () => {
    setBusy(true); setError('')
    try { setSession((await startDiscernmentDialogue(active.case.id, { preferred_depth: 'standard' })).session) } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  const sendTurn = async (event, consent) => {
    event?.preventDefault?.(); const text = consent ? (consent === 'accepted' ? '我愿意继续。' : consent === 'declined' ? '我不进入福音层。' : '以后再说。') : answer
    setBusy(true); setError('')
    try { setSession((await sendDiscernmentDialogueTurn(session.session_id, { answer: text, ...(consent ? { gospel_consent: consent } : {}) })).session); setAnswer('') } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  const pause = async () => {
    setBusy(true); try { setSession((await pauseDiscernmentDialogue(session.session_id)).session) } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  const buildGospel = async () => {
    setBusy(true); setError('')
    try { setGospelPath((await buildDiscernmentGospelPath(active.case.id, { preferred_depth: 'standard', church_context: '' })).gospel_path) } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  const requestReview = async () => {
    setBusy(true); setError('')
    try { await submitDiscernmentReview(active.case.id, { action: 'REQUEST_REVIEW', note: '用户请求人工复核', correction: {} }); setReport((current) => ({ ...current, review_status: 'human_review_required' })); await loadCases() } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  const remove = async () => {
    if (!window.confirm(i18nT('确定撤回并删除这份辨识案例吗？'))) return
    setBusy(true); setError('')
    try { await deleteDiscernmentCase(active.case.id); setActive(null); setReport(null); setSession(null); setGospelPath(null); setMode('history'); await loadCases() } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }

  return <div className="spd-workspace">
    <section className="spd-intro"><span>DISCERNMENT · BATCH 01—10</span><h2>{i18nT('洞鉴别')}</h2><p>{i18nT('从事实与世界观辨识，延伸到纵向形成、目的绑定的教会协作、可追溯神学证据与生产认证；每层都保留同意、纠正、撤回和人工复核边界。')}</p><div><button type="button" aria-pressed={mode === 'new'} onClick={() => setMode('new')}>{i18nT('新建辨识')}</button><button type="button" aria-pressed={mode === 'history'} onClick={() => setMode('history')}>{i18nT('历史记录')} ({cases.length})</button>{report && <button type="button" aria-pressed={mode === 'report'} onClick={() => setMode('report')}>{i18nT('当前报告')}</button>}<button type="button" aria-pressed={mode === 'formation'} onClick={() => setMode('formation')}>{i18nT('成长轨迹')}</button><button type="button" aria-pressed={mode === 'collaboration'} onClick={() => setMode('collaboration')}>{i18nT('协作授权')}</button><button type="button" aria-pressed={mode === 'theology'} onClick={() => setMode('theology')}>{i18nT('神学证据')}</button><button type="button" aria-pressed={mode === 'certification'} onClick={() => setMode('certification')}>{i18nT('认证状态')}</button></div></section>
    {error && <div className="spd-error" role="alert">{error}</div>}
    {mode === 'new' && <form className="spd-form" onSubmit={submit}>
      <div className="spd-form-grid"><label>{i18nT('案例标题')}<input value={form.title} onChange={(event) => update('title', event.target.value)} maxLength={160} required /></label><label>{i18nT('分析对象')}<select value={form.subject_type} onChange={(event) => update('subject_type', event.target.value)}>{SUBJECTS.map(([value, label]) => <option value={value} key={value}>{i18nT(label)}</option>)}</select></label><label>{i18nT('信仰背景')}<select value={form.faith_context} onChange={(event) => update('faith_context', event.target.value)}><option value="unknown">{i18nT('未知/不指定')}</option><option value="christian">{i18nT('基督徒')}</option><option value="seeker">{i18nT('慕道/探索')}</option><option value="other">{i18nT('其他')}</option></select></label><label>{i18nT('敏感级别')}<select value={form.sensitivity} onChange={(event) => update('sensitivity', event.target.value)}><option value="normal">{i18nT('一般')}</option><option value="pastoral">{i18nT('牧养敏感')}</option><option value="mental_health">{i18nT('心理健康')}</option><option value="abuse">{i18nT('虐待/创伤')}</option><option value="crisis">{i18nT('危机')}</option><option value="reputation_sensitive">{i18nT('声誉敏感')}</option></select></label></div>
      <label>{i18nT('要分析的材料')}<textarea value={form.raw_input} onChange={(event) => update('raw_input', event.target.value)} maxLength={12000} placeholder={i18nT('粘贴观点、内容摘要、公开材料或你自己的省察。请不要提交他人的私人资料。')} required /></label>
      <div className="spd-source-grid"><label>{i18nT('公开来源定位（可选，每行一个）')}<textarea className="spd-source-input" value={form.source_locator_text} onChange={(event) => update('source_locator_text', event.target.value)} maxLength={6000} placeholder={i18nT('URL、视频标题、公开帖子或资料定位；请勿填写私人资料。')} /></label><label>{i18nT('来源证据等级')}<select value={form.source_evidence_level} onChange={(event) => update('source_evidence_level', event.target.value)}><option value="P0">P0 · {i18nT('仅线索')}</option><option value="P1">P1 · {i18nT('可定位公开材料')}</option><option value="P2">P2 · {i18nT('多项公开材料')}</option><option value="P3">P3 · {i18nT('独立来源交叉印证')}</option><option value="P4">P4 · {i18nT('强公开证据')}</option></select><small>{i18nT('等级是用户提交时的暂定标签；报告仍会保留限制与人工复核要求。')}</small></label></div>
      <label>{i18nT('你希望得到什么帮助')}<input value={form.user_goal} onChange={(event) => update('user_goal', event.target.value)} maxLength={1000} required /></label>
      <fieldset><legend>{i18nT('逐项授权')}</legend><label><input type="checkbox" checked={form.allow_spiritual_analysis} onChange={(event) => update('allow_spiritual_analysis', event.target.checked)} />{i18nT('允许世界观、欲望与自高假设分析')}</label><label><input type="checkbox" checked={form.allow_gospel_bridge} onChange={(event) => update('allow_gospel_bridge', event.target.checked)} />{i18nT('允许在报告和对话中进入福音层')}</label><label><input type="checkbox" checked={form.allow_public_content_analysis} onChange={(event) => update('allow_public_content_analysis', event.target.checked)} />{i18nT('允许分析公众人物或公开内容')}</label><label><input type="checkbox" checked={form.allow_longitudinal_memory} onChange={(event) => update('allow_longitudinal_memory', event.target.checked)} />{i18nT('允许纵向记忆（默认关闭，可撤回）')}</label></fieldset>
      <p className="spd-boundary">{i18nT('系统不会读取人心、诊断人格、宣告附鬼、替神发言或判定得救。危机、虐待、宗教强迫与声誉风险会停止或转人工流程。')}</p>
      <button className="spd-primary" type="submit" disabled={busy}>{busy ? i18nT('正在生成可审计报告…') : i18nT('开始辨识')}</button>
    </form>}
    {mode === 'history' && <section className="spd-history"><h3>{i18nT('我的辨识记录')}</h3>{!cases.length ? <p>{i18nT('还没有记录。')}</p> : cases.map((item) => <button type="button" key={item.id} onClick={() => openCase(item.id)}><div><strong>{item.title}</strong><span>{item.subject_type} · {new Date(item.created_at).toLocaleString()}</span></div><em className={item.review_status}>{item.review_status}</em></button>)}</section>}
    {mode === 'report' && <><ReportPanel active={active} report={report} busy={busy} onStartDialogue={startDialogue} onBuildGospel={buildGospel} onRequestReview={requestReview} onDelete={remove} /><DialoguePanel session={session} answer={answer} setAnswer={setAnswer} busy={busy} onSend={sendTurn} onConsent={(choice) => sendTurn(null, choice)} onPause={pause} /><GospelPathPanel path={gospelPath} /></>}
    <ExtendedDiscernmentPanels mode={mode} activeCase={active} />
  </div>
}
