import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import AppErrorBoundary from '../AppErrorBoundary'
import { purgeAndReload } from '../lazyWithRetry'

vi.mock('../lazyWithRetry', () => ({ purgeAndReload: vi.fn(async () => {}) }))
afterEach(() => { cleanup(); sessionStorage.clear(); vi.restoreAllMocks(); vi.clearAllMocks() })

it('keeps the automatic recovery cap across document mounts and allows explicit retry', async () => {
  sessionStorage.setItem('app-crash-reload', '1')
  const { rerender } = render(<AppErrorBoundary><div>Healthy shell</div></AppErrorBoundary>)
  expect(sessionStorage.getItem('app-crash-reload')).toBe('1')
  function BrokenChunk() { throw new TypeError('Failed to fetch dynamically imported module') }
  vi.spyOn(console, 'error').mockImplementation(() => {})
  rerender(<AppErrorBoundary><BrokenChunk /></AppErrorBoundary>)
  const retry = await screen.findByRole('button', { name: /清理缓存并刷新|Clear cache/i })
  expect(purgeAndReload).not.toHaveBeenCalled()
  fireEvent.click(retry)
  await waitFor(() => expect(purgeAndReload).toHaveBeenCalledOnce())
  expect(sessionStorage.getItem('app-crash-reload')).toBeNull()
})

it('requests one bounded recovery for the first chunk error', async () => {
  function BrokenChunk() { throw new TypeError('Failed to fetch dynamically imported module') }
  vi.spyOn(console, 'error').mockImplementation(() => {})
  render(<AppErrorBoundary><BrokenChunk /></AppErrorBoundary>)
  await waitFor(() => expect(purgeAndReload).toHaveBeenCalledOnce())
  expect(sessionStorage.getItem('app-crash-reload')).toBe('1')
})
