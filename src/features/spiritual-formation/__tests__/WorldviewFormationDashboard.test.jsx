import React from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import WorldviewFormationDashboard from '../components/worldview/WorldviewFormationDashboard'
import { WORLDVIEW_FORMATION_STORAGE_KEYS } from '../lib/worldviewFormationStorage'

describe('WorldviewFormationDashboard', () => {
  beforeEach(() => {
    Object.values(WORLDVIEW_FORMATION_STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key))
  })

  afterEach(() => {
    cleanup()
  })

  it('renders dashboard and belief diagnostic flow', () => {
    render(<WorldviewFormationDashboard userId="u1" />)

    expect(screen.getByText('Worldview Formation OS Expansion / 世界观塑造系统扩展')).toBeTruthy()
    fireEvent.click(screen.getByText('Beliefs'))
    fireEvent.click(screen.getByText('Diagnose Possible Belief'))
    expect(screen.getByText('Diagnostic Result')).toBeTruthy()
    fireEvent.click(screen.getByText('Confirm and Save Observation'))

    const observations = JSON.parse(window.localStorage.getItem(WORLDVIEW_FORMATION_STORAGE_KEYS.beliefObservations) || '[]')
    const patterns = JSON.parse(window.localStorage.getItem(WORLDVIEW_FORMATION_STORAGE_KEYS.beliefPatterns) || '[]')
    expect(observations[0].userConfirmed).toBe(true)
    expect(patterns[0].title).toContain('Work')
  })

  it('maps idol and saves surrender pattern', () => {
    render(<WorldviewFormationDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Idols'))
    fireEvent.click(screen.getByText('Detect Possible Idol'))
    expect(screen.getByText('Idol Detection Result')).toBeTruthy()
    fireEvent.click(screen.getByText('Confirm and Save Idol Pattern'))

    const observations = JSON.parse(window.localStorage.getItem(WORLDVIEW_FORMATION_STORAGE_KEYS.idolObservations) || '[]')
    const patterns = JSON.parse(window.localStorage.getItem(WORLDVIEW_FORMATION_STORAGE_KEYS.idolPatterns) || '[]')
    expect(observations[0].possibleIdolCategories).toContain('control')
    expect(patterns[0].replacementWorshipPractices.length).toBeGreaterThan(0)
  })

  it('generates and saves gospel reframing', () => {
    render(<WorldviewFormationDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Reframing'))
    fireEvent.click(screen.getByText('Generate Gospel Reframing'))
    expect(screen.getByText('Reframed Belief')).toBeTruthy()
    fireEvent.click(screen.getByText('Save Reframing Session'))

    const sessions = JSON.parse(window.localStorage.getItem(WORLDVIEW_FORMATION_STORAGE_KEYS.gospelSessions) || '[]')
    const actions = JSON.parse(window.localStorage.getItem(WORLDVIEW_FORMATION_STORAGE_KEYS.gospelActions) || '[]')
    expect(sessions[0].status).toBe('completed')
    expect(actions.length).toBe(2)
  })

  it('runs decision discernment wizard path', () => {
    render(<WorldviewFormationDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Discernment'))
    fireEvent.click(screen.getByText('One-shot Discernment'))
    expect(screen.getByText('Wisdom Path Summary')).toBeTruthy()
    fireEvent.click(screen.getByText('Create Decision Session'))
    fireEvent.click(screen.getByText('Add Option'))
    fireEvent.change(screen.getByLabelText('Counsel actually received'), { target: { value: 'A mentor advised gathering the contract details first.' } })
    fireEvent.click(screen.getByText('Save Counsel and Summarize'))

    const sessions = JSON.parse(window.localStorage.getItem(WORLDVIEW_FORMATION_STORAGE_KEYS.decisionSessions) || '[]')
    const summaries = JSON.parse(window.localStorage.getItem(WORLDVIEW_FORMATION_STORAGE_KEYS.decisionSummaries) || '[]')
    expect(sessions[0].decisionType).toBe('job')
    expect(summaries[0].recommendedPath).toContain('not as divine certainty')
  })
})
