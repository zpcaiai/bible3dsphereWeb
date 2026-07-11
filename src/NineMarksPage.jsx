import { useEffect, useState, useCallback } from 'react'
import BackButton from './BackButton'
import { getToken } from './auth'
import { churchHealthApi } from './api'

/**
 * NineMarksPage — 健康教会九标志 · Church Health OS
 * ------------------------------------------------------------------
 * 把 9Marks 融入属灵星球：九标志成长概览 + 本地教会委身 + 讲道回应 +
 * 福音清晰度 + 门训 + 恢复性牧养 + 关怀信号。
 *
 * 原则：不是属灵身份审判；AI 不定罪/不赦罪/不执行纪律；隐私优先；危机优先真人求助。
 */

const BAND = {
  healthy:  { zh: '健康',   color: '#34c759' },
  growing:  { zh: '成长中', color: '#5ac8fa' },
  attention:{ zh: '需留意', color: '#ffd43b' },
  seedling: { zh: '起步',   color: '#ff8787' },
}
const bandOf = (b) => BAND[b] || BAND.seedling

const TABS = [
  ['overview', '概览'],
  ['membership', '委身'],
  ['sermon', '讲道回应'],
  ['gospel', '福音清晰度'],
  ['discipleship', '门训'],
  ['restoration', '恢复'],
  ['care', '关怀'],
]

const C = {
  page: { width: '100%', height: '100%', overflowY: 'auto', color: '#fff',
    background: 'radial-gradient(circle at 50% 10%, rgba(139,92,246,0.18), #05060c 60%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  wrap: { maxWidth: 720, margin: '0 auto', padding: '0 16px 120px' },
  card: { borderRadius: 16, padding: 16, marginBottom: 14,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' },
  h: { fontSize: 15, fontWeight: 700, marginBottom: 8 },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 },
  input: { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.05)',
    color: '#fff', fontSize: 13.5, marginTop: 6 },
  label: { fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.8)' },
  btn: (bg) => ({ padding: '9px 16px', borderRadius: 12, border: 'none', cursor: 'pointer',
    fontSize: 13, fontWeight: 700, background: bg || '#8b5cf6', color: '#fff' }),
  chip: (color) => ({ padding: '3px 10px', borderRadius: 12, fontSize: 11.5, fontWeight: 600,
    background: `${color}22`, color, border: `1px solid ${color}44` }),
}

function Ring({ value = 0, band = 'seedling', size = 118 }) {
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const off = circ * (1 - Math.max(0, Math.min(100, value)) / 100)
  const col = bandOf(band).color
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="46%" textAnchor="middle" fontSize="30" fontWeight="800" fill="#fff">{value}</text>
      <text x="50%" y="64%" textAnchor="middle" fontSize="11" fill={col}>{bandOf(band).zh}</text>
    </svg>
  )
}

function ScoreBar({ value = 0, color = '#5ac8fa' }) {
  return (
    <div style={{ height: 8, borderRadius: 6, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: '100%', background: color, borderRadius: 6 }} />
    </div>
  )
}

function Notice({ children, tone = 'info' }) {
  const bg = tone === 'crisis' ? 'rgba(255,107,107,0.14)' : tone === 'warn' ? 'rgba(255,212,59,0.12)' : 'rgba(90,200,250,0.1)'
  const bd = tone === 'crisis' ? 'rgba(255,107,107,0.4)' : tone === 'warn' ? 'rgba(255,212,59,0.35)' : 'rgba(90,200,250,0.3)'
  return <div style={{ padding: '10px 12px', borderRadius: 12, background: bg, border: `1px solid ${bd}`,
    fontSize: 12.5, lineHeight: 1.65, color: 'rgba(255,255,255,0.9)', marginBottom: 12 }}>{children}</div>
}

function Err({ msg }) {
  if (!msg) return null
  return <div style={{ color: '#ff8787', fontSize: 12.5, marginTop: 8 }}>⚠ {msg}</div>
}

// ── mark card ────────────────────────────────────────────────────────────────
function MarkCard({ mark }) {
  const col = bandOf(mark.band).color
  const evEntries = Object.entries(mark.evidence || {}).slice(0, 5)
  return (
    <div style={{ ...C.card, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{mark.name_zh}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 }}>{mark.name_en} · {mark.module}</div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: col }}>{mark.score}</div>
      </div>
      <div style={{ margin: '8px 0 10px' }}><ScoreBar value={mark.score} color={col} /></div>
      {evEntries.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {evEntries.map(([k, v]) => (
            <span key={k} style={C.chip('#a5b4fc')}>{k}: {typeof v === 'boolean' ? (v ? '✓' : '—') : String(v)}</span>
          ))}
        </div>
      )}
      {(mark.risks || []).map((rk, i) => (
        <div key={i} style={{ fontSize: 12, color: '#ff8787', marginBottom: 6 }}>
          ⚠ {rk.description || rk.type}{rk.items ? `：${rk.items.join('、')}` : ''}
        </div>
      ))}
      {(mark.recommendations || []).slice(0, 1).map((rc, i) => (
        <div key={i} style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
          <span style={{ color: col, fontWeight: 700 }}>下一步 · {rc.title}</span><br />{rc.description}
        </div>
      ))}
    </div>
  )
}

// ── Overview ─────────────────────────────────────────────────────────────────
function OverviewTab({ token }) {
  const [ov, setOv] = useState(null)
  const [trend, setTrend] = useState([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  const load = useCallback(async () => {
    setBusy(true); setErr('')
    try {
      const r = await churchHealthApi.overview(token)
      setOv(r.overview)
      try { const s = await churchHealthApi.snapshots(token); setTrend(s.trend || []) } catch { /* noop */ }
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }, [token])

  useEffect(() => { load() }, [load])

  const compute = async () => {
    setSaving(true); setSavedMsg('')
    try {
      const r = await churchHealthApi.computeSnapshot(token)
      setOv(r.overview); setSavedMsg('已保存本次成长快照 ✓')
      try { const s = await churchHealthApi.snapshots(token); setTrend(s.trend || []) } catch { /* noop */ }
    } catch (e) { setErr(e.message) } finally { setSaving(false) }
  }

  if (busy && !ov) return <div style={C.sub}>加载中…</div>
  if (!ov) return <Err msg={err || '暂无数据'} />

  return (
    <div>
      <Notice>{ov.disclaimer}</Notice>
      <div style={{ ...C.card, display: 'flex', alignItems: 'center', gap: 18 }}>
        <Ring value={ov.overall_score} band={ov.band} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>九标志成长总览</div>
          <div style={C.sub}>综合 {ov.overall_score} 分 · {bandOf(ov.band).zh}</div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={compute} disabled={saving} style={C.btn('#8b5cf6')}>{saving ? '计算中…' : '计算并保存快照'}</button>
            <button onClick={load} style={C.btn('#334155')}>刷新</button>
          </div>
          {savedMsg && <div style={{ color: '#34c759', fontSize: 12, marginTop: 8 }}>{savedMsg}</div>}
        </div>
      </div>

      {trend.length > 1 && (
        <div style={C.card}>
          <div style={C.h}>成长趋势（历次总分）</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60 }}>
            {trend.map((p, i) => (
              <div key={i} title={`${p.overall_score}`} style={{ flex: 1, background: '#5ac8fa55',
                borderRadius: 4, height: `${Math.max(4, p.overall_score)}%` }} />
            ))}
          </div>
        </div>
      )}

      <Err msg={err} />
      {(ov.marks || []).map((m) => <MarkCard key={m.mark_code} mark={m} />)}
    </div>
  )
}

// ── Membership ───────────────────────────────────────────────────────────────
const MEMBERSHIP_STATUS = [
  ['none', '尚无固定教会'], ['visitor', '偶尔参加'], ['regular_attender', '稳定参加'],
  ['member_candidate', '预备成员'], ['member', '正式成员'], ['inactive', '暂时中断'], ['transferred', '转会中'],
]
const BAPTISM_STATUS = [['unknown', '未填写'], ['unbaptized', '未受洗'], ['scheduled', '已预备受洗'], ['baptized', '已受洗']]

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', padding: '4px 0' }}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}

function MembershipTab({ token }) {
  const [f, setF] = useState(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  useEffect(() => {
    (async () => {
      try {
        const r = await churchHealthApi.getMembership(token)
        setF(r.membership || {
          church_name: '', membership_status: 'none', baptism_status: 'unknown', small_group_name: '',
          worship_attendance: false, small_group_participation: false, pastoral_connection: false,
          service_roles: [], consent_to_share_with_leader: false, consent_to_anonymous_aggregate: true, notes: '',
        })
      } catch (e) { setErr(e.message) }
    })()
  }, [token])

  const save = async () => {
    setMsg(''); setErr('')
    try {
      const roles = Array.isArray(f.service_roles) ? f.service_roles
        : String(f.service_roles || '').split(/[,，]/).map((s) => s.trim()).filter(Boolean).map((r) => ({ role: r }))
      const r = await churchHealthApi.saveMembership({ ...f, service_roles: roles }, token)
      setF(r.membership); setMsg('已保存 ✓')
    } catch (e) { setErr(e.message) }
  }

  if (!f) return <div style={C.sub}>加载中…</div>
  const rolesText = Array.isArray(f.service_roles) ? f.service_roles.map((x) => x.role || x).join('、') : (f.service_roles || '')

  return (
    <div>
      <Notice>本地教会委身面板：把「参加聚会」升级为「委身成员」。这些是你的自我记录，默认仅你可见。</Notice>
      <div style={C.card}>
        <div style={C.label}>本地教会名称</div>
        <input style={C.input} value={f.church_name || ''} onChange={(e) => set('church_name', e.target.value)} placeholder="例如：恩典归正教会"  aria-label="例如：恩典归正教会"/>
        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={C.label}>成员状态</div>
            <select style={C.input} value={f.membership_status} onChange={(e) => set('membership_status', e.target.value)}>
              {MEMBERSHIP_STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={C.label}>受洗状态</div>
            <select style={C.input} value={f.baptism_status} onChange={(e) => set('baptism_status', e.target.value)}>
              {BAPTISM_STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={C.label}>小组 / 团契</div>
          <input style={C.input} value={f.small_group_name || ''} onChange={(e) => set('small_group_name', e.target.value)} placeholder="所属小组名称"  aria-label="所属小组名称"/>
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={C.label}>服事岗位（用逗号分隔）</div>
          <input style={C.input} value={rolesText} onChange={(e) => set('service_roles', e.target.value)} placeholder="例如：招待、诗班、儿童主日学"  aria-label="例如：招待、诗班、儿童主日学"/>
        </div>
        <div style={{ marginTop: 10, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Toggle label="本周参加了主日敬拜" checked={f.worship_attendance} onChange={(v) => set('worship_attendance', v)} />
          <Toggle label="有稳定参与的小组/团契" checked={f.small_group_participation} onChange={(v) => set('small_group_participation', v)} />
          <Toggle label="与牧者/长老/小组长有牧养关系" checked={f.pastoral_connection} onChange={(v) => set('pastoral_connection', v)} />
        </div>
        <div style={{ marginTop: 10, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Toggle label="允许把成长概览分享给我的教会带领者" checked={f.consent_to_share_with_leader} onChange={(v) => set('consent_to_share_with_leader', v)} />
          <Toggle label="允许纳入匿名群体健康趋势（不含个人信息）" checked={f.consent_to_anonymous_aggregate} onChange={(v) => set('consent_to_anonymous_aggregate', v)} />
        </div>
        <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={save} style={C.btn('#34c759')}>保存委身档案</button>
          {msg && <span style={{ color: '#34c759', fontSize: 12 }}>{msg}</span>}
        </div>
        <Err msg={err} />
      </div>
    </div>
  )
}

// ── Sermon formation ─────────────────────────────────────────────────────────
function SermonTab({ token }) {
  const [scripture, setScripture] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [reflection, setReflection] = useState('')
  const [save, setSave] = useState(true)
  const [out, setOut] = useState(null)
  const [list, setList] = useState([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const loadList = useCallback(async () => {
    try { const r = await churchHealthApi.listSermons(token); setList(r.items || []) } catch { /* noop */ }
  }, [token])
  useEffect(() => { loadList() }, [loadList])

  const run = async () => {
    if (!scripture.trim()) { setErr('请填写讲道经文'); return }
    setBusy(true); setErr(''); setOut(null)
    try {
      const r = await churchHealthApi.formSermon({ scripture_ref: scripture, sermon_title: title, raw_notes: notes, user_reflection: reflection, save }, token)
      setOut(r.formation)
      if (r.saved_id) loadList()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  const rows = out ? [
    ['经文主旨', out.main_point], ['指向基督/福音', out.gospel_connection],
    ['需要悔改', out.repentance_prompt], ['需要相信', out.faith_prompt],
    ['本周顺服', out.obedience_action], ['肢体应用', out.community_action],
  ] : []

  return (
    <div>
      <Notice>把主日讲道转化为「主旨 → 悔改 → 相信 → 顺服 → 肢体应用」，而不是脱离经文的属灵建议。</Notice>
      <div style={C.card}>
        <div style={C.label}>讲道经文 *</div>
        <input style={C.input} value={scripture} onChange={(e) => setScripture(e.target.value)} placeholder="例如：以弗所书 4:1-16"  aria-label="例如：以弗所书 4:1-16"/>
        <div style={C.label}>讲道标题</div>
        <input style={C.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="选填"  aria-label="选填"/>
        <div style={{ ...C.label, marginTop: 12 }}>我的讲道笔记</div>
        <textarea style={{ ...C.input, minHeight: 80, resize: 'vertical' }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="记下讲道的重点、经文、你被触动之处…"  aria-label="记下讲道的重点、经文、你被触动之处…"/>
        <div style={{ ...C.label, marginTop: 8 }}>我的回应/挣扎（选填）</div>
        <textarea style={{ ...C.input, minHeight: 60, resize: 'vertical' }} value={reflection} onChange={(e) => setReflection(e.target.value)} />
        <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={run} disabled={busy} style={C.btn('#8b5cf6')}>{busy ? '生成中…' : '生成讲道回应'}</button>
          <Toggle label="保存为讲道记录" checked={save} onChange={setSave} />
        </div>
        <Err msg={err} />
      </div>

      {out && (
        <div style={C.card}>
          <div style={C.h}>讲道回应 {out.source === 'ai' ? '· AI' : ''}</div>
          {rows.map(([k, v]) => (
            <div key={k} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: '#a5b4fc', fontWeight: 700 }}>{k}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>{v || '—'}</div>
            </div>
          ))}
        </div>
      )}

      {list.length > 0 && (
        <div style={C.card}>
          <div style={C.h}>我的讲道记录（{list.length}）</div>
          {list.map((s) => (
            <div key={s.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{s.scripture_ref}{s.sermon_title ? ` · ${s.sermon_title}` : ''}</div>
              {s.main_point && <div style={C.sub}>{s.main_point}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Gospel clarity ───────────────────────────────────────────────────────────
const GOSPEL_GRID = [['god_score', '神的圣洁与创造'], ['sin_score', '人的罪与审判'], ['christ_score', '基督·十架·复活'], ['response_score', '悔改与信心的回应']]

function GospelTab({ token }) {
  const [text, setText] = useState('')
  const [out, setOut] = useState(null)
  const [hist, setHist] = useState([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const loadHist = useCallback(async () => {
    try { const r = await churchHealthApi.listGospel(token); setHist(r.items || []) } catch { /* noop */ }
  }, [token])
  useEffect(() => { loadHist() }, [loadHist])

  const run = async () => {
    if (!text.trim()) { setErr('请写下你如何理解福音'); return }
    setBusy(true); setErr(''); setOut(null)
    try {
      const r = await churchHealthApi.assessGospel({ source_type: 'user_reflection', source_text: text }, token)
      setOut(r.assessment); loadHist()
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div>
      <Notice>用「神—人—基督—回应」四格检查你的福音表达，防止被道德主义/成功神学/心理化悄悄替换。这不是定罪，而是把根基重新指回基督。</Notice>
      <div style={C.card}>
        <div style={C.label}>写下：你如何理解福音？为什么神接纳你？</div>
        <textarea style={{ ...C.input, minHeight: 90, resize: 'vertical' }} value={text} onChange={(e) => setText(e.target.value)} placeholder="用自己的话表达…"  aria-label="用自己的话表达…"/>
        <div style={{ marginTop: 12 }}>
          <button onClick={run} disabled={busy} style={C.btn('#ffd43b')}><span style={{ color: '#1a1a2e' }}>{busy ? '评估中…' : '评估福音清晰度'}</span></button>
        </div>
        <Err msg={err} />
      </div>

      {out && (
        <div style={C.card}>
          <div style={C.h}>四格评估 {out.source === 'ai' ? '· AI' : ''}</div>
          {GOSPEL_GRID.map(([k, l]) => (
            <div key={k} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span>{l}</span><span style={{ color: '#ffd43b', fontWeight: 700 }}>{out[k]} / 5</span>
              </div>
              <div style={{ marginTop: 4 }}><ScoreBar value={(out[k] / 5) * 100} color="#ffd43b" /></div>
            </div>
          ))}
          {(out.detected_distortions || []).length > 0 && (
            <div style={{ margin: '10px 0', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {out.detected_distortions.map((d) => <span key={d} style={C.chip('#ff8787')}>可能偏向：{d}</span>)}
            </div>
          )}
          {out.gentle_reframe && <Notice tone="info">{out.gentle_reframe}</Notice>}
          {out.next_teaching && <div style={C.sub}>下一步教导：{out.next_teaching}</div>}
        </div>
      )}

      {hist.length > 0 && (
        <div style={C.card}>
          <div style={C.h}>历史评估（{hist.length}）</div>
          {hist.map((h) => (
            <div key={h.id} style={{ display: 'flex', gap: 6, padding: '6px 0', fontSize: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={C.chip('#a5b4fc')}>神{h.god_score}</span>
              <span style={C.chip('#a5b4fc')}>罪{h.sin_score}</span>
              <span style={C.chip('#a5b4fc')}>基督{h.christ_score}</span>
              <span style={C.chip('#a5b4fc')}>回应{h.response_score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Discipleship ─────────────────────────────────────────────────────────────
const REL_TYPE = [['being_discipled', '我被门训'], ['discipling', '我门训别人'], ['peer', '同伴彼此督责']]

function DiscipleshipTab({ token }) {
  const [f, setF] = useState({ counterpart: '', relation_type: 'being_discipled', meeting_rhythm: '', goals: '', next_meeting_at: '' })
  const [list, setList] = useState([])
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  const load = useCallback(async () => {
    try { const r = await churchHealthApi.listDiscipleship(token); setList(r.items || []) } catch { /* noop */ }
  }, [token])
  useEffect(() => { load() }, [load])

  const create = async () => {
    setErr(''); setMsg('')
    try {
      const goals = String(f.goals || '').split(/[,，]/).map((s) => s.trim()).filter(Boolean).map((g) => ({ goal: g }))
      await churchHealthApi.createDiscipleship({ ...f, goals }, token)
      setMsg('已添加门训关系 ✓'); setF({ counterpart: '', relation_type: 'being_discipled', meeting_rhythm: '', goals: '', next_meeting_at: '' }); load()
    } catch (e) { setErr(e.message) }
  }

  return (
    <div>
      <Notice>门训不是上完课程，而是生命共同体：被门训、门训别人、彼此效法。让一位成熟肢体陪你走一段。</Notice>
      <div style={C.card}>
        <div style={C.label}>对方（昵称）</div>
        <input style={C.input} value={f.counterpart} onChange={(e) => set('counterpart', e.target.value)} placeholder="门训伙伴/前辈/门徒"  aria-label="门训伙伴/前辈/门徒"/>
        <div style={{ ...C.label, marginTop: 12 }}>关系类型</div>
        <select style={C.input} value={f.relation_type} onChange={(e) => set('relation_type', e.target.value)}>
          {REL_TYPE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div style={{ ...C.label, marginTop: 12 }}>见面节律</div>
        <input style={C.input} value={f.meeting_rhythm} onChange={(e) => set('meeting_rhythm', e.target.value)} placeholder="例如：每两周一次"  aria-label="例如：每两周一次"/>
        <div style={{ ...C.label, marginTop: 12 }}>成长目标（逗号分隔）</div>
        <input style={C.input} value={f.goals} onChange={(e) => set('goals', e.target.value)} placeholder="例如：祷告、圣洁、家庭、传福音"  aria-label="例如：祷告、圣洁、家庭、传福音"/>
        <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={create} style={C.btn('#51cf66')}>添加门训关系</button>
          {msg && <span style={{ color: '#34c759', fontSize: 12 }}>{msg}</span>}
        </div>
        <Err msg={err} />
      </div>

      {list.length > 0 && (
        <div style={C.card}>
          <div style={C.h}>我的门训关系（{list.length}）</div>
          {list.map((d) => (
            <div key={d.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {(REL_TYPE.find((r) => r[0] === d.relation_type) || [, d.relation_type])[1]}
                {d.counterpart ? ` · ${d.counterpart}` : ''}
              </div>
              {d.meeting_rhythm && <div style={C.sub}>{d.meeting_rhythm}</div>}
              {Array.isArray(d.goals) && d.goals.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {d.goals.map((g, i) => <span key={i} style={C.chip('#51cf66')}>{g.goal || g}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Restoration (repentance) ─────────────────────────────────────────────────
const REPENT_STATUS = [['struggling', '正在挣扎'], ['repenting', '正在悔改'], ['restoring', '恢复中'], ['stable', '较为稳定']]

function RestorationTab({ token }) {
  const [f, setF] = useState({ sin_pattern: '', trigger_context: '', confession_notes: '', repentance_steps: '', accountability_plan: '', repentance_status: 'struggling' })
  const [list, setList] = useState([])
  const [resp, setResp] = useState(null)
  const [err, setErr] = useState('')
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))

  const load = useCallback(async () => {
    try { const r = await churchHealthApi.listRepentance(token); setList(r.items || []) } catch { /* noop */ }
  }, [token])
  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!f.sin_pattern.trim()) { setErr('请填写你想面对的罪/挣扎'); return }
    setErr(''); setResp(null)
    try {
      const steps = String(f.repentance_steps || '').split(/[,，\n]/).map((s) => s.trim()).filter(Boolean)
      const r = await churchHealthApi.createRepentance({ ...f, repentance_steps: steps }, token)
      setResp(r); setF({ sin_pattern: '', trigger_context: '', confession_notes: '', repentance_steps: '', accountability_plan: '', repentance_status: 'struggling' }); load()
    } catch (e) { setErr(e.message) }
  }

  return (
    <div>
      <Notice tone="warn">恢复性牧养，不是教会纪律的执行。AI 不定罪、不赦罪、不执行纪律；这些记录默认仅你可见。若涉及安全风险，请优先寻求真人帮助。</Notice>
      <div style={C.card}>
        <div style={C.label}>我想诚实面对的罪 / 挣扎 *</div>
        <input style={C.input} value={f.sin_pattern} onChange={(e) => set('sin_pattern', e.target.value)} placeholder="用你能接受的方式简述"  aria-label="用你能接受的方式简述"/>
        <div style={{ ...C.label, marginTop: 12 }}>触发情境</div>
        <input style={C.input} value={f.trigger_context} onChange={(e) => set('trigger_context', e.target.value)} placeholder="通常在什么时候/情形下发生"  aria-label="通常在什么时候/情形下发生"/>
        <div style={{ ...C.label, marginTop: 12 }}>认罪/省察笔记</div>
        <textarea style={{ ...C.input, minHeight: 60, resize: 'vertical' }} value={f.confession_notes} onChange={(e) => set('confession_notes', e.target.value)} />
        <div style={{ ...C.label, marginTop: 8 }}>悔改的具体步骤（逗号/换行分隔）</div>
        <input style={C.input} value={f.repentance_steps} onChange={(e) => set('repentance_steps', e.target.value)} placeholder="例如：删除应用、约人同行、每日祷告"  aria-label="例如：删除应用、约人同行、每日祷告"/>
        <div style={{ ...C.label, marginTop: 12 }}>督责安排</div>
        <input style={C.input} value={f.accountability_plan} onChange={(e) => set('accountability_plan', e.target.value)} placeholder="例如：每周向门训伙伴汇报"  aria-label="例如：每周向门训伙伴汇报"/>
        <div style={{ ...C.label, marginTop: 12 }}>当前状态</div>
        <select style={C.input} value={f.repentance_status} onChange={(e) => set('repentance_status', e.target.value)}>
          {REPENT_STATUS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div style={{ marginTop: 12 }}><button onClick={create} style={C.btn('#e879a6')}>私密保存</button></div>
        <Err msg={err} />
      </div>

      {resp && (
        <div style={C.card}>
          {resp.crisis && <Notice tone="crisis">{resp.crisis_notice}</Notice>}
          {resp.guidance && <div style={C.sub}>{resp.guidance.message}</div>}
        </div>
      )}

      {list.length > 0 && (
        <div style={C.card}>
          <div style={C.h}>我的恢复记录（仅你可见 · {list.length}）</div>
          {list.map((r) => (
            <div key={r.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13 }}>{r.sin_pattern}</span>
                <span style={C.chip(r.risk_level === 'crisis' ? '#ff8787' : '#5ac8fa')}>
                  {(REPENT_STATUS.find((s) => s[0] === r.repentance_status) || [, r.repentance_status])[1]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Care ─────────────────────────────────────────────────────────────────────
function CareTab({ token }) {
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    (async () => {
      try { const r = await churchHealthApi.careSignals(token); setData(r) } catch (e) { setErr(e.message) }
    })()
  }, [token])

  if (err) return <Err msg={err} />
  if (!data) return <div style={C.sub}>加载中…</div>

  return (
    <div>
      <Notice>{data.boundary}</Notice>
      <div style={{ ...C.card, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 13 }}>整体状态</span>
        <span style={C.chip(bandOf(data.overall_band).color)}>{bandOf(data.overall_band).zh}</span>
      </div>

      {(data.next_steps || []).length > 0 && (
        <div style={C.card}>
          <div style={C.h}>最需要留意的下一步</div>
          {data.next_steps.map((s, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc' }}>{s.name_zh} · {s.title}</div>
              <div style={C.sub}>{s.description}</div>
            </div>
          ))}
        </div>
      )}

      {(data.live_signals || []).length > 0 && (
        <div style={C.card}>
          <div style={C.h}>关怀信号</div>
          {data.live_signals.map((s, i) => (
            <div key={i} style={{ fontSize: 12.5, color: '#ffb3b3', marginBottom: 6 }}>⚠ {s.summary}</div>
          ))}
        </div>
      )}

      {(!data.next_steps || data.next_steps.length === 0) && (!data.live_signals || data.live_signals.length === 0) && (
        <div style={C.card}><div style={C.sub}>目前没有需要特别留意的信号。继续在本地教会、肢体关系与真人牧养中成长。</div></div>
      )}
    </div>
  )
}

// ── Page shell ───────────────────────────────────────────────────────────────
export default function NineMarksPage({ user, onBack }) {
  const token = getToken()
  const [tab, setTab] = useState('overview')

  if (!user) {
    return (
      <div style={C.page}>
        <div style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <BackButton onClick={onBack} />
          <div style={{ fontSize: 16, fontWeight: 700 }}>健康教会九标志</div>
        </div>
        <div style={C.wrap}><Notice>请先登录，以使用 Church Health OS。</Notice></div>
      </div>
    )
  }

  const Body = { overview: OverviewTab, membership: MembershipTab, sermon: SermonTab,
    gospel: GospelTab, discipleship: DiscipleshipTab, restoration: RestorationTab, care: CareTab }[tab]

  return (
    <div style={C.page}>
      <div style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(5,6,12,0.72)', backdropFilter: 'blur(10px)' }}>
        <BackButton onClick={onBack} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>健康教会九标志</div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.45)' }}>Church Health OS · 归回本地教会的成长生态</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '10px 16px', position: 'sticky', top: 56, zIndex: 20,
        background: 'rgba(5,6,12,0.6)', backdropFilter: 'blur(8px)' }}>
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            whiteSpace: 'nowrap', padding: '7px 14px', borderRadius: 16, border: 'none', cursor: 'pointer',
            fontSize: 12.5, fontWeight: 700,
            background: tab === k ? '#8b5cf6' : 'rgba(255,255,255,0.07)',
            color: tab === k ? '#fff' : 'rgba(255,255,255,0.7)' }}>{l}</button>
        ))}
      </div>

      <div style={C.wrap}>
        <Body token={token} user={user} />
      </div>
    </div>
  )
}
