import {
  aiTutorRouteDefinitions,
  analyticsMetricDefinitions,
  apologeticsTopics,
  bibleCharacters,
  bibleRelationships,
  biblicalTimelineMovements,
  doctrineTopics,
  platformModules,
  productPlans,
  rolePermissions,
  skillRegistry,
} from '../data/platformIntegrationSeed'
import { todayKey, uid } from './scriptureFormationEngine'
import { shouldBlockNormalFormation, triageText } from './sufferingCareEngine'

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

function safety(userId, text, source = 'platform_integration') {
  const triage = triageText(userId, text, source)
  const risky = /kill myself|suicide|self-harm|hurt myself|abuse|violence|coerc|spiritual abuse|unsafe|自杀|自残|暴力|虐待|属灵操控|强迫/.test(lower(text))
  return { triage, shouldRoute: shouldBlockNormalFormation(triage.assessment) || risky }
}

export function searchBibleCharacters(query = '') {
  const q = lower(query)
  return bibleCharacters.filter((character) => !q || lower(character.displayName).includes(q) || lower(character.primaryRole).includes(q)).slice(0, 30)
}

export function getBibleCharacterProfile(name = 'David') {
  const character = bibleCharacters.find((item) => lower(item.displayName) === lower(name)) || bibleCharacters.find((item) => item.displayName === 'David') || bibleCharacters[0]
  const relationships = bibleRelationships.filter((rel) => rel.sourceName === character.displayName || rel.targetName === character.displayName)
  return {
    ...character,
    relationships,
    themes: character.displayName === 'Jesus' ? ['messiah', 'kingdom', 'new_creation'] : ['covenant', 'kingdom', 'grace_and_warning'],
    events: biblicalTimelineMovements.filter((movement) => character.scriptureReferences.some((ref) => movement.scriptureReferences.includes(ref))).slice(0, 3),
    formationInsights: [{
      lesson: character.displayName === 'David' ? 'Courage and repentance belong together.' : 'Notice grace and warning in canonical context.',
      caution: character.moralComplexityNote,
      linkedModules: character.displayName === 'David' ? ['virtue_vice', 'confession_repentance'] : ['scripture_formation', 'worldview_formation'],
    }],
  }
}

export function findBibleRelationshipPath(sourceName = 'David', targetName = 'Jesus') {
  const queue = [{ name: sourceName, path: [] }]
  const visited = new Set()
  while (queue.length) {
    const current = queue.shift()
    if (current.name === targetName) {
      return { source: sourceName, target: targetName, path: current.path, notes: 'This path follows explicit or marked relationships; debated/inferred claims are labeled.' }
    }
    if (visited.has(current.name) || current.path.length >= 4) continue
    visited.add(current.name)
    bibleRelationships
      .filter((rel) => rel.sourceName === current.name || rel.targetName === current.name)
      .forEach((rel) => {
        const next = rel.sourceName === current.name ? rel.targetName : rel.sourceName
        queue.push({
          name: next,
          path: [...current.path, { from: current.name, relationship: rel.relationshipType, to: next, confidence: rel.confidenceLevel, scriptureReferences: rel.scriptureReferences }],
        })
      })
  }
  return { source: sourceName, target: targetName, path: [], notes: 'No relationship path found within MVP depth.' }
}

export function createDoctrineLearningPath(userId, topicKey = 'christology') {
  const topic = doctrineTopics.find((item) => item.key === topicKey) || doctrineTopics[0]
  return {
    id: uid('doctrine_path'),
    userId,
    topicKey: topic.key,
    title: topic.title,
    lessons: topic.lessons.map((lesson, index) => ({ ...lesson, status: index === 0 ? 'active' : 'planned' })),
    traditionNotes: topic.traditionNotes,
    status: 'active',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createApologeticsDialogue(userId, topicKey = 'problem_of_evil', question = 'How can Christians respond charitably?') {
  const topic = apologeticsTopics.find((item) => item.key === topicKey) || apologeticsTopics[0]
  const safe = safety(userId, question, 'apologetics_dialogue')
  return {
    id: uid('apologetics_dialogue'),
    userId,
    topicKey: topic.key,
    question,
    response: safe.shouldRoute ? 'This question includes safety concerns. Route to care before ordinary apologetics.' : `${topic.title}: answer truthfully and charitably, distinguish evidence, interpretation, tradition, and application.`,
    cautions: ['Do not demean other religions or worldviews.', 'Do not use apologetics to coerce.', 'Do not provide legal, medical, or financial advice.'],
    riskFlags: safe.shouldRoute ? ['route_to_care'] : [],
    createdAt: nowIso(),
  }
}

export function buildBibleDoctrineDashboard(data = {}, userId = 'local-user') {
  const latestPath = (data.doctrinePaths || []).find((path) => path.userId === userId) || null
  return {
    characterCount: bibleCharacters.length,
    timelineMovementCount: biblicalTimelineMovements.length,
    doctrineTopicCount: doctrineTopics.length,
    apologeticsTopicCount: apologeticsTopics.length,
    latestDoctrinePath: latestPath,
    recommendedNextStep: latestPath ? 'Complete one doctrine lesson with Scripture and formation application.' : 'Search David, Jesus, or Paul and create one doctrine learning path.',
  }
}

export function routeFormationIntent(userId, intentText = '') {
  const safe = safety(userId, intentText, 'ai_formation_agent')
  if (safe.shouldRoute) return { module: 'suffering_care', skill: 'crisis_triage', endpoint: '/api/care/crisis/triage', riskLevel: safe.triage.assessment.riskLevel, blockedNormalFormation: true, message: safe.triage.response.message }
  const input = lower(intentText)
  const match = aiTutorRouteDefinitions.find(([key]) => input.includes(key) || (key === 'bible' && /doctrine|apologetics|character/.test(input)) || (key === 'calling' && /gift|ministry|mission/.test(input)))
  const [, module, skill] = match || ['general', 'ai_formation_agent', 'recommendation_engine']
  return {
    module,
    skill,
    endpoint: `/api/${module.replaceAll('_', '-')}/${skill.replaceAll('_', '-')}`,
    riskLevel: safe.triage.assessment.riskLevel,
    blockedNormalFormation: false,
    message: match ? `Route to ${module}.${skill}.` : 'Generate a gentle next-step recommendation.',
    whyThisRoute: match ? [`Intent matched ${match[0]}`] : ['No specific module phrase detected'],
  }
}

export function createSpiritualProfile(userId, data = {}) {
  return {
    id: uid('spiritual_profile'),
    userId,
    profileVersion: 1,
    currentSeason: data.currentSeason || 'stable_growth',
    spiritualStageSummary: data.spiritualStageSummary || 'Growing through Scripture, prayer, community, and ordinary obedience.',
    primaryGrowthFocus: data.primaryGrowthFocus || 'prayerful stability',
    preferredPracticeStyle: data.preferredPracticeStyle || ['short', 'reflective', 'structured'],
    cautionFlags: data.cautionFlags || [],
    consentSettings: data.consentSettings || { aiTutor: true, mentor: false, group: false },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createMemoryItem(userId, data = {}) {
  return {
    id: uid('spiritual_memory'),
    userId,
    memoryType: data.memoryType || 'grace_evidence',
    title: data.title || 'Grace evidence',
    content: data.content || 'The user returned to a small faithful practice.',
    evidence: data.evidence || [],
    sourceModule: data.sourceModule || 'ai_formation_agent',
    confidenceLevel: data.confidenceLevel || 'moderate',
    sensitivityLevel: data.sensitivityLevel || 'normal',
    active: true,
    expiresAt: data.expiresAt || null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function generateDailyFormationPlan(userId, data = {}, context = '') {
  const safe = safety(userId, context, 'daily_formation_plan')
  const burnedOut = /burn.?out|burned out|exhaust|overload|耗尽|过载/.test(lower(context))
  const practices = burnedOut
    ? [{ module: 'holy_habit', skill: 'sabbath_rest', title: 'Receive one rest practice', durationMinutes: 5, minimumVersion: 'Stop and breathe one prayer.', reason: 'Burnout reduces the plan before adding more.' }]
    : [
        { module: 'prayer_communion', skill: 'prayer_rule', title: 'Morning surrender prayer', durationMinutes: 5, minimumVersion: 'One sentence prayer.', reason: 'Gentle prayer starts without performance.' },
        { module: 'scripture_formation', skill: 'lectio_divina', title: 'Read one Psalm slowly', durationMinutes: 8, minimumVersion: 'Read one verse.', reason: 'Scripture anchors the day.' },
        { module: 'virtue_vice', skill: 'virtue_formation', title: 'One small obedience of love', durationMinutes: 3, minimumVersion: 'Send one honest encouragement.', reason: 'Formation becomes concrete love.' },
      ]
  return {
    id: uid('daily_plan'),
    userId,
    planDate: todayKey(),
    planTitle: burnedOut ? 'A reduced faithful day' : 'A simple faithful day',
    planSummary: safe.shouldRoute ? 'Normal formation is blocked by safety routing.' : 'A gentle plan limited to a few explainable practices.',
    energyLevelAssumption: burnedOut ? 'low' : 'normal',
    primaryFocus: burnedOut ? 'rest and safety' : 'prayerful stability',
    practices,
    guardrails: ['Do not add extra practices if overloaded.', 'Minimum versions count.'],
    humanSupportRecommendation: safe.shouldRoute ? { type: 'crisis_or_care', message: safe.triage.response.message } : null,
    status: safe.shouldRoute ? 'blocked' : 'active',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function generateWeeklyFormationReview(userId, activity = {}) {
  return {
    id: uid('weekly_agent_review'),
    userId,
    weekStart: dateDaysFromNow(-7),
    weekEnd: todayKey(),
    summary: 'This review highlights grace evidence, growth indicators, struggle patterns, and a gentle next focus without spiritual ranking.',
    graceEvidence: activity.graceEvidence || ['Returned to one small practice.'],
    growthEvidence: activity.growthEvidence || ['One concrete act of prayer or obedience was recorded.'],
    strugglePatterns: activity.strugglePatterns || [],
    overloadSigns: activity.overloadSigns || [],
    recommendedAdjustments: activity.overloadSigns?.length ? ['simplify plan', 'restore rest'] : ['continue one small rhythm'],
    recommendedNextFocus: { module: 'prayer_communion', title: 'Keep one short prayer rhythm.' },
    humanSupportRecommendation: activity.overloadSigns?.length ? { type: 'mentor', message: 'Consider human support if overload continues.' } : null,
    createdAt: nowIso(),
  }
}

export function createTutorConversation(userId, prompt = 'Help me choose one faithful next step.') {
  const route = routeFormationIntent(userId, prompt)
  return {
    id: uid('tutor_conversation'),
    userId,
    prompt,
    route,
    messages: [
      { role: 'user', content: prompt },
      { role: 'assistant', content: route.blockedNormalFormation ? route.message : `I can help route this to ${route.module}. I am not God, a pastor, therapist, or emergency service.` },
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function aggregateFormationMetrics(userId, sourceData = {}) {
  const values = analyticsMetricDefinitions.map((definition) => ({
    id: uid('metric_value'),
    userId,
    metricKey: definition.key,
    metricDefinitionId: definition.id,
    metricDate: todayKey(),
    periodType: 'weekly',
    periodStart: dateDaysFromNow(-7),
    periodEnd: todayKey(),
    numericValue: ['count', 'percentage'].includes(definition.valueType) ? Number(sourceData[definition.key] ?? 0) : null,
    textValue: definition.valueType === 'text' ? String(sourceData[definition.key] || '') : null,
    jsonValue: definition.valueType === 'json' ? (sourceData[definition.key] || {}) : null,
    confidenceScore: sourceData[definition.key] === undefined ? 0 : 1,
    sourceSummary: { note: sourceData[definition.key] === undefined ? 'No source record supplied; zero/empty value used.' : 'User-entered or recorded module value.' },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }))
  const overloadSignals = values.some((value) => value.metricKey === 'active_overload_signal_count' && value.numericValue > 0)
    ? [createOverloadSignal(userId, 'too_many_habits', 'moderate')]
    : []
  return { values, overloadSignals, graceEvidence: [] }
}

export function createGraceEvidence(userId, data = {}) {
  return {
    id: uid('grace_evidence'),
    userId,
    evidenceDate: todayKey(),
    sourceModule: data.sourceModule || 'formation_analytics',
    evidenceType: data.evidenceType || 'restored_practice',
    title: data.title || 'Restored practice',
    description: data.description || 'A small return to faithfulness is grace evidence.',
    visibility: data.visibility || 'private',
    sensitivityLevel: data.sensitivityLevel || 'normal',
    createdAt: nowIso(),
  }
}

export function createOverloadSignal(userId, signalType = 'burnout_language', severity = 'moderate') {
  return {
    id: uid('overload_signal'),
    userId,
    signalDate: todayKey(),
    sourceModule: 'formation_analytics',
    signalType,
    severity,
    evidence: ['activity/rest imbalance or burnout language'],
    recommendedResponse: 'Simplify practices and restore rest before expanding.',
    status: 'active',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createAnalyticsReport(userId, metrics = [], graceEvidence = [], overloadSignals = []) {
  return {
    id: uid('formation_report'),
    userId,
    reportType: 'monthly',
    periodStart: dateDaysFromNow(-30),
    periodEnd: todayKey(),
    summary: 'Formation indicators show patterns for reflection, not a holiness score.',
    graceEvidence: graceEvidence.map((item) => item.title),
    growthIndicators: metrics.slice(0, 5).map((item) => `${item.metricKey}: ${item.numericValue ?? 'recorded'}`),
    cautions: overloadSignals.map((item) => item.recommendedResponse),
    mentorSafeSummary: 'Redacted summary: share only practice patterns, grace evidence, and non-sensitive next steps with consent.',
    createdAt: nowIso(),
  }
}

export function createSafetyIntegrityAudit(userId, data = {}) {
  return {
    id: uid('integrity_audit'),
    userId,
    auditDate: todayKey(),
    auditType: data.auditType || 'theology_privacy_safety',
    findings: [
      'No holiness leaderboard.',
      'Sensitive care/crisis/confession data remains private unless consented and redacted.',
      'AI recommendations include safety and theological boundary language.',
    ],
    riskLevel: data.riskLevel || 'low',
    recommendedActions: ['Keep reports permission-scoped.', 'Route crisis before analytics celebration.'],
    createdAt: nowIso(),
  }
}

export function createOrganization(userId, data = {}) {
  return {
    id: uid('organization'),
    ownerUserId: userId,
    name: data.name || 'Local Church Workspace',
    organizationType: data.organizationType || 'church',
    planKey: data.planKey || 'church',
    status: 'active',
    featureFlags: data.featureFlags || ['scripture_formation', 'prayer_communion', 'suffering_care', 'analytics'],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function addOrganizationMember(userId, organization, data = {}) {
  const role = data.role || 'mentor'
  return {
    id: uid('org_member'),
    organizationId: organization.id,
    userId: data.userId || userId,
    invitedByUserId: userId,
    role,
    permissions: rolePermissions.find((item) => item.role === role)?.permissions || ['self.manage'],
    status: 'active',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createModerationCase(userId, organization, data = {}) {
  return {
    id: uid('moderation_case'),
    organizationId: organization?.id || null,
    createdByUserId: userId,
    caseType: data.caseType || 'risk_review',
    severity: data.severity || 'moderate',
    title: data.title || 'Risk and safety review',
    summary: data.summary || 'Review sensitive content with redaction and consent boundaries.',
    status: 'open',
    auditRequired: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createSubscription(userId, organization, planKey = 'church') {
  const plan = productPlans.find((item) => item.key === planKey) || productPlans[0]
  return {
    id: uid('subscription'),
    organizationId: organization?.id || null,
    userId,
    planKey: plan.key,
    status: 'active',
    monthlyLimit: plan.monthlyLimit,
    features: plan.features,
    safetyFlowsSoftFail: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createDeploymentHealthCheck(userId, data = {}) {
  return {
    id: uid('deployment_health'),
    userId,
    checkedAt: nowIso(),
    environment: data.environment || 'production',
    status: data.status || 'ready',
    checks: [
      { key: 'database', status: 'required', note: 'PostgreSQL via Supabase/Neon or equivalent.' },
      { key: 'frontend', status: 'ready', note: 'Vite build passes in this repo; full target can map to Vercel frontend.' },
      { key: 'backup', status: 'planned', note: 'Daily backup and restore drill required.' },
      { key: 'monitoring', status: 'planned', note: 'Sentry-compatible errors and OpenTelemetry-compatible traces.' },
      { key: 'crisis_availability', status: 'must_keep_available', note: 'Crisis routing must not be blocked by billing.' },
    ],
    runbook: ['Check health endpoint.', 'Review recent errors.', 'Verify database backups.', 'Escalate safety incidents immediately.'],
    createdAt: nowIso(),
  }
}

export function buildProductizationDashboard(data = {}, userId = 'local-user') {
  return {
    organizations: (data.organizations || []).filter((item) => item.ownerUserId === userId),
    members: data.organizationMembers || [],
    moderationCases: data.moderationCases || [],
    subscriptions: data.subscriptions || [],
    healthChecks: data.deploymentHealthChecks || [],
    plans: productPlans,
    permissionRoles: rolePermissions,
    guardrails: ['Tenant isolation is mandatory.', 'Admin access is audited.', 'Billing never blocks crisis routing.', 'Sensitive modules require stricter permission and consent.'],
  }
}

export function registerAllModules() {
  return platformModules.map((module) => ({
    ...module,
    route: module.key === 'master_build' ? 'full-integration' : module.key.replaceAll('_', '-'),
    status: 'registered',
    safetyFirst: true,
  }))
}

export function registerAllSkills() {
  return skillRegistry
}

export function createGlobalFormationSession(userId, data = {}) {
  const route = routeSafetyFirst(userId, data.userIntent || '', data.sourceModule || 'global')
  return {
    id: uid('global_session'),
    userId,
    sessionDate: todayKey(),
    sourceModule: data.sourceModule || 'master_build',
    sourceSkill: data.sourceSkill || 'global_domain_integration',
    userIntent: data.userIntent || 'Integrate all formation modules safely.',
    status: route.blockedNormalFormation ? 'blocked_by_safety' : 'started',
    route,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function emitFormationEvent(userId, data = {}) {
  return {
    id: uid('formation_event'),
    userId,
    eventType: data.eventType || 'module_registered',
    eventCategory: data.eventCategory || 'admin',
    sourceModule: data.sourceModule || 'master_build',
    sourceEntityId: data.sourceEntityId || null,
    payload: data.payload || {},
    createdAt: nowIso(),
  }
}

export function routeSafetyFirst(userId, text = '', sourceModule = 'global') {
  const safe = safety(userId, text, sourceModule)
  if (safe.shouldRoute) return { blockedNormalFormation: true, module: 'suffering_care', skill: 'crisis_triage', endpoint: '/api/care/crisis/triage', riskLevel: safe.triage.assessment.riskLevel, message: safe.triage.response.message }
  return { blockedNormalFormation: false, module: sourceModule, skill: 'normal_flow', endpoint: `/api/${sourceModule.replaceAll('_', '-')}`, riskLevel: safe.triage.assessment.riskLevel, message: 'Safety check passed for ordinary flow.' }
}

export function checkConsentPermission({ consent = false, permission = false, sensitivityLevel = 'normal' } = {}) {
  const sensitive = ['private', 'care_sensitive', 'crisis_sensitive'].includes(sensitivityLevel)
  return {
    allowed: sensitive ? Boolean(consent && permission) : Boolean(permission || consent),
    reason: sensitive ? 'Sensitive data requires consent and role permission.' : 'Normal data requires consent or role permission.',
    redactionRequired: sensitive,
  }
}

export function buildMasterRoadmap() {
  return {
    phases: [
      { key: 'foundation', title: 'Foundation', batches: [1, 2, 3, 4], deliverables: ['core practices', 'habit engine', 'safety shared primitives'] },
      { key: 'formation_depth', title: 'Formation Depth', batches: [5, 6, 7, 8], deliverables: ['worldview', 'care', 'community', 'calling'] },
      { key: 'knowledge_agent_analytics', title: 'Knowledge, Agent, Analytics', batches: [9, 10, 11], deliverables: ['Bible doctrine', 'AI tutor', 'reports'] },
      { key: 'enterprise', title: 'Enterprise Productization', batches: [12, 13], deliverables: ['multi-tenant', 'admin', 'roadmap', 'master build prompt'] },
    ],
    definitionOfDone: ['tests pass', 'build passes', 'safety-first routing', 'consent boundaries', 'README/docs updated', 'no crisis flow blocked by billing'],
    roles: ['individual', 'mentor', 'group_leader', 'pastor', 'church_admin', 'institution_admin', 'platform_admin'],
    acceptanceMatrix: platformModules.map((module) => ({ module: module.key, userJourney: 'discover, practice, review, share with consent, audit', testsRequired: ['engine', 'dashboard', 'safety route'] })),
  }
}
