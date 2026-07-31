import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { fetchStatsMock } = vi.hoisted(() => ({
  fetchStatsMock: vi.fn(),
}))

vi.mock('../api', () => ({
  fetchDatingPriorityStats: fetchStatsMock,
}))

import DatingPriorityStatsPage from '../DatingPriorityStatsPage'

function stats(total, suffix) {
  return {
    total,
    priority_stats: [{
      category: '人品与关系品质',
      label: `优先因素-${suffix}`,
      avg_rank: 1.5,
      avg_score: 35,
      selection_rate: 75,
    }],
    veto_stats: [{ label: `否决条件-${suffix}`, selection_rate: 50 }],
  }
}

describe('DatingPriorityStatsPage', () => {
  beforeEach(() => {
    fetchStatsMock.mockReset()
    fetchStatsMock
      .mockResolvedValueOnce(stats(8, 'A'))
      .mockResolvedValueOnce(stats(12, 'B'))
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('loads and shows the latest full aggregates for both perspectives', async () => {
    render(<DatingPriorityStatsPage />)

    await waitFor(() => expect(screen.getByText('优先因素-A')).toBeTruthy())
    expect(screen.getByText('优先因素-B')).toBeTruthy()
    expect(screen.getByText('否决条件-A')).toBeTruthy()
    expect(screen.getByText('否决条件-B')).toBeTruthy()
    expect(screen.getByText('20', { selector: '.dp-summary-hero > strong' })).toBeTruthy()
    expect(fetchStatsMock.mock.calls.map(([key]) => key)).toEqual([
      'female_to_male',
      'male_to_female',
    ])
  })

  it('refreshes both perspectives when requested', async () => {
    fetchStatsMock
      .mockResolvedValueOnce(stats(9, 'new-A'))
      .mockResolvedValueOnce(stats(13, 'new-B'))

    render(<DatingPriorityStatsPage />)
    await waitFor(() => expect(screen.getByText('优先因素-A')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: /立即刷新|Refresh now/ }))

    await waitFor(() => expect(screen.getByText('优先因素-new-A')).toBeTruthy())
    expect(screen.getByText('优先因素-new-B')).toBeTruthy()
    expect(fetchStatsMock).toHaveBeenCalledTimes(4)
  })

  it('offers a retry when loading fails', async () => {
    fetchStatsMock.mockReset()
    fetchStatsMock.mockRejectedValueOnce(new Error('暂时无法连接'))
    render(<DatingPriorityStatsPage />)

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('暂时无法连接'))
    expect(screen.getByRole('button', { name: '重试' })).toBeTruthy()
  })
})
