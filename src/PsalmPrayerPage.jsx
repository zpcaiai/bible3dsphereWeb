import { t as i18nT } from './i18n/runtime'
/**
 * PsalmPrayerPage — 诗篇祷告 Psalm Prayer
 *
 * 选择当下的情绪 → 推荐诗篇 → 选篇与祷告模式 → 一步步动作祷告 → 顺服或安息。
 * 哀歌不强求正能量；自由文本若流露危机会温柔提示。入口：今日心镜 (SoulDashboard)。
 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import {
  fetchPsalms, recommendPsalms, createPsalmSession,
  submitPsalmMovement, completePsalmSession,
} from './api'
import { getToken } from './auth'

const MODES = [
  { key: 'guided', label: '随经文引导' }, { key: 'lament', label: '哀歌' },
  { key: 'praise', label: '赞美' }, { key: 'confession', label: '认罪' },
  { key: 'trust', label: '信靠' },
]
const MOVE_TITLE = {
  address_god: '称呼神', honest_complaint: '诚实倾诉', honest_confession: '如实认罪',
  name_fear: '说出惧怕', ask_help: '向神求助', ask_mercy: '求怜悯',
  remember_truth: '想起真理', receive_grace: '领受恩典', praise: '赞美神',
  thanksgiving: '献上感恩', confess_trust: '表达信靠', vow_obedience: '回应顺服', rest: '安息',
}
const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { display: 'block', width: '100%', cursor: 'pointer', borderRadius: 12, padding: '12px 16px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(125,211,252,0.85), rgba(139,92,246,0.7))' }

function friendlyError(e, fb) { const m = e?.message || ''; return /[一-龥]/.test(m) ? m : (fb || '网络不稳定，请稍后重试') }

export default function PsalmPrayerPage({ user, onBack }) {
  const [emotion, setEmotion] = useState('')
  const [psalms, setPsalms] = useState([])
  const [picked, setPicked] = useState(null)
  const [mode, setMode] = useState('guided')
  const [session, setSession] = useState(null)
  const [movement, setMovement] = useState('')
  const [guidance, setGuidance] = useState('')
  const [text, setText] = useState('')
  const [verse, setVerse] = useState('')
  const [crisis, setCrisis] = useState(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const t = getToken(); if (!t) return
    fetchPsalms(t).then(r => setPsalms(r.psalms || [])).catch((err) => { console.warn('[PsalmPrayerPage.jsx] ignored async error', err) })
  }, [])

  async function recommend() {
    const t = getToken(); if (!t) return
    setBusy(true); setError('')
    try { const r = await recommendPsalms({ emotion, need: emotion }, t); setPsalms(r.psalms || []); setPicked((r.psalms || [])[0] || null) }
    catch (e) { setError(friendlyError(e)) } finally { setBusy(false) }
  }

  async function start() {
    const t = getToken(); if (!t || !picked) return
    setBusy(true); setError('')
    try {
      const r = await createPsalmSession({ psalm_number: picked.psalm_number, mode, emotional_state_before: emotion ? [emotion] : [] }, t)
      setSession(r.session); setMovement(r.movement); setGuidance(r.guidance || ''); setPicked(r.psalm || picked); setCrisis(null); setText('')
    } catch (e) { setError(friendlyError(e, '开始祷告失败')) } finally { setBusy(false) }
  }

  async function next() {
    const t = getToken(); if (!t || !session) return
    setBusy(true); setError('')
    try {
      const r = await submitPsalmMovement(session.id, { movement_key: movement, text }, t)
      setSession(r.session); setMovement(r.movement); setGuidance(r.guidance || ''); setCrisis(r.crisis || null); setText('')
    } catch (e) { setError(friendlyError(e, '保存失败')) } finally { setBusy(false) }
  }

  async function finish() {
    const t = getToken(); if (!t || !session) return
    setBusy(true); setError('')
    try {
      const r = await completePsalmSession(session.id, { obedience_or_rest_step: text, key_verse: verse, emotional_state_after: [] }, t)
      setSession(r.session); setCrisis(r.crisis || null); setDone(true)
    } catch (e) { setError(friendlyError(e, '完成失败')) } finally { setBusy(false) }
  }

  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }

  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('🎵 诗篇祷告 · Psalm Prayer')}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>{i18nT('在神面前诚实，又被经文重新定位 · 哀歌不必假装坚强')}</div>

      {error && <div style={{ ...card, borderColor: 'rgba(255,107,107,0.4)', color: '#ffb4b4' }}>{error}</div>}
      {crisis && (
        <div style={{ ...card, background: 'rgba(255,107,107,0.10)', borderColor: 'rgba(255,107,107,0.35)' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>💗 {crisis.message}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{crisis.note}</div>
        </div>
      )}

      {/* 选篇 */}
      {!session && (
        <div style={card}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input value={emotion} onChange={e => setEmotion(e.target.value)} placeholder={i18nT('此刻的情绪 / 需要（如：焦虑、愧疚、感恩…）')}
              style={{ flex: 1, padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}  aria-label={i18nT('此刻的情绪 / 需要（如：焦虑、愧疚、感恩…）')}/>
            <button style={{ ...btn, width: 'auto', padding: '10px 16px' }} disabled={busy} onClick={recommend}>{i18nT('推荐')}</button>
          </div>
          <select value={picked?.psalm_number || ''} onChange={e => setPicked(psalms.find(p => p.psalm_number === Number(e.target.value)) || null)}
            style={{ width: '100%', padding: 10, borderRadius: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
            <option value="">{i18nT('选择一篇诗篇…')}</option>
            {psalms.map(p => <option key={p.psalm_number} value={p.psalm_number}>{i18nT('诗篇')} {p.psalm_number} · {p.title}</option>)}
          </select>
          {picked && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(255,255,255,0.9)' }}>{picked.text}</div>
              {picked.caution_notes && <div style={{ fontSize: 11, color: '#f5c451', marginTop: 6 }}>⚠ {picked.caution_notes}</div>}
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {MODES.map(m => (
              <button key={m.key} onClick={() => setMode(m.key)}
                style={{ padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontSize: 12,
                  border: mode === m.key ? '1px solid rgba(139,92,246,0.8)' : '1px solid rgba(255,255,255,0.15)',
                  background: mode === m.key ? 'rgba(139,92,246,0.25)' : 'transparent', color: '#fff' }}>{m.label}</button>
            ))}
          </div>
          <button style={btn} disabled={busy || !picked} onClick={start}>{busy ? '…' : '开始祷告'}</button>
        </div>
      )}

      {/* 动作流程 */}
      {session && movement && movement !== 'completed' && !done && (
        <div style={card}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{i18nT('诗篇')} {session.psalm_number} · {session.mode}</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{MOVE_TITLE[movement] || movement}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>{guidance}</div>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder={i18nT('在神面前诚实地写下…')}
            style={{ width: '100%', padding: 10, borderRadius: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', resize: 'vertical' }}  aria-label={i18nT('在神面前诚实地写下…')}/>
          <button style={btn} disabled={busy} onClick={next}>{busy ? '…' : '下一步 ›'}</button>
        </div>
      )}

      {/* 完成表单（最后一步：顺服或安息） */}
      {session && movement === 'completed' && !done && (
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{i18nT('🌱 顺服或安息一步')}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>{i18nT('这篇祷告带你走向的一个具体顺服，或一句你愿安息于其中的真理。')}</div>
          <input value={verse} onChange={e => setVerse(e.target.value)} placeholder={i18nT('今天抓住的一节经文（可选）')}
            style={{ width: '100%', padding: 10, borderRadius: 10, marginBottom: 8, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}  aria-label={i18nT('今天抓住的一节经文（可选）')}/>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder={i18nT('一个微小的顺服，或一句安息的话…')}
            style={{ width: '100%', padding: 10, borderRadius: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', resize: 'vertical' }}  aria-label={i18nT('一个微小的顺服，或一句安息的话…')}/>
          <button style={btn} disabled={busy} onClick={finish}>{busy ? '…' : '完成诗篇祷告'}</button>
        </div>
      )}

      {/* 完成 */}
      {done && session && (
        <div style={card}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{i18nT('🕊 愿这篇诗与你同行')}</div>
          <div style={{ fontSize: 13, marginBottom: 6 }}><b>{i18nT('诗篇：')}</b>{session.psalm_number}</div>
          {session.key_verse && <div style={{ fontSize: 13, marginBottom: 6 }}><b>{i18nT('抓住的话：')}</b>{session.key_verse}</div>}
          {session.obedience_or_rest_step && <div style={{ fontSize: 13, marginBottom: 6 }}><b>{i18nT('顺服 / 安息：')}</b>{session.obedience_or_rest_step}</div>}
          <button style={{ ...btn, marginTop: 12 }} onClick={onBack}>{i18nT('返回')}</button>
        </div>
      )}
    </div>
  )
}
