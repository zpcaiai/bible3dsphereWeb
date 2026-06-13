import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import SoulTabs from '../components/SoulTabs'
import HabitsPage from '../HabitsPage'

describe('心迹与灵修操练罪模式库入口', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('does not show a top-level 模式库 tab in 心迹 navigation', () => {
    render(<SoulTabs activeTab="habits" onTabChange={vi.fn()} />)

    expect(screen.queryByText('模式库')).toBeNull()
    expect(screen.getByText('灵修操练')).toBeTruthy()
  })

  it('expands the sin pattern library inside 灵修操练', async () => {
    render(<HabitsPage user={{ id: 'u1' }} token="test-token" embedded onNeedLogin={vi.fn()} />)

    await screen.findByText('灵修操练')
    expect(screen.getByText('罪的模式库')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /查看/ }))

    expect(screen.getByText(/罪的模式资料库|Sin Pattern Library/)).toBeTruthy()
    expect(screen.getByPlaceholderText('搜索名称、核心谎言、症状或经文...')).toBeTruthy()
  })
})
