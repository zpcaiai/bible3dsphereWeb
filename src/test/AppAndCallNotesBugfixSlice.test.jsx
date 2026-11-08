import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import MissionLifePage from '../MissionLifePage'
import { getState, startNotes, stopNotes, setPreferredEngine } from '../realtime/callNotes'

describe('Slice DP[16] & DP[19]: callNotes Language Propagation & MissionLifePage Adopted Profile', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('auth_token', 'test-jwt-token')
  })

  afterEach(() => {
    stopNotes()
    global.fetch = originalFetch
  })

  it('renders the adopted mission profile card in MissionLifePage when fetchLatestMissionProfile returns a profile', async () => {
    global.fetch = vi.fn(async (url) => {
      const u = String(url)
      if (u.includes('/mission-life/profiles/latest')) {
        return {
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({
            profile: {
              id: 'mp-1',
              life_season: 'parent',
              mission_summary: '在养育儿女与家庭日常中活出恩典与耐心的见证。',
            },
          }),
        }
      }
      if (u.includes('/mission-life/commitments')) {
        return {
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({ commitments: [] }),
        }
      }
      if (u.includes('/mission-life/projects')) {
        return {
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: async () => ({ projects: [] }),
        }
      }
      return {
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({}),
      }
    })

    render(<MissionLifePage user={{ id: 'u-1' }} onBack={() => {}} />)

    await waitFor(() => {
      expect(screen.getByTestId('mission-adopted-profile')).toBeTruthy()
    })

    expect(screen.getByTestId('mission-adopted-profile').textContent).toContain(
      '在养育儿女与家庭日常中活出恩典与耐心的见证。'
    )
    expect(screen.getByTestId('mission-adopted-profile').textContent).toContain('为人父母')
  })

  it('tracks preferredEngine and speech recognition language in callNotes', () => {
    setPreferredEngine('auto')
    expect(getState().preferred).toBe('auto')

    let startedLang = null
    window.SpeechRecognition = class MockSpeechRecognition {
      constructor() {
        this.lang = ''
        this.continuous = false
        this.interimResults = false
      }
      start() {
        startedLang = this.lang
      }
      stop() {}
    }

    const ok = startNotes('en-US', 'Alice')
    expect(ok).toBe(true)
    expect(startedLang).toBe('en-US')
    stopNotes()
    delete window.SpeechRecognition
  })
})
