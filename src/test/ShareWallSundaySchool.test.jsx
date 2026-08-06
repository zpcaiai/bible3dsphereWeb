import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as api from '../api'
import ShareWallPage from '../ShareWallPage'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Sunday School product placement', () => {
  it('surfaces AI Formation at the top of the existing Sunday School tab', async () => {
    vi.spyOn(api, 'fetchSharedNotes').mockResolvedValue({ items: [], pages: 1, total: 0 })
    vi.spyOn(api, 'fetchSundaySchoolVideos').mockResolvedValue({ videos: [] })
    const onOpenAiFormation = vi.fn()

    render(
      <ShareWallPage
        user={{ email: 'learner@example.test' }}
        onBack={() => {}}
        onOpenAiFormation={onOpenAiFormation}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /主日学/ }))
    const heading = await screen.findByRole('heading', { name: 'AI时代心意更新与家庭门训' })
    const videosHeading = screen.getByRole('heading', { name: '主日学视频' })
    expect(heading.compareDocumentPosition(videosHeading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /查看审核与开放状态|打开课程模块/ }))
    expect(onOpenAiFormation).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(api.fetchSundaySchoolVideos).toHaveBeenCalledTimes(1))
  })
})
