import React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ExpansionLauncher from '../expansion/ExpansionLauncher'

describe('ExpansionLauncher', () => {
  afterEach(() => {
    cleanup()
    try { delete window.__expansionOpen } catch { window.__expansionOpen = undefined }
  })

  it('keeps the floating entry visible after open, close, and rerender', () => {
    const view = render(<ExpansionLauncher />)
    const entryName = /扩充灵修 · 内容与神学扩充|Expansion · Content & Theology/

    expect(screen.getByRole('button', { name: entryName })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: entryName }))
    expect(screen.getByText(/内容与神学扩充|Content & Theology Expansion/)).toBeTruthy()

    fireEvent.click(screen.getByText(/‹ 返回|‹ Back/))
    expect(screen.getByRole('button', { name: entryName })).toBeTruthy()

    view.rerender(<ExpansionLauncher />)
    expect(screen.getByRole('button', { name: entryName })).toBeTruthy()
  })

  it('registers a stable feature deep-link opener', async () => {
    render(<ExpansionLauncher />)

    expect(typeof window.__expansionOpen).toBe('function')
    await act(async () => {
      window.__expansionOpen('spirits')
      await Promise.resolve()
    })

    await waitFor(() => expect(screen.getByText(/诸灵分辨|Discernment of Spirits/)).toBeTruthy())
    expect(screen.getByRole('button', { name: /扩充灵修 · 内容与神学扩充|Expansion · Content & Theology/ })).toBeTruthy()
  })
})
