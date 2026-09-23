import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DigitalHumanOperationsPanel from '../digital-human/DigitalHumanOperationsPanel'
import { getDigitalHumanMetrics } from '../digital-human/api'

vi.mock('../digital-human/api', () => ({ getDigitalHumanMetrics: vi.fn() }))

describe('DigitalHumanOperationsPanel', () => {
  afterEach(() => { cleanup(); vi.clearAllMocks() })

  it('shows only aggregate, content-free operations evidence to admins', async () => {
    getDigitalHumanMetrics.mockResolvedValue({
      turns: { total: 12, speechReadyRatePct: 25, blockedRatePct: 8.333, states: {} },
      latencyMs: { p50: 42, p95: 120, max: 180 },
      providers: { livekit: { events: 3, lastState: 'READY', states: { READY: 3 }, latencyMsP95: 20 } },
      containsRawContent: false,
    })
    render(<DigitalHumanOperationsPanel enabled />)
    await waitFor(() => expect(screen.getByText('12')).toBeTruthy())
    expect(screen.getByText('120 ms')).toBeTruthy()
    expect(screen.getByText(/不含原始音频/)).toBeTruthy()
    expect(document.body.textContent).not.toContain('transcript')
  })

  it('does not query or render for non-admin users', () => {
    const { container } = render(<DigitalHumanOperationsPanel enabled={false} />)
    expect(container.textContent).toBe('')
    expect(getDigitalHumanMetrics).not.toHaveBeenCalled()
  })
})
