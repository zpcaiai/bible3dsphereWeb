import { callingDomains, giftAssessmentItems, giftCallingMinistryAreas, ministryOpportunityTemplates, missionDomains, spiritualGiftDefinitions } from '../data/giftCallingSeed'
import { todayKey, uid } from './scriptureFormationEngine'
import { shouldBlockNormalFormation, triageText } from './sufferingCareEngine'

const RISK_PATTERNS = [/kill myself/i, /suicide/i, /self-harm/i, /hurt myself/i, /abuse/i, /spiritual abuse/i, /coerc/i, /pressur/i, /burn.?out/i, /burned out/i, /overcommit/i, /big platform/i, /prove myself/i, /leader says.*must/i, /guilty saying no/i, /family neglect/i, /自杀|自残|虐待|属灵操控|强迫|耗尽|逼我服事|平台|证明自己|忽略家庭/]

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

function safety(userId, text, source = 'gift_calling') {
  const triage = triageText(userId, text, source)
  const riskText = RISK_PATTERNS.some((pattern) => pattern.test(text || ''))
  const burnout = /burn.?out|burned out|exhaust|overcommit|耗尽|过载/.test(lower(text))
  const pressure = /pressure|coerc|leader says.*must|spiritual abuse|逼我服事|属灵操控/.test(lower(text))
  const platform = /big platform|famous|influence|prove myself|平台|出名|证明自己/.test(lower(text))
  return {
    triage,
    shouldRoute: shouldBlockNormalFormation(triage.assessment) || riskText,
    burnout,
    pressure,
    platform,
  }
}

function giftByKey(key) {
  return spiritualGiftDefinitions.find((gift) => gift.key === key) || spiritualGiftDefinitions[0]
}

function domainByKey(key) {
  return callingDomains.find((domain) => domain.key === key) || callingDomains[callingDomains.length - 1]
}

function areaByKey(key) {
  return giftCallingMinistryAreas.find((area) => area.key === key) || giftCallingMinistryAreas[0]
}

function scoreAverage(values) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function maturityRank(level = 'beginner') {
  return { beginner: 1, stable_member: 2, rooted_disciple: 2, mature_disciple: 3, leader_in_training: 4, elder_like: 5, elder_like_maturity: 5 }[level] || 1
}

export function listSpiritualGiftDefinitions() {
  return spiritualGiftDefinitions
}

export function listGiftAssessmentItems() {
  return giftAssessmentItems
}

export function startGiftAssessment(userId, data = {}) {
  const safe = safety(userId, data.contextNote || '', 'spiritual_gifts_assessment')
  return {
    id: uid('gift_assessment'),
    userId,
    assessmentDate: todayKey(),
    assessmentType: data.assessmentType || 'self',
    status: 'started',
    contextNote: data.contextNote || '',
    rawAnswers: {},
    riskFlags: safe.shouldRoute ? ['route_to_care', safe.triage.assessment.riskLevel] : [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    completedAt: null,
  }
}

export function submitGiftAssessment(userId, assessment, answers = {}) {
  const completed = {
    ...assessment,
    userId,
    rawAnswers: answers,
    status: 'completed',
    completedAt: nowIso(),
    updatedAt: nowIso(),
  }
  const scores = calculateGiftScores(completed)
  const profile = generateGiftProfile(userId, completed, scores, [])
  return { assessment: completed, scores, profile }
}

export function calculateGiftScores(assessment) {
  const answers = assessment.rawAnswers || {}
  return spiritualGiftDefinitions.map((gift) => {
    const items = giftAssessmentItems.filter((item) => item.giftKeys.includes(gift.key))
    const values = items.map((item) => Number(answers[item.key] || 3))
    const score = Math.round(((scoreAverage(values) - 1) / 4) * 100)
    const evidence = items.filter((item) => Number(answers[item.key] || 3) >= 4).map((item) => item.questionText)
    const desireOnly = items.some((item) => item.category === 'desire' && Number(answers[item.key] || 3) >= 4) && !items.some((item) => item.category === 'fruit' && Number(answers[item.key] || 3) >= 4)
    const confidenceScore = Math.max(0.35, Math.min(0.82, 0.45 + evidence.length * 0.08 - (desireOnly ? 0.12 : 0)))
    return {
      id: uid('gift_score'),
      assessmentId: assessment.id,
      giftKey: gift.key,
      giftDefinitionId: gift.id,
      score,
      confidenceScore,
      evidence,
      cautions: gift.misuseRisks,
      createdAt: nowIso(),
    }
  }).sort((a, b) => b.score - a.score)
}

export function addGiftFeedback(userId, data = {}) {
  const safe = safety(userId, `${data.evidenceText || ''} ${data.cautionText || ''}`, 'gift_feedback')
  return {
    id: uid('gift_feedback'),
    userId,
    giverUserId: data.giverUserId || null,
    giverRole: data.giverRole || 'mentor',
    relatedAssessmentId: data.relatedAssessmentId || null,
    observedGiftKeys: data.observedGiftKeys || ['encouragement'],
    evidenceText: data.evidenceText || 'Observed faithful encouragement and practical service.',
    cautionText: data.cautionText || '',
    ministryContext: data.ministryContext || 'small group',
    visibleToUser: data.visibleToUser !== false,
    riskFlags: safe.shouldRoute ? ['route_to_care'] : [],
    createdAt: nowIso(),
  }
}

export function generateGiftProfile(userId, assessment = null, scores = [], feedbackEntries = []) {
  const ranked = scores.length ? scores : calculateGiftScores(assessment || { id: 'synthetic', rawAnswers: {} })
  const feedbackGiftKeys = feedbackEntries.flatMap((entry) => entry.observedGiftKeys || [])
  const adjusted = ranked.map((score) => {
    const feedbackCount = feedbackGiftKeys.filter((key) => key === score.giftKey).length
    const gift = giftByKey(score.giftKey)
    return {
      giftKey: score.giftKey,
      score: Math.min(100, score.score + feedbackCount * 4),
      confidence: Math.min(0.95, score.confidenceScore + feedbackCount * 0.08),
      evidence: [...(score.evidence || []).slice(0, 3), ...feedbackEntries.filter((entry) => entry.observedGiftKeys?.includes(score.giftKey)).map((entry) => entry.evidenceText).slice(0, 2)],
      cautions: gift.misuseRisks,
    }
  }).sort((a, b) => b.score - a.score)
  return {
    id: uid('gift_profile'),
    userId,
    profileDate: todayKey(),
    primaryGifts: adjusted.slice(0, 3).map((item) => ({ ...item, label: `possible primary gift: ${giftByKey(item.giftKey).displayName}` })),
    secondaryGifts: adjusted.slice(3, 6),
    possibleGifts: adjusted.slice(6, 10),
    naturalStrengths: adjusted.slice(0, 2).map((item) => item.giftKey),
    learnedSkills: adjusted.filter((item) => ['teaching', 'administration', 'craftsmanship', 'music_worship'].includes(item.giftKey)).slice(0, 3).map((item) => item.giftKey),
    ministryBurdens: feedbackEntries.map((entry) => entry.ministryContext).filter(Boolean).slice(0, 4),
    maturityCautions: ['Giftedness is not leadership readiness.', 'Ask for community confirmation before committing to a role.'],
    misuseRisks: adjusted.slice(0, 3).flatMap((item) => item.cautions || []).slice(0, 5),
    communityConfirmationNeeded: true,
    recommendedNextSteps: ['Ask a mentor or ministry leader for confirmation.', 'Try one low-risk serving experiment and review fruit.', 'Pair gifting with humility and character formation.'],
    summary: 'Possible gifts are signs to test through love, service, fruit, and community confirmation.',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createCallingSession(userId, data = {}) {
  const safe = safety(userId, `${data.title || ''} ${data.discernmentQuestion || ''}`, 'calling_discernment')
  return {
    id: uid('calling_session'),
    userId,
    sessionDate: todayKey(),
    title: data.title || 'Calling discernment session',
    discernmentQuestion: data.discernmentQuestion || 'Where should I serve faithfully in this season?',
    status: 'started',
    riskFlags: safe.shouldRoute ? ['route_to_care', safe.triage.assessment.riskLevel] : [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    completedAt: null,
  }
}

export function addCallingInput(userId, session, data = {}) {
  return {
    id: uid('calling_input'),
    sessionId: session.id,
    userId,
    inputType: data.inputType || 'burden',
    title: data.title || 'Calling input',
    description: data.description || 'A burden, opportunity, gift, feedback, or fruit evidence to test wisely.',
    evidence: data.evidence || [],
    weight: Number(data.weight || 5),
    createdAt: nowIso(),
  }
}

function inferDomainFromInputs(inputs = [], giftProfile = null) {
  const text = lower(inputs.map((input) => `${input.title} ${input.description}`).join(' '))
  const gifts = giftProfile?.primaryGifts?.map((gift) => gift.giftKey) || []
  if (/teach|bible|disciple|study|doctrine|教导|门训/.test(text) || gifts.includes('teaching')) return domainByKey('teaching_discipleship')
  if (/mercy|justice|poor|suffer|care|怜悯|公义|照顾/.test(text) || gifts.includes('mercy')) return domainByKey('mercy_justice')
  if (/evangel|mission|cross.?cultural|宣教|传福音/.test(text) || gifts.includes('mission')) return domainByKey('evangelism_mission')
  if (/work|career|marketplace|职业|工作/.test(text)) return domainByKey('marketplace_witness')
  if (/hospitality|table|neighbor|接待|邻舍/.test(text) || gifts.includes('hospitality')) return domainByKey('hospitality_community')
  if (/prayer|intercession|祷告|代祷/.test(text) || gifts.includes('intercession')) return domainByKey('prayer_intercession')
  return domainByKey('teaching_discipleship')
}

export function analyzeCalling(userId, session, inputs = [], giftProfile = null) {
  const safe = safety(userId, inputs.map((input) => input.description).join(' '), 'calling_discernment_analysis')
  const domain = inferDomainFromInputs(inputs, giftProfile)
  const evidence = [
    ...inputs.slice(0, 4).map((input) => input.title),
    ...(giftProfile?.primaryGifts || []).slice(0, 2).map((gift) => `Gift profile suggests ${gift.giftKey}`),
  ]
  const fruitCount = inputs.filter((input) => input.inputType === 'fruit_evidence' || /fruit|feedback|confirmed/i.test(input.description)).length
  const confidenceLevel = safe.shouldRoute ? 'low' : evidence.length + fruitCount >= 5 ? 'high' : evidence.length >= 3 ? 'moderate' : 'low'
  const cautions = [
    'Calling is tested through faithful experiments, not declared as certainty.',
    safe.platform && 'Platform ambition should be answered with hidden service and humility.',
    safe.burnout && 'Burnout calls for rest and capacity review before expansion.',
    safe.pressure && 'Coercive ministry pressure routes to suffering care and pastoral care.',
  ].filter(Boolean)
  return {
    routed: safe.shouldRoute,
    triage: safe.triage,
    possibleCallingPatterns: [{
      domain: domain.key,
      confidence: confidenceLevel,
      evidence,
      cautions,
      recommendedExperiment: {
        title: domain.key === 'teaching_discipleship' ? 'Teach one 20-minute Bible study in small group' : `Try one low-risk ${domain.displayName} service experiment`,
        successCriteria: ['Fruit is observed by others.', 'A mentor or leader gives feedback.', 'User remains teachable and within capacity.'],
      },
    }],
    notYetClear: ['Long-term vocational calling needs more fruit evidence and time.'],
    nextSteps: ['Create one calling experiment.', 'Ask mentor for feedback.', 'Review fruit after 30 days.'],
  }
}

export function createCallingPattern(userId, analysis) {
  const pattern = analysis.possibleCallingPatterns[0]
  const domain = domainByKey(pattern.domain)
  return {
    id: uid('calling_pattern'),
    userId,
    callingDomainId: domain.id,
    callingDomainKey: domain.key,
    title: domain.displayName,
    description: `Possible calling pattern in ${domain.displayName}.`,
    evidenceSummary: pattern.evidence,
    giftsInvolved: domain.relatedGifts,
    burdensInvolved: [],
    skillsInvolved: [],
    communityConfirmations: [],
    fruitEvidence: [],
    cautions: pattern.cautions,
    confidenceLevel: pattern.confidence,
    status: pattern.confidence === 'high' ? 'testing' : 'possible',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createCallingExperiment(userId, pattern, data = {}) {
  return {
    id: uid('calling_experiment'),
    userId,
    callingPatternId: pattern?.id || null,
    title: data.title || `Test ${pattern?.title || 'calling'} in a low-risk way`,
    description: data.description || 'A concrete experiment to test gifts, burden, fruit, community feedback, and capacity.',
    experimentType: data.experimentType || 'serve_once',
    startDate: todayKey(),
    endDate: data.endDate || dateDaysFromNow(30),
    successCriteria: data.successCriteria || ['fruit observed', 'mentor feedback received', 'capacity remains healthy'],
    status: 'planned',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function reviewCallingExperiment(userId, experiment, data = {}) {
  const fruit = data.fruitObserved || []
  const feedback = data.feedbackReceived || []
  return {
    id: uid('calling_experiment_review'),
    userId,
    experimentId: experiment.id,
    reviewDate: todayKey(),
    energyLevel: Number(data.energyLevel || 6),
    fruitObserved: fruit,
    feedbackReceived: feedback,
    difficulties: data.difficulties || [],
    characterExposure: data.characterExposure || [],
    desireAfter: data.desireAfter || '',
    recommendedNextStep: Number(data.energyLevel || 6) <= 3 ? 'pause and simplify before more experiments' : 'repeat a small experiment with feedback',
    summary: `${fruit.length} fruit marker(s), ${feedback.length} feedback marker(s). Calling remains discerned, not declared.`,
    createdAt: nowIso(),
  }
}

export function createMinistryOpportunity(userId, data = {}) {
  const template = ministryOpportunityTemplates.find((item) => item.key === data.templateKey) || ministryOpportunityTemplates[0]
  return {
    ...template,
    id: uid('ministry_opportunity'),
    createdByUserId: userId,
    title: data.title || template.title,
    description: data.description || template.description,
    active: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createCapacityProfile(userId, data = {}) {
  const burnout = Number(data.currentBurnoutLevel ?? 3)
  return {
    id: uid('ministry_capacity'),
    userId,
    profileDate: todayKey(),
    weeklyAvailableHours: Number(data.weeklyAvailableHours ?? 3),
    preferredCommitmentType: data.preferredCommitmentType || 'one_time',
    currentBurnoutLevel: burnout,
    currentFamilyLoad: Number(data.currentFamilyLoad ?? 5),
    currentWorkLoad: Number(data.currentWorkLoad ?? 5),
    currentChurchLoad: Number(data.currentChurchLoad ?? 3),
    emotionalCapacity: Number(data.emotionalCapacity ?? 6),
    leadershipReadiness: Number(data.leadershipReadiness ?? 4),
    safeguardingLimitations: data.safeguardingLimitations || [],
    boundaryNotes: data.boundaryNotes || (burnout >= 7 ? 'Start with rest and no high-load roles.' : 'Begin small and review capacity.'),
    createdAt: nowIso(),
  }
}

export function scoreOpportunityForUser(opportunity, giftProfile = null, callingPatterns = [], capacityProfile = null) {
  const primaryGifts = giftProfile?.primaryGifts?.map((gift) => gift.giftKey) || []
  const secondaryGifts = giftProfile?.secondaryGifts?.map((gift) => gift.giftKey) || []
  const giftMatches = [...(opportunity.requiredGifts || []), ...(opportunity.helpfulGifts || [])].filter((gift) => primaryGifts.includes(gift) || secondaryGifts.includes(gift)).length
  const giftFitScore = Math.min(1, 0.35 + giftMatches * 0.22)
  const callingFitScore = callingPatterns.some((pattern) => domainByKey(pattern.callingDomainKey).relatedMinistryAreas?.includes(opportunity.ministryAreaKey)) ? 0.9 : 0.55
  const capacity = capacityProfile || createCapacityProfile('local-user')
  const capacityFitScore = capacity.currentBurnoutLevel >= 7 || opportunity.weeklyHours > capacity.weeklyAvailableHours ? 0.35 : opportunity.emotionalLoad === 'high' && capacity.emotionalCapacity < 6 ? 0.45 : 0.88
  const maturityFitScore = maturityRank(capacity.leadershipReadiness >= 7 ? 'mature_disciple' : 'beginner') >= maturityRank(opportunity.maturityLevelRequired) ? 0.88 : 0.42
  const riskFitScore = opportunity.safeguardingRequired && capacity.leadershipReadiness < 5 ? 0.45 : capacity.currentBurnoutLevel >= 7 ? 0.32 : 0.86
  const matchScore = Number((giftFitScore * 0.25 + callingFitScore * 0.2 + capacityFitScore * 0.2 + maturityFitScore * 0.2 + riskFitScore * 0.15).toFixed(2))
  return { giftFitScore, callingFitScore, capacityFitScore, maturityFitScore, riskFitScore, matchScore }
}

export function generateMinistryMatches(userId, opportunities = ministryOpportunityTemplates, giftProfile = null, callingPatterns = [], capacityProfile = null) {
  return opportunities.map((opportunity) => {
    const scores = scoreOpportunityForUser(opportunity, giftProfile, callingPatterns, capacityProfile)
    const cautions = [
      capacityProfile?.currentBurnoutLevel >= 7 && 'Burnout is high. Rest and reduce load before serving.',
      opportunity.safeguardingRequired && 'Safeguarding training and approval are required.',
      opportunity.mentorApprovalRequired && 'Ask a mentor or ministry leader before starting.',
      scores.maturityFitScore < 0.6 && 'Do not confuse giftedness with readiness for authority.',
    ].filter(Boolean)
    return {
      id: uid('ministry_match'),
      userId,
      opportunityId: opportunity.id,
      opportunity,
      matchScore: scores.matchScore,
      giftFitScore: scores.giftFitScore,
      callingFitScore: scores.callingFitScore,
      capacityFitScore: scores.capacityFitScore,
      maturityFitScore: scores.maturityFitScore,
      riskFitScore: scores.riskFitScore,
      reasons: [
        `${areaByKey(opportunity.ministryAreaKey).displayName} matches at least one ordinary service pathway.`,
        scores.capacityFitScore >= 0.8 ? 'Current capacity can support a small starting step.' : 'Capacity requires a smaller or delayed starting step.',
        opportunity.emotionalLoad === 'low' ? 'Low emotional load makes this a safer beginning.' : 'Emotional load requires review and support.',
      ],
      cautions,
      recommendedStartingStep: cautions.length ? 'Observe once and seek feedback before committing.' : 'Observe once, then serve once next month.',
      status: 'suggested',
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }
  }).sort((a, b) => b.matchScore - a.matchScore)
}

export function createServiceTrial(userId, matchResult, data = {}) {
  return {
    id: uid('service_trial'),
    userId,
    opportunityId: matchResult.opportunityId,
    matchResultId: matchResult.id,
    title: data.title || `Trial: ${matchResult.opportunity?.title || 'ministry service'}`,
    startDate: todayKey(),
    endDate: data.endDate || dateDaysFromNow(30),
    trialType: data.trialType || 'observe',
    successCriteria: data.successCriteria || ['serve within capacity', 'receive feedback', 'observe fruit'],
    status: 'planned',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function reviewServiceTrial(userId, trial, data = {}) {
  const energyCost = Number(data.energyCostScore ?? 4)
  return {
    id: uid('service_review'),
    userId,
    serviceTrialId: trial.id,
    reviewDate: todayKey(),
    joyScore: Number(data.joyScore ?? 0),
    energyCostScore: energyCost,
    fruitEvidence: data.fruitEvidence || [],
    feedbackReceived: data.feedbackReceived || [],
    concerns: data.concerns || [],
    boundaryAdjustments: energyCost >= 8 ? ['reduce frequency', 'ask for support'] : ['keep current limits'],
    recommendedNextStep: energyCost >= 8 ? 'reduce' : 'continue',
    summary: energyCost >= 8 ? 'Trial showed overload risk. Reduce or pause.' : 'Trial can continue with feedback and boundaries.',
    createdAt: nowIso(),
  }
}

export function createMissionLifeProfile(userId, data = {}) {
  const safe = safety(userId, `${data.vocationSummary || ''} ${data.familyContext || ''} ${data.workContext || ''}`, 'mission_life_profile')
  return {
    id: uid('mission_profile'),
    userId,
    profileDate: todayKey(),
    title: data.title || 'Mission life profile',
    lifeSeason: data.lifeSeason || 'single_worker',
    vocationSummary: data.vocationSummary || 'Faithful work, church life, neighbor love, and ordinary witness.',
    familyContext: data.familyContext || '',
    churchContext: data.churchContext || '',
    neighborhoodContext: data.neighborhoodContext || '',
    workContext: data.workContext || '',
    keyConstraints: data.keyConstraints || (safe.burnout ? ['burnout risk'] : []),
    keyOpportunities: data.keyOpportunities || ['workplace witness', 'hospitality', 'church service'],
    riskFlags: safe.shouldRoute ? ['route_to_care', safe.triage.assessment.riskLevel] : [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function designMissionLife(userId, profile, giftProfile = null, callingPatterns = [], contextText = '') {
  const safe = safety(userId, `${JSON.stringify(profile || {})} ${contextText}`, 'mission_life_design')
  const primaryGift = giftProfile?.primaryGifts?.[0]?.giftKey
  const recommended = [
    missionDomains.find((domain) => domain.key === 'workplace_witness'),
    profile?.lifeSeason === 'parent' ? missionDomains.find((domain) => domain.key === 'family_discipleship') : missionDomains.find((domain) => domain.key === 'hospitality'),
    primaryGift === 'intercession' ? missionDomains.find((domain) => domain.key === 'prayer_mission') : missionDomains.find((domain) => domain.key === 'church_service'),
    safe.burnout ? missionDomains.find((domain) => domain.key === 'rest_as_witness') : missionDomains.find((domain) => domain.key === 'skill_stewardship'),
  ].filter(Boolean)
  return {
    routed: shouldBlockNormalFormation(safe.triage.assessment),
    triage: safe.triage,
    lifeSeason: profile?.lifeSeason || 'single_worker',
    missionSummary: safe.burnout ? 'Simplify mission around rest, church support, and ordinary responsibilities before adding projects.' : 'Live as a faithful witness in work, church, friendships, and stewardship.',
    recommendedDomains: recommended.map((domain) => ({
      domain: domain.key,
      commitment: domain.key === 'workplace_witness' ? 'Pray before work and practice truthful, excellent, non-anxious work.' : `Practice ${domain.displayName.toLowerCase()} with one small concrete action.`,
      minimumViableAction: domain.relatedPractices?.[0] || 'one small faithful action',
    })),
    missionProjectSuggestions: [{ title: 'Monthly hospitality or service experiment', type: 'neighborhood', desiredFruit: ['friendship', 'presence', 'gospel openness'] }],
    guardrails: ['Do not add mission projects if Sabbath and church rhythm are collapsing.', 'Keep first step small and embodied.', safe.platform && 'Prefer hidden service over public platform.'].filter(Boolean),
  }
}

export function createMissionCommitment(userId, profile, data = {}) {
  const domain = missionDomains.find((item) => item.key === data.domainKey) || missionDomains[0]
  return {
    id: uid('mission_commitment'),
    userId,
    profileId: profile.id,
    missionDomainId: domain.id,
    missionDomainKey: domain.key,
    commitmentTitle: data.commitmentTitle || domain.displayName,
    commitmentDescription: data.commitmentDescription || `Practice ${domain.displayName.toLowerCase()} as ordinary mission.`,
    practiceFrequency: data.practiceFrequency || 'weekly',
    minimumViableAction: data.minimumViableAction || domain.relatedPractices?.[0] || 'one small action',
    normalAction: data.normalAction || domain.relatedPractices?.[1] || '',
    stretchAction: data.stretchAction || domain.relatedPractices?.[2] || '',
    relatedHabitPlanId: null,
    status: 'active',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createMissionProject(userId, profile, data = {}) {
  return {
    id: uid('mission_project'),
    userId,
    profileId: profile?.id || null,
    title: data.title || 'Monthly hospitality dinner',
    description: data.description || 'One embodied mission project with clear boundaries.',
    projectType: data.projectType || 'neighborhood',
    startDate: todayKey(),
    endDate: data.endDate || '',
    desiredFruit: data.desiredFruit || ['friendship', 'presence', 'gospel openness'],
    collaborators: data.collaborators || [],
    risks: data.risks || ['overcommitment'],
    status: 'planned',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function addMissionProjectLog(userId, project, data = {}) {
  return {
    id: uid('mission_project_log'),
    userId,
    projectId: project.id,
    logDate: todayKey(),
    actionTaken: data.actionTaken || '',
    fruitObserved: data.fruitObserved || [],
    obstacles: data.obstacles || [],
    prayerNeeds: data.prayerNeeds || [],
    nextStep: data.nextStep || '',
    createdAt: nowIso(),
  }
}

export function generateMissionLifeReview(userId, profile, commitments = [], projects = [], logs = []) {
  const overloadSigns = commitments.length > 4 || projects.length > 2 ? ['too many active commitments'] : []
  return {
    id: uid('mission_review'),
    userId,
    profileId: profile.id,
    reviewPeriodStart: profile.profileDate,
    reviewPeriodEnd: todayKey(),
    faithfulnessEvidence: commitments.map((commitment) => commitment.commitmentTitle),
    fruitEvidence: logs.flatMap((log) => log.fruitObserved || []),
    overloadSigns,
    neglectedDomains: commitments.some((commitment) => commitment.missionDomainKey === 'rest_as_witness') ? [] : ['rest_as_witness'],
    recommendedAdjustments: overloadSigns.length ? ['simplify to two commitments', 'restore rest rhythm'] : ['continue small embodied mission'],
    summary: `${commitments.length} commitment(s), ${projects.length} project(s), ${logs.length} log(s). Mission life is stewardship, not savior complex.`,
    createdAt: nowIso(),
  }
}

export function buildGiftCallingDashboard(data = {}) {
  const userId = data.userId || 'local-user'
  const latestGiftProfile = (data.giftProfiles || []).find((profile) => profile.userId === userId) || null
  const activeCallingPatterns = (data.callingPatterns || []).filter((pattern) => pattern.userId === userId && !['archived', 'paused'].includes(pattern.status))
  const activeCallingExperiments = (data.callingExperiments || []).filter((experiment) => experiment.userId === userId && ['planned', 'active'].includes(experiment.status))
  const activeServiceTrials = (data.serviceTrials || []).filter((trial) => trial.userId === userId && ['planned', 'active'].includes(trial.status))
  const missionLifeProfile = (data.missionProfiles || []).find((profile) => profile.userId === userId) || null
  const activeMissionProjects = (data.missionProjects || []).filter((project) => project.userId === userId && ['planned', 'active'].includes(project.status))
  const urgentFlags = [
    ...(latestGiftProfile?.maturityCautions || []),
    ...(data.capacityProfiles || []).filter((profile) => profile.userId === userId && profile.currentBurnoutLevel >= 7).map(() => 'burnout capacity guardrail'),
    ...activeMissionProjects.flatMap((project) => project.risks || []),
  ]
  return {
    today: {
      latestGiftProfile,
      activeCallingPatterns,
      activeCallingExperiments,
      ministryMatches: data.ministryMatches || [],
      activeServiceTrials,
      missionLifeProfile,
      activeMissionProjects,
      urgentFlags,
      recommendedNextStep: latestGiftProfile ? { type: 'ministry_match', title: 'Generate a safe ministry match from gifts and capacity.' } : { type: 'spiritual_gifts', title: 'Complete a gifts assessment first.' },
    },
    weeklySummary: {
      giftFeedbackEntries: (data.giftFeedbackEntries || []).filter((entry) => entry.userId === userId).length,
      callingInputsAdded: (data.callingInputs || []).filter((entry) => entry.userId === userId).length,
      callingExperimentsReviewed: (data.callingExperimentReviews || []).filter((entry) => entry.userId === userId).length,
      ministryTrialsUpdated: (data.serviceReviews || []).filter((entry) => entry.userId === userId).length,
      missionProjectLogs: (data.missionProjectLogs || []).filter((entry) => entry.userId === userId).length,
    },
    callingInsights: [
      latestGiftProfile && { type: 'gift_to_ministry', summary: `${latestGiftProfile.primaryGifts[0]?.giftKey || 'Possible gifts'} should be tested in low-risk service.`, recommendedNextAction: 'Create a ministry match with capacity guardrails.' },
      !missionLifeProfile && { type: 'whole_life', summary: 'Mission life profile is missing.', recommendedNextAction: 'Design mission around work, family, church, rest, and neighbor love.' },
    ].filter(Boolean),
  }
}

export function orchestrateGiftCallingIntent(userId, intentText = '', context = {}) {
  const safe = safety(userId, `${intentText} ${JSON.stringify(context)}`, 'gift_calling_orchestrator')
  const input = lower(intentText)
  if (shouldBlockNormalFormation(safe.triage.assessment) || /kill myself|suicide|self-harm|hurt myself|自杀|自残/.test(input)) return { route: 'crisis_triage', riskLevel: safe.triage.assessment.riskLevel, message: safe.triage.response.message, nextEndpoint: '/api/care/crisis/triage' }
  if (/spiritual abuse|coerc|leader.*press|leader says.*must|逼我服事|属灵操控/.test(input)) return { route: 'pastoral_care', riskLevel: safe.triage.assessment.riskLevel, message: 'Coercive service or spiritual abuse routes to suffering care and pastoral care before ministry matching.', nextEndpoint: '/api/care/pastoral' }
  if (/burn.?out|burned out|exhaust|overcommit|耗尽|过载/.test(input)) return { route: 'holy_habit', riskLevel: safe.triage.assessment.riskLevel, message: 'Burnout routes to Sabbath rest and ministry capacity guardrails before more service.', nextEndpoint: '/api/rule-of-life/sabbath' }
  if (/big platform|famous|prove myself|平台|出名|证明自己/.test(input)) return { route: 'calling_discernment', riskLevel: safe.triage.assessment.riskLevel, message: 'Leadership ambition needs humility guardrails, mentor coaching, and virtue formation.', nextEndpoint: '/api/calling/discernment/analyze' }
  if (/gift|gifts|strength|恩赐|天赋/.test(input)) return { route: 'spiritual_gifts', riskLevel: safe.triage.assessment.riskLevel, message: 'Start or update a spiritual gifts assessment.', nextEndpoint: '/api/calling/gifts/assessments' }
  if (/calling|called|burden|呼召|负担/.test(input)) return { route: 'calling_discernment', riskLevel: safe.triage.assessment.riskLevel, message: 'Discern calling through gifts, burden, opportunity, fruit, and community confirmation.', nextEndpoint: '/api/calling/discernment/analyze' }
  if (/serve|ministry|role|服事|事工|岗位/.test(input)) return { route: 'ministry_match', riskLevel: safe.triage.assessment.riskLevel, message: 'Generate safe ministry matches using gifts, maturity, capacity, and boundaries.', nextEndpoint: '/api/calling/ministry/match' }
  if (/mission|work and faith|vocation|missional|使命|职场|职业/.test(input)) return { route: 'mission_life', riskLevel: safe.triage.assessment.riskLevel, message: 'Design whole-life mission around ordinary responsibilities and wise guardrails.', nextEndpoint: '/api/calling/mission-life/design' }
  return { route: 'spiritual_gifts', riskLevel: safe.triage.assessment.riskLevel, message: 'Begin with possible gifts, then test calling through service and fruit.', nextEndpoint: '/api/calling/gifts/assessments' }
}
