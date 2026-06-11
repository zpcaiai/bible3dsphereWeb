// MeetingScheduleModal — 语音群聚会排期：每周例行/单次，到点 Web Push 提醒，.ics 导出。
import { useCallback, useEffect, useState } from 'react'
import { API_BASE } from './api'
import { t } from './i18n/runtime'

const toast = (m, ty = 'info') => window.showToast?.(m, ty)
const WEEK = ['周一', '周二', '周三', '周四', '周五', '周六', '主日']

function authHeaders(token) {
  const h = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

// 生成 .ics 文本（每周 RRULE / 单次），时区按本地
function makeIcs(m, groupName) {
  const [hh, mm] = m.time.split(':').map(Number)
  const pad = (n) => String(n).padStart(2, '0')
  let dtstart
  let rrule = ''
  if (m.onceDate) {
    const [y, mo, d] = m.onceDate.split('-').map(Number)
    dtstart = `${y}${pad(mo)}${pad(d)}T${pad(hh)}${pad(mm)}00`
  } else {
    const now = new Date()
    const target = new Date(now)
    const diff = (m.weekday - ((now.getDay() + 6) % 7) + 7) % 7
    target.setDate(now.getDate() + diff)
    dtstart = `${target.getFullYear()}${pad(target.getMonth() + 1)}${pad(target.getDate())}T${pad(hh)}${pad(mm)}00`
    const BY = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'][m.weekday]
    rrule = `RRULE:FREQ=WEEKLY;BYDAY=${BY}\n`
  }
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//holiness//meetings//CN',
    'BEGIN:VEVENT',
    `UID:meeting-${m.id}@holiness`,
    `DTSTART;TZID=Asia/Shanghai:${dtstart}`,
    rrule.trim(),
    `SUMMARY:${(m.title || '聚会')} · ${groupName}`,
    `DESCRIPTION:语音房聚会，提前 ${m.remindMinutes} 分钟提醒`,
    'BEGIN:VALARM', `TRIGGER:-PT${m.remindMinutes || 15}M`, 'ACTION:DISPLAY', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\n')
}

export default function MeetingScheduleModal({ group, token, onClose }) {
  const [items, setItems] = useState(null)
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('weekly')   // weekly | once
  const [weekday, setWeekday] = useState(2)
  const [onceDate, setOnceDate] = useState('')
  const [time, setTime] = useState('20:00')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/meetings?group_id=${group.id}`, { headers: authHeaders(token) })
      const j = await r.json()
      setItems(j.success ? j.data : [])
    } catch { setItems([]) }
  }, [group.id, token])

  useEffect(() => { load() }, [load])

  async function create() {
    setBusy(true)
    try {
      const body = {
        group_id: group.id, title: title.trim() || t('祷告会'),
        time_hhmm: time, remind_minutes: 15,
        ...(kind === 'weekly' ? { weekday } : { once_date: onceDate }),
      }
      if (kind === 'once' && !onceDate) { toast(t('请选择日期'), 'error'); return }
      const r = await fetch(`${API_BASE}/meetings`, { method: 'POST', headers: authHeaders(token), body: JSON.stringify(body) })
      const j = await r.json()
      if (j.success) { toast(t('已排期，到点会推送提醒'), 'success'); setTitle(''); load() }
      else toast(j.detail || j.error || t('创建失败'), 'error')
    } catch (e) { toast(e.message || t('创建失败'), 'error') }
    finally { setBusy(false) }
  }

  async function del(id) {
    try {
      const r = await fetch(`${API_BASE}/meetings/${id}`, { method: 'DELETE', headers: authHeaders(token) })
      const j = await r.json()
      if (j.success) load(); else toast(j.detail || t('删除失败'), 'error')
    } catch { toast(t('删除失败'), 'error') }
  }

  function downloadIcs(m) {
    const blob = new Blob([makeIcs(m, group.name)], { type: 'text/calendar' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${m.title || 'meeting'}.ics`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.card} onClick={(e) => e.stopPropagation()}>
        <div style={S.head}>
          <span style={{ fontWeight: 700 }}>📅 {group.name} · {t('聚会排期')}</span>
          <button style={S.x} onClick={onClose}>×</button>
        </div>

        {items === null ? <div style={S.dim}>{t('加载中…')}</div> : (
          items.length === 0 ? <div style={S.dim}>{t('还没有排期。定个时间，到点自动推送提醒全群。')}</div> : (
            items.map((m) => (
              <div key={m.id} style={S.row}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={S.rowTitle}>{m.title}</div>
                  <div style={S.rowMeta}>{m.whenLabel} · {t('提前')} {m.remindMinutes} {t('分钟提醒')}</div>
                </div>
                <button style={S.mini} onClick={() => downloadIcs(m)} title={t('加入系统日历')}>📆 .ics</button>
                <button style={{ ...S.mini, color: '#ff8585' }} onClick={() => del(m.id)}>🗑</button>
              </div>
            ))
          )
        )}

        <div style={S.divider} />
        <div style={S.formRow}>
          <input style={{ ...S.input, flex: 1 }} value={title} maxLength={40}
            placeholder={t('聚会名称，如「周三晚祷告会」')} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div style={S.formRow}>
          <select style={S.input} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="weekly">{t('每周')}</option>
            <option value="once">{t('单次')}</option>
          </select>
          {kind === 'weekly' ? (
            <select style={S.input} value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
              {WEEK.map((w, i) => <option key={i} value={i}>{t(w)}</option>)}
            </select>
          ) : (
            <input style={S.input} type="date" value={onceDate} onChange={(e) => setOnceDate(e.target.value)} />
          )}
          <input style={S.input} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
        <button style={S.primary} disabled={busy} onClick={create}>{busy ? t('创建中…') : t('＋ 添加排期')}</button>
      </div>
    </div>
  )
}

const S = {
  overlay: { position: 'fixed', inset: 0, zIndex: 1350, background: 'rgba(5,7,14,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, boxSizing: 'border-box' },
  card: { width: 'min(420px, 100%)', maxHeight: '86vh', overflowY: 'auto', background: '#141826', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 18, boxSizing: 'border-box', color: '#fff' },
  head: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, fontSize: 15 },
  x: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 22, cursor: 'pointer', lineHeight: 1 },
  dim: { color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.8, padding: '14px 4px' },
  row: { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 12px', marginBottom: 8 },
  rowTitle: { fontSize: 14, fontWeight: 600 },
  rowMeta: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  mini: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 9, padding: '6px 9px', color: '#fff', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' },
  divider: { borderTop: '1px solid rgba(255,255,255,0.1)', margin: '14px 0' },
  formRow: { display: 'flex', gap: 8, marginBottom: 8 },
  input: { flex: 1, minWidth: 0, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, padding: '9px 11px', color: '#fff', fontSize: 13.5, fontFamily: 'inherit', outline: 'none' },
  primary: { display: 'block', width: '100%', background: '#34c759', border: 'none', borderRadius: 11, padding: '11px 0', color: '#06210f', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
}
