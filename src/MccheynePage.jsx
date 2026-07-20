// MccheynePage — 麦琴读经计划（M'Cheyne）：每日 4 段，一年通读新约/诗篇两遍、旧约一遍。
// 数据：public/mccheyne.json（已内置）；进度存 localStorage；点击段落深链读经页。
import { useEffect, useMemo, useState } from 'react'
import BackButton from './BackButton'
import { t } from './i18n/runtime'
import { mccheyneDayKey, mccheyneStreak, readMccheyneProgress, toggleMccheyneSlot } from './mccheyneProgress'

const SLOTS = [['f1', '家庭读经 ①'], ['f2', '家庭读经 ②'], ['n1', '个人读经 ①'], ['ps', '个人读经 ②']]

const parseRef = (ref) => { const m = /^(.+?)(\d+)$/.exec(String(ref || '').trim()); return m ? { book: m[1], chapter: Number(m[2]) } : null }

export default function MccheynePage({ user, onBack, onOpenPanel }) {
  const [plan, setPlan] = useState(null)
  const [done, setDone] = useState(() => readMccheyneProgress(window.localStorage, user))
  const [date, setDate] = useState(() => new Date())

  useEffect(() => {
    fetch('/mccheyne.json').then((r) => r.json()).then(setPlan).catch(() => setPlan({}))
  }, [])

  const key = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const dayKey = mccheyneDayKey(date)
  const today = plan?.[key]
  const doneToday = done[dayKey] || []

  function toggle(slot) {
    setDone(toggleMccheyneSlot(window.localStorage, user, date, slot))
  }
  function openReading(ref) {
    const p = parseRef(ref)
    if (!p || !onOpenPanel) return
    try { sessionStorage.setItem('bible-reading-open', JSON.stringify(p)) } catch { /* ignore */ }
    onOpenPanel('bible-reading')
  }
  const shiftDay = (d) => setDate(new Date(date.getTime() + d * 86400000))

  // 连续天数（含今天，向前数全勤日）
  const streak = useMemo(() => mccheyneStreak(done), [done])

  return (
    <div style={S.page}>
      <header style={S.header}>
        <BackButton onClick={onBack} />
        <span style={S.title}>{t('📅 麦琴读经计划')}</span>
        <span style={{ width: 56, fontSize: 12, color: '#7ee2a0', textAlign: 'right' }}>🔥{streak}{t('天')}</span>
      </header>
      <div style={S.body}>
        <div style={S.dateRow}>
          <button style={S.nav} onClick={() => shiftDay(-1)}>‹</button>
          <span style={S.dateLabel}>{date.getFullYear()}-{key}{doneToday.length === 4 ? ' ✅' : ''}</span>
          <button style={S.nav} onClick={() => shiftDay(1)}>›</button>
        </div>
        <p style={S.lead}>{t('罗伯特·麦琴计划：每日四段，一年读完新约与诗篇两遍、旧约一遍。「你的言语在我上膛何等甘美！」（诗 119:103）')}</p>
        {!plan && <div style={S.dim}>{t('加载中…')}</div>}
        {plan && !today && <div style={S.dim}>{t('当天无计划数据')}</div>}
        {today && SLOTS.map(([slot, label]) => (
          <div key={slot} style={{ ...S.item, opacity: doneToday.includes(slot) ? 0.6 : 1 }}>
            <button style={S.check} onClick={() => toggle(slot)}>{doneToday.includes(slot) ? '✅' : '⬜'}</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={S.slotLabel}>{t(label)}</div>
              <div style={S.refText}>{today[slot]}</div>
            </div>
            <button style={S.readBtn} onClick={() => openReading(today[slot])}>{t('📖 去读')}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

const S = {
  page: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#0d1117', color: '#fff', fontFamily: 'inherit' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 },
  title: { fontSize: 16, fontWeight: 700 },
  body: { flex: 1, overflowY: 'auto', padding: 16, maxWidth: 520, width: '100%', margin: '0 auto', boxSizing: 'border-box' },
  dateRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 10 },
  nav: { width: 34, height: 34, borderRadius: 9, border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 17, cursor: 'pointer' },
  dateLabel: { fontSize: 15, fontWeight: 700, minWidth: 120, textAlign: 'center' },
  lead: { fontSize: 12.5, lineHeight: 1.8, color: 'rgba(255,255,255,0.55)', textAlign: 'center', margin: '0 0 16px' },
  dim: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: 30 },
  item: { display: 'flex', alignItems: 'center', gap: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 13, padding: '12px 13px', marginBottom: 9 },
  check: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 0 },
  slotLabel: { fontSize: 11.5, color: 'rgba(255,255,255,0.45)' },
  refText: { fontSize: 15.5, fontWeight: 700, marginTop: 2 },
  readBtn: { background: 'rgba(232,176,75,0.14)', border: '1px solid rgba(232,176,75,0.4)', borderRadius: 9, padding: '7px 12px', color: '#ffe9b3', fontSize: 12.5, cursor: 'pointer', whiteSpace: 'nowrap' },
}
