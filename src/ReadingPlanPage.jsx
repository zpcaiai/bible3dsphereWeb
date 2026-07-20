import { t as i18nT } from './i18n/runtime'
/**
 * ReadingPlanPage — 读经计划（具体实践 + 账号进度 + 本机过程记录）
 * 计划内容来自 readingPlans.js；完成天数同步后端，过程反思只保存在当前设备。
 */
import { useCallback, useEffect, useState } from 'react'
import { PLANS, planById, todayMMDD, planDayKey, buildReadingPracticeSteps } from './readingPlans'
import { fetchReadingStatus, enrollReadingPlan, completeReadingDay, uncompleteReadingDay } from './api'
import { getToken } from './auth'
import {
  listReadingPracticeRecords,
  readReadingPracticeRecord,
  readingPracticeIdentity,
  readingPracticePercent,
  writeReadingPracticeRecord,
} from './readingPracticeProgress'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, marginBottom: 12 }

function getStorage() {
  try { return window.localStorage } catch { return null }
}

function dayLabel(plan, dayKey) {
  if (!dayKey) return ''
  if (plan?.kind === 'date') return i18nT('今日 · {day}', { day: dayKey })
  return i18nT('第 {day} 天', { day: Number.parseInt(dayKey.slice(1), 10) })
}

export default function ReadingPlanPage({ user }) {
  const [planId, setPlanId] = useState('mccheyne')
  const [status, setStatus] = useState(null)
  const [mccheyne, setMccheyne] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [syncError, setSyncError] = useState('')
  const [practice, setPractice] = useState(null)
  const [history, setHistory] = useState([])
  const plan = planById(planId)
  const identity = readingPracticeIdentity(user)

  useEffect(() => {
    fetch('/mccheyne.json')
      .then((response) => response.json())
      .then(setMccheyne)
      .catch((error) => console.warn('[ReadingPlanPage.jsx] failed to load McCheyne plan', error))
  }, [])
  const load = useCallback(async () => {
    const token = getToken()
    setSyncError('')
    if (!token) { setLoading(false); return }
    setLoading(true)
    try {
      setStatus(await fetchReadingStatus(planId, token))
    } catch {
      setSyncError(i18nT('账号进度暂时无法同步；你仍可继续本机实践记录。'))
    } finally {
      setLoading(false)
    }
  }, [planId])
  useEffect(() => { load() }, [load])

  const completed = new Set(status?.completed_keys || [])
  let dayKey = '', refs = [], theme = ''
  if (plan?.kind === 'date') {
    dayKey = todayMMDD()
    const entry = mccheyne?.[dayKey]
    if (entry) refs = [entry.f1, entry.f2, entry.n1, entry.ps].filter(Boolean)
  } else if (plan?.kind === 'seq') {
    let index = 0
    while (index < plan.length && completed.has(planDayKey(plan, index))) index += 1
    if (index >= plan.length) index = plan.length - 1
    dayKey = planDayKey(plan, index)
    refs = plan.days[index]?.refs || []
    theme = plan.days[index]?.theme || ''
  }

  const steps = buildReadingPracticeSteps(plan, refs)
  const todayDone = completed.has(dayKey)
  const planPct = plan ? Math.round((status?.completed_count || 0) / plan.length * 100) : 0
  const practicePct = readingPracticePercent(practice, steps.length)
  const checked = new Set(practice?.checkedStepIds || [])
  const readyToFinish = steps.length > 0
    && steps.every((step) => checked.has(step.id))
    && Boolean(practice?.insight?.trim())
    && Boolean(practice?.action?.trim())
  const practiceDone = Boolean(practice?.completedAt)

  useEffect(() => {
    if (!planId || !dayKey) return
    const storage = getStorage()
    setPractice(readReadingPracticeRecord(storage, identity, planId, dayKey))
    setHistory(listReadingPracticeRecords(storage, identity, planId))
  }, [identity, planId, dayKey])

  function updatePractice(change) {
    setPractice((current) => {
      const base = current || readReadingPracticeRecord(getStorage(), identity, planId, dayKey)
      const changed = typeof change === 'function' ? change(base) : { ...base, ...change }
      const saved = writeReadingPracticeRecord(getStorage(), identity, { ...changed, totalSteps: steps.length })
      setHistory(listReadingPracticeRecords(getStorage(), identity, planId))
      return saved
    })
  }

  function toggleStep(stepId) {
    updatePractice((current) => {
      const ids = new Set(current.checkedStepIds || [])
      if (ids.has(stepId)) ids.delete(stepId)
      else ids.add(stepId)
      return { ...current, checkedStepIds: [...ids], completedAt: null }
    })
  }

  async function finishPractice() {
    if (!readyToFinish || busy) return
    setBusy(true)
    setSyncError('')
    const token = getToken()
    try {
      if (token && !todayDone) {
        await enrollReadingPlan(planId, token)
        await completeReadingDay(planId, dayKey, token)
      }
      updatePractice({ completedAt: new Date().toISOString() })
      if (token) await load()
    } catch {
      setSyncError(i18nT('今日实践已保留在本机，但账号进度同步失败，请稍后重试。'))
    } finally {
      setBusy(false)
    }
  }

  async function undoCompletion() {
    if (busy) return
    setBusy(true)
    setSyncError('')
    const token = getToken()
    try {
      if (token && todayDone) await uncompleteReadingDay(planId, dayKey, token)
      updatePractice({ completedAt: null })
      if (token) await load()
    } catch {
      setSyncError(i18nT('暂时无法撤销账号进度，请稍后重试。'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ padding: '14px 16px 90px', maxWidth: 680, margin: '0 auto', color: '#fff' }}>
      <div role="tablist" aria-label={i18nT('选择灵修计划')} style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 14, paddingBottom: 2 }}>
        {PLANS.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={planId === item.id} onClick={() => { setStatus(null); setPlanId(item.id) }} style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
            background: planId === item.id ? `${item.color}28` : 'rgba(255,255,255,0.05)', color: planId === item.id ? item.color : 'rgba(255,255,255,0.55)' }}>{i18nT(item.name)}</button>
        ))}
      </div>

      {plan && (
        <>
          <section style={{ ...card, background: `linear-gradient(135deg, ${plan.color}1c, rgba(255,255,255,0.03))`, borderColor: `${plan.color}44` }}>
            <div style={{ fontSize: 17, fontWeight: 750 }}>{i18nT(plan.name)}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.58)', marginTop: 4, lineHeight: 1.6 }}>{i18nT(plan.subtitle)}</div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 12 }}>
              <span style={pill(plan.color)}>⏱ {i18nT(plan.duration)}</span>
              <span style={pill(plan.color)}>📅 {i18nT(plan.rhythm)}</span>
            </div>
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.045)', color: 'rgba(255,255,255,0.76)', fontSize: 12.5, lineHeight: 1.65 }}>
              <strong style={{ color: plan.color }}>{i18nT('计划目标：')}</strong>{i18nT(plan.outcome)}
            </div>
          </section>

          <section aria-label={i18nT('执行进度')} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 750 }}>{i18nT('执行进度')}</div>
                <div style={{ marginTop: 3, fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}>{i18nT('记录节奏，不评判属灵生命')}</div>
              </div>
              <Ring pct={planPct} color={plan.color} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, marginTop: 12 }}>
              <Metric value={`${status?.completed_count || 0}/${plan.length}`} label={i18nT('读经天数')} color={plan.color} />
              <Metric value={`${status?.streak || 0}`} label={i18nT('连续天数')} color="#ff9f0a" />
              <Metric value={`${practicePct}%`} label={i18nT('今日实践')} color="#5ac8fa" />
            </div>
            <PracticeHistory records={history} currentDayKey={dayKey} currentRecord={practice} totalSteps={steps.length} color={plan.color} />
            <div style={{ marginTop: 10, fontSize: 10.5, color: 'rgba(255,255,255,0.34)', lineHeight: 1.55 }}>
              {i18nT('读经天数与连续天数登录后同步；步骤、亮光和行动只保存在当前设备。')}
            </div>
          </section>

          <section style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.48)' }}>
                  {dayLabel(plan, dayKey)}
                  {theme && <span style={{ color: plan.color, fontWeight: 700 }}> · {i18nT(theme)}</span>}
                </div>
                <div style={{ marginTop: 4, fontSize: 15, fontWeight: 750 }}>{i18nT('今日具体实践')}</div>
              </div>
              <span style={{ ...pill(plan.color), flexShrink: 0 }}>{checked.size}/{steps.length}</span>
            </div>

            {refs.length === 0 ? (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{plan.kind === 'date' && !mccheyne ? i18nT('加载中…') : i18nT('今日经文加载中…')}</div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {steps.map((step) => {
                  const done = checked.has(step.id)
                  return (
                    <label key={step.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 11px', borderRadius: 11, border: `1px solid ${done ? `${plan.color}55` : 'rgba(255,255,255,0.08)'}`, background: done ? `${plan.color}12` : 'rgba(255,255,255,0.025)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={done} onChange={() => toggleStep(step.id)} style={{ marginTop: 3, accentColor: plan.color, width: 17, height: 17, flexShrink: 0 }} />
                      <span style={{ minWidth: 0 }}>
                        <strong style={{ display: 'block', fontSize: 13, color: done ? plan.color : 'rgba(255,255,255,0.9)' }}>{step.icon} {i18nT(step.label, step.params)}</strong>
                        <span style={{ display: 'block', marginTop: 3, fontSize: 11.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.53)' }}>{i18nT(step.detail)}</span>
                      </span>
                    </label>
                  )
                })}
              </div>
            )}

            <label style={fieldLabel}>
              <span>{i18nT('今天哪一句经文或哪一点最触动我？')}</span>
              <textarea aria-label={i18nT('今日亮光')} value={practice?.insight || ''} onChange={(event) => updatePractice({ insight: event.target.value, completedAt: null })} rows={2} placeholder={i18nT('写下经文位置和一句自己的话…')} style={field} />
            </label>
            <label style={fieldLabel}>
              <span>{i18nT('我将在什么时间，向谁，做哪一件事？')}</span>
              <textarea aria-label={i18nT('今日行动')} value={practice?.action || ''} onChange={(event) => updatePractice({ action: event.target.value, completedAt: null })} rows={2} placeholder={i18nT('例如：今晚 8 点主动给妈妈打电话，先听她说十分钟…')} style={field} />
            </label>

            {syncError && <div role="alert" style={{ marginTop: 10, padding: '9px 10px', borderRadius: 9, background: 'rgba(255,159,10,0.1)', border: '1px solid rgba(255,159,10,0.25)', color: '#ffd5a1', fontSize: 11.5, lineHeight: 1.5 }}>{syncError}</div>}

            {practiceDone ? (
              <div style={{ marginTop: 14 }}>
                <div style={{ padding: '11px 12px', borderRadius: 11, background: 'rgba(52,199,89,0.12)', border: '1px solid rgba(52,199,89,0.3)', color: '#72df91', textAlign: 'center', fontSize: 13, fontWeight: 700 }}>{i18nT('✓ 今日实践已记录')}</div>
                <button type="button" onClick={undoCompletion} disabled={busy} style={textButton}>{busy ? i18nT('处理中…') : i18nT('撤销今日完成')}</button>
              </div>
            ) : (
              <>
                <button type="button" onClick={finishPractice} disabled={!readyToFinish || busy || loading} style={{ width: '100%', marginTop: 14, padding: 13, borderRadius: 12, border: 'none', cursor: readyToFinish ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 750, background: readyToFinish ? `linear-gradient(135deg, ${plan.color}, #5ac8fa)` : 'rgba(255,255,255,0.08)', color: readyToFinish ? '#fff' : 'rgba(255,255,255,0.35)' }}>
                  {busy ? i18nT('同步中…') : readyToFinish ? i18nT('完成并记录今日实践') : i18nT('完成步骤并写下亮光与行动')}
                </button>
                <div style={{ marginTop: 7, textAlign: 'center', fontSize: 10.5, color: 'rgba(255,255,255,0.34)' }}>{i18nT('可以分段完成，当前内容会自动保存在本机。')}</div>
              </>
            )}
          </section>

          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', textAlign: 'center', lineHeight: 1.65 }}>
            {i18nT('读经不是为了证明自己；若今天中断，可以从下一小步重新开始。')}
          </div>
        </>
      )}
    </div>
  )
}

function pill(color) {
  return { display: 'inline-flex', alignItems: 'center', padding: '5px 9px', borderRadius: 999, background: `${color}13`, border: `1px solid ${color}35`, color: 'rgba(255,255,255,0.7)', fontSize: 10.5, lineHeight: 1.4 }
}

const fieldLabel = { display: 'grid', gap: 6, marginTop: 13, fontSize: 12, fontWeight: 650, color: 'rgba(255,255,255,0.76)' }
const field = { width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 62, padding: '10px 11px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', outline: 'none', background: 'rgba(0,0,0,0.2)', color: '#fff', font: 'inherit', fontSize: 12.5, lineHeight: 1.55 }
const textButton = { display: 'block', margin: '7px auto 0', padding: '6px 10px', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontSize: 11.5 }

function Metric({ value, label, color }) {
  return (
    <div style={{ minWidth: 0, padding: '9px 6px', borderRadius: 10, textAlign: 'center', background: 'rgba(255,255,255,0.035)' }}>
      <div style={{ color, fontSize: 16, fontWeight: 750 }}>{value}</div>
      <div style={{ marginTop: 2, color: 'rgba(255,255,255,0.4)', fontSize: 9.5 }}>{label}</div>
    </div>
  )
}

function PracticeHistory({ records, currentDayKey, currentRecord, totalSteps, color }) {
  const merged = [...records]
  if (currentRecord?.updatedAt && !merged.some((item) => item.dayKey === currentDayKey)) merged.unshift(currentRecord)
  if (merged.length === 0) return (
    <div style={{ marginTop: 12, padding: '10px 11px', borderRadius: 9, background: 'rgba(255,255,255,0.025)', color: 'rgba(255,255,255,0.38)', fontSize: 11.5 }}>
      {i18nT('完成第一个步骤后，这里会显示最近 7 次实践记录。')}
    </div>
  )
  return (
    <div style={{ marginTop: 13 }}>
      <div style={{ marginBottom: 7, color: 'rgba(255,255,255,0.45)', fontSize: 10.5 }}>{i18nT('最近 7 次实践记录')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(merged.length, 7)}, minmax(0, 1fr))`, alignItems: 'end', gap: 5, minHeight: 58 }}>
        {merged.slice(0, 7).reverse().map((item) => {
          const denominator = item.totalSteps || (item.dayKey === currentDayKey ? totalSteps : 0)
          const pct = readingPracticePercent(item, denominator)
          return (
            <div key={`${item.planId}-${item.dayKey}`} title={`${item.dayKey}: ${pct}%`} style={{ minWidth: 0, textAlign: 'center' }}>
              <div style={{ height: 38, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 2px' }}>
                <span style={{ display: 'block', width: '100%', minHeight: 3, height: `${Math.max(3, pct * 0.38)}px`, borderRadius: '4px 4px 2px 2px', background: item.completedAt ? color : `${color}88` }} />
              </div>
              <div style={{ marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', color: 'rgba(255,255,255,0.34)', fontSize: 8.5 }}>{item.dayKey.replace(/^d0*/, '')}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Ring({ pct, color }) {
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - pct / 100)
  return (
    <svg width="58" height="58" viewBox="0 0 58 58" aria-label={i18nT('计划进度 {pct}%', { pct })}>
      <circle cx="29" cy="29" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
      <circle cx="29" cy="29" r={radius} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 29 29)" style={{ transition: 'stroke-dashoffset .6s' }} />
      <text x="29" y="33" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">{pct}%</text>
    </svg>
  )
}
