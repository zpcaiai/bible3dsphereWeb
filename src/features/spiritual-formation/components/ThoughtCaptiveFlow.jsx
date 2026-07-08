import { useState } from 'react'
import { SuggestMenu } from '../../../components/SuggestField'
import { sinPatternMap, sinPatterns } from '../data/sinPatterns'
import { localizePattern, T } from '../lib/localize'

function uid() {
  return `thought_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export default function ThoughtCaptiveFlow({ userId, onSave }) {
  const [form, setForm] = useState({ catchThought: '', namedSinPattern: 'self_centeredness', exposedLie: '', replacementTruth: '', obedienceAction: '' })
  const [saved, setSaved] = useState(false)
  const pattern = sinPatternMap[form.namedSinPattern]
  const displayPattern = localizePattern(pattern)
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
      <div className="sf-section-heading"><h2>{T('思想夺回流程', 'Thought Captive Flow')}</h2><p>{T('捕捉、命名、揭露、替换，并顺服。', 'Catch, name, expose, replace, and obey.')}</p></div>
      <div className="sf-step-list">
        <label><b>{T('1. 捕捉', '1. Catch')}</b><span>{T('此刻穿过你心里的思想、画面、欲望或控告是什么？', 'What thought, image, desire, or accusation is moving through your mind?')}</span><span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.catchThought} onChange={(e) => update('catchThought', e.target.value)} /><SuggestMenu accent="#8c8cff" options={displayPattern.commonSymptoms} value={form.catchThought} onChange={(v) => update('catchThought', v)} /></span></label>
        <label><b>{T('2. 命名', '2. Name')}</b><span>{T('给这个可能的罪性模式命名。', 'Name the possible sin pattern.')}</span><select value={form.namedSinPattern} onChange={(e) => update('namedSinPattern', e.target.value)}>{sinPatterns.map((p) => <option value={p.id} key={p.id}>{localizePattern(p).name}</option>)}</select></label>
        <label><b>{T('3. 揭露', '3. Expose')}</b><span>{T('这个思想正在要求你相信什么谎言？', 'What lie is this thought asking you to believe?')}</span><span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.exposedLie} placeholder={displayPattern.coreLie} onChange={(e) => update('exposedLie', e.target.value)} /><SuggestMenu accent="#8c8cff" options={[displayPattern.coreLie]} value={form.exposedLie} onChange={(v) => update('exposedLie', v)} /></span></label>
        <label><b>{T('4. 替换', '4. Replace')}</b><span>{T('神的真理怎样回应这个谎言？', 'What truth from God answers this lie?')}</span><span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.replacementTruth} placeholder={displayPattern.gospelTruth} onChange={(e) => update('replacementTruth', e.target.value)} /><SuggestMenu accent="#8c8cff" options={[displayPattern.gospelTruth]} value={form.replacementTruth} onChange={(v) => update('replacementTruth', v)} /></span></label>
        <label><b>{T('5. 顺服', '5. Obey')}</b><span>{T('现在可以采取的一个小顺服行动是什么？', 'What is one small act of obedience you can take now?')}</span><span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.obedienceAction} placeholder={displayPattern.putOnActions[0]} onChange={(e) => update('obedienceAction', e.target.value)} /><SuggestMenu accent="#8c8cff" options={displayPattern.putOnActions} value={form.obedienceAction} onChange={(v) => update('obedienceAction', v)} /></span></label>
      </div>
      <button className="sf-primary" type="button" onClick={save}>{T('保存思想夺回记录', 'Save Thought Captive Entry')}</button>
      {saved && <p className="sf-success">{T('主耶稣，求你夺回这个思想。让真理在谎言说话之处掌权，也赐我恩典走出下一步顺服。阿们。', 'Lord Jesus, take this thought captive. Let truth rule where lies were speaking. Give me grace to obey in this next step. Amen.')}</p>}
    </section>
  )
}
