import { describe, expect, it, vi } from 'vitest'
import { LiveKitRealtimeSession, REALTIME_STATES } from '../digital-human/LiveKitRealtimeSession'

describe('LiveKitRealtimeSession half-duplex policy', () => {
  it('blocks microphone activation while avatar speech is authoritative', async () => {
    const session = new LiveKitRealtimeSession()
    session.room = { localParticipant: { setMicrophoneEnabled: vi.fn() } }
    session.setAvatarSpeaking(true)
    await expect(session.setMicrophoneEnabled(true)).rejects.toThrow(/Half-duplex/)
    expect(session.room.localParticipant.setMicrophoneEnabled).not.toHaveBeenCalled()
  })

  it('returns to idle after avatar speech completes', () => {
    const seen = []
    const session = new LiveKitRealtimeSession({ onStateChange: (state) => seen.push(state) })
    session.setAvatarSpeaking(true)
    session.setAvatarSpeaking(false)
    expect(seen).toEqual([REALTIME_STATES.AVATAR_SPEAKING, REALTIME_STATES.IDLE])
  })

  it('accepts only final unique transcription segments', async () => {
    let handler
    const room = {
      on: vi.fn(), connect: vi.fn().mockResolvedValue(), disconnect: vi.fn().mockResolvedValue(),
      registerTextStreamHandler: vi.fn((_topic, next) => { handler = next }),
      unregisterTextStreamHandler: vi.fn(),
      localParticipant: { setMicrophoneEnabled: vi.fn().mockResolvedValue() },
    }
    const transcripts = []
    const session = new LiveKitRealtimeSession({ roomFactory: () => room, onFinalTranscript: (text) => transcripts.push(text) })
    await session.connect('token', 'wss://livekit.example.test')
    const reader = (id, final, text) => ({ info: { id, attributes: { 'lk.segment_id': id, 'lk.transcription_final': final } }, readAll: vi.fn().mockResolvedValue(text) })
    handler(reader('segment-a', 'false', 'interim'))
    handler(reader('segment-a', 'true', 'final words'))
    handler(reader('segment-a', 'true', 'duplicate'))
    await vi.waitFor(() => expect(transcripts).toEqual(['final words']))
  })

  it('cleans up and enters error state when the provider connection fails', async () => {
    const room = {
      on: vi.fn(), connect: vi.fn().mockRejectedValue(new Error('provider down')),
      disconnect: vi.fn().mockResolvedValue(), registerTextStreamHandler: vi.fn(),
    }
    const session = new LiveKitRealtimeSession({ roomFactory: () => room })
    await expect(session.connect('token', 'wss://livekit.example.test')).rejects.toThrow('provider down')
    expect(session.getState()).toBe(REALTIME_STATES.ERROR)
    expect(room.disconnect).toHaveBeenCalled()
    expect(session.room).toBeNull()
  })
})
