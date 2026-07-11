import { t as i18nT } from './i18n/runtime'
/** ChurchIntegrationPage — 教会生活整合 (B7)。入口：今日心镜。 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { communityApi } from './api'
import { getToken } from './auth'
import SacramentCalendarOrbit from './features/spiritual-formation/components/sacrament-calendar/SacramentCalendarOrbit'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { cursor: 'pointer', borderRadius: 10, padding: '10px 14px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(125,211,252,0.85), rgba(245,181,63,0.6))' }
const fld = { width: '100%', padding: 10, borderRadius: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }
const STATUS = [['not_connected', '未连接'], ['exploring', '在了解'], ['visiting', '在探访'], ['regular_attender', '规律参加'], ['member', '成员'], ['serving_member', '服事成员']]

export default function ChurchIntegrationPage({ user, onBack }) {
  const [conn, setConn] = useState(null)
  const [status, setStatus] = useState('not_connected')
  const [notes, setNotes] = useState('')
  const [rec, setRec] = useState(null)
  const [care, setCare] = useState(null)
  const [error, setError] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => { const t = getToken(); if (t) communityApi.churchCurrent(t).then(r => { if (r.connection) { setConn(r.connection); setStatus(r.connection.connection_status) } }).catch(() => {}) }, [])

  async function save() {
    const t = getToken()
    try { const r = await communityApi.churchUpsert({ connection_status: status, notes }, t); setCare(r.church_hurt_detected ? r.care_route : null); const c = await communityApi.churchCurrent(t); setConn(c.connection) } catch (e) { setError(e.message) }
  }
  async function recommend() { const t = getToken(); try { setRec(await communityApi.churchRecommend({ context_text: notes }, t)) } catch (e) { setError(e.message) } }

  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }
  if (showCalendar) {
    return (
      <div style={wrap}>
        <BackButton onClick={() => setShowCalendar(false)} />
        <SacramentCalendarOrbit userId={user?.id || user?.userId || user?.email || 'local-user'} token={getToken()} />
      </div>
    )
  }
  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('⛪ 教会生活整合')}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>{i18nT('渐进、具身、智慧 · 教会创伤先医治再慢重返')}</div>
      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}
      {care && <div style={{ ...card, background: 'rgba(255,107,107,0.10)' }}><div style={{ fontWeight: 700 }}>💗 {care.message}</div><div style={{ fontSize: 12 }}>{i18nT('先做安全重返计划与界限,可结合「医治旅程」。')}</div></div>}
      <div style={card}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, marginBottom: 10 }}>{i18nT('把个人灵修接回主日敬拜、圣餐、洗礼身份与教会年历。')}</div>
        <button style={btn} onClick={() => setShowCalendar(true)}>{i18nT('打开圣礼与教会年历')}</button>
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{i18nT('我的连接状态')}{conn ? `（当前：${conn.connection_status}）` : ''}</div>
        <select value={status} onChange={e => setStatus(e.target.value)} style={fld}>
          {STATUS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder={i18nT('备注（若有教会经历的伤害也可写下）')} style={{ ...fld, resize: 'vertical' }}  aria-label={i18nT('备注（若有教会经历的伤害也可写下）')}/>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btn} onClick={save}>{i18nT('保存')}</button>
          <button style={{ ...btn, background: 'rgba(52,199,89,0.6)' }} onClick={recommend}>{i18nT('推荐下一步')}</button>
        </div>
      </div>

      {rec && (
        <div style={card}>
          {rec.church_hurt ? <div style={{ fontSize: 13, color: '#f5c451', marginBottom: 8 }}>{rec.message}</div> : <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>{rec.note}</div>}
          {(rec.steps || []).map((s, i) => <div key={i} style={{ fontSize: 13, marginBottom: 5 }}>· {s}</div>)}
        </div>
      )}
    </div>
  )
}
