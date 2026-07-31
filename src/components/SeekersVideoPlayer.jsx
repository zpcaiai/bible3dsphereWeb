import { useEffect, useMemo, useRef, useState } from 'react'
import { t as i18nT } from '../i18n/runtime'

const SLOW_LOAD_MS = 8000

function normalizeSeekersVideoUrl(rawUrl) {
  if (!rawUrl) return ''
  try {
    const url = new URL(rawUrl, window.location.origin)
    // iOS Safari is more reliable about requesting MP4 metadata when a media
    // time fragment is present. URL also percent-encodes Chinese filenames.
    if (!url.hash) url.hash = 't=0.001'
    return url.href
  } catch {
    return rawUrl
  }
}

function mediaErrorMessage(code) {
  if (code === 2) return i18nT('视频网络连接中断，请重试')
  if (code === 3) return i18nT('浏览器无法解码此视频')
  if (code === 4) return i18nT('浏览器不支持此视频格式')
  return i18nT('视频加载失败，请重试')
}

export default function SeekersVideoPlayer({ course, onEnded }) {
  const videoRef = useRef(null)
  const [phase, setPhase] = useState('loading')
  const [slow, setSlow] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const videoUrl = useMemo(() => normalizeSeekersVideoUrl(course?.url), [course?.url])

  useEffect(() => {
    setPhase('loading')
    setSlow(false)
    setErrorMessage('')
    const timer = window.setTimeout(() => setSlow(true), SLOW_LOAD_MS)
    return () => window.clearTimeout(timer)
  }, [videoUrl])

  const markReady = () => {
    setPhase((current) => current === 'error' ? current : 'ready')
    setSlow(false)
  }

  const retry = async () => {
    const video = videoRef.current
    if (!video) return
    setPhase('loading')
    setSlow(false)
    setErrorMessage('')
    video.load()
    try {
      await video.play()
    } catch {
      // Autoplay can be blocked by the browser. Native controls remain visible
      // so the user can start playback without losing the loaded metadata.
      setPhase('ready')
    }
  }

  return (
    <div style={{ background: '#000' }}>
      <div style={{ position: 'relative', minHeight: 210, background: '#000' }}>
        <video
          ref={videoRef}
          controls
          autoPlay
          playsInline
          preload="auto"
          aria-label={`${i18nT('播放')} ${course?.title || course?.filename || ''}`.trim()}
          style={{ width: '100%', minHeight: 210, display: 'block', background: '#000', maxHeight: 360 }}
          onLoadStart={() => setPhase('loading')}
          onLoadedMetadata={markReady}
          onCanPlay={markReady}
          onPlaying={() => { setPhase('playing'); setSlow(false) }}
          onWaiting={() => setPhase((current) => current === 'error' ? current : 'loading')}
          onStalled={() => setSlow(true)}
          onEnded={onEnded}
          onError={(event) => {
            setPhase('error')
            setSlow(false)
            setErrorMessage(mediaErrorMessage(event.currentTarget.error?.code))
          }}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>

        {phase === 'loading' && (
          <div
            role="status"
            aria-live="polite"
            style={{
              position: 'absolute', left: '50%', top: '45%', transform: 'translate(-50%, -50%)',
              maxWidth: '88%', padding: '9px 14px', borderRadius: 999,
              background: 'rgba(8,12,24,0.82)', color: 'rgba(255,255,255,0.9)',
              fontSize: 12.5, textAlign: 'center', pointerEvents: 'none',
            }}
          >
            {slow
              ? i18nT('视频文件较大，正在继续加载…')
              : i18nT('正在加载视频，首次播放可能需要 15–20 秒…')}
          </div>
        )}

        {phase === 'error' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 10,
            background: 'rgba(8,12,24,0.92)', color: 'rgba(255,255,255,0.9)', padding: 20,
          }}>
            <div role="alert" style={{ fontSize: 13.5, textAlign: 'center' }}>{errorMessage}</div>
            <button
              type="button"
              onClick={retry}
              style={{
                border: '1px solid rgba(90,200,250,0.55)', borderRadius: 999,
                background: 'rgba(90,200,250,0.16)', color: '#9addff',
                padding: '7px 15px', cursor: 'pointer', fontSize: 12.5,
              }}
            >
              {i18nT('重新加载并播放')}
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: '7px 12px 8px', textAlign: 'right', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'rgba(140,215,255,0.85)', fontSize: 11.5, textDecoration: 'none' }}
        >
          {i18nT('无法播放？在新窗口打开视频')} ↗
        </a>
      </div>
    </div>
  )
}
