import { Suspense } from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import lazyWithRetry, { purgeAndReload } from '../lazyWithRetry'

afterEach(() => { cleanup(); sessionStorage.clear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers() })

it.each(['keys', 'delete'])('reloads within one second even when CacheStorage.%s never settles', async (stage) => {
  vi.useFakeTimers()
  vi.stubGlobal('caches', {
    keys: stage === 'keys' ? () => new Promise(() => {}) : async () => ['offline-pack-v1', 'stale-app'],
    delete: vi.fn(() => new Promise(() => {})),
  })
  sessionStorage.setItem('nav-activePanel', 'mirror-graph')
  const reload = vi.fn()
  const recovery = purgeAndReload(reload)
  await vi.advanceTimersByTimeAsync(999)
  expect(reload).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(1)
  expect(reload).toHaveBeenCalledOnce()
  await recovery
  expect(sessionStorage.getItem('lazy-chunk-mirror-restore')).toBe('1')
  expect(caches.delete).not.toHaveBeenCalledWith('offline-pack-v1')
})

it('preserves the mirror entry before a failed chunk triggers recovery', async () => {
  sessionStorage.setItem('nav-activePanel', 'mirror-graph')
  sessionStorage.setItem('nav-mirror', JSON.stringify({ view: 'graph', graphFocus: '大卫' }))
  // jsdom reports navigation as unimplemented; the importer really rejects.
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const Panel = lazyWithRetry(() => Promise.reject(new TypeError('Failed to fetch dynamically imported module')))
  render(<Suspense fallback={<div>loading</div>}><Panel /></Suspense>)
  await waitFor(() => expect(sessionStorage.getItem('lazy-chunk-mirror-restore')).toBe('1'))
  expect(JSON.parse(sessionStorage.getItem('nav-mirror')).graphFocus).toBe('大卫')
  expect(sessionStorage.getItem('lazy-chunk-reload')).toBe('1')
})

it('renders a successful module and clears the retry marker', async () => {
  sessionStorage.setItem('lazy-chunk-reload', '1')
  const Panel = lazyWithRetry(() => Promise.resolve({ default: () => <div>graph ready</div> }))
  render(<Suspense fallback={null}><Panel /></Suspense>)
  expect(await screen.findByText('graph ready')).toBeTruthy()
  expect(sessionStorage.getItem('lazy-chunk-reload')).toBeNull()
})

it.each(['mirror-graph-chunk-reload', 'mirror-page-chunk-reload'])('keeps %s when another lazy module succeeds, then exposes local recovery', async (retryKey) => {
  sessionStorage.setItem(retryKey, '1')
  const Other = lazyWithRetry(() => Promise.resolve({ default: () => <div>other ready</div> }))
  render(<Suspense fallback={null}><Other /></Suspense>)
  await screen.findByText('other ready')
  expect(sessionStorage.getItem(retryKey)).toBe('1')
  const back = vi.fn()
  const Graph = lazyWithRetry(() => Promise.reject(new TypeError('failed chunk')), {
    retryKey,
    renderError: ({ onBack }) => <button onClick={onBack}>Return to cards</button>,
  })
  render(<Suspense fallback={null}><Graph onBack={back} /></Suspense>)
  const button = await screen.findByRole('button', { name: 'Return to cards' })
  button.click()
  expect(back).toHaveBeenCalledOnce()
})
