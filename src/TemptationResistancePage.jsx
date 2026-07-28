import { t as i18nT } from './i18n/runtime'
/** TemptationResistancePage — 试探抵抗 (B3)。入口：今日心镜。 */
import { useState } from 'react'
import BackButton from './BackButton'
import { formationApi } from './api'
import { getToken } from './auth'
import { ColumnSeries, localDateKey } from './components/charts'
import BreathingGuide from './features/crisis-care/components/BreathingGuide'
import { SoundConsentBar } from './lib/media/MediaControls'
// BreathingGuide 用的是 crisis-care 的 cc-* 类名，样式表只在危机页里被引入过；
// 这里内嵌它就必须一并把样式带上，否则呼吸圈和按钮会掉成裸样式。
import './features/crisis-care/app/crisis-care.css'

// 抵抗打卡只有 POST /temptation/checkins，后端没有任何读取历史的接口，
// 所以「一段时间以来」的曲线只能由本机留痕：每次打卡在本地追加一条 {date, outcome}。
// 记的是用户刚刚亲手按下的那一次，不是推算出来的数据；换设备会从头开始，页面上如实说明。
const RESIST_LOG_KEY = 'temptation_resist_log_v1'
const RESIST_LOG_DAYS = 14

function readResistLog() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(RESIST_LOG_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch { return [] }
}

function appendResistLog(outcome) {
  const next = [...readResistLog(), { date: localDateKey(new Date()), outcome }].slice(-200)
  try { window.localStorage.setItem(RESIST_LOG_KEY, JSON.stringify(next)) } catch { /* 无痕模式写不进就算了 */ }
  return next
}

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
  const [breathing, setBreathing] = useState(false)
  const [resistLog, setResistLog] = useState(readResistLog)

  async function resist() {
    const t = getToken(); setBusy(true); setError(''); setGrace(null)
    try {
      const r = await formationApi.resistTemptation({ text, context_label: '' }, t)
      if (r.route === 'crisis_care') { setCrisis(r); setGuide(null) } else { setGuide(r); setCrisis(null) }
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function logOutcome(outcome) {
    const t = getToken()
    try {
      await formationApi.temptationCheckin({ outcome, trigger_text: text }, t)
      setResistLog(appendResistLog(outcome))
      if (outcome === 'failed') setGrace(true)
    }
    catch (e) { setError(e.message) }
  }

  const list = (title, arr) => arr && arr.length ? (
    <div style={{ marginTop: 8 }}><div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{title}</div>
      {arr.map((a, i) => <div key={i} style={{ fontSize: 13, marginTop: 3 }}>· {a}</div>)}</div>
  ) : null

  // 只画「忠心的一步」（抵住 / 逃离）的每日次数：这一页明确不定罪，
  // 把跌倒也画成柱子等于把羞耻做成图表；柱状而非折线，是因为它是离散计数不是连续量。
  const dayKeys = Array.from({ length: RESIST_LOG_DAYS }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (RESIST_LOG_DAYS - 1 - i))
    return localDateKey(d)
  })
  const faithfulByDay = dayKeys.map(k => resistLog.filter(r => r.date === k && (r.outcome === 'resisted' || r.outcome === 'escaped')).length)
  const faithfulTotal = faithfulByDay.reduce((a, b) => a + b, 0)

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

      {/* 「此刻」页面上，最先能帮上忙的不是分析而是身体：先把呼吸拉长，冲动的峰值就会过去。
          BreathingGuide 的声音与振动默认关闭、自己走危机偏好开关，所以内嵌是安全的；
          同意条放在旁边，让人在这一页就能把声音打开，而不用绕去危机页。 */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700 }}>{i18nT('🫁 先呼吸，再选择')}</div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', marginTop: 3, lineHeight: 1.6 }}>
              {i18nT('冲动最强的那一两分钟会过去。吸气 4 秒、停 1 秒、呼气 6 秒，先让身体稳下来。')}
            </div>
          </div>
          <button
            style={{ ...btn, padding: '8px 12px', fontSize: 12, background: 'rgba(125,211,252,0.5)' }}
            onClick={() => setBreathing(b => !b)}
            aria-expanded={breathing}
          >
            {breathing ? i18nT('收起呼吸引导') : i18nT('现在呼吸 5 轮')}
          </button>
        </div>
        {breathing && (
          <div style={{ marginTop: 12 }}>
            <SoundConsentBar />
            <BreathingGuide targetCycles={5} />
          </div>
        )}
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

      {faithfulTotal > 0 ? (
        <div style={{ marginBottom: 12 }}>
          <ColumnSeries
            title={i18nT('近两周的忠心一步')}
            subtitle={i18nT('每次「我抵住了 / 我逃离了」记一次，共 {n} 次 · 仅存在这台设备上', { n: faithfulTotal })}
            labels={dayKeys.map(k => k.slice(5))}
            values={faithfulByDay}
            unit={i18nT('次')}
          />
        </div>
      ) : (
        <div style={{ ...card, fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
          {i18nT('还没有抵抗记录。每按一次「我抵住了」或「我逃离了」，这里就会长出一根柱子，让你看见自己不是原地踏步。')}
        </div>
      )}
    </div>
  )
}
