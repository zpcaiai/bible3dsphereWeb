/** IntercessionPage — 代祷名单 / 代祷追踪 (B2)。入口：今日心镜。 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { formationApi } from './api'
import { getToken } from './auth'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { cursor: 'pointer', borderRadius: 10, padding: '8px 12px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(245,181,63,0.85), rgba(255,107,107,0.6))' }
const fld = { width: '100%', padding: 10, borderRadius: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }
const URG = [['normal', '一般'], ['high', '迫切'], ['urgent', '紧急'], ['low', '长期']]

export default function IntercessionPage({ user, onBack }) {
  const [today, setToday] = useState([])
  const [title, setTitle] = useState('')
  const [urgency, setUrgency] = useState('normal')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function reload() {
    const t = getToken(); if (!t) return
    formationApi.intercessionToday(t).then(r => setToday(r.requests || [])).catch(e => setError(e.message))
  }
  useEffect(reload, [])

  async function add() {
    const t = getToken(); if (!title.trim()) return
    setBusy(true); setError('')
    try { await formationApi.addIntercessionRequest({ title: title.trim(), urgency }, t); setTitle(''); reload() }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function prayed(id) { const t = getToken(); try { await formationApi.prayRequest(id, {}, t); reload() } catch (e) { setError(e.message) } }
  async function answered(id) { const t = getToken(); try { await formationApi.answerRequest(id, { answered_summary: '' }, t); reload() } catch (e) { setError(e.message) } }

  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }
  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>🙏 代祷名单</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>持续为人代求 · 把结果交托给神 · 默认私密</div>
      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}

      <div style={card}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="新的代祷事项（如：为母亲的健康）" style={fld} />
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={urgency} onChange={e => setUrgency(e.target.value)} style={{ ...fld, marginBottom: 0, flex: 1 }}>
            {URG.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button style={btn} disabled={busy} onClick={add}>添加</button>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>今日建议代祷（{today.length}）</div>
        {today.length === 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>暂无。添加一个代祷事项开始。</div>}
        {today.map(r => (
          <div key={r.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{r.title} {r.urgency === 'urgent' ? '🔴' : r.urgency === 'high' ? '🟠' : ''}</div>
            {r.prayer_direction && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: '2px 0 6px' }}>{r.prayer_direction}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ ...btn, padding: '5px 10px', fontSize: 12 }} onClick={() => prayed(r.id)}>已祷告</button>
              <button style={{ ...btn, padding: '5px 10px', fontSize: 12, background: 'rgba(52,199,89,0.5)' }} onClick={() => answered(r.id)}>蒙应允</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
