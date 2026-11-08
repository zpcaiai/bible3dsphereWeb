import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createModelLayer } from '../lib/gltfModelLayer'
import { translateText, translateTexts } from '../api'

if (typeof window !== 'undefined' && typeof window.URL.createObjectURL !== 'function') {
  window.URL.createObjectURL = () => 'blob:maplibre-worker'
}

describe('Slice 11 (DP[11]): TempleSandbox Three.js gltfModelLayer + translateText API export', () => {
  const origFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn(async (input) => {
      const url = typeof input === 'string' ? input : input.url
      if (url.includes('/translate-batch')) {
        return {
          ok: true,
          status: 200,
          headers: { get: () => 'application/json' },
          json: async () => ({ translations: ['Peace be with you'] }),
        }
      }
      return {
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        json: async () => ({ translation: 'Grace and peace' }),
      }
    }) as unknown as typeof fetch
  })

  afterEach(() => {
    globalThis.fetch = origFetch
  })

  it('builds a custom 3D layer via createModelLayer and toggles it in TempleSandbox', async () => {
    const maplibregl = (await import('maplibre-gl')).default
    const layer = createModelLayer({ glLib: maplibregl, id: 'temple-gltf-3d', origin: [35.2354, 31.7781], modelScale: 1 })
    expect(layer.id).toBe('temple-gltf-3d')
    expect(layer.type).toBe('custom')
    expect(layer.renderingMode).toBe('3d')

    const { TempleSandbox } = await import('../features/bible-map/components/TempleSandbox')
    render(<TempleSandbox onBack={() => {}} />)

    const badge = await screen.findByTestId('temple-gltf-active-badge')
    expect(badge.textContent).toContain('Three.js 3D 圣殿模型')

    const toggleBtn = screen.getByTestId('temple-gltf-toggle')
    fireEvent.click(toggleBtn)
    expect(screen.queryByTestId('temple-gltf-active-badge')).toBeNull()

    fireEvent.click(toggleBtn)
    expect(screen.getByTestId('temple-gltf-active-badge')).toBeTruthy()
  })

  it('exports translateText and translateTexts in src/api.js for Translatable.jsx and exportI18n.js', async () => {
    const single = await translateText('恩惠与平安', 'en')
    expect(single).toBe('Grace and peace')

    const batch = await translateTexts(['愿平安归与你们'], 'en')
    expect(batch).toEqual(['Peace be with you'])
  })
})
