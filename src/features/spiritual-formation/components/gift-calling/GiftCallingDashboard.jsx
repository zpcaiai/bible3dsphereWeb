import { T } from '../../lib/localize'
import { useMemo, useState } from 'react'
import { callingDomains, giftAssessmentItems, giftCallingMinistryAreas, ministryOpportunityTemplates, missionDomains, spiritualGiftDefinitions } from '../../data/giftCallingSeed'
import {
  addCallingInput,
  addGiftFeedback,
  addMissionProjectLog,
  analyzeCalling,
  buildGiftCallingDashboard,
  createCallingExperiment,
  createCallingPattern,
  createCallingSession,
  createCapacityProfile,
  createMinistryOpportunity,
  createMissionCommitment,
  createMissionLifeProfile,
  createMissionProject,
  createServiceTrial,
  designMissionLife,
  generateGiftProfile,
  generateMinistryMatches,
  generateMissionLifeReview,
  listGiftAssessmentItems,
  orchestrateGiftCallingIntent,
  reviewCallingExperiment,
  reviewServiceTrial,
  startGiftAssessment,
  submitGiftAssessment,
} from '../../lib/giftCallingEngine'
import { GIFT_CALLING_STORAGE_KEYS as KEYS, loadGiftCallingData, saveGiftCallingEntry } from '../../lib/giftCallingStorage'
import { MODULE_DISCLAIMER } from '../../lib/pastoralSafety'
import PlanExecutionPanel from '../../../../components/PlanExecutionPanel'

function MiniTabs({ active, onChange }) {
  const tabs = [
    ['dashboard', 'Dashboard'],
    ['gifts', 'Gifts'],
    ['calling', 'Calling'],
    ['ministry', 'Ministry'],
    ['mission', 'Mission Life'],
  ]
  return <nav className="sf-tabs" aria-label="Gift calling sections">{tabs.map(([id, label]) => <button key={id} className={active === id ? 'active' : ''} type="button" onClick={() => onChange(id)}>{label}</button>)}</nav>
}

function Notice({ text }) {
  if (!text) return null
  const warning = /risk|care|crisis|burnout|abuse|pressure|guardrail|route|耗尽|危机|伤害/.test(text)
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
  entries.filter(Boolean).forEach(([key, entry]) => saveGiftCallingEntry(key, entry))
}

function first(list) {
  return Array.isArray(list) && list.length ? list[0] : null
}

export function GiftCallingOverview({ userId, data }) {
  const [intent, setIntent] = useState('What gifts do I have, and where should I serve without burning out?')
  const dashboard = useMemo(() => buildGiftCallingDashboard({ ...data, userId }), [data, userId])
  const route = orchestrateGiftCallingIntent(userId, intent)

  return (
    <section className="sf-section">
      <div className="sf-section-heading">
        <h2>Gift, Calling & Mission OS / 恩赐、呼召与使命系统</h2>
        <p>{MODULE_DISCLAIMER}</p>
      </div>
      <article className="sf-card sf-flow-card">
        <label>Discernment intent<textarea value={intent} onChange={(event) => setIntent(event.target.value)} /></label>
        <div className="sf-card-head"><h3>Recommended route</h3><span className="sf-status">{route.route}</span></div>
        <p>{route.message}</p>
        <p className="sf-muted">{route.nextEndpoint}</p>
      </article>
      <div className="sf-home-grid">
        <SummaryCard title="Today" items={[
          { label: 'Latest gift profile', value: dashboard.today.latestGiftProfile?.primaryGifts?.[0]?.giftKey || 'None yet' },
          { label: 'Calling patterns', value: String(dashboard.today.activeCallingPatterns.length) },
          { label: 'Experiments', value: String(dashboard.today.activeCallingExperiments.length) },
          { label: 'Ministry matches', value: String(dashboard.today.ministryMatches.length) },
          { label: 'Service trials', value: String(dashboard.today.activeServiceTrials.length) },
          { label: 'Mission profile', value: dashboard.today.missionLifeProfile?.title || 'None yet' },
          { label: 'Urgent flags', value: dashboard.today.urgentFlags.length ? dashboard.today.urgentFlags : 'none' },
        ]} />
        <SummaryCard title="Weekly Summary" items={[
          { label: 'Gift feedback', value: String(dashboard.weeklySummary.giftFeedbackEntries) },
          { label: 'Calling inputs', value: String(dashboard.weeklySummary.callingInputsAdded) },
          { label: 'Experiment reviews', value: String(dashboard.weeklySummary.callingExperimentsReviewed) },
          { label: 'Trial reviews', value: String(dashboard.weeklySummary.ministryTrialsUpdated) },
          { label: 'Mission logs', value: String(dashboard.weeklySummary.missionProjectLogs) },
        ]} />
        <article className="sf-card">
          <h3>Calling insights</h3>
          {dashboard.callingInsights.length ? dashboard.callingInsights.map((insight) => <div className="sf-insight-row" key={insight.type}><b>{insight.summary}</b><p>{insight.recommendedNextAction}</p><span>{insight.type}</span></div>) : <p className="sf-empty">No insights yet. Start with gifts, calling, ministry, or mission life.</p>}
        </article>
      </div>
    </section>
  )
}

export function SpiritualGiftsAssessment({ userId, data, onRefresh }) {
  const [context, setContext] = useState('I enjoy explaining Scripture, encouraging people, and serving quietly.')
  const [notice, setNotice] = useState('')
  const latestProfile = first(data.giftProfiles)
  const topItems = listGiftAssessmentItems().slice(0, 12)
  const [answers, setAnswers] = useState(() => Object.fromEntries(topItems.map((item) => [item.key, 3])))
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackGifts, setFeedbackGifts] = useState('')

  function createAssessment() {
    const assessment = startGiftAssessment(userId, { contextNote: context })
    const result = submitGiftAssessment(userId, assessment, answers)
    saveMany([
      [KEYS.giftAssessments, result.assessment],
      ...result.scores.map((score) => [KEYS.giftScores, score]),
      [KEYS.giftProfiles, result.profile],
    ])
    setNotice(result.assessment.riskFlags.length ? 'Gift assessment saved with care route flag.' : 'Gift assessment completed and possible profile generated.')
    onRefresh()
  }

  function addFeedbackAndRegenerate() {
    const observedGiftKeys = feedbackGifts.split(',').map((item) => item.trim()).filter(Boolean)
    if (!feedbackText.trim() || !observedGiftKeys.length) return
    const feedback = addGiftFeedback(userId, {
      observedGiftKeys,
      evidenceText: feedbackText.trim(),
      ministryContext: context,
    })
    const assessment = first(data.giftAssessments) || startGiftAssessment(userId, { contextNote: context })
    const scores = data.giftScores.filter((score) => score.assessmentId === assessment.id)
    const profile = generateGiftProfile(userId, assessment, scores, [feedback, ...data.giftFeedbackEntries])
    saveMany([[KEYS.giftFeedbackEntries, feedback], [KEYS.giftProfiles, profile]])
    setNotice('Community feedback added and gift profile regenerated.')
    setFeedbackText('')
    onRefresh()
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('属灵恩赐评估', 'Spiritual Gifts Assessment')}</h2><p>Gifts are possible evidence to test in love, character, service, fruit, and community confirmation.</p></div>
      <article className="sf-card sf-flow-card">
        <label>Assessment context<textarea value={context} onChange={(event) => setContext(event.target.value)} /></label>
        {topItems.map((item) => <label key={item.key}>{item.questionText}<input aria-label={item.key} type="range" min="1" max="5" value={answers[item.key]} onChange={(event) => setAnswers((current) => ({ ...current, [item.key]: Number(event.target.value) }))} /><span>{answers[item.key]}</span></label>)}
        <button className="sf-primary" type="button" onClick={createAssessment}>Complete Gift Assessment</button>
        <label>Mentor-observed gift keys<input value={feedbackGifts} onChange={(event) => setFeedbackGifts(event.target.value)} placeholder="teaching, encouragement" /></label>
        <label>Mentor feedback actually received<textarea value={feedbackText} onChange={(event) => setFeedbackText(event.target.value)} /></label>
        <button type="button" disabled={!feedbackText.trim() || !feedbackGifts.trim()} onClick={addFeedbackAndRegenerate}>Add Mentor Feedback</button>
      </article>
      <div className="sf-home-grid">
        <SummaryCard title="Seed catalog" items={[
          { label: 'Gift definitions', value: String(spiritualGiftDefinitions.length) },
          { label: 'Assessment items', value: String(giftAssessmentItems.length) },
          { label: 'Visible questions', value: topItems.map((item) => item.key).slice(0, 4) },
        ]} />
        <article className="sf-card">
          <h3>Latest gift profile</h3>
          {latestProfile ? <><ul>{latestProfile.primaryGifts.map((gift) => <li key={gift.giftKey}>{gift.label} · {gift.score}</li>)}</ul><p>{latestProfile.summary}</p><div className="sf-chip-row">{latestProfile.misuseRisks.map((risk) => <span className="sf-chip" key={risk}>{risk}</span>)}</div></> : <p className="sf-empty">No gift profile yet.</p>}
        </article>
        <article className="sf-card"><h3>Question sample</h3><ul>{topItems.slice(0, 6).map((item) => <li key={item.key}>{item.questionText}</li>)}</ul></article>
      </div>
      <Notice text={notice} />
    </section>
  )
}

export function CallingDiscernmentWizard({ userId, data, onRefresh }) {
  const [context, setContext] = useState('I feel burdened to teach new believers and help them read Scripture.')
  const [notice, setNotice] = useState('')
  const latestProfile = first(data.giftProfiles)
  const session = first(data.callingSessions)
  const pattern = first(data.callingPatterns)
  const experiment = first(data.callingExperiments)
  const [energyLevel, setEnergyLevel] = useState(6)
  const [fruitObserved, setFruitObserved] = useState('')
  const [feedbackReceived, setFeedbackReceived] = useState('')

  function createSessionAndPattern() {
    const createdSession = createCallingSession(userId, { title: 'Teaching discernment', discernmentQuestion: context })
    const inputs = [addCallingInput(userId, createdSession, { inputType: 'burden', title: 'User-described burden', description: context })]
    const analysis = analyzeCalling(userId, createdSession, inputs, latestProfile)
    const createdPattern = createCallingPattern(userId, analysis)
    saveMany([[KEYS.callingSessions, createdSession], ...inputs.map((input) => [KEYS.callingInputs, input]), [KEYS.callingPatterns, createdPattern]])
    setNotice(analysis.routed ? 'Calling analysis saved with care route flag.' : 'Calling pattern created as possible and testable.')
    onRefresh()
  }

  function createExperimentFlow() {
    const activePattern = pattern || createCallingPattern(userId, analyzeCalling(userId, session || createCallingSession(userId), data.callingInputs, latestProfile))
    const createdExperiment = createCallingExperiment(userId, activePattern, {})
    saveMany([[KEYS.callingPatterns, activePattern], [KEYS.callingExperiments, createdExperiment]])
    setNotice('Calling experiment created.')
    onRefresh()
  }

  function reviewExperimentFlow() {
    if (!experiment || !fruitObserved.trim()) return
    const review = reviewCallingExperiment(userId, experiment, { energyLevel, fruitObserved: [fruitObserved.trim()], feedbackReceived: feedbackReceived.trim() ? [feedbackReceived.trim()] : [] })
    saveMany([[KEYS.callingExperimentReviews, review]])
    setNotice(review.summary)
    onRefresh()
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('呼召分辨', 'Calling Discernment')}</h2><p>Calling is clarified through faithful experiments, fruit, community confirmation, and wisdom.</p></div>
      <article className="sf-card sf-flow-card">
        <label>Discernment question<textarea value={context} onChange={(event) => setContext(event.target.value)} /></label>
        <div className="sf-plan-actions"><button className="sf-primary" type="button" onClick={createSessionAndPattern}>Analyze Calling Pattern</button><button type="button" onClick={createExperimentFlow}>Create Calling Experiment</button></div>
        <label>Experiment energy level<input type="range" min="1" max="10" value={energyLevel} onChange={(event) => setEnergyLevel(Number(event.target.value))} /><span>{energyLevel}</span></label>
        <label>Fruit actually observed<textarea value={fruitObserved} onChange={(event) => setFruitObserved(event.target.value)} /></label>
        <label>Feedback actually received (optional)<textarea value={feedbackReceived} onChange={(event) => setFeedbackReceived(event.target.value)} /></label>
        <button type="button" disabled={!experiment || !fruitObserved.trim()} onClick={reviewExperimentFlow}>Review Calling Experiment</button>
      </article>
      <div className="sf-home-grid">
        <SummaryCard title="Calling state" items={[
          { label: 'Sessions', value: String(data.callingSessions.length) },
          { label: 'Inputs', value: String(data.callingInputs.length) },
          { label: 'Patterns', value: String(data.callingPatterns.length) },
          { label: 'Experiments', value: String(data.callingExperiments.length) },
          { label: 'Reviews', value: String(data.callingExperimentReviews.length) },
        ]} />
        <article className="sf-card"><h3>Latest pattern</h3>{pattern ? <><p><b>{pattern.title}</b></p><p>{pattern.confidenceLevel} · {pattern.status}</p><ul>{pattern.cautions.map((item) => <li key={item}>{item}</li>)}</ul></> : <p className="sf-empty">No calling pattern yet.</p>}</article>
        <article className="sf-card"><h3>Domains</h3><div className="sf-chip-row">{callingDomains.slice(0, 10).map((domain) => <span className="sf-chip" key={domain.key}>{domain.key}</span>)}</div></article>
      </div>
      {experiment ? <PlanExecutionPanel userId={userId} planId={`calling-experiment:${experiment.id}`} title="Calling experiment execution" actions={(experiment.successCriteria || []).map((title, index) => ({ id: `criterion-${index + 1}`, title, cadence: 'once' }))} /> : null}
      <Notice text={notice} />
    </section>
  )
}

export function MinistryMatchPanel({ userId, data, onRefresh }) {
  const [burnout, setBurnout] = useState(3)
  const [notice, setNotice] = useState('')
  const profile = first(data.giftProfiles)
  const capacity = first(data.capacityProfiles)
  const match = first(data.ministryMatches)
  const trial = first(data.serviceTrials)
  const [trialFruit, setTrialFruit] = useState('')

  function createCapacityAndMatches() {
    const capacityProfile = createCapacityProfile(userId, { weeklyAvailableHours: burnout >= 7 ? 1 : 3, currentBurnoutLevel: burnout, emotionalCapacity: burnout >= 7 ? 3 : 7, leadershipReadiness: 4 })
    const opportunities = ministryOpportunityTemplates.map((template) => ({ ...template, id: template.id }))
    const matches = generateMinistryMatches(userId, opportunities, profile, data.callingPatterns, capacityProfile)
    saveMany([[KEYS.capacityProfiles, capacityProfile], ...matches.map((item) => [KEYS.ministryMatches, item])])
    setNotice(burnout >= 7 ? 'Capacity guardrail applied. High-demand roles are reduced.' : 'Ministry matches generated with capacity guardrails.')
    onRefresh()
  }

  function createOpportunityAndTrial() {
    const opportunity = createMinistryOpportunity(userId, { templateKey: 'welcome_team_once_month' })
    const activeMatch = match || generateMinistryMatches(userId, [opportunity], profile, data.callingPatterns, capacity)[0]
    const serviceTrial = createServiceTrial(userId, activeMatch, {})
    saveMany([[KEYS.ministryOpportunities, opportunity], [KEYS.ministryMatches, activeMatch], [KEYS.serviceTrials, serviceTrial]])
    setNotice('Service trial created with observe-first starting step.')
    onRefresh()
  }

  function reviewTrialFlow() {
    if (!trial || !trialFruit.trim()) return
    const review = reviewServiceTrial(userId, trial, { energyCostScore: burnout, fruitEvidence: [trialFruit.trim()] })
    saveMany([[KEYS.serviceReviews, review]])
    setNotice(review.summary)
    onRefresh()
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('服事匹配', 'Ministry Match')}</h2><p>Matching uses gifts, calling, maturity, capacity, church need, and safety boundaries.</p></div>
      <article className="sf-card sf-flow-card">
        <label>Burnout level <input type="range" min="1" max="10" value={burnout} onChange={(event) => setBurnout(Number(event.target.value))} /><span>{burnout}</span></label>
        <div className="sf-plan-actions"><button className="sf-primary" type="button" onClick={createCapacityAndMatches}>Generate Ministry Matches</button><button type="button" onClick={createOpportunityAndTrial}>Create Service Trial</button></div>
        <label>Fruit or concern actually observed<textarea value={trialFruit} onChange={(event) => setTrialFruit(event.target.value)} /></label><button type="button" disabled={!trial || !trialFruit.trim()} onClick={reviewTrialFlow}>Review Service Trial</button>
      </article>
      <div className="sf-home-grid">
        <SummaryCard title="Ministry state" items={[
          { label: 'Areas', value: String(giftCallingMinistryAreas.length) },
          { label: 'Capacity profiles', value: String(data.capacityProfiles.length) },
          { label: 'Matches', value: String(data.ministryMatches.length) },
          { label: 'Trials', value: String(data.serviceTrials.length) },
          { label: 'Reviews', value: String(data.serviceReviews.length) },
        ]} />
        <article className="sf-card"><h3>Top match</h3>{match ? <><p><b>{match.opportunity?.title}</b></p><p>Score {match.matchScore}</p><ul>{match.reasons.map((item) => <li key={item}>{item}</li>)}</ul><div className="sf-chip-row">{match.cautions.map((item) => <span className="sf-chip" key={item}>{item}</span>)}</div></> : <p className="sf-empty">No ministry match yet.</p>}</article>
        <article className="sf-card"><h3>Capacity guardrail</h3><p>{capacity?.boundaryNotes || 'Create capacity profile before matching. Burned-out users should not be matched into high-demand roles.'}</p></article>
      </div>
      {trial ? <PlanExecutionPanel userId={userId} planId={`service-trial:${trial.id}`} title="Service trial execution" actions={(trial.successCriteria || []).map((title, index) => ({ id: `criterion-${index + 1}`, title, cadence: 'once' }))} /> : null}
      <Notice text={notice} />
    </section>
  )
}

export function MissionLifeDesigner({ userId, data, onRefresh }) {
  const [lifeSeason, setLifeSeason] = useState('single_worker')
  const [context, setContext] = useState('I want to connect my work, church life, money, time, hospitality, and rest with mission.')
  const [notice, setNotice] = useState('')
  const profile = first(data.missionProfiles)
  const project = first(data.missionProjects)
  const design = profile ? designMissionLife(userId, profile, first(data.giftProfiles), data.callingPatterns, context) : null
  const [actionTaken, setActionTaken] = useState('')

  function createProfileAndCommitments() {
    const missionProfile = createMissionLifeProfile(userId, { lifeSeason, vocationSummary: context, workContext: context })
    const missionDesign = designMissionLife(userId, missionProfile, first(data.giftProfiles), data.callingPatterns, context)
    const commitments = missionDesign.recommendedDomains.slice(0, 3).map((domain) => createMissionCommitment(userId, missionProfile, {
      domainKey: domain.domain,
      commitmentDescription: domain.commitment,
      minimumViableAction: domain.minimumViableAction,
    }))
    saveMany([[KEYS.missionProfiles, missionProfile], ...commitments.map((commitment) => [KEYS.missionCommitments, commitment])])
    setNotice(missionProfile.riskFlags.length ? 'Mission profile saved with care route flag.' : 'Mission life profile and commitments created.')
    onRefresh()
  }

  function createProject() {
    const activeProfile = profile || createMissionLifeProfile(userId, { lifeSeason, vocationSummary: context })
    const missionProject = createMissionProject(userId, activeProfile, {})
    saveMany([[KEYS.missionProfiles, activeProfile], [KEYS.missionProjects, missionProject]])
    setNotice('Mission project created; no action is counted until you record it.')
    onRefresh()
  }

  function saveProjectLog() {
    if (!project || !actionTaken.trim()) return
    const log = addMissionProjectLog(userId, project, { actionTaken: actionTaken.trim(), fruitObserved: [], prayerNeeds: [], nextStep: '' })
    saveMany([[KEYS.missionProjectLogs, log]])
    setActionTaken('')
    setNotice('Mission action log saved from your entry.')
    onRefresh()
  }

  function createReview() {
    const activeProfile = profile || createMissionLifeProfile(userId, { lifeSeason, vocationSummary: context })
    const review = generateMissionLifeReview(userId, activeProfile, data.missionCommitments, data.missionProjects, data.missionProjectLogs)
    saveMany([[KEYS.missionProfiles, activeProfile], [KEYS.missionLifeReviews, review]])
    setNotice(review.summary)
    onRefresh()
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('使命生活设计', 'Mission Life Design')}</h2><p>Whole-life stewardship includes vocation, family, church, money, time, skills, neighbor love, and rest.</p></div>
      <article className="sf-card sf-flow-card">
        <div className="sf-form-grid">
          <label>Life season<select value={lifeSeason} onChange={(event) => setLifeSeason(event.target.value)}>{['student', 'single_worker', 'married', 'parent', 'caregiver', 'ministry_worker', 'entrepreneur', 'academic', 'retired', 'transition', 'suffering', 'rebuilding', 'custom'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label>Mission context<textarea value={context} onChange={(event) => setContext(event.target.value)} /></label>
        </div>
        <div className="sf-plan-actions"><button className="sf-primary" type="button" onClick={createProfileAndCommitments}>Design Mission Life</button><button type="button" onClick={createProject}>Create Project</button><button type="button" onClick={createReview}>Generate Mission Review</button></div>
        <label>Mission action actually taken<textarea value={actionTaken} onChange={(event) => setActionTaken(event.target.value)} /></label><button type="button" disabled={!project || !actionTaken.trim()} onClick={saveProjectLog}>Save Mission Action Log</button>
      </article>
      <div className="sf-home-grid">
        <SummaryCard title="Mission state" items={[
          { label: 'Domains', value: String(missionDomains.length) },
          { label: 'Profiles', value: String(data.missionProfiles.length) },
          { label: 'Commitments', value: String(data.missionCommitments.length) },
          { label: 'Projects', value: String(data.missionProjects.length) },
          { label: 'Logs', value: String(data.missionProjectLogs.length) },
          { label: 'Reviews', value: String(data.missionLifeReviews.length) },
        ]} />
        <article className="sf-card"><h3>Mission design</h3>{design ? <><p>{design.missionSummary}</p><ul>{design.recommendedDomains.map((domain) => <li key={domain.domain}>{domain.domain}: {domain.minimumViableAction}</li>)}</ul></> : <p className="sf-empty">Create mission profile to see design.</p>}</article>
        <article className="sf-card"><h3>Active project</h3>{project ? <p>{project.title} · {project.status}</p> : <p className="sf-empty">No mission project yet.</p>}</article>
      </div>
      {data.missionCommitments.length > 0 ? <PlanExecutionPanel userId={userId} planId={`mission-commitments:${profile?.id || 'current'}`} title="Mission commitments execution" actions={data.missionCommitments.map((commitment) => ({ id: commitment.id, title: commitment.commitmentDescription, cadence: commitment.practiceFrequency || 'weekly', minimum: commitment.minimumViableAction }))} /> : null}
      <Notice text={notice} />
    </section>
  )
}

export default function GiftCallingDashboard({ userId }) {
  const [tab, setTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const data = useMemo(() => loadGiftCallingData(userId), [userId, refreshKey])
  const refresh = () => setRefreshKey((value) => value + 1)

  return (
    <>
      <MiniTabs active={tab} onChange={setTab} />
      {tab === 'dashboard' && <GiftCallingOverview userId={userId} data={data} />}
      {tab === 'gifts' && <SpiritualGiftsAssessment userId={userId} data={data} onRefresh={refresh} />}
      {tab === 'calling' && <CallingDiscernmentWizard userId={userId} data={data} onRefresh={refresh} />}
      {tab === 'ministry' && <MinistryMatchPanel userId={userId} data={data} onRefresh={refresh} />}
      {tab === 'mission' && <MissionLifeDesigner userId={userId} data={data} onRefresh={refresh} />}
    </>
  )
}
