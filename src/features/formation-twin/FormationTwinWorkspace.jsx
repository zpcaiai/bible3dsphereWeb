import { useCallback, useEffect, useRef, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import {
  confirmFormationVoice,
  createFormationCheckin,
  createFormationJournal,
  deleteFormationEvent,
  deleteFormationVoice,
  eraseFormationTwinData,
  exportFormationTwinData,
  listFormationSources,
  listFormationTimeline,
  setFormationEventExcluded,
  setFormationSourcePaused,
  updateFormationTranscript,
  uploadFormationVoice,
} from './formationTwinApi'
import FormationTwinEmotions from './FormationTwinEmotions'
import FormationTwinFormation from './FormationTwinFormation'

const TABS = [
  ['emotions', '情感状态', '≈'],
  ['formation', '属灵形成', '◇'],
  ['checkin', '状态签到', '◉'],
  ['journal', '私密日志', '✎'],
  ['voice', '语音记录', '◌'],
  ['timeline', '生命事件', '⌁'],
  ['sources', '数据来源', '⛓'],
]

const EMOTIONS = ['平安', '喜乐', '感恩', '盼望', '疲惫', '焦虑', '难过', '愤怒', '孤单', '麻木']
const DOMAINS = ['SPIRITUAL_LIFE', 'EMOTIONAL_LIFE', 'FAMILY', 'CHURCH', 'WORK', 'STUDY', 'REST', 'GRIEF']
const DOMAIN_LABELS = {
  SPIRITUAL_LIFE: '属灵生活', EMOTIONAL_LIFE: '情感生活', FAMILY: '家庭', CHURCH: '教会',
  WORK: '工作', STUDY: '学习', REST: '休息', GRIEF: '哀伤',
}
const SOURCE_LABELS = {
  prayer: '祷告系统', holy_habit: '圣洁习惯', devotion: '灵修记录', attention: '注意力系统',
  crisis: '危机照护', formation: '形成引擎', worldview: '世界观反思', gift_calling: '恩赐与呼召', church: '教会生活',
}

function eventId(prefix) {
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${id}`
}

function ErrorNotice({ error }) {
  return error ? <div className="ft-workspace-error" role="alert">{error}</div> : null
}

function SaveNotice({ result, onSafety }) {
  if (!result) return null
  if (result.status === 'ROUTED_TO_CRISIS' || result.crisis) {
    return (
      <div className="ft-workspace-alert" role="alert">
        <strong>{i18nT('先照顾安全')}</strong>
        <span>{i18nT('这条记录触发了安全优先流程。请立即联系可信任的真人；如果有即时危险，请联系当地紧急服务。')}</span>
        <button type="button" onClick={onSafety}>{i18nT('打开安全帮助')}</button>
      </div>
    )
  }
  return <div className="ft-workspace-success" role="status">{i18nT('已安全保存；只生成可核对的事实事件。')}</div>
}

function CheckinPanel({ onSafety, onSaved }) {
  const [state, setState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('formation-twin-checkin-draft')) || {} } catch { return {} }
  })
  const [emotions, setEmotions] = useState([])
  const [bodyStates, setBodyStates] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    localStorage.setItem('formation-twin-checkin-draft', JSON.stringify(state))
  }, [state])

  const set = (key, value) => setState((current) => ({ ...current, [key]: value }))
  const toggleEmotion = (emotion) => setEmotions((current) => current.includes(emotion)
    ? current.filter((item) => item !== emotion)
    : [...current.slice(-4), emotion])
  const toggleBodyState = (bodyLabel) => setBodyStates((current) => current.includes(bodyLabel)
    ? current.filter((item) => item !== bodyLabel)
    : [...current.slice(-4), bodyLabel])

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true); setError(''); setResult(null)
    try {
      const data = await createFormationCheckin({
        client_event_id: eventId('checkin'),
        checkin_type: 'QUICK_CHECKIN',
        occurred_at: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai',
        overall_state: state.overall_state === undefined ? null : Number(state.overall_state),
        energy_level: state.energy_level === undefined ? null : Number(state.energy_level),
        stress_level: state.stress_level === undefined ? null : Number(state.stress_level),
        sleep_quality: state.sleep_quality === undefined ? null : Number(state.sleep_quality),
        primary_emotions: emotions.map((emotion) => ({ emotion })),
        body_states: bodyStates.map((body_label) => ({ body_label })),
        gratitude: state.gratitude || '', struggle: state.struggle || '',
        support_needed: state.support_needed || '', short_note: state.short_note || '',
        life_domains: state.life_domains || [], processing_preference: state.processing_preference || 'STORE_ONLY',
      })
      setResult(data); localStorage.removeItem('formation-twin-checkin-draft'); setState({}); setEmotions([]); setBodyStates([]); onSaved?.()
    } catch (caught) { setError(caught.message) } finally { setSaving(false) }
  }

  return (
    <form className="ft-entry-form" onSubmit={submit}>
      <div className="ft-form-intro"><h3>{i18nT('此刻的我')}</h3><p>{i18nT('每一项都可选；这里记录你的主动表达，不替你解释。')}</p></div>
      <div className="ft-slider-grid">
        {[['overall_state', '整体状态'], ['energy_level', '精力'], ['stress_level', '压力'], ['sleep_quality', '睡眠质量']].map(([key, label]) => (
          <label key={key}><span>{i18nT(label)} <b>{state[key] ?? '—'}</b></span><input type="range" min="0" max="10" value={state[key] ?? 5} onChange={(e) => set(key, e.target.value)} /></label>
        ))}
      </div>
      <fieldset><legend>{i18nT('我选择的情绪（最多 5 项）')}</legend><div className="ft-choice-row">{EMOTIONS.map((emotion) => <button aria-pressed={emotions.includes(emotion)} type="button" key={emotion} onClick={() => toggleEmotion(emotion)}>{i18nT(emotion)}</button>)}</div></fieldset>
      <fieldset><legend>{i18nT('我注意到的身体感受（最多 5 项）')}</legend><div className="ft-choice-row">{['胸口发紧', '肩颈紧张', '疲劳', '坐立不安', '麻木', '放松', '温暖', '精力充沛'].map((bodyLabel) => <button aria-pressed={bodyStates.includes(bodyLabel)} type="button" key={bodyLabel} onClick={() => toggleBodyState(bodyLabel)}>{i18nT(bodyLabel)}</button>)}</div></fieldset>
      <fieldset><legend>{i18nT('涉及的生活领域')}</legend><div className="ft-choice-row">{DOMAINS.map((domain) => <button aria-pressed={(state.life_domains || []).includes(domain)} type="button" key={domain} onClick={() => set('life_domains', (state.life_domains || []).includes(domain) ? state.life_domains.filter((item) => item !== domain) : [...(state.life_domains || []), domain])}>{i18nT(DOMAIN_LABELS[domain])}</button>)}</div></fieldset>
      <div className="ft-text-grid">
        <label>{i18nT('感恩')}<textarea value={state.gratitude || ''} onChange={(e) => set('gratitude', e.target.value)} /></label>
        <label>{i18nT('挣扎')}<textarea value={state.struggle || ''} onChange={(e) => set('struggle', e.target.value)} /></label>
        <label>{i18nT('我需要的支持')}<textarea value={state.support_needed || ''} onChange={(e) => set('support_needed', e.target.value)} /></label>
        <label>{i18nT('补充说明')}<textarea value={state.short_note || ''} onChange={(e) => set('short_note', e.target.value)} /></label>
      </div>
      <label className="ft-preference">{i18nT('处理偏好')}<select value={state.processing_preference || 'STORE_ONLY'} onChange={(e) => set('processing_preference', e.target.value)}><option value="STORE_ONLY">{i18nT('仅安全保存')}</option><option value="ALLOW_FUTURE_ANALYSIS">{i18nT('允许未来经授权的分析')}</option><option value="EXCLUDE_FROM_TWIN">{i18nT('不纳入孪生处理')}</option></select></label>
      <ErrorNotice error={error} /><SaveNotice result={result} onSafety={onSafety} />
      <button className="ft-submit" disabled={saving || (!emotions.length && !bodyStates.length && state.overall_state === undefined && state.energy_level === undefined && state.stress_level === undefined)}>{saving ? i18nT('正在保存…') : i18nT('保存这次签到')}</button>
    </form>
  )
}

function JournalPanel({ onSafety, onSaved }) {
  const [content, setContent] = useState(() => localStorage.getItem('formation-twin-journal-draft') || '')
  const [type, setType] = useState('FREE_JOURNAL')
  const [preference, setPreference] = useState('STORE_ONLY')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  useEffect(() => { localStorage.setItem('formation-twin-journal-draft', content) }, [content])
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError(''); setResult(null)
    try {
      const data = await createFormationJournal({ client_event_id: eventId('journal'), journal_type: type, title: '', content, occurred_at: new Date().toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai', life_domains: [], user_selected_emotions: [], processing_preference: preference })
      setResult(data); setContent(''); localStorage.removeItem('formation-twin-journal-draft'); onSaved?.()
    } catch (caught) { setError(caught.message) } finally { setSaving(false) }
  }
  return (
    <form className="ft-entry-form" onSubmit={submit}>
      <div className="ft-form-intro"><h3>{i18nT('写下真实发生的事')}</h3><p>{i18nT('正文使用加密存储，不进入事件总线；系统只保留最少元数据引用。')}</p></div>
      <div className="ft-field-row"><label>{i18nT('日志类型')}<select value={type} onChange={(e) => setType(e.target.value)}><option value="FREE_JOURNAL">{i18nT('自由日志')}</option><option value="GRATITUDE_JOURNAL">{i18nT('感恩日志')}</option><option value="SUFFERING_JOURNAL">{i18nT('苦难记录')}</option><option value="SPIRITUAL_REFLECTION">{i18nT('属灵反思')}</option><option value="LIFE_TRANSITION_RECORD">{i18nT('人生转变')}</option></select></label><label>{i18nT('处理偏好')}<select value={preference} onChange={(e) => setPreference(e.target.value)}><option value="STORE_ONLY">{i18nT('仅安全保存')}</option><option value="ALLOW_FUTURE_ANALYSIS">{i18nT('允许未来经授权的分析')}</option><option value="EXCLUDE_FROM_TWIN">{i18nT('不纳入孪生处理')}</option></select></label></div>
      <label className="ft-journal-editor">{i18nT('私密正文')}<textarea required minLength="1" maxLength="20000" value={content} onChange={(e) => setContent(e.target.value)} placeholder={i18nT('写下你愿意保存的内容…')} /></label>
      <small className="ft-field-note">{i18nT('草稿暂存于这台设备；提交后由服务端加密保存。')}</small>
      <ErrorNotice error={error} /><SaveNotice result={result} onSafety={onSafety} />
      <button className="ft-submit" disabled={saving || !content.trim()}>{saving ? i18nT('正在加密保存…') : i18nT('加密保存日志')}</button>
    </form>
  )
}

function VoicePanel({ onSafety, onSaved }) {
  const recorder = useRef(null)
  const chunks = useRef([])
  const [recording, setRecording] = useState(false)
  const [file, setFile] = useState(null)
  const [consent, setConsent] = useState(false)
  const [voice, setVoice] = useState(null)
  const [transcript, setTranscript] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const start = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunks.current = []
      recorder.current = new MediaRecorder(stream)
      recorder.current.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data) }
      recorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: recorder.current.mimeType || 'audio/webm' })
        setFile(new File([blob], 'formation-voice.webm', { type: blob.type }))
        stream.getTracks().forEach((track) => track.stop())
      }
      recorder.current.start(); setRecording(true)
    } catch { setError(i18nT('无法使用麦克风，请检查浏览器权限，或选择已有音频文件。')) }
  }
  const stop = () => { recorder.current?.stop(); setRecording(false) }
  const upload = async () => {
    setBusy(true); setError('')
    try { const data = await uploadFormationVoice(file); setVoice(data); setTranscript(data.transcript || '') } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  const confirm = async () => {
    setBusy(true); setError('')
    try {
      await updateFormationTranscript(voice.voice_journal_id, transcript)
      const data = await confirmFormationVoice(voice.voice_journal_id)
      setVoice({ ...voice, confirmed: true, result: data }); onSaved?.()
    } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }
  const discard = async () => { if (voice?.voice_journal_id) await deleteFormationVoice(voice.voice_journal_id).catch(() => {}); setVoice(null); setFile(null); setTranscript('') }
  return (
    <div className="ft-entry-form">
      <div className="ft-form-intro"><h3>{i18nT('先转写，再由你确认')}</h3><p>{i18nT('音频只用于转写，转写后立即丢弃；未经你确认不会生成生命事件。')}</p></div>
      {!voice ? <>
        <div className="ft-voice-actions"><button type="button" onClick={recording ? stop : start}>{recording ? i18nT('停止录音') : i18nT('开始录音')}</button><label>{i18nT('或选择音频')}<input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label></div>
        {file && <p className="ft-file-ready">{i18nT('已准备：')}{file.name}</p>}
        <label className="ft-consent"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />{i18nT('我同意将本次音频发送到转写服务；音频不会长期保存。')}</label>
        <button type="button" className="ft-submit" disabled={!file || !consent || busy} onClick={upload}>{busy ? i18nT('正在转写…') : i18nT('上传并转写')}</button>
      </> : <>
        <label className="ft-journal-editor">{i18nT('请核对并编辑转写文字')}<textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} /></label>
        <div className="ft-confirm-row"><button type="button" className="ft-submit" disabled={busy || !transcript.trim() || voice.confirmed} onClick={confirm}>{voice.confirmed ? i18nT('已确认生成事件') : i18nT('确认文字并生成事件')}</button><button type="button" className="ft-text-button" onClick={discard}>{i18nT('删除本次记录')}</button></div>
        <SaveNotice result={voice.result} onSafety={onSafety} />
      </>}
      <ErrorNotice error={error} />
    </div>
  )
}

function TimelinePanel({ refreshKey }) {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => { setLoading(true); setError(''); try { setItems((await listFormationTimeline({ limit: 100 })).items || []) } catch (caught) { setError(caught.message) } finally { setLoading(false) } }, [])
  useEffect(() => { load() }, [load, refreshKey])
  const control = async (eventIdValue, action) => { try { if (action === 'delete') await deleteFormationEvent(eventIdValue); else await setFormationEventExcluded(eventIdValue, action === 'exclude'); await load() } catch (caught) { setError(caught.message) } }
  return <div className="ft-timeline"><div className="ft-form-intro"><h3>{i18nT('可核对的生命事件')}</h3><p>{i18nT('这里展示事实、来源、时间与处理状态；敏感正文不会显示在事件卡片中。')}</p></div><ErrorNotice error={error} />{loading ? <p className="ft-muted">{i18nT('正在加载…')}</p> : items.length === 0 ? <div className="ft-workspace-empty">{i18nT('还没有生命事件。可以从一次主动签到开始。')}</div> : items.map((item) => <article className="ft-timeline-item" key={item.event_id}><div><span>{item.source_module}</span><time>{new Date(item.occurred_at).toLocaleString()}</time></div><h4>{i18nT(item.event_type)}</h4><p>{item.event_subtype || i18nT('用户确认的事实记录')} · {item.status}</p><div className="ft-timeline-actions"><button type="button" onClick={() => control(item.event_id, item.exclude_from_twin_processing ? 'include' : 'exclude')}>{item.exclude_from_twin_processing ? i18nT('重新纳入') : i18nT('排除处理')}</button><button type="button" onClick={() => control(item.event_id, 'delete')}>{i18nT('删除')}</button></div></article>)}</div>
}

function SourcesPanel() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const load = useCallback(async () => { try { setItems((await listFormationSources()).items || []) } catch (caught) { setError(caught.message) } }, [])
  useEffect(() => { load() }, [load])
  const toggle = async (item) => { try { await setFormationSourcePaused(item.source_module, item.status === 'ACTIVE'); await load() } catch (caught) { setError(caught.message) } }
  const exportData = async () => {
    setError(''); setMessage('')
    try {
      const data = await exportFormationTwinData()
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a'); link.href = url; link.download = `formation-twin-${new Date().toISOString().slice(0, 10)}.json`; link.click()
      URL.revokeObjectURL(url); setMessage(i18nT('导出文件已生成。'))
    } catch (caught) { setError(caught.message) }
  }
  const erase = async () => {
    setError(''); setMessage('')
    try {
      const result = await eraseFormationTwinData()
      setItems([]); setConfirmation('')
      setMessage(result.complete === false
        ? i18nT('PostgreSQL 中的 Formation Twin 数据已删除；可选关系图当前不可用，图谱删除状态未能验证。')
        : i18nT('Formation Twin 数据已永久删除。'))
    } catch (caught) { setError(caught.message) }
  }
  return <div className="ft-sources"><div className="ft-form-intro"><h3>{i18nT('逐项授权数据来源')}</h3><p>{i18nT('所有来源默认暂停。启用后也只接收明确列出的最少字段。')}</p></div><ErrorNotice error={error} />{message && <div className="ft-workspace-success" role="status">{message}</div>}{items.map((item) => <article key={item.source_module}><header><div><h4>{i18nT(SOURCE_LABELS[item.source_module] || item.source_module)}</h4><span className={item.status === 'ACTIVE' ? 'active' : ''}>{item.status === 'ACTIVE' ? i18nT('已启用') : i18nT('已暂停')}</span></div><button type="button" onClick={() => toggle(item)}>{item.status === 'ACTIVE' ? i18nT('暂停') : i18nT('启用')}</button></header><details><summary>{i18nT('查看数据边界')}</summary><p><strong>{i18nT('允许：')}</strong>{item.allowed_fields.join('、')}</p><p><strong>{i18nT('禁止：')}</strong>{item.blocked_fields.join('、')}</p></details></article>)}<section className="ft-data-rights"><h4>{i18nT('我的数据权利')}</h4><p>{i18nT('你可以导出完整个人副本，或永久删除 Formation Twin 中的全部数据。')}</p><button type="button" onClick={exportData}>{i18nT('导出 Formation Twin 数据')}</button><label>{i18nT('永久删除前，请输入 DELETE')}<input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label><button type="button" className="danger" disabled={confirmation !== 'DELETE'} onClick={erase}>{i18nT('永久删除全部孪生数据')}</button></section></div>
}

export default function FormationTwinWorkspace({ user, initialTab = 'checkin', onSafety }) {
  const [tab, setTab] = useState(initialTab)
  const [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => { setTab(initialTab) }, [initialTab])
  if (!user) return <section className="ft-workspace"><div className="ft-workspace-empty">{i18nT('登录后可以使用加密签到、日志、语音确认与事件控制。')}</div></section>
  const saved = () => setRefreshKey((value) => value + 1)
  return (
    <section className="ft-workspace" id="formation-twin-workspace" aria-labelledby="ft-workspace-title">
      <div className="ft-section-heading"><div><span>{i18nT('LIFE EVENT WORKSPACE')}</span><h2 id="ft-workspace-title">{i18nT('记录与控制')}</h2></div><p>{i18nT('默认仅保存 · 随时排除或删除')}</p></div>
      <div className="ft-workspace-shell">
        <nav aria-label={i18nT('Formation Twin 工作台')}>
          {TABS.map(([key, label, icon]) => <button type="button" key={key} aria-current={tab === key ? 'page' : undefined} onClick={() => setTab(key)}><span aria-hidden="true">{icon}</span>{i18nT(label)}</button>)}
        </nav>
        <div className="ft-workspace-panel">
          {tab === 'checkin' && <CheckinPanel onSafety={onSafety} onSaved={saved} />}
          {tab === 'emotions' && <FormationTwinEmotions />}
          {tab === 'formation' && <FormationTwinFormation />}
          {tab === 'journal' && <JournalPanel onSafety={onSafety} onSaved={saved} />}
          {tab === 'voice' && <VoicePanel onSafety={onSafety} onSaved={saved} />}
          {tab === 'timeline' && <TimelinePanel refreshKey={refreshKey} />}
          {tab === 'sources' && <SourcesPanel />}
        </div>
      </div>
    </section>
  )
}
