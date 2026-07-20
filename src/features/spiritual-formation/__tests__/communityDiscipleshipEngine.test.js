import { describe, expect, it } from 'vitest'
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
  inferStageFromAssessment,
  orchestrateCommunityIntent,
  recommendChurchIntegration,
  recommendDiscipleshipPathway,
  recommendMentorSession,
  updateDiscipleshipStep,
} from '../lib/communityDiscipleshipEngine'

describe('Community, Accountability & Discipleship OS engine', () => {
  it('infers discipleship stage and creates a pathway review', () => {
    const stage = inferStageFromAssessment({
      scripturePracticeLevel: 6,
      prayerPracticeLevel: 6,
      communityLevel: 5,
      serviceLevel: 5,
      missionLevel: 4,
      doctrineFoundationLevel: 5,
      characterGrowthLevel: 6,
    })
    const assessment = createDiscipleshipAssessment('u1', { spiritualHistorySummary: 'I want to grow steadily.', scripturePracticeLevel: 6, prayerPracticeLevel: 6, serviceLevel: 5 })
    const recommendation = recommendDiscipleshipPathway('u1', assessment, 'ordinary discipleship growth')
    const { path, steps } = createDiscipleshipPath('u1', { currentStageKey: stage.key })
    const completedStep = updateDiscipleshipStep(steps[0], { status: 'completed' })
    const review = generateDiscipleshipReview('u1', path, [completedStep, ...steps.slice(1)])

    expect(stage.key).toBe('practicing_disciple')
    expect(recommendation.routed).toBe(false)
    expect(path.status).toBe('active')
    expect(review.completedStepsCount).toBe(1)
    expect(review.summary).toContain('step')
  })

  it('creates consent-based accountability group records', () => {
    const { group, member } = createAccountabilityGroup('u1', { groupType: 'weekly_triads' })
    const goal = createAccountabilityGoal('u1', group, { title: 'Weekly prayer check-in' })
    const checkinResult = createAccountabilityCheckin('u1', group, { struggle: 'I need help with steady prayer.', prayerRequest: 'Pray for humility.' })
    const response = addAccountabilityResponse('u1', checkinResult.checkin, { responseText: 'I am standing with you in grace.' })
    const prayer = createGroupPrayerRequest('u1', group, { title: 'Prayer for courage' })
    const review = generateGroupReview('u1', group, [checkinResult.checkin], [prayer])

    expect(group.confidentialityCommitment).toContain('Members choose')
    expect(member.status).toBe('active')
    expect(goal.status).toBe('active')
    expect(checkinResult.routed).toBe(false)
    expect(response.responseText).toContain('grace')
    expect(review.nextSteps).toContain('Follow up one prayer request.')
  })

  it('creates mentor relationship, session, observation, action plan, and review', () => {
    const relationship = createMentorRelationship('u1', 'mentor1', { goals: ['prayer', 'calling'] })
    const recommendation = recommendMentorSession('u1', relationship, 'I want to discern calling and gifts.')
    const sessionResult = createMentorSession('u1', relationship, { context: 'calling discernment', status: 'planned' })
    const observation = addMentorObservation('mentor1', relationship, { title: 'Growth in prayer' })
    const actionPlan = createMentorActionPlan('mentor1', relationship, { actions: ['pray three mornings', 'send a check-in'] })
    const review = generateMentorReview('mentor1', relationship, [sessionResult.session], [observation], [actionPlan])

    expect(relationship.permissionScope).toBe('growth_summary')
    expect(recommendation.sessionType).toBe('calling_discernment')
    expect(recommendation.suggestedQuestions.length).toBeGreaterThan(0)
    expect(sessionResult.session.relationshipId).toBe(relationship.id)
    expect(review.summary).toContain('session')
    expect(review.nextSteps).toContain('pray three mornings')
  })

  it('creates church integration, ministry match, and safe re-entry records', () => {
    const profile = createChurchProfile('u1', { name: 'Local Church' })
    const connection = createChurchConnection('u1', { churchProfileId: profile.id, connectionStatus: 'not_connected' })
    const recommendation = recommendChurchIntegration('u1', 'I have no church and want to visit safely.', connection)
    const rhythm = createChurchRhythm('u1', { churchConnectionId: connection.id, templateKey: 'lord_day_worship' })
    const checkin = createChurchCheckin('u1', rhythm, { attendedOrPracticed: true, reflection: 'Participated with attention.' })
    const opportunity = createMinistryOpportunity('u1', { ministryArea: 'hospitality' })
    const match = generateMinistryMatch('u1', opportunity, { capacity: 'low' })
    const reentry = createChurchReentryPlan('u1', { reasonText: 'I experienced church hurt and spiritual abuse.' })

    expect(profile.name).toBe('Local Church')
    expect(recommendation.route).toBe('church_integration')
    expect(rhythm.title).toContain('worship')
    expect(checkin.attendedOrPracticed).toBe(true)
    expect(match.fitScore).toBeGreaterThan(0.7)
    expect(reentry.supportPersonNeeded).toBe(true)
  })

  it('builds dashboard and routes community intents safely', () => {
    const { group } = createAccountabilityGroup('u1', {})
    const { path, steps } = createDiscipleshipPath('u1', { currentStageKey: 'practicing_disciple' })
    const relationship = createMentorRelationship('u1', 'mentor1')
    const session = createMentorSession('u1', relationship, { status: 'planned' }).session
    const rhythm = createChurchRhythm('u1', {})
    const dashboard = buildCommunityDashboard({
      userId: 'u1',
      discipleshipPaths: [path],
      discipleshipSteps: steps,
      accountabilityGroups: [group],
      accountabilityCheckins: [],
      mentorSessions: [session],
      churchRhythms: [rhythm],
      ministryMatches: [],
    })

    expect(dashboard.today.activeDiscipleshipPath.id).toBe(path.id)
    expect(dashboard.today.accountabilityGroups).toHaveLength(1)
    expect(orchestrateCommunityIntent('u1', 'I need an accountability partner').route).toBe('accountability_group')
    expect(orchestrateCommunityIntent('u1', 'I need a mentor').route).toBe('mentor_coaching')
    expect(orchestrateCommunityIntent('u1', 'I want church worship rhythms').route).toBe('church_integration')
    expect(orchestrateCommunityIntent('u1', 'I experienced spiritual abuse in church').route).toBe('suffering_care')
    expect(orchestrateCommunityIntent('u1', 'I will kill myself tonight').route).toBe('crisis_triage')
  })
})
