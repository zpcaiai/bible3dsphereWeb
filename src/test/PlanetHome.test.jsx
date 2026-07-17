/**
 * Interaction tests for the PlanetHome navigation surface.
 */
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import PlanetHome from '../PlanetHome'
import { mergeAutoEn } from '../i18n/translations'
import { setRuntimeLang } from '../i18n/runtime'
import autoEn from '../i18n/auto-en'

const renderPlanetHome = () => {
  const onClose = vi.fn()
  const go = vi.fn()
  const view = render(<PlanetHome onClose={onClose} go={go} />)
  return { ...view, onClose, go }
}

describe('PlanetHome', () => {
  beforeEach(() => {
    mergeAutoEn(autoEn)
    setRuntimeLang('zh')
  })

  afterEach(() => {
    cleanup()
    setRuntimeLang('zh')
    try { delete window.__expansionOpen } catch { window.__expansionOpen = undefined }
    try { delete window.__pendingExpansionOpen } catch { window.__pendingExpansionOpen = undefined }
  })

  it('renders the full growth-map entry list', () => {
    renderPlanetHome()

    expect(document.body.textContent).toContain('属灵星球')
    expect(document.body.textContent).toContain('情感—属灵形成孪生')
    expect(document.body.textContent).toContain('属灵星球 · 统一门户')
    expect(document.body.textContent).toContain('今日牧养路径')
    expect(document.body.textContent).toContain('认识自己')
    expect(document.body.textContent).toContain('回到福音')
    expect(document.body.textContent).toContain('与神同行')
    expect(document.body.textContent).toContain('等候上帝')
    expect(document.body.textContent).toContain('天路客')
    expect(document.body.textContent).toContain('人格塑造')
  })

  it('localizes continent copy in EN mode', () => {
    setRuntimeLang('en')

    renderPlanetHome()

    expect(document.body.textContent).toContain('Know yourself')
    expect(document.body.textContent).toContain('Why am I weak, anxious, and repeatedly falling?')
    expect(document.body.textContent).toContain('Lloyd-Jones · seeing your true self')
    expect(document.body.textContent).not.toContain('我为什么软弱、焦虑、重复跌倒？')
  })

  it('routes primary action chips through go()', () => {
    const { getByText, go, onClose } = renderPlanetHome()

    fireEvent.click(getByText('偶像监测 ›'))
    fireEvent.click(getByText('福音诊断室 ›'))
    fireEvent.click(getByText('灵修操练 ›'))
    fireEvent.click(getByText('等候之路 ›'))
    fireEvent.click(getByText('进入天路历程 ›'))
    fireEvent.click(getByText('罪模式转化引擎 ›'))

    expect(go).toHaveBeenNthCalledWith(1, 'idolatry')
    expect(go).toHaveBeenNthCalledWith(2, 'gospel')
    expect(go).toHaveBeenNthCalledWith(3, 'hub')
    expect(go).toHaveBeenNthCalledWith(4, 'waiting')
    expect(go).toHaveBeenNthCalledWith(5, 'pilgrim')
    expect(go).toHaveBeenNthCalledWith(6, 'spiritual-formation')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('opens the formation twin as the planet life-state hub', () => {
    const { getByText, go } = renderPlanetHome()

    fireEvent.click(getByText('情感—属灵形成孪生'))

    expect(go).toHaveBeenCalledWith('formation-twin')
  })

  it('opens the unified Spiritual Planet portal', () => {
    const { getByText, go } = renderPlanetHome()

    fireEvent.click(getByText('属灵星球 · 统一门户'))

    expect(go).toHaveBeenCalledWith('spiritual-planet')
  })

  it('closes for close chips and the back button', () => {
    const { getByText, container, onClose, go } = renderPlanetHome()

    fireEvent.click(getByText('本周牧养小结 ›'))
    fireEvent.click(container.querySelector('.app-back-btn'))

    expect(onClose).toHaveBeenCalledTimes(2)
    expect(go).not.toHaveBeenCalled()
  })

  it('routes secondary chips to their feature overlays', () => {
    const { getByText, go } = renderPlanetHome()

    fireEvent.click(getByText('低潮体检 ›'))
    fireEvent.click(getByText('今日省察 ›'))

    expect(go).toHaveBeenNthCalledWith(1, 'checkup')
    expect(go).toHaveBeenNthCalledWith(2, 'examen')
  })

  it('routes pastoral path states to existing planet overlays', () => {
    const { getByText, go } = renderPlanetHome()

    fireEvent.click(getByText('开始默想经文'))
    fireEvent.click(getByText('我在等候'))
    fireEvent.click(getByText('走等候之路'))
    fireEvent.click(getByText('我不太安全'))
    fireEvent.click(getByText('打开安全帮助'))

    expect(go).toHaveBeenNthCalledWith(1, 'lectio')
    expect(go).toHaveBeenNthCalledWith(2, 'waiting')
    expect(go).toHaveBeenNthCalledWith(3, 'checkup')
  })

  it('routes expansion chips through the expansion launcher', () => {
    window.__expansionOpen = vi.fn()
    const { getByText, go } = renderPlanetHome()

    fireEvent.click(getByText('扩充灵修 · 全部 ›'))

    expect(window.__expansionOpen).toHaveBeenCalledWith('')
    expect(go).not.toHaveBeenCalled()
  })
})
