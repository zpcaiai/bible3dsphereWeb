import { t as i18nT } from './i18n/runtime'
/** PracticingPresencePage — 操练与神同在 (B2)。入口：今日心镜。 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { formationApi } from './api'
import { getToken } from './auth'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { cursor: 'pointer', borderRadius: 10, padding: '10px 14px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(125,211,252,0.85), rgba(52,199,89,0.6))' }
const fld = { width: '100%', padding: 10, borderRadius: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }

export default function PracticingPresencePage({ user, onBack }) {
  const [context, setContext] = useState('')
  const [recs, setRecs] = useState([])
  const [checkin, setCheckin] = useState(null)
  const [prayer, setPrayer] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reflection, setReflection] = useState(null)

  useEffect(() => { const t = getToken(); if (t) formationApi.presenceReflection(t).then(setReflection).catch(() => {}) }, [])

  async function recommend() {
    const t = getToken(); setBusy(true); setError('')
    try { const r = await formationApi.recommendPresence({ context_label: context, emotion: context }, t); setRecs(r.practices || []) }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function start(p) {
    const t = getToken(); setBusy(true); setError('')
    try { const r = await formationApi.startPresenceCheckin({ practice_key: p.practice_key, context_label: context }, t); setCheckin({ practice: p, id: r.checkin.id }); setPrayer('') }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function done() {
    const t = getToken(); setBusy(true); setError('')
    try { await formationApi.completePresenceCheckin(checkin.id, { short_prayer: prayer }, t); setCheckin(null); setRecs([]); setContext(''); const rf = await formationApi.presenceReflection(t); setReflection(rf) }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }
  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('🌿 操练与神同在')}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>{i18nT('30–60 秒，短而频地回到神面前 · 不是打卡')}</div>
      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}

      {checkin ? (
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{checkin.practice.title}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>{checkin.practice.description}</div>
          <input value={prayer} onChange={e => setPrayer(e.target.value)} placeholder={i18nT('一句短祷（可选）')} style={fld}  aria-label={i18nT('一句短祷（可选）')}/>
          <button style={btn} disabled={busy} onClick={done}>{i18nT('完成')}</button>
        </div>
      ) : (
        <div style={card}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={context} onChange={e => setContext(e.target.value)} placeholder={i18nT('此刻的情境/情绪（如：工作焦虑、通勤、疲惫）')} style={{ ...fld, marginBottom: 0, flex: 1 }}  aria-label={i18nT('此刻的情境/情绪（如：工作焦虑、通勤、疲惫）')}/>
            <button style={btn} disabled={busy} onClick={recommend}>{i18nT('推荐')}</button>
          </div>
          {recs.map(p => (
            <div key={p.practice_key} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '2px 0 6px' }}>{p.description}</div>
              <button style={{ ...btn, padding: '5px 12px', fontSize: 12 }} onClick={() => start(p)}>{i18nT('开始（')}{p.duration_seconds}s）</button>
            </div>
          ))}
        </div>
      )}

      {reflection && reflection.insights && (
        <div style={card}>
          {reflection.insights.map((i, k) => <div key={k} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>· {i}</div>)}
        </div>
      )}
    </div>
  )
}
