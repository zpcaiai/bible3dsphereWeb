// SharedPrayerPage — 代祷分享公开页（/p/{token}），无需登录。
// 朋友打开链接即可看到这条代祷并「🙏 同心代祷」，仅在服务端 200 OK 后确认计数与本地记录。
import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchSharedPrayer, amenSharedPrayer } from './api'
import { t } from './i18n/runtime'

const AMENED_KEY = 'shared-prayer-amened-v1'

function loadAmened() {
  try { return new Set(JSON.parse(localStorage.getItem(AMENED_KEY) || '[]')) } catch { return new Set() }
}

function persistAmenedToken(token) {
  try {
    const s = loadAmened()
    s.add(token)
    localStorage.setItem(AMENED_KEY, JSON.stringify([...s]))
  } catch { /* storage quota or privacy mode */ }
}

function isNotFoundLoadError(err) {
  if (!err) return false
  if (err.status === 404) return true
  if (typeof err.status === 'number' && err.status !== 404) return false
  const msg = String(err.message || err || '')
  return /not\s*found|404|不存在|已被删除/i.test(msg)
}

export default function SharedPrayerPage({ shareToken }) {
  const [prayer, setPrayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [amened, setAmened] = useState(() => loadAmened().has(shareToken))
  const [submitting, setSubmitting] = useState(false)
  const [amenErr, setAmenErr] = useState('')
  const submittingRef = useRef(false)

  const loadPrayer = useCallback(async () => {
    setLoading(true)
    setLoadErr('')
    setNotFound(false)
    try {
      const data = await fetchSharedPrayer(shareToken)
      setPrayer(data)
    } catch (e) {
      setPrayer(null)
      if (isNotFoundLoadError(e)) {
        setNotFound(true)
      } else {
        setLoadErr(String(e?.message || e || t('暂时无法加载代祷，请稍后重试。')))
      }
    } finally {
      setLoading(false)
    }
  }, [shareToken])

  useEffect(() => {
    setAmened(loadAmened().has(shareToken))
    setAmenErr('')
    submittingRef.current = false
    setSubmitting(false)
    void loadPrayer()
  }, [shareToken, loadPrayer])

  async function handleAmen() {
    if (amened || submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setAmenErr('')
    try {
      const res = await amenSharedPrayer(shareToken)
      setPrayer((prev) => {
        if (!prev) return prev
        const confirmedCount = res?.amen_count ?? ((prev.amen_count || 0) + 1)
        return { ...prev, amen_count: confirmedCount }
      })
      setAmened(true)
      persistAmenedToken(shareToken)
    } catch (e) {
      setAmenErr(String(e?.message || e || t('代祷确认失败，请稍后重试。')))
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const card = {
    width: '100%', maxWidth: 480, borderRadius: 18, padding: '26px 24px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    boxShadow: '0 18px 48px rgba(0,0,0,0.45)', boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, overflowY: 'auto',
      background: 'radial-gradient(ellipse at 50% 0%, #16233b 0%, #0a1020 65%)',
      color: '#fff', fontFamily: 'inherit',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '46px 18px 40px', boxSizing: 'border-box',
    }}>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 18, letterSpacing: '0.08em' }}>
        🌍 {t("属灵星球 · 代祷邀请")}
      </div>

      {notFound && !loading && (
        <div data-testid="shared-prayer-not-found" style={{ ...card, textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.8 }}>
          {t("这条代祷不存在或已被删除。")}
        </div>
      )}

      {loadErr && !notFound && !loading && (
        <div data-testid="shared-prayer-load-error" role="alert" style={{ ...card, textAlign: 'center', color: '#ffb4b4', fontSize: 14, lineHeight: 1.8 }}>
          <div>{t("暂时无法加载这条代祷，请检查网络后重试。")}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{loadErr}</div>
          <button
            type="button"
            data-testid="shared-prayer-load-retry"
            onClick={() => void loadPrayer()}
            style={{
              marginTop: 14, padding: '8px 18px', borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.1)',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {t("重新加载")}
          </button>
        </div>
      )}

      {loading && !prayer && (
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, padding: '60px 0' }}>{t("加载中…")}</div>
      )}

      {prayer && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #3a6df0, #8e54e9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700,
            }}>
              {(prayer.nickname || '?').slice(0, 1)}
            </div>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 700 }}>{prayer.nickname}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                {(prayer.created_at || '').slice(0, 10)}
                {prayer.status === 'answered' && <span style={{ marginLeft: 8, color: '#ffd60a' }}>✨ {t("已蒙应允")}</span>}
              </div>
            </div>
          </div>

          <p style={{ margin: '0 0 18px', fontSize: 15.5, lineHeight: 1.9, color: 'rgba(255,255,255,0.92)', whiteSpace: 'pre-wrap' }}>
            {prayer.content}
          </p>

          <button
            type="button"
            onClick={handleAmen}
            disabled={amened || submitting}
            style={{
              width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
              background: amened ? 'rgba(232,163,61,0.25)' : 'linear-gradient(135deg, #e8a33d, #d97f1e)',
              color: amened ? '#ffd9a0' : '#241400', fontSize: 15, fontWeight: 700,
              opacity: submitting ? 0.72 : 1,
              cursor: (amened || submitting) ? 'default' : 'pointer', fontFamily: 'inherit',
            }}
          >
            🙏 {amened ? t("已与他同心代祷") : submitting ? t("正在代祷…") : t("同心代祷")}
            {prayer.amen_count > 0 && (
              <span data-testid="shared-prayer-amen-count" style={{ marginLeft: 8, fontWeight: 600, opacity: 0.8 }}>
                {prayer.amen_count}{t(" 人")}
              </span>
            )}
          </button>

          {amenErr && (
            <div data-testid="shared-prayer-amen-error" role="alert" style={{ marginTop: 10, fontSize: 12.5, color: '#ffb4b4', textAlign: 'center' }}>
              <span>{amenErr}</span>
              <button
                type="button"
                data-testid="shared-prayer-amen-retry"
                onClick={handleAmen}
                style={{
                  marginLeft: 8, background: 'none', border: 'none',
                  color: '#7dd3fc', textDecoration: 'underline', cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit',
                }}
              >
                {t("重试")}
              </button>
            </div>
          )}
        </div>
      )}

      <a
        href="/"
        style={{
          marginTop: 26, fontSize: 13.5, color: '#7dd3fc', textDecoration: 'none',
          border: '1px solid rgba(125,211,252,0.35)', borderRadius: 999, padding: '9px 22px',
          background: 'rgba(125,211,252,0.08)',
        }}
      >
        {t("✨ 进入属灵星球，写下你的代祷")}
      </a>
    </div>
  )
}
