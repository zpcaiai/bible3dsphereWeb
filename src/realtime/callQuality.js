export const AUDIO_QUALITY = {
  Excellent: 'excellent',
  Good: 'good',
  Poor: 'poor',
  Lost: 'lost',
  Unknown: 'unknown',
}

export const VOICE_AUDIO_CAPTURE_DEFAULTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  channelCount: 1,
  sampleRate: 48000,
}

export const VOICE_VIDEO_CAPTURE_DEFAULTS = {
  resolution: { width: 640, height: 360, frameRate: 18 },
}

export const VOICE_SCREEN_SHARE_CAPTURE_DEFAULTS = {
  audio: false,
  resolution: { width: 1280, height: 720, frameRate: 8 },
}

export const VOICE_PUBLISH_DEFAULTS = {
  dtx: true,
  red: true,
  forceStereo: false,
  audioPreset: { maxBitrate: 28000, priority: 'high' },
  videoEncoding: { maxBitrate: 360000, maxFramerate: 18, priority: 'low' },
  screenShareEncoding: { maxBitrate: 700000, maxFramerate: 8, priority: 'low' },
  degradationPreference: 'maintain-framerate',
  simulcast: true,
}

export function liveKitVoiceRoomOptions(extra = {}) {
  return {
    adaptiveStream: true,
    dynacast: true,
    audioCaptureDefaults: VOICE_AUDIO_CAPTURE_DEFAULTS,
    videoCaptureDefaults: VOICE_VIDEO_CAPTURE_DEFAULTS,
    publishDefaults: VOICE_PUBLISH_DEFAULTS,
    ...extra,
  }
}

export function normalizeConnectionQuality(value) {
  const q = String(value || '').toLowerCase()
  if (q === AUDIO_QUALITY.Excellent) return AUDIO_QUALITY.Excellent
  if (q === AUDIO_QUALITY.Good) return AUDIO_QUALITY.Good
  if (q === AUDIO_QUALITY.Poor) return AUDIO_QUALITY.Poor
  if (q === AUDIO_QUALITY.Lost) return AUDIO_QUALITY.Lost
  return AUDIO_QUALITY.Unknown
}

export function connectionQualityLabel(value) {
  switch (normalizeConnectionQuality(value)) {
    case AUDIO_QUALITY.Excellent: return '网络优秀'
    case AUDIO_QUALITY.Good: return '网络良好'
    case AUDIO_QUALITY.Poor: return '网络较弱'
    case AUDIO_QUALITY.Lost: return '网络中断'
    default: return '网络检测中'
  }
}

export function isWeakConnectionQuality(value) {
  const q = normalizeConnectionQuality(value)
  return q === AUDIO_QUALITY.Poor || q === AUDIO_QUALITY.Lost
}

export function tuneRemoteSubscriptionsForVoice(room, LK, quality) {
  if (!room || !LK) return
  const { Track, VideoQuality } = LK
  const weak = isWeakConnectionQuality(quality)
  room.remoteParticipants.forEach((participant) => {
    participant.audioTrackPublications.forEach((pub) => {
      try { pub.setSubscribed?.(true) } catch {}
      try { pub.setEnabled?.(true) } catch {}
    })
    participant.videoTrackPublications.forEach((pub) => {
      const isScreenShare = pub.source === Track.Source.ScreenShare
      try { pub.setVideoQuality?.(weak ? VideoQuality.LOW : VideoQuality.MEDIUM) } catch {}
      try { pub.setVideoFPS?.(weak ? 5 : (isScreenShare ? 8 : 15)) } catch {}
      try { pub.setEnabled?.(!weak) } catch {}
    })
  })
}

export async function protectVoiceOnWeakNetwork({ room, LK, quality }) {
  // 仅在「接收端」按网络情况调节远端视频订阅质量（节省弱网用户的下行带宽）。
  // 不再自动关闭本地摄像头/屏幕共享——视频开关完全交给用户：想开就开。
  if (!room || !LK) return
  tuneRemoteSubscriptionsForVoice(room, LK, quality)
}
