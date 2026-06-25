import { useState } from 'react'
import { sinPatternMap, sinPatterns } from '../data/sinPatterns'
import SuggestField, { SuggestMenu } from '../../../components/SuggestField'
import { getPastoralSafetyMessage, GRACE_RECOVERY_STATEMENT } from '../lib/pastoralSafety'

function uid() {
  return `recovery_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export default function GraceRecoveryFlow({ userId, onSave }) {
  const [form, setForm] = useState({ whatHappened: '', sinPattern: '', confession: '', repairAction: '', boundaryAction: '', accountabilityAction: '', nextObedienceStep: '', recurringBondage: false, mentionsSevereDistress: false })
  const [saved, setSaved] = useState(false)
  const gp = form.sinPattern ? sinPatternMap[form.sinPattern] : null
  const WHAT_OPTS = ['I gave in to a temptation I meant to resist.', 'I reacted in anger / harsh words.', 'I escaped into something to numb myself.', 'I was dishonest or hid something.', 'I neglected what God called me to do.']
  const CONFESSION_OPTS = ['Father, I confess my sin before You; I do not hide or excuse it.', 'Lord, I have no excuse; I need Your mercy.', 'I trusted myself / an idol instead of You.', 'Forgive me, cleanse me, restore me in Christ.']
  const REPAIR_OPTS = ['Apologize to the person I hurt.', 'Make restitution where I can.', 'Confess to a trusted brother / sister.', 'No repair needed — receive grace and move on.']
  const BOUNDARY_OPTS = ['Remove the access / trigger that led here.', 'Add accountability with someone I trust.', 'Set a time / place limit to avoid the pattern.', 'Replace the habit with a healthy alternative.']
  const OBEY_OPTS = ['Return to one concrete act of obedience today.', 'Resume daily prayer / Scripture.', 'Serve someone instead of self-focus.', 'Take the next small faithful step.']
  const safety = getPastoralSafetyMessage({ recurringBondage: form.recurringBondage, mentionsSevereDistress: form.mentionsSevereDistress })
  function update(field, value) {
    setSaved(false)
    setForm((prev) => ({ ...prev, [field]: value }))
  }
  function save() {
    const now = new Date().toISOString()
    onSave({
      id: uid(),
      userId,
      date: now,
      sinPattern: form.sinPattern || undefined,
      whatHappened: form.whatHappened || 'I fell and need to return to Christ honestly.',
      confession: form.confession || 'Father, I confess my sin before You. I do not hide or excuse it.',
      receivedGraceStatement: GRACE_RECOVERY_STATEMENT,
      repairAction: form.repairAction,
      boundaryAction: form.boundaryAction,
      accountabilityAction: form.accountabilityAction,
      nextObedienceStep: form.nextObedienceStep || 'Return to one concrete act of obedience today.',
      createdAt: now,
    })
    setSaved(true)
  }
  return (
    <section className="sf-section sf-recovery">
      <div className="sf-section-heading"><h2>Grace Recovery</h2><p>Do not hide. Do not self-justify. Do not despair. Come to Christ honestly.</p></div>
      <div className="sf-form-grid">
        <label>What happened?<span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.whatHappened} onChange={(e) => update('whatHappened', e.target.value)} /><SuggestMenu accent="#8c8cff" options={WHAT_OPTS} value={form.whatHappened} onChange={(v) => update('whatHappened', v)} /></span></label>
        <label>Name the pattern if possible<select value={form.sinPattern} onChange={(e) => update('sinPattern', e.target.value)}><option value="">Not sure yet</option>{sinPatterns.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label>Confess honestly<span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.confession} onChange={(e) => update('confession', e.target.value)} /><SuggestMenu accent="#8c8cff" options={CONFESSION_OPTS} value={form.confession} onChange={(v) => update('confession', v)} /></span></label>
        <label>Repair if needed<span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.repairAction} onChange={(e) => update('repairAction', e.target.value)} /><SuggestMenu accent="#8c8cff" options={(gp ? gp.putOffActions : REPAIR_OPTS)} value={form.repairAction} onChange={(v) => update('repairAction', v)} /></span></label>
        <label>Strengthen boundary<span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.boundaryAction} onChange={(e) => update('boundaryAction', e.target.value)} /><SuggestMenu accent="#8c8cff" options={BOUNDARY_OPTS} value={form.boundaryAction} onChange={(v) => update('boundaryAction', v)} /></span></label>
        <label>Re-enter obedience<span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.nextObedienceStep} onChange={(e) => update('nextObedienceStep', e.target.value)} /><SuggestMenu accent="#8c8cff" options={(gp ? gp.putOnActions : OBEY_OPTS)} value={form.nextObedienceStep} onChange={(v) => update('nextObedienceStep', v)} /></span></label>
      </div>
      <label className="sf-check"><input type="checkbox" checked={form.recurringBondage} onChange={(e) => update('recurringBondage', e.target.checked)} /> This is recurring or destructive.</label>
      <label className="sf-check"><input type="checkbox" checked={form.mentionsSevereDistress} onChange={(e) => update('mentionsSevereDistress', e.target.checked)} /> I may need immediate real-world help.</label>
      {safety && <p className="sf-warning">{safety}</p>}
      <p className="sf-prayer">Father, I confess my sin before You. I do not hide or excuse it. Thank You that in Christ there is forgiveness and cleansing. Restore me, strengthen me, and lead me in new obedience. Amen.</p>
      <button className="sf-primary" type="button" onClick={save}>Save Recovery Entry</button>
      {saved && <p className="sf-success">{GRACE_RECOVERY_STATEMENT}</p>}
    </section>
  )
}
