import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('../api', () => ({ saveJournal: vi.fn().mockResolvedValue({ journal: { id: 'journal-1' } }) }))
vi.mock('../PersonalDevotionPage', () => ({
  default: ({ onOpenTopic, onOpenTopics }) => (
    <div>
      personal-devotion
      <button type="button" onClick={() => onOpenTopic('contemplation')}>today-recommended-topic</button>
      <button type="button" onClick={onOpenTopics}>today-all-topics</button>
    </div>
  ),
}))
vi.mock('../MorningDewPage', () => ({ default: () => <div>morning-dew</div> }))
vi.mock('../ReadingPlanPage', () => ({ default: () => <div>reading-plan</div> }))
vi.mock('../MemoryVersePage', () => ({ default: () => <div>memory-verse</div> }))
vi.mock('../SpiritualBooksPage', () => ({ default: () => <div>spiritual-books</div> }))
vi.mock('../DevotionJournalPage', () => ({ default: () => <div>devotion-journal</div> }))
vi.mock('../expansion/ExpansionHub', () => ({
  default: ({ initialFeatureKey, onSaveJournal }) => (
    <div>
      expansion-hub:{initialFeatureKey || 'root'}
      <button type="button" onClick={() => onSaveJournal?.({ feature: { key: 'holiness', name: '圣洁之路' }, input: '一步操练', result: { summary: '小结' } })}>save-expansion-result</button>
    </div>
  ),
}))

import DevotionTabContainer from '../components/DevotionTabContainer'
import { setRuntimeLang } from '../i18n/runtime'
import { saveJournal } from '../api'

describe('DevotionTabContainer', () => {
  beforeEach(() => {
    setRuntimeLang('zh')
    window.localStorage.clear()
    vi.clearAllMocks()
  })
  afterEach(() => cleanup())

  it('organizes existing devotion features into four stable sections', async () => {
    render(<DevotionTabContainer user={{ id: 'u-1' }} token="token" dailySnapshot={{ last_emotion: '焦虑' }} renderInlineLogin={() => null} />)

    const tabs = screen.getAllByRole('tab').filter((tab) => tab.parentElement?.getAttribute('aria-label') === '灵修主导航')
    expect(tabs.map((tab) => tab.textContent)).toEqual(['🌟今日', '📖读经', '🧭专题', '📔记录'])

    fireEvent.click(screen.getByRole('tab', { name: /专题/ }))
    expect(await screen.findByText('今天可以从这里开始')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /默观 · 在神爱里安息/ }))
    expect(await screen.findByText('expansion-hub:contemplation')).toBeTruthy()

    fireEvent.click(screen.getByRole('tab', { name: /记录/ }))
    expect(await screen.findByText('devotion-journal')).toBeTruthy()
  })

  it('opens a recommended topic from the formal entry inside Today', async () => {
    render(<DevotionTabContainer user={{ id: 'u-1' }} token="token" dailySnapshot={{ last_emotion: '焦虑' }} renderInlineLogin={() => null} />)

    fireEvent.click(await screen.findByRole('button', { name: 'today-recommended-topic' }))
    expect(await screen.findByText('expansion-hub:contemplation')).toBeTruthy()
  })

  it('refreshes the shared daily snapshot after the existing journal save succeeds', async () => {
    const onJournalSaved = vi.fn().mockResolvedValue(undefined)
    render(
      <DevotionTabContainer
        user={{ id: 'u-1' }}
        token="token"
        dailySnapshot={{ last_emotion: '焦虑' }}
        initialSection="topics"
        initialFeatureKey="holiness"
        onJournalSaved={onJournalSaved}
        renderInlineLogin={() => null}
      />,
    )

    fireEvent.click(await screen.findByRole('button', { name: 'save-expansion-result' }))
    await waitFor(() => expect(saveJournal).toHaveBeenCalledTimes(1))
    expect(onJournalSaved).toHaveBeenCalledWith({ journal: { id: 'journal-1' } })
  })
})
