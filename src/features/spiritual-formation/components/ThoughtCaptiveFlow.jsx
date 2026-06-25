import { useState } from 'react'
import SuggestField, { SuggestMenu } from '../../../components/SuggestField'
import { sinPatternMap, sinPatterns } from '../data/sinPatterns'

function uid() {
  return `thought_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export default function ThoughtCaptiveFlow({ userId, onSave }) {
  const [form, setForm] = useState({ catchThought: '', namedSinPattern: 'self_centeredness', exposedLie: '', replacementTruth: '', obedienceAction: '' })
  const [saved, setSaved] = useState(false)
  const pattern = sinPatternMap[form.namedSinPattern]
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
      catchThought: form.catchThought || 'A thought I need to bring under Christ.',
      namedSinPattern: form.namedSinPattern,
      exposedLie: form.exposedLie || pattern.coreLie,
      replacementTruth: form.replacementTruth || pattern.gospelTruth,
      obedienceAction: form.obedienceAction || pattern.putOnActions[0],
      scripture: pattern.scriptures[0],
      createdAt: now,
    })
    setSaved(true)
  }
  return (
    <section className="sf-section">
      <div className="sf-section-heading"><h2>Thought Captive Flow</h2><p>Catch, name, expose, replace, and obey.</p></div>
      <div className="sf-step-list">
        <label><b>1. Catch</b><span>What thought, image, desire, or accusation is moving through your mind?</span><span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.catchThought} onChange={(e) => update('catchThought', e.target.value)} /><SuggestMenu accent="#8c8cff" options={pattern.commonSymptoms} value={form.catchThought} onChange={(v) => update('catchThought', v)} /></span></label>
        <label><b>2. Name</b><span>Name the possible sin pattern.</span><select value={form.namedSinPattern} onChange={(e) => update('namedSinPattern', e.target.value)}>{sinPatterns.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label>
        <label><b>3. Expose</b><span>What lie is this thought asking you to believe?</span><span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.exposedLie} placeholder={pattern.coreLie} onChange={(e) => update('exposedLie', e.target.value)} /><SuggestMenu accent="#8c8cff" options={[pattern.coreLie]} value={form.exposedLie} onChange={(v) => update('exposedLie', v)} /></span></label>
        <label><b>4. Replace</b><span>What truth from God answers this lie?</span><span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.replacementTruth} placeholder={pattern.gospelTruth} onChange={(e) => update('replacementTruth', e.target.value)} /><SuggestMenu accent="#8c8cff" options={[pattern.gospelTruth]} value={form.replacementTruth} onChange={(v) => update('replacementTruth', v)} /></span></label>
        <label><b>5. Obey</b><span>What is one small act of obedience you can take now?</span><span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.obedienceAction} placeholder={pattern.putOnActions[0]} onChange={(e) => update('obedienceAction', e.target.value)} /><SuggestMenu accent="#8c8cff" options={pattern.putOnActions} value={form.obedienceAction} onChange={(v) => update('obedienceAction', v)} /></span></label>
      </div>
      <button className="sf-primary" type="button" onClick={save}>Save Thought Captive Entry</button>
      {saved && <p className="sf-success">Lord Jesus, take this thought captive. Let truth rule where lies were speaking. Give me grace to obey in this next step. Amen.</p>}
    </section>
  )
}
