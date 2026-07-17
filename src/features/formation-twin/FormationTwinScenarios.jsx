import { useCallback, useEffect, useMemo, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import {
  convertScenarioToProposal, createComplianceRequest, createFormationScenario,
  deleteFormationScenario, getComplianceDataMap, getGovernedSystemStatus,
  listApprovedThirdParties, listFormationScenarios, markFormationScenarioInaccurate,
} from './productionGovernanceApi'
import { NON_PREDICTION_NOTICE } from './scenarioContract'

const ROUTES = [
  '/formation-twin/scenarios', '/formation-twin/scenarios/new', '/formation-twin/scenarios/[id]',
  '/formation-twin/scenarios/history', '/formation-twin/scenarios/settings',
]
const TABS = [
  ['current', '当前情景'], ['new', '新建比较'], ['history', '历史'], ['transparency', '数据与透明'], ['settings', '设置'],
]

function Empty({ children }) { return <div className="ft-scenario-empty"><span aria-hidden="true">◇</span><p>{children}</p></div> }

function BranchCard({ branch, onConvert, busy }) {
  return (
    <article className="ft-scenario-branch">
      <span>{i18nT(branch.label)}</span>
      <p>{i18nT(branch.description)}</p>
      <h5>{i18nT('可能效果')}</h5>
      <ul>{(branch.plausible_near_term_effects || []).map((item) => <li key={`${item.effect_type}:${item.description}`}>{i18nT(item.description)}</li>)}</ul>
      <h5>{i18nT('代价与限制')}</h5>
      <ul>{(branch.possible_tradeoffs || []).map((item) => <li key={item}>{i18nT(item)}</li>)}</ul>
      <h5>{i18nT('值得观察')}</h5>
      <ul>{(branch.observation_plan || []).map((item) => <li key={item}>{i18nT(item)}</li>)}</ul>
      <button type="button" disabled={busy} onClick={() => onConvert(branch.branch_id)}>{i18nT('转成待确认行动提案')}</button>
      <small>{i18nT('不会直接执行；仍需再次确认和 Safety Gate。')}</small>
    </article>
  )
}

export default function FormationTwinScenarios({ user, onSafety }) {
  const [tab, setTab] = useState('current')
  const [scenarios, setScenarios] = useState([])
  const [status, setStatus] = useState(null)
  const [dataMap, setDataMap] = useState(null)
  const [thirdParties, setThirdParties] = useState([])
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [draft, setDraft] = useState({
    title: '', question: '', scenario_type: 'CONTINUE_CURRENT_PATTERN',
    horizon: 'NEXT_7_DAYS', assumption: '', confirmed: false,
  })

  const load = useCallback(async () => {
    if (!user) return
    setError('')
    try {
      const [scenarioData, systemData] = await Promise.all([listFormationScenarios(), getGovernedSystemStatus()])
      setScenarios(scenarioData.scenarios || []); setStatus(systemData)
    } catch (caught) { setError(caught.message) }
  }, [user])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (tab !== 'transparency' || !user) return
    Promise.all([getComplianceDataMap(), listApprovedThirdParties()])
      .then(([map, providers]) => { setDataMap(map); setThirdParties(providers.third_parties || []) })
      .catch((caught) => setError(caught.message))
  }, [tab, user])

  const current = useMemo(() => scenarios.find((item) => item.user_review_status !== 'INACCURATE') || null, [scenarios])

  const create = async (event) => {
    event.preventDefault()
    if (!draft.confirmed) return
    setBusy('create'); setError(''); setNotice('')
    try {
      const now = new Date().toISOString()
      await createFormationScenario({
        title: draft.title, question: draft.question, scenario_type: draft.scenario_type,
        baseline_snapshot_ids: [], baseline_generated_at: now,
        assumptions: [{
          assumption_type: 'USER_DEFINED_BASELINE', description: draft.assumption,
          source_kind: 'USER_DEFINED', source_reference_ids: [], user_confirmed: true,
          uncertainty: '外部环境、他人的选择和未记录因素目前无法确定。',
        }],
        fixed_constraints: [], excluded_factors: ['神的隐藏旨意', '他人的内心和未来决定'],
        horizon: draft.horizon,
        evidence: [{
          evidence_level: 'USER_CONFIRMED_EFFECT', source_reference_id: `user-defined:${Date.now()}`,
          summary: draft.assumption, supports_branch: true, user_confirmed: true,
        }],
        safety_level: 'NONE', user_review_status: 'DRAFT',
      })
      setDraft((value) => ({ ...value, title: '', question: '', assumption: '', confirmed: false }))
      setNotice('已生成三个有限分支；它们没有执行任何行动。'); setTab('current'); await load()
    } catch (caught) { setError(caught.message) } finally { setBusy('') }
  }

  const convert = async (scenarioId, branchId) => {
    if (!window.confirm(i18nT('只把这个分支转为待确认提案？它仍不会自动执行。'))) return
    setBusy(`convert:${branchId}`); setError('')
    try { await convertScenarioToProposal(scenarioId, branchId); setNotice('已创建待确认提案；请在最小行动中心再次检查。') }
    catch (caught) { setError(caught.message) } finally { setBusy('') }
  }

  const markInaccurate = async (id) => {
    setBusy(`inaccurate:${id}`)
    try { await markFormationScenarioInaccurate(id); setNotice('已标记为无意义；不会产生负面评分。'); await load() }
    catch (caught) { setError(caught.message) } finally { setBusy('') }
  }

  const remove = async (id) => {
    if (!window.confirm(i18nT('删除这个有限情景？相关访问会立即失效。'))) return
    setBusy(`delete:${id}`)
    try { await deleteFormationScenario(id); setNotice('有限情景已删除并失效。'); await load() }
    catch (caught) { setError(caught.message) } finally { setBusy('') }
  }

  const restrict = async (type) => {
    setBusy(type)
    try { const result = await createComplianceRequest(type, { formation_twin: true }); setNotice(`请求已创建：${result.status}`) }
    catch (caught) { setError(caught.message) } finally { setBusy('') }
  }

  return (
    <section className="ft-scenarios" aria-labelledby="ft-scenarios-title">
      <div className="ft-scenario-routes" aria-hidden="true">{ROUTES.map((route) => <span key={route} data-scenario-route={route} />)}</div>
      <header className="ft-scenarios-head">
        <div><span>FINITE SCENARIO · RULE ONLY</span><h3 id="ft-scenarios-title">{i18nT('有限情景比较')}</h3><p>{i18nT('比较最多三个近期分支；系统不预测命运，也不替你作决定。')}</p></div>
        <div className={`ft-scenario-status ${status?.status === 'DEGRADED' ? 'degraded' : ''}`}><strong>{status?.status || 'AVAILABLE'}</strong><small>{i18nT('关系协作仍保持关闭，直到 Batch 08 完成')}</small></div>
      </header>
      <div className="ft-scenario-notice">{i18nT(NON_PREDICTION_NOTICE)}</div>
      <nav className="ft-scenario-tabs" role="tablist" aria-label={i18nT('有限情景导航')}>
        {TABS.map(([key, label]) => <button type="button" role="tab" aria-selected={tab === key} key={key} onClick={() => setTab(key)}>{i18nT(label)}</button>)}
      </nav>
      {error && <div className="ft-scenario-error" role="alert">{error}{error.includes('KILL_SWITCH') && <button type="button" onClick={onSafety}>{i18nT('打开安全帮助')}</button>}</div>}
      {notice && <div className="ft-scenario-success" role="status">{i18nT(notice)}</div>}

      {tab === 'current' && (current ? <div className="ft-scenario-view">
        <div className="ft-scenario-summary"><div><span>{current.horizon}</span><h4>{current.title}</h4></div><div><button type="button" onClick={() => markInaccurate(current.id)}>{i18nT('这次比较没有意义')}</button><button type="button" className="danger" onClick={() => remove(current.id)}>{i18nT('删除')}</button></div></div>
        <div className="ft-scenario-assumptions"><h5>{i18nT('本次使用的可见假设')}</h5>{current.assumptions.map((item) => <p key={`${item.assumption_type}:${item.description}`}>{item.description}<small>{item.source_kind} · {i18nT('由你确认')}</small></p>)}</div>
        {current.major_decision_limited && <div className="ft-scenario-boundary">{i18nT('重大人生问题只比较近期负担、支持与现实条件；请结合可信真人和相关专业意见。')}</div>}
        <div className="ft-scenario-branches">{current.branches.map((branch) => <BranchCard key={branch.branch_id} branch={branch} busy={busy === `convert:${branch.branch_id}`} onConvert={(branchId) => convert(current.id, branchId)} />)}</div>
        <div className="ft-scenario-evidence"><h5>{i18nT('证据与反证据')}</h5><p>{i18nT('支持')}：{current.evidence_matrix.supporting_evidence.length} · {i18nT('反证据')}：{current.evidence_matrix.counterevidence.length}</p><p>{(current.evidence_matrix.limitations || []).join(' · ')}</p></div>
      </div> : <Empty>{i18nT('还没有有限情景。新建时先写清楚一个假设；没有确认资料时系统不会生成。')}</Empty>)}

      {tab === 'new' && <form className="ft-scenario-form" onSubmit={create}>
        <label>{i18nT('想观察的问题')}<input required maxLength={320} value={draft.question} onChange={(event) => setDraft((value) => ({ ...value, question: event.target.value }))} placeholder={i18nT('例如：如果未来七天继续当前节奏，值得观察什么？')} /></label>
        <label>{i18nT('情景名称')}<input required maxLength={160} value={draft.title} onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))} /></label>
        <label>{i18nT('可改变因素')}<select value={draft.scenario_type} onChange={(event) => setDraft((value) => ({ ...value, scenario_type: event.target.value }))}><option value="CONTINUE_CURRENT_PATTERN">{i18nT('维持当前方式')}</option><option value="ADD_PROTECTIVE_FACTOR">{i18nT('增加一个保护因素')}</option><option value="INCREASE_REST">{i18nT('增加休息')}</option><option value="ADD_HUMAN_SUPPORT">{i18nT('增加真人支持')}</option><option value="TRY_ALTERNATIVE_RESPONSE">{i18nT('尝试确认的替代回应')}</option></select></label>
        <label>{i18nT('时间范围')}<select value={draft.horizon} onChange={(event) => setDraft((value) => ({ ...value, horizon: event.target.value }))}><option value="NEXT_24_HOURS">{i18nT('未来 24 小时')}</option><option value="NEXT_7_DAYS">{i18nT('未来 7 天')}</option><option value="NEXT_30_DAYS">{i18nT('未来 30 天')}</option></select></label>
        <label className="wide">{i18nT('由你确认的基线或假设')}<textarea required maxLength={320} value={draft.assumption} onChange={(event) => setDraft((value) => ({ ...value, assumption: event.target.value }))} placeholder={i18nT('只写你愿意用于这次比较的有限事实，不要粘贴完整日记。')} /></label>
        <label className="ft-scenario-confirm"><input type="checkbox" checked={draft.confirmed} onChange={(event) => setDraft((value) => ({ ...value, confirmed: event.target.checked }))} />{i18nT('我确认这是自己的假设；我理解结果不是预测，也不会自动执行行动。')}</label>
        <button className="primary" type="submit" disabled={!draft.confirmed || !draft.title || !draft.question || !draft.assumption || busy === 'create'}>{i18nT('生成最多三个分支')}</button>
      </form>}

      {tab === 'history' && <div className="ft-scenario-history">{scenarios.length ? scenarios.map((item) => <article key={item.id}><span>{new Date(item.created_at).toLocaleDateString()} · {item.user_review_status}</span><h4>{item.title}</h4><p>{item.non_prediction_notice}</p></article>) : <Empty>{i18nT('还没有历史情景。')}</Empty>}</div>}

      {tab === 'transparency' && <div className="ft-scenario-transparency">
        <article><h4>{i18nT('系统怎样处理')}</h4>{(dataMap?.notices || []).map((item) => <p key={item}>{i18nT(item)}</p>)}</article>
        <article><h4>{i18nT('数据类别')}</h4>{(dataMap?.data_categories || []).map((item) => <p key={item.category}><strong>{i18nT(item.category)}</strong><span>{i18nT(item.purpose)} · {i18nT(item.retention)}</span></p>)}</article>
        <article><h4>{i18nT('已批准第三方')}</h4>{thirdParties.length ? thirdParties.map((item) => <p key={item.provider_key}><strong>{item.provider_key}</strong><span>{item.service_type} · {item.training_usage_policy}</span></p>) : <p>{i18nT('当前治理注册表没有已批准并公开的第三方处理者。')}</p>}</article>
      </div>}

      {tab === 'settings' && <div className="ft-scenario-settings"><p>{i18nT('你不需要退出整个产品，仍可单独限制模型处理、Profiling 或关系分享。')}</p><button type="button" disabled={!!busy} onClick={() => restrict('OBJECT_TO_MODEL_PROCESSING')}>{i18nT('反对模型 Profiling')}</button><button type="button" disabled={!!busy} onClick={() => restrict('RESTRICT_PROCESSING')}>{i18nT('限制派生处理')}</button><button type="button" disabled={!!busy} onClick={() => restrict('EXPORT_DATA')}>{i18nT('请求数据导出')}</button><button type="button" className="danger" disabled={!!busy} onClick={() => restrict('DELETE_DATA')}>{i18nT('请求删除数据')}</button><small>{i18nT('在线访问停止和备份最终清除是不同阶段；状态会诚实显示。')}</small></div>}
    </section>
  )
}
