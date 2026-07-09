import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ExpansionLauncher from '../expansion/ExpansionLauncher'

describe('ExpansionLauncher', () => {
  afterEach(() => {
    cleanup()
    try { delete window.__expansionOpen } catch { window.__expansionOpen = undefined }
  })

  it('renders a persistent entry button and registers the deep-link opener', () => {
    render(<ExpansionLauncher />)
    expect(screen.getByRole('button', { name: /扩充灵修 · 内容与神学扩充|Expansion · Content & Theology/ })).toBeTruthy()
    expect(typeof window.__expansionOpen).toBe('function')
  })

  it('opens the hub root from the persistent entry button', async () => {
    render(<ExpansionLauncher />)
    fireEvent.click(screen.getByRole('button', { name: /扩充灵修 · 内容与神学扩充|Expansion · Content & Theology/ }))
    await waitFor(() => expect(screen.getByText(/内容与神学扩充|Content & Theology Expansion/)).toBeTruthy())
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
