import { Room, RoomEvent, Track } from 'livekit-client'

export const REALTIME_STATES = Object.freeze({
  DISCONNECTED: 'DISCONNECTED', CONNECTING: 'CONNECTING', IDLE: 'IDLE', LISTENING: 'LISTENING',
  PROCESSING: 'PROCESSING', AVATAR_SPEAKING: 'AVATAR_SPEAKING', RECOVERING: 'RECOVERING', ERROR: 'ERROR',
})

export class LiveKitRealtimeSession {
  constructor({ onStateChange = () => {}, onFinalTranscript = () => {}, roomFactory = (options) => new Room(options) } = {}) {
    this.onStateChange = onStateChange
    this.onFinalTranscript = onFinalTranscript
    this.state = REALTIME_STATES.DISCONNECTED
    this.room = null
    this.roomFactory = roomFactory
    this.seenSegments = new Set()
    this.microphoneTrackSid = null
    this.transcriptInFlight = false
  }

  async connect(token, wsUrl) {
    if (this.room) await this.disconnect()
    this.setState(REALTIME_STATES.CONNECTING)
    const room = this.roomFactory({ adaptiveStream: true, dynacast: true, disconnectOnPageLeave: true })
    this.room = room
    room.on(RoomEvent.Reconnecting, () => this.setState(REALTIME_STATES.RECOVERING))
    room.on(RoomEvent.Reconnected, () => this.setState(REALTIME_STATES.IDLE))
    room.on(RoomEvent.Disconnected, () => this.setState(REALTIME_STATES.DISCONNECTED))
    room.registerTextStreamHandler('lk.transcription', (reader, participantInfo) => {
      const attributes = reader.info?.attributes || {}
      const discard = () => reader.readAll({ maxSize: 16_000 }).catch(() => {})
      if (String(attributes['lk.transcription_final']).toLowerCase() !== 'true') { discard(); return }
      const segmentId = attributes['lk.segment_id'] || reader.info?.id
      const trackSid = attributes['lk.transcribed_track_id']
      const senderIdentity = participantInfo?.identity
      const localIdentity = room.localParticipant?.identity
      if (
        !segmentId || this.seenSegments.has(segmentId) || this.transcriptInFlight ||
        this.state !== REALTIME_STATES.LISTENING || !trackSid || trackSid !== this.microphoneTrackSid ||
        (senderIdentity && localIdentity && senderIdentity !== localIdentity)
      ) { discard(); return }
      this.seenSegments.add(segmentId)
      if (this.seenSegments.size > 256) this.seenSegments.delete(this.seenSegments.values().next().value)
      this.transcriptInFlight = true
      reader.readAll({ maxSize: 16_000 }).then(async (text) => {
        const trimmed = text.trim()
        if (!trimmed) return
        await room.localParticipant.setMicrophoneEnabled(false)
        this.setState(REALTIME_STATES.PROCESSING)
        await this.onFinalTranscript(trimmed)
        if (this.state === REALTIME_STATES.PROCESSING) this.setState(REALTIME_STATES.IDLE)
      }).catch(() => this.setState(REALTIME_STATES.ERROR)).finally(() => { this.transcriptInFlight = false })
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
    if (enabled && [REALTIME_STATES.AVATAR_SPEAKING, REALTIME_STATES.PROCESSING, REALTIME_STATES.CONNECTING, REALTIME_STATES.RECOVERING].includes(this.state)) {
      throw new Error('Half-duplex policy blocks microphone while a turn is in progress')
    }
    const publication = await this.room.localParticipant.setMicrophoneEnabled(enabled)
    if (enabled) {
      this.microphoneTrackSid = publication?.trackSid || this.room.localParticipant.getTrackPublication?.(Track.Source.Microphone)?.trackSid || null
      if (!this.microphoneTrackSid) {
        await this.room.localParticipant.setMicrophoneEnabled(false).catch(() => {})
        throw new Error('LiveKit microphone track was not published')
      }
    }
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
    this.microphoneTrackSid = null
    this.transcriptInFlight = false
    this.setState(REALTIME_STATES.DISCONNECTED)
  }

  setState(next) {
    this.state = next
    this.onStateChange(next)
  }
}
