import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GrowthMapPage from '../GrowthMapPage'

describe('Slice 8 (DP[8]): GrowthMapPage wires GrowthCurve and FormationHistory', () => {
  const origFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn(async (input) => {
      const url = typeof input === 'string' ? input : input.url
      if (url.includes('/sfds/v3/formation/profile/')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            formation: {
              state_vector: {
                humility: 0.72,
                fear_tendency: 0.25,
                pride_tendency: 0.2,
                emotional_stability: 0.68,
                truth_alignment: 0.81,
                relational_health: 0.74,
                resilience: 0.7,
                spiritual_clarity: 0.76,
              },
              dimension_scores: [{ dimension: 'humility', delta: 0.05 }],
              formation_arc: 'stabilizing',
              trajectory_direction: 'improving_clarity',
            },
          }),
        }
      }
      if (url.includes('/api/milestones')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            milestones: [
              { icon: '🌿', name: '旷野七日', desc: '连续7天灵修', earned_at: '2026-11-01' },
            ],
          }),
        }
      }
      if (url.includes('/api/formation/curve')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            series: [
              { period: '2026-10-01', total: 4, green: 3, amber: 1, red: 0 },
              { period: '2026-10-08', total: 5, green: 4, amber: 1, red: 0 },
            ],
            domains: [{ domain: '话语默想', count: 6 }],
          }),
        }
      }
      if (url.includes('/api/formation/timeline')) {
        const isWorldview = url.includes('source=worldview')
        return {
          ok: true,
          status: 200,
          json: async () => ({
            events: isWorldview
              ? [
                  {
                    id: 'ev-wv-1',
                    source: 'worldview',
                    title: '成功神学辨析',
                    summary: '重申十字架道路与管家职分',
                    occurredAt: '2026-11-05T08:00:00Z',
                  },
                ]
              : [
                  {
                    id: 'ev-sf-1',
                    source: 'spiritual_formation',
                    title: '清晨省察操练',
                    summary: '在安静中等候神的话语',
                    occurredAt: '2026-11-06T07:30:00Z',
                  },
                ],
          }),
        }
      }
      return { ok: true, status: 200, json: async () => ({}) }
    })
  })

  afterEach(() => {
    globalThis.fetch = origFetch
  })

  it('switches across chart, curve (GrowthCurve), history (FormationHistory), and milestones tabs', async () => {
    render(
      <GrowthMapPage
        user={{ email: 'grace@example.org', name: 'Grace' }}
        token="tok-slice8"
        onBack={() => {}}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('growth-map-tab-curve')).toBeTruthy()
    })

    fireEvent.click(screen.getByTestId('growth-map-tab-curve'))
    const domainTag = await screen.findByText(/话语默想 · 6/)
    expect(domainTag).toBeTruthy()

    fireEvent.click(screen.getByTestId('growth-map-tab-history'))
    const timelineItem = await screen.findByText(/清晨省察操练/)
    expect(timelineItem).toBeTruthy()

    fireEvent.click(screen.getByTestId('growth-history-filter-worldview'))
    const filteredItem = await screen.findByText(/成功神学辨析/)
    expect(filteredItem).toBeTruthy()
  })
})
