import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import CrisisCarePage from '../app/CrisisCarePage'

// Smoke test: exercises the whole crisis-care import graph (page + all flows)
// so any broken import path or JSX error surfaces here. Unauthenticated, so no
// backend calls fire on mount.
describe('CrisisCarePage smoke', () => {
  afterEach(() => cleanup())

  it('mounts and shows the disclaimer + entry', () => {
    render(<CrisisCarePage user={null} token={null} />)
    expect(screen.getByText(/危机守护不是诊断工具/)).toBeTruthy()
    expect(screen.getByText('此刻发生了什么？')).toBeTruthy()
  })

  it('switches to the resources tab and lists a verified hotline', () => {
    render(<CrisisCarePage user={null} token={null} />)
    fireEvent.click(screen.getByText('求助热线'))
    // region-agnostic: every phone resource renders a 拨打 (call) link
    expect(screen.getAllByText('拨打').length).toBeGreaterThan(0)
  })

  it('renders the stabilize tab (breathing + grounding)', () => {
    render(<CrisisCarePage user={null} token={null} />)
    fireEvent.click(screen.getByText('稳一稳'))
    expect(screen.getByText('5-4-3-2-1 着陆')).toBeTruthy()
  })

  it('recovery tab offers the 模式库 import action', () => {
    render(<CrisisCarePage user={null} token={null} />)
    fireEvent.click(screen.getByText('危机后'))
    expect(screen.getByText(/导入模式库/)).toBeTruthy()
  })

  it('collab tab shows the consent-based sharing console (unauthed prompt)', () => {
    render(<CrisisCarePage user={null} token={null} />)
    fireEvent.click(screen.getByText('协作'))
    expect(screen.getByText(/分享给你的牧者或咨询师/)).toBeTruthy()
  })
})
