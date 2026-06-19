import { useState } from 'react'
import { crisisApi } from '../lib/api'
import { triageClient } from '../lib/triage'
import { getResources } from '../data/crisisResources'
import EmergencyEscalationPanel from './EmergencyEscalationPanel'
import SafetyCheckFlow from './SafetyCheckFlow'
import CrisisResourcePanel from './CrisisResourcePanel'
import BreathingGuide from './BreathingGuide'

const BADGE = { green: 'green', yellow: 'yellow', orange: 'orange', red: 'red' }
const LEVEL_ZH = { green: '一般低落', yellow: '需要被陪伴', orange: '需要先确保安全', red: '需要立刻保护你' }

const QUICK = [
  ['stabilize', '🫁 60 秒稳定一下'],
  ['resources', '📞 拨打危机热线'],
  ['safetyplan', '🛡️ 做一个安全计划'],
  ['guardians', '🤝 联系守护人'],
  ['comfort', '🕊️ 我需要属灵安慰'],
]

/**
 * CrisisIntakeFlow — 「我现在撑不住了」入口。
 * 先用一句话分流，再按风险等级给出最该做的下一步（保命 > 稳定 > 连接 > 陪伴）。
 */
export default function CrisisIntakeFlow({ regionCode = 'TW', onNavigate, canNotify, onNotifyGuardians }) {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [showStabilize, setShowStabilize] = useState(false)

  async function run() {
    const msg = text.trim()
    if (!msg) return
    setBusy(true)
    setShowStabilize(false)
    try {
      const r = await crisisApi.triage(msg, regionCode)
      setResult(r)
    } catch {
      // backend unreachable → conservative client-side triage + local resources
      const r = triageClient(msg)
      if (r.riskLevel === 'orange' || r.riskLevel === 'red') r.resources = getResources(regionCode)
      setResult(r)
    } finally {
      setBusy(false)
    }
  }

  const level = result?.riskLevel
  const resBlock = result?.resources || (level && level !== 'green' ? getResources(regionCode) : null)

  return (
    <div>
      <div className="cc-card">
        <h3>此刻发生了什么？</h3>
        <p className="cc-muted">可以只写几个字。你不需要解释清楚所有事情。</p>
        <textarea
          className="cc-input"
          rows={3}
          value={text}
          placeholder="例如：我撑不下去了 / 我好想消失 / 我快控制不住了…"
          onChange={(e) => setText(e.target.value)}
        />
        <button className="cc-btn full danger" type="button" onClick={run} disabled={busy} style={{ marginTop: 10 }}>
          {busy ? '在这里…' : '我需要帮助'}
        </button>
      </div>

      {result && (
        <>
          <div className="cc-card">
            <span className={`cc-badge ${BADGE[level]}`}>{LEVEL_ZH[level] || level}</span>
            <p style={{ marginTop: 10 }}>
              {level === 'red' && '现在最重要的是你的即时安全。我们先把你保护好，再说别的。'}
              {level === 'orange' && '听起来你现在很痛。我想先很温柔地确认一下你的安全，好吗？'}
              {level === 'yellow' && '谢谢你愿意说出来。你不是一个人，我们慢慢来。'}
              {level === 'green' && '我听见你了。也许今天只是很累——我们一起轻轻地照顾一下自己。'}
            </p>
          </div>

          {level === 'red' && (
            <EmergencyEscalationPanel
              emergency={result.emergency}
              regionCode={resBlock?.regionCode || regionCode}
              canNotify={canNotify}
              onNotifyGuardians={onNotifyGuardians}
            />
          )}

          {level === 'orange' && (
            <>
              <SafetyCheckFlow
                onEscalate={() => setResult({ ...result, riskLevel: 'red', emergency: result.emergency })}
                onStabilize={() => setShowStabilize(true)}
                onSafetyPlan={() => onNavigate && onNavigate('safetyplan')}
              />
              {resBlock && <div className="cc-card"><h3>随时可以拨打</h3><CrisisResourcePanel block={resBlock} defaultRegion={regionCode} compact /></div>}
            </>
          )}

          {(level === 'yellow' || level === 'green') && (
            <div className="cc-card">
              <p>你现在更需要哪一种？</p>
              <div className="cc-pill-row">
                {QUICK.map(([key, label]) => (
                  <button key={key} className="cc-pill" type="button" onClick={() => (key === 'stabilize' ? setShowStabilize(true) : onNavigate && onNavigate(key))}>{label}</button>
                ))}
              </div>
            </div>
          )}

          {showStabilize && (
            <div className="cc-card"><h3>跟我一起呼吸</h3><BreathingGuide targetCycles={5} /></div>
          )}
        </>
      )}

      <div className="cc-card">
        <p className="cc-muted">或者直接选一个你现在需要的：</p>
        <div className="cc-pill-row">
          {QUICK.map(([key, label]) => (
            <button key={key} className="cc-pill" type="button" onClick={() => (key === 'stabilize' ? setShowStabilize(true) : onNavigate && onNavigate(key))}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}
