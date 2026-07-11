import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

vi.mock('../components/guardian/guardianApi', () => ({
  fetchGuardianInsights: vi.fn().mockResolvedValue({ patterns: [], idolSignals: [] }),
  fetchGuardianProfile: vi.fn().mockRejectedValue(new Error('offline')),
  fetchGuardianState: vi.fn().mockRejectedValue(new Error('offline')),
  sendGuardianMessage: vi.fn(),
}))

vi.mock('../components/guardian/GuardianSprite', () => ({ default: () => <span aria-hidden="true">dove</span> }))
vi.mock('../components/guardian/GuardianChatPanel', () => ({ default: () => <div>chat</div> }))
vi.mock('../components/guardian/EmotionCheckIn', () => ({ default: () => <div>emotion</div> }))
vi.mock('../components/guardian/SpiritualCheckIn', () => ({ default: () => <div>spiritual</div> }))
vi.mock('../components/guardian/PrayerJournal', () => ({ default: () => <div>prayer</div> }))
vi.mock('../components/guardian/DailyDevotionCard', () => ({ default: () => <div>devotion</div> }))
vi.mock('../components/guardian/GuardianGrowthBar', () => ({ default: () => <div>growth</div> }))
vi.mock('../components/guardian/GuardianMemoryPanel', () => ({ default: () => <div>memory</div> }))
vi.mock('../components/guardian/PatternInsightCard', () => ({ default: () => null }))
vi.mock('../components/guardian/IdolMonitorCard', () => ({ default: () => null }))
vi.mock('../autoTranslate.jsx', () => ({ AutoText: ({ children }) => <>{children}</> }))

import GuardianWidget from '../components/guardian/GuardianWidget'
import { useGuardianStore } from '../components/guardian/guardianStore'

describe('GuardianWidget', () => {
  beforeEach(() => {
    localStorage.clear()
    window.PointerEvent = window.MouseEvent
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 800 })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 600 })
    useGuardianStore.setState({
      widgetMode: 'expanded',
      spriteState: 'idle',
      profile: null,
      refresh: vi.fn(),
    })
  })

  it('renders the expanded window at the requested double width', () => {
    render(<GuardianWidget />)

    const panel = screen.getByTestId('guardian-panel')
    expect(panel.style.width).toBe('360px')
    expect(panel.style.height).toBe('270px')
  })

  it('moves freely and keeps the whole widget inside the viewport', () => {
    const { container } = render(<GuardianWidget />)
    const root = container.querySelector('.guardian-widget-root')
    root.getBoundingClientRect = () => ({
      left: 100, top: 100, right: 460, bottom: 448,
      width: 360, height: 348, x: 100, y: 100,
    })
    const handle = screen.getByTestId('guardian-drag-handle')

    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 120, clientY: 120 })
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 1000, clientY: 1000 })
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 1000, clientY: 1000 })

    expect(root.style.left).toBe('440px')
    expect(root.style.top).toBe('252px')
    expect(JSON.parse(localStorage.getItem('guardian-sprite-pos'))).toEqual({ x: 440, y: 252 })
  })
})
