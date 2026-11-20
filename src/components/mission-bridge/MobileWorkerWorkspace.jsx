import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchMobileWorkerDashboard,
  requestMobileWorkerCallback,
  updateMobileWorkerAudioProgress,
  updateMobileWorkerProfile,
} from '../../missionBridgeApi'
import { t } from '../../i18n/runtime'
import { speakOnce, stopAllAudio } from '../../useGlobalAudio'
import './mobileWorkerWorkspace.css'
import GuidedInput from './GuidedInput'

const CITY_OPTIONS = ['上海', '北京', '广州', '深圳', '成都', '杭州']

export default function MobileWorkerWorkspace({ token }) {
  const [data, setData] = useState({ audio: [], safety: [] })
  const [profile, setProfile] = useState({
    workerType: 'ride_hailing',
    cityCode: 'Shanghai',
    drivingMode: false,
  })
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [playingId, setPlayingId] = useState(null)
  const busyRef = useRef(false)
  const audioElRef = useRef(null)
  const playRevisionRef = useRef(0)

  const stopActiveAudio = useCallback(() => {
    playRevisionRef.current += 1
    if (audioElRef.current) {
      try {
        audioElRef.current.onended = null
        audioElRef.current.onerror = null
        audioElRef.current.pause?.()
        audioElRef.current.src = ''
      } catch {
        // Ignore teardown errors on HTMLAudioElement.
      }
      audioElRef.current = null
    }
    try {
      stopAllAudio()
    } catch {
      // Ignore global singleton teardown errors.
    }
    try {
      globalThis.speechSynthesis?.cancel?.()
    } catch {
      // Ignore speechSynthesis cancel errors in headless environments.
    }
    setPlayingId(null)
  }, [])

  const load = useCallback(
    () =>
      fetchMobileWorkerDashboard(token)
        .then((value) => {
          setData(value || { audio: [], safety: [] })
          setProfile((old) => ({ ...old, drivingMode: Boolean(value?.drivingMode) }))
        })
        .catch((e) => setError(e.message)),
    [token],
  )

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => () => stopActiveAudio(), [stopActiveAudio])

  const run = async (action, message) => {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError('')
    try {
      await action()
      setNotice(message)
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  const setDriving = (checked) => {
    const next = { ...profile, drivingMode: checked }
    setProfile(next)
    void run(
      () => updateMobileWorkerProfile(token, next),
      checked ? t('已进入驾驶纯音频模式') : t('已退出驾驶模式'),
    )
  }

  const togglePlayItem = async (item) => {
    if (!item) return
    if (playingId === item.id) {
      const currentPos = Math.floor(Number(audioElRef.current?.currentTime || item.positionSeconds || 0))
      stopActiveAudio()
      if (currentPos > 0) {
        updateMobileWorkerAudioProgress(token, item.id, {
          positionSeconds: currentPos,
          completed: false,
        }).catch(() => {})
      }
      return
    }

    stopActiveAudio()
    const rev = ++playRevisionRef.current
    setPlayingId(item.id)
    setError('')

    const directUrl = item.audioUrl || item.url || ''
    if (directUrl && typeof globalThis.Audio === 'function') {
      try {
        const audio = new globalThis.Audio(directUrl)
        audioElRef.current = audio
        if (Number(item.positionSeconds) > 0) {
          try {
            audio.currentTime = Number(item.positionSeconds)
          } catch {
            // Some browsers defer currentTime seek until metadata loads.
          }
        }
        audio.onended = () => {
          if (playRevisionRef.current !== rev) return
          audioElRef.current = null
          setPlayingId(null)
          updateMobileWorkerAudioProgress(token, item.id, {
            positionSeconds: Math.max(Number(item.positionSeconds || 0), Number(item.durationMinutes || 3) * 60),
            completed: true,
          })
            .then(() => load())
            .catch(() => {})
        }
        audio.onerror = () => {
          if (playRevisionRef.current !== rev) return
          audioElRef.current = null
          const fallbackText = [item.title, item.scriptureText || item.scripture, item.prompt || item.summary]
            .filter(Boolean)
            .join('。')
          void speakOnce(fallbackText || item.title, { rate: 0.95 }).finally(() => {
            if (playRevisionRef.current === rev) setPlayingId(null)
          })
        }
        const playPromise = audio.play?.()
        if (playPromise && typeof playPromise.then === 'function') {
          await playPromise
        }
        return
      } catch {
        audioElRef.current = null
        // Fall through to TTS / speechSynthesis narration when direct audio stream is unavailable.
      }
    }

    const narrationText = [
      item.title,
      item.scriptureText || item.scripture,
      item.prompt || item.summary || item.transcript,
    ]
      .filter(Boolean)
      .join('。')
    let deferredToUtterance = false
    try {
      const outcome = await speakOnce(narrationText || item.title || t('同行音频'), { rate: 0.95 })
      if (
        outcome === 'skipped'
        && typeof globalThis.speechSynthesis?.speak === 'function'
        && typeof globalThis.SpeechSynthesisUtterance === 'function'
      ) {
        const utterance = new globalThis.SpeechSynthesisUtterance(narrationText || item.title)
        utterance.onend = () => {
          if (playRevisionRef.current === rev) setPlayingId(null)
        }
        utterance.onerror = () => {
          if (playRevisionRef.current === rev) setPlayingId(null)
        }
        deferredToUtterance = true
        globalThis.speechSynthesis.speak(utterance)
        return
      }
    } finally {
      if (!deferredToUtterance && playRevisionRef.current === rev) {
        setPlayingId(null)
      }
    }
  }

  return (
    <section className={`mb-mobile-worker ${profile.drivingMode ? 'driving' : ''}`}>
      <header>
        <div>
          <strong>{profile.drivingMode ? t('驾驶纯音频模式') : t('司机同行')}</strong>
          <span>{t('3、5、7 分钟内容 · 自动断点续播')}</span>
        </div>
        <label>
          <input
            type="checkbox"
            disabled={busy}
            checked={profile.drivingMode}
            onChange={(e) => setDriving(e.target.checked)}
          />
          {t('正在驾驶')}
        </label>
      </header>
      <div className="mb-mobile-safety">
        {(data.safety || []).map((item) => (
          <span key={item}>✓ {item}</span>
        ))}
      </div>
      {error && <div className="mb-alert error" role="alert">{error}</div>}
      {notice && <div className="mb-alert success" role="status">{notice}</div>}
      <div className="mb-mobile-audio">
        {!(data.audio || []).length ? (
          <div className="mb-state">{t('暂无已审核音频')}</div>
        ) : (
          data.audio.map((item) => {
            const isPlaying = playingId === item.id
            return (
              <div key={item.id}>
                <button
                  type="button"
                  data-testid={`mobile-worker-play-${item.id}`}
                  aria-label={isPlaying ? t('停止播放') : t('播放')}
                  aria-pressed={isPlaying}
                  onClick={() => void togglePlayItem(item)}
                >
                  {isPlaying ? '⏹' : '▶'}
                </button>
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.durationMinutes} min · {item.positionSeconds}s
                  </small>
                </span>
                <button
                  type="button"
                  disabled={busy}
                  aria-label={t('标记完成')}
                  onClick={() =>
                    void run(
                      () =>
                        updateMobileWorkerAudioProgress(token, item.id, {
                          positionSeconds: item.positionSeconds,
                          completed: true,
                        }),
                      t('已完成'),
                    )
                  }
                >
                  ✓
                </button>
              </div>
            )
          })
        )}
      </div>
      <button
        type="button"
        className="mb-callback"
        disabled={busy}
        onClick={() => void run(() => requestMobileWorkerCallback(token), t('已标记稍后联系'))}
      >
        {t('稍后联系')}
      </button>
      {!profile.drivingMode && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void run(() => updateMobileWorkerProfile(token, profile), t('城市与工作类型已更新'))
          }}
        >
          <select
            value={profile.workerType}
            onChange={(e) => setProfile({ ...profile, workerType: e.target.value })}
          >
            <option value="delivery">{t('外卖员')}</option>
            <option value="courier">{t('快递员')}</option>
            <option value="ride_hailing">{t('网约车司机')}</option>
            <option value="freight">{t('货运司机')}</option>
          </select>
          <GuidedInput
            options={CITY_OPTIONS}
            required
            minLength={2}
            value={profile.cityCode}
            onChange={(cityCode) => setProfile({ ...profile, cityCode })}
            placeholder={t('只填写城市')}
            aria-label={t('只填写城市')}
          />
          <button type="submit" disabled={busy}>
            {t('更新所在城市')}
          </button>
        </form>
      )}
    </section>
  )
}
