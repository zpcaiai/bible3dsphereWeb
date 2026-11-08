import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import SermonJournalPage from '../SermonJournalPage.jsx'
import EngineeringPage from '../EngineeringPage.jsx'

describe('Slice 13 (DP[13]): SermonJournalPage ASI crash + state rendering & EngineeringPage 8-dim scores', () => {
  const origFetch = globalThis.fetch
  const origShowToast = window.showToast

  beforeEach(() => {
    window.showToast = (msg, kind) => {
      window.__lastToast = { msg, kind }
    }
    window.__lastToast = null
  })

  afterEach(() => {
    globalThis.fetch = origFetch
    window.showToast = origShowToast
  })

  it('displays total count in SermonJournalPage list view and handles save failure without TypeError', async () => {
    globalThis.fetch = async (url, opts = {}) => {
      const u = String(url)
      const headers = new Headers({ 'content-type': 'application/json' })
      if (u.includes('/sermon/journals') && (!opts.method || opts.method === 'GET')) {
        return {
          ok: true,
          status: 200,
          headers,
          json: async () => ({
            items: [
              {
                id: 'sj-1',
                date: '2026-04-12',
                title: '恩典中的盼望',
                scripture: '罗马书 5:1-5',
                summary: '因信称义得享平安',
              },
            ],
            total: 1,
            is_admin: true,
          }),
        }
      }
      if (u.includes('/sermon/journals') && opts.method === 'POST') {
        return {
          ok: false,
          status: 500,
          headers,
          json: async () => ({ detail: 'Server storage unavailable' }),
        }
      }
      return { ok: true, status: 200, headers, json: async () => ({}) }
    }

    render(<SermonJournalPage user={{ email: 'admin@test.com' }} token="tok-123" onBack={() => {}} />)

    const totalEl = await screen.findByTestId('sermon-journal-total')
    expect(totalEl.textContent).toContain('1')
    expect(screen.getByText('恩典中的盼望')).toBeTruthy()

    // Trigger newJournal -> POST fails -> should invoke window.showToast without TypeError
    const newBtn = screen.getByTitle('新建信息')
    fireEvent.click(newBtn)

    await waitFor(() => {
      expect(window.__lastToast).toBeTruthy()
      expect(window.__lastToast.msg).toContain('创建失败:')
    })
  })

  it('wires 8-dimension state_vector scores into EngineeringPage DimBar', async () => {
    globalThis.fetch = async (url) => {
      const u = String(url)
      if (u.includes('/sfds/v3/formation/profile/')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            state_vector: {
              humility: 0.91,
              truth_alignment: 0.84,
              resilience: 0.78,
            },
          }),
        }
      }
      if (u.includes('/daily-devotion-personal')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            formation: {
              focus_dim: 'humility',
              focus_label: '谦卑',
              stage: 'growing',
              prescription: '每日默想基督十架恩典',
            },
          }),
        }
      }
      if (u.includes('/health-check/latest')) {
        return { ok: true, status: 200, json: async () => ({ ok: false }) }
      }
      return { ok: true, status: 200, json: async () => ({}) }
    }

    render(<EngineeringPage user={{ email: 'believer@test.com' }} token="tok-123" onBack={() => {}} />)

    expect(await screen.findByText('91%')).toBeTruthy()
    expect(await screen.findByText('84%')).toBeTruthy()
    expect(await screen.findByText('78%')).toBeTruthy()
  })
})
