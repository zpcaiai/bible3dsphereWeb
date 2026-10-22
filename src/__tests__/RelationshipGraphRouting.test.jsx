import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import RelationshipGraphView, { graphApiBase } from '../RelationshipGraphView'
import { setRuntimeLang } from '../i18n/runtime'

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
