import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { fetchPeople } from '../features/bible-map/lib/dataSource'

if (typeof window !== 'undefined' && typeof window.URL.createObjectURL !== 'function') {
  window.URL.createObjectURL = () => 'blob:maplibre-worker'
}

describe('Slice 9-10 (DP[9]-DP[10]): Bible Atlas Person Journeys (seed-people.ts)', () => {
  const origFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 503,
      json: async () => ({ success: false }),
    })) as unknown as typeof fetch
  })

  afterEach(() => {
    globalThis.fetch = origFetch
  })

  it('returns seedPeople from fetchPeople() fallback and renders person journeys & stops in BibleMapClient + DetailPanel', async () => {
    const { BibleMapClient } = await import('../features/bible-map/components/BibleMapClient')
    const people = await fetchPeople()
    expect(people.length).toBeGreaterThanOrEqual(8)
    expect(people.some((p) => p.id === 'abraham' && p.personZh === '亚伯拉罕')).toBe(true)

    render(<BibleMapClient />)

    const peopleLayerBtn = await screen.findByRole('button', { name: '人物足迹' })
    fireEvent.click(peopleLayerBtn)

    const abrahamBtn = await screen.findByTestId('bible-map-person-abraham')
    expect(abrahamBtn.textContent).toContain('亚伯拉罕')
    expect(abrahamBtn.textContent).toContain('创 11-25')

    fireEvent.click(abrahamBtn)

    const detail = await screen.findByTestId('bible-map-person-detail')
    expect(detail.textContent).toContain('应许之约的承受者')
    expect(detail.textContent).toContain('1. 吾珥 (Ur)')
    expect(detail.textContent).toContain('7. 摩利亚山 (Mount Moriah)')
  })
})
