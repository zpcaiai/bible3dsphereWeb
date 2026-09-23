import { afterEach, describe, expect, it, vi } from 'vitest'
import { MetaPersonLiveSpeakAdapter } from '../digital-human/MetaPersonLiveSpeakAdapter'

const character = {
  id: 'david',
  avatar: { modelUrl: 'https://cdn.holiness.uk/david.glb', reviewState: 'APPROVED' },
  voice: { voiceId: 'approved-david', reviewState: 'APPROVED' },
}

describe('MetaPersonLiveSpeakAdapter', () => {
  const adapters = []
  afterEach(() => adapters.splice(0).forEach((item) => item.dispose()))

  it('ignores messages from a non-allowlisted origin', async () => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const adapter = new MetaPersonLiveSpeakAdapter({ iframe, origin: 'https://metaperson.avatarsdk.com' })
    adapters.push(adapter)
    await adapter.initialize()
    window.dispatchEvent(new MessageEvent('message', { origin: 'https://evil.example', source: iframe.contentWindow, data: { source: 'livespeak', eventName: 'avatar_state_changed', avatarState: 'Ready' } }))
    expect(adapter.getState()).toBe('booting')
    iframe.remove()
  })

  it('waits for ModelAwaiting before loading an approved model', async () => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const postMessage = vi.spyOn(iframe.contentWindow, 'postMessage')
    const adapter = new MetaPersonLiveSpeakAdapter({ iframe, origin: 'https://metaperson.avatarsdk.com' })
    adapters.push(adapter)
    await adapter.initialize()
    await adapter.loadCharacter(character)
    expect(postMessage).not.toHaveBeenCalled()
    window.dispatchEvent(new MessageEvent('message', { origin: 'https://metaperson.avatarsdk.com', source: iframe.contentWindow, data: { source: 'livespeak', eventName: 'avatar_state_changed', avatarState: 'ModelAwaiting' } }))
    expect(postMessage).toHaveBeenCalledWith({ eventName: 'load_model', modelUrl: character.avatar.modelUrl }, 'https://metaperson.avatarsdk.com')
    iframe.remove()
  })

  it('rejects unapproved content even when avatar is ready', async () => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const adapter = new MetaPersonLiveSpeakAdapter({ iframe, origin: 'https://metaperson.avatarsdk.com' })
    adapters.push(adapter)
    await adapter.initialize()
    await expect(adapter.speakApproved({ characterId: null })).rejects.toThrow()
    iframe.remove()
  })

  it('enters a deterministic error state when LiveSpeak reports an outage', async () => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const adapter = new MetaPersonLiveSpeakAdapter({ iframe, origin: 'https://metaperson.avatarsdk.com' })
    adapters.push(adapter)
    await adapter.initialize()
    window.dispatchEvent(new MessageEvent('message', { origin: 'https://metaperson.avatarsdk.com', source: iframe.contentWindow, data: { source: 'livespeak', eventName: 'avatar_state_changed', avatarState: 'Error' } }))
    expect(adapter.getState()).toBe('error')
    iframe.remove()
  })
})
