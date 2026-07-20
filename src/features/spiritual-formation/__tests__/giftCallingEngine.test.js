import { describe, expect, it } from 'vitest'
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
  createMissionCommitment,
  createMissionLifeProfile,
  createMissionProject,
  createServiceTrial,
  designMissionLife,
  generateMinistryMatches,
  generateMissionLifeReview,
  orchestrateGiftCallingIntent,
  reviewCallingExperiment,
  reviewServiceTrial,
  startGiftAssessment,
  submitGiftAssessment,
} from '../lib/giftCallingEngine'
import { giftAssessmentItems, ministryOpportunityTemplates } from '../data/giftCallingSeed'

function teachingAnswers() {
  return Object.fromEntries(giftAssessmentItems.map((item) => [item.key, item.key.includes('teaching') || item.key.includes('encouragement') ? 5 : 3]))
}

describe('Gift, Calling & Mission OS engine', () => {
  it('completes gifts assessment, scores gifts, adds feedback, and builds profile', () => {
    const assessment = startGiftAssessment('u1', { contextNote: 'I enjoy teaching and encouraging.' })
    const result = submitGiftAssessment('u1', assessment, teachingAnswers())
    const feedback = addGiftFeedback('u1', { observedGiftKeys: ['teaching'], evidenceText: 'Mentor observed clear Scripture explanation.' })

    expect(result.assessment.status).toBe('completed')
    expect(result.scores[0].score).toBeGreaterThan(70)
    expect(result.profile.primaryGifts[0].giftKey).toBe('teaching')
    expect(feedback.visibleToUser).toBe(true)
    expect(result.profile.maturityCautions.join(' ')).toContain('leadership readiness')
  })

  it('analyzes calling pattern and reviews an experiment', () => {
    const assessment = startGiftAssessment('u1', {})
    const giftProfile = submitGiftAssessment('u1', assessment, teachingAnswers()).profile
    const session = createCallingSession('u1', { discernmentQuestion: 'Should I teach new believers?' })
    const inputs = [
      addCallingInput('u1', session, { inputType: 'burden', title: 'New believers', description: 'I am burdened to teach new believers.' }),
      addCallingInput('u1', session, { inputType: 'fruit_evidence', title: 'Fruit', description: 'Small group feedback confirmed clarity.' }),
    ]
    const analysis = analyzeCalling('u1', session, inputs, giftProfile)
    const pattern = createCallingPattern('u1', analysis)
    const experiment = createCallingExperiment('u1', pattern, {})
    const review = reviewCallingExperiment('u1', experiment, { energyLevel: 7 })

    expect(analysis.possibleCallingPatterns[0].domain).toBe('teaching_discipleship')
    expect(pattern.status).toMatch(/possible|testing/)
    expect(experiment.status).toBe('planned')
    expect(review.summary).toContain('Calling remains discerned')
  })

  it('generates ministry matches with burnout guardrails and reviews trial', () => {
    const capacity = createCapacityProfile('u1', { weeklyAvailableHours: 1, currentBurnoutLevel: 8, emotionalCapacity: 3 })
    const matches = generateMinistryMatches('u1', ministryOpportunityTemplates, null, [], capacity)
    const trial = createServiceTrial('u1', matches[0], {})
    const review = reviewServiceTrial('u1', trial, { energyCostScore: 8 })

    expect(matches[0].cautions.join(' ')).toContain('Burnout')
    expect(matches.some((match) => match.riskFitScore < 0.5)).toBe(true)
    expect(trial.trialType).toBe('observe')
    expect(review.recommendedNextStep).toBe('reduce')
  })

  it('designs mission life, creates commitments, project, log, and review', () => {
    const profile = createMissionLifeProfile('u1', { lifeSeason: 'single_worker', vocationSummary: 'faithful work and hospitality' })
    const design = designMissionLife('u1', profile, null, [], 'connect work and faith')
    const commitment = createMissionCommitment('u1', profile, { domainKey: design.recommendedDomains[0].domain })
    const project = createMissionProject('u1', profile, {})
    const log = addMissionProjectLog('u1', project, { actionTaken: 'Took one small step.', nextStep: 'Keep the next action small.' })
    const review = generateMissionLifeReview('u1', profile, [commitment], [project], [log])

    expect(design.recommendedDomains.length).toBeGreaterThan(1)
    expect(commitment.status).toBe('active')
    expect(project.status).toBe('planned')
    expect(log.nextStep).toContain('small')
    expect(review.summary).toContain('Mission life')
  })

  it('builds dashboard and routes orchestrator intents', () => {
    const assessment = startGiftAssessment('u1', {})
    const giftProfile = submitGiftAssessment('u1', assessment, teachingAnswers()).profile
    const capacity = createCapacityProfile('u1', { currentBurnoutLevel: 8 })
    const dashboard = buildGiftCallingDashboard({ userId: 'u1', giftProfiles: [giftProfile], capacityProfiles: [capacity], callingPatterns: [], callingExperiments: [], ministryMatches: [], serviceTrials: [], missionProfiles: [], missionProjects: [] })

    expect(dashboard.today.latestGiftProfile.id).toBe(giftProfile.id)
    expect(dashboard.today.urgentFlags.join(' ')).toContain('burnout')
    expect(orchestrateGiftCallingIntent('u1', 'What are my spiritual gifts?').route).toBe('spiritual_gifts')
    expect(orchestrateGiftCallingIntent('u1', 'What is my calling?').route).toBe('calling_discernment')
    expect(orchestrateGiftCallingIntent('u1', 'Where should I serve?').route).toBe('ministry_match')
    expect(orchestrateGiftCallingIntent('u1', 'How do I live missionally at work?').route).toBe('mission_life')
    expect(orchestrateGiftCallingIntent('u1', 'I am burned out from ministry').route).toBe('holy_habit')
    expect(orchestrateGiftCallingIntent('u1', 'My leader pressures me to serve').route).toBe('pastoral_care')
  })
})
