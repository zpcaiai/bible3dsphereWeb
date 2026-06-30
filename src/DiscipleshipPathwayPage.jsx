/** DiscipleshipPathwayPage — 门徒成长路径 (B7)。入口：今日心镜。 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { communityApi } from './api'
import { getToken } from './auth'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { cursor: 'pointer', borderRadius: 10, padding: '10px 14px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(52,199,89,0.85), rgba(139,92,246,0.6))' }
const SL = [['scripture_practice_level', '读经'], ['prayer_practice_level', '祷告'], ['community_level', '群体'], ['service_level', '服事']]

export default function DiscipleshipPathwayPage({ user, onBack }) {
  const [scores, setScores] = useState({ scripture_practice_level: 3, prayer_practice_level: 3, community_level: 3, service_level: 3 })
  const [conn, setConn] = useState('regular_attender')
  const [assessed, setAssessed] = useState(null)
  const [path, setPath] = useState(null)
  const [error, setError] = useState('')

  function loadPath() { const t = getToken(); if (t) communityApi.discActivePath(t).then(r => setPath(r.path)).catch(() => {}) }
  useEffect(loadPath, [])

  async function assess() {
    const t = getToken()
    try { const r = await communityApi.discAssess({ ...scores, church_connection_level: conn }, t); setAssessed(r) } catch (e) { setError(e.message) }
  }
  async function createPath() {
    const t = getToken(); if (!assessed) return
    try { await communityApi.discCreatePath({ current_stage_key: assessed.assessed_stage, target_stage_key: assessed.suggested_target_stage, auto_steps: true }, t); loadPath() } catch (e) { setError(e.message) }
  }
  async function toggleStep(s) {
    const t = getToken()
    try { await communityApi.discUpdateStep(s.id, { status: s.status === 'completed' ? 'planned' : 'completed' }, t); loadPath() } catch (e) { setError(e.message) }
  }

  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }
  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>🌱 门徒成长路径</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>阶段是成长辅助，不是身份高低；慢成长不羞辱</div>
      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}

      {!path && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>阶段自评（0–10）</div>
          {SL.map(([k, l]) => (
            <div key={k} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>{l}</span><span style={{ color: '#8be9c0' }}>{scores[k]}</span></div>
              <input type="range" min="0" max="10" value={scores[k]} onChange={e => setScores({ ...scores, [k]: Number(e.target.value) })} style={{ width: '100%' }} />
            </div>
          ))}
          <select value={conn} onChange={e => setConn(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
            <option value="none">未连接教会</option><option value="visiting">在探访</option><option value="regular_attender">规律参加</option><option value="member">成员</option><option value="serving_member">服事成员</option>
          </select>
          <button style={btn} onClick={assess}>评估我的阶段</button>
          {assessed && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>当前阶段：{assessed.assessed_stage_name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '4px 0 10px' }}>{assessed.note}</div>
              <button style={btn} onClick={createPath}>创建成长路径</button>
            </div>
          )}
        </div>
      )}

      {path && (
        <div style={card}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{path.title} · {path.current_stage_key} → {path.target_stage_key}</div>
          {(path.steps || []).map(s => (
            <div key={s.id} onClick={() => toggleStep(s)} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
              <div style={{ fontSize: 14 }}>{s.status === 'completed' ? '✅ ' : '⬜ '}{s.step_title}</div>
              {s.related_module && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>→ {s.related_module}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
