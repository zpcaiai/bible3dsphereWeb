import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { setRuntimeLang } from '../i18n/runtime'

// A controlled dependency stall, not a substitute for the real-browser suite.
// The catalogue is released to its actual module after the graph assertions.
const catalogue = vi.hoisted(() => {
  let release
  return { pending: new Promise(resolve => { release = resolve }), release: () => release() }
})
vi.mock('../mirrorData', async (original) => {
  await catalogue.pending
  return original()
})
vi.mock('../features/spiritual-planet/digital-human/DigitalHumanWorkspace', () => ({ default: () => <div>Embedded workspace</div> }))

afterEach(() => { cleanup(); vi.unstubAllGlobals(); sessionStorage.clear() })

it('starts the real graph component before the catalogue resolves and preserves card/list navigation', async () => {
  setRuntimeLang('zh')
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  const fetcher = vi.fn(async () => ({ ok: true, json: async () => ({ success: true, data: {
    nodes: [{ id: 'david', name: '大卫', chineseName: '大卫', type: 'character' }], edges: [],
  } }) }))
  vi.stubGlobal('fetch', fetcher)
  const { default: MirrorPage } = await import('../MirrorPage')
  render(<MirrorPage initialView="graph" initialGraphFocus="大卫" token="unit-token" />)
  try {
    await screen.findByRole('heading', { name: '关系图谱', exact: true })
    await waitFor(() => expect(document.querySelectorAll('svg circle')).toHaveLength(1))
    expect(fetcher).toHaveBeenCalledOnce()
    expect(new URL(fetcher.mock.calls[0][0], 'http://localhost').searchParams.get('focus')).toBe('大卫')
    expect(JSON.parse(sessionStorage.getItem('nav-mirror')).graphFocus).toBe('大卫')
  } finally {
    catalogue.release()
  }
  // Resolving metadata must not remount/refetch the graph or lose its focus.
  await vi.dynamicImportSettled()
  fireEvent.pointerDown(document.querySelector('svg circle').parentElement, { clientX: 10, clientY: 10 })
  fireEvent.pointerUp(document.querySelector('svg'), { clientX: 10, clientY: 10 })
  const card = await screen.findByRole('button', { name: '查看镜鉴卡片 →' })
  expect(fetcher).toHaveBeenCalledOnce()
  fireEvent.click(card)
  await screen.findByRole('region', { name: '大卫的数字人镜鉴' })
  expect(JSON.parse(sessionStorage.getItem('nav-mirror')).charId).toBe(25)
})
