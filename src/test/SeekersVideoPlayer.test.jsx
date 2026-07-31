import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import SeekersVideoPlayer from '../components/SeekersVideoPlayer'
import autoEn from '../i18n/auto-en'
import { setRuntimeLang } from '../i18n/runtime'
import { mergeAutoEn } from '../i18n/translations'

const course = {
  title: '《认识圣经》',
  filename: '《认识圣经》.mp4',
  url: 'https://cdn.holiness.uk/seekers-class/《认识圣经》.mp4',
}

describe('SeekersVideoPlayer', () => {
  beforeEach(() => {
    mergeAutoEn(autoEn)
    setRuntimeLang('zh')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    setRuntimeLang('zh')
    cleanup()
  })

  it('normalizes Chinese filenames and adds the Safari metadata fragment', () => {
    const { container } = render(<SeekersVideoPlayer course={course} />)
    const url = container.querySelector('source').getAttribute('src')
    expect(url).toContain('%E3%80%8A%E8%AE%A4%E8%AF%86%E5%9C%A3%E7%BB%8F%E3%80%8B.mp4')
    expect(url.endsWith('#t=0.001')).toBe(true)
  })

  it('shows honest loading progress while the large MP4 metadata is fetched', () => {
    vi.useFakeTimers()
    render(<SeekersVideoPlayer course={course} />)

    const video = screen.getByLabelText('播放 《认识圣经》')
    expect(video.getAttribute('preload')).toBe('auto')
    expect(screen.getByRole('status').textContent).toContain('15–20 秒')
    expect(screen.getByRole('link').getAttribute('href')).toContain('#t=0.001')

    act(() => vi.advanceTimersByTime(8000))
    expect(screen.getByRole('status').textContent).toContain('正在继续加载')

    fireEvent.loadedMetadata(video)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('offers retry and a direct-link fallback when the browser rejects the media', async () => {
    const load = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    render(<SeekersVideoPlayer course={course} />)

    const video = screen.getByLabelText('播放 《认识圣经》')
    Object.defineProperty(video, 'error', { configurable: true, value: { code: 4 } })
    fireEvent.error(video)

    expect(screen.getByRole('alert').textContent).toBe('浏览器不支持此视频格式')
    fireEvent.click(screen.getByRole('button', { name: '重新加载并播放' }))
    expect(load).toHaveBeenCalledOnce()
    expect(play).toHaveBeenCalledOnce()
  })

  it('renders all player recovery controls in English in EN mode', () => {
    setRuntimeLang('en')
    render(<SeekersVideoPlayer course={{ ...course, title: 'Knowing the Bible' }} />)

    expect(screen.getByLabelText('Play Knowing the Bible')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe('Loading video; first play may take 15–20 seconds…')
    expect(screen.getByRole('link').textContent).toContain('Open video in new window')
  })
})
