import React from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import CommunityDiscipleshipDashboard from '../components/community-discipleship/CommunityDiscipleshipDashboard'
import { COMMUNITY_DISCIPLESHIP_STORAGE_KEYS } from '../lib/communityDiscipleshipStorage'

function stored(key) {
  return JSON.parse(window.localStorage.getItem(key) || '[]')
}

describe('CommunityDiscipleshipDashboard', () => {
  beforeEach(() => {
    Object.values(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key))
  })

  afterEach(() => {
    cleanup()
  })

  it('renders overview and creates a discipleship pathway', () => {
    render(<CommunityDiscipleshipDashboard userId="u1" />)

    expect(screen.getByText('Community, Accountability & Discipleship OS / 群体、监督与门徒训练系统')).toBeTruthy()
    fireEvent.click(screen.getByText('Pathway'))
    fireEvent.click(screen.getByText('Create Discipleship Pathway'))
    fireEvent.click(screen.getByText('Complete Next Step'))
    fireEvent.click(screen.getByText('Generate Pathway Review'))

    expect(stored(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS.assessments)[0].userId).toBe('u1')
    expect(stored(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS.discipleshipPaths)[0].status).toBe('active')
    expect(stored(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS.discipleshipSteps).some((step) => step.status === 'completed')).toBe(true)
    expect(stored(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS.discipleshipReviews)[0].summary).toContain('step')
  })

  it('creates accountability group, check-in, response, prayer, and review', () => {
    render(<CommunityDiscipleshipDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Accountability'))
    fireEvent.click(screen.getByText('Create Accountability Group'))
    fireEvent.change(screen.getByLabelText('Prayer request'), { target: { value: 'Please pray for steady practice.' } })
    fireEvent.click(screen.getByLabelText('Support is needed'))
    fireEvent.click(screen.getByText('Create Goal and Check-In'))
    fireEvent.change(screen.getByLabelText('Response actually given'), { target: { value: 'I hear you and will pray.' } })
    fireEvent.click(screen.getByText('Add Response and Prayer'))
    fireEvent.click(screen.getByText('Generate Group Review'))

    expect(stored(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS.accountabilityGroups)[0].groupRule).toContain('Grace-shaped')
    expect(stored(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS.accountabilityCheckins)[0].supportNeeded).toBe(true)
    expect(stored(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS.accountabilityResponses)[0].responseText).toContain('pray')
    expect(stored(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS.groupPrayerRequests)[0].status).toBe('active')
    expect(stored(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS.groupReviews)[0].summary).toContain('check-in')
  })

  it('creates mentor relationship, session, action plan, and review', () => {
    render(<CommunityDiscipleshipDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Mentor'))
    fireEvent.click(screen.getByText('Create Mentor Relationship'))
    fireEvent.click(screen.getByText('Create Mentor Session'))
    fireEvent.change(screen.getByLabelText('Mentor observation actually made'), { target: { value: 'A steady desire for prayer was described.' } })
    fireEvent.change(screen.getByLabelText('Agreed actions (one per line)'), { target: { value: 'pray morning prayer three times\nsend one honest check-in' } })
    fireEvent.click(screen.getByText('Add Observation and Action Plan'))
    fireEvent.click(screen.getByText('Generate Mentor Review'))

    expect(stored(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS.mentorRelationships)[0].permissionScope).toBe('growth_summary')
    expect(stored(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS.mentorSessions)[0].status).toBe('planned')
    expect(stored(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS.mentorObservations)[0].description).toContain('prayer')
    expect(stored(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS.mentorActionPlans)[0].actions).toContain('send one honest check-in')
    expect(stored(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS.mentorReviews)[0].summary).toContain('session')
  })

  it('creates church connection, rhythm, ministry match, and re-entry plan', () => {
    render(<CommunityDiscipleshipDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Church'))
    fireEvent.click(screen.getByText('Create Church Connection'))
    fireEvent.click(screen.getByText('Create Rhythm'))
    fireEvent.click(screen.getByLabelText('Attended or practiced this rhythm'))
    fireEvent.change(screen.getByLabelText('Church rhythm reflection'), { target: { value: 'Participated with attention.' } })
    fireEvent.click(screen.getByText('Save Rhythm Check-In'))
    fireEvent.click(screen.getByText('Create Ministry Match'))
    fireEvent.change(screen.getByLabelText('Church context'), { target: { value: 'I experienced church hurt and need safe re-entry.' } })
    fireEvent.click(screen.getByText('Create Re-Entry Plan'))

    expect(stored(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS.churchProfiles)[0].name).toBe('Local Church')
    expect(stored(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS.churchRhythms)[0].status).toBe('active')
    expect(stored(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS.churchCheckins)[0].attendedOrPracticed).toBe(true)
    expect(stored(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS.ministryMatches)[0].status).toBe('suggested')
    expect(stored(COMMUNITY_DISCIPLESHIP_STORAGE_KEYS.churchReentryPlans)[0].supportPersonNeeded).toBe(true)
  })
})
