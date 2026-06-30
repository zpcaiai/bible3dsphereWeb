import { t as i18nT } from './i18n/runtime'
/** PlatformAdminPage — 平台管理 / 审核台 (B12-4)。仅平台管理员可见。
 *  危机队列只显示安全元数据,绝不含用户危机正文。 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { platformApi } from './api'
import { getToken } from './auth'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const small = { cursor: 'pointer', borderRadius: 8, padding: '4px 10px', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', background: 'transparent', fontSize: 12 }
const riskColor = { red: '#ff6b6b', orange: '#f5a04b', yellow: '#f5c451', green: '#34c759' }

function Metric({ label, value, danger }) {
  return (
    <div style={{ flex: 1, minWidth: 90, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 12px' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: danger && value > 0 ? '#ff8a8a' : '#fff' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function PlatformAdminPage({ user, onBack }) {
  const [denied, setDenied] = useState(false)
  const [ov, setOv] = useState(null)
  const [queue, setQueue] = useState([])
  const [orgs, setOrgs] = useState([])
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])
  async function load() {
    const t = getToken(); if (!t) return
    try { const o = await platformApi.overview(t); setOv(o.metrics) }
    catch (e) { if (String(e.message).includes('platform admin')) { setDenied(true); return } setError(e.message) }
    try { const q = await platformApi.crisisQueue(30, t); setQueue(q.queue || []) } catch (e) { /* */ }
    try { const g = await platformApi.orgs(t); setOrgs(g.organizations || []) } catch (e) { /* */ }
  }
  async function review(id) {
    const t = getToken(); try { await platformApi.reviewCrisis(id, { action: 'reviewed' }, t); setQueue(queue.map(q => q.id === id ? { ...q, last_action: 'reviewed', review_count: (q.review_count || 0) + 1 } : q)) } catch (e) { setError(e.message) }
  }
  async function toggleOrg(o) {
    const t = getToken()
    try {
      if (o.status === 'suspended') { await platformApi.reactivateOrg(o.id, {}, t); o.status = 'active' }
      else { await platformApi.suspendOrg(o.id, {}, t); o.status = 'suspended' }
      setOrgs([...orgs])
    } catch (e) { setError(e.message) }
  }

  const wrap = { maxWidth: 700, margin: '0 auto', padding: 16, color: '#fff' }
  if (denied) return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('🛡️ 平台管理台')}</h2>
      <div style={{ ...card, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{i18nT('此页仅限平台管理员。你当前没有平台管理权限——这是设计内的访问隔离。')}</div>
    </div>
  )
  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('🛡️ 平台管理台')}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 12 }}>{i18nT('安全审核优先 · 危机队列只显示元数据,不含用户隐私正文')}</div>
      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}

      {ov && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{i18nT('平台概览')}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Metric label={i18nT('活跃组织')} value={ov.organizations} />
            <Metric label={i18nT('成员')} value={ov.members} />
            <Metric label={i18nT('付费订阅')} value={ov.paid_subscriptions} />
            <Metric label={i18nT('未确认危机(30天)')} value={ov.crisis_unacked_30d} danger />
            <Metric label={i18nT('高危(30天)')} value={ov.crisis_high_30d} danger />
          </div>
        </div>
      )}

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{i18nT('危机复核队列 ·')} {queue.length}</div>
        {queue.length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{i18nT('近 30 天无危机事件。')}</div>}
        {queue.map(q => (
          <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 12 }}>
              <span style={{ color: riskColor[q.risk_level] || '#fff', fontWeight: 700 }}>{q.risk_level}</span>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}> · {q.workflow || '—'} · {q.created_at ? q.created_at.slice(0, 10) : ''}{q.user_acknowledged ? '' : ' · 未确认'}{q.last_action ? ' · 已' + q.last_action : ''}</span>
            </div>
            <button style={small} onClick={() => review(q.id)}>{i18nT('标记复核')}</button>
          </div>
        ))}
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{i18nT('仅风险等级/状态/时间;用户危机正文不在平台侧暴露。')}</div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{i18nT('组织 ·')} {orgs.length}</div>
        {orgs.map(o => (
          <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 13 }}>{o.name} <span style={{ fontSize: 11, color: o.status === 'suspended' ? '#ff8a8a' : 'rgba(255,255,255,0.5)' }}>· {o.status}</span></div>
            <button style={small} onClick={() => toggleOrg(o)}>{o.status === 'suspended' ? '恢复' : '停用'}</button>
          </div>
        ))}
      </div>
    </div>
  )
}
