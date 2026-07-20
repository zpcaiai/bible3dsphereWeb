import React from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import SufferingCareDashboard from '../components/suffering-care/SufferingCareDashboard'
import { SUFFERING_CARE_STORAGE_KEYS } from '../lib/sufferingCareStorage'

describe('SufferingCareDashboard', () => {
  beforeEach(() => {
    Object.values(SUFFERING_CARE_STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key))
  })

  afterEach(() => {
    cleanup()
  })

  it('renders care dashboard and saves suffering session summary', () => {
    render(<SufferingCareDashboard userId="u1" />)

    expect(screen.getByText('Suffering, Crisis & Healing Formation OS / 苦难、危机与医治塑造系统')).toBeTruthy()
    fireEvent.click(screen.getByText('Suffering'))
    fireEvent.click(screen.getByText('Reflect Safely'))
    expect(screen.getByText(/Lament is allowed/)).toBeTruthy()
    fireEvent.click(screen.getByText('Save Suffering Session'))

    const sessions = JSON.parse(window.localStorage.getItem(SUFFERING_CARE_STORAGE_KEYS.sufferingSessions) || '[]')
    const summaries = JSON.parse(window.localStorage.getItem(SUFFERING_CARE_STORAGE_KEYS.sufferingSummaries) || '[]')
    expect(sessions[0].status).toBe('completed')
    expect(summaries[0].summary).toContain('pain named')
  })

  it('triages crisis text and creates safety plan', () => {
    render(<SufferingCareDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Crisis'))
    fireEvent.change(screen.getByLabelText('What is happening?'), { target: { value: 'I have pills ready and will kill myself now.' } })
    fireEvent.click(screen.getByText('Run Crisis Triage'))
    expect(screen.getByText(/Ordinary formation is blocked/)).toBeTruthy()
    fireEvent.change(screen.getByPlaceholderText('Name and contact method'), { target: { value: 'Alex, 555-0100' } })
    fireEvent.click(screen.getByText('Create Safety Plan'))

    const assessments = JSON.parse(window.localStorage.getItem(SUFFERING_CARE_STORAGE_KEYS.crisisAssessments) || '[]')
    const plans = JSON.parse(window.localStorage.getItem(SUFFERING_CARE_STORAGE_KEYS.safetyPlans) || '[]')
    expect(assessments[0].riskLevel).toBe('imminent')
    expect(plans[0].status).toBe('active')
  })

  it('creates healing journey, entry, and forgiveness boundary plan', () => {
    render(<SufferingCareDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Healing'))
    fireEvent.click(screen.getByText('Create Healing Journey'))
    fireEvent.change(screen.getByLabelText('Reflection actually written'), { target: { value: 'I named one part of the pain without forcing details.' } })
    fireEvent.click(screen.getByText('Add Healing Entry'))
    fireEvent.change(screen.getByLabelText('Wound or healing need'), { target: { value: 'I need to forgive but contact is unsafe after abuse.' } })
    fireEvent.click(screen.getByText('Create Forgiveness Boundary Plan'))

    const journeys = JSON.parse(window.localStorage.getItem(SUFFERING_CARE_STORAGE_KEYS.healingJourneys) || '[]')
    const entries = JSON.parse(window.localStorage.getItem(SUFFERING_CARE_STORAGE_KEYS.healingEntries) || '[]')
    const plans = JSON.parse(window.localStorage.getItem(SUFFERING_CARE_STORAGE_KEYS.forgivenessPlans) || '[]')
    expect(journeys[0].status).toBe('active')
    expect(entries[0].truthNamed).toContain('without shame')
    expect(plans[0].unsafeContactWarning).toBe(true)
  })

  it('creates pastoral relationship, case, care plan, follow-up, and user-entered log', () => {
    render(<SufferingCareDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Pastoral'))
    fireEvent.click(screen.getByText('Grant Care Access'))
    fireEvent.click(screen.getByText('Create Care Case'))
    fireEvent.click(screen.getByText('Create Care Plan and Follow-Up'))
    fireEvent.change(screen.getByLabelText('Care check-in actually completed'), { target: { value: 'A gentle check-in was completed by the caregiver.' } })
    fireEvent.click(screen.getByText('Save Care Log'))

    const relationships = JSON.parse(window.localStorage.getItem(SUFFERING_CARE_STORAGE_KEYS.careRelationships) || '[]')
    const cases = JSON.parse(window.localStorage.getItem(SUFFERING_CARE_STORAGE_KEYS.careCases) || '[]')
    const logs = JSON.parse(window.localStorage.getItem(SUFFERING_CARE_STORAGE_KEYS.careLogs) || '[]')
    const followups = JSON.parse(window.localStorage.getItem(SUFFERING_CARE_STORAGE_KEYS.careFollowups) || '[]')
    const summaries = JSON.parse(window.localStorage.getItem(SUFFERING_CARE_STORAGE_KEYS.careSummaries) || '[]')
    expect(relationships[0].status).toBe('active')
    expect(cases[0].status).toBe('open')
    expect(logs[0].summary).toContain('check-in')
    expect(followups[0].status).toBe('pending')
    expect(summaries[0].summary).toContain('Care theme')
  })
})
