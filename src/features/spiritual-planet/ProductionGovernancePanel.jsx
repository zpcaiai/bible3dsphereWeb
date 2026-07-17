import { useCallback, useEffect, useMemo, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import {
  getGovernanceDataQuality, getGovernanceRedTeam, getGovernanceSlo,
  listEvaluationRuns, listGovernanceIncidents, listGovernanceKillSwitches,
  listGovernanceReleases, listGovernedComponents, setGovernanceKillSwitch,
} from '../formation-twin/productionGovernanceApi'
import './productionGovernance.css'

const TABS = [
  ['overview', '门禁总览'], ['releases', '发布'], ['evaluations', '评测'],
  ['components', '组件版本'], ['switches', '紧急停用'], ['incidents', '事故'], ['slo', 'SLO'],
]

function Empty({ children }) { return <div className="pg-empty">{children}</div> }

export default function ProductionGovernancePanel() {
  const [tab, setTab] = useState('overview')
  const [releases, setReleases] = useState([])
  const [evaluations, setEvaluations] = useState([])
  const [components, setComponents] = useState([])
  const [switches, setSwitches] = useState([])
  const [incidents, setIncidents] = useState([])
  const [quality, setQuality] = useState(null)
  const [redTeam, setRedTeam] = useState(null)
  const [slo, setSlo] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [releaseData, evaluationData, componentData, switchData, incidentData, qualityData, redTeamData, sloData] = await Promise.all([
        listGovernanceReleases(), listEvaluationRuns(), listGovernedComponents(), listGovernanceKillSwitches(),
        listGovernanceIncidents(), getGovernanceDataQuality(), getGovernanceRedTeam(), getGovernanceSlo(),
      ])
      setReleases(releaseData.releases || []); setEvaluations(evaluationData.runs || [])
      setComponents(componentData.components || []); setSwitches(switchData.kill_switches || [])
      setIncidents(incidentData.incidents || []); setQuality(qualityData); setRedTeam(redTeamData); setSlo(sloData)
    } catch (caught) { setError(caught.message) }
  }, [])

  useEffect(() => { load() }, [load])
  const activeComponents = useMemo(() => components.filter((item) => item.activated_at && !item.deprecated_at), [components])
  const blockers = useMemo(() => releases.filter((item) => item.approval_status === 'BLOCKED'), [releases])

  const toggle = async (item) => {
    const reason = window.prompt(i18nT('请输入可审计的原因代码（不会保存用户正文）'), item.active ? 'INCIDENT_RESOLVED' : 'SAFETY_CONTAINMENT')
    if (!reason) return
    setBusy(item.id); setError('')
    try { await setGovernanceKillSwitch(item.id, !item.active, reason); await load() }
    catch (caught) { setError(caught.message) } finally { setBusy('') }
  }

  return (
    <section className="pg-panel" aria-labelledby="pg-title">
      <header><div><span>PRODUCTION GOVERNANCE · BATCH 10</span><h3 id="pg-title">{i18nT('生产治理与发布门禁')}</h3><p>{i18nT('这里只显示技术证据、版本和脱敏状态；不显示用户生命画像或正文。')}</p></div><button type="button" onClick={load}>{i18nT('刷新')}</button></header>
      <div className="pg-hard-boundary">{i18nT('Batch 08 关系协作尚未落地，因此关系分享保持 fail-closed，不能进入 General Availability。')}</div>
      <nav role="tablist" aria-label={i18nT('生产治理导航')}>{TABS.map(([key, label]) => <button type="button" role="tab" key={key} aria-selected={tab === key} onClick={() => setTab(key)}>{i18nT(label)}</button>)}</nav>
      {error && <div className="pg-error" role="alert">{error}</div>}

      {tab === 'overview' && <div className="pg-grid pg-overview">
        <article><span>{i18nT('发布阻断')}</span><strong className={blockers.length ? 'danger' : ''}>{blockers.length}</strong><small>{i18nT('安全失败不能由可用性或互动率抵消')}</small></article>
        <article><span>{i18nT('高严重度质量问题')}</span><strong className={quality?.publication_blockers ? 'danger' : ''}>{quality?.publication_blockers ?? '—'}</strong><small>{i18nT('有 Blocker 时停止展示和发布')}</small></article>
        <article><span>{i18nT('红队覆盖')}</span><strong>{redTeam ? `${redTeam.caught_count}/${redTeam.case_count}` : '—'}</strong><small>{redTeam?.pass ? i18nT('当前规则全部拦截') : i18nT('存在未拦截案例')}</small></article>
        <article><span>{i18nT('生产固定版本')}</span><strong>{activeComponents.length}</strong><small>{i18nT('不允许 latest 或供应商静默升级')}</small></article>
        <article><span>{i18nT('活跃 Kill Switch')}</span><strong className={switches.some((item) => item.active) ? 'warn' : ''}>{switches.filter((item) => item.active).length}</strong><small>{i18nT('停用后仍保留手动记录和 Crisis 入口')}</small></article>
        <article><span>{i18nT('未解决事故')}</span><strong className={incidents.some((item) => item.status !== 'RESOLVED') ? 'warn' : ''}>{incidents.filter((item) => item.status !== 'RESOLVED').length}</strong><small>{i18nT('事故不得包含用户身份列表或正文')}</small></article>
      </div>}

      {tab === 'releases' && <div className="pg-list">{releases.length ? releases.map((item) => <article key={item.id}><div><span>{item.version} · {item.deployment_stage}</span><h4>{item.release_key}</h4></div><strong className={item.approval_status === 'BLOCKED' ? 'danger' : ''}>{item.approval_status}</strong><p>{(item.blocker_codes_json || []).join(' · ') || i18nT('无已记录阻断项')}</p></article>) : <Empty>{i18nT('还没有发布候选；没有证据时不会显示为已批准。')}</Empty>}</div>}

      {tab === 'evaluations' && <div className="pg-list">{evaluations.length ? evaluations.map((item) => <article key={item.id}><div><span>{item.run_type} · {item.component_version}</span><h4>{item.component_id}</h4></div><strong className={item.status === 'BLOCKED' ? 'danger' : ''}>{item.status}</strong><p>{i18nT('报告只包含指标、原因代码和脱敏失败摘要。')}</p></article>) : <Empty>{i18nT('还没有离线评测运行。高风险组件在此状态下不能发布。')}</Empty>}</div>}

      {tab === 'components' && <div className="pg-list">{components.length ? components.map((item) => <article key={item.id}><div><span>{item.component_type} · {item.version}</span><h4>{item.component_id}</h4></div><strong>{item.approval_status}</strong><p>{item.activated_at ? i18nT('当前激活的固定版本') : i18nT('未激活')}</p></article>) : <Empty>{i18nT('还没有注册的生产组件版本。')}</Empty>}</div>}

      {tab === 'switches' && <div className="pg-list">{switches.map((item) => <article key={item.id}><div><span>{item.scope_type} · {item.scope_reference || i18nT('全局')}</span><h4>{item.switch_key}</h4></div><strong className={item.active ? 'danger' : ''}>{item.active ? 'ACTIVE' : 'INACTIVE'}</strong><button type="button" disabled={busy === item.id} onClick={() => toggle(item)}>{item.active ? i18nT('在审计后恢复') : i18nT('紧急停用')}</button></article>)}</div>}

      {tab === 'incidents' && <div className="pg-list">{incidents.length ? incidents.map((item) => <article key={item.id}><div><span>{item.severity} · {item.incident_type}</span><h4>{item.incident_key}</h4></div><strong className={item.status !== 'RESOLVED' ? 'warn' : ''}>{item.status}</strong><p>{(item.affected_components_json || []).join(' · ') || i18nT('影响组件待确认')}</p></article>) : <Empty>{i18nT('当前没有事故记录。')}</Empty>}</div>}

      {tab === 'slo' && <div className="pg-slo">{slo && Object.entries(slo.targets || {}).map(([key, value]) => <article key={key}><div><h4>{key}</h4><span>{i18nT('降级')}：{value.degrade}</span></div><strong>{value.target}</strong></article>)}</div>}
    </section>
  )
}
