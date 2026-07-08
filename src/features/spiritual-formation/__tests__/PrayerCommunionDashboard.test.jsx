import React from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import PrayerCommunionDashboard from '../components/prayer-communion/PrayerCommunionDashboard'
import { PRAYER_COMMUNION_STORAGE_KEYS } from '../lib/prayerCommunionStorage'
import { setRuntimeLang } from '../../../i18n/runtime'

describe('PrayerCommunionDashboard', () => {
  beforeEach(() => {
    setRuntimeLang('en')
    Object.values(PRAYER_COMMUNION_STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key))
  })

  afterEach(() => {
    cleanup()
    setRuntimeLang('en')
  })

  it('renders dashboard cards and completes a prayer rule session', () => {
    render(<PrayerCommunionDashboard userId="u1" />)

    expect(screen.getByText('Prayer & Communion OS')).toBeTruthy()
    expect(screen.getByText('Today’s Prayer Rhythm')).toBeTruthy()

    fireEvent.click(screen.getByText('Open Prayer Rule'))
    fireEvent.click(screen.getAllByText('Start Prayer Session')[0])
    fireEvent.change(screen.getByLabelText('Gratitude'), { target: { value: 'daily bread' } })
    fireEvent.change(screen.getByLabelText('Petitions'), { target: { value: 'wisdom for work' } })
    fireEvent.click(screen.getByText('Complete Prayer Session'))

    expect(screen.getByText('Prayer Session Summary')).toBeTruthy()
    const stored = JSON.parse(window.localStorage.getItem(PRAYER_COMMUNION_STORAGE_KEYS.prayerSessions) || '[]')
    expect(stored[0].status).toBe('completed')
  })

  it('renders main controls in Chinese mode', () => {
    setRuntimeLang('zh')
    render(<PrayerCommunionDashboard userId="u1" />)

    expect(screen.getByText('祷告与神相交系统')).toBeTruthy()
    expect(screen.getByText('今日祷告节奏')).toBeTruthy()
    expect(screen.getByText('打开祷告规则')).toBeTruthy()
  })

  it('creates intercession request and marks it answered', () => {
    render(<PrayerCommunionDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Intercession'))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Pray for wisdom' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Need wise next steps' } })
    fireEvent.click(screen.getByText('Create Request'))
    fireEvent.click(screen.getByText('Mark Answered'))

    expect(screen.getByText('Answered Prayer Timeline')).toBeTruthy()
    const stored = JSON.parse(window.localStorage.getItem(PRAYER_COMMUNION_STORAGE_KEYS.prayerRequests) || '[]')
    expect(stored[0].status).toBe('answered')
  })

  it('starts and completes a presence check-in', () => {
    render(<PrayerCommunionDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Presence'))
    fireEvent.click(screen.getByText('Start Presence Check-In'))
    fireEvent.change(screen.getByLabelText('Return action'), { target: { value: 'Answer slowly.' } })
    fireEvent.click(screen.getAllByText('Complete Check-In').find((node) => node.tagName === 'BUTTON'))

    expect(screen.getByText(/Presence awareness is a subjective formation indicator/)).toBeTruthy()
    const stored = JSON.parse(window.localStorage.getItem(PRAYER_COMMUNION_STORAGE_KEYS.presenceCheckins) || '[]')
    expect(stored[0].completed).toBe(true)
  })
})
