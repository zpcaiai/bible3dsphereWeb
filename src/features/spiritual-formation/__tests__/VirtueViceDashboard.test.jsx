import React from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import VirtueViceDashboard from '../components/virtue-vice/VirtueViceDashboard'
import { VIRTUE_VICE_STORAGE_KEYS } from '../lib/virtueViceStorage'
import { setRuntimeLang } from '../../../i18n/runtime'

describe('VirtueViceDashboard', () => {
  beforeEach(() => {
    setRuntimeLang('en')
    Object.values(VIRTUE_VICE_STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key))
  })

  afterEach(() => {
    cleanup()
    setRuntimeLang('en')
  })

  it('renders dashboard controls in Chinese mode', () => {
    setRuntimeLang('zh')
    render(<VirtueViceDashboard userId="u1" />)

    expect(screen.getByText('德性与罪性塑造系统')).toBeTruthy()
    expect(screen.getByText('当前德性焦点')).toBeTruthy()
    expect(screen.getByText('打开德性')).toBeTruthy()
  })

  it('creates a virtue focus and logs a practice', () => {
    render(<VirtueViceDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Virtues'))
    fireEvent.click(screen.getByText('Create Virtue Focus'))
    fireEvent.change(screen.getByLabelText('Reflection'), { target: { value: 'I paused before replying.' } })
    fireEvent.click(screen.getByText('Log Practice'))

    expect(screen.getByText(/Practice logged/)).toBeTruthy()
    const logs = JSON.parse(window.localStorage.getItem(VIRTUE_VICE_STORAGE_KEYS.virtueLogs) || '[]')
    expect(logs[0].completed).toBe(true)
  })

  it('analyzes and saves a vice observation', () => {
    render(<VirtueViceDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Vices'))
    fireEvent.click(screen.getByText('Analyze Pattern'))
    expect(screen.getByText(/Possible vices/)).toBeTruthy()
    fireEvent.click(screen.getByText('Confirm and Save Observation'))

    const observations = JSON.parse(window.localStorage.getItem(VIRTUE_VICE_STORAGE_KEYS.observations) || '[]')
    const patterns = JSON.parse(window.localStorage.getItem(VIRTUE_VICE_STORAGE_KEYS.patterns) || '[]')
    expect(observations).toHaveLength(1)
    expect(patterns).toHaveLength(1)
  })

  it('creates temptation check-in and fruit assessment', () => {
    render(<VirtueViceDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Temptation'))
    fireEvent.click(screen.getByText('Create Temptation Plan'))
    fireEvent.click(screen.getByText('Get Resistance Guidance'))
    fireEvent.click(screen.getByText('Log Resisted'))
    expect(screen.getByText('Temptation check-in saved.')).toBeTruthy()

    fireEvent.click(screen.getByText('Fruit'))
    fireEvent.change(screen.getByPlaceholderText('Where did fruit appear or feel resisted?'), { target: { value: 'Patience was hard in family conflict.' } })
    fireEvent.click(screen.getByText('Save Fruit Assessment'))

    const assessments = JSON.parse(window.localStorage.getItem(VIRTUE_VICE_STORAGE_KEYS.fruitAssessments) || '[]')
    expect(assessments[0].scores).toHaveLength(9)
  })
})
