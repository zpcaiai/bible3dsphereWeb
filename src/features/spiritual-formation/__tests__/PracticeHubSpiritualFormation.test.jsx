import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import PracticeHubPage from '../../../PracticeHubPage'
import { STORAGE_KEYS } from '../lib/storage'

describe('PracticeHub spiritual formation entry', () => {
  beforeEach(() => {
    Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key))
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ items: [] }),
    }))
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('opens the Sin Pattern to New Creation module from 灵修操练', async () => {
    render(<PracticeHubPage user={{ id: 'u1', email: 'u1@example.com' }} onBack={vi.fn()} />)

    fireEvent.click(screen.getByText('罪到新造转化'))

    expect(screen.getByText('Sin Pattern to New Creation Transformation Engine')).toBeTruthy()
    expect(screen.getByText('罪模式库')).toBeTruthy()
    expect(screen.getByText('每日扫描')).toBeTruthy()
    expect(screen.getByText('恩典恢复')).toBeTruthy()
    await waitFor(() => expect(fetch.mock.calls.length).toBeGreaterThan(20))
  })

  it('saves a daily spiritual scan from the embedded module', async () => {
    render(<PracticeHubPage user={{ id: 'u1', email: 'u1@example.com' }} onBack={vi.fn()} />)

    fireEvent.click(screen.getByText('罪到新造转化'))
    fireEvent.click(screen.getByText('每日扫描'))
    fireEvent.change(screen.getByPlaceholderText('What did you do, avoid, say, click, hide, or pursue?'), {
      target: { value: 'I kept scrolling to avoid prayer and responsibility.' },
    })
    fireEvent.click(screen.getByText('social media'))
    fireEvent.click(screen.getByText('Save Daily Scan'))

    expect(screen.getByText('You have brought this into the light. Walk today in one concrete act of obedience, trusting the grace of Christ.')).toBeTruthy()
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.dailyExamens) || '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].userId).toBe('u1')
    expect(stored[0].behaviorDescription).toContain('scrolling')
    await waitFor(() => expect(fetch.mock.calls.length).toBeGreaterThan(20))
  })
})
