import { t as i18nT } from './i18n/runtime'
/** TemptationResistancePage — 试探抵抗 (B3)。入口：今日心镜。 */
import { useState } from 'react'
import BackButton from './BackButton'
import { formationApi } from './api'
import { getToken } from './auth'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { cursor: 'pointer', borderRadius: 10, padding: '10px 14px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(255,107,107,0.85), rgba(245,181,63,0.6))' }
const fld = { width: '100%', padding: 10, borderRadius: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }

export default function TemptationResistancePage({ user, onBack }) {
  const [text, setText] = useState('')
  const [guide, setGuide] = useState(null)
  const [crisis, setCrisis] = useState(null)
  const [grace, setGrace] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function resist() {
    const t = getToken(); setBusy(true); setError(''); setGrace(null)
    try {
      const r = await formationApi.resistTemptation({ text, context_label: '' }, t)
      if (r.route === 'crisis_care') { setCrisis(r); setGuide(null) } else { setGuide(r); setCrisis(null) }
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function logOutcome(outcome) {
    const t = getToken()
    try { await formationApi.temptationCheckin({ outcome, trigger_text: text }, t); if (outcome === 'failed') setGrace(true) }
    catch (e) { setError(e.message) }
  }

  const list = (title, arr) => arr && arr.length ? (
    <div style={{ marginTop: 8 }}><div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{title}</div>
      {arr.map((a, i) => <div key={i} style={{ fontSize: 13, marginTop: 3 }}>· {a}</div>)}</div>
  ) : null

  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }
  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('🛡 试探抵抗')}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>{i18nT('试探不是你的身份 · 选下一个忠心的小步 · 不羞辱')}</div>
      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}

      <div style={card}>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder={i18nT('此刻发生了什么？（不必写露骨细节）')} style={{ ...fld, resize: 'vertical' }}  aria-label={i18nT('此刻发生了什么？（不必写露骨细节）')}/>
        <button style={btn} disabled={busy} onClick={resist}>{busy ? '…' : '现在抵抗'}</button>
      </div>

      {crisis && (
        <div style={{ ...card, background: 'rgba(255,107,107,0.10)', borderColor: 'rgba(255,107,107,0.35)' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>💗 {crisis.message}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{i18nT('请现在联系一位信任的人，或在「危机陪伴」获得即时支持。')}</div>
        </div>
      )}

      {guide && (
        <div style={card}>
          <div style={{ fontSize: 13, marginBottom: 6 }}>{guide.message}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f5b53f' }}>{i18nT('第一步：')}{guide.first_step}</div>
          {list('逃离', guide.escape_actions)}
          {list('替代', guide.replacement_actions)}
          {guide.scripture_anchor && <div style={{ marginTop: 8, fontSize: 13 }}>📖 {guide.scripture_anchor}</div>}
          {guide.accountability_suggestion && <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{guide.accountability_suggestion}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <button style={{ ...btn, padding: '6px 12px', fontSize: 12, background: 'rgba(52,199,89,0.6)' }} onClick={() => logOutcome('resisted')}>{i18nT('我抵住了')}</button>
            <button style={{ ...btn, padding: '6px 12px', fontSize: 12, background: 'rgba(125,211,252,0.5)' }} onClick={() => logOutcome('escaped')}>{i18nT('我逃离了')}</button>
            <button style={{ ...btn, padding: '6px 12px', fontSize: 12, background: 'rgba(255,255,255,0.15)' }} onClick={() => logOutcome('failed')}>{i18nT('我跌倒了')}</button>
          </div>
        </div>
      )}

      {grace && (
        <div style={{ ...card, background: 'rgba(125,211,252,0.08)' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{i18nT('跌倒不是终点')}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{i18nT('来到神面前，领受赦免，重新开始。在基督里没有定罪（罗 8:1）。可以打开「认罪与赦免」。')}</div>
        </div>
      )}
    </div>
  )
}
