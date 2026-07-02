import { T } from '../../lib/localize'
import { useMemo, useState } from 'react'
import { intercessionCategories, prayerTemplates, presencePractices, psalmProfiles } from '../../data/prayerCommunionSeed'
import {
  buildPrayerDashboard,
  completeIntercessionSession,
  completePrayerSession,
  completePresenceCheckin,
  completePsalmPrayerSession,
  createDefaultPrayerRule,
  createIntercessionTarget,
  createPrayerRequest,
  createPresenceCheckin,
  createPresenceRule,
  detectOverburdeningRule,
  generateIntercessionPrompt,
  generatePresenceReflection,
  generateRuleReview,
  getTodayIntercessionPlan,
  getTodayPrayerPlan,
  markIntercessionItemPrayed,
  markPrayerRequestAnswered,
  orchestratePrayerIntent,
  recommendPresencePractice,
  recommendPsalm,
  startIntercessionSession,
  startPrayerSession,
  startPsalmPrayerSession,
  submitPsalmMovement,
} from '../../lib/prayerCommunionEngine'
import {
  loadPrayerCommunionData,
  saveIntercessionSession,
  saveIntercessionTarget,
  savePrayerRequest,
  savePrayerRule,
  savePrayerSession,
  savePresenceCheckin,
  savePresenceRule,
  savePsalmSession,
} from '../../lib/prayerCommunionStorage'
import { MODULE_DISCLAIMER } from '../../lib/pastoralSafety'

function MiniTabs({ active, onChange }) {
  const tabs = [
    ['dashboard', 'Dashboard'],
    ['rule', 'Prayer Rule'],
    ['intercession', 'Intercession'],
    ['psalms', 'Psalms'],
    ['presence', 'Presence'],
  ]
  return <nav className="sf-tabs" aria-label="Prayer Communion sections">{tabs.map(([id, label]) => <button key={id} className={active === id ? 'active' : ''} type="button" onClick={() => onChange(id)}>{label}</button>)}</nav>
}

function PrayerSessionSummary({ title, items }) {
  return (
    <article className="sf-card sf-summary-card">
      <h3>{title}</h3>
      <dl>{items.filter((item) => item.value).map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{Array.isArray(item.value) ? item.value.join(', ') : item.value}</dd></div>)}</dl>
    </article>
  )
}

export function PrayerRuleCard({ userId, rules, sessions, onSaveRule, onSaveSession }) {
  const [activeSession, setActiveSession] = useState(null)
  const [form, setForm] = useState({ prayerText: '', gratitude: '', confession: '', petition: '', graceReceived: '', obediencePrompt: '' })
  const [notice, setNotice] = useState('')
  const plan = getTodayPrayerPlan(userId, rules, sessions)
  const review = generateRuleReview(userId, plan.activeRule, sessions)

  function ensureRule() {
    const rule = createDefaultPrayerRule(userId)
    onSaveRule(rule)
    setNotice('Default prayer rule created.')
  }

  function start(slot) {
    const session = startPrayerSession(userId, plan.activeRule, slot)
    onSaveSession(session)
    setActiveSession(session)
    setForm({ prayerText: slot.template.body, gratitude: '', confession: '', petition: '', graceReceived: '', obediencePrompt: '' })
  }

  function complete() {
    const result = completePrayerSession(activeSession, {
      prayerText: form.prayerText,
      gratitudeItems: splitList(form.gratitude),
      confessionItems: splitList(form.confession),
      petitions: splitList(form.petition),
      graceReceived: form.graceReceived,
      obediencePrompt: form.obediencePrompt,
      durationMinutes: activeSession.durationMinutes,
    })
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    onSaveSession(result.session)
    setActiveSession(result.session)
    setNotice(result.guidance.message)
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('固定祷告规则', 'Prayer Rule')}</h2><p>Build a small daily rhythm of communion, not a performance system.</p></div>
      {!rules.find((rule) => rule.active) && <button className="sf-primary" type="button" onClick={ensureRule}>Create Beginner Prayer Rule</button>}
      <div className="sf-home-grid">
        {plan.slots.map((slot) => (
          <article className="sf-card sf-flow-card" key={slot.id}>
            <div className="sf-card-head"><h3>{slot.displayName}</h3><span className={slot.session?.status === 'completed' ? 'sf-status completed' : 'sf-status'}>{slot.session?.status || `${slot.durationMinutes} min`}</span></div>
            <p>{slot.template.body}</p>
            <button type="button" onClick={() => start(slot)}>Start Prayer Session</button>
          </article>
        ))}
      </div>
      {activeSession?.status !== 'completed' && activeSession && (
        <article className="sf-card sf-flow-card">
          <h3>Prayer Session</h3>
          <label>Prayer text<textarea value={form.prayerText} onChange={(event) => setForm({ ...form, prayerText: event.target.value })} /></label>
          <label>Gratitude<textarea value={form.gratitude} onChange={(event) => setForm({ ...form, gratitude: event.target.value })} placeholder="One per line or comma separated." /></label>
          <label>Confession<textarea value={form.confession} onChange={(event) => setForm({ ...form, confession: event.target.value })} /></label>
          <label>Petitions<textarea value={form.petition} onChange={(event) => setForm({ ...form, petition: event.target.value })} /></label>
          <label>Grace received<textarea value={form.graceReceived} onChange={(event) => setForm({ ...form, graceReceived: event.target.value })} /></label>
          <label>One next action<textarea value={form.obediencePrompt} onChange={(event) => setForm({ ...form, obediencePrompt: event.target.value })} /></label>
          <button className="sf-primary" type="button" onClick={complete}>Complete Prayer Session</button>
        </article>
      )}
      {activeSession?.status === 'completed' && <PrayerSessionSummary title="Prayer Session Summary" items={[{ label: 'Summary', value: activeSession.summary }, { label: 'Grace received', value: activeSession.graceReceived }, { label: 'Next action', value: activeSession.nextAction }]} />}
      <PrayerSessionSummary title="Weekly Prayer Review" items={[{ label: 'Completed sessions', value: String(review.completedSessionsCount) }, { label: 'Consistency', value: `${Math.round(review.consistencyScore * 100)}%` }, { label: 'Adjustments', value: review.adjustmentSuggestions }]} />
      {notice && <p className={notice.includes('urgent') ? 'sf-warning' : 'sf-success'}>{notice}</p>}
    </section>
  )
}

export function IntercessionList({ userId, targets, requests, onSaveTarget, onSaveRequest, onSaveSession }) {
  const [targetForm, setTargetForm] = useState({ displayName: '', targetType: 'person', relationship: '', notes: '' })
  const [requestForm, setRequestForm] = useState({ title: '', description: '', category: 'wisdom', urgency: 'normal', privacyLevel: 'private', targetId: '' })
  const [session, setSession] = useState(null)
  const [notice, setNotice] = useState('')
  const todayPlan = getTodayIntercessionPlan(userId, requests)
  const answered = requests.filter((request) => request.status === 'answered')

  function addTarget() {
    const target = createIntercessionTarget(userId, targetForm)
    onSaveTarget(target)
    setTargetForm({ displayName: '', targetType: 'person', relationship: '', notes: '' })
  }

  function addRequest() {
    const result = createPrayerRequest(userId, requestForm)
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    onSaveRequest(result.request)
    setNotice(result.request.privacyWarning || result.guidance.samplePrayer)
    setRequestForm({ title: '', description: '', category: 'wisdom', urgency: 'normal', privacyLevel: 'private', targetId: '' })
  }

  function startSession() {
    const next = startIntercessionSession(userId, todayPlan)
    onSaveSession(next)
    setSession(next)
  }

  function markPrayed(item) {
    const result = markIntercessionItemPrayed(session, item.id, { prayerText: generateIntercessionPrompt(item.request).samplePrayer, burdenLevelAfter: 4 })
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    onSaveSession(result.session)
    setSession(result.session)
  }

  function completeSession() {
    const next = completeIntercessionSession(session)
    onSaveSession(next)
    setSession(next)
    setNotice('Intercession session completed.')
  }

  function markAnswered(request) {
    onSaveRequest(markPrayerRequestAnswered(request, 'Answered prayer recorded with gratitude.'))
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('代祷追踪', 'Intercession')}</h2><p>Pray with wisdom, privacy, love, perseverance, and concrete follow-up.</p></div>
      <div className="sf-home-grid">
        <article className="sf-card sf-flow-card">
          <h3>Add target</h3>
          <label>Name<input value={targetForm.displayName} onChange={(event) => setTargetForm({ ...targetForm, displayName: event.target.value })} /></label>
          <label>Type<select value={targetForm.targetType} onChange={(event) => setTargetForm({ ...targetForm, targetType: event.target.value })}><option>person</option><option>family</option><option>church</option><option>city</option><option>nation</option><option>mission</option><option>personal</option></select></label>
          <label>Relationship<input value={targetForm.relationship} onChange={(event) => setTargetForm({ ...targetForm, relationship: event.target.value })} /></label>
          <button type="button" onClick={addTarget}>Add Target</button>
        </article>
        <article className="sf-card sf-flow-card">
          <h3>Add prayer request</h3>
          <label>Target<select value={requestForm.targetId} onChange={(event) => setRequestForm({ ...requestForm, targetId: event.target.value })}><option value="">No target</option>{targets.map((target) => <option key={target.id} value={target.id}>{target.displayName}</option>)}</select></label>
          <label>Title<input value={requestForm.title} onChange={(event) => setRequestForm({ ...requestForm, title: event.target.value })} /></label>
          <label>Description<textarea value={requestForm.description} onChange={(event) => setRequestForm({ ...requestForm, description: event.target.value })} /></label>
          <label>Category<select value={requestForm.category} onChange={(event) => setRequestForm({ ...requestForm, category: event.target.value })}>{intercessionCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label>Urgency<select value={requestForm.urgency} onChange={(event) => setRequestForm({ ...requestForm, urgency: event.target.value })}><option>low</option><option>normal</option><option>high</option><option>urgent</option></select></label>
          <button type="button" onClick={addRequest}>Create Request</button>
        </article>
      </div>
      <article className="sf-card sf-flow-card">
        <div className="sf-card-head"><h3>Today’s Intercession Plan</h3><button type="button" onClick={startSession}>Start Intercession Session</button></div>
        {todayPlan.length ? todayPlan.map((request) => <IntercessionRequestCard key={request.id} request={request} onAnswered={() => markAnswered(request)} />) : <p className="sf-empty">No active requests due. Add one above.</p>}
      </article>
      {session && (
        <article className="sf-card sf-flow-card">
          <h3>Intercession Session</h3>
          {session.items.map((item) => <div className="sf-insight-row" key={item.id}><b>{item.request.title}</b><p>{generateIntercessionPrompt(item.request).samplePrayer}</p><button type="button" onClick={() => markPrayed(item)}>{item.prayed ? 'Prayed' : 'Mark Prayed'}</button></div>)}
          <button className="sf-primary" type="button" onClick={completeSession}>Complete Intercession Session</button>
        </article>
      )}
      <AnsweredPrayerTimeline requests={answered} />
      {notice && <p className={notice.includes('urgent') || notice.includes('sensitive') ? 'sf-warning' : 'sf-success'}>{notice}</p>}
    </section>
  )
}

function IntercessionRequestCard({ request, onAnswered }) {
  const prompt = generateIntercessionPrompt(request)
  return <div className="sf-insight-row"><b>{request.title}</b><p>{prompt.prayerDirection}</p><span>{request.category} · {request.urgency}</span>{request.privacyWarning && <p className="sf-warning">{request.privacyWarning}</p>}<button type="button" onClick={onAnswered}>Mark Answered</button></div>
}

function AnsweredPrayerTimeline({ requests }) {
  return <article className="sf-card"><h3>Answered Prayer Timeline</h3>{requests.length ? requests.map((request) => <div className="sf-insight-row" key={request.id}><b>{request.title}</b><p>{request.answeredSummary}</p><span>{request.answeredAt ? new Date(request.answeredAt).toLocaleDateString() : 'answered'}</span></div>) : <p className="sf-empty">Answered prayers will appear here.</p>}</article>
}

export function PsalmPrayerGuide({ userId, sessions, onSaveSession }) {
  const [emotion, setEmotion] = useState('anxiety')
  const [mode, setMode] = useState('trust')
  const [selectedPsalm, setSelectedPsalm] = useState(23)
  const [session, setSession] = useState(sessions.find((item) => !item.completedAt) || null)
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState('')
  const recommendations = recommendPsalm(emotion, mode)
  const activeMovement = session?.movements?.[session.activeMovementIndex]

  function start() {
    const next = startPsalmPrayerSession(userId, selectedPsalm, mode, [emotion])
    onSaveSession(next)
    setSession(next)
    setDraft('')
  }

  function submit() {
    const result = submitPsalmMovement(session, activeMovement.movementKey, draft)
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    const next = result.session.activeMovementIndex >= result.session.movements.length ? completePsalmPrayerSession(result.session) : result.session
    onSaveSession(next)
    setSession(next)
    setDraft('')
    if (next.completedAt) setNotice('Psalm prayer completed.')
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('诗篇祷告', 'Psalm Prayer')}</h2><p>Pray praise, lament, confession, thanksgiving, trust, and hope without forced positivity.</p></div>
      <div className="sf-home-grid">
        <article className="sf-card sf-flow-card">
          <h3>Recommend a Psalm</h3>
          <label>Emotion or need<input value={emotion} onChange={(event) => setEmotion(event.target.value)} /></label>
          <label>Mode<select value={mode} onChange={(event) => setMode(event.target.value)}><option>guided</option><option>lament</option><option>praise</option><option>confession</option><option>thanksgiving</option><option>trust</option><option>free_prayer</option></select></label>
          <div className="sf-chip-row">{recommendations.map((psalm) => <button className={`sf-chip-btn ${selectedPsalm === psalm.psalmNumber ? 'active' : ''}`} type="button" key={psalm.id} onClick={() => setSelectedPsalm(psalm.psalmNumber)}>Psalm {psalm.psalmNumber}</button>)}</div>
          <button className="sf-primary" type="button" onClick={start}>Start Psalm Prayer</button>
        </article>
        <PsalmTextDisplay psalm={psalmProfiles.find((item) => item.psalmNumber === Number(selectedPsalm))} />
      </div>
      {session && !session.completedAt && activeMovement && (
        <article className="sf-card sf-flow-card">
          <div className="sf-stage-pills">{session.movements.map((movement, index) => <span className={index === session.activeMovementIndex ? 'active' : ''} key={movement.id}>{movement.movementKey.replace(/_/g, ' ')}</span>)}</div>
          <h3>{activeMovement.movementKey.replace(/_/g, ' ')}</h3>
          <p>{activeMovement.aiGuidance}</p>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write an honest Psalm-shaped prayer." />
          <button className="sf-primary" type="button" onClick={submit}>Save Movement</button>
        </article>
      )}
      {session?.completedAt && <PrayerSessionSummary title="Psalm Prayer Summary" items={[{ label: 'Psalm', value: `Psalm ${session.psalmNumber}` }, { label: 'Mode', value: session.selectedMode }, { label: 'Summary', value: session.summary }]} />}
      {notice && <p className={notice.includes('urgent') ? 'sf-warning' : 'sf-success'}>{notice}</p>}
    </section>
  )
}

function PsalmTextDisplay({ psalm }) {
  if (!psalm) return null
  return <article className="sf-card"><h3>Psalm {psalm.psalmNumber}: {psalm.title}</h3><p>{psalm.text}</p><div className="sf-chip-row">{psalm.dominantEmotions.map((emotion) => <span className="sf-chip" key={emotion}>{emotion}</span>)}</div>{psalm.cautionNotes && <p className="sf-warning">{psalm.cautionNotes}</p>}</article>
}

export function PracticingPresenceCheckIn({ userId, checkins, rules, onSaveCheckin, onSaveRule }) {
  const [contextLabel, setContextLabel] = useState('work')
  const [emotionalState, setEmotionalState] = useState('anxiety')
  const [awarenessBefore, setAwarenessBefore] = useState(4)
  const [awarenessAfter, setAwarenessAfter] = useState(6)
  const [activeCheckin, setActiveCheckin] = useState(null)
  const [shortPrayer, setShortPrayer] = useState('')
  const [returnAction, setReturnAction] = useState('')
  const [notice, setNotice] = useState('')
  const recommendation = recommendPresencePractice(contextLabel, emotionalState)
  const reflection = generatePresenceReflection(userId, checkins)
  const overburdened = detectOverburdeningRule(rules)

  function start() {
    const result = createPresenceCheckin(userId, { contextLabel, emotionalState, awarenessBefore, practice: recommendation })
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    onSaveCheckin(result.checkin)
    setActiveCheckin(result.checkin)
    setShortPrayer(result.checkin.practice.description)
  }

  function complete() {
    const result = completePresenceCheckin(activeCheckin, { awarenessAfter, shortPrayer, returnAction })
    if (result.routed) {
      setNotice(result.guidance.message)
      return
    }
    onSaveCheckin(result.checkin)
    setActiveCheckin(result.checkin)
    setNotice(result.guidance.message)
  }

  function addRule() {
    const rule = createPresenceRule(userId, { title: `${contextLabel} presence pause`, triggerConfig: { contexts: [contextLabel] }, practiceId: recommendation.id })
    onSaveRule(rule)
    setNotice('Presence rule created.')
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('操练与神同在', 'Practicing Presence')}</h2><p>Short, embodied returns to God in ordinary work, conflict, fatigue, commute, and temptation.</p></div>
      <div className="sf-home-grid">
        <article className="sf-card sf-flow-card">
          <h3>Presence Now</h3>
          <label>Context<select value={contextLabel} onChange={(event) => setContextLabel(event.target.value)}><option>work</option><option>coding</option><option>commute</option><option>conflict</option><option>family</option><option>temptation</option><option>fatigue</option><option>boredom</option></select></label>
          <label>Emotion<input value={emotionalState} onChange={(event) => setEmotionalState(event.target.value)} /></label>
          <label>Awareness before: {awarenessBefore}<input type="range" min="0" max="10" value={awarenessBefore} onChange={(event) => setAwarenessBefore(Number(event.target.value))} /></label>
          <PresencePracticeCard practice={recommendation} />
          <button className="sf-primary" type="button" onClick={start}>Start Presence Check-In</button>
          <button type="button" onClick={addRule}>Create Presence Rule</button>
          {overburdened && <p className="sf-warning">{overburdened}</p>}
        </article>
        <article className="sf-card sf-flow-card">
          <h3>Complete Check-In</h3>
          {activeCheckin ? (
            <>
              <label>Awareness after: {awarenessAfter}<input type="range" min="0" max="10" value={awarenessAfter} onChange={(event) => setAwarenessAfter(Number(event.target.value))} /></label>
              <label>Short prayer<textarea value={shortPrayer} onChange={(event) => setShortPrayer(event.target.value)} /></label>
              <label>Return action<textarea value={returnAction} onChange={(event) => setReturnAction(event.target.value)} /></label>
              <button className="sf-primary" type="button" onClick={complete}>Complete Check-In</button>
            </>
          ) : <p className="sf-empty">Start a presence check-in first.</p>}
        </article>
      </div>
      <PrayerSessionSummary title="Presence Reflection" items={[{ label: 'Total check-ins', value: String(reflection.totalCheckins) }, { label: 'Summary', value: reflection.summary }, { label: 'Next adjustment', value: reflection.nextAdjustment }]} />
      {notice && <p className={notice.includes('urgent') ? 'sf-warning' : 'sf-success'}>{notice}</p>}
    </section>
  )
}

function PresencePracticeCard({ practice }) {
  return <article className="sf-prayer"><b>{practice.title}</b><p>{practice.description}</p><span>{practice.durationSeconds} seconds</span></article>
}

export default function PrayerCommunionDashboard({ userId }) {
  const [tab, setTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const data = useMemo(() => loadPrayerCommunionData(userId), [userId, refreshKey])
  const dashboard = useMemo(() => buildPrayerDashboard({ userId, ...data }), [userId, data])
  const [intentText, setIntentText] = useState('I feel anxious before work and want to pray')
  const [route, setRoute] = useState(null)

  function refresh() {
    setRefreshKey((value) => value + 1)
  }

  function saveAndRefresh(fn, value) {
    fn(value)
    refresh()
  }

  function ensureDefaultRule() {
    if (!data.rules.some((rule) => rule.active)) saveAndRefresh(savePrayerRule, createDefaultPrayerRule(userId))
  }

  return (
    <section className="sf-section prayer-communion">
      <div className="sf-section-heading">
        <h2>Prayer & Communion OS / 祷告与神相交系统</h2>
        <p>{MODULE_DISCLAIMER}</p>
      </div>
      <MiniTabs active={tab} onChange={setTab} />
      {tab === 'dashboard' && (
        <>
          <div className="sf-home-grid">
            <article className="sf-card"><h3>Today’s Prayer Rhythm</h3><p>{dashboard.today.activePrayerRule.title}</p><p>{dashboard.today.completedPrayerSessions}/{dashboard.today.prayerSlots.length} completed</p><button type="button" onClick={() => { ensureDefaultRule(); setTab('rule') }}>Open Prayer Rule</button></article>
            <article className="sf-card"><h3>Intercession Due</h3><p>{dashboard.today.intercessionDueCount} request(s) due</p><button type="button" onClick={() => setTab('intercession')}>Open Intercession</button></article>
            <article className="sf-card"><h3>Recommended Psalm</h3><p>Psalm {dashboard.today.recommendedPsalm.psalmNumber}: {dashboard.today.recommendedPsalm.title}</p><button type="button" onClick={() => setTab('psalms')}>Pray Psalm</button></article>
            <article className="sf-card"><h3>Practice Presence Now</h3><p>{dashboard.today.presenceRecommendation.title}</p><button type="button" onClick={() => setTab('presence')}>Start Check-In</button></article>
          </div>
          <article className="sf-card sf-flow-card">
            <h3>Prayer Orchestrator</h3>
            <label>Intent<textarea value={intentText} onChange={(event) => setIntentText(event.target.value)} /></label>
            <button type="button" onClick={() => setRoute(orchestratePrayerIntent(userId, intentText, { emotion: 'anxiety', lifeContext: 'work' }))}>Route Intent</button>
            {route && <p className={route.route === 'crisis_care' ? 'sf-warning' : 'sf-success'}>{route.route}: {route.message}</p>}
          </article>
          <PrayerSessionSummary title="Weekly Prayer Review" items={[{ label: 'Prayer sessions', value: String(dashboard.weeklySummary.prayerSessionsCompleted) }, { label: 'Answered prayers', value: String(dashboard.weeklySummary.answeredPrayersCount) }, { label: 'Psalm sessions', value: String(dashboard.weeklySummary.psalmPrayerSessions) }, { label: 'Presence check-ins', value: String(dashboard.weeklySummary.presenceCheckins) }, { label: 'Insights', value: dashboard.formationInsights }]} />
          <AnsweredPrayerTimeline requests={data.prayerRequests.filter((request) => request.status === 'answered')} />
        </>
      )}
      {tab === 'rule' && <PrayerRuleCard userId={userId} rules={data.rules} sessions={data.prayerSessions} onSaveRule={(rule) => saveAndRefresh(savePrayerRule, rule)} onSaveSession={(session) => saveAndRefresh(savePrayerSession, session)} />}
      {tab === 'intercession' && <IntercessionList userId={userId} targets={data.intercessionTargets} requests={data.prayerRequests} onSaveTarget={(target) => saveAndRefresh(saveIntercessionTarget, target)} onSaveRequest={(request) => saveAndRefresh(savePrayerRequest, request)} onSaveSession={(session) => saveAndRefresh(saveIntercessionSession, session)} />}
      {tab === 'psalms' && <PsalmPrayerGuide userId={userId} sessions={data.psalmSessions} onSaveSession={(session) => saveAndRefresh(savePsalmSession, session)} />}
      {tab === 'presence' && <PracticingPresenceCheckIn userId={userId} checkins={data.presenceCheckins} rules={data.presenceRules} onSaveCheckin={(checkin) => saveAndRefresh(savePresenceCheckin, checkin)} onSaveRule={(rule) => saveAndRefresh(savePresenceRule, rule)} />}
      <article className="sf-card"><h3>Prayer templates</h3><div className="sf-chip-row">{prayerTemplates.map((template) => <span className="sf-chip" key={template.id}>{template.title}</span>)}</div><div className="sf-chip-row">{presencePractices.slice(0, 5).map((practice) => <span className="sf-chip" key={practice.id}>{practice.title}</span>)}</div></article>
    </section>
  )
}

function splitList(value = '') {
  return String(value).split(/\n|,/).map((item) => item.trim()).filter(Boolean)
}
