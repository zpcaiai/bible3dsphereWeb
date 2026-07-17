import { useCallback, useEffect, useMemo, useState } from 'react'
import BackButton from '../../BackButton'
import { t as i18nT } from '../../i18n/runtime'
import {
  decideRecommendation,
  getContextAccessLog,
  getCurrentRecommendation,
  getUnifiedHome,
  getUnifiedTimeline,
  listContextConsents,
  listUnifiedActions,
  searchUnifiedData,
  setContextConsent,
  transitionUnifiedAction,
} from './platformApi'
import './spiritualPlanetPlatform.css'

const NAV = [
  ['home', '首页', '◉'], ['today', '今日', '☀'], ['twin', '孪生', '✦'],
  ['practices', '操练', '◇'], ['calling', '呼召', '⌁'], ['collaboration', '同行', '♡'],
  ['timeline', '时间线', '◷'], ['search', '搜索', '⌕'], ['actions', '行动', '✓'], ['privacy', '隐私', '◎'],
]

const SHARES = [
  { projection: 'prayer_context_v1', module: 'prayer', purpose: 'GENERATE_PRAYER_PROMPT', label: '祷告上下文', description: '已确认的祷告需要、情绪、恐惧、恩典因素与经文主题。' },
  { projection: 'habit_context_v1', module: 'formation_engine', purpose: 'CREATE_FORMATION_PRACTICE', label: '操练上下文', description: '目标、容量、偏好时长与已确认替代回应。' },
  { projection: 'attention_context_v1', module: 'attention', purpose: 'CREATE_ATTENTION_BOUNDARY', label: '注意力上下文', description: '已确认模式、边界偏好与风险时段；不含敏感原因正文。' },
  { projection: 'calling_context_v1', module: 'gift_calling', purpose: 'PREPARE_CALLING_REFLECTION', label: '呼召上下文', description: '生命季节、已确认恩赐、经验与容量限制。' },
  { projection: 'church_context_v1', module: 'church', purpose: 'PREPARE_PASTORAL_BRIEF', label: '教会同行上下文', description: '仅含你主动选择的参与目标、支持需要与对话问题。' },
  { projection: 'mission_context_v1', module: 'mission', purpose: 'PREPARE_MISSION_REFLECTION', label: '使命上下文', description: '已确认方向、装备进度与主动分享的限制。' },
]

const MODULE_LABELS = {
  formation_twin: '情感—属灵形成孪生', platform_orchestrator: '属灵星球协调器',
  prayer: '祷告', devotion: '灵修', holy_habit: '习惯', attention: '注意力',
  formation_engine: '形成操练', gift_calling: '恩赐与呼召', church: '教会生活', mission: '使命', crisis: '危机照护',
}

function Empty({ children }) {
  return <div className="sp-empty"><span aria-hidden="true">○</span><p>{children}</p></div>
}

function Loading() {
  return <div className="sp-loading" role="status">{i18nT('正在读取最小授权摘要…')}</div>
}

function ErrorNotice({ error, onRetry }) {
  if (!error) return null
  return <div className="sp-error" role="alert"><span>{error}</span>{onRetry && <button type="button" onClick={onRetry}>{i18nT('重试')}</button>}</div>
}

function ActionCard({ action, onChange }) {
  const active = ['CONFIRMED', 'SCHEDULED', 'IN_PROGRESS'].includes(action.status)
  return (
    <article className={`sp-action ${action.focus_action ? 'focus' : ''}`}>
      <div className="sp-action-source">{i18nT(MODULE_LABELS[action.source_module] || action.source_module)} · {action.status}</div>
      <h3>{action.title}</h3>
      <p>{action.estimated_duration_minutes != null ? `${action.estimated_duration_minutes} ${i18nT('分钟')}` : i18nT('按需要')}</p>
      {active && action.source_module === 'platform_orchestrator' && (
        <div className="sp-inline-actions">
          {action.status !== 'IN_PROGRESS' && <button type="button" onClick={() => onChange(action.id, 'start')}>{i18nT('开始')}</button>}
          <button type="button" onClick={() => onChange(action.id, 'complete')}>{i18nT('完成')}</button>
          <button type="button" className="quiet" onClick={() => onChange(action.id, 'skip')}>{i18nT('今天跳过')}</button>
          <button type="button" className="quiet" onClick={() => onChange(action.id, 'cancel')}>{i18nT('取消')}</button>
        </div>
      )}
      {active && action.source_module !== 'platform_orchestrator' && <small>{i18nT('状态由来源模块维护；请回到该模块更新。')}</small>}
    </article>
  )
}

function HomePanel({ home, recommendation, busyDecision, onDecision, onOpen, onReload }) {
  if (!home) return <Loading />
  const data = home.home || {}
  const current = data.current_state || {}
  return (
    <div className="sp-panel-stack">
      <section className="sp-safety-card">
        <div><strong>{i18nT('安全入口始终可用')}</strong><p>{i18nT('如果你此刻不安全，普通成长流程会停止，优先连接真人与专业支持。')}</p></div>
        <button type="button" onClick={() => onOpen('sos')}>{i18nT('打开安全帮助')}</button>
      </section>
      {data.data_status === 'INSUFFICIENT_DATA' ? (
        <section className="sp-card"><Empty>{i18nT(data.message)}</Empty><button className="sp-primary" type="button" onClick={() => onOpen('checkin')}>{i18nT('进行简短签到')}</button></section>
      ) : (
        <>
          <section className="sp-card sp-state-card">
            <div className="sp-section-title"><div><span>CURRENT STATE</span><h2>{i18nT('当前状态')}</h2></div><button type="button" className="sp-text-btn" onClick={onReload}>{i18nT('刷新')}</button></div>
            <div className="sp-state-grid">
              <div><span>{i18nT('容量')}</span><strong>{current.capacity_mode || 'NORMAL'}</strong></div>
              <div><span>{i18nT('安全摘要')}</span><strong>{current.safety_summary?.level || 'NONE'}</strong><small>{i18nT('不含危机正文')}</small></div>
              <div><span>{i18nT('已确认主题')}</span><strong>{current.confirmed_theme || i18nT('尚无')}</strong></div>
            </div>
          </section>
          <section className="sp-card sp-mirror-card">
            <span className="sp-eyebrow">TODAY MIRROR</span>
            <h2>{i18nT('今日镜像')}</h2>
            <p>{i18nT(data.mirror?.summary || '以下只呈现已确认、可追溯的摘要。')}</p>
            <blockquote>{i18nT(data.mirror?.question || '此刻什么最值得你温柔地留意？')}</blockquote>
          </section>
        </>
      )}
      <section className="sp-card">
        <div className="sp-section-title"><div><span>ONE FOCUS</span><h2>{i18nT('一个重点行动')}</h2></div></div>
        {data.focus_action ? <ActionCard action={data.focus_action} onChange={() => {}} /> : <Empty>{i18nT('今天没有必须新增的行动。')}</Empty>}
      </section>
      <section className="sp-card">
        <div className="sp-section-title"><div><span>OPTIONAL NEXT STEP</span><h2>{i18nT('待你决定的建议')}</h2></div></div>
        {recommendation ? (
          <article className="sp-recommendation">
            <small>{i18nT(MODULE_LABELS[recommendation.source_module] || recommendation.source_module)} · {recommendation.estimated_duration_minutes} {i18nT('分钟')}</small>
            <h3>{recommendation.title}</h3>
            {recommendation.description && <p>{recommendation.description}</p>}
            <div className="sp-inline-actions">
              <button type="button" disabled={busyDecision} onClick={() => onDecision(recommendation.id, 'accept')}>{i18nT('接受')}</button>
              <button type="button" disabled={busyDecision} onClick={() => onDecision(recommendation.id, 'smaller')}>{i18nT('更小一点')}</button>
              <button type="button" className="quiet" disabled={busyDecision} onClick={() => onDecision(recommendation.id, 'alternative')}>{i18nT('换一个')}</button>
              <button type="button" className="quiet" disabled={busyDecision} onClick={() => onDecision(recommendation.id, 'skip')}>{i18nT('今天跳过')}</button>
            </div>
          </article>
        ) : <Empty>{i18nT('没有等待你处理的建议；系统不会为了活跃度制造任务。')}</Empty>}
      </section>
    </div>
  )
}

function ModulePanel({ kind, onOpen }) {
  const content = {
    today: ['今日', '用一个镜像、一个问题、一个可选行动整理今天。', [['状态签到', 'checkin'], ['祷告', 'prayer'], ['灵修', 'devotion']]],
    twin: ['情感—属灵形成孪生', '查看可核对的生命事件、情感状态和形成链；Pending 不会当作事实。', [['打开孪生', 'formation-twin'], ['个人检索', 'personal-search']]],
    practices: ['操练', '祷告、灵修、习惯和注意力仍由各自模块保存与执行。', [['祷告', 'prayer'], ['灵修', 'devotion'], ['形成操练', 'spiritual-formation'], ['注意力边界', 'attention']]],
    calling: ['恩赐、呼召与使命', '平台只传递经授权的最小投影，不替你判断神的旨意。', [['恩赐与呼召', 'growth-map'], ['使命生活', 'mission-life']]],
    collaboration: ['真人同行', '由你主动选择可信关系；组织管理员不会获得你的生命状态面板。', [['属灵伙伴', 'partner'], ['教会生活', 'communion']]],
  }[kind]
  return (
    <section className="sp-card sp-module-panel">
      <span className="sp-eyebrow">SOURCE MODULES</span><h2>{i18nT(content[0])}</h2><p>{i18nT(content[1])}</p>
      <div className="sp-module-links">{content[2].map(([label, target]) => <button type="button" key={target} onClick={() => onOpen(target)}>{i18nT(label)}<span>›</span></button>)}</div>
    </section>
  )
}

function TimelinePanel({ items, loading, module, setModule }) {
  if (loading) return <Loading />
  return (
    <section className="sp-card">
      <div className="sp-section-title"><div><span>SOURCE REFERENCES</span><h2>{i18nT('统一时间线')}</h2></div><select aria-label={i18nT('来源模块')} value={module} onChange={(event) => setModule(event.target.value)}><option value="">{i18nT('全部模块')}</option><option value="formation_twin">{i18nT('情感—属灵形成孪生')}</option><option value="prayer">{i18nT('祷告')}</option><option value="devotion">{i18nT('灵修')}</option></select></div>
      {!items.length ? <Empty>{i18nT('目前没有可展示的已授权事件引用。原始正文仍留在来源模块。')}</Empty> : <div className="sp-timeline">{items.map((item) => <article key={`${item.source_module}:${item.source_record_id}`}><span aria-hidden="true" /><div><small>{i18nT(MODULE_LABELS[item.source_module] || item.source_module)} · {item.occurred_at ? new Date(item.occurred_at).toLocaleString() : i18nT('时间未知')}</small><h3>{i18nT(item.event_type || item.source_record_type)}</h3><p>{i18nT('仅显示引用；打开来源模块才能读取原始内容。')}</p></div></article>)}</div>}
    </section>
  )
}

function SearchPanel() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const search = async (event) => {
    event.preventDefault(); if (!query.trim()) return
    setLoading(true); setError('')
    try { setResults((await searchUnifiedData(query.trim())).results || []) } catch (caught) { setError(caught.message) } finally { setLoading(false) }
  }
  return (
    <section className="sp-card">
      <span className="sp-eyebrow">CURRENT USER ONLY</span><h2>{i18nT('受限跨模块搜索')}</h2>
      <p>{i18nT('默认只搜索标题、标签、已确认摘要、经文引用和模块名称；查询全文不会写入搜索日志。')}</p>
      <form className="sp-search-form" onSubmit={search}><input aria-label={i18nT('搜索我的已确认记录')} maxLength={120} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={i18nT('搜索我的已确认记录…')} /><button type="submit" disabled={loading || !query.trim()}>{loading ? i18nT('搜索中…') : i18nT('搜索')}</button></form>
      <ErrorNotice error={error} />
      <div className="sp-search-results">{results.map((item) => <article key={`${item.source_module}:${item.source_record_id}`}><small>{i18nT(MODULE_LABELS[item.source_module] || item.source_module)}</small><h3>{item.title}</h3>{item.snippet && <p>{item.snippet}</p>}<span>{i18nT('来源透明 · 当前用户 · 已确认引用')}</span></article>)}</div>
      {!loading && !results.length && <Empty>{i18nT('没有结果。危机正文、第三方反馈、未确认推断和被排除内容不会进入默认搜索。')}</Empty>}
    </section>
  )
}

function ActionsPanel({ actions, loading, onChange }) {
  if (loading) return <Loading />
  return <section className="sp-card"><div className="sp-section-title"><div><span>NO MORAL SCORE</span><h2>{i18nT('统一行动中心')}</h2></div><small>{i18nT('最多 3 个活跃行动 · 1 个重点')}</small></div>{actions.length ? <div className="sp-action-list">{actions.map((action) => <ActionCard key={action.id} action={action} onChange={onChange} />)}</div> : <Empty>{i18nT('目前没有统一行动。跳过、停止或取消都不代表属灵失败。')}</Empty>}</section>
}

function PrivacyPanel({ consents, accesses, loading, busyConsent, onToggle }) {
  const active = useMemo(() => new Set(consents.filter((item) => item.status === 'ACTIVE').map((item) => item.projection_name)), [consents])
  if (loading) return <Loading />
  return (
    <div className="sp-panel-stack">
      <section className="sp-card"><span className="sp-eyebrow">PURPOSE-BOUND ACCESS</span><h2>{i18nT('上下文授权')}</h2><p>{i18nT('每个模块只能按用途读取字段白名单。撤回后会停止新读取、待处理工作与通知，并使相关引用失效。')}</p><div className="sp-consent-list">{SHARES.map((share) => <article key={share.projection}><div><h3>{i18nT(share.label)}</h3><p>{i18nT(share.description)}</p><small>{share.module} · {share.purpose}</small></div><button type="button" aria-pressed={active.has(share.projection)} disabled={busyConsent === share.projection} onClick={() => onToggle(share, !active.has(share.projection))}>{active.has(share.projection) ? i18nT('撤回') : i18nT('允许')}</button></article>)}</div></section>
      <section className="sp-card"><span className="sp-eyebrow">ACCESS AUDIT</span><h2>{i18nT('谁为哪个用途读取过')}</h2>{accesses.length ? <div className="sp-audit-list">{accesses.map((item) => <article key={item.id}><div><strong>{i18nT(MODULE_LABELS[item.requester_module] || item.requester_module)}</strong><span>{item.decision}</span></div><p>{item.purpose} · {item.projection_name}</p><small>{new Date(item.created_at).toLocaleString()} · {item.reason_codes.join(' / ')}</small></article>)}</div> : <Empty>{i18nT('还没有上下文访问记录。')}</Empty>}</section>
      <section className="sp-card sp-boundary"><h2>{i18nT('平台不会做什么')}</h2><ul><li>{i18nT('不生成属灵总分、顺服分、圣洁分、得救概率或用户排名。')}</li><li>{i18nT('不把完整日记、祷告、认罪、试探、危机或第三方隐私带入事件、通知、搜索或图谱。')}</li><li>{i18nT('不让服务身份绕过你的授权，也不让组织管理员查看个人生命状态。')}</li><li>{i18nT('不让多个 Agent 竞争输出或投票决定神的旨意。')}</li></ul></section>
    </div>
  )
}

export default function SpiritualPlanetPlatformPage({ user, onBack, onOpen }) {
  const [tab, setTab] = useState('home')
  const [home, setHome] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [actions, setActions] = useState([])
  const [timeline, setTimeline] = useState([])
  const [timelineModule, setTimelineModule] = useState('')
  const [consents, setConsents] = useState([])
  const [accesses, setAccesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyDecision, setBusyDecision] = useState(false)
  const [busyConsent, setBusyConsent] = useState('')

  const loadCore = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [homeData, recommendationData, actionData] = await Promise.all([getUnifiedHome(), getCurrentRecommendation(), listUnifiedActions()])
      setHome(homeData); setRecommendation(recommendationData.recommendation || null); setActions(actionData.actions || [])
    } catch (caught) { setError(caught.message) } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadCore() }, [loadCore])
  useEffect(() => {
    if (tab !== 'timeline') return
    setLoading(true); setError('')
    getUnifiedTimeline(timelineModule).then((data) => setTimeline(data.timeline || [])).catch((caught) => setError(caught.message)).finally(() => setLoading(false))
  }, [tab, timelineModule])
  useEffect(() => {
    if (tab !== 'privacy') return
    setLoading(true); setError('')
    Promise.all([listContextConsents(), getContextAccessLog()]).then(([consentData, accessData]) => { setConsents(consentData.consents || []); setAccesses(accessData.accesses || []) }).catch((caught) => setError(caught.message)).finally(() => setLoading(false))
  }, [tab])

  const decide = async (id, decision) => {
    setBusyDecision(true); setError('')
    try { await decideRecommendation(id, decision); await loadCore() } catch (caught) { setError(caught.message) } finally { setBusyDecision(false) }
  }
  const changeAction = async (id, transition) => {
    setError('')
    try { await transitionUnifiedAction(id, transition); await loadCore() } catch (caught) { setError(caught.message) }
  }
  const toggleConsent = async (share, active) => {
    setBusyConsent(share.projection); setError('')
    try {
      await setContextConsent(share.projection, { requester_module: share.module, purpose: share.purpose, allowed_fields: [], active })
      const data = await listContextConsents(); setConsents(data.consents || [])
    } catch (caught) { setError(caught.message) } finally { setBusyConsent('') }
  }

  return (
    <main className="sp-platform">
      <header className="sp-header"><BackButton onClick={onBack} /><div><span>SPIRITUAL PLANET · UNIFIED ORCHESTRATION</span><h1>{i18nT('属灵星球')}</h1><p>{i18nT('一个镜像 · 一个问题 · 一个可选行动')}</p></div><div className="sp-user-mark" aria-label={user?.email || i18nT('当前用户')}>✦</div></header>
      <nav className="sp-nav" aria-label={i18nT('属灵星球导航')}>{NAV.map(([key, label, icon]) => <button type="button" key={key} aria-current={tab === key ? 'page' : undefined} onClick={() => setTab(key)}><span aria-hidden="true">{icon}</span>{i18nT(label)}</button>)}</nav>
      <div className="sp-content"><ErrorNotice error={error} onRetry={tab === 'home' ? loadCore : undefined} />
        {loading && tab === 'home' ? <Loading /> : tab === 'home' ? <HomePanel home={home} recommendation={recommendation} busyDecision={busyDecision} onDecision={decide} onOpen={onOpen} onReload={loadCore} /> : null}
        {['today', 'twin', 'practices', 'calling', 'collaboration'].includes(tab) && <ModulePanel kind={tab} onOpen={onOpen} />}
        {tab === 'timeline' && <TimelinePanel items={timeline} loading={loading} module={timelineModule} setModule={setTimelineModule} />}
        {tab === 'search' && <SearchPanel />}
        {tab === 'actions' && <ActionsPanel actions={actions} loading={loading} onChange={changeAction} />}
        {tab === 'privacy' && <PrivacyPanel consents={consents} accesses={accesses} loading={loading} busyConsent={busyConsent} onToggle={toggleConsent} />}
      </div>
    </main>
  )
}
