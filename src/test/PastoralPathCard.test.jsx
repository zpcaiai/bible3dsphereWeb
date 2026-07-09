import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import PastoralPathCard, { PASTORAL_PATH_OPTIONS, PASTORAL_ROUTE_TARGETS } from '../components/PastoralPathCard'
import { setRuntimeLang } from '../i18n/runtime'

describe('PastoralPathCard', () => {
  beforeEach(() => {
    setRuntimeLang('zh')
  })

  afterEach(() => {
    cleanup()
    setRuntimeLang('zh')
  })

  it('keeps every pastoral state connected to app, planet, and formation targets', () => {
    expect(PASTORAL_PATH_OPTIONS).toHaveLength(5)

    for (const item of PASTORAL_PATH_OPTIONS) {
      expect(item.title).toBeTruthy()
      expect(item.verseRef).toBeTruthy()
      expect(item.verseText).toBeTruthy()
      expect(item.action).toBeTruthy()
      expect(item.review).toBeTruthy()
      expect(item.primaryLabel).toBeTruthy()
      expect(PASTORAL_ROUTE_TARGETS.app[item.route]).toBeTruthy()
      expect(PASTORAL_ROUTE_TARGETS.planet[item.route]).toBeTruthy()
      expect(PASTORAL_ROUTE_TARGETS.formation[item.route]).toBeTruthy()
    }

    expect(PASTORAL_ROUTE_TARGETS.app.crisis).toBe('sos')
    expect(PASTORAL_ROUTE_TARGETS.planet.crisis).toBe('checkup')
    expect(PASTORAL_ROUTE_TARGETS.formation.crisis).toBe('suffering-care')
  })

  it('routes the selected state primary action', () => {
    const onOpen = vi.fn()
    render(<PastoralPathCard onOpen={onOpen} />)

    fireEvent.click(screen.getByText('我很疲惫'))
    fireEvent.click(screen.getByText('写一个祷告'))

    expect(onOpen).toHaveBeenCalledWith('prayer')
  })

  it('offers a direct crisis route and guardian companion route', () => {
    const onOpen = vi.fn()
    render(<PastoralPathCard onOpen={onOpen} />)

    fireEvent.click(screen.getByText('我需要帮助'))
    fireEvent.click(screen.getByText('和守护者聊聊'))

    expect(onOpen).toHaveBeenNthCalledWith(1, 'crisis')
    expect(onOpen).toHaveBeenNthCalledWith(2, 'guardian')
  })
})
