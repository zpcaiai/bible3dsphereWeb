import { T } from '../../lib/localize'
import { useEffect, useMemo, useState } from 'react'
import { accountabilityGroupTemplates, churchRhythmTemplates, discipleshipStages, ministryAreas } from '../../data/communityDiscipleshipSeed'
import {
  addAccountabilityResponse,
  addMentorObservation,
  buildCommunityDashboard,
  createAccountabilityCheckin,
  createAccountabilityGoal,
  createAccountabilityGroup,
  createChurchCheckin,
  createChurchConnection,
  createChurchProfile,
  createChurchReentryPlan,
  createChurchRhythm,
  createDiscipleshipAssessment,
  createDiscipleshipPath,
  createGroupPrayerRequest,
  createMentorActionPlan,
  createMentorRelationship,
  createMentorSession,
  createMinistryOpportunity,
  generateDiscipleshipReview,
  generateGroupReview,
  generateMentorReview,
  generateMinistryMatch,
  orchestrateCommunityIntent,
  recommendChurchIntegration,
  recommendDiscipleshipPathway,
  recommendMentorQuestions,
  recommendMentorSession,
  updateDiscipleshipStep,
} from '../../lib/communityDiscipleshipEngine'
import { COMMUNITY_DISCIPLESHIP_STORAGE_KEYS as KEYS, loadCommunityDiscipleshipData, saveCommunityEntry } from '../../lib/communityDiscipleshipStorage'
import { communityDiscipleshipApi, hydrateCommunityDiscipleshipRemote } from '../../lib/communityDiscipleshipApi'
import PlanExecutionPanel from '../../../../components/PlanExecutionPanel'
import { MODULE_DISCLAIMER } from '../../lib/pastoralSafety'

function MiniTabs({ active, onChange }) {
  const tabs = [
    ['dashboard', 'Dashboard'],
    ['pathway', 'Pathway'],
    ['accountability', 'Accountability'],
    ['mentor', 'Mentor'],
    ['church', 'Church'],
  ]
  return <nav className="sf-tabs" aria-label="Community discipleship sections">{tabs.map(([id, label]) => <button key={id} className={active === id ? 'active' : ''} type="button" onClick={() => onChange(id)}>{label}</button>)}</nav>
}

function Notice({ text }) {
  if (!text) return null
  const warning = /crisis|unsafe|abuse|coerc|route|care|danger|伤害|危机|不安全/.test(text)
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
  entries.filter(Boolean).forEach(([key, entry]) => saveCommunityEntry(key, entry))
}

function getFirst(list) {
  return Array.isArray(list) && list.length ? list[0] : null
}

export function CommunityOverview({ userId, data }) {
  const [intent, setIntent] = useState('I need an accountability partner and wise church integration.')
  const dashboard = useMemo(() => buildCommunityDashboard({ ...data, userId }), [data, userId])
  const route = orchestrateCommunityIntent(userId, intent)

  return (
    <section className="sf-section">
      <div className="sf-section-heading">
        <h2>Community, Accountability & Discipleship OS / 群体、监督与门徒训练系统</h2>
        <p>{MODULE_DISCLAIMER}</p>
      </div>
      <article className="sf-card sf-flow-card">
        <label>Community intent<textarea value={intent} onChange={(event) => setIntent(event.target.value)} /></label>
        <div className="sf-card-head"><h3>Recommended route</h3><span className="sf-status">{route.route}</span></div>
        <p>{route.message}</p>
        <p className="sf-muted">{route.nextEndpoint}</p>
      </article>
      <div className="sf-home-grid">
        <SummaryCard title="Today" items={[
          { label: 'Active pathway', value: dashboard.today.activeDiscipleshipPath?.title || 'None yet' },
          { label: 'Steps due', value: String(dashboard.today.discipleshipStepsDue.length) },
          { label: 'Groups', value: String(dashboard.today.accountabilityGroups.length) },
          { label: 'Mentor sessions due', value: String(dashboard.today.mentorSessionsDue.length) },
          { label: 'Church rhythms due', value: String(dashboard.today.churchLifeRhythmsDue.length) },
          { label: 'Urgent flags', value: dashboard.today.urgentFlags.length ? dashboard.today.urgentFlags : 'none' },
        ]} />
        <SummaryCard title="Weekly Summary" items={[
          { label: 'Steps completed', value: String(dashboard.weeklySummary.discipleshipStepsCompleted) },
          { label: 'Group check-ins', value: String(dashboard.weeklySummary.accountabilityCheckinsCreated) },
          { label: 'Prayer requests', value: String(dashboard.weeklySummary.groupPrayersAdded) },
          { label: 'Mentor sessions', value: String(dashboard.weeklySummary.mentorSessionsCompleted) },
          { label: 'Church check-ins', value: String(dashboard.weeklySummary.churchCheckinsCompleted) },
        ]} />
        <article className="sf-card">
          <h3>Community insights</h3>
          {dashboard.communityInsights.length ? dashboard.communityInsights.map((insight) => <div className="sf-insight-row" key={insight.type}><b>{insight.summary}</b><p>{insight.recommendedNextAction}</p><span>{insight.type}</span></div>) : <p className="sf-empty">No insights yet. Create one pathway or safe group connection.</p>}
        </article>
      </div>
    </section>
  )
}

export function DiscipleshipPathwayPanel({ userId, token, data, onRefresh }) {
  const [context, setContext] = useState('I want concrete growth in prayer, Scripture, community, and service.')
  const [stageKey, setStageKey] = useState('practicing_disciple')
  const [notice, setNotice] = useState('')
  const activePath = getFirst(data.discipleshipPaths)
  const pathSteps = activePath ? data.discipleshipSteps.filter((step) => step.pathId === activePath.id).sort((a, b) => a.sortOrder - b.sortOrder) : []
  const recommendation = recommendDiscipleshipPathway(userId, null, context)

  function createPathway() {
    const assessment = createDiscipleshipAssessment(userId, {
      spiritualHistorySummary: context,
      selfReportStageKey: stageKey,
      scripturePracticeLevel: stageKey === 'new_believer' ? 3 : 6,
      prayerPracticeLevel: stageKey === 'new_believer' ? 3 : 6,
      communityLevel: 4,
      serviceLevel: stageKey === 'new_believer' ? 1 : 5,
      doctrineFoundationLevel: 4,
      characterGrowthLevel: 5,
    })
    const { path, steps } = createDiscipleshipPath(userId, {
      title: '90-day discipleship pathway',
      currentStageKey: stageKey,
      primaryGrowthFocuses: recommendation.recommendation?.growthFocuses,
    })
    saveMany([
      [KEYS.assessments, assessment],
      [KEYS.discipleshipPaths, path],
      ...steps.map((step) => [KEYS.discipleshipSteps, step]),
    ])
    setNotice(assessment.riskFlags.length ? 'Pathway saved with care routing flag. Pause ordinary formation for safe support.' : 'Discipleship pathway created.')
    onRefresh()
    if (token) {
      void communityDiscipleshipApi.createAssessment(token, {
        self_report_stage_key: stageKey,
        scripture_practice_level: assessment.scripturePracticeLevel,
        prayer_practice_level: assessment.prayerPracticeLevel,
        community_level: assessment.communityLevel,
        service_level: assessment.serviceLevel,
        notes: context,
      }).then(() => communityDiscipleshipApi.createPath(token, {
        current_stage_key: stageKey,
        target_stage_key: path.targetStageKey,
        duration_days: path.durationDays,
        auto_steps: true,
      })).then(() => {
        setNotice('Discipleship pathway created and synced to backend.')
        return hydrateCommunityDiscipleshipRemote(userId, token)
      }).then(onRefresh).catch(() => setNotice('Discipleship pathway saved locally; backend sync failed.'))
    }
  }

  function completeNextStep() {
    const next = pathSteps.find((step) => step.status !== 'completed')
    if (!next) return
    saveCommunityEntry(KEYS.discipleshipSteps, updateDiscipleshipStep(next, { status: 'completed', completionNotes: '' }))
    setNotice('One discipleship step marked complete.')
    onRefresh()
    if (token) void communityDiscipleshipApi.completeStep(token, next.id).then(() => setNotice('One discipleship step marked complete and synced.')).catch(() => setNotice('Step saved locally; backend sync failed.'))
  }

  function createReview() {
    if (!activePath) return
    const review = generateDiscipleshipReview(userId, activePath, pathSteps)
    saveCommunityEntry(KEYS.discipleshipReviews, review)
    setNotice(review.summary)
    onRefresh()
    if (token) void communityDiscipleshipApi.createPathReview(token, activePath.id).then(() => setNotice(`${review.summary} Backend review synced.`)).catch(() => setNotice(`${review.summary} Backend sync failed.`))
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('门训路径', 'Discipleship Pathway')}</h2><p>Stages are pastoral aids, not spiritual identity labels.</p></div>
      <article className="sf-card sf-flow-card">
        <label>Spiritual context<textarea value={context} onChange={(event) => setContext(event.target.value)} /></label>
        <label>Starting stage<select value={stageKey} onChange={(event) => setStageKey(event.target.value)}>{discipleshipStages.map((stage) => <option key={stage.key} value={stage.key}>{stage.displayName}</option>)}</select></label>
        <div className="sf-plan-actions"><button className="sf-primary" type="button" onClick={createPathway}>Create Discipleship Pathway</button><button type="button" onClick={completeNextStep}>Complete Next Step</button><button type="button" onClick={createReview}>Generate Pathway Review</button></div>
      </article>
      <div className="sf-home-grid">
        <SummaryCard title="Recommendation" items={[
          { label: 'Route', value: recommendation.routed ? recommendation.recommendation.route : 'discipleship_pathway' },
          { label: 'Assessed stage', value: recommendation.recommendation?.assessedStage },
          { label: 'Target stage', value: recommendation.recommendation?.targetStage },
          { label: 'Focuses', value: recommendation.recommendation?.growthFocuses },
        ]} />
        <article className="sf-card">
          <h3>Active pathway</h3>
          {activePath ? <><p><b>{activePath.title}</b></p><p>{activePath.currentStageKey} to {activePath.targetStageKey}</p><ul>{pathSteps.map((step) => <li key={step.id}>{step.stepTitle} · {step.status}</li>)}</ul></> : <p className="sf-empty">No active pathway yet.</p>}
        </article>
        <article className="sf-card"><h3>Stage map</h3><div className="sf-stage-pills">{discipleshipStages.map((stage) => <span className={stage.key === stageKey ? 'active' : ''} key={stage.key}>{stage.key}</span>)}</div></article>
      </div>
      {activePath ? <PlanExecutionPanel userId={userId} planId={`discipleship-path:${activePath.id}`} title="Discipleship path execution" actions={pathSteps.map((step) => ({ id: step.id, title: step.stepTitle, cadence: 'once' }))} /> : null}
      <Notice text={notice} />
    </section>
  )
}

export function AccountabilityGroupPanel({ userId, token, data, onRefresh }) {
  const [groupType, setGroupType] = useState('weekly_triads')
  const [context, setContext] = useState('I need a weekly check-in with prayer, encouragement, and clear consent.')
  const [notice, setNotice] = useState('')
  const group = getFirst(data.accountabilityGroups)
  const latestCheckin = getFirst(data.accountabilityCheckins)
  const [prayerRequest, setPrayerRequest] = useState('')
  const [responseText, setResponseText] = useState('')
  const [supportNeeded, setSupportNeeded] = useState(false)

  function ensureGroup() {
    if (group) return group
    const created = createAccountabilityGroup(userId, { groupType, name: 'Grace-shaped weekly triad' })
    saveMany([[KEYS.accountabilityGroups, created.group], [KEYS.accountabilityMembers, created.member]])
    return created.group
  }

  function createGroup() {
    const created = createAccountabilityGroup(userId, { groupType, name: 'Grace-shaped weekly triad' })
    saveMany([[KEYS.accountabilityGroups, created.group], [KEYS.accountabilityMembers, created.member]])
    setNotice('Accountability group created with consent and confidentiality defaults.')
    onRefresh()
    if (token) {
      void communityDiscipleshipApi.createGroup(token, {
        name: created.group.name,
        description: created.group.description || context,
        group_type: groupType,
      }).then((remote) => {
        if (remote?.group_id) saveCommunityEntry(KEYS.accountabilityGroups, { ...created.group, id: remote.group_id })
        setNotice('Accountability group created and synced to backend.')
        onRefresh()
      }).catch(() => setNotice('Accountability group saved locally; backend sync failed.'))
    }
  }

  function createGoalAndCheckin() {
    const activeGroup = ensureGroup()
    const goal = createAccountabilityGoal(userId, activeGroup, { title: 'Weekly honest check-in', description: context })
    const result = createAccountabilityCheckin(userId, activeGroup, { gratitude: '', struggle: context, prayerRequest: prayerRequest.trim(), supportNeeded })
    saveMany([[KEYS.accountabilityGoals, goal], [KEYS.accountabilityCheckins, result.checkin]])
    setNotice(result.routed ? 'Check-in saved with care route flag.' : 'Accountability goal and check-in created.')
    onRefresh()
    if (token) {
      void (async () => {
        const remoteGroup = group?.id ? { group_id: group.id } : await communityDiscipleshipApi.createGroup(token, {
          name: activeGroup.name,
          description: activeGroup.description || context,
          group_type: groupType,
        })
        const groupId = remoteGroup.group_id || activeGroup.id
        await communityDiscipleshipApi.createGoal(token, groupId, { title: goal.title, description: goal.description, goal_type: goal.goalType || 'prayer' })
        await communityDiscipleshipApi.createCheckin(token, groupId, { struggle: context, prayer_request: prayerRequest.trim(), support_needed: supportNeeded })
        setNotice('Accountability goal and check-in synced to backend.')
      })().catch(() => setNotice('Goal/check-in saved locally; backend sync failed.'))
    }
  }

  function respondAndPray() {
    if (!group || !latestCheckin || !responseText.trim()) return
    const response = addAccountabilityResponse(userId, latestCheckin, { responseText: responseText.trim() })
    const prayer = createGroupPrayerRequest(userId, group, { title: 'Prayer request', requestText: prayerRequest.trim() || context })
    saveMany([[KEYS.accountabilityResponses, response], [KEYS.groupPrayerRequests, prayer]])
    setResponseText('')
    setNotice('Response and prayer request saved.')
    onRefresh()
    if (token) {
      void communityDiscipleshipApi.createPrayer(token, group.id, { title: prayer.title, request_text: prayer.requestText || context }).then(() => setNotice('Prayer request synced to backend.')).catch(() => setNotice('Prayer request saved locally; backend sync failed.'))
    }
  }

  function createReview() {
    const activeGroup = ensureGroup()
    const review = generateGroupReview(userId, activeGroup, data.accountabilityCheckins, data.groupPrayerRequests)
    saveCommunityEntry(KEYS.groupReviews, review)
    setNotice(review.summary)
    onRefresh()
    if (token) void communityDiscipleshipApi.createGroupReview(token, activeGroup.id).then(() => setNotice(`${review.summary} Backend review synced.`)).catch(() => setNotice(`${review.summary} Backend sync failed.`))
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('监督同行', 'Accountability Group')}</h2><p>Consent-based, role-aware, redacted, and free from public shaming or coerced confession.</p></div>
      <article className="sf-card sf-flow-card">
        <label>Group type<select value={groupType} onChange={(event) => setGroupType(event.target.value)}>{accountabilityGroupTemplates.map((template) => <option key={template.key} value={template.key}>{template.title}</option>)}</select></label>
        <label>Check-in context<textarea value={context} onChange={(event) => setContext(event.target.value)} /></label>
        <label>Prayer request<textarea value={prayerRequest} onChange={(event) => setPrayerRequest(event.target.value)} /></label>
        <label><input type="checkbox" checked={supportNeeded} onChange={(event) => setSupportNeeded(event.target.checked)} /> Support is needed</label>
        <label>Response actually given<textarea value={responseText} onChange={(event) => setResponseText(event.target.value)} /></label>
        <div className="sf-plan-actions"><button className="sf-primary" type="button" onClick={createGroup}>Create Accountability Group</button><button type="button" onClick={createGoalAndCheckin}>Create Goal and Check-In</button><button type="button" onClick={respondAndPray}>Add Response and Prayer</button><button type="button" onClick={createReview}>Generate Group Review</button></div>
      </article>
      <div className="sf-home-grid">
        <SummaryCard title="Group state" items={[
          { label: 'Groups', value: String(data.accountabilityGroups.length) },
          { label: 'Goals', value: String(data.accountabilityGoals.length) },
          { label: 'Check-ins', value: String(data.accountabilityCheckins.length) },
          { label: 'Responses', value: String(data.accountabilityResponses.length) },
          { label: 'Prayer requests', value: String(data.groupPrayerRequests.length) },
        ]} />
        <article className="sf-card"><h3>Confidentiality rule</h3><p>{group?.confidentialityCommitment || 'Members choose what to share; crisis or abuse routes to care, not gossip.'}</p></article>
      </div>
      {data.accountabilityGoals.length > 0 ? <PlanExecutionPanel userId={userId} planId={`accountability-goals:${group?.id || 'current'}`} title="Accountability goals execution" actions={data.accountabilityGoals.map((goal) => ({ id: goal.id, title: goal.description || goal.title, cadence: 'weekly' }))} /> : null}
      <Notice text={notice} />
    </section>
  )
}

export function MentorCoachingPanel({ userId, token, data, onRefresh }) {
  const [context, setContext] = useState('I want a mentor conversation about prayer, calling, and ordinary faithfulness.')
  const [notice, setNotice] = useState('')
  const [observationText, setObservationText] = useState('')
  const [planActions, setPlanActions] = useState('')
  const relationship = getFirst(data.mentorRelationships)
  const recommendation = relationship ? recommendMentorSession(userId, relationship, context) : null
  const questions = recommendMentorQuestions().slice(0, 6)

  function ensureRelationship() {
    if (relationship) return relationship
    const created = createMentorRelationship(userId, 'mentor-demo', { goals: ['grow in prayer', 'discern calling', 'practice humility'] })
    saveCommunityEntry(KEYS.mentorRelationships, created)
    return created
  }

  function createRelationship() {
    const created = createMentorRelationship(userId, 'mentor-demo', { goals: ['grow in prayer', 'discern calling', 'practice humility'] })
    saveCommunityEntry(KEYS.mentorRelationships, created)
    setNotice('Mentor relationship created with permission scope.')
    onRefresh()
    if (token) {
      void communityDiscipleshipApi.createMentorRelationship(token, {
        counterpart_email: 'mentor-demo@example.com',
        my_role: 'mentee',
        relationship_type: 'mentor',
        permission_scope: created.permissionScope || 'session_only',
      }).then((remote) => {
        if (remote?.relationship) saveCommunityEntry(KEYS.mentorRelationships, { ...created, id: remote.relationship.id, mentorEmail: remote.relationship.mentor_email })
        setNotice('Mentor relationship created and synced to backend.')
        onRefresh()
      }).catch(() => setNotice('Mentor relationship saved locally; backend sync failed.'))
    }
  }

  function createSession() {
    const rel = ensureRelationship()
    const result = createMentorSession(userId, rel, { context, status: 'planned' })
    saveCommunityEntry(KEYS.mentorSessions, result.session)
    setNotice(result.recommendation.routed ? 'Mentor session saved with care route flag.' : 'Mentor session created.')
    onRefresh()
    if (token) {
      void communityDiscipleshipApi.createMentorSession(token, rel.id, {
        session_type: result.session.sessionType || 'discipleship_review',
        agenda: result.session.agenda || [],
        summary: context,
        action_items: result.session.actionItems || [],
        status: result.session.status || 'planned',
      }).then(() => setNotice('Mentor session synced to backend.')).catch(() => setNotice('Mentor session saved locally; backend sync failed.'))
    }
  }

  function addObservationAndPlan() {
    const actions = planActions.split('\n').map((item) => item.trim()).filter(Boolean)
    if (!observationText.trim() || !actions.length) return
    const rel = ensureRelationship()
    const observation = addMentorObservation('mentor-demo', rel, { title: 'Mentor observation', description: observationText.trim(), evidence: [observationText.trim()], recommendedNextStep: actions[0] })
    const plan = createMentorActionPlan('mentor-demo', rel, { title: 'Mentor follow-up plan', actions })
    saveMany([[KEYS.mentorObservations, observation], [KEYS.mentorActionPlans, plan]])
    setNotice('Mentor observation and action plan saved.')
    setObservationText('')
    setPlanActions('')
    onRefresh()
    if (token) {
      void Promise.all([
        communityDiscipleshipApi.createMentorObservation(token, rel.id, { title: observation.title, description: observation.evidence?.join('; ') || '', recommended_next_step: plan.title }),
        communityDiscipleshipApi.createMentorPlan(token, rel.id, { title: plan.title, description: plan.description || '', actions: plan.actions || [] }),
      ]).then(() => setNotice('Mentor observation and action plan synced to backend.')).catch(() => setNotice('Mentor artifacts saved locally; backend sync failed.'))
    }
  }

  function createReview() {
    const rel = ensureRelationship()
    const review = generateMentorReview('mentor-demo', rel, data.mentorSessions, data.mentorObservations, data.mentorActionPlans)
    saveCommunityEntry(KEYS.mentorReviews, review)
    setNotice(review.summary)
    onRefresh()
    if (token) void communityDiscipleshipApi.createMentorReview(token, rel.id).then(() => setNotice(`${review.summary} Backend review synced.`)).catch(() => setNotice(`${review.summary} Backend sync failed.`))
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('导师陪跑', 'Mentor Coaching')}</h2><p>Mentoring supports discernment and action without control, surveillance, or hidden authority.</p></div>
      <article className="sf-card sf-flow-card">
        <label>Mentor context<textarea value={context} onChange={(event) => setContext(event.target.value)} /></label>
        <label>Mentor observation actually made<textarea value={observationText} onChange={(event) => setObservationText(event.target.value)} /></label>
        <label>Agreed actions (one per line)<textarea value={planActions} onChange={(event) => setPlanActions(event.target.value)} /></label>
        <div className="sf-plan-actions"><button className="sf-primary" type="button" onClick={createRelationship}>Create Mentor Relationship</button><button type="button" onClick={createSession}>Create Mentor Session</button><button type="button" onClick={addObservationAndPlan}>Add Observation and Action Plan</button><button type="button" onClick={createReview}>Generate Mentor Review</button></div>
      </article>
      <div className="sf-home-grid">
        <SummaryCard title="Mentor state" items={[
          { label: 'Relationships', value: String(data.mentorRelationships.length) },
          { label: 'Sessions', value: String(data.mentorSessions.length) },
          { label: 'Observations', value: String(data.mentorObservations.length) },
          { label: 'Action plans', value: String(data.mentorActionPlans.length) },
        ]} />
        <article className="sf-card"><h3>Suggested agenda</h3>{recommendation ? <ul>{recommendation.suggestedAgenda.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="sf-empty">Create a relationship to see agenda.</p>}</article>
        <article className="sf-card"><h3>Question library</h3><ul>{questions.map((question) => <li key={question.id}>{question.questionText}</li>)}</ul></article>
      </div>
      {data.mentorActionPlans[0] ? <PlanExecutionPanel userId={userId} planId={`mentor-action-plan:${data.mentorActionPlans[0].id}`} title="Mentor action plan execution" actions={(data.mentorActionPlans[0].actions || []).map((title, index) => ({ id: `action-${index + 1}`, title, cadence: 'weekly' }))} /> : null}
      <Notice text={notice} />
    </section>
  )
}

export function ChurchIntegrationPanel({ userId, token, data, onRefresh }) {
  const [context, setContext] = useState('I am exploring a safe local church and one low-pressure serving step.')
  const [templateKey, setTemplateKey] = useState('lord_day_worship')
  const [ministryArea, setMinistryArea] = useState('hospitality')
  const [notice, setNotice] = useState('')
  const [checkinReflection, setCheckinReflection] = useState('')
  const [attended, setAttended] = useState(false)
  const profile = getFirst(data.churchProfiles)
  const connection = getFirst(data.churchConnections)
  const rhythm = getFirst(data.churchRhythms)
  const recommendation = recommendChurchIntegration(userId, context, connection)

  function createConnection() {
    const createdProfile = createChurchProfile(userId, { name: 'Local Church', locationText: 'Near me' })
    const createdConnection = createChurchConnection(userId, { churchProfileId: createdProfile.id, connectionStatus: 'exploring', notes: context })
    saveMany([[KEYS.churchProfiles, createdProfile], [KEYS.churchConnections, createdConnection]])
    setNotice('Church profile and connection created.')
    onRefresh()
    if (token) {
      void communityDiscipleshipApi.createChurchProfile(token, { name: createdProfile.name, location_text: createdProfile.locationText || 'Near me' }).then((remote) => communityDiscipleshipApi.createChurchConnection(token, {
        church_profile_id: remote.church_profile_id,
        connection_status: 'exploring',
        notes: context,
      })).then(() => setNotice('Church profile and connection synced to backend.')).catch(() => setNotice('Church connection saved locally; backend sync failed.'))
    }
  }

  function createRhythm() {
    const activeConnection = connection || createChurchConnection(userId, { connectionStatus: 'exploring', notes: context })
    const createdRhythm = createChurchRhythm(userId, { churchConnectionId: activeConnection.id, templateKey })
    saveMany([[KEYS.churchConnections, activeConnection], [KEYS.churchRhythms, createdRhythm]])
    setNotice('Church rhythm created; attendance is not counted until you record a check-in.')
    onRefresh()
    if (token) {
      void communityDiscipleshipApi.createChurchRhythm(token, {
        rhythm_type: createdRhythm.rhythmType || 'worship',
        title: createdRhythm.title,
        frequency_type: createdRhythm.frequencyType || 'weekly',
      }).then(() => setNotice('Church rhythm synced to backend.')).catch(() => setNotice('Church rhythm saved locally; backend sync failed.'))
    }
  }

  function saveRhythmCheckin() {
    if (!rhythm || (!attended && !checkinReflection.trim())) return
    const checkin = createChurchCheckin(userId, rhythm, { attendedOrPracticed: attended, reflection: checkinReflection.trim(), nextStep: '' })
    saveMany([[KEYS.churchCheckins, checkin]])
    setNotice('Church rhythm check-in saved from your entry.')
    setCheckinReflection('')
    setAttended(false)
    onRefresh()
    if (token) void communityDiscipleshipApi.createChurchCheckin(token, { rhythm_id: rhythm.id, checkin_type: rhythm.rhythmType || 'worship', attended, reflection: checkinReflection.trim() }).then(() => setNotice('Church check-in synced to backend.')).catch(() => setNotice('Church check-in saved locally; backend sync failed.'))
  }

  function createMinistryMatchFlow() {
    const opportunity = createMinistryOpportunity(userId, { churchProfileId: profile?.id || null, ministryArea, title: `${ministryArea} service opportunity` })
    const match = generateMinistryMatch(userId, opportunity, { context })
    saveMany([[KEYS.ministryOpportunities, opportunity], [KEYS.ministryMatches, match]])
    setNotice('Ministry opportunity and match saved.')
    onRefresh()
  }

  function createReentryPlan() {
    const plan = createChurchReentryPlan(userId, { reasonText: context })
    saveCommunityEntry(KEYS.churchReentryPlans, plan)
    setNotice('Church re-entry plan created with safety boundaries.')
    onRefresh()
    if (token) {
      void communityDiscipleshipApi.createChurchReentryPlan(token, {
        reason_for_reentry: plan.reasonForReentry || 'church_hurt',
        safety_concerns: plan.safetyConcerns || [],
        desired_church_traits: plan.desiredChurchTraits || [],
        boundaries_needed: plan.boundariesNeeded || [],
        first_steps: plan.firstSteps || [],
        support_person_needed: true,
      }).then(() => setNotice('Church re-entry plan synced to backend.')).catch(() => setNotice('Church re-entry plan saved locally; backend sync failed.'))
    }
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>{T('教会生活整合', 'Church Integration')}</h2><p>Embodied church life is gradual and wise; church hurt routes to healing and safe re-entry first.</p></div>
      <article className="sf-card sf-flow-card">
        <label>Church context<textarea value={context} onChange={(event) => setContext(event.target.value)} /></label>
        <div className="sf-form-grid">
          <label>Church rhythm<select value={templateKey} onChange={(event) => setTemplateKey(event.target.value)}>{churchRhythmTemplates.map((template) => <option key={template.key} value={template.key}>{template.title}</option>)}</select></label>
          <label>Ministry area<select value={ministryArea} onChange={(event) => setMinistryArea(event.target.value)}>{ministryAreas.map((area) => <option key={area} value={area}>{area}</option>)}</select></label>
        </div>
        <label><input type="checkbox" checked={attended} onChange={(event) => setAttended(event.target.checked)} /> Attended or practiced this rhythm</label>
        <label>Church rhythm reflection<textarea value={checkinReflection} onChange={(event) => setCheckinReflection(event.target.value)} /></label>
        <div className="sf-plan-actions"><button className="sf-primary" type="button" onClick={createConnection}>Create Church Connection</button><button type="button" onClick={createRhythm}>Create Rhythm</button><button type="button" disabled={!rhythm || (!attended && !checkinReflection.trim())} onClick={saveRhythmCheckin}>Save Rhythm Check-In</button><button type="button" onClick={createMinistryMatchFlow}>Create Ministry Match</button><button type="button" onClick={createReentryPlan}>Create Re-Entry Plan</button></div>
      </article>
      <div className="sf-home-grid">
        <SummaryCard title="Church state" items={[
          { label: 'Profiles', value: String(data.churchProfiles.length) },
          { label: 'Connections', value: String(data.churchConnections.length) },
          { label: 'Rhythms', value: String(data.churchRhythms.length) },
          { label: 'Check-ins', value: String(data.churchCheckins.length) },
          { label: 'Ministry matches', value: String(data.ministryMatches.length) },
          { label: 'Re-entry plans', value: String(data.churchReentryPlans.length) },
        ]} />
        <article className="sf-card"><div className="sf-card-head"><h3>Integration recommendation</h3><span className="sf-status">{recommendation.route}</span></div><p>{recommendation.message}</p><ul>{recommendation.steps.map((step) => <li key={step}>{step}</li>)}</ul></article>
        <article className="sf-card"><h3>Active rhythm</h3>{rhythm ? <p>{rhythm.title} · {rhythm.frequencyType}</p> : <p className="sf-empty">No church rhythm yet.</p>}</article>
      </div>
      {rhythm ? <PlanExecutionPanel userId={userId} planId={`church-rhythm:${rhythm.id}`} title="Church rhythm execution" actions={[{ id: 'rhythm', title: rhythm.description || rhythm.title, cadence: rhythm.frequencyType || 'weekly' }]} /> : null}
      {data.churchReentryPlans[0] ? <PlanExecutionPanel userId={userId} planId={`church-reentry:${data.churchReentryPlans[0].id}`} title="Safe church re-entry steps" actions={(data.churchReentryPlans[0].firstSteps || []).map((title, index) => ({ id: `step-${index + 1}`, title, cadence: 'once' }))} /> : null}
      <Notice text={notice} />
    </section>
  )
}

export default function CommunityDiscipleshipDashboard({ userId, token }) {
  const [tab, setTab] = useState('dashboard')
  const [refreshKey, setRefreshKey] = useState(0)
  const data = useMemo(() => loadCommunityDiscipleshipData(userId), [userId, refreshKey])
  const refresh = () => setRefreshKey((value) => value + 1)

  useEffect(() => {
    let alive = true
    if (token) {
      void hydrateCommunityDiscipleshipRemote(userId, token).then((result) => {
        if (alive && result.hydrated) refresh()
      })
    }
    return () => { alive = false }
  }, [userId, token])

  return (
    <>
      <MiniTabs active={tab} onChange={setTab} />
      {tab === 'dashboard' && <CommunityOverview userId={userId} data={data} />}
      {tab === 'pathway' && <DiscipleshipPathwayPanel userId={userId} token={token} data={data} onRefresh={refresh} />}
      {tab === 'accountability' && <AccountabilityGroupPanel userId={userId} token={token} data={data} onRefresh={refresh} />}
      {tab === 'mentor' && <MentorCoachingPanel userId={userId} token={token} data={data} onRefresh={refresh} />}
      {tab === 'church' && <ChurchIntegrationPanel userId={userId} token={token} data={data} onRefresh={refresh} />}
    </>
  )
}
