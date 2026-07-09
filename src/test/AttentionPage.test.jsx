import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import AttentionPage from '../features/attention/app/AttentionPage'

const okJson = (body) => ({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue(body),
})

describe('AttentionPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okJson({ exists: false, covenant: null })))
    window.history.replaceState({}, '', '/')
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('renders dashboard empty state and starts covenant form', async () => {
    const { getByText, getAllByText } = render(<AttentionPage user={{ email: 'a@example.com' }} token="token-a" onBack={() => {}} />)

    await waitFor(() => expect(getAllByText('今日尚未立约').length).toBeGreaterThan(0))
    fireEvent.click(getByText('开始今日立约'))

    expect(getByText('今日注意力立约')).toBeTruthy()
    expect(getByText('今天你最想把注意力献给什么？')).toBeTruthy()
  })

  it('fills suggestions into empty boundary fields', async () => {
    global.fetch.mockResolvedValueOnce(okJson({ exists: false, covenant: null }))
    global.fetch.mockResolvedValueOnce(okJson({
      suggestedDigitalBoundary: '上午不看 AI 资讯',
      suggestedTimeBoundary: '30 分钟',
      suggestedSpiritualBoundary: '先祷告 30 秒',
      suggestedScripture: { reference: '诗篇 46:10', text: '你们要休息，要知道我是神。' },
      suggestedPrayer: '主啊，帮助我归回。',
    }))
    const { getByText, getByDisplayValue } = render(<AttentionPage user={{ email: 'a@example.com' }} token="token-a" onBack={() => {}} initialSection="covenant" />)

    await waitFor(() => expect(getByText('生成今日守心建议')).toBeTruthy())
    fireEvent.click(getByText('生成今日守心建议'))

    await waitFor(() => expect(getByDisplayValue('上午不看 AI 资讯')).toBeTruthy())
  })

  it('renders diagnosis tools', async () => {
    const { getByText } = render(<AttentionPage user={{ email: 'a@example.com' }} token="token-a" onBack={() => {}} initialSection="diagnosis" />)

    await waitFor(() => expect(getByText('AI 守心洞察')).toBeTruthy())
    expect(getByText('生成今日洞察')).toBeTruthy()
    expect(getByText('现在被牵引了吗？')).toBeTruthy()
    expect(getByText('问守心 Agent')).toBeTruthy()
  })

  it('renders warfare map shell', async () => {
    global.fetch.mockResolvedValue(okJson({ map: { summary: {}, patternScores: [], activePlans: [], recentDiagnosisPatterns: [] } }))
    const { getByText } = render(<AttentionPage user={{ email: 'a@example.com' }} token="token-a" onBack={() => {}} initialSection="warfare" />)

    await waitFor(() => expect(getByText('注意力争战地图')).toBeTruthy())
    expect(getByText('最近 7 天')).toBeTruthy()
    expect(getByText('模式地图')).toBeTruthy()
  })
})
