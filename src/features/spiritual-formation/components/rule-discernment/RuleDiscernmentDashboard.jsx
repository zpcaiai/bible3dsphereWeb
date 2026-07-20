import { useState } from 'react'
import { evaluateDiscernment, generateRuleOfLife } from '../../lib/ruleDiscernmentEngine'
import { lifeSeasonProfiles } from '../../data/ruleDiscernmentSeed'
import { formationExtApi } from '../../../../api'
import '../../app/spiritual-formation.css'
import PlanExecutionPanel from '../../../../components/PlanExecutionPanel'

const STORAGE_KEY = 'spiritualFormation.ruleDiscernment.saved'

export default function RuleDiscernmentDashboard({ userId = 'local-user', token }) {
  const [tab, setTab] = useState('rule')
  const [ruleInput, setRuleInput] = useState({ season: 'busy_worker', energyLevel: 'normal', workPressure: 'high', familyResponsibility: 'normal', spiritualState: 'stable', churchSupport: 'loose', availableMinutesPerDay: 15 })
  const [decision, setDecision] = useState({ decisionTitle: '', optionA: '', optionB: '', fears: '', desires: '', counselReceived: '', prayerNotes: '' })
  const rule = generateRuleOfLife(ruleInput)
  const discernment = evaluateDiscernment(decision)

  function setRule(field, value) {
    setRuleInput((prev) => ({ ...prev, [field]: value }))
  }
  function setDec(field, value) {
    setDecision((prev) => ({ ...prev, [field]: value }))
  }
  function saveRule() {
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, ruleInput, rule, savedAt: new Date().toISOString() }))
    if (token) formationExtApi.ruleSave({ profile: ruleInput, rule }, token).catch((err) => { console.warn('[RuleDiscernmentDashboard.jsx] ignored async error', err) })
  }
  function saveDiscernment() {
    if (token) formationExtApi.discernmentSave({ decision_title: decision.decisionTitle, input: decision, result: discernment }, token).catch((err) => { console.warn('[RuleDiscernmentDashboard.jsx] ignored async error', err) })
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>生命规则与辨识罗盘</h2><p>规则是帮助你接受恩典的节律，不是证明自己的律法。</p></div>
      <div className="sf-chip-row">
        <button className={`sf-chip-btn ${tab === 'rule' ? 'active' : ''}`} type="button" onClick={() => setTab('rule')}>生命规则</button>
        <button className={`sf-chip-btn ${tab === 'discernment' ? 'active' : ''}`} type="button" onClick={() => setTab('discernment')}>辨识罗盘</button>
      </div>
      {tab === 'rule' ? (
        <>
          <div className="sf-card sf-form-grid">
            <label>生活季节<select value={ruleInput.season} onChange={(e) => setRule('season', e.target.value)}>{Object.entries(lifeSeasonProfiles).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></label>
            <label>精力<select value={ruleInput.energyLevel} onChange={(e) => setRule('energyLevel', e.target.value)}><option value="low">低</option><option value="normal">普通</option><option value="high">高</option></select></label>
            <label>工作压力<select value={ruleInput.workPressure} onChange={(e) => setRule('workPressure', e.target.value)}><option value="low">低</option><option value="normal">普通</option><option value="high">高</option></select></label>
            <label>教会支持<select value={ruleInput.churchSupport} onChange={(e) => setRule('churchSupport', e.target.value)}><option value="none">暂无</option><option value="loose">松散</option><option value="stable">稳定</option></select></label>
          </div>
          <p className={rule.profile.overloadRisk ? 'sf-warning' : 'sf-success'}>{rule.warningAgainstOverload}</p>
          <RuleList title="最小规则" items={rule.minimumRule} />
          <RuleList title="标准规则" items={rule.standardRule} />
          {rule.deepRule.length > 0 && <RuleList title="深度规则" items={rule.deepRule} />}
          <button className="sf-primary" type="button" onClick={saveRule}>保存当前规则</button>
          <PlanExecutionPanel
            userId={userId}
            planId={`rule-discernment:${rule.profile.season}`}
            title="生命规则执行"
            description="规则保存后仍需要真实执行记录；每日与每周节律会分别统计。"
            actions={rule.standardRule.map((item, index) => ({
              id: `${item.domain}-${index}`,
              title: item.rhythm,
              cadence: item.rhythm.includes('每周') ? 'weekly' : 'daily',
              minutes: item.minutes,
            }))}
          />
        </>
      ) : (
        <>
          <div className="sf-card sf-form-grid">
            {['decisionTitle', 'optionA', 'optionB', 'fears', 'desires', 'counselReceived', 'prayerNotes'].map((field) => (
              <label key={field}>{field}<textarea value={decision[field]} onChange={(e) => setDec(field, e.target.value)} /></label>
            ))}
          </div>
          <article className="sf-card">
            <h3>辨识结果</h3>
            {Object.entries(discernment.scores).map(([key, value]) => <div className="sf-meter-row" key={key}><span>{key}</span><i><b style={{ width: `${value}%` }} /></i><em>{value}</em></div>)}
            {discernment.cautionFlags.map((flag) => <p className="sf-warning" key={flag}>{flag}</p>)}
            <p className="sf-prayer">{discernment.nextStep}</p>
            {token && <button className="sf-primary" type="button" onClick={saveDiscernment}>保存这次辨识</button>}
          </article>
        </>
      )}
    </section>
  )
}

function RuleList({ title, items }) {
  return <article className="sf-card"><h3>{title}</h3><ul>{items.map((item) => <li key={`${item.domain}-${item.rhythm}`}><b>{item.domain}</b> · {item.rhythm}</li>)}</ul></article>
}
