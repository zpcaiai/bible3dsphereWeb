import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import FormationTwinEmotions from '../FormationTwinEmotions'
import * as api from '../formationTwinApi'

vi.mock('../formationTwinApi', () => ({
  createEmotionObservation: vi.fn(), createEmotionalEpisode: vi.fn(), deleteEmotionObservation: vi.fn(),
  deleteEmotionalEpisode: vi.fn(), getEmotionalState: vi.fn(), getEmotionSettings: vi.fn(),
  listEmotionCandidates: vi.fn(), listEmotionObservations: vi.fn(), listEmotionalEpisodes: vi.fn(),
  mergeEmotionalEpisodes: vi.fn(), rebuildEmotionalState: vi.fn(), resolveEmotionalEpisode: vi.fn(), reviewEmotionCandidate: vi.fn(), splitEmotionalEpisode: vi.fn(), updateEmotionSettings: vi.fn(),
}))

describe('FormationTwinEmotions', () => {
  beforeEach(() => {
    api.getEmotionalState.mockResolvedValue({ snapshot: {
      data_status: 'AVAILABLE', user_reported: { emotions: [{ id:'1', emotion_label:'PEACE', intensity:7 }], latest_energy_stress_sleep:{ stress_level:8 } },
      rule_derived: { source_kind:'RULE', stress_level_trend:{ direction:'INSUFFICIENT_DATA', data_points:1 } },
      possible_model_candidates: [], limitations:['系统不进行心理、医学或属灵诊断。'],
    } })
    api.listEmotionObservations.mockResolvedValue({ items: [] }); api.listEmotionCandidates.mockResolvedValue({ items: [] })
    api.listEmotionalEpisodes.mockResolvedValue({ items: [] }); api.rebuildEmotionalState.mockResolvedValue({ ok:true })
  })
  afterEach(()=>{cleanup();vi.clearAllMocks()})

  it('keeps user report, rule result, and model candidate in separate sections', async () => {
    render(<FormationTwinEmotions />)
    expect((await screen.findAllByText('你主动报告')).length).toBeGreaterThan(0)
    expect(screen.getByText('根据记录计算')).toBeTruthy()
    expect(screen.getByText('系统候选，尚待确认')).toBeTruthy()
    expect(document.body.textContent).not.toContain('情绪健康分')
  })

  it('shows insufficient data instead of an empty trend chart', async () => {
    api.getEmotionalState.mockResolvedValueOnce({ snapshot:{ data_status:'AVAILABLE', user_reported:{emotions:[]}, rule_derived:{}, possible_model_candidates:[], limitations:[] } })
      .mockResolvedValueOnce({ snapshot:{ data_status:'INSUFFICIENT_DATA' }, frequencies:[] })
    render(<FormationTwinEmotions />)
    fireEvent.click(screen.getByRole('tab', { name:'变化趋势' }))
    expect(await screen.findByText('数据不足，不显示可能误导的趋势图。')).toBeTruthy()
  })

  it('requires explicit rebuild action', async () => {
    render(<FormationTwinEmotions />)
    fireEvent.click(await screen.findByRole('button', { name:'按当前授权重建' }))
    await waitFor(()=>expect(api.rebuildEmotionalState).toHaveBeenCalledTimes(1))
  })
})
