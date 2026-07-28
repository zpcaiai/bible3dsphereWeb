import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  fetchReadingProgress: vi.fn(),
  markChapterRead: vi.fn(),
  fetchBibleStudy: vi.fn(),
  fetchScripture: vi.fn(),
}))

vi.mock('../api', () => api)
vi.mock('../useGlobalAudio.jsx', () => ({
  TTSFullBar: () => null,
  TTSButton: () => null,
}))

import BibleReadingPage from '../BibleReadingPage'


describe('BibleReadingPage McCheyne deep link', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    api.fetchReadingProgress.mockReset().mockResolvedValue({ items: [], by_book: {} })
    api.markChapterRead.mockReset()
    api.fetchScripture.mockReset().mockResolvedValue({
      ok: true,
      verses: [{ verse: 1, text: '耶和华晓谕约书亚。' }],
    })
    api.fetchBibleStudy.mockReset().mockResolvedValue({
      ok: true,
      study: { overview: '本章显明神信实地成就应许。' },
    })
  })

  it('opens the requested chapter and automatically loads its study', async () => {
    window.sessionStorage.setItem('bible-reading-open', JSON.stringify({
      book: '约书亚记',
      chapter: 17,
      autoStudy: true,
    }))

    render(<BibleReadingPage user={{ email: 'u@example.com' }} token="token-1" onBack={() => {}} />)

    await waitFor(() => expect(api.fetchScripture).toHaveBeenCalledWith('约书亚记17'))
    await waitFor(() => expect(api.fetchBibleStudy).toHaveBeenCalledWith(
      '约书亚记',
      17,
      [{ verse: 1, text: '耶和华晓谕约书亚。' }],
      'token-1',
    ))
    expect(window.sessionStorage.getItem('bible-reading-open')).toBeNull()
  })
})
