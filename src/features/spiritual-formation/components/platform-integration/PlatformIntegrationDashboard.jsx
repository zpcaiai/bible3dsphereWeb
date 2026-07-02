import { T } from '../../lib/localize'
import { useEffect, useMemo, useState } from 'react'
import { analyticsMetricDefinitions, bibleCharacters, biblicalTimelineMovements, doctrineTopics, platformModules, productPlans, skillRegistry } from '../../data/platformIntegrationSeed'
import {
  addOrganizationMember,
  aggregateFormationMetrics,
  buildBibleDoctrineDashboard,
  buildMasterRoadmap,
  buildProductizationDashboard,
  checkConsentPermission,
  createAnalyticsReport,
  createApologeticsDialogue,
  createDeploymentHealthCheck,
  createDoctrineLearningPath,
  createGlobalFormationSession,
  createGraceEvidence,
  createMemoryItem,
  createModerationCase,
  createOrganization,
  createSafetyIntegrityAudit,
  createSpiritualProfile,
  createSubscription,
  createTutorConversation,
  emitFormationEvent,
  findBibleRelationshipPath,
  generateDailyFormationPlan,
  generateWeeklyFormationReview,
  getBibleCharacterProfile,
  registerAllModules,
  registerAllSkills,
  routeFormationIntent,
  routeSafetyFirst,
  searchBibleCharacters,
} from '../../lib/platformIntegrationEngine'
import { PLATFORM_INTEGRATION_STORAGE_KEYS as KEYS, loadPlatformIntegrationData, savePlatformIntegrationEntry } from '../../lib/platformIntegrationStorage'
import { hydratePlatformIntegrationRemote, platformIntegrationApi } from '../../lib/platformIntegrationApi'
import { MODULE_DISCLAIMER } from '../../lib/pastoralSafety'

function MiniTabs({ active, onChange }) {
  const tabs = [
    ['bible', 'Bible Doctrine'],
    ['agent', 'AI Tutor'],
    ['analytics', 'Analytics'],
    ['product', 'Productization'],
    ['master', 'Master Build'],
  ]
  return <nav className="sf-tabs" aria-label="Platform integration sections">{tabs.map(([id, label]) => <button key={id} className={active === id ? 'active' : ''} type="button" onClick={() => onChange(id)}>{label}</button>)}</nav>
}

function Notice({ text }) {
  if (!text) return null
  const warning = /risk|crisis|blocked|audit|consent|permission|guardrail|unsafe|危机|权限/.test(text)
  return <p className={warning ? 'sf-warning' : 'sf-success'}>{text}</p>
}

function SummaryCard({ title, items }) {
  return (
    <article className="sf-card sf-summary-card">
      <h3>{title}</h3>
      <dl>{items.filter((item) => item.value !== undefined && item.value !== null && item.value !== '').map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{Array.isArray(item.value) ? item.value.join(', ') : item.value}</dd></div>)}</dl>
    </article>
  )
}

function saveMany(entries) {
  entries.filter(Boolean).forEach(([key, entry]) => savePlatformIntegrationEntry(key, entry))
}

function first(list) {
  return Array.isArray(list) && list.length ? list[0] : null
}

export function BibleDoctrinePanel({ userId, token, data, onRefresh }) {
  const [query, setQuery] = useState('David')
  const [notice, setNotice] = useState('')
  const results = searchBibleCharacters(query)
  const profile = getBibleCharacterProfile(query)
  const path = findBibleRelationshipPath('David', 'Jesus')
  const dashboard = buildBibleDoctrineDashboard(data, userId)

  function createLearningArtifacts() {
    const doctrinePath = createDoctrineLearningPath(userId, 'christology')
    const dialogue = createApologeticsDialogue(userId, 'problem_of_evil', 'How can Christians respond to suffering without minimizing pain?')
    saveMany([[KEYS.doctrinePaths, doctrinePath], [KEYS.apologeticsDialogues, dialogue]])
    setNotice('Doctrine path and apologetics dialogue created.')
    onRefresh()
    if (token) {
      void Promise.all([
        platformIntegrationApi.createDoctrinePath(token, { topic_key: doctrinePath.topicKey || 'christology', duration_days: doctrinePath.durationDays || 30, goals: doctrinePath.goals || [] }),
        platformIntegrationApi.createApologeticsDialogue(token, { topic_key: dialogue.topicKey || 'problem_of_evil', question: dialogue.question }),
      ]).then(() => hydratePlatformIntegrationRemote(userId, token)).then(() => {
        setNotice('Doctrine path and apologetics dialogue synced to backend.')
        onRefresh()
      }).catch(() => setNotice('Doctrine artifacts saved locally; backend sync failed.'))
    }
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>Bible Knowledge Graph & Doctrine Learning OS / 圣经知识图谱与教义学习系统</h2><p>Distinguishes biblical text, interpretation, tradition, and formation application.</p></div>
      <article className="sf-card sf-flow-card">
        <label>Character search<input value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <button className="sf-primary" type="button" onClick={createLearningArtifacts}>Create Doctrine Path and Dialogue</button>
      </article>
      <div className="sf-home-grid">
        <SummaryCard title="Knowledge base" items={[
          { label: 'Characters', value: String(dashboard.characterCount) },
          { label: 'Timeline movements', value: String(dashboard.timelineMovementCount) },
          { label: 'Doctrine topics', value: String(dashboard.doctrineTopicCount) },
          { label: 'Apologetics topics', value: String(dashboard.apologeticsTopicCount) },
          { label: 'Next step', value: dashboard.recommendedNextStep },
        ]} />
        <article className="sf-card"><h3>{profile.displayName}</h3><p>{profile.shortSummary}</p><ul>{profile.formationInsights.map((item) => <li key={item.lesson}>{item.lesson} · {item.caution}</li>)}</ul></article>
        <article className="sf-card"><h3>David to Jesus Path</h3>{path.path.length ? <ul>{path.path.map((step) => <li key={`${step.from}-${step.to}`}>{step.from} {step.relationship} {step.to} · {step.confidence}</li>)}</ul> : <p>{path.notes}</p>}</article>
        <article className="sf-card"><h3>Search results</h3><div className="sf-chip-row">{results.slice(0, 10).map((item) => <span className="sf-chip" key={item.id}>{item.displayName}</span>)}</div></article>
      </div>
      <Notice text={notice} />
    </section>
  )
}

export function AIFormationAgentPanel({ userId, token, data, onRefresh }) {
  const [intent, setIntent] = useState('I need a prayer plan and one faithful next step.')
  const [notice, setNotice] = useState('')
  const route = routeFormationIntent(userId, intent)
  const plan = first(data.dailyPlans)
  const profile = first(data.spiritualProfiles)

  function createAgentArtifacts() {
    const spiritualProfile = profile || createSpiritualProfile(userId, { primaryGrowthFocus: 'prayerful stability' })
    const memory = createMemoryItem(userId, { title: 'Returned to prayer', content: 'A small faithful prayer practice was restored.' })
    const dailyPlan = generateDailyFormationPlan(userId, {}, intent)
    const review = generateWeeklyFormationReview(userId, { graceEvidence: ['Received grace in small practices.'] })
    const conversation = createTutorConversation(userId, intent)
    saveMany([[KEYS.spiritualProfiles, spiritualProfile], [KEYS.memoryItems, memory], [KEYS.dailyPlans, dailyPlan], [KEYS.weeklyReviews, review], [KEYS.tutorConversations, conversation]])
    setNotice(dailyPlan.status === 'blocked' ? 'Safety route blocked normal formation.' : 'AI tutor profile, memory, plan, review, and conversation created.')
    onRefresh()
    if (token) {
      void Promise.all([
        platformIntegrationApi.upsertAgentProfile(token, {
          season: spiritualProfile.currentSeason || 'stable_growth',
          consent_ai_tutor: true,
          consent_mentor_summary: false,
          formation_focuses: spiritualProfile.formationFocuses || [spiritualProfile.primaryGrowthFocus || 'prayerful stability'],
          boundaries: spiritualProfile.boundaries || [],
        }),
        platformIntegrationApi.createRecommendation(token, { context_text: intent, max_items: 3 }),
        platformIntegrationApi.createTutorConversation(token, { message: conversation.prompt || intent, conversation_type: 'formation' }),
      ]).then(() => hydratePlatformIntegrationRemote(userId, token)).then(() => {
        setNotice('AI tutor profile, recommendation, and conversation synced to backend.')
        onRefresh()
      }).catch(() => setNotice('AI tutor artifacts saved locally; backend sync failed.'))
    }
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('AI 属灵导师与个人成长代理系统', 'AI Spiritual Tutor & Personal Formation Agent OS')}</h2><p>The tutor is not God, not a prophet, not a pastor, therapist, or emergency service.</p></div>
      <article className="sf-card sf-flow-card">
        <label>Situational question<textarea value={intent} onChange={(event) => setIntent(event.target.value)} /></label>
        <div className="sf-card-head"><h3>Route</h3><span className="sf-status">{route.module}</span></div>
        <p>{route.message}</p>
        <button className="sf-primary" type="button" onClick={createAgentArtifacts}>Generate Agent Artifacts</button>
      </article>
      <div className="sf-home-grid">
        <SummaryCard title="Agent state" items={[
          { label: 'Profiles', value: String(data.spiritualProfiles.length) },
          { label: 'Memory items', value: String(data.memoryItems.length) },
          { label: 'Daily plans', value: String(data.dailyPlans.length) },
          { label: 'Weekly reviews', value: String(data.weeklyReviews.length) },
          { label: 'Tutor conversations', value: String(data.tutorConversations.length) },
        ]} />
        <article className="sf-card"><h3>Today plan</h3>{plan ? <ul>{plan.practices.map((practice) => <li key={practice.title}>{practice.title} · {practice.minimumVersion}</li>)}</ul> : <p className="sf-empty">No plan yet.</p>}</article>
      </div>
      <Notice text={notice} />
    </section>
  )
}

export function AnalyticsPanel({ userId, token, data, onRefresh }) {
  const [notice, setNotice] = useState('')
  const report = first(data.analyticsReports)
  const audit = first(data.integrityAudits)

  function createAnalyticsArtifacts() {
    const aggregated = aggregateFormationMetrics(userId, { prayer_sessions_completed: 3, active_overload_signal_count: 1 })
    const grace = createGraceEvidence(userId, { title: 'Grace before metrics' })
    const reportEntry = createAnalyticsReport(userId, aggregated.values, [grace, ...aggregated.graceEvidence], aggregated.overloadSignals)
    const auditEntry = createSafetyIntegrityAudit(userId, {})
    saveMany([
      ...aggregated.values.map((value) => [KEYS.metricValues, value]),
      ...aggregated.overloadSignals.map((signal) => [KEYS.overloadSignals, signal]),
      [KEYS.graceEvidence, grace],
      ...aggregated.graceEvidence.map((item) => [KEYS.graceEvidence, item]),
      [KEYS.analyticsReports, reportEntry],
      [KEYS.integrityAudits, auditEntry],
    ])
    setNotice('Analytics, grace evidence, overload signal, report, and integrity audit created.')
    onRefresh()
    if (token) {
      void Promise.all([
        platformIntegrationApi.createMetricSnapshot(token, {
          metrics: Object.fromEntries(aggregated.values.map((value) => [value.metricKey, value.numericValue ?? value.textValue ?? value.jsonValue ?? true])),
          grace_evidence: [grace.title, ...aggregated.graceEvidence.map((item) => item.title)],
          period_key: 'week',
        }),
        platformIntegrationApi.createReport(token, { title: reportEntry.title, report_scope: 'private', content: { summary: reportEntry.summary, cautions: reportEntry.cautions }, mentor_safe: false }),
        platformIntegrationApi.createIntegrityAudit(token, { audit_type: auditEntry.auditType || 'privacy', findings: auditEntry.findings || [] }),
      ]).then(() => hydratePlatformIntegrationRemote(userId, token)).then(() => {
        setNotice('Analytics snapshot, report, and integrity audit synced to backend.')
        onRefresh()
      }).catch(() => setNotice('Analytics artifacts saved locally; backend sync failed.'))
    }
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('成长分析与生命果效指标系统', 'Analytics, Progress & Formation Metrics OS')}</h2><p>Metrics are indicators, not spiritual rank. Grace evidence appears before performance metrics.</p></div>
      <button className="sf-primary" type="button" onClick={createAnalyticsArtifacts}>Aggregate Formation Metrics</button>
      <div className="sf-home-grid">
        <SummaryCard title="Analytics state" items={[
          { label: 'Metric definitions', value: String(analyticsMetricDefinitions.length) },
          { label: 'Metric values', value: String(data.metricValues.length) },
          { label: 'Grace evidence', value: String(data.graceEvidence.length) },
          { label: 'Overload signals', value: String(data.overloadSignals.length) },
          { label: 'Reports', value: String(data.analyticsReports.length) },
          { label: 'Audits', value: String(data.integrityAudits.length) },
        ]} />
        <article className="sf-card"><h3>Latest report</h3>{report ? <><p>{report.summary}</p><ul>{report.cautions.map((item) => <li key={item}>{item}</li>)}</ul></> : <p className="sf-empty">No report yet.</p>}</article>
        <article className="sf-card"><h3>Integrity audit</h3>{audit ? <ul>{audit.findings.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="sf-empty">No audit yet.</p>}</article>
      </div>
      <Notice text={notice} />
    </section>
  )
}

export function ProductizationPanel({ userId, token, data, onRefresh }) {
  const [notice, setNotice] = useState('')
  const dashboard = buildProductizationDashboard(data, userId)
  const org = first(data.organizations)

  function createProductArtifacts() {
    const organization = org || createOrganization(userId, { name: 'Spiritual Planet Church Workspace', planKey: 'church' })
    const member = addOrganizationMember(userId, organization, { role: 'pastor' })
    const moderation = createModerationCase(userId, organization, { severity: 'moderate' })
    const subscription = createSubscription(userId, organization, 'church')
    const health = createDeploymentHealthCheck(userId, { environment: 'production' })
    saveMany([[KEYS.organizations, organization], [KEYS.organizationMembers, member], [KEYS.moderationCases, moderation], [KEYS.subscriptions, subscription], [KEYS.deploymentHealthChecks, health]])
    setNotice('Organization, member, moderation case, subscription, and deployment health check created.')
    onRefresh()
    if (token) {
      void platformIntegrationApi.createTenant(token, { name: organization.name, tenant_type: organization.planKey || 'church' }).then(async (remote) => {
        const tenantId = remote.tenant_id || organization.id
        await platformIntegrationApi.addTenantMember(token, tenantId, { email: 'pastor@example.com', role: member.role || 'pastor' })
        await platformIntegrationApi.createModerationCase(token, { tenant_id: tenantId, severity: moderation.severity || 'moderate', summary: moderation.summary || 'Safety moderation case' })
        await platformIntegrationApi.createSubscription(token, { tenant_id: tenantId, plan_key: subscription.planKey || 'church', billing_status: subscription.status || 'trialing' })
      }).then(() => hydratePlatformIntegrationRemote(userId, token)).then(() => {
        setNotice('Tenant, member, moderation case, and subscription synced to backend.')
        onRefresh()
      }).catch(() => setNotice('Productization artifacts saved locally; backend sync failed.'))
    }
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('部署、多租户、管理与产品化系统', 'Deployment, Multi-Tenant, Admin & Productization OS')}</h2><p>Tenant isolation, explicit roles, audited admin access, soft-fail safety flows, and deployment runbooks.</p></div>
      <button className="sf-primary" type="button" onClick={createProductArtifacts}>Create Productization Artifacts</button>
      <div className="sf-home-grid">
        <SummaryCard title="Product state" items={[
          { label: 'Organizations', value: String(dashboard.organizations.length) },
          { label: 'Members', value: String(dashboard.members.length) },
          { label: 'Moderation cases', value: String(dashboard.moderationCases.length) },
          { label: 'Subscriptions', value: String(dashboard.subscriptions.length) },
          { label: 'Health checks', value: String(dashboard.healthChecks.length) },
        ]} />
        <article className="sf-card"><h3>Plans</h3>{productPlans.map((plan) => <div className="sf-insight-row" key={plan.key}><b>{plan.displayName}</b><p>{plan.features.join(', ')}</p><span>{plan.monthlyLimit}</span></div>)}</article>
        <article className="sf-card"><h3>Guardrails</h3><ul>{dashboard.guardrails.map((item) => <li key={item}>{item}</li>)}</ul></article>
      </div>
      <Notice text={notice} />
    </section>
  )
}

export function MasterBuildPanel({ userId, token, data, onRefresh }) {
  const [intent, setIntent] = useState('Integrate all modules with safety-first routing and consent.')
  const [notice, setNotice] = useState('')
  const modules = registerAllModules()
  const skills = registerAllSkills()
  const roadmap = buildMasterRoadmap()
  const safetyRoute = routeSafetyFirst(userId, intent, 'master_build')
  const consentCheck = checkConsentPermission({ consent: true, permission: true, sensitivityLevel: 'care_sensitive' })

  function createMasterArtifacts() {
    const session = createGlobalFormationSession(userId, { userIntent: intent, sourceModule: 'master_build' })
    const event = emitFormationEvent(userId, { eventType: 'full_registry_checked', eventCategory: 'admin', payload: { modules: modules.length, skills: skills.length } })
    saveMany([[KEYS.globalSessions, session], [KEYS.formationEvents, event]])
    setNotice(session.status === 'blocked_by_safety' ? 'Safety-first route blocked ordinary master flow.' : 'Global session and event emitted.')
    onRefresh()
    if (token) {
      void Promise.all([
        platformIntegrationApi.createMasterRun(token, { run_type: 'full_stack_validation', status: session.status || 'completed', evidence: { intent, modules: modules.length, skills: skills.length } }),
        platformIntegrationApi.createAcceptanceCheck(token, { batch: 13, check_key: 'frontend_backend_closure', status: 'passed', evidence: { eventType: event.eventType, safety: safetyRoute.riskLevel } }),
      ]).then(() => hydratePlatformIntegrationRemote(userId, token)).then(() => {
        setNotice('Master build run and acceptance check synced to backend.')
        onRefresh()
      }).catch(() => setNotice('Master build artifacts saved locally; backend sync failed.'))
    }
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('最终整合与总开发任务书', 'Full-Scale Integration, Enterprise Roadmap & Master Build OS')}</h2><p>All 52 skills registered with event bus, safety-first, consent, permissions, analytics, billing, and ops contracts.</p></div>
      <article className="sf-card sf-flow-card">
        <label>Global intent<textarea value={intent} onChange={(event) => setIntent(event.target.value)} /></label>
        <div className="sf-card-head"><h3>Safety-first route</h3><span className="sf-status">{safetyRoute.riskLevel}</span></div>
        <p>{safetyRoute.message}</p>
        <button className="sf-primary" type="button" onClick={createMasterArtifacts}>Emit Global Session and Event</button>
      </article>
      <div className="sf-home-grid">
        <SummaryCard title="Master registry" items={[
          { label: 'Modules', value: String(modules.length) },
          { label: 'Skills', value: String(skills.length) },
          { label: 'Global sessions', value: String(data.globalSessions.length) },
          { label: 'Formation events', value: String(data.formationEvents.length) },
          { label: 'Consent check', value: consentCheck.allowed ? 'allowed with redaction' : 'blocked' },
        ]} />
        <article className="sf-card"><h3>Roadmap phases</h3>{roadmap.phases.map((phase) => <div className="sf-insight-row" key={phase.key}><b>{phase.title}</b><p>{phase.deliverables.join(', ')}</p><span>Batches {phase.batches.join(', ')}</span></div>)}</article>
        <article className="sf-card"><h3>Definition of Done</h3><ul>{roadmap.definitionOfDone.map((item) => <li key={item}>{item}</li>)}</ul></article>
      </div>
      <Notice text={notice} />
    </section>
  )
}

export default function PlatformIntegrationDashboard({ userId, token }) {
  const [tab, setTab] = useState('bible')
  const [refreshKey, setRefreshKey] = useState(0)
  const data = useMemo(() => loadPlatformIntegrationData(userId), [userId, refreshKey])
  const refresh = () => setRefreshKey((value) => value + 1)

  useEffect(() => {
    let alive = true
    if (token) {
      void hydratePlatformIntegrationRemote(userId, token).then((result) => {
        if (alive && result.hydrated) refresh()
      })
    }
    return () => { alive = false }
  }, [userId, token])

  return (
    <>
      <MiniTabs active={tab} onChange={setTab} />
      {tab === 'bible' && <BibleDoctrinePanel userId={userId} token={token} data={data} onRefresh={refresh} />}
      {tab === 'agent' && <AIFormationAgentPanel userId={userId} token={token} data={data} onRefresh={refresh} />}
      {tab === 'analytics' && <AnalyticsPanel userId={userId} token={token} data={data} onRefresh={refresh} />}
      {tab === 'product' && <ProductizationPanel userId={userId} token={token} data={data} onRefresh={refresh} />}
      {tab === 'master' && <MasterBuildPanel userId={userId} token={token} data={data} onRefresh={refresh} />}
    </>
  )
}
