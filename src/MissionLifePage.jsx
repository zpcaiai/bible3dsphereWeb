import { t as i18nT } from './i18n/runtime'
/**
 * MissionLifePage — 使命生活设计 Mission Life Design
 *
 * 按生命季节生成使命领域推荐（含过载/救世主情结护栏），采纳为承诺，并管理使命项目。
 * 入口：今日心镜 (SoulDashboard)。
 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import {
  designMissionLife, createMissionProfile, fetchLatestMissionProfile,
  addMissionCommitment, fetchMissionCommitments, createMissionProject, fetchMissionProjects,
} from './api'
import { getToken } from './auth'

const SEASONS = [
  ['student', '学生'], ['single_worker', '单身职场'], ['married', '已婚'], ['parent', '为人父母'],
  ['caregiver', '照顾者'], ['ministry_worker', '全职服事'], ['entrepreneur', '创业者'],
  ['academic', '学者'], ['retired', '退休'], ['transition', '过渡期'], ['suffering', '受苦中'], ['rebuilding', '重建中'],
]
const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { display: 'block', width: '100%', cursor: 'pointer', borderRadius: 12, padding: '12px 16px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(52,199,89,0.85), rgba(245,181,63,0.7))' }
const fieldStyle = { width: '100%', padding: 10, borderRadius: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }
function friendlyError(e, fb) { const m = e?.message || ''; return /[一-龥]/.test(m) ? m : (fb || '网络不稳定，请稍后重试') }

export default function MissionLifePage({ user, onBack }) {
  const [season, setSeason] = useState('single_worker')
  const [energy, setEnergy] = useState('normal')
  const [result, setResult] = useState(null)
  const [profile, setProfile] = useState(null)
  const [commitments, setCommitments] = useState([])
  const [projects, setProjects] = useState([])
  const [newProject, setNewProject] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function reload() {
    const t = getToken(); if (!t) return
    fetchLatestMissionProfile(t).then(r => { if (r.profile) setProfile(r.profile) }).catch((err) => { console.warn('[MissionLifePage.jsx] ignored async error', err) })
    fetchMissionCommitments(t).then(r => setCommitments(r.commitments || [])).catch((err) => { console.warn('[MissionLifePage.jsx] ignored async error', err) })
    fetchMissionProjects(t).then(r => setProjects(r.projects || [])).catch((err) => { console.warn('[MissionLifePage.jsx] ignored async error', err) })
  }
  useEffect(reload, [])

  async function generate() {
    const t = getToken(); if (!t) return
    setBusy(true); setError('')
    try { setResult(await designMissionLife({ life_season: season, energy_level: energy }, t)) }
    catch (e) { setError(friendlyError(e)) } finally { setBusy(false) }
  }

  async function adopt() {
    const t = getToken(); if (!t || !result) return
    setBusy(true); setError('')
    try {
      const pr = await createMissionProfile({ life_season: season, mission_summary: result.mission_summary }, t)
      const pid = pr.profile.id
      for (const d of (result.recommended_domains || [])) {
        await addMissionCommitment(pid, { domain_key: d.domain_key, title: d.display_name, description: d.commitment, frequency: 'weekly', minimum_action: d.minimum_viable_action, normal_action: d.normal_action || '' }, t)
      }
      setProfile(pr.profile); setResult(null); reload()
    } catch (e) { setError(friendlyError(e, '采纳失败')) } finally { setBusy(false) }
  }

  async function addProject() {
    const t = getToken(); if (!t || !newProject.trim()) return
    setBusy(true); setError('')
    try { await createMissionProject({ title: newProject.trim(), project_type: 'personal' }, t); setNewProject(''); reload() }
    catch (e) { setError(friendlyError(e, '创建项目失败')) } finally { setBusy(false) }
  }

  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }

  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('🌍 使命生活设计 · Mission Life')}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>{i18nT('把基督的使命整合进日常 · 始于日常忠心，而非靠项目证明自己')}</div>

      {error && <div style={{ ...card, borderColor: 'rgba(255,107,107,0.4)', color: '#ffb4b4' }}>{error}</div>}

      {/* 设计 */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{i18nT('① 按生命季节生成推荐')}</div>
        <select value={season} onChange={e => setSeason(e.target.value)} style={fieldStyle}>
          {SEASONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select value={energy} onChange={e => setEnergy(e.target.value)} style={fieldStyle}>
          <option value="low">{i18nT('当前精力：低（需要恢复）')}</option>
          <option value="normal">{i18nT('当前精力：正常')}</option>
          <option value="high">{i18nT('当前精力：充沛')}</option>
        </select>
        <button style={btn} disabled={busy} onClick={generate}>{busy ? '…' : '生成推荐'}</button>
      </div>

      {/* 推荐结果 */}
      {result && (
        <div style={card}>
          {result.recovery_mode && <div style={{ fontSize: 12, color: '#f5c451', marginBottom: 8 }}>{i18nT('🕊 恢复模式：先安息、简化，第一步保持小而真实。')}</div>}
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 10 }}>{result.mission_summary}</div>
          {(result.recommended_domains || []).map(d => (
            <div key={d.domain_key} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#8be9c0' }}>{d.display_name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{i18nT('最小一步：')}{d.minimum_viable_action}</div>
            </div>
          ))}
          {(result.guardrails || []).map((g, i) => <div key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>· {g}</div>)}
          <button style={{ ...btn, marginTop: 12 }} disabled={busy} onClick={adopt}>{busy ? '…' : '创建画像并采纳为承诺'}</button>
        </div>
      )}

      {/* 我的承诺 */}
      {commitments.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{i18nT('② 我的使命承诺')}</div>
          {commitments.map(c => (
            <div key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '8px 0' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{c.title} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>· {c.frequency}</span></div>
              {c.minimum_action && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{i18nT('最小一步：')}{c.minimum_action}</div>}
            </div>
          ))}
        </div>
      )}

      {/* 使命项目 */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>{i18nT('③ 使命项目')}</div>
        {projects.map(p => (
          <div key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '8px 0', fontSize: 13 }}>{p.title}</div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input value={newProject} onChange={e => setNewProject(e.target.value)} placeholder={i18nT('新项目（如：每月款待晚餐）')} style={{ ...fieldStyle, marginBottom: 0, flex: 1 }}  aria-label={i18nT('新项目（如：每月款待晚餐）')}/>
          <button style={{ ...btn, width: 'auto', padding: '10px 16px' }} disabled={busy} onClick={addProject}>{i18nT('添加')}</button>
        </div>
      </div>
    </div>
  )
}
