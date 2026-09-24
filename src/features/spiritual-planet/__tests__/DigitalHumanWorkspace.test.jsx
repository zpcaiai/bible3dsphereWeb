import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DigitalHumanWorkspace from '../digital-human/DigitalHumanWorkspace'
import {
  getDigitalHumanCatalog,
  getDigitalHumanRuntime,
} from '../digital-human/api'

vi.mock('../digital-human/api', () => ({
  createDigitalHumanLiveKitToken: vi.fn(),
  createDigitalHumanTurn: vi.fn(),
  getDigitalHumanCatalog: vi.fn(),
  getDigitalHumanRuntime: vi.fn(),
  recordDigitalHumanProviderTelemetry: vi.fn(() => Promise.resolve()),
  resolveDigitalHumanIdentity: vi.fn(),
}))

const DAVID = {
  id: 'david',
  canonicalName: '大卫',
  englishName: 'David',
  catalogTier: 'deep-alpha',
  avatar: {
    modelUrl: null,
    portraitUrl: 'https://cdn.holiness.uk/characters/david/v1/portrait.webp',
    version: '1',
    framing: 'bust',
    reviewState: 'APPROVED',
  },
  voice: { provider: 'azure', voiceId: null, language: 'zh-CN', reviewState: 'THEOLOGY_REVIEW' },
  recommendedQuestions: ['你为什么没有杀扫罗？'],
  disclosure: '教育性艺术重建，不代表真实历史肖像或原声。',
  runtimeReady: false,
}

describe('DigitalHumanWorkspace embedded character mode', () => {
  beforeEach(() => {
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      constructor(text) { this.text = text }
    })
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      getVoices: vi.fn(() => [{ lang: 'zh-CN', name: 'Default Chinese' }]),
      speak: vi.fn((utterance) => utterance.onstart?.()),
    })
    getDigitalHumanCatalog.mockResolvedValue({
      characters: [DAVID], characterCount: 100, truthCaseCount: 532, contentVersion: '1.3.0',
    })
    getDigitalHumanRuntime.mockResolvedValue({
      liveKitEnabled: false,
      liveSpeakEnabled: false,
      contentReviewState: 'THEOLOGY_REVIEW',
      retrievalMode: 'LEXICAL_GRAPH_DEGRADED',
      operationsDashboardEnabled: true,
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('binds the mirror experience to David and shows an approved portrait fallback', async () => {
    render(<DigitalHumanWorkspace initialCharacterId="david" lockCharacter showOperations={false} variant="embedded" />)

    await waitFor(() => expect(screen.getByRole('region', { name: '大卫数字人' })).toBeTruthy())
    expect(screen.getByRole('img', { name: '大卫数字人艺术重建肖像' }).getAttribute('src')).toContain('/david/')
    expect(screen.getByText(/GLB、Voice 或内容尚未完成人工审批/)).toBeTruthy()
    expect(screen.queryByRole('textbox', { name: '搜索圣经人物' })).toBeNull()
    expect(document.body.textContent).not.toContain('运行监控')
  })

  it('uses the shared preview portrait and speaks only the fixed voice disclosure', async () => {
    getDigitalHumanCatalog.mockResolvedValue({
      characters: [{ ...DAVID, avatar: { ...DAVID.avatar, portraitUrl: null, reviewState: 'THEOLOGY_REVIEW' } }],
      characterCount: 100,
      truthCaseCount: 532,
      contentVersion: '1.3.0',
    })

    render(<DigitalHumanWorkspace initialCharacterId="david" lockCharacter showOperations={false} variant="embedded" />)

    const portrait = await screen.findByRole('img', { name: '大卫共用3D艺术占位肖像' })
    expect(portrait.getAttribute('src')).toBe('/assets/digital-human/shared-preview-portrait-3d-v1.jpg')
    expect(screen.getByText('共享3D艺术占位肖像 · 非历史真实肖像')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '试听默认预览音色' }))
    expect(globalThis.speechSynthesis.speak).toHaveBeenCalledTimes(1)
    const utterance = globalThis.speechSynthesis.speak.mock.calls[0][0]
    expect(utterance.text).toBe('这是默认预览音色，只用于确认声音播放功能，不代表任何圣经人物的真实声音。')
    expect(utterance.text).not.toContain('大卫')
  })
})
