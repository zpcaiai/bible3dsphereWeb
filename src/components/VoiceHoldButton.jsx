import { useCallback, useRef, useState } from 'react'
import { t } from '../i18n/runtime'

const CANCEL_DISTANCE_PX = 56

function buttonLabel({ isRecording, isPressed, isCancelling, isTranscribing, compact }) {
  if (isTranscribing) return t('正在转文字…')
  if (isRecording && isCancelling) return t('松开取消')
  if (isRecording) return compact ? t('松开发送') : t('松开发送')
  if (isPressed) return t('准备录音…')
  return compact ? t('按住说') : t('按住说话')
}

function overlayTitle(isCancelling) {
  return isCancelling ? t('松开取消') : t('松开发送')
}

export default function VoiceHoldButton({
  speech,
  disabled = false,
  compact = false,
  variant = 'home',
  className = '',
  style,
  showOverlay = true,
  onHoldStart,
  onHoldEnd,
  onHoldCancel,
  clearBeforeStart,
  holdToStartMs = 120,
}) {
  const [isPressed, setIsPressed] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [hint, setHint] = useState('')
  const pointerIdRef = useRef(null)
  const startYRef = useRef(0)
  const holdActiveRef = useRef(false)
  const startedRef = useRef(false)
  const startTimerRef = useRef(null)

  const isRecording = Boolean(speech?.isRecording)
  const isTranscribing = Boolean(speech?.isTranscribing)
  const recordingSeconds = speech?.recordingSeconds || 0
  const maxRecordingSeconds = speech?.maxRecordingSeconds || 120
  const isBusy = disabled || isTranscribing
  const progress = Math.min(100, (recordingSeconds / maxRecordingSeconds) * 100)

  const clearStartTimer = useCallback(() => {
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current)
      startTimerRef.current = null
    }
  }, [])

  const startActualRecording = useCallback(async () => {
    if (startedRef.current || isBusy || !holdActiveRef.current) return
    startedRef.current = true
    clearBeforeStart?.()
    onHoldStart?.()
    const ok = await speech?.startRecording?.()
    if (!ok) {
      startedRef.current = false
      holdActiveRef.current = false
      setIsPressed(false)
      onHoldEnd?.()
      return
    }
    if (!holdActiveRef.current) {
      speech?.cancelRecording?.()
      startedRef.current = false
      setIsPressed(false)
      setIsCancelling(false)
      onHoldCancel?.()
    }
  }, [clearBeforeStart, isBusy, onHoldCancel, onHoldEnd, onHoldStart, speech])

  const beginHold = useCallback((clientY, pointerId, target) => {
    if (isBusy) return
    clearStartTimer()
    pointerIdRef.current = pointerId ?? null
    startYRef.current = clientY || 0
    holdActiveRef.current = true
    startedRef.current = false
    setIsPressed(true)
    setIsCancelling(false)
    setHint(t('上滑取消'))
    try {
      if (pointerId != null) target?.setPointerCapture?.(pointerId)
    } catch {
      // pointer capture is best-effort only
    }
    startTimerRef.current = setTimeout(() => {
      startTimerRef.current = null
      startActualRecording()
    }, holdToStartMs)
  }, [clearStartTimer, holdToStartMs, isBusy, startActualRecording])

  const finishHold = useCallback((cancel = false) => {
    clearStartTimer()
    const shouldCancel = cancel || isCancelling
    const hadStarted = startedRef.current || isRecording

    holdActiveRef.current = false
    setIsPressed(false)
    setIsCancelling(false)
    pointerIdRef.current = null
    startedRef.current = false

    if (!hadStarted) {
      setHint(t('按住说话，松开后自动转文字'))
      return
    }

    if (shouldCancel) {
      speech?.cancelRecording?.()
      onHoldCancel?.()
      setHint(t('已取消'))
    } else {
      speech?.stopRecording?.()
      onHoldEnd?.()
      setHint(t('正在转文字…'))
    }
  }, [clearStartTimer, isCancelling, isRecording, onHoldCancel, onHoldEnd, speech])

  const handlePointerDown = (event) => {
    if (event.button != null && event.button !== 0) return
    if (event.pointerType === 'mouse' && event.buttons !== 1) return
    event.preventDefault()
    beginHold(event.clientY, event.pointerId, event.currentTarget)
  }

  const handlePointerMove = (event) => {
    if (!isPressed) return
    const nextCancelling = startYRef.current - event.clientY > CANCEL_DISTANCE_PX
    if (nextCancelling !== isCancelling) setIsCancelling(nextCancelling)
  }

  const handlePointerUp = (event) => {
    event.preventDefault()
    finishHold(false)
  }

  const handlePointerCancel = () => {
    finishHold(true)
  }

  const handleKeyDown = (event) => {
    if (event.repeat) return
    if (event.key !== ' ' && event.key !== 'Enter') return
    event.preventDefault()
    beginHold(0, null, event.currentTarget)
  }

  const handleKeyUp = (event) => {
    if (event.key !== ' ' && event.key !== 'Enter') return
    event.preventDefault()
    finishHold(false)
  }

  const label = buttonLabel({
    isRecording,
    isPressed,
    isCancelling,
    isTranscribing,
    compact,
  })

  const homeStyle = {
    minHeight: 48,
    minWidth: 168,
    padding: '0 20px',
    borderRadius: 24,
    border: isCancelling ? '1px solid rgba(255, 215, 0, 0.65)' : '1px solid rgba(255,255,255,0.18)',
    background: isCancelling
      ? 'linear-gradient(135deg, #ff9500, #ffcc00)'
      : isRecording
        ? 'linear-gradient(135deg, #ff3b30, #ff6b6b)'
        : isTranscribing
          ? 'linear-gradient(135deg, #34c759, #30d158)'
          : 'linear-gradient(135deg, #007aff, #5e5ce6)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: isBusy ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: isRecording
      ? '0 0 14px rgba(255, 59, 48, 0.55)'
      : '0 8px 22px rgba(0, 122, 255, 0.24)',
    opacity: isBusy ? 0.58 : 1,
    transition: 'background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
  }

  const compactStyle = {
    width: 44,
    height: 44,
    flex: '0 0 44px',
    border: 'none',
    cursor: isBusy ? 'not-allowed' : 'pointer',
    borderRadius: 12,
    padding: 0,
    fontSize: 18,
    lineHeight: 1,
    background: isCancelling
      ? 'rgba(255, 149, 0, 0.28)'
      : isRecording
        ? 'rgba(255, 100, 100, 0.28)'
        : isTranscribing
          ? 'rgba(52, 199, 89, 0.22)'
          : 'rgba(42,51,88,0.45)',
    color: isRecording ? '#ff9d9d' : 'rgba(232,238,255,0.82)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isBusy ? 0.58 : 1,
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
  }

  return (
    <>
      {showOverlay && isRecording && (
        <div style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          width: 220,
          maxWidth: 'calc(100vw - 48px)',
          background: isCancelling ? 'rgba(86, 57, 8, 0.9)' : 'rgba(8, 12, 22, 0.88)',
          border: isCancelling ? '1px solid rgba(255, 204, 0, 0.45)' : '1px solid rgba(255,255,255,0.16)',
          borderRadius: 18,
          padding: '24px 22px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          pointerEvents: 'none',
          boxShadow: '0 24px 70px rgba(0,0,0,0.38)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: isCancelling ? 'rgba(255, 204, 0, 0.16)' : 'rgba(255, 59, 48, 0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 34,
            animation: 'pulse 1.1s ease-in-out infinite',
          }}>
            {isCancelling ? '↩' : '🎙'}
          </div>
          <div style={{ color: '#fff', fontSize: 15, fontWeight: 800 }}>{overlayTitle(isCancelling)}</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12.5 }}>
            {recordingSeconds}s / {maxRecordingSeconds}s · {t('上滑取消')}
          </div>
          <div style={{
            width: '100%',
            height: 5,
            background: 'rgba(255,255,255,0.18)',
            borderRadius: 999,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: recordingSeconds > maxRecordingSeconds - 20 ? '#ffcc00' : '#34c759',
              transition: 'width 0.4s linear',
            }} />
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label={t('按住说话，松开后自动转文字')}
        aria-pressed={isRecording}
        disabled={isBusy}
        title={isBusy ? t('正在转文字…') : t('按住说话，松开后自动转文字')}
        className={`${className} ${isRecording ? 'guardian-rec-pulse' : ''}`.trim()}
        data-voice-variant={variant}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={() => {
          if (pointerIdRef.current != null && isPressed) finishHold(true)
        }}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        style={{ ...(compact ? compactStyle : homeStyle), ...style }}
      >
        <span aria-hidden="true">{isTranscribing ? '…' : isRecording ? '●' : '🎤'}</span>
        {!compact && (
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
            <span>{label}</span>
            <span style={{ fontSize: 10.5, fontWeight: 600, opacity: 0.82 }}>
              {isRecording ? `${recordingSeconds}s · ${isCancelling ? t('松开取消') : t('上滑取消')}` : hint || t('松开后自动转文字')}
            </span>
          </span>
        )}
      </button>
    </>
  )
}
