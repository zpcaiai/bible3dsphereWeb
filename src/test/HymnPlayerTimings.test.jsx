import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HymnPlayer, { buildKaraokeTimeline, computeKaraokeState } from '../HymnPlayer'

describe('Slice 4: HymnPlayer Melody-Synced Karaoke Timings', () => {
  it('computes non-uniform melody-synced syllable highlights from HYMN_TIMINGS and falls back for unknown hymns', () => {
    const amazingGrace = {
      id: 'amazing-grace',
      lyrics: ['奇异恩典 何等甘甜\n我罪已得赦免'],
    }
    const tl = buildKaraokeTimeline(amazingGrace)
    expect(tl.hasMelodyTiming).toBe(true)
    expect(tl.cycleEnd).toBeCloseTo(16.43, 2)

    // In amazing-grace, '异' starts at t=0.71 and is held until '恩' at t=2.14
    const atHeldNote = computeKaraokeState(amazingGrace, 1.5, 16.43, true)
    expect(atHeldNote.activeChar).toBe(1) // still on '异', whereas uniform 1.5/16.43*14=1.27
    const atNextSyllable = computeKaraokeState(amazingGrace, 2.2, 16.43, true)
    expect(atNextSyllable.activeChar).toBe(2) // advanced to '恩'

    // Fallback for custom hymn without HYMN_TIMINGS entry
    const customHymn = {
      id: 'custom-hymn',
      lyrics: ['哈利路亚赞美主'],
    }
    const fallbackState = computeKaraokeState(customHymn, 5, 10, true)
    expect(fallbackState.kData.hasMelodyTiming).toBe(false)
    expect(fallbackState.activeChar).toBe(3)
  })

  it('renders the melody timing badge and jumps karaoke highlight when clicking a lyric line', () => {
    render(<HymnPlayer />)

    const badge = screen.getByTestId('hymn-timing-badge')
    expect(badge.textContent).toContain('旋律逐字对齐')

    const line1 = screen.getByTestId('hymn-kline-1')
    fireEvent.click(line1)

    expect(line1.className).toContain('active')
    const activeCharSpan = line1.querySelector('.hymn-kchar.now')
    expect(activeCharSpan?.textContent).toBe('我')
  })
})
