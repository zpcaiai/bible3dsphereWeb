import { useState } from 'react'
import { POST_CRISIS_PHASE_LABELS, POST_CRISIS_TASKS } from '../data/crisisContent'
import { importCrisisToFormation } from '../lib/formationBridge'

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
      setError('导入失败，但你随时可以直接去模式库手动开始。')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="cc-card">
      <h3>危机后的恢复路径</h3>
      <p className="cc-muted">危机过去了，先别急着做大改变。先让身体和心慢慢回来。</p>
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
        <h4 style={{ margin: '0 0 6px' }}>准备好之后，交给「模式库」</h4>
        <p className="cc-muted" style={{ margin: '0 0 10px' }}>
          这不是说你的危机就是某种罪。等你稳定下来，模式库可以陪你慢慢看见更长期的内在模式。
          我们会为你生成一个 30 天、轻强度的恢复起点——你可以随时修改，也可以先不开始。
        </p>
        {!imported ? (
          <button className="cc-btn full" type="button" onClick={importToLibrary} disabled={importing}>
            {importing ? '正在生成恢复计划…' : '把这段经历导入模式库，生成恢复计划'}
          </button>
        ) : (
          <>
            <p style={{ color: '#34c759', margin: '0 0 8px' }}>
              已生成「{imported.title}」。你可以在模式库里编辑、更换主题，或随时暂停。
            </p>
            {onOpenLibrary && (
              <button className="cc-btn full secondary" type="button" onClick={onOpenLibrary}>打开模式库</button>
            )}
          </>
        )}
        {error && <p className="cc-muted" style={{ color: '#ff9f8a', marginTop: 8 }}>{error}</p>}
      </div>
    </div>
  )
}
