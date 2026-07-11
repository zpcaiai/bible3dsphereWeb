import { t as i18nT } from '../../../i18n/runtime'
import { pick } from '../../../i18n/pickLang'
import { useEffect, useMemo, useRef, useState } from 'react'
import { horariumHours } from '../data/horariumHours'
import {
  computeHorariumStreak,
  createHorariumDayLog,
  ensureHorariumEntries,
  horariumCompletedCount,
  horariumTodayKey,
} from '../lib/horarium'

const SAVE_LABELS = {
  idle: i18nT('保存今日'),
  saving: i18nT('保存中…'),
  synced: i18nT('已同步'),
  local: i18nT('已本地保存'),
  error: i18nT('保存失败'),
}

export default function HorariumEngine({ userId, initialTodayLog, history = [], onSave }) {
  const [log, setLog] = useState(() => ensureHorariumEntries(initialTodayLog || createHorariumDayLog(userId)))
  const [saveState, setSaveState] = useState(initialTodayLog ? 'synced' : 'idle')
  const [dirty, setDirty] = useState(false)
  const hydratedKeyRef = useRef(initialTodayLog ? `${initialTodayLog.id}:${initialTodayLog.updatedAt || ''}` : '')

  useEffect(() => {
    if (!initialTodayLog || dirty) return
    const key = `${initialTodayLog.id}:${initialTodayLog.updatedAt || ''}`
    if (key && key !== hydratedKeyRef.current) {
      hydratedKeyRef.current = key
      setLog(ensureHorariumEntries(initialTodayLog))
      setSaveState('synced')
    }
  }, [initialTodayLog, dirty])

  const streak = useMemo(() => {
    const merged = [log, ...history.filter((item) => item.id !== log.id)]
    return computeHorariumStreak(merged)
  }, [log, history])

  const completed = horariumCompletedCount(log)
  const completion = Math.round((completed / horariumHours.length) * 100)
  const saveLabel = SAVE_LABELS[saveState] || i18nT('保存今日')

  function updateLog(updater) {
    setDirty(true)
    setSaveState('idle')
    setLog((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return { ...next, updatedAt: new Date().toISOString() }
    })
  }

  function updateEntry(hourId, patch) {
    updateLog((prev) => ({
      ...prev,
      entries: prev.entries.map((entry) => entry.hourId === hourId ? { ...entry, ...patch } : entry),
    }))
  }

  function toggleHour(hourId, checked) {
    updateEntry(hourId, { completed: checked, completedAt: checked ? new Date().toISOString() : '' })
  }

  async function save() {
    const next = { ...log, updatedAt: new Date().toISOString() }
    setLog(next)
    setSaveState('saving')
    try {
      const result = await onSave(next)
      if (result?.__localOnly) {
        setSaveState('local')
      } else {
        if (result?.dayLog || result?.id) {
          const saved = ensureHorariumEntries(result.dayLog || result)
          setLog(saved)
          hydratedKeyRef.current = `${saved.id}:${saved.updatedAt || ''}`
        }
        setSaveState('synced')
      }
      setDirty(false)
    } catch {
      setSaveState('error')
    }
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading holy-life-heading">
        <div>
          <h2>{i18nT('定时祷告 · Horarium')}</h2>
          <p>{i18nT('威廉·劳《敬虔与圣洁生活的严肃呼召》的固定祷告时辰：让一天在固定时刻回到神面前。')}</p>
        </div>
        <button className="sf-primary holy-life-save" type="button" onClick={save} disabled={saveState === 'saving'}>{saveLabel}</button>
      </div>

      <div className="holy-life-summary">
        <article className="sf-card">
          <h3>{i18nT('今日时辰')}</h3>
          <div className="holy-life-score">{completed}/{horariumHours.length}</div>
          <div className="sf-progress"><i style={{ width: `${completion}%` }} /></div>
          <p>{i18nT('完成率')} {completion}%</p>
        </article>
        <article className="sf-card">
          <h3>{i18nT('当前连续')}</h3>
          <div className="holy-life-score">{streak.current}</div>
          <p>{i18nT('最长')} {streak.longest} {i18nT('天 · 累计')} {streak.total} {i18nT('天')}</p>
        </article>
        <article className="sf-card">
          <h3>{i18nT('今日小记')}</h3>
          <textarea
            value={log.note}
            onChange={(event) => updateLog((prev) => ({ ...prev, note: event.target.value }))}
            placeholder={i18nT('今天在固定时辰回到神面前，有什么领受或挣扎？')}
           aria-label={i18nT('今天在固定时辰回到神面前，有什么领受或挣扎？')}/>
        </article>
      </div>

      <div className="horarium-grid">
        {horariumHours.map((hour) => {
          const entry = log.entries.find((item) => item.hourId === hour.id) || { hourId: hour.id, completed: false, reflection: '' }
          return (
            <article className={`sf-card horarium-hour ${entry.completed ? 'is-complete' : ''}`} key={hour.id}>
              <div className="holy-life-card-head">
                <div>
                  <span className="sf-card-short">{hour.time} · {hour.subject}</span>
                  <h3>{pick(hour, 'title')}</h3>
                  <p>{pick(hour, 'focus')} · {pick(hour, 'scripture')}</p>
                </div>
                <label className="holy-life-toggle">
                  <input type="checkbox" checked={entry.completed} onChange={(event) => toggleHour(hour.id, event.target.checked)} />
                  {i18nT('已祷告')}
                </label>
              </div>
              <label>{pick(hour, 'prompt')}
                <textarea
                  value={entry.reflection}
                  onChange={(event) => updateEntry(hour.id, { reflection: event.target.value })}
                  placeholder={i18nT('写一句此刻的祷告或领受...')}
                 aria-label={i18nT('写一句此刻的祷告或领受...')}/>
              </label>
            </article>
          )
        })}
      </div>

      <div className="sf-card">
        <h3>{i18nT('最近 14 天')}</h3>
        {history.filter((item) => item.id !== log.id).length ? (
          <div className="holy-life-history">
            {history.filter((item) => item.id !== log.id).slice(0, 14).map((item) => {
              const done = horariumCompletedCount(ensureHorariumEntries(item))
              const pct = Math.round((done / horariumHours.length) * 100)
              return (
                <div key={item.id}>
                  <strong>{item.date}</strong>
                  <span>{done}/{horariumHours.length}</span>
                  <i><b style={{ width: `${pct}%` }} /></i>
                  <em>{pct}%</em>
                </div>
              )
            })}
          </div>
        ) : <p className="sf-empty">{i18nT('还没有历史记录。完成今日时辰并保存后，这里会显示连续记录。')}</p>}
      </div>
    </section>
  )
}
