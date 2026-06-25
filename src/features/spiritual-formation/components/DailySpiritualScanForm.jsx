import { useMemo, useState } from 'react'
import { sinPatternMap, sinPatterns } from '../data/sinPatterns'
import { recommendSpiritualResponse } from '../lib/recommendationEngine'
import { HOLY_SPIRIT_FRUITS } from '../types/spiritualFormation'
import SuggestField, { SuggestMenu } from '../../../components/SuggestField'

const EMOTIONS = ['anxiety', 'anger', 'envy', 'lust', 'emptiness', 'shame', 'prideful_confidence', 'fear', 'numbness', 'bitterness', 'restlessness', 'gratitude', 'peace', 'joy', 'sadness', 'loneliness']
const CONFESSION_OPTS = ['Lord, I bring this honestly into Your light.', 'Father, I confess I trusted ___ instead of You.', 'I sought control / approval / comfort more than You.', 'Lord, I have sinned in thought and deed; cleanse me.', 'I confess my fear and unbelief; help me trust You.']
const TRIGGERS = ['pressure', 'loneliness', 'comparison', 'success', 'failure', 'rejection', 'offense', 'financial_insecurity', 'sexual_temptation', 'boredom', 'fatigue', 'conflict', 'social_media', 'power_opportunity', 'religious_performance']

function uid() {
  return `daily_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export default function DailySpiritualScanForm({ userId, onSave }) {
  const [form, setForm] = useState({
    strongestEmotion: 'anxiety',
    triggers: [],
    behaviorDescription: '',
    selectedPrimarySinPattern: '',
    coreLie: '',
    gospelTruth: '',
    confession: '',
    repentanceAction: '',
    fruitPracticed: ['peace'],
    obedienceAction: '',
    graceRecoveryNeeded: false,
  })
  const [saved, setSaved] = useState(false)
  const recommendation = useMemo(() => recommendSpiritualResponse({
    emotion: form.strongestEmotion,
    triggers: form.triggers,
    behaviorText: form.behaviorDescription,
    selectedSinPattern: form.selectedPrimarySinPattern || undefined,
  }), [form])
  const primary = form.selectedPrimarySinPattern || recommendation.likelySinPatterns[0] || 'self_centeredness'
  const pd = sinPatternMap[primary] || sinPatterns[0]

  function update(field, value) {
    setSaved(false)
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleList(field, value) {
    setForm((prev) => {
      const current = prev[field]
      return { ...prev, [field]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value] }
    })
  }

  function save() {
    const now = new Date().toISOString()
    const pattern = sinPatternMap[primary] || sinPatterns[0]
    const entry = {
      id: uid(),
      userId,
      date: now,
      strongestEmotion: form.strongestEmotion,
      triggers: form.triggers,
      behaviorDescription: form.behaviorDescription || 'No behavior description recorded.',
      detectedSinPatterns: recommendation.likelySinPatterns,
      selectedPrimarySinPattern: primary,
      coreLie: form.coreLie || recommendation.possibleCoreLies[0] || pattern.coreLie,
      gospelTruth: form.gospelTruth || recommendation.suggestedGospelTruths[0] || pattern.gospelTruth,
      confession: form.confession || 'Lord, I bring this honestly into Your light.',
      repentanceAction: form.repentanceAction || (pattern.putOffActions?.[0] ?? ''),
      obedienceAction: form.obedienceAction || (pattern.putOnActions?.[0] ?? ''),
      fruitPracticed: form.fruitPracticed,
      virtuesPracticed: pattern.oppositeVirtues?.slice(0, 3) ?? [],
      prayer: pattern.repentancePrayer ?? '',
      graceRecoveryNeeded: form.graceRecoveryNeeded,
      createdAt: now,
      updatedAt: now,
    }
    onSave(entry)
    setSaved(true)
  }

  return (
    <section className="sf-section">
      <div className="sf-section-heading">
        <h2>Daily Spiritual Scan</h2>
        <p>Bring the day into the light. The goal is not perfection, but honest return to Christ.</p>
      </div>
      <div className="sf-form-grid">
        <label>Strongest emotion<select value={form.strongestEmotion} onChange={(e) => update('strongestEmotion', e.target.value)}>{EMOTIONS.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Behavior that followed<span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.behaviorDescription} onChange={(e) => update('behaviorDescription', e.target.value)} placeholder="What did you do, avoid, say, click, hide, or pursue?" /><SuggestMenu accent="#8c8cff" options={pd.commonSymptoms} value={form.behaviorDescription} onChange={(v) => update('behaviorDescription', v)} /></span></label>
      </div>
      <div className="sf-choice-block">
        <span>Triggers</span>
        <div className="sf-chip-row">{TRIGGERS.map((trigger) => <button className={`sf-chip-btn ${form.triggers.includes(trigger) ? 'active' : ''}`} key={trigger} type="button" onClick={() => toggleList('triggers', trigger)}>{trigger.replaceAll('_', ' ')}</button>)}</div>
      </div>
      <div className="sf-recommendation">
        <h3>Possible patterns to examine before God</h3>
        <p>{recommendation.pastoralNote}</p>
        <div className="sf-chip-row">{recommendation.likelySinPatterns.map((id) => <button className={`sf-chip-btn ${primary === id ? 'active' : ''}`} key={id} type="button" onClick={() => update('selectedPrimarySinPattern', id)}>{sinPatternMap[id].name}</button>)}</div>
      </div>
      <div className="sf-form-grid">
        <label>Core lie<span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.coreLie} onChange={(e) => update('coreLie', e.target.value)} placeholder={recommendation.possibleCoreLies[0]} /><SuggestMenu accent="#8c8cff" options={recommendation.possibleCoreLies} value={form.coreLie} onChange={(v) => update('coreLie', v)} /></span></label>
        <label>Gospel truth<span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.gospelTruth} onChange={(e) => update('gospelTruth', e.target.value)} placeholder={recommendation.suggestedGospelTruths[0]} /><SuggestMenu accent="#8c8cff" options={recommendation.suggestedGospelTruths} value={form.gospelTruth} onChange={(v) => update('gospelTruth', v)} /></span></label>
        <label>Confession<span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.confession} onChange={(e) => update('confession', e.target.value)} /><SuggestMenu accent="#8c8cff" options={CONFESSION_OPTS} value={form.confession} onChange={(v) => update('confession', v)} /></span></label>
        <label>Repentance action<span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.repentanceAction} onChange={(e) => update('repentanceAction', e.target.value)} /><SuggestMenu accent="#8c8cff" options={pd.putOffActions} value={form.repentanceAction} onChange={(v) => update('repentanceAction', v)} /></span></label>
        <label>Concrete obedience action<span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.obedienceAction} onChange={(e) => update('obedienceAction', e.target.value)} /><SuggestMenu accent="#8c8cff" options={pd.putOnActions} value={form.obedienceAction} onChange={(v) => update('obedienceAction', v)} /></span></label>
        <label>Fruit to practice<select value={form.fruitPracticed[0]} onChange={(e) => update('fruitPracticed', [e.target.value])}>{HOLY_SPIRIT_FRUITS.map((fruit) => <option key={fruit}>{fruit}</option>)}</select></label>
      </div>
      <label className="sf-check"><input type="checkbox" checked={form.graceRecoveryNeeded} onChange={(e) => update('graceRecoveryNeeded', e.target.checked)} /> I need grace recovery for this pattern.</label>
      <button className="sf-primary" type="button" onClick={save}>Save Daily Scan</button>
      {saved && <p className="sf-success">You have brought this into the light. Walk today in one concrete act of obedience, trusting the grace of Christ.</p>}
    </section>
  )
}
