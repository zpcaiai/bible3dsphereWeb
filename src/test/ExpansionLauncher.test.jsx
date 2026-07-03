import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import ExpansionLauncher from '../expansion/ExpansionLauncher'

describe('ExpansionLauncher', () => {
  afterEach(() => {
    cleanup()
    try { delete window.__expansionOpen } catch { window.__expansionOpen = undefined }
  })

  it('renders no floating home-page button, but registers the deep-link opener', () => {
    render(<ExpansionLauncher />)
    // The floating 📖 entry has been removed from the home page.
    expect(screen.queryByRole('button', { name: /扩充灵修 · 内容与神学扩充|Expansion · Content & Theology/ })).toBeNull()
    // Planet-continent chips still drive the panel via this global opener.
    expect(typeof window.__expansionOpen).toBe('function')
  })

  it('opens the hub root (all modules) when called with an empty key', async () => {
    render(<ExpansionLauncher />)
    await act(async () => { window.__expansionOpen(''); await Promise.resolve() })
    await waitFor(() => expect(screen.getByText(/内容与神学扩充|Content & Theology Expansion/)).toBeTruthy())
  })

  it('deep-links to a specific feature via window.__expansionOpen(key)', async () => {
    render(<ExpansionLauncher />)
    await act(async () => { window.__expansionOpen('spirits'); await Promise.resolve() })
    await waitFor(() => expect(screen.getByText(/诸灵分辨|Discernment of Spirits/)).toBeTruthy())
  })
})
