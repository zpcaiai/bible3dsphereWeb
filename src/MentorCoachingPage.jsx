import { t as i18nT } from './i18n/runtime'
/** MentorCoachingPage — 导师陪跑 (B7)。入口：今日心镜。 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { communityApi } from './api'
import { getToken } from './auth'
import { a11yClickProps } from './lib/a11yClick';

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { cursor: 'pointer', borderRadius: 10, padding: '8px 12px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(125,211,252,0.6))' }
const fld = { width: '100%', padding: 10, borderRadius: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }

export default function MentorCoachingPage({ user, onBack }) {
  const [rels, setRels] = useState([])
  const [sel, setSel] = useState(null)
  const [sessions, setSessions] = useState([])
  const [cp, setCp] = useState(''); const [role, setRole] = useState('mentee')
  const [summary, setSummary] = useState('')
  const [rec, setRec] = useState(null)
  const [error, setError] = useState('')

  function load() { const t = getToken(); if (t) communityApi.mentorRels(t).then(r => setRels(r.relationships || [])).catch(e => setError(e.message)) }
  useEffect(load, [])
  function openRel(r) { const t = getToken(); setSel(r); communityApi.mentorSessions(r.id, t).then(x => setSessions(x.sessions || [])).catch(() => {}) }

  async function createRel() {
    const t = getToken(); if (!cp.trim()) return
    try { await communityApi.createMentorRel({ counterpart_email: cp.trim(), my_role: role }, t); setCp(''); load() } catch (e) { setError(e.message) }
  }
  async function addSession() {
    const t = getToken(); if (!sel) return
    try { await communityApi.createMentorSession(sel.id, { session_type: 'checkin', summary, status: 'completed' }, t); setSummary(''); openRel(sel) } catch (e) { setError(e.message) }
  }
  async function recommend() { const t = getToken(); try { setRec(await communityApi.mentorRecommend({ session_type: 'discipleship_review' }, t)) } catch (e) { setError(e.message) } }

  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }
  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('🤝 导师陪跑')}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>{i18nT('同意范围内的陪伴 · 提问、观察、行动计划')}</div>
      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{i18nT('建立关系')}</div>
        <input value={cp} onChange={e => setCp(e.target.value)} placeholder={i18nT('对方邮箱')} style={fld}  aria-label={i18nT('对方邮箱')}/>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={role} onChange={e => setRole(e.target.value)} style={{ ...fld, marginBottom: 0, flex: 1 }}>
            <option value="mentee">{i18nT('我是被陪伴者')}</option><option value="mentor">{i18nT('我是导师')}</option>
          </select>
          <button style={btn} onClick={createRel}>{i18nT('邀请')}</button>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{i18nT('我的关系')}</div>
        {rels.length === 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{i18nT('还没有陪跑关系。')}</div>}
        {rels.map(r => (
          <div key={r.id} onClick={() => openRel(r)} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }} {...a11yClickProps(() => openRel(r))}>
            <div style={{ fontSize: 14 }}>{r.my_role === 'mentee' ? '导师：' + r.mentor_email : '被陪伴：' + r.mentee_email} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>· {r.status}</span></div>
          </div>
        ))}
      </div>

      {sel && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{i18nT('会面记录')}</div>
          <button style={{ ...btn, marginBottom: 10 }} onClick={recommend}>{i18nT('建议议程与提问')}</button>
          {rec && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>
            {(rec.suggested_agenda || []).map((a, i) => <div key={i}>· {a}</div>)}
            <div style={{ marginTop: 6, color: '#8be9c0' }}>{i18nT('提问：')}</div>
            {(rec.suggested_questions || []).map((q, i) => <div key={i}>– {q}</div>)}
          </div>}
          <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={3} placeholder={i18nT('这次会面的摘要…')} style={{ ...fld, resize: 'vertical' }}  aria-label={i18nT('这次会面的摘要…')}/>
          <button style={btn} onClick={addSession}>{i18nT('记录会面')}</button>
          <div style={{ marginTop: 10 }}>
            {sessions.map(s => <div key={s.id} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', padding: '4px 0' }}>· {s.summary || s.session_type}</div>)}
          </div>
        </div>
      )}
    </div>
  )
}
