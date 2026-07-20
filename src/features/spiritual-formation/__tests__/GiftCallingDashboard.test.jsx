import React from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import GiftCallingDashboard from '../components/gift-calling/GiftCallingDashboard'
import { GIFT_CALLING_STORAGE_KEYS } from '../lib/giftCallingStorage'

function stored(key) {
  return JSON.parse(window.localStorage.getItem(key) || '[]')
}

describe('GiftCallingDashboard', () => {
  beforeEach(() => {
    Object.values(GIFT_CALLING_STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key))
  })

  afterEach(() => {
    cleanup()
  })

  it('renders overview and completes gifts assessment with feedback', () => {
    render(<GiftCallingDashboard userId="u1" />)

    expect(screen.getByText('Gift, Calling & Mission OS / 恩赐、呼召与使命系统')).toBeTruthy()
    fireEvent.click(screen.getByText('Gifts'))
    fireEvent.click(screen.getByText('Complete Gift Assessment'))
    fireEvent.change(screen.getByPlaceholderText('teaching, encouragement'), { target: { value: 'teaching, encouragement' } })
    fireEvent.change(screen.getByLabelText('Mentor feedback actually received'), { target: { value: 'A mentor observed patient teaching.' } })
    fireEvent.click(screen.getByText('Add Mentor Feedback'))

    expect(stored(GIFT_CALLING_STORAGE_KEYS.giftAssessments)[0].status).toBe('completed')
    expect(stored(GIFT_CALLING_STORAGE_KEYS.giftProfiles)[0].primaryGifts.length).toBeGreaterThan(0)
    expect(stored(GIFT_CALLING_STORAGE_KEYS.giftFeedbackEntries)[0].observedGiftKeys).toContain('teaching')
  })

  it('creates calling pattern, experiment, and review', () => {
    render(<GiftCallingDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Calling'))
    fireEvent.click(screen.getByText('Analyze Calling Pattern'))
    fireEvent.click(screen.getByText('Create Calling Experiment'))
    fireEvent.change(screen.getByLabelText('Fruit actually observed'), { target: { value: 'One learner understood the passage more clearly.' } })
    fireEvent.click(screen.getByText('Review Calling Experiment'))

    expect(stored(GIFT_CALLING_STORAGE_KEYS.callingSessions)[0].status).toBe('started')
    expect(stored(GIFT_CALLING_STORAGE_KEYS.callingInputs).length).toBe(1)
    expect(stored(GIFT_CALLING_STORAGE_KEYS.callingPatterns)[0].title).toContain('Teaching')
    expect(stored(GIFT_CALLING_STORAGE_KEYS.callingExperimentReviews)[0].summary).toContain('Calling remains')
  })

  it('generates ministry matches and service trial review', () => {
    render(<GiftCallingDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Ministry'))
    fireEvent.click(screen.getByText('Generate Ministry Matches'))
    fireEvent.click(screen.getByText('Create Service Trial'))
    fireEvent.change(screen.getByLabelText('Fruit or concern actually observed'), { target: { value: 'I served within the agreed boundary.' } })
    fireEvent.click(screen.getByText('Review Service Trial'))

    expect(stored(GIFT_CALLING_STORAGE_KEYS.capacityProfiles)[0].weeklyAvailableHours).toBeGreaterThan(0)
    expect(stored(GIFT_CALLING_STORAGE_KEYS.ministryMatches)[0].status).toBe('suggested')
    expect(stored(GIFT_CALLING_STORAGE_KEYS.serviceTrials)[0].status).toBe('planned')
    expect(stored(GIFT_CALLING_STORAGE_KEYS.serviceReviews)[0].summary).toContain('Trial')
  })

  it('designs mission life with commitment, project, log, and review', () => {
    render(<GiftCallingDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Mission Life'))
    fireEvent.click(screen.getByText('Design Mission Life'))
    fireEvent.click(screen.getByText('Create Project'))
    fireEvent.change(screen.getByLabelText('Mission action actually taken'), { target: { value: 'Invited a neighbor for tea.' } })
    fireEvent.click(screen.getByText('Save Mission Action Log'))
    fireEvent.click(screen.getByText('Generate Mission Review'))

    expect(stored(GIFT_CALLING_STORAGE_KEYS.missionProfiles)[0].lifeSeason).toBe('single_worker')
    expect(stored(GIFT_CALLING_STORAGE_KEYS.missionCommitments)[0].status).toBe('active')
    expect(stored(GIFT_CALLING_STORAGE_KEYS.missionProjects)[0].status).toBe('planned')
    expect(stored(GIFT_CALLING_STORAGE_KEYS.missionProjectLogs)[0].actionTaken).toContain('neighbor')
    expect(stored(GIFT_CALLING_STORAGE_KEYS.missionLifeReviews)[0].summary).toContain('Mission life')
  })
})
