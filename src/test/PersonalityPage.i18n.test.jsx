import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import autoEn from '../i18n/auto-en'
import { mergeAutoEn } from '../i18n/translations'
import { setRuntimeLang } from '../i18n/runtime'

vi.mock('../api', () => ({
  fetchFormationProfile: vi.fn(async () => null),
  fetchFormationDimensions: vi.fn(async () => ({ dimensions: [] })),
  fetchReflectionAnswers: vi.fn(async () => ({ answers: {} })),
  saveReflectionAnswers: vi.fn(async () => ({})),
  createHabitsFromFormationPlan: vi.fn(async () => ({})),
}))

import PersonalityPage from '../PersonalityPage'

describe('PersonalityPage i18n', () => {
  beforeEach(() => {
    mergeAutoEn(autoEn)
    setRuntimeLang('en')
  })

  afterEach(() => {
    cleanup()
    setRuntimeLang('zh')
  })

  it('renders the maturity reflection flow in English', async () => {
    render(<PersonalityPage user={null} />)

    expect(await screen.findByText('Character Formation')).toBeTruthy()
    expect(screen.getByText('💭 Formation reflection survey')).toBeTruthy()
    expect(screen.getByText('Category 1: Relationship with God (core foundation)')).toBeTruthy()
    expect(screen.getAllByText('🌳Stable practice').length).toBeGreaterThan(0)
    expect(screen.getByText('Live it out steadily')).toBeTruthy()
    expect(screen.getByText('How is the time and quality of my daily/weekly communion with God (reading + prayer)? Is it just routine?')).toBeTruthy()
  })
})
