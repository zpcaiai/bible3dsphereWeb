import { t as i18nT } from './i18n/runtime'
/** FormationAgentDashboard — 个人成长统一面板 (B10)。今日快照 + 计划 + 推荐 + 意图路由。 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { agentApi } from './api'
import { getToken } from './auth'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { cursor: 'pointer', borderRadius: 10, padding: '8px 12px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(245,181,63,0.6))' }
const fld = { width: '100%', padding: 10, borderRadius: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }
const SKILL_OVERLAY = {
  prayer_rule: 'prayer-rule', lectio: 'lectio', psalm: 'psalm', presence: 'presence', intercession: 'intercession',
  temptation: 'temptation', fruit: 'fruit', idolatry: 'idolatry', sabbath: 'sabbath', fasting: 'fasting',
  mission_life: 'mission-life', mentor: 'mentor', accountability_group: 'acc-group', discipleship: 'disciple-path',
  church: 'church-life', doctrine: 'doctrine', examen: 'examen', gospel: 'gospel', decision: 'discern',
}

export default function FormationAgentDashboard({ user, onBack, go }) {
  const [dash, setDash] = useState(null)
  const [plan, setPlan] = useState(null)
  const [recs, setRecs] = useState([])
  const [intent, setIntent] = useState('')
  const [routed, setRouted] = useState(null)
  const [error, setError] = useState('')

  function load() {
    const t = getToken(); if (!t) return
    agentApi.dashboard(t).then(r => setDash(r.today)).catch(e => setError(e.message))
    agentApi.todayPlan(t).then(r => setPlan(r.plan)).catch((err) => { console.warn('[FormationAgentDashboard.jsx] ignored async error', err) })
    agentApi.recommendations(t).then(r => setRecs(r.recommendations || [])).catch((err) => { console.warn('[FormationAgentDashboard.jsx] ignored async error', err) })
  }
  useEffect(load, [])

  async function makePlan(energy) { const t = getToken(); try { const r = await agentApi.dailyPlan({ energy_level: energy }, t); setPlan(r.plan) } catch (e) { setError(e.message) } }
  async function route() {
    const t = getToken(); if (!intent.trim()) return
    try { setRouted(await agentApi.route({ intent_text: intent.trim() }, t)) } catch (e) { setError(e.message) }
  }
  function goTo(skill) { const k = SKILL_OVERLAY[skill]; if (k && go) go(k) }

  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }
  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('🧭 今日成长 · 统一面板')}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>{i18nT('在恩典里走一小步 · 相交而非表现')}</div>
      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}

      {/* 意图路由 */}
      <div style={card}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={intent} onChange={e => setIntent(e.target.value)} placeholder={i18nT('你此刻需要什么？（如：我很焦虑、想祷告、被试探、想读经）')} style={{ ...fld, flex: 1 }}  aria-label={i18nT('你此刻需要什么？（如：我很焦虑、想祷告、被试探、想读经）')}/>
          <button style={btn} onClick={route}>{i18nT('带我去')}</button>
        </div>
        {routed && (
          <div style={{ marginTop: 10 }}>
            {routed.block_normal
              ? <div style={{ color: '#ffb4b4', fontSize: 13 }}>💗 {routed.message}</div>
              : <div style={{ fontSize: 13 }}>
                  {i18nT('建议前往：')}<b>{routed.route.skill}</b>
                  {SKILL_OVERLAY[routed.route.skill] && <button style={{ ...btn, marginLeft: 10, padding: '4px 10px', fontSize: 12 }} onClick={() => goTo(routed.route.skill)}>{i18nT('前往 ›')}</button>}
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{routed.why}</div>
                </div>}
          </div>
        )}
      </div>

      {/* 今日快照 */}
      {dash && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{i18nT('今日快照')}</div>
          <div style={{ fontSize: 13, lineHeight: 1.9, color: 'rgba(255,255,255,0.8)' }}>
            <div>{i18nT('省察：')}{dash.examen_done ? '✅ 已完成' : '⬜ 待完成'}</div>
            <div>{i18nT('祷告：完成')} {dash.prayer_sessions_completed} {i18nT('次 · 默想')} {dash.lectio_sessions} {i18nT('次')}</div>
            <div>{i18nT('代祷到期：')}{dash.intercession_due} {i18nT('个')}</div>
            <div>{i18nT('果子自评(近30天)：')}{dash.fruit_assessed_30d ? '✅' : '⬜'}</div>
          </div>
          {(dash.care_flags || []).map((f, i) => <div key={i} style={{ marginTop: 8, color: '#ffb4b4', fontSize: 13 }}>💗 {f.message}</div>)}
          {dash.recommended_next_action && (
            <div style={{ marginTop: 10 }}>
              {i18nT('下一步：')}<b>{dash.recommended_next_action.title}</b>
            </div>
          )}
        </div>
      )}

      {/* 今日计划 */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{i18nT('今日计划')}</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={{ ...btn, padding: '5px 10px', fontSize: 12 }} onClick={() => makePlan('normal')}>{i18nT('生成')}</button>
            <button style={{ ...btn, padding: '5px 10px', fontSize: 12, background: 'rgba(125,211,252,0.5)' }} onClick={() => makePlan('low')}>{i18nT('低能量版')}</button>
          </div>
        </div>
        {plan ? (
          <div>
            {(plan.practices || []).map((p, i) => (
              <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 14 }}>{p.title} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>· {p.duration_minutes}{i18nT('分钟')}</span></div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>{i18nT('最小一步：')}{p.minimum}</div>
              </div>
            ))}
            {(plan.guardrails || []).map((g, i) => <div key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>· {g}</div>)}
          </div>
        ) : <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{i18nT('点「生成」获得今天 3 项小操练。')}</div>}
      </div>

      {/* 推荐 */}
      {recs.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{i18nT('今日推荐')}</div>
          {recs.map((r, i) => (
            <div key={i} style={{ padding: '6px 0' }}>
              <div style={{ fontSize: 14 }}>{r.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{r.reason}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
