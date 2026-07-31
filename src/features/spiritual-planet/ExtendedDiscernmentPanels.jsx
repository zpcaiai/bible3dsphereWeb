import { useCallback, useEffect, useState } from 'react'
import {
  createCollaborationConsent,
  createCollaborationDisclosure,
  createFormationEvent,
  createFormationReview,
  createFormationSnapshot,
  createTheologyQuery,
  createTheologySource,
  deleteExtendedDiscernmentData,
  exportExtendedDiscernmentData,
  getCollaborationAudit,
  getDiscernmentCertificationStatus,
  listCollaborationConsents,
  listFormationEvents,
  listTheologySources,
  revokeCollaborationConsent,
} from './platformApi'

const futureIso = (days = 30) => new Date(Date.now() + days * 86400000).toISOString()

function Boundary({ children }) {
  return <p className="spd-boundary">{children}</p>
}

function FormationPanel({ activeCase }) {
  const [events, setEvents] = useState([])
  const [snapshot, setSnapshot] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ context: '', trigger: '', interpretation: '', action: '', outcome: '', consent: false })
  const reload = useCallback(async () => setEvents((await listFormationEvents()).events || []), [])
  useEffect(() => { reload().catch((caught) => setError(caught.message)) }, [reload])
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const data = await createFormationEvent({
        case_id: activeCase?.case?.id || null,
        occurred_at: new Date().toISOString(),
        context: form.context,
        trigger: form.trigger,
        automatic_interpretation: form.interpretation,
        chosen_action: form.action ? [form.action] : [],
        outcome: form.outcome,
        source_type: 'self_report', evidence_quality: 'E1', data_level: 'L1',
        consent_to_tracking: form.consent,
      })
      setResult(data.chain); setForm((current) => ({ ...current, context: '', trigger: '', interpretation: '', action: '', outcome: '' })); await reload()
    } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  const buildSnapshot = async () => {
    setBusy(true); setError('')
    try { setSnapshot((await createFormationSnapshot()).snapshot) } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  const review = async (days) => {
    setBusy(true); setError('')
    try { setResult((await createFormationReview(days)).review) } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  const memoryAllowed = !activeCase || activeCase.input?.consent_scope?.allow_longitudinal_memory
  return <section className="spd-extended">
    <header><div><span>BATCH 07</span><h3>成圣成长数字孪生</h3></div><em>{events.length} 个事件</em></header>
    <Boundary>只呈现多维、可纠正的证据轨迹；不生成“属灵成熟度总分”，复发也不等于身份或得救被取消。</Boundary>
    {!memoryAllowed && <div className="spd-error" role="alert">当前案例未授权纵向记忆；请新建明确授权的案例，或不关联案例记录。</div>}
    {error && <div className="spd-error" role="alert">{error}</div>}
    <form className="spd-compact-form" onSubmit={submit}>
      <label>发生场景<input value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} required /></label>
      <label>触发事件<input value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })} required /></label>
      <label>自动解释<input value={form.interpretation} onChange={(e) => setForm({ ...form, interpretation: e.target.value })} /></label>
      <label>选择的行动<input value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} /></label>
      <label className="wide">结果<textarea value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} /></label>
      <label className="wide spd-check"><input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />我明确同意把本次记录纳入可撤回的纵向成长轨迹</label>
      <button className="spd-primary" type="submit" disabled={busy || !form.consent || !memoryAllowed}>保存形成事件</button>
    </form>
    <div className="spd-toolbar"><button type="button" onClick={buildSnapshot} disabled={busy}>生成多维快照</button>{[14, 30, 90].map((days) => <button type="button" key={days} onClick={() => review(days)} disabled={busy}>{days} 天复盘</button>)}</div>
    {snapshot && <div className="spd-result"><strong>不确定性：{snapshot.uncertainty}</strong><span>{snapshot.event_count} 个有效事件 · {Object.keys(snapshot.dimensions || {}).length} 个维度</span><ul>{snapshot.limitations?.map((item) => <li key={item}>{item}</li>)}</ul></div>}
    {result && <div className="spd-result"><strong>可审计结果已生成</strong><pre>{JSON.stringify(result, null, 2)}</pre></div>}
    <div className="spd-records">{events.slice(0, 8).map((item) => <article key={item.id}><strong>{item.event.context}</strong><span>{item.event.trigger} · {item.event.evidence_quality}</span><small>{new Date(item.event.occurred_at).toLocaleString()}</small></article>)}</div>
  </section>
}

function CollaborationPanel({ activeCase }) {
  const [consents, setConsents] = useState([])
  const [audit, setAudit] = useState([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ recipient: '', role: 'mentor_discipler', purpose: '', levels: ['L0', 'L1'] })
  const reload = useCallback(async () => {
    const [consentData, auditData] = await Promise.all([listCollaborationConsents(), getCollaborationAudit()])
    setConsents(consentData.consents || []); setAudit(auditData.audit || [])
  }, [])
  useEffect(() => { reload().catch((caught) => setError(caught.message)) }, [reload])
  const grant = async (event) => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      await createCollaborationConsent({ recipient_email: form.recipient, recipient_role: form.role, purpose: form.purpose, allowed_categories: form.levels, allowed_actions: ['view', 'meeting_prep'], expires_at: futureIso(), reshare_allowed: false })
      setNotice('已建立目的绑定授权；默认禁止转发。'); await reload()
    } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  const disclose = async (consent) => {
    if (!activeCase?.case?.id) { setError('请先打开一个辨识案例，再创建最小必要披露。'); return }
    setBusy(true); setError('')
    try {
      const data = await createCollaborationDisclosure({ consent_id: consent.id, case_id: activeCase.case.id, purpose: consent.purpose, requested_fields: ['user_goal', 'current_focus', 'priority_question', 'full_dialogue'], data_level: consent.allowed_categories_json.includes('L1') ? 'L1' : 'L0', expires_at: new Date(consent.expires_at).toISOString() })
      setNotice(`披露已建立；自动排除：${data.disclosure.redacted_fields.join('、') || '无'}。`); await reload()
    } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  const revoke = async (id) => {
    setBusy(true); setError('')
    try { await revokeCollaborationConsent(id); setNotice('授权及其有效披露已撤回。'); await reload() } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  return <section className="spd-extended">
    <header><div><span>BATCH 08</span><h3>教会与同行协作中心</h3></div><em>默认拒绝</em></header>
    <Boundary>按角色、目的、期限和 L0–L3 数据级别执行最小必要披露；AI 不作纪律处分、诊断或得救判断，L2/L3 必须进入相应人工流程。</Boundary>
    {error && <div className="spd-error" role="alert">{error}</div>}{notice && <div className="spd-success" role="status">{notice}</div>}
    <form className="spd-compact-form" onSubmit={grant}>
      <label>接收者邮箱<input type="email" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} required /></label>
      <label>角色<select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="accountability_partner">问责伙伴</option><option value="small_group_leader">小组长</option><option value="mentor_discipler">导师/门训者</option><option value="pastor_elder">牧者/长老</option><option value="safeguarding_officer">安全保护专员</option><option value="licensed_professional">持证专业人员</option><option value="governance_review_panel">治理复核小组</option></select></label>
      <label className="wide">限定目的<input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} required /></label>
      <label className="wide">允许级别<select value={form.levels.join(',')} onChange={(e) => setForm({ ...form, levels: e.target.value.split(',') })}><option value="L0">L0 · 行动与目标</option><option value="L0,L1">L0–L1 · 加入模式摘要</option><option value="L0,L1,L2">L0–L2 · 加入经批准敏感摘要</option></select></label>
      <button className="spd-primary" type="submit" disabled={busy}>建立 30 天授权</button>
    </form>
    <div className="spd-records">{consents.map((item) => <article key={item.id}><strong>{item.recipient_email} · {item.recipient_role}</strong><span>{item.purpose} · {(item.allowed_categories_json || []).join('/')}</span><small>{item.status} · 至 {new Date(item.expires_at).toLocaleDateString()}</small><div><button type="button" disabled={busy || item.status !== 'ACTIVE'} onClick={() => disclose(item)}>披露当前案例的最少字段</button><button type="button" disabled={busy || item.status !== 'ACTIVE'} onClick={() => revoke(item.id)}>撤回</button></div></article>)}</div>
    <details><summary>访问审计（{audit.length}）</summary><ul className="spd-audit">{audit.slice(0, 20).map((item) => <li key={item.id}>{item.action} · {item.outcome} · {item.reason}</li>)}</ul></details>
  </section>
}

function TheologyPanel() {
  const [sources, setSources] = useState([])
  const [selected, setSelected] = useState('')
  const [question, setQuestion] = useState('')
  const [quote, setQuote] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const reload = useCallback(async () => {
    const data = await listTheologySources(); setSources(data.sources || [])
    setSelected((current) => current || data.sources?.[0]?.source?.source_id || '')
  }, [])
  useEffect(() => { reload().catch((caught) => setError(caught.message)) }, [reload])
  const register = async () => {
    setBusy(true); setError('')
    try {
      const data = await createTheologySource({ title: '用户确认的公共领域经文来源', source_type: 'scripture', language: 'zh-CN', rights_status: 'public_domain', version: 'user-declared', edition: '用户提供版本', author: [], publisher: '', year: '', quality_tier: 'Q1', limitations: ['权利与文本定位仍需人工核验'], user_confirms_rights: false })
      setSelected(data.source.source_id); await reload()
    } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  const query = async (event) => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const citations = selected && quote ? [{ source_id: selected, locator: '用户提供定位（待细化）', quote_text: quote, extraction_method: 'manual', verification_status: 'user_verified', limitations: ['尚待独立人工复核'] }] : []
      const data = await createTheologyQuery({ question, intent: 'scripture_exegesis', source_ids: selected ? [selected] : [], citations, allowed_rights: ['public_domain', 'open_license', 'user_owned', 'quotation_only'], required_source_types: ['scripture'], scripture_refs: [], scripture_context: {}, tradition_scope: [], doctrine_tier: 'D3', consensus_level: 'open_question', used_as_salvation_test: false, proposed_application: '', depth: 'standard', human_review_level: 'R1' })
      setResult(data.query)
    } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  return <section className="spd-extended">
    <header><div><span>BATCH 09</span><h3>神学知识与证据图谱</h3></div><em>{sources.length} 个来源</em></header>
    <Boundary>系统不臆造书名、页码或引文；缺少真实来源、权利许可或释经上下文时，结论保持“证据不足”。D1/D2 争议必须人工复核。</Boundary>
    {error && <div className="spd-error" role="alert">{error}</div>}
    <div className="spd-toolbar"><button type="button" onClick={register} disabled={busy}>登记公共领域来源元数据</button></div>
    <form className="spd-compact-form" onSubmit={query}>
      <label className="wide">来源<select value={selected} onChange={(e) => setSelected(e.target.value)}><option value="">不使用来源（将返回证据不足）</option>{sources.map((item) => <option value={item.source.source_id} key={item.id}>{item.source.title} · {item.source.rights_status}</option>)}</select></label>
      <label className="wide">问题<textarea value={question} onChange={(e) => setQuestion(e.target.value)} required /></label>
      <label className="wide">短引文与定位依据（可选）<textarea value={quote} onChange={(e) => setQuote(e.target.value)} /></label>
      <button className="spd-primary" type="submit" disabled={busy}>生成可审计证据图</button>
    </form>
    {result && <div className={`spd-result ${result.answer_status}`}><strong>{result.answer_status}</strong><span>{result.review_status} · {result.evidence_graph?.nodes?.length || 0} 个节点</span><ul>{Object.entries(result.scripture_context_gates || {}).filter(([, value]) => !value).map(([key]) => <li key={key}>缺少：{key}</li>)}</ul><small>{result.rights_statement}</small></div>}
  </section>
}

function CertificationPanel() {
  const [status, setStatus] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const reload = useCallback(async () => setStatus(await getDiscernmentCertificationStatus()), [])
  useEffect(() => { reload().catch((caught) => setError(caught.message)) }, [reload])
  const exportData = async () => {
    setError('')
    try {
      const data = await exportExtendedDiscernmentData()
      const blob = new Blob([JSON.stringify(data.export, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob); const link = document.createElement('a')
      link.href = url; link.download = `spiritual-planet-export-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url)
      setNotice('你的扩展辨识数据已导出。')
    } catch (caught) { setError(caught.message) }
  }
  const erase = async () => {
    if (!window.confirm('确定删除 Batch 07–09 的形成、协作与神学数据吗？此操作不删除原辨识案例。')) return
    setError('')
    try { await deleteExtendedDiscernmentData(); setNotice('扩展辨识数据已删除。') } catch (caught) { setError(caught.message) }
  }
  const current = status?.status?.status || 'NOT_EVALUATED'
  return <section className="spd-extended">
    <header><div><span>BATCH 10</span><h3>生产认证与持续复核</h3></div><em className={current}>{current}</em></header>
    <Boundary>本地构建和测试不构成生产认证。只有 12 个认证域、58 个控制项、回滚与再认证机制及五方发布委员会签署全部满足，才可能签发证书。</Boundary>
    {error && <div className="spd-error" role="alert">{error}</div>}{notice && <div className="spd-success" role="status">{notice}</div>}
    <div className="spd-cert-grid"><div><span>认证域</span><strong>{status?.catalog?.domains ?? 12}</strong></div><div><span>控制项</span><strong>{status?.catalog?.controls ?? 58}</strong></div><div><span>当前状态</span><strong>{current}</strong></div></div>
    <p className="spd-muted">{status?.production_claim_boundary || '尚未执行认证评估；默认阻断生产发布。'}</p>
    <div className="spd-toolbar"><button type="button" onClick={reload}>刷新状态</button><button type="button" onClick={exportData}>导出我的数据</button><button type="button" className="danger" onClick={erase}>删除扩展数据</button></div>
  </section>
}

export default function ExtendedDiscernmentPanels({ mode, activeCase }) {
  if (mode === 'formation') return <FormationPanel activeCase={activeCase} />
  if (mode === 'collaboration') return <CollaborationPanel activeCase={activeCase} />
  if (mode === 'theology') return <TheologyPanel />
  if (mode === 'certification') return <CertificationPanel />
  return null
}
