import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import FormationTwinWorkspace from '../FormationTwinWorkspace'
import * as api from '../formationTwinApi'

vi.mock('../formationTwinApi', () => ({
  addFormationChainEdge: vi.fn(), addFormationChainNode: vi.fn(),
  createFormationCheckin: vi.fn(),
  createFormationJournal: vi.fn(),
  confirmFormationVoice: vi.fn(),
  deleteFormationEvent: vi.fn(),
  deleteFormationVoice: vi.fn(),
  eraseFormationTwinData: vi.fn(),
  exportFormationTwinData: vi.fn(),
  listFormationSources: vi.fn(),
  listFormationTimeline: vi.fn(),
  setFormationEventExcluded: vi.fn(),
  setFormationSourcePaused: vi.fn(),
  updateFormationTranscript: vi.fn(),
  uploadFormationVoice: vi.fn(),
  createEmotionObservation: vi.fn(),
  createEmotionalEpisode: vi.fn(),
  deleteEmotionObservation: vi.fn(),
  deleteEmotionalEpisode: vi.fn(),
  getEmotionalState: vi.fn(),
  getEmotionSettings: vi.fn(),
  listEmotionCandidates: vi.fn(),
  listEmotionObservations: vi.fn(),
  listEmotionalEpisodes: vi.fn(),
  mergeEmotionalEpisodes: vi.fn(),
  rebuildEmotionalState: vi.fn(),
  resolveEmotionalEpisode: vi.fn(),
  reviewEmotionCandidate: vi.fn(),
  splitEmotionalEpisode: vi.fn(),
  updateEmotionSettings: vi.fn(),
  bulkDismissFormationReviews: vi.fn(), createFormationChain: vi.fn(), createFormationNode: vi.fn(),
  deleteFormationChain: vi.fn(), deleteFormationNode: vi.fn(), duplicateFormationChain: vi.fn(),
  getFormationContext: vi.fn(), getFormationDataQuality: vi.fn(), getFormationGraphStatus: vi.fn(),
  getFormationSettings: vi.fn(), getFormationState: vi.fn(), listFormationChains: vi.fn(),
  listFormationNodes: vi.fn(), listFormationReviewQueue: vi.fn(), rebuildFormationState: vi.fn(),
  removeFormationChainEdge: vi.fn(), removeFormationChainNode: vi.fn(),
  reviewFormationNode: vi.fn(), setFormationChainStatus: vi.fn(), syncFormationChainGraph: vi.fn(),
  updateFormationChain: vi.fn(), updateFormationSettings: vi.fn(),
}))

describe('FormationTwinWorkspace', () => {
  beforeEach(() => {
    localStorage.clear()
    api.createFormationCheckin.mockResolvedValue({ ok: true, status: 'ACCEPTED' })
    api.listFormationTimeline.mockResolvedValue({ ok: true, items: [] })
    api.listFormationSources.mockResolvedValue({ ok: true, items: [] })
    api.getEmotionalState.mockResolvedValue({ snapshot: { data_status: 'INSUFFICIENT_DATA', limitations: [] } })
    api.getFormationState.mockResolvedValue({ snapshot: { data_status: 'INSUFFICIENT_DATA', limitations: [] } })
    api.getFormationDataQuality.mockResolvedValue({ quality_passed: true })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('submits only explicit user-selected check-in facts with store-only default', async () => {
    render(<FormationTwinWorkspace user={{ id: 'u-1' }} />)

    fireEvent.click(screen.getByRole('button', { name: '平安' }))
    fireEvent.click(screen.getByRole('button', { name: '保存这次签到' }))

    await waitFor(() => expect(api.createFormationCheckin).toHaveBeenCalledTimes(1))
    expect(api.createFormationCheckin).toHaveBeenCalledWith(expect.objectContaining({
      primary_emotions: [{ emotion: '平安' }],
      processing_preference: 'STORE_ONLY',
    }))
    expect(screen.getByText('已安全保存；只生成可核对的事实事件。')).toBeTruthy()
  })

  it('keeps data sources out of the check-in flow until the user opens that tab', async () => {
    render(<FormationTwinWorkspace user={{ id: 'u-1' }} />)
    expect(api.listFormationSources).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /数据来源/ }))

    await waitFor(() => expect(api.listFormationSources).toHaveBeenCalledTimes(1))
  })

  it('does not expose entry forms to signed-out visitors', () => {
    render(<FormationTwinWorkspace user={null} />)
    expect(screen.getByText('登录后可以使用加密签到、日志、语音确认与事件控制。')).toBeTruthy()
    expect(screen.queryByRole('button', { name: '保存这次签到' })).toBeNull()
  })
})
