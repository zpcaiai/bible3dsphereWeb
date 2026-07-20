import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('../auth', () => ({ getToken: vi.fn(() => 'token-a') }))
vi.mock('../api', () => ({
  fetchReadingStatus: vi.fn().mockResolvedValue({ completed_keys: [], completed_count: 0, streak: 0 }),
  enrollReadingPlan: vi.fn().mockResolvedValue({ ok: true }),
  completeReadingDay: vi.fn().mockResolvedValue({ ok: true }),
  uncompleteReadingDay: vi.fn().mockResolvedValue({ ok: true }),
}))

import ReadingPlanPage from '../ReadingPlanPage'
import { completeReadingDay, enrollReadingPlan, fetchReadingStatus } from '../api'
import { setRuntimeLang } from '../i18n/runtime'
import { todayMMDD } from '../readingPlans'

describe('ReadingPlanPage', () => {
  beforeEach(() => {
    setRuntimeLang('zh')
    window.localStorage.clear()
    vi.clearAllMocks()
    fetchReadingStatus.mockResolvedValue({ completed_keys: [], completed_count: 0, streak: 0 })
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ [todayMMDD()]: { f1: '创世记 1', f2: '马太福音 1', n1: '以斯拉记 1', ps: '使徒行传 1' } }),
    })
  })
  afterEach(() => cleanup())

  it('gives each plan a concrete rhythm and plan-specific practice', async () => {
    render(<ReadingPlanPage user={{ email: 'reader@example.com' }} />)

    expect(await screen.findByText(/早晨读家庭两处，晚上读个人两处/)).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: '诗篇 · 30 天' }))
    expect(await screen.findByText(/每天睡前或情绪最明显时读一篇/)).toBeTruthy()
    expect(screen.getByText('轻声读两遍：第一遍听诗人的情绪，第二遍圈出他怎样转向神。')).toBeTruthy()
  })

  it('requires concrete steps, insight, and action before syncing completion', async () => {
    render(<ReadingPlanPage user={{ email: 'reader@example.com' }} />)

    const finish = await screen.findByRole('button', { name: '完成步骤并写下亮光与行动' })
    expect(finish.disabled).toBe(true)

    const checks = screen.getAllByRole('checkbox')
    expect(checks).toHaveLength(8)
    checks.forEach((checkbox) => fireEvent.click(checkbox))
    fireEvent.change(screen.getByLabelText('今日亮光'), { target: { value: '神先说话并创造' } })
    fireEvent.change(screen.getByLabelText('今日行动'), { target: { value: '今晚八点关心一位正在搬家的朋友' } })

    const enabledFinish = screen.getByRole('button', { name: '完成并记录今日实践' })
    expect(enabledFinish.disabled).toBe(false)
    fireEvent.click(enabledFinish)

    await waitFor(() => expect(completeReadingDay).toHaveBeenCalledWith('mccheyne', todayMMDD(), 'token-a'))
    expect(enrollReadingPlan).toHaveBeenCalledWith('mccheyne', 'token-a')
    expect(await screen.findByText('✓ 今日实践已记录')).toBeTruthy()
    expect(window.localStorage.getItem('devotion-reading-practice-index:v1:reader%40example.com:mccheyne')).toContain(todayMMDD())
  })
})
