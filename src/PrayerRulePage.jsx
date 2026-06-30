/** PrayerRulePage — 固定祷告规则 / 每日祷告节奏 (B2)。入口：今日心镜。 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { formationApi } from './api'
import { getToken } from './auth'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { cursor: 'pointer', borderRadius: 10, padding: '10px 14px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(90,200,250,0.7))' }
const fld = { width: '100%', padding: 10, borderRadius: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }

export default function PrayerRulePage({ user, onBack }) {
  const [data, setData] = useState(null)
  const [review, setReview] = useState(null)
  const [active, setActive] = useState(null)   // {slot, session}
  const [prayerText, setPrayerText] = useState('')
  const [gratitude, setGratitude] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function reload() {
    const t = getToken(); if (!t) return
    formationApi.prayerToday(t).then(setData).catch(e => setError(e.message))
    formationApi.prayerReview(t).then(setReview).catch(() => {})
  }
  useEffect(reload, [])

  async function makeDefault() {
    const t = getToken(); setBusy(true); setError('')
    try { await formationApi.createDefaultRule(t); reload() } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function startSlot(slot) {
    const t = getToken(); setBusy(true); setError('')
    try { const r = await formationApi.startPrayerSession({ slot_id: slot.id, rule_id: data.rule_id }, t); setActive({ slot, session: r.session }); setPrayerText(''); setGratitude('') }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function finishSlot() {
    const t = getToken(); setBusy(true); setError('')
    try {
      await formationApi.completePrayerSession(active.session.id, { prayer_text: prayerText, gratitude_items: gratitude ? [gratitude] : [] }, t)
      setActive(null); reload()
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }
  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>🕯 祷告规则 · 每日节奏</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>与神相交，不是表现 · 错过不定罪</div>
      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}

      {active ? (
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>{active.slot.display_name}</div>
          <textarea value={prayerText} onChange={e => setPrayerText(e.target.value)} rows={4} placeholder="在神面前的祷告…" style={{ ...fld, resize: 'vertical' }} />
          <input value={gratitude} onChange={e => setGratitude(e.target.value)} placeholder="一件感恩（可选）" style={fld} />
          <button style={btn} disabled={busy} onClick={finishSlot}>完成这次祷告</button>
        </div>
      ) : !data ? <div style={card}>加载中…</div> : !data.rule_id ? (
        <div style={card}>
          <div style={{ marginBottom: 10, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{data.hint || '还没有祷告规则。'}</div>
          <button style={btn} disabled={busy} onClick={makeDefault}>一键创建初学者规则（晨 / 午 / 晚）</button>
        </div>
      ) : (
        <div style={card}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>{data.rule_title} · 今日 {data.completed_count}/{data.total}</div>
          {data.slots.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div><div style={{ fontSize: 14, fontWeight: 600 }}>{s.completed_today ? '✅ ' : ''}{s.display_name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{s.target_time} · {s.duration_minutes} 分钟</div></div>
              {!s.completed_today && <button style={{ ...btn, padding: '6px 12px' }} disabled={busy} onClick={() => startSlot(s)}>开始</button>}
            </div>
          ))}
        </div>
      )}

      {review && review.insights && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>本周回顾</div>
          {review.insights.map((i, k) => <div key={k} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>· {i}</div>)}
        </div>
      )}
    </div>
  )
}
