import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

if (typeof window !== 'undefined' && typeof window.URL.createObjectURL !== 'function') {
  window.URL.createObjectURL = () => 'blob:maplibre-worker'
}

describe('Slice 2: JerusalemSandbox Multi-Era 3D Temple Structures', () => {
  it('wires Tabernacle, Solomon, Zerubbabel, and Herod temple structures and displays part details', async () => {
    const { default: JerusalemSandbox, TEMPLE_VARIANTS } = await import('../JerusalemSandbox')

    expect(TEMPLE_VARIANTS.map((v) => v.id)).toEqual(['tabernacle', 'solomon', 'zerubbabel', 'herod'])
    for (const v of TEMPLE_VARIANTS) {
      expect(v.geojson.features.length).toBeGreaterThan(5)
      expect(Object.keys(v.parts).length).toBeGreaterThan(5)
      expect(v.labels.length).toBeGreaterThan(3)
    }

    render(<JerusalemSandbox onBack={() => {}} />)

    const selector = screen.getByTestId('jeru-temple-selector')
    expect(selector).toBeTruthy()

    // Switch to Tabernacle (摩西会幕) and inspect laver (洗濯盆)
    fireEvent.click(screen.getByTestId('jeru-temple-variant-tabernacle'))
    expect(screen.getByText(/摩西会幕（出25–27/)).toBeTruthy()
    fireEvent.click(screen.getByTestId('jeru-temple-part-laver'))
    expect(screen.getByText(/出30:17-21/)).toBeTruthy()

    // Switch to Zerubbabel (所罗巴伯圣殿) and inspect foundationstone (至圣所（空）)
    fireEvent.click(screen.getByTestId('jeru-temple-variant-zerubbabel'))
    expect(screen.getByText(/所罗巴伯第二圣殿（拉3–6/)).toBeTruthy()
    fireEvent.click(screen.getByTestId('jeru-temple-part-foundationstone'))
    expect(screen.getByText(/该2:3；亚4:7-10/)).toBeTruthy()

    // Switch to Herod (希律圣殿) and inspect soreg (隔墙 Soreg)
    fireEvent.click(screen.getByTestId('jeru-temple-variant-herod'))
    expect(screen.getByText(/希律第二圣殿（约2:20/)).toBeTruthy()
    fireEvent.click(screen.getByTestId('jeru-temple-part-soreg'))
    expect(screen.getByText(/弗2:14/)).toBeTruthy()
  })
})
