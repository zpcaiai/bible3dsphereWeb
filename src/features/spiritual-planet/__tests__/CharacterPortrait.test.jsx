import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import CharacterPortrait from '../digital-human/CharacterPortrait'
import { getArtisticPortrait } from '../digital-human/portraitCatalog'
import catalog from '../digital-human/portraitCatalog.json'
import oracle from '../../../../e2e/fixtures/digital-human-all100.json'

afterEach(cleanup)

describe('Character-specific artistic portrait assets', () => {
  it('binds exactly the independent 100-person inventory to distinct real WebP bytes and unapproved provenance', () => {
    expect(Object.keys(catalog.portraits).sort()).toEqual(oracle.characters.map((row) => row.characterId).sort())
    const seenURLs = new Set()
    const seenBytes = new Set()
    for (const person of oracle.characters) {
      const item = getArtisticPortrait(person.characterId)
      expect(item.url).toMatch(/^\/assets\/digital-human\/portraits-v1\/[a-z_]+\.webp$/)
      const file = path.join(process.cwd(), 'public', item.url.slice(1))
      const bytes = readFileSync(file)
      const provenance = JSON.parse(readFileSync(file.replace(/\.webp$/, '.json'), 'utf8'))
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(item.sha256)
      expect(bytes.subarray(0, 4).toString()).toBe('RIFF')
      expect(bytes.subarray(8, 12).toString()).toBe('WEBP')
      expect(bytes.length).toBeGreaterThan(1000)
      expect(bytes.length).toBeLessThan(80000)
      expect(provenance.characterId).toBe(person.characterId)
      expect(provenance.sha256).toBe(item.sha256)
      expect(provenance.originalSha256).toBe(item.originalSha256)
      expect(provenance.dimensions).toEqual({ width: 384, height: 384 })
      expect(provenance.reviewState).toBe('PREVIEW_ONLY')
      expect(provenance.historicalLikeness).toBe(false)
      expect(provenance.sharedAcrossCharacters).toBe(false)
      expect(seenURLs.has(item.url)).toBe(false)
      expect(seenBytes.has(item.sha256)).toBe(false)
      seenURLs.add(item.url)
      seenBytes.add(item.sha256)
    }
    expect(seenBytes.size).toBe(100)
  })

  it('renders all 100 identities with visible mobile artistic, nonhistorical and pending-review disclosure', () => {
    const { rerender } = render(<CharacterPortrait characterId="david" name="大卫" />)
    for (const person of oracle.characters) {
      rerender(<CharacterPortrait characterId={person.characterId} name={person.canonicalName} />)
      const image = screen.getByRole('img', { name: `${person.canonicalName}艺术重建肖像` })
      expect(image.getAttribute('src')).toBe(getArtisticPortrait(person.characterId).url)
      expect(image.dataset.portraitCharacterId).toBe(person.characterId)
      expect(image.dataset.reviewState).toBe('PREVIEW_ONLY')
      expect(screen.getByText('非历史肖像')).toBeTruthy()
      expect(screen.getByText('待人工审核')).toBeTruthy()
      expect(screen.queryByRole('button')).toBeNull()
    }
  })

  it.each(['__proto__', '../../david', 'joseph_unknown', null])('does not invent a shared face or URL for unknown identity %s', (characterId) => {
    render(<CharacterPortrait characterId={characterId} name="未知人物" compact={false} />)
    expect(screen.getByRole('img', { name: '未知人物头像暂不可用' }).tagName).toBe('DIV')
    expect(screen.getByText('暂无独立肖像')).toBeTruthy()
    expect(document.querySelector('img')).toBeNull()
  })

  it('retains honest failure, retries the actual portrait URL, and isolates a fresh character', () => {
    const { rerender } = render(<CharacterPortrait characterId="david" name="大卫" compact={false} />)
    fireEvent.error(screen.getByRole('img', { name: '大卫艺术重建肖像' }))
    expect(screen.getByText('头像加载失败')).toBeTruthy()
    expect(document.querySelector('img')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '重试头像' }))
    expect(screen.getByRole('img', { name: '大卫艺术重建肖像' }).getAttribute('src')).toBe(getArtisticPortrait('david').url)
    fireEvent.error(screen.getByRole('img', { name: '大卫艺术重建肖像' }))
    rerender(<CharacterPortrait characterId="joseph_of_nazareth" name="约瑟（拿撒勒）" compact={false} />)
    expect(screen.getByRole('img', { name: '约瑟（拿撒勒）艺术重建肖像' }).getAttribute('src')).toBe(getArtisticPortrait('joseph_of_nazareth').url)
    expect(screen.queryByText('头像加载失败')).toBeNull()
  })

  it('prefers an approved same-profile asset, falls back only to this person, and exposes a retry without an automatic loop', () => {
    const avatar = { portraitUrl: 'https://cdn.example.org/david-v2.webp', reviewState: 'APPROVED', version: '2' }
    render(<CharacterPortrait characterId="david" name="大卫" avatar={avatar} compact={false} />)
    fireEvent.error(screen.getByRole('img', { name: '大卫数字人艺术重建肖像' }))
    expect(screen.getByRole('img', { name: '大卫艺术重建肖像' }).getAttribute('src')).toBe(getArtisticPortrait('david').url)
    fireEvent.click(screen.getByRole('button', { name: '重试已审核肖像' }))
    expect(screen.getByRole('img', { name: '大卫数字人艺术重建肖像' }).getAttribute('src')).toBe(avatar.portraitUrl)
  })

  it('discards an old approved-source failure when the same identity and URL receive a new asset version', () => {
    const avatar = { portraitUrl: 'https://cdn.example.org/david.webp', reviewState: 'APPROVED', version: '1' }
    const { rerender } = render(<CharacterPortrait characterId="david" name="大卫" avatar={avatar} />)
    fireEvent.error(screen.getByRole('img', { name: '大卫数字人艺术重建肖像' }))
    expect(screen.getByRole('img', { name: '大卫艺术重建肖像' })).toBeTruthy()
    rerender(<CharacterPortrait characterId="david" name="大卫" avatar={{ ...avatar, version: '2' }} />)
    expect(screen.getByRole('img', { name: '大卫数字人艺术重建肖像' }).getAttribute('src')).toBe(avatar.portraitUrl)
    rerender(<CharacterPortrait characterId="david" name="大卫" avatar={{ ...avatar, version: '2', reviewState: 'THEOLOGY_REVIEW' }} />)
    expect(screen.getByRole('img', { name: '大卫艺术重建肖像' }).getAttribute('src')).toBe(getArtisticPortrait('david').url)
  })

  it('does not load an unapproved or unsafe external portrait', () => {
    const { rerender } = render(<CharacterPortrait characterId="david" name="大卫" avatar={{ portraitUrl: 'https://cdn.example.org/unapproved.webp', reviewState: 'THEOLOGY_REVIEW' }} />)
    expect(screen.getByRole('img', { name: '大卫艺术重建肖像' }).getAttribute('src')).toBe(getArtisticPortrait('david').url)
    rerender(<CharacterPortrait characterId="david" name="大卫" avatar={{ portraitUrl: 'javascript:alert(1)', reviewState: 'APPROVED' }} />)
    expect(screen.getByRole('img', { name: '大卫艺术重建肖像' }).getAttribute('src')).toBe(getArtisticPortrait('david').url)
  })
})
