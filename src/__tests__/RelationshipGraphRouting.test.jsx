import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import RelationshipGraphView, { graphApiBase } from '../RelationshipGraphView'
import { setRuntimeLang } from '../i18n/runtime'
import oracle from '../../e2e/fixtures/digital-human-all100.json'
import { getArtisticPortrait } from '../features/spiritual-planet/digital-human/portraitCatalog'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('uses the public site proxy instead of a baked cross-origin runtime URL', () => {
  for (const host of ['holiness.uk', 'www.holiness.uk']) {
    expect(graphApiBase('https://stephenzao-biblesphere.hf.space/api', host)).toBe('/api')
  }
})

it('retains explicit API routing for other deployments and local development', () => {
  expect(graphApiBase('/api', 'localhost')).toBe('/api')
  expect(graphApiBase('https://example.com/api', 'other.example')).toBe('https://example.com/api')
})

it('shows API envelope failures and retries the request instead of presenting an empty graph', async () => {
  setRuntimeLang('zh')
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  const fetcher = vi.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ success: false, error: 'private backend exception', data: { nodes: [], edges: [] } }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, data: { nodes: [], edges: [] } }) })
  vi.stubGlobal('fetch', fetcher)
  render(<RelationshipGraphView token="unit-token" />)
  const alert = await screen.findByRole('alert')
  expect(alert.textContent).toContain('图谱数据暂不可用')
  expect(alert.textContent).not.toContain('private backend exception')
  fireEvent.click(screen.getByRole('button', { name: '重试' }))
  await screen.findByText('暂无数据')
  expect(fetcher).toHaveBeenCalledTimes(2)
  expect(fetcher.mock.calls[1][1].headers.Authorization).toBe('Bearer unit-token')
})

it('cancels superseded graph requests and the remaining request on unmount', () => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  const fetcher = vi.fn(() => new Promise(() => {}))
  vi.stubGlobal('fetch', fetcher)
  const { rerender, unmount } = render(<RelationshipGraphView token="first" />)
  const first = fetcher.mock.calls[0][1].signal
  expect(first.aborted).toBe(false)
  rerender(<RelationshipGraphView token="second" />)
  const second = fetcher.mock.calls[1][1].signal
  expect(first.aborted).toBe(true)
  expect(second.aborted).toBe(false)
  unmount()
  expect(second.aborted).toBe(true)
})

it('maps all100 numeric identities to different artistic images and retains graph circles on image failure and retry', async () => {
  setRuntimeLang('zh')
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  const nodes = oracle.characters.map((person) => ({ id: `char-${person.mirrorId}`, characterId: person.mirrorId, name: person.canonicalName, type: 'character', degree: 1 }))
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { nodes, edges: [] } }) }))
  const { container } = render(<RelationshipGraphView />)
  await waitFor(() => expect(container.querySelectorAll('svg image[data-portrait-character-id]').length).toBe(100))
  const images = [...container.querySelectorAll('svg image[data-portrait-character-id]')]
  expect(new Set(images.map((image) => image.getAttribute('href'))).size).toBe(100)
  for (const image of images) {
    expect(image.getAttribute('href')).toBe(getArtisticPortrait(image.dataset.portraitCharacterId).url)
    expect(image.dataset.reviewState).toBe('PREVIEW_ONLY')
  }
  expect(container.querySelectorAll('svg circle').length).toBe(100)
  fireEvent.error(images[0])
  expect(container.querySelectorAll('svg image[data-portrait-character-id]').length).toBe(99)
  expect(container.querySelectorAll('svg circle').length).toBe(100)
  expect(screen.getByRole('status', { name: '图谱艺术头像状态' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: '重试头像', exact: true }))
  expect(container.querySelectorAll('svg image[data-portrait-character-id]').length).toBe(100)
  expect(screen.queryByRole('status', { name: '图谱艺术头像状态' })).toBeNull()
})

it('opens the exact numeric card when a real graph name differs from the Mirror name', async () => {
  setRuntimeLang('zh')
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  // Public graph DTO captured2026-10-24: the old name-only resolver cannot
  // match this to Mirror's 雅各（西庇太之子）. This is a UI boundary fixture;
  // real graph/asset HTTP verification remains in the browser campaign.
  const node = { id: 'char-212', characterId: 212, name: '西庇太的雅各', chineseName: '西庇太的雅各', aliases: ['西庇太的雅各', 'James son of Zebedee'], type: 'character', degree: 1 }
  const target = { id: 212, name: '雅各（西庇太之子）', en: 'James son of Zebedee' }
  const onOpenChar = vi.fn()
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { nodes: [node], edges: [] } }) }))
  const { container } = render(<RelationshipGraphView characters={[{ id: 10, name: '雅各', en: 'Jacob' }, target]} onOpenChar={onOpenChar} />)
  await waitFor(() => expect(container.querySelectorAll('svg circle').length).toBe(1))
  fireEvent.pointerDown(container.querySelector('svg circle').parentElement, { clientX: 100, clientY: 100, pointerId: 1 })
  fireEvent.click(await screen.findByRole('button', { name: '西庇太的雅各', exact: true }))
  expect(onOpenChar).toHaveBeenCalledWith(target)
  const selectedPortrait = container.querySelector('img[data-portrait-context="graph-selected"]')
  expect(selectedPortrait.dataset.portraitCharacterId).toBe('james_zebedee')
  expect(selectedPortrait.getAttribute('src')).toBe(getArtisticPortrait('james_zebedee').url)
})

it('does not substitute a name match for an unknown authoritative graph characterId', async () => {
  setRuntimeLang('zh')
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  const node = { id: 'unknown', characterId: 999999, name: '雅各', type: 'character', degree: 1 }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: { nodes: [node], edges: [] } }) }))
  const { container } = render(<RelationshipGraphView characters={[{ id: 10, name: '雅各', en: 'Jacob' }]} onOpenChar={vi.fn()} />)
  await waitFor(() => expect(container.querySelectorAll('svg circle').length).toBe(1))
  fireEvent.pointerDown(container.querySelector('svg circle').parentElement, { clientX: 100, clientY: 100, pointerId: 1 })
  expect(screen.queryByRole('button', { name: '雅各', exact: true })).toBeNull()
  expect(container.querySelector('svg image')).toBeNull()
})
