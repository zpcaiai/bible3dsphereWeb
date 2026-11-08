import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import DevotionJournalPage from '../DevotionJournalPage.jsx'
import DiscipleFormationView from '../DiscipleFormationView.jsx'

describe('Slice 14 (DP[14]): DevotionJournalPage single-journal export & DiscipleFormationView end relationship', () => {
  const origFetch = globalThis.fetch
  const origCreateObjectURL = URL.createObjectURL
  const origRevokeObjectURL = URL.revokeObjectURL

  beforeEach(() => {
    URL.createObjectURL = () => 'blob:mock-export-url'
    URL.revokeObjectURL = () => {}
  })

  afterEach(() => {
    globalThis.fetch = origFetch
    URL.createObjectURL = origCreateObjectURL
    URL.revokeObjectURL = origRevokeObjectURL
  })

  it('renders single-journal TXT and PDF export buttons in DevotionJournalPage detail view', async () => {
    const headers = new Headers({ 'content-type': 'application/json' })
    globalThis.fetch = async (url) => {
      const u = String(url)
      if (u.includes('/devotion/journals')) {
        return {
          ok: true,
          status: 200,
          headers,
          json: async () => ({
            items: [
              {
                id: 'dj-101',
                date: '2026-04-12',
                title: '清晨默想恩典',
                scripture: '诗篇 23:1-3',
                observation: '耶和华是我的牧者',
                reflection: '我必不至缺乏',
                application: '今日安静信靠',
                prayer: '主啊感谢你',
                updated_at: '2026-04-12T08:30:00Z',
              },
            ],
            total: 1,
          }),
        }
      }
      return { ok: true, status: 200, headers, json: async () => ({}) }
    }

    render(
      <DevotionJournalPage
        user={{ email: 'reader@test.com' }}
        token="tok-123"
        onBack={() => {}}
        initialSection="journal"
      />
    )

    const cardTitle = await screen.findByText('清晨默想恩典')
    fireEvent.click(cardTitle)

    const txtBtn = await screen.findByTestId('devotion-export-txt')
    const pdfBtn = await screen.findByTestId('devotion-export-pdf')
    expect(txtBtn).toBeTruthy()
    expect(pdfBtn).toBeTruthy()

    // Trigger single-journal TXT export
    fireEvent.click(txtBtn)
  })

  it('wires end(r.id) relationship button in DiscipleFormationView Network tab', async () => {
    let endedRelId = null
    globalThis.fetch = async (url, opts = {}) => {
      const u = String(url)
      if (u.includes('/disciple/meta')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            dimensions: [{ key: 'faith', zh: '信心' }],
            idols: [],
            states: [{ key: 'SEEKING', zh: '慕道', order: 0 }],
            engines: [],
          }),
        }
      }
      if (u.includes('/disciple/profile')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ profile: { current_state: 'SEEKING', dimensions: { faith: 70 } } }),
        }
      }
      if (u.includes('/disciple/network/rel-77/end') && opts.method === 'POST') {
        endedRelId = 'rel-77'
        return { ok: true, status: 200, json: async () => ({ ok: true }) }
      }
      if (u.includes('/disciple/network')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            network: {
              depth: 1,
              breadth: endedRelId ? 0 : 1,
              second_generation: 0,
              relationships: endedRelId
                ? []
                : [{ id: 'rel-77', disciple_name: '提摩太', relationship_type: 'DISCIPLER' }],
            },
            dmi: { dmi: 68 },
          }),
        }
      }
      if (u.includes('/disciple/graph')) {
        return { ok: true, status: 200, json: async () => ({ enabled: false, insights: [] }) }
      }
      return { ok: true, status: 200, json: async () => ({}) }
    }

    render(<DiscipleFormationView user={{ email: 'paul@test.com' }} token="tok-123" />)

    const netTabBtn = await screen.findByText(/🌳 门徒/)
    fireEvent.click(netTabBtn)

    expect(await screen.findByText('提摩太')).toBeTruthy()
    const endBtn = await screen.findByTestId('disciple-end-rel-rel-77')
    fireEvent.click(endBtn)

    await waitFor(() => {
      expect(endedRelId).toBe('rel-77')
    })
  })
})
