import { describe, expect, it, vi } from 'vitest'
import { LiveKitRealtimeSession, REALTIME_STATES } from '../digital-human/LiveKitRealtimeSession'

describe('LiveKitRealtimeSession half-duplex policy', () => {
  it('blocks microphone activation while avatar speech is authoritative', async () => {
    const session = new LiveKitRealtimeSession()
    session.room = { localParticipant: { setMicrophoneEnabled: vi.fn().mockResolvedValue(), getTrackPublication: vi.fn() } }
    session.setAvatarSpeaking(true)
    await expect(session.setMicrophoneEnabled(true)).rejects.toThrow(/Half-duplex/)
    expect(session.room.localParticipant.setMicrophoneEnabled).toHaveBeenCalledWith(false)
    expect(session.room.localParticipant.setMicrophoneEnabled).not.toHaveBeenCalledWith(true)
  })

  it('returns to idle after avatar speech completes', () => {
    const seen = []
    const session = new LiveKitRealtimeSession({ onStateChange: (state) => seen.push(state) })
    session.room = { localParticipant: { setMicrophoneEnabled: vi.fn().mockResolvedValue() } }
    session.connectionState = REALTIME_STATES.IDLE
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
      localParticipant: { identity: 'local-user', setMicrophoneEnabled: vi.fn().mockResolvedValue({ trackSid: 'mic-track-1' }) },
    }
    const transcripts = []
    const session = new LiveKitRealtimeSession({ roomFactory: () => room, onFinalTranscript: async (text) => transcripts.push(text) })
    await session.connect('token', 'wss://livekit.example.test')
    await session.setMicrophoneEnabled(true)
    const reader = (id, final, text) => ({ info: { id, attributes: { 'lk.segment_id': id, 'lk.transcription_final': final, 'lk.transcribed_track_id': 'mic-track-1' } }, readAll: vi.fn().mockResolvedValue(text) })
    handler(reader('segment-a', 'false', 'interim'), { identity: 'local-user' })
    handler(reader('segment-a', 'true', 'final words'), { identity: 'local-user' })
    handler(reader('segment-a', 'true', 'duplicate'), { identity: 'local-user' })
    await vi.waitFor(() => expect(transcripts).toEqual(['final words']))
    expect(room.localParticipant.setMicrophoneEnabled).toHaveBeenLastCalledWith(false)
    expect(session.getState()).toBe(REALTIME_STATES.IDLE)
  })

  it('rejects final streams that are not bound to the local microphone track', async () => {
    let handler
    const room = {
      on: vi.fn(), connect: vi.fn().mockResolvedValue(), disconnect: vi.fn().mockResolvedValue(),
      registerTextStreamHandler: vi.fn((_topic, next) => { handler = next }),
      unregisterTextStreamHandler: vi.fn(),
      localParticipant: { identity: 'local-user', setMicrophoneEnabled: vi.fn().mockResolvedValue({ trackSid: 'mic-track-1' }) },
    }
    const onFinalTranscript = vi.fn()
    const session = new LiveKitRealtimeSession({ roomFactory: () => room, onFinalTranscript })
    await session.connect('token', 'wss://livekit.example.test')
    await session.setMicrophoneEnabled(true)
    const forged = { info: { id: 'forged', attributes: { 'lk.segment_id': 'forged', 'lk.transcription_final': 'true', 'lk.transcribed_track_id': 'other-track' } }, readAll: vi.fn().mockResolvedValue('ignore me') }
    handler(forged, { identity: 'other-user' })
    await vi.waitFor(() => expect(forged.readAll).toHaveBeenCalled())
    expect(onFinalTranscript).not.toHaveBeenCalled()
    expect(session.getState()).toBe(REALTIME_STATES.LISTENING)
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

  it.each(['DISCONNECTED', 'CONNECTING', 'RECOVERING', 'LISTENING', 'PROCESSING'])('Avatar ready does not overwrite actual %s state', (state) => {
    const session = new LiveKitRealtimeSession()
    session.setState(state)
    session.setAvatarSpeaking(false)
    expect(session.getState()).toBe(state)
  })

  it('returns to disconnected when speech ends without any voice room', () => {
    const session = new LiveKitRealtimeSession()
    session.setAvatarSpeaking(true)
    session.setAvatarSpeaking(false)
    expect(session.getState()).toBe('DISCONNECTED')
  })

  it('stops collection before a text turn and blocks late microphone activation', async () => {
    let finishEnable
    const setMicrophoneEnabled = vi.fn((enabled) => enabled ? new Promise((resolve) => { finishEnable = resolve }) : Promise.resolve())
    const session = new LiveKitRealtimeSession()
    session.room = { localParticipant: { setMicrophoneEnabled } }
    session.connectionState = REALTIME_STATES.IDLE
    session.setState(REALTIME_STATES.IDLE)
    const activating = session.setMicrophoneEnabled(true)
    const rejected = expect(activating).rejects.toThrow('cancelled microphone')
    await session.beginTurn()
    expect(setMicrophoneEnabled).toHaveBeenLastCalledWith(false)
    expect(session.getState()).toBe('PROCESSING')
    finishEnable({ trackSid: 'mic-track' })
    await rejected
    expect(setMicrophoneEnabled).toHaveBeenLastCalledWith(false)
    await expect(session.setMicrophoneEnabled(true)).rejects.toThrow('Half-duplex')
    session.setAvatarSpeaking(false)
    expect(session.getState()).toBe('PROCESSING')
    session.finishTurn()
    expect(session.getState()).toBe('IDLE')
  })

  it('still cancels an old activation after a fast text turn has already finished', async () => {
    let finishEnable
    const setMicrophoneEnabled = vi.fn((enabled) => enabled ? new Promise((resolve) => { finishEnable = resolve }) : Promise.resolve())
    const session = new LiveKitRealtimeSession()
    session.room = { localParticipant: { setMicrophoneEnabled } }
    session.connectionState = REALTIME_STATES.IDLE
    session.setState(REALTIME_STATES.IDLE)
    const oldEnable = session.setMicrophoneEnabled(true)
    const assertion = expect(oldEnable).rejects.toThrow('cancelled microphone')
    await session.beginTurn()
    session.finishTurn()
    finishEnable({ trackSid: 'old-track' })
    await assertion
    expect(setMicrophoneEnabled.mock.calls.map(([enabled]) => enabled)).toEqual([true, false, false])
    expect(session.getState()).toBe('IDLE')
  })

  it('drops delayed final text superseded by a complete manual text turn', async () => {
    let handler, finishRead
    const room = {
      on: vi.fn(), connect: vi.fn().mockResolvedValue(), disconnect: vi.fn().mockResolvedValue(),
      registerTextStreamHandler: vi.fn((_topic, next) => { handler = next }), unregisterTextStreamHandler: vi.fn(),
      localParticipant: { identity: 'local-user', setMicrophoneEnabled: vi.fn().mockResolvedValue({ trackSid: 'mic-track-1' }) },
    }
    const onFinalTranscript = vi.fn()
    const session = new LiveKitRealtimeSession({ roomFactory: () => room, onFinalTranscript })
    await session.connect('token', 'wss://unused.example.test')
    await session.setMicrophoneEnabled(true)
    handler({ info: { id: 'old-final', attributes: { 'lk.transcription_final': 'true', 'lk.transcribed_track_id': 'mic-track-1' } }, readAll: () => new Promise((resolve) => { finishRead = resolve }) }, { identity: 'local-user' })
    await session.beginTurn()
    session.finishTurn()
    finishRead('superseded voice question')
    await Promise.resolve()
    await Promise.resolve()
    expect(onFinalTranscript).not.toHaveBeenCalled()
    expect(session.getState()).toBe('IDLE')
  })
})
