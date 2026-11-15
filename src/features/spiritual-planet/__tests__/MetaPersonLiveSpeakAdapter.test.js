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
    await expect(adapter.speakApproved({ ...approved, speechApproved: false })).rejects.toThrow('release gate')
    await adapter.speakApproved(approved)
    expect(adapter.getState()).toBe('preparing-speech')
    await expect(adapter.speakApproved(approved)).rejects.toThrow('not ready')
    emit('Ready')
    expect(adapter.getState()).toBe('preparing-speech')
    emit('WaitingForTouch')
    expect(adapter.getState()).toBe('waiting-for-touch')
    emit('Speaking')
    expect(adapter.getState()).toBe('speaking')
    emit('Ready')
    expect(adapter.getState()).toBe('ready')
    await vi.advanceTimersByTimeAsync(30)
    expect(adapter.getState()).toBe('ready')
    iframe.remove()
  })

  it('authenticates once after the trusted iframe is loaded and requests authentication', async () => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const postMessage = vi.spyOn(iframe.contentWindow, 'postMessage')
    const requestAccessToken = vi.fn().mockResolvedValue('test-token')
    const adapter = new MetaPersonLiveSpeakAdapter({ iframe, origin: 'https://metaperson.avatarsdk.com', requestAccessToken })
    adapters.push(adapter)
    const emit = (data, source = iframe.contentWindow) => window.dispatchEvent(new MessageEvent('message', {
      origin: adapter.origin, source, data: { source: 'livespeak', ...data },
    }))
    await adapter.initialize()
    await adapter.loadCharacter(character)
    emit({ eventName: 'avatar_state_changed', avatarState: 'WaitingForAuthentication' })
    emit({ eventName: 'livespeak_loaded' }, window)
    expect(requestAccessToken).not.toHaveBeenCalled()
    emit({ eventName: 'livespeak_loaded' })
    emit({ eventName: 'livespeak_loaded' })
    await vi.waitFor(() => expect(postMessage).toHaveBeenCalledWith(
      { eventName: 'authenticate', accessToken: 'test-token' }, adapter.origin,
    ))
    expect(requestAccessToken).toHaveBeenCalledTimes(1)
    emit({ eventName: 'message_processing_error', failedEventName: 'authenticate', reason: 'untrusted vendor detail' })
    expect(adapter.getState()).toBe('error')
    iframe.remove()
  })

  it('never forwards a token arriving after the iframe is disposed', async () => {
    const iframe = document.createElement('iframe')
    document.body.appendChild(iframe)
    const postMessage = vi.spyOn(iframe.contentWindow, 'postMessage')
    let resolveToken, signal
    const adapter = new MetaPersonLiveSpeakAdapter({
      iframe, origin: 'https://metaperson.avatarsdk.com',
      requestAccessToken: (activeSignal) => {
        signal = activeSignal
        return new Promise((resolve) => { resolveToken = resolve })
      },
    })
    adapters.push(adapter)
    const emit = (data) => window.dispatchEvent(new MessageEvent('message', {
      origin: adapter.origin, source: iframe.contentWindow, data: { source: 'livespeak', ...data },
    }))
    await adapter.initialize()
    emit({ eventName: 'livespeak_loaded' })
    emit({ eventName: 'avatar_state_changed', avatarState: 'WaitingForAuthentication' })
    adapter.dispose()
    resolveToken('test-token')
    await Promise.resolve()
    expect(signal.aborted).toBe(true)
    expect(postMessage).not.toHaveBeenCalled()
    iframe.remove()
  })
})
