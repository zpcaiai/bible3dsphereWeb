import { afterEach, describe, expect, it, vi } from 'vitest'
import { MetaPersonLiveSpeakAdapter } from '../digital-human/MetaPersonLiveSpeakAdapter'

const character = {
  id: 'david',
  avatar: { modelUrl: 'https://cdn.holiness.uk/david.glb', reviewState: 'APPROVED' },
  voice: { voiceId: 'approved-david', reviewState: 'APPROVED' },
}

describe('MetaPersonLiveSpeakAdapter', () => {
  const adapters = []
  afterEach(() => { adapters.splice(0).forEach((item) => item.dispose()); vi.useRealTimers() })

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

  it('times out boot without treating a late Ready message as success', async () => {
    vi.useFakeTimers()
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const onError = vi.fn()
    const adapter = new MetaPersonLiveSpeakAdapter({ iframe, origin: 'https://metaperson.avatarsdk.com', timeoutMs: 10, onError })
    adapters.push(adapter)
    await adapter.initialize()
    await adapter.loadCharacter(character)
    await vi.advanceTimersByTimeAsync(11)
    expect(adapter.getState()).toBe('error')
    expect(onError).toHaveBeenCalledTimes(1)
    window.dispatchEvent(new MessageEvent('message', { origin: adapter.origin, source: iframe.contentWindow, data: { source: 'livespeak', eventName: 'avatar_state_changed', avatarState: 'Ready' } }))
    expect(adapter.getState()).toBe('error')
    iframe.remove()
  })

  it('requires model load before Ready and speech acknowledgement before completion', async () => {
    vi.useFakeTimers()
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const adapter = new MetaPersonLiveSpeakAdapter({ iframe, origin: 'https://metaperson.avatarsdk.com', timeoutMs: 10, speechTimeoutMs: 20 })
    adapters.push(adapter)
    const emit = (avatarState) => window.dispatchEvent(new MessageEvent('message', { origin: adapter.origin, source: iframe.contentWindow, data: { source: 'livespeak', eventName: 'avatar_state_changed', avatarState } }))
    await adapter.initialize()
    await adapter.loadCharacter(character)
    emit('Ready')
    expect(adapter.getState()).toBe('booting')
    emit('ModelAwaiting')
    emit('Ready')
    expect(adapter.getState()).toBe('ready')
    const approved = { characterId: 'david', answerType: 'FACT', spokenText: '经文记录', displayText: '经文记录', references: [], warnings: [], groundingLevel: 'G1_INTERPRETIVE_POSSIBILITY', contentSha256: 'a'.repeat(64), contentReviewState: 'APPROVED', speechApproved: true }
    await adapter.speakApproved(approved)
    expect(adapter.getState()).toBe('speaking')
    await expect(adapter.speakApproved(approved)).rejects.toThrow('not ready')
    emit('Ready')
    expect(adapter.getState()).toBe('speaking')
    emit('Speaking')
    emit('Ready')
    expect(adapter.getState()).toBe('ready')
    await vi.advanceTimersByTimeAsync(30)
    expect(adapter.getState()).toBe('ready')
    iframe.remove()
  })
})
