import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

if (typeof window !== 'undefined' && typeof window.URL.createObjectURL !== 'function') {
  window.URL.createObjectURL = () => 'blob:maplibre-worker'
}

describe('Slice 1: BibleAtlasPage GraphPanel Integration', () => {
  it('exposes the 关系图谱 button, switches to GraphPanel, renders graph nodes/neighbors, and returns to map view', async () => {
    const { default: BibleAtlasPage } = await import('../features/bible-map/BibleAtlasPage')
    render(<BibleAtlasPage />)

    const graphBtn = screen.getByTestId('bible-atlas-graph-btn')
    expect(graphBtn).toBeTruthy()
    expect(graphBtn.textContent).toContain('关系图谱')

    // Click to enter GraphPanel view
    fireEvent.click(graphBtn)

    // Verify GraphPanel SVG and legend are rendered
    const svg = await screen.findByRole('img', { name: /圣经关系图谱/ })
    expect(svg).toBeTruthy()

    // Wait for graph nodes to load via fetchGraph (local fallback or API)
    await waitFor(() => {
      const circles = svg.querySelectorAll('circle')
      expect(circles.length).toBeGreaterThan(3)
    })

    // Click the first node group in the SVG to inspect its neighbors
    const firstCircle = svg.querySelector('circle')
    expect(firstCircle?.parentElement).toBeTruthy()
    fireEvent.click(firstCircle!.parentElement!)

    await waitFor(() => {
      expect(screen.getByText(/内置图谱|后端图谱服务/)).toBeTruthy()
    })

    // Click BackButton to return to map view
    const backBtn = screen.getByRole('button', { name: /返回/ })
    fireEvent.click(backBtn)

    expect(screen.getByTestId('bible-atlas-graph-btn')).toBeTruthy()
  })
})
