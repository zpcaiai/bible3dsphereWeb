import { accountabilityGroupTemplates, churchRhythmTemplates, discipleshipStages, mentorQuestions, ministryAreas } from '../data/communityDiscipleshipSeed'
import { todayKey, uid } from './scriptureFormationEngine'
import { shouldBlockNormalFormation, triageText } from './sufferingCareEngine'

const COMMUNITY_RISK = [/kill myself/i, /suicide/i, /self-harm/i, /hurt myself/i, /abuse/i, /spiritual abuse/i, /coerc/i, /manipulat/i, /unsafe leader/i, /unsafe group/i, /public confession/i, /unsafe reconciliation/i, /自杀|自残|暴力|虐待|属灵操控|强迫|不安全|公开认罪/]

function nowIso() {
  return new Date().toISOString()
}

function lower(text = '') {
  return String(text || '').toLowerCase()
}

function dateDaysFromNow(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return todayKey(date)
}

function safety(userId, text, source = 'discipleship_community') {
  const triage = triageText(userId, text, source)
  const risky = COMMUNITY_RISK.some((pattern) => pattern.test(text || ''))
  return { triage, shouldRoute: shouldBlockNormalFormation(triage.assessment) || risky }
}

function stageByKey(key) {
  return discipleshipStages.find((stage) => stage.key === key) || discipleshipStages[0]
}

export function listDiscipleshipStages() {
  return discipleshipStages
}

export function createDiscipleshipAssessment(userId, data = {}) {
  const safe = safety(userId, data.spiritualHistorySummary || '')
  const stage = inferStageFromAssessment(data)
  return {
    id: uid('discipleship_assessment'),
    userId,
    assessmentDate: todayKey(),
    assessedStageId: stage.id,
    assessedStageKey: stage.key,
    selfReportStageKey: data.selfReportStageKey || '',
    confidenceScore: safe.shouldRoute ? 0.35 : 0.72,
    spiritualHistorySummary: data.spiritualHistorySummary || '',
    churchConnectionLevel: data.churchConnectionLevel || 'irregular',
    baptismStatus: data.baptismStatus || 'unknown',
    communionParticipation: data.communionParticipation || 'unknown',
    scripturePracticeLevel: Number(data.scripturePracticeLevel || 4),
    prayerPracticeLevel: Number(data.prayerPracticeLevel || 4),
    communityLevel: Number(data.communityLevel || 3),
    serviceLevel: Number(data.serviceLevel || 2),
    missionLevel: Number(data.missionLevel || 2),
    doctrineFoundationLevel: Number(data.doctrineFoundationLevel || 3),
    characterGrowthLevel: Number(data.characterGrowthLevel || 4),
    riskFlags: safe.shouldRoute ? ['route_to_suffering_care'] : [],
    createdAt: nowIso(),
  }
}

export function inferStageFromAssessment(assessment = {}) {
  const score = ['scripturePracticeLevel', 'prayerPracticeLevel', 'communityLevel', 'serviceLevel', 'missionLevel', 'doctrineFoundationLevel', 'characterGrowthLevel']
    .reduce((sum, key) => sum + Number(assessment[key] || 0), 0)
  if (assessment.churchConnectionLevel === 'none' && score < 16) return stageByKey('seeker')
  if (assessment.baptismStatus === 'not_baptized' || score < 22) return stageByKey('new_believer')
  if (score < 30) return stageByKey('rooted_disciple')
  if (score < 40 || Number(assessment.serviceLevel || 0) < 5) return stageByKey('practicing_disciple')
  if (score < 50) return stageByKey('serving_member')
  if (score < 58) return stageByKey('mature_disciple')
  return stageByKey('leader_in_training')
}

export function recommendDiscipleshipPathway(userId, assessment = null, contextText = '') {
  const safe = safety(userId, `${assessment?.spiritualHistorySummary || ''} ${contextText}`)
  if (safe.shouldRoute) {
    return {
      routed: true,
      triage: safe.triage,
      recommendation: {
        route: 'suffering_care',
        message: 'Community formation should pause for safety/healing support first.',
      },
    }
  }
  const current = assessment ? stageByKey(assessment.assessedStageKey) : inferStageFromAssessment({ spiritualHistorySummary: contextText })
  const target = stageByKey(current.nextStageKey || current.key)
  const steps = generatePathStepTemplates(current.key, target.key)
  return {
    routed: false,
    triage: safe.triage,
    recommendation: {
      assessedStage: current.key,
      targetStage: target.key,
      durationDays: 90,
      growthFocuses: focusForStage(current.key),
      recommendedSteps: steps,
      pastoralSupportRecommended: assessment?.riskFlags?.length > 0 || /isolated|church hurt|abuse|孤立|教会伤害/.test(lower(contextText)),
    },
  }
}

function focusForStage(stageKey) {
  const map = {
    seeker: ['gospel basics', 'safe questions', 'safe church connection'],
    new_believer: ['baptism preparation', 'prayer basics', 'mentor connection'],
    rooted_disciple: ['doctrine foundations', 'Scripture habit', 'church membership exploration'],
    practicing_disciple: ['stable Rule of Life', 'service discovery', 'accountability relationship'],
    serving_member: ['gift assessment', 'ministry boundaries', 'Sabbath guardrails'],
    mature_disciple: ['mentor training', 'theological depth', 'care skills'],
  }
  return map[stageKey] || ['humility', 'service', 'community']
}

function generatePathStepTemplates(currentStageKey, targetStageKey) {
  if (currentStageKey === 'new_believer') {
    return [
      { title: 'Read Mark or John for 21 days', stepType: 'scripture', relatedModule: 'scripture_formation' },
      { title: 'Begin baptism preparation conversation', stepType: 'baptism', relatedModule: 'church_integration' },
      { title: 'Ask one mature believer for mentoring', stepType: 'mentoring', relatedModule: 'mentor_coaching' },
    ]
  }
  if (currentStageKey === 'practicing_disciple') {
    return [
      { title: 'Complete a 30-day Rule of Life', stepType: 'habit', relatedModule: 'holy_habit' },
      { title: 'Join or create accountability group', stepType: 'community', relatedModule: 'accountability_group' },
      { title: 'Explore one service opportunity', stepType: 'service', relatedModule: 'church_integration' },
    ]
  }
  return [
    { title: `Review growth toward ${targetStageKey}`, stepType: 'custom', relatedModule: 'discipleship_community' },
    { title: 'Practice one Scripture and prayer rhythm', stepType: 'prayer', relatedModule: 'prayer_communion' },
    { title: 'Take one concrete community step', stepType: 'community', relatedModule: 'accountability_group' },
  ]
}

export function createDiscipleshipPath(userId, data = {}) {
  const current = stageByKey(data.currentStageKey || 'practicing_disciple')
  const target = stageByKey(data.targetStageKey || current.nextStageKey || current.key)
  const path = {
    id: uid('discipleship_path'),
    userId,
    title: data.title || `${current.displayName} to ${target.displayName}`,
    currentStageId: current.id,
    currentStageKey: current.key,
    targetStageId: target.id,
    targetStageKey: target.key,
    pathwayDurationDays: Number(data.pathwayDurationDays || 90),
    startDate: todayKey(),
    endDate: dateDaysFromNow(Number(data.pathwayDurationDays || 90)),
    status: 'active',
    primaryGrowthFocuses: data.primaryGrowthFocuses || focusForStage(current.key),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  return { path, steps: generatePathSteps(userId, path) }
}

export function generatePathSteps(userId, path) {
  return generatePathStepTemplates(path.currentStageKey, path.targetStageKey).map((template, index) => ({
    id: uid('discipleship_step'),
    pathId: path.id,
    userId,
    stepTitle: template.title,
    stepDescription: 'A concrete, grace-shaped step. Stages are aids, not identity labels.',
    stepType: template.stepType,
    relatedModule: template.relatedModule,
    relatedEntityId: null,
    dueDate: dateDaysFromNow((index + 1) * 14),
    status: 'planned',
    completionNotes: '',
    sortOrder: index + 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }))
}

export function updateDiscipleshipStep(step, data = {}) {
  return { ...step, ...data, updatedAt: nowIso() }
}

export function generateDiscipleshipReview(userId, path, steps = []) {
  const mine = steps.filter((step) => step.userId === userId && step.pathId === path.id)
  const completed = mine.filter((step) => step.status === 'completed')
  const blocked = mine.filter((step) => step.status === 'blocked')
  return {
    id: uid('discipleship_review'),
    userId,
    pathId: path.id,
    reviewPeriodStart: path.startDate,
    reviewPeriodEnd: todayKey(),
    completedStepsCount: completed.length,
    blockedStepsCount: blocked.length,
    growthEvidence: completed.map((step) => step.stepTitle),
    remainingGaps: mine.filter((step) => step.status !== 'completed').map((step) => step.stepTitle),
    recommendedAdjustments: blocked.length ? ['Simplify the pathway and seek mentor support.'] : ['Keep growth concrete, communal, and grace-shaped.'],
    pastoralSupportRecommended: blocked.length > 0,
    summary: `${completed.length} step(s) completed. Review is for wisdom, not ranking.`,
    createdAt: nowIso(),
  }
}

export function createAccountabilityGroup(userId, data = {}) {
  const template = accountabilityGroupTemplates.find((item) => item.key === data.groupType) || accountabilityGroupTemplates[0]
  const group = {
    id: uid('accountability_group'),
    name: data.name || template.title,
    description: data.description || template.description,
    groupType: data.groupType || template.key,
    createdByUserId: userId,
    userId,
    visibility: data.visibility || 'invite_only',
    status: 'active',
    groupRule: data.groupRule || 'Grace-shaped honesty, no public shaming, no coercive confession.',
    confidentialityCommitment: data.confidentialityCommitment || 'Members choose what to share; crisis or abuse routes to care, not gossip.',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  const member = addAccountabilityMember(userId, group, userId, 'leader', data.sharingScope || 'formation_summary')
  return { group, member }
}

export function addAccountabilityMember(requesterId, group, invitedUserId, role = 'member', sharingScope = 'checkin_only') {
  return {
    id: uid('accountability_member'),
    groupId: group.id,
    userId: invitedUserId,
    role,
    status: requesterId === invitedUserId ? 'active' : 'invited',
    sharingScope,
    joinedAt: requesterId === invitedUserId ? nowIso() : null,
    leftAt: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createAccountabilityGoal(userId, group, data = {}) {
  return {
    id: uid('accountability_goal'),
    groupId: group.id,
    userId,
    title: data.title || 'Weekly prayer and practice check-in',
    description: data.description || '',
    goalType: data.goalType || 'prayer',
    relatedModule: data.relatedModule || 'prayer_communion',
    relatedEntityId: null,
    startDate: todayKey(),
    endDate: data.endDate || '',
    status: 'active',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createAccountabilityCheckin(userId, group, data = {}) {
  const safe = safety(userId, `${data.struggle || ''} ${data.prayerRequest || ''}`, 'accountability_group')
  return {
    checkin: {
      id: uid('accountability_checkin'),
      groupId: group.id,
      userId,
      checkinDate: todayKey(),
      checkinType: data.checkinType || 'weekly',
      gratitude: data.gratitude || '',
      struggle: data.struggle || '',
      practiceSummary: data.practiceSummary || {},
      prayerRequest: data.prayerRequest || '',
      supportNeeded: Boolean(data.supportNeeded),
      riskFlags: safe.shouldRoute ? ['route_to_care', safe.triage.assessment.riskLevel] : [],
      visibility: data.visibility || 'group_visible',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    triage: safe.triage,
    routed: safe.shouldRoute,
  }
}

export function addAccountabilityResponse(userId, checkin, data = {}) {
  return {
    id: uid('accountability_response'),
    checkinId: checkin.id,
    responderUserId: userId,
    responseType: data.responseType || 'encouragement',
    responseText: data.responseText || '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createGroupPrayerRequest(userId, group, data = {}) {
  return {
    id: uid('group_prayer'),
    groupId: group.id,
    userId,
    title: data.title || 'Prayer request',
    requestText: data.requestText || '',
    privacyLevel: data.privacyLevel || 'group_visible',
    status: 'active',
    answeredSummary: '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function generateGroupReview(userId, group, checkins = [], prayerRequests = []) {
  const groupCheckins = checkins.filter((item) => item.groupId === group.id)
  return {
    id: uid('group_review'),
    groupId: group.id,
    generatedByUserId: userId,
    reviewPeriodStart: dateDaysFromNow(-7),
    reviewPeriodEnd: todayKey(),
    summaryType: 'group_view',
    summary: `The group shared ${groupCheckins.length} check-in(s). Keep encouragement stronger than performance reporting.`,
    encouragement: ['Members are honestly sharing struggles.', 'Prayer requests can be followed up with care.'],
    redactedFields: ['private confession details', 'crisis details'],
    riskSummary: groupCheckins.some((item) => item.riskFlags?.length) ? ['care route recommended'] : [],
    nextSteps: prayerRequests.length ? ['Follow up one prayer request.', 'Simplify goals for one week.'] : ['Add one mutual prayer time.'],
    createdAt: nowIso(),
  }
}

export function createMentorRelationship(menteeId, mentorId, data = {}) {
  return {
    id: uid('mentor_relationship'),
    menteeUserId: menteeId,
    mentorUserId: mentorId,
    userId: menteeId,
    relationshipType: data.relationshipType || 'mentor',
    status: data.status || 'active',
    permissionScope: data.permissionScope || 'growth_summary',
    goals: data.goals || ['grow in prayer, habits, and discernment'],
    startDate: todayKey(),
    endDate: '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function recommendMentorSession(userId, relationship, context = '') {
  const safe = safety(userId, context, 'mentor_coaching')
  const sessionType = safe.shouldRoute ? 'crisis_followup' : /calling|gift|call|呼召/.test(lower(context)) ? 'calling_discernment' : 'discipleship_review'
  const suggestedQuestions = recommendMentorQuestions(sessionType)
  const fallbackQuestions = suggestedQuestions.length ? suggestedQuestions : recommendMentorQuestions()
  return {
    routed: safe.shouldRoute,
    triage: safe.triage,
    sessionType,
    suggestedAgenda: ['Begin with prayer and one gratitude.', 'Review last action plan.', 'Discuss one growth evidence and one struggle.', 'Choose one next step.', 'Close with prayer and follow-up date.'],
    suggestedQuestions: fallbackQuestions.slice(0, 3).map((item) => item.questionText),
    cautions: ['Do not press for private details beyond consent.', 'If crisis appears, route to care system.'],
  }
}

export function recommendMentorQuestions(category = '') {
  if (!category) return mentorQuestions.slice(0, 12)
  return mentorQuestions.filter((question) => question.questionCategory === category || category.includes(question.questionCategory)).slice(0, 12)
}

export function createMentorSession(userId, relationship, data = {}) {
  const rec = recommendMentorSession(userId, relationship, data.context || '')
  return {
    session: {
      id: uid('mentor_session'),
      relationshipId: relationship.id,
      menteeUserId: relationship.menteeUserId,
      mentorUserId: relationship.mentorUserId,
      userId: relationship.menteeUserId,
      sessionDate: nowIso(),
      sessionType: data.sessionType || rec.sessionType,
      agenda: data.agenda || rec.suggestedAgenda,
      summary: data.summary || '',
      prayerNotes: data.prayerNotes || '',
      actionItems: data.actionItems || ['one small faithful next step'],
      riskFlags: rec.routed ? ['route_to_care'] : [],
      status: data.status || 'planned',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    recommendation: rec,
  }
}

export function addMentorObservation(userId, relationship, data = {}) {
  return {
    id: uid('mentor_observation'),
    relationshipId: relationship.id,
    menteeUserId: relationship.menteeUserId,
    mentorUserId: userId,
    userId: relationship.menteeUserId,
    observationDate: todayKey(),
    observationType: data.observationType || 'encouragement',
    title: data.title || 'Growth evidence noticed',
    description: data.description || '',
    evidence: data.evidence || [],
    recommendedNextStep: data.recommendedNextStep || '',
    visibleToMentee: data.visibleToMentee !== false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createMentorActionPlan(userId, relationship, data = {}) {
  return {
    id: uid('mentor_action_plan'),
    relationshipId: relationship.id,
    menteeUserId: relationship.menteeUserId,
    mentorUserId: userId,
    userId: relationship.menteeUserId,
    title: data.title || 'Mentor action plan',
    description: data.description || '',
    planType: data.planType || 'habit',
    actions: data.actions || [],
    reviewDate: data.reviewDate || dateDaysFromNow(14),
    status: 'active',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function generateMentorReview(userId, relationship, sessions = [], observations = [], actionPlans = []) {
  const relSessions = sessions.filter((item) => item.relationshipId === relationship.id)
  const relObservations = observations.filter((item) => item.relationshipId === relationship.id)
  return {
    id: uid('mentor_review'),
    relationshipId: relationship.id,
    menteeUserId: relationship.menteeUserId,
    mentorUserId: userId,
    userId: relationship.menteeUserId,
    reviewPeriodStart: relationship.startDate,
    reviewPeriodEnd: todayKey(),
    summary: `${relSessions.length} session(s), ${relObservations.length} observation(s), ${actionPlans.length} action plan(s).`,
    growthEvidence: relObservations.map((item) => item.title),
    concerns: relSessions.flatMap((item) => item.riskFlags || []),
    nextSteps: actionPlans.flatMap((item) => item.actions || []).slice(0, 4),
    escalationRecommended: relSessions.some((item) => item.riskFlags?.length),
    createdAt: nowIso(),
  }
}

export function createChurchProfile(userId, data = {}) {
  return {
    id: uid('church_profile'),
    userId,
    name: data.name || 'Local Church',
    description: data.description || '',
    denominationOrTradition: data.denominationOrTradition || '',
    websiteUrl: data.websiteUrl || '',
    locationText: data.locationText || '',
    timezone: data.timezone || '',
    worshipTimes: data.worshipTimes || [],
    contactInfo: data.contactInfo || {},
    createdByUserId: userId,
    public: Boolean(data.public),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createChurchConnection(userId, data = {}) {
  return {
    id: uid('church_connection'),
    userId,
    churchProfileId: data.churchProfileId || null,
    connectionStatus: data.connectionStatus || 'exploring',
    baptismStatus: data.baptismStatus || 'unknown',
    membershipStatus: data.membershipStatus || 'exploring',
    smallGroupStatus: data.smallGroupStatus || 'looking',
    pastoralContactStatus: data.pastoralContactStatus || 'unknown',
    notes: data.notes || '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function recommendChurchIntegration(userId, contextText = '', connection = null) {
  const safe = safety(userId, contextText, 'church_integration')
  const input = lower(contextText)
  if (safe.shouldRoute || /church hurt|spiritual abuse|教会伤害|属灵操控/.test(input)) {
    return {
      route: 'healing_journey',
      message: 'Church hurt or spiritual abuse needs healing, safety boundaries, trusted support, and slow re-entry.',
      steps: ['Name safety concerns.', 'Do not return to an unsafe leader.', 'Create a church re-entry plan with support.'],
      triage: safe.triage,
    }
  }
  const status = connection?.connectionStatus || (/not connected|no church|没有教会|没教会/.test(input) ? 'not_connected' : 'exploring')
  const steps = status === 'not_connected'
    ? ['Pray for a safe local church connection.', 'Ask one trusted believer for recommendations.', 'Visit one worship service without pressure.']
    : status === 'regular_attender'
      ? ['Explore a small group.', 'Introduce yourself to a pastor or leader.', 'Consider one low-pressure service opportunity.']
      : ['Prepare for Lord’s Day worship.', 'Create one church life rhythm.', 'Take one low-pressure fellowship step.']
  return { route: 'church_integration', message: 'Church integration should be embodied, gradual, and wise.', steps, triage: safe.triage }
}

export function createChurchRhythm(userId, data = {}) {
  const template = churchRhythmTemplates.find((item) => item.key === data.templateKey) || churchRhythmTemplates[0]
  return {
    id: uid('church_rhythm'),
    userId,
    churchConnectionId: data.churchConnectionId || null,
    rhythmType: data.rhythmType || template.rhythmType,
    title: data.title || template.title,
    description: data.description || template.description,
    frequencyType: data.frequencyType || template.frequencyType,
    nextDueAt: data.nextDueAt || dateDaysFromNow(7),
    status: 'active',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createChurchCheckin(userId, rhythm, data = {}) {
  return {
    id: uid('church_checkin'),
    userId,
    rhythmId: rhythm?.id || null,
    checkinDate: todayKey(),
    checkinType: data.checkinType || rhythm?.rhythmType || 'worship',
    attendedOrPracticed: Boolean(data.attendedOrPracticed),
    reflection: data.reflection || '',
    encouragement: data.encouragement || '',
    obstacle: data.obstacle || '',
    nextStep: data.nextStep || '',
    createdAt: nowIso(),
  }
}

export function createMinistryOpportunity(userId, data = {}) {
  return {
    id: uid('ministry_opportunity'),
    userId,
    churchProfileId: data.churchProfileId || null,
    title: data.title || 'Hospitality Team',
    description: data.description || 'Low-pressure relational service.',
    ministryArea: data.ministryArea || 'hospitality',
    requiredGifts: data.requiredGifts || ['hospitality', 'service', 'mercy'],
    requiredCommitment: data.requiredCommitment || 'once per month',
    contactInfo: data.contactInfo || {},
    active: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function generateMinistryMatch(userId, opportunity, context = {}) {
  const burnout = /burnout|exhaust|耗尽/.test(lower(JSON.stringify(context)))
  return {
    id: uid('ministry_match'),
    userId,
    opportunityId: opportunity.id,
    matchSource: 'manual',
    fitScore: burnout ? 0.52 : 0.82,
    reasons: ['Low teaching load and relational service fit an early serving season.', `${opportunity.ministryArea} can be explored without identity pressure.`],
    cautions: burnout ? ['Avoid overcommitment; start with rest and pastoral conversation first.'] : ['Start once per month and review capacity.'],
    status: 'suggested',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createChurchReentryPlan(userId, data = {}) {
  const hurt = /hurt|abuse|unsafe|伤害|虐待|不安全|属灵操控/.test(lower(data.reasonText || ''))
  return {
    id: uid('church_reentry'),
    userId,
    reasonForReentry: data.reasonForReentry || (hurt ? 'church_hurt' : 'returning_after_absence'),
    safetyConcerns: data.safetyConcerns || (hurt ? ['avoid unsafe leader or system'] : []),
    desiredChurchTraits: data.desiredChurchTraits || ['gospel clarity', 'humility', 'safeguarding', 'pastoral care'],
    boundariesNeeded: data.boundariesNeeded || (hurt ? ['do not meet alone with unsafe leader', 'bring support person'] : ['go slowly']),
    firstSteps: data.firstSteps || ['pray', 'ask trusted person', 'visit without pressure'],
    supportPersonNeeded: hurt,
    status: 'active',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function buildCommunityDashboard(data = {}) {
  const userId = data.userId || 'local-user'
  const activePath = (data.discipleshipPaths || []).find((path) => path.userId === userId && path.status === 'active') || null
  const stepsDue = (data.discipleshipSteps || []).filter((step) => step.userId === userId && step.status !== 'completed')
  const groups = (data.accountabilityGroups || []).filter((group) => group.userId === userId || group.createdByUserId === userId)
  const mentorSessionsDue = (data.mentorSessions || []).filter((session) => session.userId === userId && session.status === 'planned')
  const rhythmsDue = (data.churchRhythms || []).filter((rhythm) => rhythm.userId === userId && rhythm.status === 'active')
  return {
    today: {
      activeDiscipleshipPath: activePath,
      discipleshipStepsDue: stepsDue,
      accountabilityGroups: groups,
      recentGroupCheckins: (data.accountabilityCheckins || []).filter((item) => item.userId === userId).slice(0, 5),
      mentorSessionsDue,
      churchLifeRhythmsDue: rhythmsDue,
      ministryRecommendations: data.ministryMatches || [],
      urgentFlags: [...stepsDue, ...(data.accountabilityCheckins || []), ...(data.mentorSessions || [])].flatMap((item) => item.riskFlags || []),
    },
    weeklySummary: {
      discipleshipStepsCompleted: (data.discipleshipSteps || []).filter((step) => step.userId === userId && step.status === 'completed').length,
      accountabilityCheckinsCreated: (data.accountabilityCheckins || []).filter((item) => item.userId === userId).length,
      groupPrayersAdded: (data.groupPrayerRequests || []).filter((item) => item.userId === userId).length,
      mentorSessionsCompleted: (data.mentorSessions || []).filter((item) => item.userId === userId && item.status === 'completed').length,
      churchCheckinsCompleted: (data.churchCheckins || []).filter((item) => item.userId === userId).length,
    },
    communityInsights: [
      !groups.length && { type: 'isolation', summary: 'Private practices may need a safe community connection.', recommendedNextAction: 'Create one low-pressure accountability or church connection step.' },
      activePath && { type: 'discipleship', summary: `${activePath.title} is active.`, recommendedNextAction: 'Complete or simplify one next step.' },
    ].filter(Boolean),
  }
}

export function orchestrateCommunityIntent(userId, intentText = '', context = {}) {
  const safe = safety(userId, intentText, 'discipleship_community_orchestrator')
  const input = lower(intentText)
  if (/church hurt|spiritual abuse|教会伤害|属灵操控/.test(input) && !/kill myself|suicide|self-harm|hurt myself|violence|weapon|自杀|自残|暴力/.test(input)) return { route: 'suffering_care', riskLevel: safe.triage.assessment.riskLevel, message: 'Route to healing journey and safe church re-entry plan before ordinary church integration.', nextEndpoint: '/api/care/healing/recommend' }
  if (shouldBlockNormalFormation(safe.triage.assessment)) return { route: 'crisis_triage', riskLevel: safe.triage.assessment.riskLevel, message: safe.triage.response.message, nextEndpoint: '/api/care/crisis/triage' }
  if (safe.shouldRoute) return { route: 'crisis_triage', riskLevel: safe.triage.assessment.riskLevel, message: safe.triage.response.message, nextEndpoint: '/api/care/crisis/triage' }
  if (/accountability|partner|group|监督|同伴|小组/.test(input)) return { route: 'accountability_group', riskLevel: safe.triage.assessment.riskLevel, message: 'Create a consent-based accountability group with clear sharing scope.', nextEndpoint: '/api/community/accountability/groups' }
  if (/mentor|coach|mentor someone|导师|陪跑/.test(input)) return { route: 'mentor_coaching', riskLevel: safe.triage.assessment.riskLevel, message: 'Create a mentor relationship with permission scope.', nextEndpoint: '/api/community/mentor/relationships' }
  if (/church|worship|communion|serve|教会|敬拜|圣餐|服事/.test(input)) return { route: 'church_integration', riskLevel: safe.triage.assessment.riskLevel, message: 'Connect personal formation with embodied church life gradually and safely.', nextEndpoint: '/api/community/church/recommend' }
  return { route: 'discipleship_pathway', riskLevel: safe.triage.assessment.riskLevel, message: 'Assess discipleship stage and create a concrete, grace-shaped path.', nextEndpoint: '/api/community/discipleship/recommend' }
}
