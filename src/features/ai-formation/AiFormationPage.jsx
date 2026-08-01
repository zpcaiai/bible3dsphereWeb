import { useCallback, useEffect, useMemo, useState } from 'react'
import BackButton from '../../BackButton'
import { t as i18nT } from '../../i18n/runtime'
import { fetchAiFormationManifest, saveAiFormationRecord } from './api'
import BatchWorkspace from './BatchWorkspace'
import GovernanceWorkspace from './GovernanceWorkspace'
import { BATCHES, RELEASE_GATES, TRACKS, recommendTrack, validateLearnerContext } from './program'
import './aiFormation.css'

const GOALS = [
  ['attention', '注意力'], ['digital_habits', '数字习惯'], ['body_rhythm', '身体节律'],
  ['ai_discernment', 'AI分辨'], ['family_liturgy', '家庭礼仪'], ['parent_modeling', '父母榜样'],
  ['identity', '身份'], ['relationships', '关系'], ['teacher_preparation', '教师备课'],
]

const NAV = [
  ['overview', '总览'], ['context', '选择路径'], ['batches', 'Batch 01–12'], ['governance', '审核与发布'],
]

function Disabled({ onBack }) {
  return (
    <section className="aif-page aif-disabled">
      <header><BackButton onClick={onBack} /><span className="aif-kicker">SUNDAY SCHOOL · RELEASE CANDIDATE</span></header>
      <section role="status" className="aif-state-card">
        <span aria-hidden="true">🔒</span>
        <h1>{i18nT('AI时代心意更新与家庭门训')}</h1>
        <p>{i18nT('模块已安装并完成基础集成，但 Feature Flag 保持关闭，直到神学、牧养、儿童安全、隐私、无障碍和回滚证据由授权人审核。')}</p>
        <strong>NOT_CERTIFIED</strong>
      </section>
    </section>
  )
}

function TrackCard({ track, onOpen }) {
  return (
    <article className="aif-track-card">
      <span>{track.batchIds.map((id) => `B${id}`).join(' · ')}</span>
      <h3>{i18nT(track.title)}</h3>
      <p>{i18nT(track.summary)}</p>
      <button type="button" onClick={() => onOpen(track)} aria-label={`${i18nT('查看课程轨道')}：${i18nT(track.title)}`}>
        {i18nT('查看实施状态')} <span aria-hidden="true">›</span>
      </button>
    </article>
  )
}

function Overview({ manifest, tracks, onSelectTrack, teacher, onTeacher }) {
  return (
    <div className="aif-stack">
      <section className="aif-card aif-intro">
        <span className="aif-eyebrow">GRACE BEFORE PRACTICE</span>
        <h2>{i18nT('恩典先于操练，技术既不是救主，也不是魔鬼')}</h2>
        <p>{i18nT('这个模块帮助成人、家庭、儿童青少年与教师，在AI和注意力经济中保留祷告、判断、关系与责任。产品不替代地方教会、牧养、专业照护或紧急支持。')}</p>
        <div className="aif-label-row">
          <span>MODULE · {manifest.status}</span><span>SAFETY · S0–S3</span><span>CONTENT · REVIEW ONLY</span>
        </div>
      </section>
      <section aria-labelledby="aif-tracks-title">
        <div className="aif-section-title"><span>FOUR TRACKS</span><h2 id="aif-tracks-title">{i18nT('选择与你当前责任相符的轨道')}</h2></div>
        <div className="aif-track-grid">{tracks.map((track) => <TrackCard key={track.id} track={track} onOpen={onSelectTrack} />)}</div>
      </section>
      <section className="aif-card aif-boundary">
        <h2>{i18nT('共同边界')}</h2>
        <ul>
          <li>{i18nT('不生成救恩、圣洁、成熟、纯洁、父母适格或隐藏罪评分。')}</li>
          <li>{i18nT('不做秘密监控，不读取完整浏览历史、私聊、认罪或儿童秘密。')}</li>
          <li>{i18nT('未经授权审核的神学、性教育、儿童与青少年内容不会展示给学习者。')}</li>
          <li>{i18nT('S3 会立即停止普通课程，优先连接紧急与保护路径。')}</li>
        </ul>
      </section>
      {teacher && <button className="aif-teacher-cta" type="button" onClick={onTeacher}>{i18nT('进入教师与审核工作台')} <span aria-hidden="true">›</span></button>}
    </div>
  )
}

function ContextIntake({ onRecommend, recordSaver }) {
  const [form, setForm] = useState({ role: 'learner', age_band: 'adult', goals: ['attention'], guardian: false, accepted: false })
  const [message, setMessage] = useState('')
  const minor = form.age_band !== 'adult'
  const toggleGoal = (goal) => setForm((current) => ({
    ...current,
    goals: current.goals.includes(goal) ? current.goals.filter((item) => item !== goal) : [...current.goals, goal].slice(0, 6),
  }))
  const submit = async (event) => {
    event.preventDefault(); setMessage('')
    try {
      const context = validateLearnerContext({
        role: form.role, age_band: form.age_band, locale: 'zh-CN', goals: form.goals,
        accessibility_needs: [], device_context: 'prefer_not_to_say',
        consent: { data_minimization_accepted: form.accepted, guardian_confirmed: minor ? form.guardian : null, pastoral_followup_allowed: false },
      })
      const track = recommendTrack(context)
      await recordSaver('learner_context', context, `context-${Date.now()}`)
      setMessage(i18nT('路径已保存；没有收集自由文本、诊断或秘密。'))
      onRecommend(track)
    } catch (error) { setMessage(error.message) }
  }
  return (
    <form className="aif-card aif-context" onSubmit={submit} noValidate>
      <span className="aif-eyebrow">MINIMUM CONTEXT</span><h2>{i18nT('只选择课程所需的最少信息')}</h2>
      <label>{i18nT('我的角色')}<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="learner">{i18nT('学习者')}</option><option value="parent">{i18nT('父母')}</option><option value="guardian">{i18nT('监护人')}</option><option value="teacher">{i18nT('教师')}</option><option value="pastor">{i18nT('牧者')}</option></select></label>
      <label>{i18nT('年龄带')}<select value={form.age_band} onChange={(event) => setForm({ ...form, age_band: event.target.value, guardian: false })}><option value="adult">{i18nT('成人')}</option><option value="16_18">16–18</option><option value="13_15">13–15</option><option value="7_12">7–12</option><option value="0_6">0–6</option></select></label>
      <fieldset><legend>{i18nT('学习目标（至少一项）')}</legend><div className="aif-check-grid">{GOALS.map(([goal, label]) => <label key={goal}><input type="checkbox" checked={form.goals.includes(goal)} onChange={() => toggleGoal(goal)} />{i18nT(label)}</label>)}</div></fieldset>
      {minor && <label className="aif-consent"><input type="checkbox" checked={form.guardian} onChange={(event) => setForm({ ...form, guardian: event.target.checked })} />{i18nT('已完成适用的监护人或组织同意流程')}</label>}
      <label className="aif-consent"><input type="checkbox" checked={form.accepted} onChange={(event) => setForm({ ...form, accepted: event.target.checked })} />{i18nT('我理解这里只保存角色、年龄带、目标和同意状态，不保存秘密或自由文本')}</label>
      <button className="aif-primary" type="submit">{i18nT('生成课程路径')}</button>
      {message && <p className="aif-form-message" role="status">{message}</p>}
    </form>
  )
}

function BatchMatrix({ batches, selectedId, onSelect, onOpenTwin }) {
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const selected = batches.find((item) => item.id === selectedId) || batches[0]
  return (
    <div className="aif-batch-layout">
      <nav className="aif-batch-nav" aria-label={i18nT('Batch 选择')}>{batches.map((item) => <button key={item.id} type="button" aria-current={selected.id === item.id ? 'page' : undefined} onClick={() => onSelect(item.id)}><span>B{item.id}</span>{i18nT(item.title)}</button>)}</nav>
      <article className="aif-card aif-batch-detail">
        <span className="aif-eyebrow">BATCH {selected.id} · RELEASE CANDIDATE</span>
        <h2>{i18nT(selected.title)}</h2>
        <div className="aif-status-line"><span>{i18nT('实现状态')} · {selected.implementationStatus}</span><span>{i18nT('内容状态')} · {selected.contentReviewStatus}</span></div>
        <h3>{i18nT('已实现的契约面')}</h3><ul>{selected.capabilities.map((item) => <li key={item}>{i18nT(item)}</li>)}</ul>
        <h3>{i18nT('强制边界')}</h3><ul>{selected.boundaries.map((item) => <li key={item}>{i18nT(item)}</li>)}</ul>
        <div className="aif-review-lock" role="status"><strong>{i18nT('学习内容仍被锁定')}</strong><p>{i18nT('当前种子仍在分角色审核；只有 approved 且已发布的版本才会进入学习者界面。')}</p></div>
        {selected.id === '11' && <button className="aif-primary" type="button" onClick={onOpenTwin}>{i18nT('打开现有 Formation Twin')} <span aria-hidden="true">›</span></button>}
        <button className="aif-primary" type="button" aria-expanded={workspaceOpen} onClick={() => setWorkspaceOpen((value) => !value)}>{workspaceOpen ? i18nT('收起 Batch 工作流') : i18nT('打开 Batch 工作流')}</button>
        {workspaceOpen && <BatchWorkspace batchId={selected.id} />}
      </article>
    </div>
  )
}

export default function AiFormationPage({
  user,
  onBack,
  onOpen = () => {},
  enabled,
  initialRoute = '',
  manifestLoader = fetchAiFormationManifest,
  recordSaver = saveAiFormationRecord,
}) {
  const runtimeEnabled = enabled ?? import.meta.env.VITE_AI_FORMATION_ENABLED === 'true'
  const [tab, setTab] = useState(initialRoute.includes('/admin') ? 'governance' : initialRoute ? 'batches' : 'overview')
  const [selectedBatch, setSelectedBatch] = useState(initialRoute.includes('/twin') ? '11' : initialRoute.includes('/scenarios') ? '10' : '01')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(runtimeEnabled)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    if (!runtimeEnabled) return
    setLoading(true); setError('')
    try { setData(await manifestLoader()) } catch (caught) { setError(caught.message || i18nT('模块加载失败')) } finally { setLoading(false) }
  }, [manifestLoader, runtimeEnabled])
  useEffect(() => { load() }, [load])
  const permissions = Array.isArray(user?.permissions) ? user.permissions : []
  const teacher = Boolean(user?.is_admin || user?.role === 'admin' || user?.role === 'teacher' || permissions.includes('sunday_school.ai_formation.manage'))
  const activeTab = tab === 'governance' && !teacher ? 'overview' : tab
  const tracks = data?.tracks?.length ? data.tracks.map((item) => {
    const local = TRACKS.find((track) => track.id === item.id)
    return {
      ...local,
      ...item,
      title: item.title?.['zh-CN'] || local?.title,
      summary: local?.summary,
    }
  }) : TRACKS
  const batches = useMemo(() => data?.batches?.length ? data.batches.map((item) => ({ ...BATCHES.find((batchItem) => batchItem.id === item.id), ...item, title: item.title?.['zh-CN'] || BATCHES.find((batchItem) => batchItem.id === item.id)?.title })) : BATCHES, [data])
  if (!runtimeEnabled) return <Disabled onBack={onBack} />
  if (loading) return <section className="aif-page" aria-label={i18nT('AI时代心意更新与家庭门训')}><header><BackButton onClick={onBack} /></header><div className="aif-loading" role="status">{i18nT('正在读取模块契约…')}</div></section>
  if (error) return <section className="aif-page"><header><BackButton onClick={onBack} /></header><div className="aif-state-card" role="alert"><h1>{i18nT('模块加载失败')}</h1><p>{error}</p><button type="button" onClick={load}>{i18nT('重试')}</button></div></section>
  if (data?.enabled === false) return <Disabled onBack={onBack} />
  const openTrack = (track) => { setSelectedBatch(track.batchIds[0]); setTab('batches') }
  return (
    <section className="aif-page" aria-labelledby="aif-page-title">
      <header className="aif-header"><BackButton onClick={onBack} /><div><span className="aif-kicker">SUNDAY SCHOOL · AI FORMATION</span><h1 id="aif-page-title">{i18nT(data?.manifest?.title?.['zh-CN'] || 'AI时代心意更新与家庭门训')}</h1><p>{i18nT('一个模块 · 四条轨道 · 十二个依赖有序的 Batch')}</p></div><span className="aif-alpha">RELEASE CANDIDATE</span></header>
      <nav className="aif-nav" aria-label={i18nT('AI时代心意更新导航')}>{NAV.filter(([id]) => id !== 'governance' || teacher).map(([id, label]) => <button type="button" key={id} aria-current={activeTab === id ? 'page' : undefined} onClick={() => setTab(id)}>{i18nT(label)}</button>)}</nav>
      <div className="aif-content">
        {activeTab === 'overview' && <Overview manifest={data?.manifest || { status: 'draft' }} tracks={tracks} onSelectTrack={openTrack} teacher={teacher} onTeacher={() => setTab('governance')} />}
        {activeTab === 'context' && <ContextIntake recordSaver={recordSaver} onRecommend={(trackId) => openTrack(TRACKS.find((item) => item.id === trackId))} />}
        {activeTab === 'batches' && <BatchMatrix batches={batches} selectedId={selectedBatch} onSelect={setSelectedBatch} onOpenTwin={() => onOpen('formation-twin')} />}
        {activeTab === 'governance' && <GovernanceWorkspace releaseGates={RELEASE_GATES} user={user} />}
      </div>
    </section>
  )
}
