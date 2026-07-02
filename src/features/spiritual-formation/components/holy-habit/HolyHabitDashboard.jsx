import { T } from '../../lib/localize'
import { useMemo, useState } from 'react'
import { fastingPractices, holyHabitTemplates, restPractices, ruleDomains, ruleTemplates } from '../../data/holyHabitSeed'
import {
  analyzeRestBlockers,
  analyzeSimplicityAudit,
  buildHolyHabitDashboard,
  checkinHabit,
  completeSabbathSession,
  createFastingCheckin,
  createFastingPlan,
  createHabitPlan,
  createRestAudit,
  createRestBoundaryRule,
  createRuleFromTemplate,
  createSabbathPlan,
  createSabbathSession,
  createSimplicityAction,
  createSimplicityAudit,
  detectLegalismOrOverload,
  generateFastingReview,
  generateHabitReview,
  generateRuleReview,
  generateSabbathReview,
  getTodayHabits,
  orchestrateHolyHabitIntent,
  recommendFastingPractice,
  recommendHabits,
  recommendRule,
} from '../../lib/holyHabitEngine'
import {
  loadHolyHabitData,
  saveBoundaryRule,
  saveFastingCheckin,
  saveFastingPlan,
  saveFastingReview,
  saveHabitCheckin,
  saveHabitPlan,
  saveHabitReview,
  saveRestAudit,
  saveRuleCommitment,
  saveRuleProfile,
  saveRuleReview,
  saveSabbathPlan,
  saveSabbathReview,
  saveSabbathSession,
  saveSimplicityAction,
  saveSimplicityAudit,
} from '../../lib/holyHabitStorage'
import { MODULE_DISCLAIMER } from '../../lib/pastoralSafety'

function MiniTabs({ active, onChange }) {
  const tabs = [
    ['dashboard', 'Dashboard'],
    ['rule', 'Rule of Life'],
    ['habits', 'Holy Habits'],
    ['sabbath', 'Sabbath'],
    ['fasting', 'Fasting'],
  ]
  return <nav className="sf-tabs" aria-label="Rule of Life sections">{tabs.map(([id, label]) => <button key={id} className={active === id ? 'active' : ''} type="button" onClick={() => onChange(id)}>{label}</button>)}</nav>
}

function SummaryCard({ title, items }) {
  return (
    <article className="sf-card sf-summary-card">
      <h3>{title}</h3>
      <dl>{items.filter((item) => item.value !== undefined && item.value !== null && item.value !== '').map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{Array.isArray(item.value) ? item.value.join(', ') : item.value}</dd></div>)}</dl>
    </article>
  )
}

function Notice({ text }) {
  if (!text) return null
  const warning = /urgent|risk|medical|unsafe|heavy|burden|crisis|danger|coercion|eating/i.test(text)
  return <p className={warning ? 'sf-warning' : 'sf-success'}>{text}</p>
}

export function RuleOfLifeBuilder({ userId, data, onRefresh }) {
  const [templateId, setTemplateId] = useState('beginner_rule')
  const [contextText, setContextText] = useState('busy work season with desire for steady prayer and rest')
  const [notice, setNotice] = useState('')
  const activeRule = data.ruleProfiles.find((profile) => profile.status === 'active')
  const commitments = data.commitments.filter((item) => !activeRule || item.ruleProfileId === activeRule.id)
  const recommendation = recommendRule(userId, contextText, activeRule?.seasonLabel || 'ordinary_time')
  const overload = activeRule ? detectLegalismOrOverload(activeRule, commitments) : null

  function createRule() {
    const result = createRuleFromTemplate(userId, templateId)
    saveRuleProfile(result.profile)
    result.commitments.forEach(saveRuleCommitment)
    setNotice(result.guidance.message)
    onRefresh()
  }

  function reviewRule() {
    if (!activeRule) return
    const review = generateRuleReview(userId, activeRule, commitments, data.ruleCheckins)
    saveRuleReview(review)
    setNotice(review.graceReminder)
    onRefresh()
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('生活规则构建器', 'Rule of Life Builder')}</h2><p>A trellis for love across prayer, Scripture, work, rest, body, money, relationships, speech, technology, service, mission, learning, solitude, and community.</p></div>
      <div className="sf-home-grid">
        <article className="sf-card sf-flow-card">
          <h3>Create from template</h3>
          <label>Season context<textarea value={contextText} onChange={(event) => setContextText(event.target.value)} /></label>
          <label>Template<select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>{ruleTemplates.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}</select></label>
          <p>{ruleTemplates.find((template) => template.id === templateId)?.description}</p>
          <button className="sf-primary" type="button" onClick={createRule}>Create Rule of Life</button>
        </article>
        <article className="sf-card sf-flow-card">
          <h3>Recommended shape</h3>
          <p>{recommendation.template.title} · review in {recommendation.suggestedDurationDays} days</p>
          <div className="sf-chip-row">{recommendation.recommendedDomains.map((domain) => <span className="sf-chip" key={domain.key}>{domain.displayName}</span>)}</div>
          <p>{recommendation.warnings.join(' ')}</p>
        </article>
      </div>
      {activeRule ? (
        <>
          <SummaryCard title={activeRule.title} items={[{ label: 'Season', value: activeRule.seasonLabel }, { label: 'Guiding Scripture', value: activeRule.guidingScripture }, { label: 'Values', value: activeRule.guidingValues }, { label: 'Adjustment', value: overload?.suggestedAdjustment }]} />
          <div className="sf-home-grid">{commitments.map((commitment) => <article className="sf-card sf-flow-card" key={commitment.id}><div className="sf-card-head"><h3>{commitment.domain.displayName}</h3><span className="sf-status">{commitment.rhythm}</span></div><p>{commitment.commitment}</p><p><b>Grace minimum:</b> {commitment.minimum}</p></article>)}</div>
          <button type="button" onClick={reviewRule}>Generate Rule Review</button>
        </>
      ) : <p className="sf-empty">No active rule yet. Create a gentle beginner rule to begin.</p>}
      <article className="sf-card"><h3>Rule Domains</h3><div className="sf-chip-row">{ruleDomains.map((domain) => <span className="sf-chip" key={domain.key}>{domain.displayName}</span>)}</div></article>
      <Notice text={notice} />
    </section>
  )
}

export function HolyHabitPlanner({ userId, data, onRefresh }) {
  const [need, setNeed] = useState('anger in conflict and need gentleness')
  const [selectedKey, setSelectedKey] = useState('conflict_pause')
  const [activePlanId, setActivePlanId] = useState('')
  const [reflection, setReflection] = useState('I paused before answering.')
  const [notice, setNotice] = useState('')
  const recommendations = recommendHabits(userId, need)
  const todayHabits = getTodayHabits(userId, data.habitPlans)
  const activePlan = data.habitPlans.find((plan) => plan.id === activePlanId) || todayHabits[0] || data.habitPlans[0]

  function createPlan() {
    const template = holyHabitTemplates.find((habit) => habit.key === selectedKey) || recommendations[0]
    const plan = createHabitPlan(userId, template, { cadence: template.key.includes('weekly') ? 'weekly' : 'daily' })
    saveHabitPlan(plan)
    setActivePlanId(plan.id)
    setNotice('Holy habit plan created with a grace minimum.')
    onRefresh()
  }

  function checkIn(completed = true) {
    const plan = activePlan || createHabitPlan(userId, holyHabitTemplates.find((habit) => habit.key === selectedKey))
    if (!activePlan) saveHabitPlan(plan)
    const result = checkinHabit(userId, plan, { completed, reflection, joyNoticed: completed ? 'Small obedience without hurry.' : '', missedReason: 'schedule crowded' })
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    saveHabitCheckin(result.checkin)
    const review = generateHabitReview(userId, plan, [...data.habitCheckins, result.checkin])
    saveHabitReview(review)
    setNotice(result.guidance.message)
    onRefresh()
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('圣洁习惯计划', 'Holy Habit Planner')}</h2><p>Daily, weekly, and monthly practices with grace, review, and adjustment.</p></div>
      <div className="sf-home-grid">
        <article className="sf-card sf-flow-card">
          <h3>Recommend habits</h3>
          <label>Formation need<textarea value={need} onChange={(event) => setNeed(event.target.value)} /></label>
          <div className="sf-chip-row">{recommendations.map((habit) => <button key={habit.key} className={`sf-chip-btn ${selectedKey === habit.key ? 'active' : ''}`} type="button" onClick={() => setSelectedKey(habit.key)}>{habit.title}</button>)}</div>
          <label>Habit<select value={selectedKey} onChange={(event) => setSelectedKey(event.target.value)}>{holyHabitTemplates.map((habit) => <option key={habit.key} value={habit.key}>{habit.title}</option>)}</select></label>
          <button className="sf-primary" type="button" onClick={createPlan}>Create Habit Plan</button>
        </article>
        <article className="sf-card sf-flow-card">
          <h3>Today habits</h3>
          {todayHabits.length ? todayHabits.map((plan) => <div className="sf-insight-row" key={plan.id}><b>{plan.title}</b><p>{plan.graceMinimum}</p><span>{plan.cadence} · {plan.durationMinutes} min</span></div>) : <p className="sf-empty">No habits due today. Create one above.</p>}
        </article>
      </div>
      <article className="sf-card sf-flow-card">
        <h3>Habit check-in</h3>
        <label>Active plan<select value={activePlan?.id || ''} onChange={(event) => setActivePlanId(event.target.value)}><option value="">Choose plan</option>{data.habitPlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}</select></label>
        <label>Reflection<textarea value={reflection} onChange={(event) => setReflection(event.target.value)} /></label>
        <div className="sf-plan-actions"><button className="sf-primary" type="button" onClick={() => checkIn(true)}>Complete Habit Check-In</button><button type="button" onClick={() => checkIn(false)}>Missed, Return Gently</button></div>
      </article>
      <SummaryCard title="Habit Summary" items={[{ label: 'Plans', value: String(data.habitPlans.length) }, { label: 'Check-ins', value: String(data.habitCheckins.length) }, { label: 'Reviews', value: data.habitReviews.map((review) => review.summary).slice(0, 2) }]} />
      <Notice text={notice} />
    </section>
  )
}

export function SabbathPlanner({ userId, data, onRefresh }) {
  const [auditForm, setAuditForm] = useState({ sleepHours: 6, workPressure: 8, phoneCompulsion: 7, restGuilt: 7, worshipDisrupted: true })
  const [session, setSession] = useState(null)
  const [notice, setNotice] = useState('')
  const activePlan = data.sabbathPlans.find((plan) => plan.status === 'active')
  const latestAudit = data.restAudits[0]
  const analysis = latestAudit ? analyzeRestBlockers(latestAudit) : null

  function saveAudit() {
    const audit = createRestAudit(userId, auditForm)
    saveRestAudit(audit)
    setNotice(analyzeRestBlockers(audit).warning)
    onRefresh()
  }

  function createPlan() {
    const practices = analysis?.recommendedPractices?.map((practice) => practice.key) || ['phone_free_morning', 'slow_meal_gratitude']
    const plan = createSabbathPlan(userId, { practices })
    const boundary = createRestBoundaryRule(userId, { ruleText: 'No work email during the Sabbath rest block.' })
    saveSabbathPlan(plan)
    saveBoundaryRule(boundary)
    setNotice('Sabbath plan and rest boundary created.')
    onRefresh()
  }

  function startSession() {
    const plan = activePlan || createSabbathPlan(userId, {})
    if (!activePlan) saveSabbathPlan(plan)
    const next = createSabbathSession(userId, plan, {})
    saveSabbathSession(next)
    setSession(next)
    onRefresh()
  }

  function completeSession() {
    const next = completeSabbathSession(session, { restAfter: 8, gratitude: 'A slow meal and worship preparation were gifts.' })
    saveSabbathSession(next)
    const review = generateSabbathReview(userId, [...data.sabbathSessions, next])
    saveSabbathReview(review)
    setSession(next)
    setNotice(review.recommendedAdjustment)
    onRefresh()
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('安息与休息操练', 'Sabbath & Rest Formation')}</h2><p>Resist productivity idols and restore worship, trust, body, and delight.</p></div>
      <div className="sf-home-grid">
        <article className="sf-card sf-flow-card">
          <h3>Rest audit</h3>
          <label>Sleep hours<input type="number" value={auditForm.sleepHours} onChange={(event) => setAuditForm({ ...auditForm, sleepHours: Number(event.target.value) })} /></label>
          <label>Work pressure<input type="number" min="0" max="10" value={auditForm.workPressure} onChange={(event) => setAuditForm({ ...auditForm, workPressure: Number(event.target.value) })} /></label>
          <label>Phone compulsion<input type="number" min="0" max="10" value={auditForm.phoneCompulsion} onChange={(event) => setAuditForm({ ...auditForm, phoneCompulsion: Number(event.target.value) })} /></label>
          <label>Rest guilt<input type="number" min="0" max="10" value={auditForm.restGuilt} onChange={(event) => setAuditForm({ ...auditForm, restGuilt: Number(event.target.value) })} /></label>
          <label><input type="checkbox" checked={auditForm.worshipDisrupted} onChange={(event) => setAuditForm({ ...auditForm, worshipDisrupted: event.target.checked })} /> Worship disrupted</label>
          <button className="sf-primary" type="button" onClick={saveAudit}>Save Rest Audit</button>
        </article>
        <article className="sf-card sf-flow-card">
          <h3>Recommended practices</h3>
          <div className="sf-chip-row">{(analysis?.recommendedPractices || restPractices.slice(0, 3)).map((practice) => <span className="sf-chip" key={practice.key}>{practice.title}</span>)}</div>
          <p>{analysis?.warning || 'Audit rest blockers to receive a concrete practice set.'}</p>
          <button type="button" onClick={createPlan}>Create Sabbath Plan</button>
        </article>
      </div>
      <article className="sf-card sf-flow-card">
        <h3>Sabbath session</h3>
        {activePlan && <p>{activePlan.title}: {activePlan.practices.join(', ')}</p>}
        <div className="sf-plan-actions"><button className="sf-primary" type="button" onClick={startSession}>Start Sabbath Session</button>{session && session.status !== 'completed' && <button type="button" onClick={completeSession}>Complete Sabbath Session</button>}</div>
      </article>
      <SummaryCard title="Sabbath Summary" items={[{ label: 'Plans', value: String(data.sabbathPlans.length) }, { label: 'Sessions', value: String(data.sabbathSessions.length) }, { label: 'Boundaries', value: data.boundaryRules.map((rule) => rule.ruleText).slice(0, 3) }]} />
      <Notice text={notice} />
    </section>
  )
}

export function FastingSimplicityPlanner({ userId, data, onRefresh }) {
  const [need, setNeed] = useState('phone and social media distraction')
  const [practiceKey, setPracticeKey] = useState('social_media_24h_fast')
  const [healthAcknowledgement, setHealthAcknowledgement] = useState(false)
  const [activePlanId, setActivePlanId] = useState('')
  const [notice, setNotice] = useState('')
  const recommendation = recommendFastingPractice(userId, need)
  const activePlan = data.fastingPlans.find((plan) => plan.id === activePlanId) || data.fastingPlans[0]
  const selectedPractice = fastingPractices.find((practice) => practice.key === practiceKey) || recommendation.practice

  function createPlan() {
    const result = createFastingPlan(userId, practiceKey, {
      motive: need,
      healthAcknowledgement,
      healthContext: need,
    })
    if (result.blocked) {
      setNotice(result.guidance.message)
      return
    }
    saveFastingPlan(result.plan)
    setActivePlanId(result.plan.id)
    setNotice(result.guidance.message)
    onRefresh()
  }

  function checkIn() {
    const plan = activePlan || createFastingPlan(userId, practiceKey, { healthAcknowledgement: true }).plan
    if (!activePlan) saveFastingPlan(plan)
    const result = createFastingCheckin(userId, plan, { desireNoticed: 'I noticed the urge to reach for comfort.', prayerResponse: 'Lord, turn desire toward love.', generosityResponse: 'I will give time to a person.' })
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    saveFastingCheckin(result.checkin)
    const review = generateFastingReview(userId, plan, [...data.fastingCheckins, result.checkin])
    saveFastingReview(review)
    setNotice(result.guidance.message)
    onRefresh()
  }

  function simplicityAudit() {
    const audit = createSimplicityAudit(userId, { clutterScore: 6, spendingPressure: 8, comparisonPressure: 6, digitalNoise: 8, generosityReadiness: 7, notes: need })
    const action = createSimplicityAction(userId, audit, { actionText: analyzeSimplicityAudit(audit).recommendedAction })
    saveSimplicityAudit(audit)
    saveSimplicityAction(action)
    setNotice(action.actionText)
    onRefresh()
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('禁食与简朴操练', 'Fasting & Simplicity')}</h2><p>Train desire toward dependence, freedom, generosity, and love. Never practice unsafe fasting.</p></div>
      <div className="sf-home-grid">
        <article className="sf-card sf-flow-card">
          <h3>Choose fast</h3>
          <label>Formation need<textarea value={need} onChange={(event) => setNeed(event.target.value)} /></label>
          <label>Practice<select value={practiceKey} onChange={(event) => setPracticeKey(event.target.value)}>{fastingPractices.map((practice) => <option key={practice.key} value={practice.key}>{practice.title}</option>)}</select></label>
          <p>{selectedPractice.healthCaution || selectedPractice.description}</p>
          {selectedPractice.fastingType === 'food' && <label><input type="checkbox" checked={healthAcknowledgement} onChange={(event) => setHealthAcknowledgement(event.target.checked)} /> I have no health, medical, coercion, pregnancy, eating-disorder, or self-punishment risk for this food fast.</label>}
          <button className="sf-primary" type="button" onClick={createPlan}>Create Fasting Plan</button>
        </article>
        <article className="sf-card sf-flow-card">
          <h3>Recommended alternative</h3>
          <p><b>{recommendation.practice.title}</b></p>
          <p>{recommendation.guidance.message}</p>
          <div className="sf-chip-row">{recommendation.alternatives.map((practice) => <span className="sf-chip" key={practice.key}>{practice.title}</span>)}</div>
        </article>
      </div>
      <article className="sf-card sf-flow-card">
        <h3>Check-in and simplicity</h3>
        <label>Active fasting plan<select value={activePlan?.id || ''} onChange={(event) => setActivePlanId(event.target.value)}><option value="">Choose plan</option>{data.fastingPlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}</select></label>
        <div className="sf-plan-actions"><button type="button" onClick={checkIn}>Complete Fasting Check-In</button><button type="button" onClick={simplicityAudit}>Run Simplicity Audit</button></div>
      </article>
      <SummaryCard title="Fasting & Simplicity Summary" items={[{ label: 'Fasting plans', value: String(data.fastingPlans.length) }, { label: 'Check-ins', value: String(data.fastingCheckins.length) }, { label: 'Simplicity actions', value: data.simplicityActions.map((action) => action.actionText).slice(0, 3) }]} />
      <Notice text={notice} />
    </section>
  )
}

export default function HolyHabitDashboard({ userId = 'local-user' }) {
  const [tab, setTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const [intent, setIntent] = useState('I am exhausted and need rest boundaries')
  const data = useMemo(() => loadHolyHabitData(userId), [userId, refreshKey])
  const dashboard = useMemo(() => buildHolyHabitDashboard({ userId, ...data }), [userId, data])
  const route = orchestrateHolyHabitIntent(userId, intent, { restAudit: data.restAudits[0] })
  const refresh = () => setRefreshKey((value) => value + 1)

  return (
    <section className="sf-module">
      <div className="sf-section-heading">
        <h2>Rule of Life & Holy Habit Engine / 生活规则与圣洁习惯引擎</h2>
        <p>{MODULE_DISCLAIMER}</p>
      </div>
      <MiniTabs active={tab} onChange={setTab} />
      {tab === 'dashboard' && (
        <section className="sf-section">
          <div className="sf-home-grid">
            <SummaryCard title="Active Rule" items={[{ label: 'Rule', value: dashboard.activeRule?.title || 'No active rule' }, { label: 'Commitments', value: String(dashboard.commitments.length) }, { label: 'Adjustment', value: dashboard.recommendedAdjustment }]} />
            <SummaryCard title="Today Habits" items={[{ label: 'Due today', value: String(dashboard.todayHabits.length) }, { label: 'Completed today', value: String(dashboard.habitCompletionSummary.todayCompleted) }, { label: 'Total check-ins', value: String(dashboard.habitCompletionSummary.totalCheckins) }]} />
            <SummaryCard title="Rest and Fasting" items={[{ label: 'Next Sabbath', value: dashboard.nextSabbath?.weeklyDay || 'No plan' }, { label: 'Active fast', value: dashboard.activeFastingPlan?.title || 'No active fast' }, { label: 'Rest warning', value: dashboard.restWarning }]} />
          </div>
          <article className="sf-card sf-flow-card">
            <h3>Orchestrator</h3>
            <label>Intent<textarea value={intent} onChange={(event) => setIntent(event.target.value)} /></label>
            <p><b>{route.route}</b>: {route.message}</p>
            <span className="sf-status">{route.nextEndpoint}</span>
          </article>
        </section>
      )}
      {tab === 'rule' && <RuleOfLifeBuilder userId={userId} data={data} onRefresh={refresh} />}
      {tab === 'habits' && <HolyHabitPlanner userId={userId} data={data} onRefresh={refresh} />}
      {tab === 'sabbath' && <SabbathPlanner userId={userId} data={data} onRefresh={refresh} />}
      {tab === 'fasting' && <FastingSimplicityPlanner userId={userId} data={data} onRefresh={refresh} />}
    </section>
  )
}
