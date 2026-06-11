// VoicemailModal — 未接来电留言：语音实时转写为文字（或直接打字），经聊天送达对方。
import { useEffect, useState } from 'react'
import realtimeStore from './realtimeStore'
import { startNotes, stopNotes, getTranscript, clearNotes, getState, subscribe, isSupported } from './callNotes'
import { getRuntimeLang, t } from '../i18n/runtime'

const toast = (m, ty = 'info') => window.showToast?.(m, ty)

export default function VoicemailModal({ peer, onClose }) {
  const [text, setText] = useState('')
  const [rec, setRec] = useState(getState().active)

  useEffect(() => subscribe((st) => {
    setRec(st.active)
    const tr = getTranscript()
    if (tr) setText(tr)
  }), [])

  useEffect(() => () => { stopNotes(); clearNotes() }, [])

  function toggleRec() {
    if (rec) { stopNotes(); return }
    if (!isSupported()) { toast(t('此浏览器不支持语音转写，可直接打字'), 'info'); return }
    clearNotes()
    startNotes(getRuntimeLang() === 'en' ? 'en-US' : 'zh-CN')
  }

  function send() {
    const body = `📩 ${t('留言')}：${text.trim()}`.slice(0, 3900)
    if (!text.trim()) return
    const ok = realtimeStore.send({ type: 'chat', to: peer.email, body, client_id: 'vm-' + Date.now() })
    if (ok) { toast(t('留言已送达，对方上线即可看到'), 'success'); close() }
    else toast(t('连接断开，留言发送失败'), 'error')
  }

  function close() { stopNotes(); clearNotes(); realtimeStore.clearMissed(); onClose?.() }

  return (
    <div style={S.overlay} onClick={close}>
      <div style={S.card} onClick={(e) => e.stopPropagation()}>
        <div style={S.head}>
          <span style={{ fontWeight: 700 }}>📩 {t('给')} {peer.name || peer.email} {t('留言')}</span>
          <button style={S.x} onClick={close}>×</button>
        </div>
        <div style={S.hint}>{t('对方未接听。说一段话（自动转写）或直接打字，留言会出现在你们的聊天里。')}</div>
        <textarea
          style={S.area} rows={5} value={text} maxLength={3800}
          placeholder={rec ? t('正在聆听…说完点「停止」') : t('点 🎙 开始说话，或直接输入')}
          onChange={(e) => setText(e.target.value)}
        />
        <div style={S.btns}>
          <button style={{ ...S.ghost, ...(rec ? { background: 'rgba(255,107,107,0.25)', borderColor: '#ff6b6b' } : {}) }}
            onClick={toggleRec}>
            {rec ? t('⏹ 停止') : t('🎙 说话')}
          </button>
          <button style={S.primary} disabled={!text.trim()} onClick={send}>{t('发送留言')}</button>
        </div>
      </div>
    </div>
  )
}

const S = {
  overlay: { position: 'fixed', inset: 0, zIndex: 1350, background: 'rgba(5,7,14,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, boxSizing: 'border-box' },
  card: { width: 'min(400px, 100%)', background: '#141826', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 18, boxSizing: 'border-box', color: '#fff' },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, fontSize: 15 },
  x: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 22, cursor: 'pointer', lineHeight: 1 },
  hint: { fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 10 },
  area: { width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, padding: '11px 13px', color: '#fff', fontSize: 14, lineHeight: 1.7, fontFamily: 'inherit', outline: 'none', resize: 'vertical' },
  btns: { display: 'flex', gap: 10, marginTop: 12 },
  ghost: { flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 11, padding: '11px 0', color: '#fff', fontSize: 14, cursor: 'pointer' },
  primary: { flex: 1.4, background: '#e8b04b', border: 'none', borderRadius: 11, padding: '11px 0', color: '#2a1d05', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
}
