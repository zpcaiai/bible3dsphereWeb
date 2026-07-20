import React from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import PlatformIntegrationDashboard from '../components/platform-integration/PlatformIntegrationDashboard'
import { PLATFORM_INTEGRATION_STORAGE_KEYS } from '../lib/platformIntegrationStorage'

function stored(key) {
  return JSON.parse(window.localStorage.getItem(key) || '[]')
}

describe('PlatformIntegrationDashboard', () => {
  beforeEach(() => {
    Object.values(PLATFORM_INTEGRATION_STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key))
  })

  afterEach(() => {
    cleanup()
  })

  it('creates Bible doctrine artifacts', () => {
    render(<PlatformIntegrationDashboard userId="u1" />)

    expect(screen.getByText('Bible Knowledge Graph & Doctrine Learning OS / 圣经知识图谱与教义学习系统')).toBeTruthy()
    fireEvent.click(screen.getByText('Create Doctrine Path and Dialogue'))

    expect(stored(PLATFORM_INTEGRATION_STORAGE_KEYS.doctrinePaths)[0].topicKey).toBe('christology')
    expect(stored(PLATFORM_INTEGRATION_STORAGE_KEYS.apologeticsDialogues)[0].topicKey).toBe('problem_of_evil')
  })

  it('creates AI tutor artifacts', () => {
    render(<PlatformIntegrationDashboard userId="u1" />)

    fireEvent.click(screen.getByText('AI Tutor'))
    fireEvent.click(screen.getByText('Generate Agent Artifacts'))

    expect(stored(PLATFORM_INTEGRATION_STORAGE_KEYS.spiritualProfiles)[0].primaryGrowthFocus).toBe('prayerful stability')
    expect(stored(PLATFORM_INTEGRATION_STORAGE_KEYS.dailyPlans)[0].status).toBe('active')
    expect(stored(PLATFORM_INTEGRATION_STORAGE_KEYS.weeklyReviews)).toHaveLength(0)
    expect(stored(PLATFORM_INTEGRATION_STORAGE_KEYS.tutorConversations)[0].messages.length).toBeGreaterThan(1)
  })

  it('creates analytics artifacts', () => {
    render(<PlatformIntegrationDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Analytics'))
    fireEvent.change(screen.getByLabelText('Grace evidence (optional)'), { target: { value: 'Grace noticed in an honest prayer.' } })
    fireEvent.click(screen.getByText('Aggregate Formation Metrics'))

    expect(stored(PLATFORM_INTEGRATION_STORAGE_KEYS.metricValues).length).toBeGreaterThan(5)
    expect(stored(PLATFORM_INTEGRATION_STORAGE_KEYS.graceEvidence)[0].title).toContain('Grace')
    expect(stored(PLATFORM_INTEGRATION_STORAGE_KEYS.analyticsReports)[0].summary).toContain('holiness score')
    expect(stored(PLATFORM_INTEGRATION_STORAGE_KEYS.integrityAudits)[0].findings.length).toBeGreaterThan(1)
  })

  it('creates productization artifacts', () => {
    render(<PlatformIntegrationDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Productization'))
    fireEvent.click(screen.getByText('Create Productization Artifacts'))

    expect(stored(PLATFORM_INTEGRATION_STORAGE_KEYS.organizations)[0].planKey).toBe('church')
    expect(stored(PLATFORM_INTEGRATION_STORAGE_KEYS.organizationMembers)[0].role).toBe('pastor')
    expect(stored(PLATFORM_INTEGRATION_STORAGE_KEYS.moderationCases)[0].auditRequired).toBe(true)
    expect(stored(PLATFORM_INTEGRATION_STORAGE_KEYS.deploymentHealthChecks)[0].status).toBe('ready')
  })

  it('creates master build global session and event', () => {
    render(<PlatformIntegrationDashboard userId="u1" />)

    fireEvent.click(screen.getByText('Master Build'))
    fireEvent.click(screen.getByText('Emit Global Session and Event'))

    expect(stored(PLATFORM_INTEGRATION_STORAGE_KEYS.globalSessions)[0].sourceModule).toBe('master_build')
    expect(stored(PLATFORM_INTEGRATION_STORAGE_KEYS.formationEvents)[0].eventType).toBe('full_registry_checked')
  })
})
