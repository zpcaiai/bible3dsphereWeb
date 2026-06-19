import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import SoulTabs from '../../../components/SoulTabs'

describe('危机守护 tab in 心迹 navigation', () => {
  afterEach(() => cleanup())

  it('renders a top-level 危机守护 tab alongside 模式库', () => {
    render(<SoulTabs activeTab="library" onTabChange={vi.fn()} />)
    expect(screen.getByText('危机守护')).toBeTruthy()
    expect(screen.getByText('模式库')).toBeTruthy()
  })

  it('fires onTabChange with "crisis" when clicked', () => {
    const onTabChange = vi.fn()
    render(<SoulTabs activeTab="library" onTabChange={onTabChange} />)
    fireEvent.click(screen.getByText('危机守护'))
    expect(onTabChange).toHaveBeenCalledWith('crisis')
  })
})
