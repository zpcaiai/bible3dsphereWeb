import { carePlanTemplates, crisisResourceTemplates, healingJourneyTypes, healingPractices, sufferingCategories, sufferingPractices } from '../data/sufferingCareSeed'
import { todayKey, uid } from './scriptureFormationEngine'

const IMMINENT_PATTERNS = [/kill myself now/i, /suicide.*tonight/i, /end my life.*today/i, /i have (a )?(plan|weapon|pills|knife)/i, /about to hurt myself/i, /immediate danger/i, /right now.*(hurt|kill|die)/i, /现在就.*(死|自杀|伤害)/, /马上.*(自杀|跳楼|上吊)/, /刀.*手边/, /药.*准备好/]
const HIGH_PATTERNS = [/suicide/i, /self[- ]?harm/i, /hurt myself/i, /want to die/i, /violence/i, /abuse/i, /domestic violence/i, /sexual abuse/i, /child abuse/i, /elder abuse/i, /medical emergency/i, /cannot stay safe/i, /自杀/, /自残/, /伤害自己/, /虐待/, /家暴/, /性侵/, /儿童.*安全/, /不能保证安全/]
const MODERATE_PATTERNS = [/hopeless/i, /despair/i, /panic/i, /cannot function/i, /spiritual abuse/i, /coerc/i, /unsafe reconciliation/i, /severe shame/i, /绝望/, /撑不住/, /惊恐/, /属灵操控/, /强迫/, /不安全.*和解/]
const PROFESSIONAL_PATTERNS = [/flashback/i, /dissociation/i, /trauma/i, /nightmare/i, /body panic/i, /depression/i, /clinical/i, /闪回/, /解离/, /创伤/, /噩梦/, /抑郁/]

function nowIso() {
  return new Date().toISOString()
}

function lower(text = '') {
  return String(text || '').toLowerCase()
}

function matches(text, patterns) {
  return patterns.some((pattern) => pattern.test(String(text || '')))
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)))
}

function dateDaysFromNow(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

export function detectRiskTypes(text = '') {
  const input = lower(text)
  return unique([
    /suicide|want to die|end my life|自杀|想死/.test(input) && 'suicide',
    /self[- ]?harm|hurt myself|自残|伤害自己/.test(input) && 'self_harm',
    /violence|hurt someone|kill him|kill her|暴力|伤害别人/.test(input) && 'violence',
    /domestic violence|家暴/.test(input) && 'domestic_violence',
    /sexual abuse|sexual assault|性侵|性虐待/.test(input) && 'sexual_abuse',
    /child abuse|child safety|儿童.*安全|虐待儿童/.test(input) && 'child_safety',
    /elder abuse|elder safety|老人.*虐待/.test(input) && 'elder_safety',
    /medical emergency|overdose|chest pain|昏倒|过量|医疗急救/.test(input) && 'medical_emergency',
    /panic|cannot function|惊恐|不能 functioning|无法正常/.test(input) && 'panic',
    /hopeless|despair|绝望|撑不住/.test(input) && 'severe_despair',
    /spiritual abuse|属灵操控|属灵虐待/.test(input) && 'spiritual_abuse',
    /coerc|forced|强迫|控制/.test(input) && 'coercion',
  ]).filter(Boolean)
}

export function classifyRiskLevel(text = '', riskTypes = detectRiskTypes(text)) {
  if (matches(text, IMMINENT_PATTERNS)) return 'imminent'
  if (riskTypes.some((type) => ['suicide', 'self_harm', 'violence', 'domestic_violence', 'sexual_abuse', 'child_safety', 'medical_emergency'].includes(type)) || matches(text, HIGH_PATTERNS)) return 'high'
  if (riskTypes.length || matches(text, MODERATE_PATTERNS)) return 'moderate'
  if (/sad|anxious|grieving|tired|难过|焦虑|疲惫/.test(lower(text))) return 'low'
  return 'none'
}

export function triageText(userId, text = '', sourceModule = 'suffering_care', sourceSessionId = null) {
  const detectedRiskTypes = detectRiskTypes(text)
  const riskLevel = classifyRiskLevel(text, detectedRiskTypes)
  const escalationNeeded = ['high', 'imminent'].includes(riskLevel)
  const assessment = {
    id: uid('crisis_assessment'),
    userId,
    createdAt: nowIso(),
    sourceModule,
    sourceSessionId,
    userText: text,
    detectedRiskTypes,
    riskLevel,
    confidenceScore: riskLevel === 'imminent' ? 0.97 : riskLevel === 'high' ? 0.9 : riskLevel === 'moderate' ? 0.72 : 0.4,
    protectiveFactors: [],
    escalationNeeded,
    routedTo: riskLevel === 'imminent' ? 'emergency_help'
      : riskLevel === 'high' ? 'safety_plan'
        : riskLevel === 'moderate' ? 'trusted_person'
          : riskLevel === 'low' ? 'continue_with_caution'
            : 'none',
    notes: '',
  }
  return { assessment, event: createCrisisEventIfNeeded(userId, assessment), response: generateTriageResponse(assessment) }
}

export function createCrisisEventIfNeeded(userId, assessment) {
  if (assessment.riskLevel === 'none' || assessment.riskLevel === 'low') return null
  return {
    id: uid('crisis_event'),
    userId,
    assessmentId: assessment.id,
    eventType: assessment.detectedRiskTypes[0] || 'other',
    severity: assessment.riskLevel,
    description: assessment.userText,
    status: assessment.riskLevel === 'imminent' ? 'escalated' : 'open',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function shouldBlockNormalFormation(assessment) {
  return ['high', 'imminent'].includes(assessment.riskLevel)
}

export function recommendResources(assessment) {
  if (assessment.detectedRiskTypes.includes('domestic_violence')) return crisisResourceTemplates.filter((item) => ['local_emergency_services', 'trusted_person_now', 'domestic_violence_support_generic'].includes(item.key))
  if (assessment.detectedRiskTypes.includes('sexual_abuse')) return crisisResourceTemplates.filter((item) => ['local_emergency_services', 'trusted_person_now', 'sexual_assault_support_generic'].includes(item.key))
  if (assessment.detectedRiskTypes.includes('child_safety')) return crisisResourceTemplates.filter((item) => ['local_emergency_services', 'child_safety_services_generic', 'trusted_person_now'].includes(item.key))
  if (['high', 'imminent'].includes(assessment.riskLevel)) return crisisResourceTemplates.filter((item) => ['local_emergency_services', 'trusted_person_now', 'suicide_crisis_line_generic'].includes(item.key))
  return crisisResourceTemplates.filter((item) => ['trusted_person_now', 'pastoral_care_contact', 'licensed_professional_help'].includes(item.key))
}

export function generateTriageResponse(assessment) {
  const block = shouldBlockNormalFormation(assessment)
  return {
    route: 'crisis_care',
    riskLevel: assessment.riskLevel,
    detectedRiskTypes: assessment.detectedRiskTypes,
    blockNormalFormation: block,
    message: block
      ? 'I am really sorry you are carrying this. Your safety matters more than continuing this exercise right now.'
      : assessment.riskLevel === 'moderate'
        ? 'This sounds heavy enough that human support and a simple safety plan may be wise before continuing.'
        : 'No immediate crisis signal was detected. Continue gently and seek support if distress rises.',
    immediateSteps: assessment.riskLevel === 'imminent'
      ? ['Contact local emergency services now if you may act on danger.', 'Move away from anything you could use to harm yourself or someone else.', 'Reach a trusted nearby person and say you need help staying safe.']
      : assessment.riskLevel === 'high'
        ? ['Reach out to a trusted person now.', 'Move toward a safer place and away from means of harm.', 'Create or review a safety plan before ordinary formation.']
        : assessment.riskLevel === 'moderate'
          ? ['Tell one trusted person what is happening.', 'Consider pastoral or professional support.', 'Use a brief grounding step before continuing.']
          : ['Continue with care.', 'Ask for support early if symptoms intensify.'],
    recommendedResources: recommendResources(assessment),
    nextAction: assessment.riskLevel === 'imminent' ? 'emergency_help' : block ? 'create_safety_plan' : assessment.riskLevel === 'moderate' ? 'trusted_person_and_safety_plan' : 'continue_with_caution',
  }
}

export function createSafetyPlan(userId, data = {}) {
  return {
    id: uid('safety_plan'),
    userId,
    crisisEventId: data.crisisEventId || null,
    title: data.title || 'Personal Safety Plan',
    warningSigns: data.warningSigns || ['thoughts intensify', 'isolation', 'access to means', 'panic or despair rises'],
    internalCopingSteps: data.internalCopingSteps || ['breathe slowly', 'move to a safer room', 'ground in five things you see'],
    peopleToContact: data.peopleToContact || ['trusted nearby person', 'pastor or mentor', 'local crisis support'],
    safePlaces: data.safePlaces || ['public safe place', 'trusted friend home', 'church office if safe and open'],
    professionalResources: data.professionalResources || ['local emergency services', 'licensed professional support'],
    emergencySteps: data.emergencySteps || ['contact local emergency services if immediate danger appears'],
    meansSafetySteps: data.meansSafetySteps || ['move away from means of harm and ask another person to help secure them'],
    reasonsToStaySafe: data.reasonsToStaySafe || ['I am made in God image', 'people can help me through the next hour'],
    status: 'active',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function classifySufferingCategory(text = '') {
  const input = lower(text)
  const key = /grief|loss|died|death|哀伤|失去|去世|死亡/.test(input) ? 'grief'
    : /burnout|exhaust|耗尽|疲惫/.test(input) ? 'burnout'
      : /abuse|trauma|创伤|虐待/.test(input) ? 'trauma_context'
        : /wait|stuck|等待/.test(input) ? 'waiting'
          : /ill|sick|cancer|病|疾病/.test(input) ? 'illness'
            : /injustice|unfair|不公|冤/.test(input) ? 'injustice'
              : /shame|羞耻|没价值/.test(input) ? 'shame'
                : /dry|prayer|枯干|祷告/.test(input) ? 'spiritual_dryness'
                  : /anx|worry|焦虑|担心/.test(input) ? 'anxiety'
                    : /fail|失败/.test(input) ? 'failure'
                      : /death|死/.test(input) ? 'death'
                        : 'lament'
  return sufferingCategories.find((category) => category.key === key) || sufferingCategories.at(-1)
}

export function reflectOnSuffering(userId, text = '', mode = 'lament') {
  const triage = triageText(userId, text, 'suffering_theology')
  if (shouldBlockNormalFormation(triage.assessment)) return { reflection: null, triage, routed: true }
  const category = classifySufferingCategory(text)
  const practice = recommendSufferingPractices(category.key)[0]
  return {
    reflection: {
      id: uid('suffering_reflection'),
      userId,
      category: category.key,
      painNamed: category.key === 'grief' ? 'You are grieving a real loss, not merely lacking faith.' : 'This pain can be named truthfully before God without minimizing it.',
      lamentPermission: 'Biblical faith can speak sorrow honestly before God.',
      falseExplanationsToReject: [
        'This does not prove God has abandoned you.',
        'You do not need to pretend this is painless.',
        'Do not explain trauma, abuse, or medical suffering as a simplistic lesson.',
      ],
      biblicalFrame: {
        creation: 'Loss hurts because love, life, justice, body, and community are good gifts.',
        fall: 'Death, rupture, sin, injustice, and sorrow belong to a groaning creation.',
        redemption: 'Christ enters grief, bears sorrow, and meets His people without contempt.',
        restoration: 'Christian hope looks toward resurrection and new creation without denying present tears.',
      },
      suggestedPractice: practice,
      faithfulNextStep: 'Tell one trusted person what you are carrying.',
      mode,
      createdAt: nowIso(),
    },
    triage,
    routed: false,
  }
}

export function createSufferingSession(userId, data = {}) {
  const result = reflectOnSuffering(userId, data.situationText || '', data.selectedMode || 'lament')
  const triage = result.triage
  const category = classifySufferingCategory(data.situationText || '')
  const now = nowIso()
  const session = {
    id: uid('suffering_session'),
    userId,
    sessionDate: todayKey(),
    sufferingCategoryId: category.id,
    categoryKey: category.key,
    title: data.title || `${category.displayName} reflection`,
    situationText: data.situationText || '',
    emotionalState: data.emotionalState || [],
    painLevel: Number(data.painLevel || 6),
    selectedMode: data.selectedMode || 'lament',
    status: result.routed ? 'routed_to_crisis' : 'completed',
    riskFlags: triage.assessment.riskLevel !== 'none' ? [triage.assessment.riskLevel, ...triage.assessment.detectedRiskTypes] : [],
    entries: result.routed ? [] : createSufferingFrameEntries(result.reflection),
    createdAt: now,
    updatedAt: now,
    completedAt: result.routed ? null : now,
  }
  return { session, summary: result.routed ? null : completeSufferingSession(userId, session, result.reflection), triage, routed: result.routed }
}

function createSufferingFrameEntries(reflection) {
  const frameMap = {
    name_pain: reflection.painNamed,
    lament: reflection.lamentPermission,
    locate_in_story: Object.values(reflection.biblicalFrame).join(' '),
    reject_false_explanations: reflection.falseExplanationsToReject.join(' '),
    receive_comfort: reflection.biblicalFrame.redemption,
    hope_in_christ: reflection.biblicalFrame.restoration,
    faithful_next_step: reflection.faithfulNextStep,
    community_support: 'Human support is a gift, not a failure of faith.',
  }
  return Object.entries(frameMap).map(([frameKey, aiGuidance]) => ({
    id: uid('suffering_frame'),
    frameKey,
    userInput: '',
    aiGuidance,
    scriptureRefs: ['Psalm 13', 'Romans 8:18-25'],
    createdAt: nowIso(),
  }))
}

export function completeSufferingSession(userId, session, reflection = null) {
  const source = reflection || reflectOnSuffering(userId, session.situationText).reflection
  return {
    id: uid('suffering_summary'),
    userId,
    sessionId: session.id,
    painNamed: source?.painNamed || session.situationText,
    falseBeliefsRejected: source?.falseExplanationsToReject || [],
    gospelComfortReceived: [source?.biblicalFrame?.redemption].filter(Boolean),
    hopeStatement: source?.biblicalFrame?.restoration || 'Hope can be held without denial.',
    faithfulNextStep: source?.faithfulNextStep || 'Tell one trusted person.',
    communitySupportNeeded: Number(session.painLevel || 0) >= 7,
    pastoralCareRecommended: Number(session.painLevel || 0) >= 7 || session.riskFlags?.length > 0,
    summary: `${session.title}: pain named, lament allowed, false explanations rejected, and one next step identified.`,
    createdAt: nowIso(),
  }
}

export function recommendSufferingPractices(categoryKey = 'lament') {
  if (categoryKey === 'grief' || categoryKey === 'death') return sufferingPractices.filter((practice) => ['grief_journal', 'psalm_13_lament', 'trusted_support_request'].includes(practice.key))
  if (categoryKey === 'burnout') return sufferingPractices.filter((practice) => ['rest_without_productivity', 'silent_sitting', 'trusted_support_request'].includes(practice.key))
  return sufferingPractices.slice(0, 4)
}

export function recommendHealingJourney(userId, contextText = '') {
  const triage = triageText(userId, contextText, 'healing_journey')
  if (shouldBlockNormalFormation(triage.assessment)) return { recommendation: null, triage, routed: true }
  const input = lower(contextText)
  const key = /abuse|spiritual abuse|属灵操控|虐待/.test(input) ? 'spiritual_abuse_recovery'
    : /grief|loss|death|哀伤|失去/.test(input) ? 'grief'
      : /forgive|forgiveness|饶恕/.test(input) ? 'forgiveness_process'
        : /boundary|boundaries|界限/.test(input) ? 'boundary_formation'
          : /betray|背叛/.test(input) ? 'betrayal_recovery'
            : /burnout|耗尽/.test(input) ? 'burnout_recovery'
              : /church hurt|教会伤害/.test(input) ? 'church_hurt'
                : /trauma|flashback|创伤|闪回/.test(input) ? 'trauma_informed_stabilization'
                  : 'relational_wound'
  const type = healingJourneyTypes.find((item) => item.key === key) || healingJourneyTypes[0]
  const phase = type.recommendedPhases[0]
  return {
    recommendation: {
      journeyType: type,
      recommendedPhase: phase,
      practices: recommendHealingPractices(type.key, phase),
      careLevel: matches(contextText, PROFESSIONAL_PATTERNS) || key.includes('abuse') || key.includes('trauma') ? 'professional_recommended' : 'mentor_supported',
      message: 'Healing is user-paced and consent-based. Do not force details, forgiveness, contact, or reconciliation.',
    },
    triage,
    routed: false,
  }
}

export function createHealingJourney(userId, data = {}) {
  const rec = recommendHealingJourney(userId, data.description || data.title || '')
  if (rec.routed) return { journey: null, triage: rec.triage, routed: true }
  const type = data.journeyTypeKey ? healingJourneyTypes.find((item) => item.key === data.journeyTypeKey) : rec.recommendation.journeyType
  const now = nowIso()
  return {
    journey: {
      id: uid('healing_journey'),
      userId,
      journeyTypeId: type.id,
      journeyTypeKey: type.key,
      title: data.title || type.displayName,
      description: data.description || type.description,
      status: 'active',
      startDate: todayKey(),
      endDate: '',
      currentPhase: data.currentPhase || rec.recommendation.recommendedPhase,
      careLevel: data.careLevel || rec.recommendation.careLevel,
      riskFlags: rec.triage.assessment.riskLevel !== 'none' ? [rec.triage.assessment.riskLevel] : [],
      createdAt: now,
      updatedAt: now,
    },
    practices: recommendHealingPractices(type.key, data.currentPhase || rec.recommendation.recommendedPhase),
    triage: rec.triage,
    routed: false,
  }
}

export function recommendHealingPractices(journeyTypeKey = 'grief', phase = 'stabilization') {
  const byPhase = healingPractices.filter((practice) => practice.phase === phase)
  if (byPhase.length) return byPhase.slice(0, 4)
  if (journeyTypeKey.includes('grief')) return healingPractices.filter((practice) => ['grief_naming_journal', 'psalm_13_lament_healing', 'trusted_person_share'].includes(practice.key))
  if (journeyTypeKey.includes('forgiveness') || journeyTypeKey.includes('reconciliation')) return healingPractices.filter((practice) => ['forgiveness_readiness', 'reconciliation_safety_checklist', 'safe_boundary_planning'].includes(practice.key))
  return healingPractices.slice(0, 4)
}

export function addHealingEntry(userId, journey, data = {}) {
  const triage = triageText(userId, data.userReflection || '', 'healing_journey', journey.id)
  if (shouldBlockNormalFormation(triage.assessment)) return { entry: null, triage, routed: true }
  return {
    entry: {
      id: uid('healing_entry'),
      userId,
      journeyId: journey.id,
      entryDate: todayKey(),
      phase: data.phase || journey.currentPhase,
      promptKey: data.promptKey || 'gentle_reflection',
      userReflection: data.userReflection || '',
      emotionTags: data.emotionTags || [],
      bodySignals: data.bodySignals || [],
      truthNamed: data.truthNamed || 'This pain can be named without shame.',
      boundaryNamed: data.boundaryNamed || '',
      prayerText: data.prayerText || '',
      supportNeeded: Boolean(data.supportNeeded),
      riskFlags: triage.assessment.riskLevel !== 'none' ? [triage.assessment.riskLevel] : [],
      createdAt: nowIso(),
    },
    triage,
    routed: false,
  }
}

export function createForgivenessBoundaryPlan(userId, journey, data = {}) {
  const triage = triageText(userId, `${data.harmSummary || ''} ${data.contactContext || ''}`, 'healing_journey', journey?.id)
  const unsafe = shouldBlockNormalFormation(triage.assessment) || /unsafe|abuse|coerc|threat|不安全|虐待|威胁|强迫/.test(lower(`${data.harmSummary || ''} ${data.contactContext || ''}`))
  return {
    plan: {
      id: uid('forgiveness_boundary'),
      userId,
      journeyId: journey?.id || null,
      harmSummary: data.harmSummary || '',
      forgivenessStatus: data.forgivenessStatus || 'not_ready',
      reconciliationStatus: unsafe ? 'unsafe' : data.reconciliationStatus || 'not_ready',
      forgivenessReflection: 'Forgiveness may be a process of entrusting justice to God. It does not require pretending the harm was small.',
      reconciliationDiscernment: 'Reconciliation requires repentance, safety, truth, accountability, and wise counsel.',
      boundariesNeeded: data.boundariesNeeded || ['Do not meet alone right now.', 'Use written communication only if necessary.', 'Seek counsel before any repair conversation.'],
      unsafeContactWarning: unsafe,
      repairOrRestitutionNeeded: data.repairOrRestitutionNeeded || [],
      pastoralOrProfessionalSupportNeeded: unsafe || matches(data.harmSummary || '', PROFESSIONAL_PATTERNS),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    triage,
    routed: false,
  }
}

export function addHealingMilestone(userId, journey, data = {}) {
  return {
    id: uid('healing_milestone'),
    userId,
    journeyId: journey.id,
    milestoneType: data.milestoneType || 'named_pain',
    title: data.title || 'Pain named truthfully',
    description: data.description || '',
    occurredAt: nowIso(),
    createdAt: nowIso(),
  }
}

export function createCareRelationshipRequest(receiverId, caregiverId, role = 'mentor', scope = 'formation_summary') {
  return {
    id: uid('care_relationship'),
    careReceiverUserId: receiverId,
    caregiverUserId: caregiverId,
    caregiverRole: role,
    status: 'requested',
    permissionScope: scope,
    consentGrantedAt: null,
    consentRevokedAt: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function grantConsent(relationship) {
  return { ...relationship, status: 'active', consentGrantedAt: nowIso(), consentRevokedAt: null, updatedAt: nowIso() }
}

export function revokeConsent(relationship) {
  return { ...relationship, status: 'revoked', consentRevokedAt: nowIso(), updatedAt: nowIso() }
}

export function verifyCarePermission(viewerUserId, receiverUserId, requiredScope, relationships = []) {
  if (viewerUserId === receiverUserId) return true
  const rank = { crisis_flags_only: 1, basic_checkins: 2, formation_summary: 3, care_notes: 4, full_care_plan: 5 }
  return relationships.some((rel) => rel.caregiverUserId === viewerUserId && rel.careReceiverUserId === receiverUserId && rel.status === 'active' && rank[rel.permissionScope] >= rank[requiredScope])
}

export function createCareCase(userId, data = {}) {
  const triage = triageText(userId, `${data.title || ''} ${data.summary || ''}`, 'pastoral_care')
  const severity = triage.assessment.riskLevel === 'imminent' ? 'urgent'
    : triage.assessment.riskLevel === 'high' ? 'high'
      : data.severity || (triage.assessment.riskLevel === 'moderate' ? 'moderate' : 'low')
  return {
    id: uid('care_case'),
    userId,
    primaryCaregiverUserId: data.primaryCaregiverUserId || null,
    title: data.title || 'Care case',
    caseType: data.caseType || inferCaseType(data.summary || data.title || ''),
    severity,
    status: severity === 'urgent' ? 'escalated' : 'open',
    summary: data.summary || '',
    activeRiskFlags: triage.assessment.detectedRiskTypes,
    pastoralCareRecommended: true,
    professionalReferralRecommended: severity === 'high' || severity === 'urgent' || matches(data.summary || '', PROFESSIONAL_PATTERNS),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    closedAt: null,
  }
}

function inferCaseType(text = '') {
  const input = lower(text)
  if (/grief|loss|哀伤/.test(input)) return 'grief'
  if (/crisis|safety|危机|安全/.test(input)) return 'crisis_followup'
  if (/burnout|耗尽/.test(input)) return 'burnout'
  if (/relationship|关系/.test(input)) return 'relationship'
  if (/dry|枯干/.test(input)) return 'spiritual_dryness'
  return 'suffering'
}

export function addCareLog(caregiverUserId, careCase, data = {}) {
  return {
    id: uid('care_log'),
    careCaseId: careCase.id,
    caregiverUserId,
    careReceiverUserId: careCase.userId,
    logType: data.logType || 'checkin',
    logDate: nowIso(),
    summary: data.summary || '',
    nextSteps: data.nextSteps || [],
    riskObserved: data.riskObserved || careCase.activeRiskFlags || [],
    visibleToReceiver: Boolean(data.visibleToReceiver),
    privateCaregiverNote: data.privateCaregiverNote || '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createCarePlan(caregiverUserId, careCase, data = {}) {
  const template = carePlanTemplates.find((item) => item.caseType === careCase.caseType) || carePlanTemplates[0]
  return {
    id: uid('care_plan'),
    careCaseId: careCase.id,
    userId: careCase.userId,
    caregiverUserId,
    title: data.title || template.title,
    goal: data.goal || 'Provide consent-based care, practical support, prayer, and wise escalation if needed.',
    supportActions: data.supportActions || template.templateConfig.supportActions,
    spiritualPractices: data.spiritualPractices || template.templateConfig.spiritualPractices,
    practicalSupport: data.practicalSupport || ['check meals, sleep, transportation, and safe support'],
    professionalSupport: data.professionalSupport || (careCase.professionalReferralRecommended ? ['qualified professional support recommended'] : []),
    boundaries: data.boundaries || template.templateConfig.boundaries,
    reviewDate: data.reviewDate || todayKey(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    status: 'active',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function createCareFollowup(caregiverUserId, careCase, data = {}) {
  return {
    id: uid('care_followup'),
    careCaseId: careCase.id,
    assignedToUserId: data.assignedToUserId || caregiverUserId,
    careReceiverUserId: careCase.userId,
    followupType: data.followupType || (careCase.severity === 'high' || careCase.severity === 'urgent' ? 'safety_check' : 'checkin'),
    dueAt: data.dueAt || dateDaysFromNow(careCase.severity === 'high' || careCase.severity === 'urgent' ? 1 : 7),
    status: 'pending',
    completionNotes: '',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export function recommendEscalation(careCase) {
  if (careCase.severity === 'urgent') return 'Urgent safety risk: route to crisis triage and emergency help.'
  if (careCase.activeRiskFlags?.some((flag) => ['domestic_violence', 'sexual_abuse', 'child_safety', 'abuse'].includes(flag))) return 'Abuse concern: prioritize safety resources and trained support, not reconciliation pressure.'
  if (careCase.professionalReferralRecommended) return 'Professional support is recommended alongside pastoral care.'
  if (careCase.severity === 'high') return 'High-risk case: escalate to pastor/leader and schedule near-term follow-up.'
  return 'Continue ordinary care with consent, prayer, and follow-up.'
}

export function generateRoleAwareSummary(viewerUserId, careCase, summaryType = 'mentor_view', permissionScope = 'formation_summary') {
  const sensitive = careCase.activeRiskFlags?.length ? ['risk details redacted unless safety requires'] : []
  const detail = permissionScope === 'crisis_flags_only'
    ? `Risk level: ${careCase.severity}. Recommended follow-up: ${recommendEscalation(careCase)}`
    : `Care theme: ${careCase.caseType}. Current need: ${careCase.summary || careCase.title}. Recommended support: ${recommendEscalation(careCase)}`
  return {
    id: uid('care_summary'),
    careCaseId: careCase.id,
    userId: careCase.userId,
    generatedForUserId: viewerUserId,
    summaryType,
    summary: detail,
    includedModules: ['suffering_care'],
    redactedFields: sensitive,
    riskSummary: { severity: careCase.severity, flags: permissionScope === 'crisis_flags_only' ? careCase.activeRiskFlags : sensitive },
    createdAt: nowIso(),
  }
}

export function buildSufferingCareDashboard(data = {}) {
  const userId = data.userId || 'local-user'
  const activeSufferingSessions = (data.sufferingSessions || []).filter((item) => item.userId === userId && item.status !== 'archived')
  const activeHealingJourneys = (data.healingJourneys || []).filter((item) => item.userId === userId && item.status === 'active')
  const activeSafetyPlan = (data.safetyPlans || []).find((item) => item.userId === userId && item.status === 'active') || null
  const openCareCases = (data.careCases || []).filter((item) => item.userId === userId && !['resolved', 'archived'].includes(item.status))
  const dueFollowups = (data.careFollowups || []).filter((item) => item.careReceiverUserId === userId && item.status === 'pending')
  return {
    today: {
      activeSufferingSessions,
      activeHealingJourneys,
      activeSafetyPlan,
      openCareCases,
      dueFollowups,
      urgentFlags: [...activeSufferingSessions, ...activeHealingJourneys, ...openCareCases].flatMap((item) => item.riskFlags || item.activeRiskFlags || []).filter(Boolean),
      recommendedCarePractice: activeHealingJourneys[0] ? recommendHealingPractices(activeHealingJourneys[0].journeyTypeKey, activeHealingJourneys[0].currentPhase)[0] : sufferingPractices[0],
    },
    weeklySummary: {
      sufferingSessionsCompleted: activeSufferingSessions.filter((item) => item.status === 'completed').length,
      healingEntriesCreated: (data.healingEntries || []).filter((item) => item.userId === userId).length,
      careFollowupsCompleted: (data.careFollowups || []).filter((item) => item.careReceiverUserId === userId && item.status === 'completed').length,
      safetyPlanReviews: (data.safetyPlans || []).filter((item) => item.userId === userId).length,
      pastoralCareLogs: (data.careLogs || []).filter((item) => item.careReceiverUserId === userId).length,
    },
    careInsights: [
      activeHealingJourneys[0] && { type: 'healing', summary: `The user is in a ${activeHealingJourneys[0].journeyTypeKey} journey.`, recommendedNextAction: 'Schedule a gentle care follow-up.' },
      openCareCases[0] && { type: 'pastoral_care', summary: `${openCareCases[0].title} is ${openCareCases[0].severity}.`, recommendedNextAction: recommendEscalation(openCareCases[0]) },
    ].filter(Boolean),
  }
}

export function orchestrateSufferingCareIntent(userId, intentText = '', context = {}) {
  const triage = triageText(userId, intentText, 'suffering_care_orchestrator')
  if (triage.assessment.riskLevel === 'imminent' || triage.assessment.riskLevel === 'high') {
    return { route: 'crisis_triage', riskLevel: triage.assessment.riskLevel, blockNormalFormation: true, recommendedAction: triage.response, message: triage.response.message, nextEndpoint: '/api/care/crisis/triage' }
  }
  const input = lower(intentText)
  if (/forgive|forgiveness|reconcile|boundary|healing|wound|trauma|church hurt|饶恕|和解|界限|医治|创伤/.test(input)) {
    return { route: 'healing_journey', riskLevel: triage.assessment.riskLevel, blockNormalFormation: false, recommendedAction: recommendHealingJourney(userId, intentText).recommendation, message: 'Move at a consent-based pace. Forgiveness does not require unsafe reconciliation.', nextEndpoint: '/api/care/healing/recommend' }
  }
  if (/pastor|mentor|group leader|follow up|care|牧者|导师|小组长|关怀|跟进/.test(input)) {
    return { route: 'pastoral_care', riskLevel: triage.assessment.riskLevel, blockNormalFormation: false, recommendedAction: { careCaseType: inferCaseType(intentText) }, message: 'Create a consent-based care case or follow-up plan.', nextEndpoint: '/api/care/pastoral/dashboard' }
  }
  if (/pray|psalm|祷告|诗篇/.test(input)) return { route: 'prayer', riskLevel: triage.assessment.riskLevel, blockNormalFormation: false, message: 'Route to Prayer & Communion.', nextEndpoint: '/api/prayer/dashboard' }
  if (/why|suffer|grief|lament|hopeless|loss|苦|哀伤|盼望|为什么/.test(input)) {
    return { route: 'suffering_theology', riskLevel: triage.assessment.riskLevel, blockNormalFormation: false, recommendedAction: reflectOnSuffering(userId, intentText).reflection, message: 'Allow lament and receive biblical hope without cheap explanations.', nextEndpoint: '/api/care/suffering/reflect' }
  }
  return { route: 'suffering_theology', riskLevel: triage.assessment.riskLevel, blockNormalFormation: false, recommendedAction: reflectOnSuffering(userId, intentText || context.emotion || '').reflection, message: 'Begin with naming pain and choosing one faithful next step.', nextEndpoint: '/api/care/suffering/reflect' }
}
