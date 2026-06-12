// 通用 LiveKit 通话组件 — 用于「圣徒相通」1对1 秒拨，支持语音 + 视频。
// 与 VoiceRoomPage 的 CallScreen 同样的高质量采集 (Opus+RED+DTX+原生回声消除)，
// 但解耦于"群"概念：直接吃 { url, token } 进房。video=true 时进房即开摄像头。
import { useCallback, useEffect, useRef, useState } from 'react'
import VideoTile from './VideoTile'
import NotesButton from './NotesButton'
import { stopNotes, setLineSink, addRemoteLine } from './callNotes'
import { t } from '../i18n/runtime'

// 按来源取参与者当前可渲染的视频轨（'camera' 摄像头 / 'screen_share' 屏幕共享）
function videoTrackOf(p, source) {
  for (const pub of p.videoTrackPublications.values()) {
    if (pub.source !== source) continue
    const track = pub.track || pub.videoTrack
    if (track && !pub.isMuted) return track
  }
  return null
}

export default function LiveKitCall({ url, token, title, selfName, outgoing, onLeave, e2eeKey = '', video = false }) {
  const [status, setStatus] = useState('connecting') // connecting | live | error
  const [errMsg, setErrMsg] = useState('')
  const [participants, setParticipants] = useState([])
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(false)
  const [shareOn, setShareOn] = useState(false)
  const roomRef = useRef(null)
  const audioBin = useRef(null)

  const sync = useCallback(() => {
    const room = roomRef.current
    if (!room) return
    const lp = room.localParticipant
    const speakers = new Set(room.activeSpeakers?.map((p) => p.sid) || [])
    const list = [{
      sid: lp.sid, name: (lp.name || selfName || t("我")) + t("（我）"),
      isLocal: true, speaking: speakers.has(lp.sid), muted: !lp.isMicrophoneEnabled,
      videoTrack: lp.isCameraEnabled ? videoTrackOf(lp, 'camera') : null,
      screenTrack: videoTrackOf(lp, 'screen_share'),
    }]
    room.remoteParticipants.forEach((p) => {
      list.push({
        sid: p.sid,
        name: p.name || p.identity?.split('@')[0] || t("弟兄姐妹"),
        isLocal: false, speaking: speakers.has(p.sid),
        muted: p.audioTrackPublications.size
          ? ![...p.audioTrackPublications.values()].some((pub) => !pub.isMuted)
          : false,
        videoTrack: videoTrackOf(p, 'camera'),
        screenTrack: videoTrackOf(p, 'screen_share'),
      })
    })
    setParticipants(list)
    // 浏览器自带"停止共享"按钮会直接停轨：以房间实际状态回写按钮态
    setShareOn(!!lp.isScreenShareEnabled)
  }, [selfName])

  useEffect(() => {
    let cancelled = false
    let room = null
    let e2eeWorker = null
    async function start() {
      let LK
      try { LK = await import('livekit-client') }
      catch { setStatus('error'); setErrMsg(t("语音组件加载失败")); return }
      const { Room, RoomEvent, Track } = LK
      // 端到端加密：后端在 LIVEKIT_E2EE=1 时随凭证下发 e2ee_key
      let keyProvider = null
      if (e2eeKey) {
        try {
          keyProvider = new LK.ExternalE2EEKeyProvider()
          e2eeWorker = new Worker(new URL('livekit-client/e2ee-worker', import.meta.url))
        } catch (err) { keyProvider = null; e2eeWorker = null }
      }
      room = new Room({
        adaptiveStream: true, // 视频按瓦片实际尺寸自适应码率
        dynacast: true,
        audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        videoCaptureDefaults: { resolution: { width: 960, height: 540, frameRate: 24 } },
        publishDefaults: { dtx: true, red: true, audioPreset: { maxBitrate: 32000 } },
        ...(keyProvider && e2eeWorker ? { e2ee: { keyProvider, worker: e2eeWorker } } : {}),
      })
      roomRef.current = room
      if (keyProvider && e2eeKey) {
        try { await keyProvider.setKey(e2eeKey); await room.setE2EEEnabled(true) }
        catch (err) { console.error('E2EE 启用失败', err) }
      }
      const onChange = () => { if (!cancelled) sync() }
      room
        .on(RoomEvent.ParticipantConnected, onChange)
        .on(RoomEvent.ParticipantDisconnected, onChange)
        .on(RoomEvent.ActiveSpeakersChanged, onChange)
        .on(RoomEvent.TrackMuted, onChange)
        .on(RoomEvent.TrackUnmuted, onChange)
        .on(RoomEvent.LocalTrackPublished, onChange)
        .on(RoomEvent.LocalTrackUnpublished, onChange)
        .on(RoomEvent.Disconnected, () => { if (!cancelled) { setStatus('error'); setErrMsg(t("通话已断开")) } })
        .on(RoomEvent.TrackSubscribed, (track, pub, participant) => {
          if (track.kind === Track.Kind.Audio && audioBin.current) {
            const el = track.attach(); el.dataset.sid = participant.sid; el.autoplay = true
            audioBin.current.appendChild(el)
          }
          onChange()
        })
        .on(RoomEvent.TrackUnsubscribed, (track, pub) => {
          if (pub?.kind !== 'video') track.detach().forEach((el) => el.remove())
          onChange()
        })
        .on(RoomEvent.DataReceived, (payload) => {
          try {
            const m = JSON.parse(new TextDecoder().decode(payload))
            if (m && m.k === 'pn') addRemoteLine(m.name, m.text)
          } catch { /* 忽略 */ }
        })
      try {
        await room.connect(url, token)
        await room.localParticipant.setMicrophoneEnabled(true)
        const enc = new TextEncoder()
        setLineSink((line) => {
          try {
            room.localParticipant.publishData(
              enc.encode(JSON.stringify({ k: 'pn', name: line.name, text: line.text })),
              { reliable: true },
            )
          } catch { /* noop */ }
        })
        if (video) {
          // 视频通话：进房即开摄像头；权限被拒不阻断通话，降级为语音
          try { await room.localParticipant.setCameraEnabled(true); if (!cancelled) setCamOn(true) }
          catch { if (!cancelled) setCamOn(false) }
        }
        if (!cancelled) { setStatus('live'); setMicOn(true); sync() }
      } catch (e) {
        if (!cancelled) {
          setStatus('error')
          setErrMsg(/permission|NotAllowed/i.test(String(e)) ? t("麦克风权限被拒绝，请在浏览器允许麦克风") : (e.message || t("连接失败")))
        }
      }
    }
    start()
    return () => {
      cancelled = true
      setLineSink(null)
      try { room?.disconnect() } catch { /* noop */ }
      try { e2eeWorker?.terminate() } catch { /* noop */ }
      roomRef.current = null
      if (audioBin.current) audioBin.current.innerHTML = ''
    }
  }, [url, token, sync, video])

  const toggleMic = async () => {
    const room = roomRef.current
    if (!room) return
    const next = !micOn
    await room.localParticipant.setMicrophoneEnabled(next)
    setMicOn(next); sync()
  }
  const toggleCam = async () => {
    const room = roomRef.current
    if (!room) return
    const next = !camOn
    try {
      await room.localParticipant.setCameraEnabled(next)
      setCamOn(next); sync()
    } catch (e) {
      window.showToast?.(/permission|NotAllowed/i.test(String(e)) ? t("摄像头权限被拒绝，请在浏览器允许摄像头") : (e.message || t("摄像头开启失败")), 'error')
    }
  }
  const toggleShare = async () => {
    const room = roomRef.current
    if (!room) return
    if (!shareOn && !navigator.mediaDevices?.getDisplayMedia) {
      window.showToast?.(t("此设备/浏览器不支持屏幕共享"), 'info'); return
    }
    try {
      await room.localParticipant.setScreenShareEnabled(!shareOn)
      sync()
    } catch (e) {
      // 用户在系统选择器里点了取消 → NotAllowed，静默忽略
      if (!/NotAllowed|Permission|cancel|Abort/i.test(String(e))) {
        window.showToast?.(e.message || t("屏幕共享开启失败"), 'error')
      }
    }
  }
  const hangUp = async () => {
    stopNotes() // 停止转写；缓冲保留给挂断后的纪要弹窗
    try { await roomRef.current?.disconnect() } catch { /* noop */ }
    onLeave?.()
  }

  const remoteCount = participants.filter((p) => !p.isLocal).length
  const anyVideo = participants.some((p) => p.videoTrack)
  const sharer = participants.find((p) => p.screenTrack) || null

  return (
    <div className="communion-call-overlay">
      <div className="communion-call-screen">
        <div ref={audioBin} style={{ display: 'none' }} />
        <div className="communion-call-top">
          <div className="communion-call-peer">{title || (video ? t("视频通话") : t("语音通话"))}</div>
          <div className="communion-call-state">
            {status === 'connecting' && <span style={{ color: '#f0ad4e' }}>● {outgoing ? t("正在呼叫…") : t("接入中…")}</span>}
            {status === 'live' && remoteCount === 0 && <span style={{ color: '#f0ad4e' }}>{t("● 等待对方接听…")}</span>}
            {status === 'live' && remoteCount > 0 && <span style={{ color: '#34c759' }}>{t("● 通话中")}</span>}
            {status === 'error' && <span style={{ color: '#ff6b6b' }}>● {errMsg || t("连接失败")}</span>}
          </div>
        </div>

        {/* 屏幕共享大舞台：有人在共享时置顶展示，内容不裁切 */}
        {sharer && (
          <div className="communion-call-stage">
            <VideoTile track={sharer.screenTrack} style={{ objectFit: 'contain' }} />
            <div className="communion-call-vname">🖥 {sharer.name} {t("正在共享屏幕")}</div>
          </div>
        )}

        <div className={`communion-call-tiles ${anyVideo ? 'has-video' : ''} ${sharer ? 'with-stage' : ''}`}>
          {participants.map((p) => (
            <div key={p.sid} className={`communion-call-tile ${p.speaking ? 'speaking' : ''} ${p.videoTrack ? 'video' : ''}`}>
              {p.videoTrack ? (
                <>
                  <VideoTile track={p.videoTrack} mirror={p.isLocal} />
                  <div className="communion-call-vname">{p.muted ? '🔇 ' : ''}{p.name}</div>
                </>
              ) : (
                <>
                  <div className="communion-call-bubble">{p.muted ? '🔇' : (p.speaking ? '🔊' : '🎙')}</div>
                  <div className="communion-call-tname">{p.name}</div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="communion-call-actions">
          <button className="communion-call-ctrl" onClick={toggleMic} disabled={status !== 'live'}
            style={{ background: micOn ? 'rgba(255,255,255,.12)' : '#ff6b6b' }}>
            <div className="communion-call-ctrl-icon">{micOn ? '🎙' : '🔇'}</div>
            <div className="communion-call-ctrl-label">{micOn ? t("静音") : t("取消静音")}</div>
          </button>
          <button className="communion-call-ctrl" onClick={toggleCam} disabled={status !== 'live'}
            style={{ background: camOn ? 'rgba(52,199,89,.25)' : 'rgba(255,255,255,.12)' }}>
            <div className="communion-call-ctrl-icon">{camOn ? '📹' : '📷'}</div>
            <div className="communion-call-ctrl-label">{camOn ? t("关闭摄像头") : t("开启摄像头")}</div>
          </button>
          <button className="communion-call-ctrl" onClick={toggleShare} disabled={status !== 'live'}
            style={{ background: shareOn ? 'rgba(56,189,248,.28)' : 'rgba(255,255,255,.12)' }}>
            <div className="communion-call-ctrl-icon">🖥</div>
            <div className="communion-call-ctrl-label">{shareOn ? t("停止共享") : t("共享屏幕")}</div>
          </button>
          <NotesButton className="communion-call-ctrl" disabled={status !== 'live'}
            iconStyle={{ fontSize: 'clamp(13px, 3.6vw, 16px)', lineHeight: 1 }}
            labelStyle={{
              fontSize: 'clamp(7.5px, 2.2vw, 9px)',
              lineHeight: 1.05,
              maxWidth: '100%',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            selfName={selfName || ''} />
          <button className="communion-call-ctrl" onClick={hangUp} style={{ background: '#ff3b30' }}>
            <div className="communion-call-ctrl-icon">📴</div>
            <div className="communion-call-ctrl-label">{t("挂断")}</div>
          </button>
        </div>
      </div>
    </div>
  )
}
