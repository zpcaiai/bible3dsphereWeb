import { T } from '../../lib/localize'
import { useMemo, useState } from 'react'
import { crisisResourceTemplates, healingJourneyTypes, sufferingCategories } from '../../data/sufferingCareSeed'
import {
  addCareLog,
  addHealingEntry,
  addHealingMilestone,
  buildSufferingCareDashboard,
  createCareCase,
  createCareFollowup,
  createCarePlan,
  createCareRelationshipRequest,
  createForgivenessBoundaryPlan,
  createHealingJourney,
  createSafetyPlan,
  createSufferingSession,
  generateRoleAwareSummary,
  grantConsent,
  orchestrateSufferingCareIntent,
  recommendEscalation,
  recommendHealingJourney,
  reflectOnSuffering,
  revokeConsent,
  triageText,
} from '../../lib/sufferingCareEngine'
import {
  loadSufferingCareData,
  saveCareCase,
  saveCareFollowup,
  saveCareLog,
  saveCarePlan,
  saveCareRelationship,
  saveCareSummary,
  saveCrisisAssessment,
  saveCrisisEvent,
  saveForgivenessPlan,
  saveHealingEntry,
  saveHealingJourney,
  saveHealingMilestone,
  saveSafetyPlan,
  saveSufferingSession,
  saveSufferingSummary,
} from '../../lib/sufferingCareStorage'
import { MODULE_DISCLAIMER } from '../../lib/pastoralSafety'

function MiniTabs({ active, onChange }) {
  const tabs = [
    ['dashboard', 'Dashboard'],
    ['suffering', 'Suffering'],
    ['crisis', 'Crisis'],
    ['healing', 'Healing'],
    ['pastoral', 'Pastoral'],
  ]
  return <nav className="sf-tabs" aria-label="Suffering Care sections">{tabs.map(([id, label]) => <button key={id} className={active === id ? 'active' : ''} type="button" onClick={() => onChange(id)}>{label}</button>)}</nav>
}

function Notice({ text }) {
  if (!text) return null
  const warning = /danger|crisis|emergency|abuse|unsafe|risk|professional|urgent|safety/i.test(text)
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

export function SufferingTheologyGuide({ userId, data, onRefresh }) {
  const [text, setText] = useState('I am grieving a real loss and do not want a forced happy ending.')
  const [reflection, setReflection] = useState(null)
  const [notice, setNotice] = useState('')

  function reflect() {
    const result = reflectOnSuffering(userId, text, 'lament')
    if (result.routed) {
      saveCrisisAssessment(result.triage.assessment)
      if (result.triage.event) saveCrisisEvent(result.triage.event)
      setReflection(null)
      setNotice(result.triage.response.message)
      return
    }
    setReflection(result.reflection)
    setNotice('Lament is allowed. This reflection avoids cheap explanations.')
  }

  function saveSession() {
    const result = createSufferingSession(userId, { situationText: text, selectedMode: 'lament', painLevel: 7 })
    saveCrisisAssessment(result.triage.assessment)
    if (result.triage.event) saveCrisisEvent(result.triage.event)
    saveSufferingSession(result.session)
    if (result.summary) saveSufferingSummary(result.summary)
    setNotice(result.routed ? result.triage.response.message : result.summary.summary)
    onRefresh()
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('苦难神学', 'Suffering Theology')}</h2><p>Lament, endurance, hope, cross, resurrection, and new creation without minimizing pain.</p></div>
      <article className="sf-card sf-flow-card">
        <label>Suffering or grief<textarea value={text} onChange={(event) => setText(event.target.value)} /></label>
        <div className="sf-plan-actions"><button className="sf-primary" type="button" onClick={reflect}>Reflect Safely</button><button type="button" onClick={saveSession}>Save Suffering Session</button></div>
      </article>
      {reflection && (
        <article className="sf-card sf-flow-card">
          <h3>{reflection.category} reflection</h3>
          <p>{reflection.painNamed}</p>
          <p>{reflection.lamentPermission}</p>
          <div className="sf-home-grid">{Object.entries(reflection.biblicalFrame).map(([key, value]) => <article className="sf-card" key={key}><h3>{key}</h3><p>{value}</p></article>)}</div>
          <SummaryCard title="False Explanations To Reject" items={[{ label: 'Reject', value: reflection.falseExplanationsToReject }, { label: 'Next step', value: reflection.faithfulNextStep }]} />
          <article className="sf-prayer"><b>{reflection.suggestedPractice.title}</b><p>{reflection.suggestedPractice.instructions}</p></article>
        </article>
      )}
      <article className="sf-card"><h3>Suffering Categories</h3><div className="sf-chip-row">{sufferingCategories.map((category) => <span className="sf-chip" key={category.key}>{category.displayName}</span>)}</div></article>
      <Notice text={notice} />
    </section>
  )
}

export function CrisisTriagePanel({ userId, data, onRefresh }) {
  const [text, setText] = useState('I feel hopeless but I can stay safe and will contact a trusted friend.')
  const [result, setResult] = useState(null)
  const [notice, setNotice] = useState('')

  function triage() {
    const next = triageText(userId, text, 'crisis_triage_panel')
    saveCrisisAssessment(next.assessment)
    if (next.event) saveCrisisEvent(next.event)
    setResult(next)
    setNotice(next.response.message)
    onRefresh()
  }

  function makePlan() {
    const plan = createSafetyPlan(userId, { crisisEventId: result?.event?.id })
    saveSafetyPlan(plan)
    setNotice('Safety plan created. Share it with a trusted human helper when appropriate.')
    onRefresh()
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('危机分流', 'Crisis Triage')}</h2><p>Safety routing before ordinary spiritual formation. This does not replace emergency, clinical, legal, or pastoral help.</p></div>
      <article className="sf-card sf-flow-card">
        <label>What is happening?<textarea value={text} onChange={(event) => setText(event.target.value)} /></label>
        <button className="sf-primary" type="button" onClick={triage}>Run Crisis Triage</button>
      </article>
      {result && (
        <article className="sf-card sf-flow-card">
          <div className="sf-card-head"><h3>Safety Message</h3><span className="sf-status">{result.assessment.riskLevel}</span></div>
          <p>{result.response.message}</p>
          {result.response.blockNormalFormation && <p className="sf-warning">Ordinary formation is blocked until safety is addressed.</p>}
          <ul>{result.response.immediateSteps.map((step) => <li key={step}>{step}</li>)}</ul>
          <div className="sf-chip-row">{result.response.detectedRiskTypes?.map((type) => <span className="sf-chip" key={type}>{type}</span>)}</div>
          <button type="button" onClick={makePlan}>Create Safety Plan</button>
        </article>
      )}
      <article className="sf-card"><h3>Generic Resources</h3>{crisisResourceTemplates.map((resource) => <div className="sf-insight-row" key={resource.key}><b>{resource.title}</b><p>{resource.description}</p><span>{resource.resourceType}</span></div>)}</article>
      <SummaryCard title="Active Safety" items={[{ label: 'Safety plans', value: String(data.safetyPlans.length) }, { label: 'Assessments', value: String(data.crisisAssessments.length) }, { label: 'Events', value: String(data.crisisEvents.length) }]} />
      <Notice text={notice} />
    </section>
  )
}

export function HealingJourneyTimeline({ userId, data, onRefresh }) {
  const [context, setContext] = useState('I am grieving and need a gentle healing journey.')
  const [activeJourneyId, setActiveJourneyId] = useState('')
  const [notice, setNotice] = useState('')
  const recommendation = recommendHealingJourney(userId, context)
  const activeJourney = data.healingJourneys.find((journey) => journey.id === activeJourneyId) || data.healingJourneys[0]
  const practices = recommendation.recommendation?.practices || []

  function createJourney() {
    const result = createHealingJourney(userId, { title: 'Healing Journey', description: context })
    if (result.routed) {
      saveCrisisAssessment(result.triage.assessment)
      if (result.triage.event) saveCrisisEvent(result.triage.event)
      setNotice(result.triage.response.message)
      return
    }
    saveHealingJourney(result.journey)
    setActiveJourneyId(result.journey.id)
    setNotice('Healing journey created. Move at a user-paced, consent-based pace.')
    onRefresh()
  }

  function addEntry() {
    const journey = activeJourney || createHealingJourney(userId, { description: context }).journey
    if (!activeJourney) saveHealingJourney(journey)
    const result = addHealingEntry(userId, journey, { userReflection: 'I named one part of the pain without forcing details.', supportNeeded: true })
    if (result.routed) {
      setNotice(result.triage.response.message)
      return
    }
    saveHealingEntry(result.entry)
    saveHealingMilestone(addHealingMilestone(userId, journey, { title: 'Named pain gently' }))
    setNotice('Healing entry and milestone saved.')
    onRefresh()
  }

  function boundaryPlan() {
    const journey = activeJourney || createHealingJourney(userId, { description: context }).journey
    if (!activeJourney) saveHealingJourney(journey)
    const result = createForgivenessBoundaryPlan(userId, journey, { harmSummary: context, contactContext: context })
    saveForgivenessPlan(result.plan)
    setNotice(result.plan.unsafeContactWarning ? 'Unsafe contact warning: forgiveness does not require reconciliation or contact.' : result.plan.forgivenessReflection)
    onRefresh()
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('医治旅程', 'Healing Journey')}</h2><p>Trauma-informed, consent-based support for grief, wounds, boundaries, forgiveness, repair discernment, and rebuilding.</p></div>
      <div className="sf-home-grid">
        <article className="sf-card sf-flow-card">
          <label>Wound or healing need<textarea value={context} onChange={(event) => setContext(event.target.value)} /></label>
          <button className="sf-primary" type="button" onClick={createJourney}>Create Healing Journey</button>
        </article>
        <article className="sf-card sf-flow-card">
          <h3>Recommended phase</h3>
          <p>{recommendation.recommendation?.journeyType.displayName || 'Crisis route required'}</p>
          <p>{recommendation.recommendation?.message || recommendation.triage.response.message}</p>
          {practices.map((practice) => <article className="sf-prayer" key={practice.key}><b>{practice.title}</b><p>{practice.instructions}</p></article>)}
        </article>
      </div>
      {activeJourney && <SummaryCard title={activeJourney.title} items={[{ label: 'Type', value: activeJourney.journeyTypeKey }, { label: 'Phase', value: activeJourney.currentPhase }, { label: 'Care level', value: activeJourney.careLevel }]} />}
      <div className="sf-plan-actions"><button type="button" onClick={addEntry}>Add Healing Entry</button><button type="button" onClick={boundaryPlan}>Create Forgiveness Boundary Plan</button></div>
      <article className="sf-card"><h3>Journey Types</h3><div className="sf-chip-row">{healingJourneyTypes.map((type) => <span className="sf-chip" key={type.key}>{type.displayName}</span>)}</div></article>
      <Notice text={notice} />
    </section>
  )
}

export function PastoralCareDashboard({ userId, data, onRefresh }) {
  const [caregiverId, setCaregiverId] = useState('mentor-1')
  const [caseText, setCaseText] = useState('Grief support with weekly check-ins.')
  const [activeCaseId, setActiveCaseId] = useState('')
  const [notice, setNotice] = useState('')
  const activeRelationship = data.careRelationships.find((relationship) => relationship.status === 'active')
  const activeCase = data.careCases.find((item) => item.id === activeCaseId) || data.careCases[0]

  function requestCare() {
    const request = createCareRelationshipRequest(userId, caregiverId, 'mentor', 'formation_summary')
    const active = grantConsent(request)
    saveCareRelationship(active)
    setNotice('Care relationship granted with formation_summary scope. User can revoke consent.')
    onRefresh()
  }

  function revoke() {
    if (!activeRelationship) return
    saveCareRelationship(revokeConsent(activeRelationship))
    setNotice('Care consent revoked.')
    onRefresh()
  }

  function createCase() {
    const careCase = createCareCase(userId, { title: 'Pastoral care case', summary: caseText, primaryCaregiverUserId: caregiverId })
    saveCareCase(careCase)
    setActiveCaseId(careCase.id)
    setNotice(recommendEscalation(careCase))
    onRefresh()
  }

  function addCarePlanFlow() {
    const careCase = activeCase || createCareCase(userId, { title: 'Pastoral care case', summary: caseText })
    if (!activeCase) saveCareCase(careCase)
    const log = addCareLog(caregiverId, careCase, { summary: 'Gentle care check-in completed.', visibleToReceiver: true })
    const plan = createCarePlan(caregiverId, careCase, {})
    const followup = createCareFollowup(caregiverId, careCase, {})
    const summary = generateRoleAwareSummary(caregiverId, careCase, 'mentor_view', activeRelationship?.permissionScope || 'formation_summary')
    saveCareLog(log)
    saveCarePlan(plan)
    saveCareFollowup(followup)
    saveCareSummary(summary)
    setNotice(summary.summary)
    onRefresh()
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('牧养陪伴', 'Pastoral Care Companion')}</h2><p>Consent-based care relationships, logs, plans, follow-ups, summaries, and escalation recommendations.</p></div>
      <div className="sf-home-grid">
        <article className="sf-card sf-flow-card">
          <h3>Consent and relationship</h3>
          <label>Caregiver ID<input value={caregiverId} onChange={(event) => setCaregiverId(event.target.value)} /></label>
          <div className="sf-plan-actions"><button className="sf-primary" type="button" onClick={requestCare}>Grant Care Access</button><button type="button" onClick={revoke}>Revoke Consent</button></div>
        </article>
        <article className="sf-card sf-flow-card">
          <h3>Create case</h3>
          <label>Care need<textarea value={caseText} onChange={(event) => setCaseText(event.target.value)} /></label>
          <button type="button" onClick={createCase}>Create Care Case</button>
        </article>
      </div>
      {activeCase && <SummaryCard title={activeCase.title} items={[{ label: 'Severity', value: activeCase.severity }, { label: 'Case type', value: activeCase.caseType }, { label: 'Escalation', value: recommendEscalation(activeCase) }]} />}
      <button type="button" onClick={addCarePlanFlow}>Add Care Log, Plan, Follow-Up, Summary</button>
      <SummaryCard title="Pastoral Dashboard" items={[{ label: 'Relationships', value: String(data.careRelationships.length) }, { label: 'Cases', value: String(data.careCases.length) }, { label: 'Logs', value: String(data.careLogs.length) }, { label: 'Follow-ups', value: String(data.careFollowups.length) }]} />
      <Notice text={notice} />
    </section>
  )
}

export default function SufferingCareDashboard({ userId = 'local-user' }) {
  const [tab, setTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [intent, setIntent] = useState('I am grieving and feel like God is far away.')
  const data = useMemo(() => loadSufferingCareData(userId), [userId, refreshKey])
  const dashboard = useMemo(() => buildSufferingCareDashboard({ userId, ...data }), [userId, data])
  const route = orchestrateSufferingCareIntent(userId, intent, {})
  const refresh = () => setRefreshKey((value) => value + 1)

  return (
    <section className="sf-module">
      <div className="sf-section-heading">
        <h2>Suffering, Crisis & Healing Formation OS / 苦难、危机与医治塑造系统</h2>
        <p>{MODULE_DISCLAIMER}</p>
      </div>
      <MiniTabs active={tab} onChange={setTab} />
      {tab === 'dashboard' && (
        <section className="sf-section">
          <div className="sf-home-grid">
            <SummaryCard title="Suffering Reflection" items={[{ label: 'Sessions', value: String(dashboard.today.activeSufferingSessions.length) }, { label: 'Practice', value: dashboard.today.recommendedCarePractice?.title }]} />
            <SummaryCard title="Crisis Safety" items={[{ label: 'Safety plan', value: dashboard.today.activeSafetyPlan?.title || 'No active safety plan' }, { label: 'Urgent flags', value: dashboard.today.urgentFlags }]} />
            <SummaryCard title="Healing and Pastoral Care" items={[{ label: 'Healing journeys', value: String(dashboard.today.activeHealingJourneys.length) }, { label: 'Open cases', value: String(dashboard.today.openCareCases.length) }, { label: 'Due follow-ups', value: String(dashboard.today.dueFollowups.length) }]} />
          </div>
          <article className="sf-card sf-flow-card">
            <h3>Care Orchestrator</h3>
            <label>Intent<textarea value={intent} onChange={(event) => setIntent(event.target.value)} /></label>
            <p><b>{route.route}</b>: {route.message}</p>
            <span className="sf-status">{route.riskLevel} · {route.nextEndpoint}</span>
            {route.blockNormalFormation && <p className="sf-warning">Normal formation is blocked until safety is addressed.</p>}
          </article>
          {dashboard.careInsights.map((insight) => <article className="sf-card" key={insight.summary}><h3>{insight.type}</h3><p>{insight.summary}</p><p>{insight.recommendedNextAction}</p></article>)}
        </section>
      )}
      {tab === 'suffering' && <SufferingTheologyGuide userId={userId} data={data} onRefresh={refresh} />}
      {tab === 'crisis' && <CrisisTriagePanel userId={userId} data={data} onRefresh={refresh} />}
      {tab === 'healing' && <HealingJourneyTimeline userId={userId} data={data} onRefresh={refresh} />}
      {tab === 'pastoral' && <PastoralCareDashboard userId={userId} data={data} onRefresh={refresh} />}
    </section>
  )
}
