import React from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

// Mock the API layer so we control exactly what the result payload looks like.
vi.mock('../expansion/expansionApi', () => ({
  getMeta: () => Promise.resolve({}),
  runAction: () => Promise.resolve({
    summary: '测试小结：你带来的处境已被听见。',
    scripture: { ref: 'Psalm 34:18', text: '耶和华靠近伤心的人，拯救灵性痛悔的人。' },
    practice: '今天走一小步。',
    prayer: '主啊，帮助我。阿们。',
  }),
  getBooks: () => Promise.resolve({ books: [] }),
  getHymns: () => Promise.resolve({ hymns: [] }),
}))

import ExpansionHub from '../expansion/ExpansionHub'

describe('ExpansionHub result render (regression: no string-ref crash)', () => {
  afterEach(() => cleanup())

  it('renders a result containing a scripture object without crashing', async () => {
    const errors = []
    const origErr = console.error
    console.error = (...a) => { errors.push(a.join(' ')); origErr(...a) }

    // holiness = text/analyze feature
    render(<ExpansionHub initialFeatureKey="holiness" onClose={() => {}} />)

    // click the primary submit ("开始" / "Begin")
    await waitFor(() => screen.getByText(/开始|Begin|Start/))
    await act(async () => {
      fireEvent.click(screen.getByText(/开始|Begin|Start/))
      await Promise.resolve()
    })

    // The result summary should appear if render did NOT crash.
    // (Appears more than once: once in the rendered field, once in the raw-JSON <details>.)
    await waitFor(() => expect(screen.getAllByText(/测试小结/).length).toBeGreaterThan(0), { timeout: 3000 })

    console.error = origErr
    const refWarnings = errors.filter((e) => /ref|forwardRef|string ref/i.test(e))
    // Surface any ref-related React warnings/errors for diagnosis.
    if (refWarnings.length) console.log('REF-WARNINGS>>>', JSON.stringify(refWarnings, null, 2))
    expect(refWarnings, 'no ref-related warnings expected').toEqual([])
  })
})
