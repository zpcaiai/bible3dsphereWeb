import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MccheynePage from '../MccheynePage'


describe('MccheynePage study flow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-22T08:05:00+08:00'))
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      json: async () => ({
        '07-22': { f1: '约书亚记17', f2: '以赛亚书13', n1: '腓利门书1', ps: '诗篇54' },
      }),
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('opens the selected chapter and requests automatic Bible study', async () => {
    const onOpenPanel = vi.fn()
    render(<MccheynePage user="u1" onBack={() => {}} onOpenPanel={onOpenPanel} />)

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(screen.getByText('约书亚记17')).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: /查经|Study/ })[0])

    expect(JSON.parse(window.sessionStorage.getItem('bible-reading-open'))).toEqual({
      book: '约书亚记',
      chapter: 17,
      autoStudy: true,
    })
    expect(onOpenPanel).toHaveBeenCalledWith('bible-reading')
  })
})
