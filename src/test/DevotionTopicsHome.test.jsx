import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import DevotionTopicsHome from '../components/DevotionTopicsHome'
import { needsSafetyFirst, recommendExpansionTopics } from '../components/devotionTopicRecommendations'
import { setRuntimeLang } from '../i18n/runtime'
import { DevotionTopicEntryCard } from '../PersonalDevotionPage'

describe('DevotionTopicsHome', () => {
  beforeEach(() => setRuntimeLang('zh'))
  afterEach(() => cleanup())

  it('uses visible recorded state to recommend bounded topic choices', () => {
    expect(recommendExpansionTopics({ last_emotion: '焦虑' }).map((topic) => topic.key)).toEqual(['contemplation', 'providence'])
    expect(recommendExpansionTopics({ last_emotion: '羞愧' }).map((topic) => topic.key)).toEqual(['tender', 'assurance'])
    expect(recommendExpansionTopics(null).map((topic) => topic.key)).toEqual(['knowgod', 'worddelight'])
    expect(needsSafetyFirst({ last_emotion: '我有自伤冲动' })).toBe(true)
    expect(needsSafetyFirst({ last_emotion: '焦虑' })).toBe(false)
  })

  it('opens a recommended topic and the complete topic library', () => {
    const onOpenFeature = vi.fn()
    const onOpenAll = vi.fn()
    render(<DevotionTopicsHome dailySnapshot={{ last_emotion: '焦虑' }} onOpenFeature={onOpenFeature} onOpenAll={onOpenAll} />)

    fireEvent.click(screen.getByRole('button', { name: /默观 · 在神爱里安息/ }))
    fireEvent.click(screen.getByRole('button', { name: /查看全部专题灵修/ }))

    expect(onOpenFeature).toHaveBeenCalledWith('contemplation')
    expect(onOpenAll).toHaveBeenCalledTimes(1)
  })

  it('shows both topic choices after selecting a current situation', () => {
    const onOpenFeature = vi.fn()
    render(<DevotionTopicsHome onOpenFeature={onOpenFeature} onOpenAll={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: '焦虑或失控' }))
    fireEvent.click(screen.getByRole('button', { name: /神的护理.*在失控感中学习信靠/ }))
    expect(onOpenFeature).toHaveBeenCalledWith('providence')
  })

  it('continues any feature selected from the complete library, not only recommended topics', () => {
    render(
      <DevotionTopicsHome
        lastFeature={{ key: 'holiness', emoji: '🪨', name: '圣洁之路', sub: '实践成圣' }}
        onOpenFeature={() => {}}
        onOpenAll={() => {}}
      />,
    )

    expect(screen.getByRole('button', { name: /圣洁之路.*实践成圣/ })).toBeTruthy()
  })

  it('integrates state-based recommendations directly into the Today content', () => {
    const onOpenTopic = vi.fn()
    const onOpenTopics = vi.fn()
    render(<DevotionTopicEntryCard dailySnapshot={{ last_emotion: '焦虑' }} onOpenTopic={onOpenTopic} onOpenTopics={onOpenTopics} />)

    fireEvent.click(screen.getByRole('button', { name: /默观 · 在神爱里安息/ }))
    fireEvent.click(screen.getByRole('button', { name: /查看全部专题与处境/ }))
    expect(onOpenTopic).toHaveBeenCalledWith('contemplation')
    expect(onOpenTopics).toHaveBeenCalledTimes(1)
  })

  it('places safety support before Today recommendations when the visible state requires it', () => {
    const onOpenSafety = vi.fn()
    render(<DevotionTopicEntryCard dailySnapshot={{ last_emotion: '我有自伤冲动' }} onOpenTopic={() => {}} onOpenTopics={() => {}} onOpenSafety={onOpenSafety} />)

    const safetyButton = screen.getByRole('button', { name: /先照顾安全，再继续灵修/ })
    expect(safetyButton.compareDocumentPosition(screen.getByRole('button', { name: /认识神.*从此刻需要进入对神的认识/ })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.click(safetyButton)
    expect(onOpenSafety).toHaveBeenCalledTimes(1)
  })

  it('places safety help before ordinary topics when a recorded signal requires it', () => {
    const onOpenSafety = vi.fn()
    render(<DevotionTopicsHome dailySnapshot={{ last_emotion: '我有自伤冲动' }} onOpenFeature={() => {}} onOpenAll={() => {}} onOpenSafety={onOpenSafety} />)

    const safetyButton = screen.getByRole('button', { name: /先照顾安全，再继续灵修/ })
    expect(safetyButton.compareDocumentPosition(screen.getByText('今天可以从这里开始')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.click(safetyButton)
    expect(onOpenSafety).toHaveBeenCalledTimes(1)
  })
})
