import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { setRuntimeLang } from '../../../i18n/runtime'
import FormationTwinPage from '../FormationTwinPage'

describe('FormationTwinPage', () => {
  beforeEach(() => setRuntimeLang('zh'))

  afterEach(() => {
    cleanup()
    setRuntimeLang('zh')
  })

  it('renders an honest insufficient-data state without a spiritual score', () => {
    render(<FormationTwinPage user={{ id: 'u-1' }} onBack={vi.fn()} onOpen={vi.fn()} />)

    expect(screen.getByRole('heading', { name: '情感—属灵形成孪生' })).toBeTruthy()
    expect(screen.getByText('目前还没有足够且经过授权的数据形成生命状态镜像。')).toBeTruthy()
    expect(document.body.textContent).not.toContain('你的灵命分数')
  })

  it('shows evidence labels for existing summaries', () => {
    render(
      <FormationTwinPage
        user={{ id: 'u-1' }}
        dailySnapshot={{ last_emotion: '平静', has_devotion_today: true, pending_prayers: 1 }}
        emotionTrajectory={{ count: 5, dominant_emotion: '盼望' }}
        onBack={vi.fn()}
        onOpen={vi.fn()}
      />,
    )

    expect(screen.getByText('最近记录的情绪')).toBeTruthy()
    expect(screen.getByText('平静')).toBeTruthy()
    expect(screen.getAllByText('用户记录').length).toBeGreaterThan(0)
    expect(screen.getAllByText('可观察事实').length).toBeGreaterThan(0)
    expect(screen.getAllByText('系统摘要').length).toBeGreaterThan(0)
  })

  it('routes actions into existing modules', () => {
    const onOpen = vi.fn()
    render(<FormationTwinPage user={{ id: 'u-1' }} onBack={vi.fn()} onOpen={onOpen} />)

    fireEvent.click(screen.getByText('情绪状态签到'))
    fireEvent.click(screen.getByText('危机安全入口'))

    expect(onOpen).toHaveBeenNthCalledWith(1, 'checkin')
    expect(onOpen).toHaveBeenNthCalledWith(2, 'sos')
  })
})
