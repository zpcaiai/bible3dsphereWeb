import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import SoulTabs from '../components/SoulTabs'

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

  it('shows a top-level 模式库 tab in 心迹 navigation', () => {
    render(<SoulTabs activeTab="habits" onTabChange={vi.fn()} />)

    expect(screen.getByText('模式库')).toBeTruthy()
    expect(screen.getByText('灵修操练')).toBeTruthy()
  })

  it('switches to the 模式库 tab when clicked', () => {
    const onTabChange = vi.fn()
    render(<SoulTabs activeTab="habits" onTabChange={onTabChange} />)

    fireEvent.click(screen.getByText('模式库'))
    expect(onTabChange).toHaveBeenCalledWith('library')
  })

})
