import { cleanup, render, screen, waitFor } from '@testing-library/react'
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

  it('mounts the David digital human inside David mirror detail with a stable identity', async () => {
    render(<MirrorPage initialView="character" initialCharId={25} onBack={() => {}} />)

    await waitFor(() => expect(screen.getByRole('region', { name: '大卫的数字人镜鉴' })).toBeTruthy())
    const experience = await screen.findByTestId('embedded-digital-human')
    expect(experience.dataset.characterId).toBe('david')
    expect(experience.dataset.locked).toBe('true')
    expect(experience.dataset.operations).toBe('false')
    expect(experience.dataset.variant).toBe('embedded')
    expect(screen.getByText(/不代表真实历史肖像或原声/)).toBeTruthy()
  })
})
