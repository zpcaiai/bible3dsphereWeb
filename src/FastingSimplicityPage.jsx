import { t as i18nT } from './i18n/runtime'
/** FastingSimplicityPage — 禁食与简朴操练 (B4)。入口：今日心镜。 */
import { useState } from 'react'
import BackButton from './BackButton'
import { formationApi } from './api'
import { getToken } from './auth'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { cursor: 'pointer', borderRadius: 10, padding: '10px 14px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(245,181,63,0.85), rgba(52,199,89,0.6))' }
const fld = { width: '100%', padding: 10, borderRadius: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }
const SF = [['money_clutter_score', '金钱'], ['possession_clutter_score', '物品'], ['schedule_clutter_score', '日程'],
  ['digital_clutter_score', '数字'], ['desire_pressure_score', '欲望'], ['comparison_pressure_score', '比较']]

export default function FastingSimplicityPage({ user, onBack }) {
  const [need, setNeed] = useState('')
  const [recs, setRecs] = useState(null)
  const [scores, setScores] = useState(Object.fromEntries(SF.map(([k]) => [k, 5])))
  const [simp, setSimp] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function recommend() {
    const t = getToken(); setBusy(true); setError('')
    try { setRecs(await formationApi.recommendFasting({ formation_need: need }, t)) } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function audit() {
    const t = getToken(); setBusy(true); setError('')
    try { const r = await formationApi.simplicityAudit(scores, t); setSimp(r.analysis) } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }
  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('🍃 禁食与简朴')}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>{i18nT('训练欲望、操练依靠与慷慨 · 安全第一，不强求食物禁食')}</div>
      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{i18nT('① 推荐操练')}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={need} onChange={e => setNeed(e.target.value)} placeholder={i18nT('成长需要（如：刷手机分心、攀比、舒适依赖）')} style={{ ...fld, marginBottom: 0, flex: 1 }}  aria-label={i18nT('成长需要（如：刷手机分心、攀比、舒适依赖）')}/>
          <button style={btn} disabled={busy} onClick={recommend}>{i18nT('推荐')}</button>
        </div>
        {recs && recs.message && <div style={{ marginTop: 10, fontSize: 13, color: '#f5c451' }}>{recs.message}</div>}
        {recs && (recs.practices || []).map(p => (
          <div key={p.practice_key} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{p.title} {p.fasting_type === 'food' ? '🍽' : ''}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{p.description}</div>
            {p.health_caution && <div style={{ fontSize: 11, color: '#f5c451', marginTop: 3 }}>⚠ {p.health_caution}</div>}
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{i18nT('② 简朴审视（0–10 越高越过剩）')}</div>
        {SF.map(([k, label]) => (
          <div key={k} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>{label}</span><span style={{ color: '#8be9c0' }}>{scores[k]}</span></div>
            <input type="range" min="0" max="10" value={scores[k]} onChange={e => setScores({ ...scores, [k]: Number(e.target.value) })} style={{ width: '100%' }} />
          </div>
        ))}
        <button style={btn} disabled={busy} onClick={audit}>{busy ? '…' : '生成简化建议'}</button>
        {simp && (
          <div style={{ marginTop: 12, fontSize: 13 }}>
            {simp.dominant_clutter && <div>{i18nT('最大过剩：')}<b>{simp.dominant_clutter}</b>{simp.possible_idol ? `（可能的偶像：${simp.possible_idol}）` : ''}</div>}
            <div style={{ marginTop: 6 }}>· {simp.recommended_action}</div>
            <div style={{ marginTop: 4 }}>· {simp.generosity_response}</div>
            <div style={{ marginTop: 4 }}>· {simp.gratitude_practice}</div>
          </div>
        )}
      </div>
    </div>
  )
}
