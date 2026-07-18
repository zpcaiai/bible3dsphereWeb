import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import { setRuntimeLang } from '../i18n/runtime'

vi.mock('../autoTranslate', () => ({
  useAutoTranslate: () => (value) => value,
}))

import ShareCardModal from '../components/ShareCardModal'

describe('ShareCardModal EN canvas guard', () => {
  let context

  beforeEach(() => {
    setRuntimeLang('en')
    context = {
      createLinearGradient: () => ({ addColorStop: vi.fn() }),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      measureText: (value) => ({ width: String(value).length * 20 }),
      fillText: vi.fn(),
      set fillStyle(_) {},
      set strokeStyle(_) {},
      set lineWidth(_) {},
      set font(_) {},
      set textAlign(_) {},
      set textBaseline(_) {},
    }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    setRuntimeLang('zh')
  })

  it('never paints unresolved Chinese content into an EN share card', async () => {
    render(<ShareCardModal text="你要保守你心" reference="箴言 4:23" onClose={() => {}} />)

    await waitFor(() => expect(context.fillText).toHaveBeenCalled())
    const painted = context.fillText.mock.calls.map(([value]) => String(value))
    expect(painted).toContain('Translation pending…')
    expect(painted).toContain('—— Scripture reference')
    expect(painted.some((value) => /[一-鿿]/.test(value))).toBe(false)
  })
})
