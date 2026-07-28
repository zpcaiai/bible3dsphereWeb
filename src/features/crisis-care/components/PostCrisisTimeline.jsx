import { t as i18nT } from '../../../i18n/runtime'
import { useState } from 'react'
import { POST_CRISIS_PHASE_LABELS, POST_CRISIS_TASKS } from '../data/crisisContent'
import { importCrisisToFormation } from '../lib/formationBridge'
import { TrendLine } from '../../../components/charts'

/**
 * PostCrisisTimeline — 危机后恢复（24h/72h/7d/30d）。
 * 危机过去后，不急着「立志改变」，先恢复、复盘、再慢慢重建。
 * 30 天后可温柔地把这段经历「导入模式库」，开始更长期的更新（用户可改、可不开始）。
 */
const PHASES = ['24h', '72h', '7d', '30d']

export default function PostCrisisTimeline({ userId = 'local-user', token, riskTypes, onOpenLibrary }) {
  const [done, setDone] = useState({})
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(null)
  const [error, setError] = useState('')

  function toggle(key) {
    setDone((d) => ({ ...d, [key]: !d[key] }))
  }

  async function importToLibrary() {
    setImporting(true)
    setError('')
    try {
      const { plan } = await importCrisisToFormation({ userId, token, riskTypes })
      setImported(plan)
    } catch (e) {
      setError(i18nT('导入失败，但你随时可以直接去模式库手动开始。'))
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="cc-card">
      <h3>{i18nT('危机后的恢复路径')}</h3>
      <p className="cc-muted">{i18nT('危机过去了，先别急着做大改变。先让身体和心慢慢回来。')}</p>

      {/* 恢复曲线：在危机后的低谷里，「我一点都没有变好」是最常见也最不准确的判断。
          把已完成的照顾动作画出来，让人亲眼看见自己确实在往回走。 */}
      <div style={{ margin: '12px 0' }}>
        <TrendLine
          title={i18nT('你正在往回走')}
          subtitle={i18nT('这条线画的不是心情，是你为自己做到的照顾动作。心情会起伏，这些动作是真的。')}
          labels={PHASES.map((ph) => POST_CRISIS_PHASE_LABELS[ph])}
          series={[{ name: i18nT('已完成的照顾动作'), values: PHASES.map((ph) => POST_CRISIS_TASKS[ph].filter((_, i) => done[`${ph}-${i}`]).length) }]}
          height={150}
          yUnit={i18nT(' 项')}
        />
      </div>
      {PHASES.map((phase) => (
        <div className="cc-phase" key={phase}>
          <h4>{POST_CRISIS_PHASE_LABELS[phase]}</h4>
          {POST_CRISIS_TASKS[phase].map((task, i) => {
            const key = `${phase}-${i}`
            return (
              <label className="cc-task" key={key}>
                <input type="checkbox" checked={!!done[key]} onChange={() => toggle(key)} />
                <span style={{ textDecoration: done[key] ? 'line-through' : 'none', opacity: done[key] ? 0.55 : 1 }}>{task}</span>
              </label>
            )
          })}
        </div>
      ))}

      <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: 'rgba(52,199,89,0.07)', border: '1px solid rgba(52,199,89,0.22)' }}>
        <h4 style={{ margin: '0 0 6px' }}>{i18nT('准备好之后，交给「模式库」')}</h4>
        <p className="cc-muted" style={{ margin: '0 0 10px' }}>
          {i18nT('这不是说你的危机就是某种罪。等你稳定下来，模式库可以陪你慢慢看见更长期的内在模式。 我们会为你生成一个 30 天、轻强度的恢复起点——你可以随时修改，也可以先不开始。')}
        </p>
        {!imported ? (
          <button className="cc-btn full" type="button" onClick={importToLibrary} disabled={importing}>
            {importing ? '正在生成恢复计划…' : '把这段经历导入模式库，生成恢复计划'}
          </button>
        ) : (
          <>
            <p style={{ color: '#34c759', margin: '0 0 8px' }}>
              {i18nT('已生成「')}{imported.title}{i18nT('」。你可以在模式库里编辑、更换主题，或随时暂停。')}
            </p>
            {onOpenLibrary && (
              <button className="cc-btn full secondary" type="button" onClick={onOpenLibrary}>{i18nT('打开模式库')}</button>
            )}
          </>
        )}
        {error && <p className="cc-muted" style={{ color: '#ff9f8a', marginTop: 8 }}>{error}</p>}
      </div>
    </div>
  )
}
