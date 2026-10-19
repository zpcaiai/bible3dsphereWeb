import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import SeekersStandalonePage from '../components/SeekersStandalonePage'

describe('SeekersStandalonePage', () => {
  afterEach(cleanup)

  it('exposes a single main landmark and a semantic page heading', async () => {
    render(<SeekersStandalonePage />)

    expect(document.querySelectorAll('main')).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: '📚 慕道班' })).toBeTruthy()
    expect(screen.getByRole('link', { name: /进入情感星球/ }).getAttribute('href')).toBe('/')
  })
})
