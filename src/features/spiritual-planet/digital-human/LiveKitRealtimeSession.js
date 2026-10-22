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
    this.activeTranscript = null
    this.turnBlocked = false
    this.avatarSpeaking = false
    this.connectionState = REALTIME_STATES.DISCONNECTED
    this.microphoneRevision = 0
  }

  async connect(token, wsUrl) {
    if (this.room) await this.disconnect()
    this.setState(REALTIME_STATES.CONNECTING)
    this.connectionState = REALTIME_STATES.CONNECTING
    const room = this.roomFactory({ adaptiveStream: true, dynacast: true, disconnectOnPageLeave: true })
    this.room = room
    room.on(RoomEvent.Reconnecting, () => { if (this.room === room) { this.connectionState = REALTIME_STATES.RECOVERING; this.setState(REALTIME_STATES.RECOVERING) } })
    room.on(RoomEvent.Reconnected, () => { if (this.room === room) { this.connectionState = REALTIME_STATES.IDLE; this.setState(this.avatarSpeaking ? REALTIME_STATES.AVATAR_SPEAKING : this.turnBlocked ? REALTIME_STATES.PROCESSING : REALTIME_STATES.IDLE) } })
    room.on(RoomEvent.Disconnected, () => { if (this.room === room) { this.connectionState = REALTIME_STATES.DISCONNECTED; this.setState(REALTIME_STATES.DISCONNECTED) } })
    room.registerTextStreamHandler('lk.transcription', (reader, participantInfo) => {
      const attributes = reader.info?.attributes || {}
      const discard = () => reader.readAll({ maxSize: 16_000 }).catch(() => {})
      if (String(attributes['lk.transcription_final']).toLowerCase() !== 'true') { discard(); return }
      const segmentId = attributes['lk.segment_id'] || reader.info?.id
      const trackSid = attributes['lk.transcribed_track_id']
      const senderIdentity = participantInfo?.identity
      const localIdentity = room.localParticipant?.identity
      if (
        !segmentId || this.seenSegments.has(segmentId) || this.transcriptInFlight || this.turnBlocked || this.avatarSpeaking ||
        this.state !== REALTIME_STATES.LISTENING || !trackSid || trackSid !== this.microphoneTrackSid ||
        (senderIdentity && localIdentity && senderIdentity !== localIdentity)
      ) { discard(); return }
      this.seenSegments.add(segmentId)
      if (this.seenSegments.size > 256) this.seenSegments.delete(this.seenSegments.values().next().value)
      this.transcriptInFlight = true
      const captureRevision = this.microphoneRevision
      const transcriptToken = {}
      this.activeTranscript = transcriptToken
      reader.readAll({ maxSize: 16_000 }).then(async (text) => {
        const trimmed = text.trim()
        if (!trimmed || this.room !== room || captureRevision !== this.microphoneRevision) return
        await room.localParticipant.setMicrophoneEnabled(false)
        if (this.room !== room || captureRevision !== this.microphoneRevision) return
        this.setState(REALTIME_STATES.PROCESSING)
        await this.onFinalTranscript(trimmed)
        if (this.state === REALTIME_STATES.PROCESSING) this.setState(REALTIME_STATES.IDLE)
      }).catch(() => { if (this.room === room && captureRevision === this.microphoneRevision) this.setState(REALTIME_STATES.ERROR) }).finally(() => {
        if (this.activeTranscript === transcriptToken) { this.transcriptInFlight = false; this.activeTranscript = null }
      })
    })
    try {
      await room.connect(wsUrl, token, { autoSubscribe: true })
      if (this.room !== room) { await room.disconnect(); return }
      this.connectionState = REALTIME_STATES.IDLE
      this.setState(this.avatarSpeaking ? REALTIME_STATES.AVATAR_SPEAKING : this.turnBlocked ? REALTIME_STATES.PROCESSING : REALTIME_STATES.IDLE)
    } catch (error) {
      this.setState(REALTIME_STATES.ERROR)
      await room.disconnect().catch(() => {})
      this.room = null
      this.connectionState = REALTIME_STATES.DISCONNECTED
      throw error
    }
  }

  async setMicrophoneEnabled(enabled) {
    if (!this.room) throw new Error('LiveKit room is not connected')
    if (enabled && (this.turnBlocked || this.avatarSpeaking || [REALTIME_STATES.AVATAR_SPEAKING, REALTIME_STATES.PROCESSING, REALTIME_STATES.CONNECTING, REALTIME_STATES.RECOVERING].includes(this.state))) {
      throw new Error('Half-duplex policy blocks microphone while a turn is in progress')
    }
    const room = this.room
    const microphoneRevision = ++this.microphoneRevision
    const publication = await room.localParticipant.setMicrophoneEnabled(enabled)
    if (enabled) {
      if (room !== this.room || microphoneRevision !== this.microphoneRevision || this.turnBlocked || this.avatarSpeaking) {
        if (room === this.room) await this.setMicrophoneEnabled(false)
        else await room.localParticipant.setMicrophoneEnabled(false)
        throw new Error('Half-duplex policy cancelled microphone activation')
      }
      this.microphoneTrackSid = publication?.trackSid || this.room.localParticipant.getTrackPublication?.(Track.Source.Microphone)?.trackSid || null
      if (!this.microphoneTrackSid) {
        await this.room.localParticipant.setMicrophoneEnabled(false).catch(() => {})
        throw new Error('LiveKit microphone track was not published')
      }
    }
    if (room === this.room) this.setState(enabled ? REALTIME_STATES.LISTENING : this.avatarSpeaking ? REALTIME_STATES.AVATAR_SPEAKING : this.turnBlocked ? REALTIME_STATES.PROCESSING : REALTIME_STATES.IDLE)
  }

  setAvatarSpeaking(speaking) {
    this.avatarSpeaking = speaking
    if (speaking) {
      this.microphoneRevision += 1
      this.setState(REALTIME_STATES.AVATAR_SPEAKING)
      if (this.room) this.room.localParticipant.setMicrophoneEnabled(false).catch(() => this.disconnect())
    } else if (this.state === REALTIME_STATES.AVATAR_SPEAKING) {
      this.setState(!this.room ? REALTIME_STATES.DISCONNECTED : this.turnBlocked ? REALTIME_STATES.PROCESSING : this.connectionState)
    }
  }

  async beginTurn() {
    this.microphoneRevision += 1
    this.activeTranscript = null
    this.transcriptInFlight = false
    this.turnBlocked = true
    if (this.room) {
      try { await this.setMicrophoneEnabled(false) }
      catch (error) { await this.disconnect(); throw error }
    }
  }

  finishTurn() {
    this.turnBlocked = false
    if (this.state === REALTIME_STATES.PROCESSING) this.setState(this.room ? this.connectionState : REALTIME_STATES.DISCONNECTED)
  }

  getState() { return this.state }

  async disconnect() {
    this.microphoneRevision += 1
    const room = this.room
    this.room = null
    if (room) {
      room.unregisterTextStreamHandler('lk.transcription')
      await room.localParticipant.setMicrophoneEnabled(false).catch(() => {})
      await room.disconnect()
    }
    this.room = null
    this.seenSegments.clear()
    this.microphoneTrackSid = null
    this.transcriptInFlight = false
    this.activeTranscript = null
    this.turnBlocked = false
    this.avatarSpeaking = false
    this.connectionState = REALTIME_STATES.DISCONNECTED
    this.setState(REALTIME_STATES.DISCONNECTED)
  }

  setState(next) {
    this.state = next
    this.onStateChange(next)
  }
}
