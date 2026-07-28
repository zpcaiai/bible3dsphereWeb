// MccheynePage — 麦琴读经计划（M'Cheyne）：每日 4 段，一年通读新约/诗篇两遍、旧约一遍。
// 数据：public/mccheyne.json（已内置）；进度存 localStorage；每段可深链阅读或自动打开逐章查经。
import { useEffect, useMemo, useState } from 'react'
import BackButton from './BackButton'
import { t } from './i18n/runtime'
import { mccheyneDayKey, mccheyneStreak, readMccheyneProgress, toggleMccheyneSlot } from './mccheyneProgress'
import { CalendarHeatmap } from './components/charts'

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
  function openReading(ref, autoStudy = false) {
    const p = parseRef(ref)
    if (!p || !onOpenPanel) return
    try { sessionStorage.setItem('bible-reading-open', JSON.stringify({ ...p, autoStudy })) } catch { /* ignore */ }
    onOpenPanel('bible-reading')
  }
  const shiftDay = (d) => setDate(new Date(date.getTime() + d * 86400000))

  // 连续天数（含今天，向前数全勤日）
  const streak = useMemo(() => mccheyneStreak(done), [done])

  // 年度热力图的真实数据源就是 readMccheyneProgress 的结构：{ 'YYYY-MM-DD': ['f1','n1',…] }。
  // value 取当天已勾选的段数（0–4），所以「深色 = 那天四段都读完了」，不是随便的强度。
  const yearCells = useMemo(() => Object.entries(done)
    .map(([day, slots]) => ({ date: day, value: Array.isArray(slots) ? slots.length : 0 }))
    .filter((cell) => cell.value > 0), [done])
  const fullDays = yearCells.filter((cell) => cell.value === 4).length

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
        {today && (
          <div style={S.studyGuide}>
            <div style={S.studyTitle}>{t('🔍 今日查经路径')}</div>
            <div style={S.studyText}>{t('依次阅读四章；每章观察“神是谁、神做了什么、怎样指向福音”，最后写下一项今天可验证的顺服。点击“查经”可直接生成该章的逐节详解、神学主题、应用与祷告。')}</div>
          </div>
        )}
        {!plan && <div style={S.dim}>{t('加载中…')}</div>}
        {plan && !today && <div style={S.dim}>{t('当天无计划数据')}</div>}
        {today && SLOTS.map(([slot, label]) => (
          <div key={slot} style={{ ...S.item, opacity: doneToday.includes(slot) ? 0.6 : 1 }}>
            <button style={S.check} onClick={() => toggle(slot)}>{doneToday.includes(slot) ? '✅' : '⬜'}</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={S.slotLabel}>{t(label)}</div>
              <div style={S.refText}>{today[slot]}</div>
            </div>
            <div style={S.actions}>
              <button style={S.readBtn} onClick={() => openReading(today[slot])}>{t('📖 阅读')}</button>
              <button style={S.studyBtn} onClick={() => openReading(today[slot], true)}>{t('🔍 查经')}</button>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 18 }}>
          {yearCells.length > 0 ? (
            <CalendarHeatmap
              data={yearCells}
              weeks={53}
              unit={t('段')}
              title={t('一年读经热力图')}
              subtitle={t('近一年有 {days} 天读了经，其中 {full} 天四段全勤；格子越深，那天读完的段数越多。', { days: yearCells.length, full: fullDays })}
            />
          ) : (
            <div style={S.dim}>{t('还没有勾选过任何一段经文。勾选第一段之后，这里会出现一整年的读经热力图。')}</div>
          )}
        </div>
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
  studyGuide: { background: 'linear-gradient(135deg,rgba(255,214,10,0.10),rgba(90,200,250,0.07))', border: '1px solid rgba(255,214,10,0.22)', borderRadius: 13, padding: '12px 13px', marginBottom: 13 },
  studyTitle: { color: '#ffd60a', fontSize: 13, fontWeight: 700, marginBottom: 5 },
  studyText: { color: 'rgba(255,255,255,0.68)', fontSize: 12, lineHeight: 1.7 },
  dim: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: 30 },
  item: { display: 'flex', alignItems: 'center', gap: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 13, padding: '12px 13px', marginBottom: 9 },
  check: { background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 0 },
  slotLabel: { fontSize: 11.5, color: 'rgba(255,255,255,0.45)' },
  refText: { fontSize: 15.5, fontWeight: 700, marginTop: 2 },
  actions: { display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 },
  readBtn: { background: 'rgba(232,176,75,0.14)', border: '1px solid rgba(232,176,75,0.4)', borderRadius: 8, padding: '5px 9px', color: '#ffe9b3', fontSize: 11.5, cursor: 'pointer', whiteSpace: 'nowrap' },
  studyBtn: { background: 'rgba(90,200,250,0.12)', border: '1px solid rgba(90,200,250,0.35)', borderRadius: 8, padding: '5px 9px', color: '#9ee7ff', fontSize: 11.5, cursor: 'pointer', whiteSpace: 'nowrap' },
}
