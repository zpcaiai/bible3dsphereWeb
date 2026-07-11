// MinutesModal — 通话结束后的 AI 纪要：转写预览 → 生成要点+代祷事项 → 一键存祷告墙。
import { useState } from 'react'
import { API_BASE, submitPrayer } from '../api'
import { getToken } from '../auth'
import { getTranscript, clearNotes } from './callNotes'
import { t } from '../i18n/runtime'
import { a11yClickProps } from '../lib/a11yClick';

const toast = (m, ty = 'info') => window.showToast?.(m, ty)

export default function MinutesModal({ title, onClose }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [savedIdx, setSavedIdx] = useState({})
  const transcript = getTranscript()

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/call/minutes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, title }),
      })
      const json = await res.json()
      if (json.success) {
        setResult(json.data)
        // 持久化到「历史纪要」（小组中心可回看；未登录/失败静默）
        const tok = getToken()
        if (tok) {
          fetch(`${API_BASE}/minutes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
            body: JSON.stringify({ title, summary: json.data.summary, prayer_items: json.data.prayerItems || [] }),
          }).catch(() => {})
        }
      }
      else toast(json.error || t('生成失败'), 'error')
    } catch { toast(t('网络错误，请稍后再试'), 'error') }
    finally { setLoading(false) }
  }

  async function savePrayer(text, i) {
    try {
      await submitPrayer(text, false, getToken(), false)
      setSavedIdx((m) => ({ ...m, [i]: true }))
      toast(t('已存入祷告墙 🙏'), 'success')
    } catch (e) { toast(e.message || t('保存失败'), 'error') }
  }

  async function saveAll() {
    const items = (result?.prayerItems || []).map((x, i) => [x, i]).filter(([, i]) => !savedIdx[i])
    if (!items.length) return
    let ok = 0
    for (const [text, i] of items) {
      try {
        await submitPrayer(text, false, getToken(), false)
        setSavedIdx((m) => ({ ...m, [i]: true }))
        ok++
      } catch { /* 单条失败不中断 */ }
    }
    toast(`🙏 ${ok}/${items.length} ${t('条已存入祷告墙')}`, ok === items.length ? 'success' : 'info')
  }

  function copyAll() {
    const text = result
      ? `${title || t('聚会纪要')}\n\n${result.summary}\n\n${t('代祷事项')}：\n${(result.prayerItems || []).map((x) => `· ${x}`).join('\n')}`
      : transcript
    navigator.clipboard?.writeText(text).then(() => toast(t('已复制'), 'success')).catch(() => {})
  }

  function close() { clearNotes(); onClose?.() }

  return (
    <div style={S.overlay} onClick={close} {...a11yClickProps(close)}>
      <div style={S.card} onClick={(e) => e.stopPropagation()} {...a11yClickProps((e) => e.stopPropagation())}>
        <div style={S.head}>
          <span style={{ fontWeight: 700 }}>{t('📝 聚会纪要')}{title ? ` · ${title}` : ''}</span>
          <button style={S.x} onClick={close}>×</button>
        </div>

        {!result && (
          <>
            <div style={S.label}>{t('本次通话记录（仅你本端的发言）')}</div>
            <div style={S.transcript}>{transcript || t('（空）')}</div>
            <button style={S.primary} disabled={loading || transcript.length < 20} onClick={generate}>
              {loading ? t('✨ AI 整理中…') : t('✨ 生成纪要与代祷清单')}
            </button>
          </>
        )}

        {result && (
          <>
            <div style={S.label}>{t('要点纪要')}{result.source === 'template' ? t('（自动摘录）') : ''}</div>
            <div style={S.summary}>{result.summary}</div>
            {(result.prayerItems || []).length > 0 && (
              <>
                <div style={S.label}>🙏 {t('代祷事项（点击单条存入，或一键全存）')}</div>
                {result.prayerItems.map((item, i) => (
                  <button key={i} style={{ ...S.prayerItem, opacity: savedIdx[i] ? 0.55 : 1 }}
                    disabled={savedIdx[i]} onClick={() => savePrayer(item, i)}>
                    {savedIdx[i] ? '✅ ' : '· '}{item}
                  </button>
                ))}
                <button style={S.saveAll} onClick={saveAll}
                  disabled={result.prayerItems.every((_, i) => savedIdx[i])}>
                  {t('🙏 全部存入祷告墙')}
                </button>
              </>
            )}
          </>
        )}

        <div style={S.btns}>
          <button style={S.ghost} onClick={copyAll}>{t('📋 复制')}</button>
          <button style={S.ghost} onClick={close}>{t('完成')}</button>
        </div>
      </div>
    </div>
  )
}

const S = {
  overlay: { position: 'fixed', inset: 0, zIndex: 1350, background: 'rgba(5,7,14,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, boxSizing: 'border-box' },
  card: { width: 'min(440px, 100%)', maxHeight: '88vh', overflowY: 'auto', background: '#141826', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 18, boxSizing: 'border-box', color: '#fff' },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, fontSize: 15 },
  x: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 22, cursor: 'pointer', lineHeight: 1 },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '10px 0 6px' },
  transcript: { maxHeight: 180, overflowY: 'auto', whiteSpace: 'pre-wrap', fontSize: 12.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.7)', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, marginBottom: 12 },
  summary: { whiteSpace: 'pre-wrap', fontSize: 13.5, lineHeight: 1.8, color: 'rgba(255,255,255,0.9)', background: 'rgba(232,176,75,0.08)', border: '1px solid rgba(232,176,75,0.25)', borderRadius: 10, padding: 12 },
  prayerItem: { display: 'block', width: '100%', textAlign: 'left', background: 'rgba(125,211,252,0.08)', border: '1px solid rgba(125,211,252,0.25)', borderRadius: 10, padding: '9px 12px', color: 'rgba(255,255,255,0.88)', fontSize: 13, lineHeight: 1.6, cursor: 'pointer', marginBottom: 7, fontFamily: 'inherit' },
  btns: { display: 'flex', gap: 10, marginTop: 14 },
  ghost: { flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 11, padding: '10px 0', color: '#fff', fontSize: 14, cursor: 'pointer' },
  primary: { display: 'block', width: '100%', background: '#e8b04b', border: 'none', borderRadius: 11, padding: '12px 0', color: '#2a1d05', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  saveAll: { display: 'block', width: '100%', marginTop: 4, background: 'rgba(52,199,89,0.2)', border: '1px solid rgba(52,199,89,0.5)', borderRadius: 11, padding: '11px 0', color: '#7ee2a0', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' },
}
