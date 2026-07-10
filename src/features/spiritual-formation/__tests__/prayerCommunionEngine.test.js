import { describe, expect, it } from 'vitest'
import {
  buildPrayerDashboard,
  completePrayerSession,
  completePresenceCheckin,
  createDefaultPrayerRule,
  createPresenceCheckin,
  createPrayerRequest,
  getTodayIntercessionPlan,
  getTodayPrayerPlan,
  orchestratePrayerIntent,
  recommendPresencePractice,
  recommendPsalm,
  startPrayerSession,
  startPsalmPrayerSession,
  submitPsalmMovement,
} from '../lib/prayerCommunionEngine'
import { psalmProfiles } from '../data/prayerCommunionSeed'

describe('Prayer & Communion OS engine', () => {
  it('never exposes placeholder copy as Psalm text', () => {
    expect(psalmProfiles.every((psalm) => psalm.text === '' && psalm.textAvailable === false)).toBe(true)
  })

  it('creates a default prayer rule and completes a prayer session', () => {
    const rule = createDefaultPrayerRule('u1')
    const plan = getTodayPrayerPlan('u1', [rule], [])
    const session = startPrayerSession('u1', plan.activeRule, plan.slots[0])
    const result = completePrayerSession(session, {
      prayerText: 'Father, I receive this day from You.',
      gratitudeItems: ['morning light'],
      petitions: ['wisdom for work'],
      obediencePrompt: 'Begin work with honesty.',
    })

    expect(plan.slots).toHaveLength(3)
    expect(result.session.status).toBe('completed')
    expect(result.session.summary).toContain('morning light')
  })

  it('prioritizes urgent intercession requests and warns about private details', () => {
    const normal = createPrayerRequest('u1', { title: 'Wisdom for a friend', category: 'wisdom', urgency: 'normal' }).request
    const urgent = createPrayerRequest('u1', { title: 'Private family burden', description: 'private diagnosis details', category: 'healing', urgency: 'urgent' }).request
    const plan = getTodayIntercessionPlan('u1', [normal, urgent])

    expect(plan[0].id).toBe(urgent.id)
    expect(urgent.privacyWarning).toContain('sensitive details')
  })

  it('recommends Psalm and presence practices by context', () => {
    expect(recommendPsalm('anxiety', 'trust')[0].psalmNumber).toBe(23)
    expect(recommendPsalm('guilt', 'confession')[0].psalmNumber).toBe(32)
    expect(recommendPresencePractice('coding', 'focused').key).toBe('work_offering')
    expect(recommendPresencePractice('conflict', 'anger').key).toBe('conflict_pause')
  })

  it('allows unresolved lament without forcing positivity', () => {
    let session = startPsalmPrayerSession('u1', 88, 'lament', ['grief'])
    for (const movement of session.movements) {
      const result = submitPsalmMovement(session, movement.movementKey, movement.movementKey === 'rest' ? 'I will sit honestly before God.' : 'How long, O Lord?')
      session = result.session
    }

    expect(session.activeMovementIndex).toBe(session.movements.length)
    expect(session.movements.at(-1).aiGuidance).toContain('force a happy ending')
  })

  it('routes crisis content before normal prayer guidance', () => {
    const route = orchestratePrayerIntent('u1', 'I might hurt myself tonight', {})

    expect(route.route).toBe('crisis_care')
    expect(route.nextEndpoint).toBe('crisis_care_system')
  })

  it('builds dashboard data and completes a presence check-in', () => {
    const rule = createDefaultPrayerRule('u1')
    const session = completePrayerSession(startPrayerSession('u1', rule, rule.slots[0]), { prayerText: 'Lord, guide me.' }).session
    const checkinResult = createPresenceCheckin('u1', { contextLabel: 'work', emotionalState: 'anxiety', awarenessBefore: 3 })
    const completedCheckin = completePresenceCheckin(checkinResult.checkin, { awarenessAfter: 6, shortPrayer: 'Lord Jesus Christ, have mercy on me.', returnAction: 'Answer slowly.' }).checkin
    const dashboard = buildPrayerDashboard({ userId: 'u1', rules: [rule], prayerSessions: [session], prayerRequests: [], psalmSessions: [], presenceCheckins: [completedCheckin] })

    expect(dashboard.today.completedPrayerSessions).toBe(1)
    expect(dashboard.weeklySummary.presenceCheckins).toBe(1)
  })
})
