import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MirrorPage from '../MirrorPage'
import { setRuntimeLang } from '../i18n/runtime'

setRuntimeLang('zh')

vi.mock('../features/spiritual-planet/digital-human/DigitalHumanWorkspace', () => ({
  default: ({ initialCharacterId, lockCharacter, showOperations, variant }) => (
    <div data-testid="embedded-digital-human" data-character-id={initialCharacterId} data-locked={String(lockCharacter)} data-operations={String(showOperations)} data-variant={variant} />
  ),
}))

describe('MirrorPage digital-human integration', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it.each([
    [25, '大卫', 'david'],
    [1, '亚当', 'adam'],
    [796, '腓利（传福音者）', 'philip_evangelist'],
  ])('mounts mirror card %s (%s) with stable digital-human identity %s', async (mirrorId, canonicalName, characterId) => {
    render(<MirrorPage initialView="character" initialCharId={mirrorId} onBack={() => {}} />)

    await waitFor(
      () => expect(screen.getByRole('region', { name: `${canonicalName}的数字人镜鉴` })).toBeTruthy(),
      { timeout: 15_000 },
    )
    const experience = await screen.findByTestId('embedded-digital-human')
    expect(experience.dataset.characterId).toBe(characterId)
    expect(experience.dataset.locked).toBe('true')
    expect(experience.dataset.operations).toBe('false')
    expect(experience.dataset.variant).toBe('embedded')
    expect(screen.getByText(/不代表真实历史肖像或原声/)).toBeTruthy()
  })

  it('shows digital-human availability and review state on a non-David Mirror card', async () => {
    render(<MirrorPage initialView="list" onBack={() => {}} />)

    const search = await screen.findByPlaceholderText('搜索人物')
    fireEvent.change(search, { target: { value: '腓利（传福音者）' } })

    expect(await screen.findByTestId('digital-human-badge-philip_evangelist')).toBeTruthy()
    expect(screen.getByTestId('content-review-796')).toBeTruthy()
  })
})
