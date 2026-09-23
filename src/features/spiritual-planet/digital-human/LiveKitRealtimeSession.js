import { Room, RoomEvent } from 'livekit-client'

export const REALTIME_STATES = Object.freeze({
  DISCONNECTED: 'DISCONNECTED', CONNECTING: 'CONNECTING', IDLE: 'IDLE', LISTENING: 'LISTENING',
  AVATAR_SPEAKING: 'AVATAR_SPEAKING', RECOVERING: 'RECOVERING', ERROR: 'ERROR',
})

export class LiveKitRealtimeSession {
  constructor({ onStateChange = () => {}, onFinalTranscript = () => {}, roomFactory = (options) => new Room(options) } = {}) {
    this.onStateChange = onStateChange
    this.onFinalTranscript = onFinalTranscript
    this.state = REALTIME_STATES.DISCONNECTED
    this.room = null
    this.roomFactory = roomFactory
    this.seenSegments = new Set()
  }

  async connect(token, wsUrl) {
    if (this.room) await this.disconnect()
    this.setState(REALTIME_STATES.CONNECTING)
    const room = this.roomFactory({ adaptiveStream: true, dynacast: true, disconnectOnPageLeave: true })
    this.room = room
    room.on(RoomEvent.Reconnecting, () => this.setState(REALTIME_STATES.RECOVERING))
    room.on(RoomEvent.Reconnected, () => this.setState(REALTIME_STATES.IDLE))
    room.on(RoomEvent.Disconnected, () => this.setState(REALTIME_STATES.DISCONNECTED))
    room.registerTextStreamHandler('lk.transcription', (reader) => {
      const attributes = reader.info?.attributes || {}
      const discard = () => reader.readAll({ maxSize: 16_000 }).catch(() => {})
      if (String(attributes['lk.transcription_final']).toLowerCase() !== 'true') { discard(); return }
      const segmentId = attributes['lk.segment_id'] || reader.info?.id
      if (!segmentId || this.seenSegments.has(segmentId)) { discard(); return }
      this.seenSegments.add(segmentId)
      if (this.seenSegments.size > 256) this.seenSegments.delete(this.seenSegments.values().next().value)
      reader.readAll({ maxSize: 16_000 }).then((text) => {
        const trimmed = text.trim()
        if (trimmed) this.onFinalTranscript(trimmed)
      }).catch(() => this.setState(REALTIME_STATES.ERROR))
    })
    try {
      await room.connect(wsUrl, token, { autoSubscribe: true })
      this.setState(REALTIME_STATES.IDLE)
    } catch (error) {
      this.setState(REALTIME_STATES.ERROR)
      await room.disconnect().catch(() => {})
      this.room = null
      throw error
    }
  }

  async setMicrophoneEnabled(enabled) {
    if (!this.room) throw new Error('LiveKit room is not connected')
    if (this.state === REALTIME_STATES.AVATAR_SPEAKING && enabled) throw new Error('Half-duplex policy blocks microphone while avatar is speaking')
    await this.room.localParticipant.setMicrophoneEnabled(enabled)
    this.setState(enabled ? REALTIME_STATES.LISTENING : REALTIME_STATES.IDLE)
  }

  setAvatarSpeaking(speaking) {
    this.setState(speaking ? REALTIME_STATES.AVATAR_SPEAKING : REALTIME_STATES.IDLE)
  }

  getState() { return this.state }

  async disconnect() {
    if (this.room) {
      this.room.unregisterTextStreamHandler('lk.transcription')
      await this.room.localParticipant.setMicrophoneEnabled(false).catch(() => {})
      await this.room.disconnect()
    }
    this.room = null
    this.seenSegments.clear()
    this.setState(REALTIME_STATES.DISCONNECTED)
  }

  setState(next) {
    this.state = next
    this.onStateChange(next)
  }
}
