import { useMemo, useState } from 'react'
import { sinPatternMap, sinPatterns } from '../data/sinPatterns'
import { recommendSpiritualResponse } from '../lib/recommendationEngine'
import { HOLY_SPIRIT_FRUITS } from '../types/spiritualFormation'
import { SuggestMenu } from '../../../components/SuggestField'
import {
  T, emotionName, fruitName, localizePattern, localizePhrase, patternNameById, triggerName,
} from '../lib/localize'

const EMOTIONS = ['anxiety', 'anger', 'envy', 'lust', 'emptiness', 'shame', 'prideful_confidence', 'fear', 'numbness', 'bitterness', 'restlessness', 'gratitude', 'peace', 'joy', 'sadness', 'loneliness']
const CONFESSION_OPTS = [
  ['主啊，我诚实地把这件事带到你的光中。', 'Lord, I bring this honestly into Your light.'],
  ['父啊，我承认自己信靠了 ___，而不是你。', 'Father, I confess I trusted ___ instead of You.'],
  ['我追求掌控、认可或舒适，胜过追求你。', 'I sought control, approval, or comfort more than You.'],
  ['主啊，我在思想和行为上得罪了你，求你洁净我。', 'Lord, I have sinned in thought and deed; cleanse me.'],
  ['我承认自己的恐惧和不信，求你帮助我信靠你。', 'I confess my fear and unbelief; help me trust You.'],
]
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
  const displayPattern = localizePattern(pd)
  const displayLies = recommendation.possibleCoreLies.map(localizePhrase)
  const displayTruths = recommendation.suggestedGospelTruths.map(localizePhrase)
  const confessionOptions = CONFESSION_OPTS.map(([zh, en]) => T(zh, en))

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
        <h2>{T('每日灵命扫描', 'Daily Spiritual Scan')}</h2>
        <p>{T('把今天带到光中。目标不是完美，而是诚实地归回基督。', 'Bring the day into the light. The goal is not perfection, but honest return to Christ.')}</p>
      </div>
      <div className="sf-form-grid">
        <label>{T('最强烈的情绪', 'Strongest emotion')}<select value={form.strongestEmotion} onChange={(e) => update('strongestEmotion', e.target.value)}>{EMOTIONS.map((item) => <option key={item} value={item}>{emotionName(item)}</option>)}</select></label>
        <label>{T('随后发生的行为', 'Behavior that followed')}<span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.behaviorDescription} onChange={(e) => update('behaviorDescription', e.target.value)} placeholder={T('你做了、逃避了、说了、点击了、隐藏了或追求了什么？', 'What did you do, avoid, say, click, hide, or pursue?')}  aria-label={T('你做了、逃避了、说了、点击了、隐藏了或追求了什么？', 'What did you do, avoid, say, click, hide, or pursue?')}/><SuggestMenu accent="#8c8cff" options={displayPattern.commonSymptoms} value={form.behaviorDescription} onChange={(v) => update('behaviorDescription', v)} /></span></label>
      </div>
      <div className="sf-choice-block">
        <span>{T('触发场景', 'Triggers')}</span>
        <div className="sf-chip-row">{TRIGGERS.map((trigger) => <button className={`sf-chip-btn ${form.triggers.includes(trigger) ? 'active' : ''}`} key={trigger} type="button" onClick={() => toggleList('triggers', trigger)}>{triggerName(trigger)}</button>)}</div>
      </div>
      <div className="sf-recommendation">
        <h3>{T('可以在神面前省察的模式', 'Possible patterns to examine before God')}</h3>
        <p>{localizePhrase(recommendation.pastoralNote)}</p>
        <div className="sf-chip-row">{recommendation.likelySinPatterns.map((id) => <button className={`sf-chip-btn ${primary === id ? 'active' : ''}`} key={id} type="button" onClick={() => update('selectedPrimarySinPattern', id)}>{patternNameById(id)}</button>)}</div>
      </div>
      <div className="sf-form-grid">
        <label>{T('核心谎言', 'Core lie')}<span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.coreLie} onChange={(e) => update('coreLie', e.target.value)} placeholder={displayLies[0]}  aria-label={displayLies[0]}/><SuggestMenu accent="#8c8cff" options={displayLies} value={form.coreLie} onChange={(v) => update('coreLie', v)} /></span></label>
        <label>{T('福音真理', 'Gospel truth')}<span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.gospelTruth} onChange={(e) => update('gospelTruth', e.target.value)} placeholder={displayTruths[0]}  aria-label={displayTruths[0]}/><SuggestMenu accent="#8c8cff" options={displayTruths} value={form.gospelTruth} onChange={(v) => update('gospelTruth', v)} /></span></label>
        <label>{T('认罪', 'Confession')}<span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.confession} onChange={(e) => update('confession', e.target.value)} /><SuggestMenu accent="#8c8cff" options={confessionOptions} value={form.confession} onChange={(v) => update('confession', v)} /></span></label>
        <label>{T('悔改行动', 'Repentance action')}<span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.repentanceAction} onChange={(e) => update('repentanceAction', e.target.value)} /><SuggestMenu accent="#8c8cff" options={displayPattern.putOffActions} value={form.repentanceAction} onChange={(v) => update('repentanceAction', v)} /></span></label>
        <label>{T('具体顺服行动', 'Concrete obedience action')}<span style={{ position: 'relative', display: 'block' }}><textarea style={{ paddingRight: 96 }} value={form.obedienceAction} onChange={(e) => update('obedienceAction', e.target.value)} /><SuggestMenu accent="#8c8cff" options={displayPattern.putOnActions} value={form.obedienceAction} onChange={(v) => update('obedienceAction', v)} /></span></label>
        <label>{T('要操练的圣灵果子', 'Fruit to practice')}<select value={form.fruitPracticed[0]} onChange={(e) => update('fruitPracticed', [e.target.value])}>{HOLY_SPIRIT_FRUITS.map((fruit) => <option key={fruit} value={fruit}>{fruitName(fruit)}</option>)}</select></label>
      </div>
      <label className="sf-check"><input type="checkbox" checked={form.graceRecoveryNeeded} onChange={(e) => update('graceRecoveryNeeded', e.target.checked)} /> {T('我需要在这个模式中重新领受恩典。', 'I need grace recovery for this pattern.')}</label>
      <button className="sf-primary" type="button" onClick={save}>{T('保存每日扫描', 'Save Daily Scan')}</button>
      {saved && <p className="sf-success">{T('你已经把这件事带到光中。今天信靠基督的恩典，走出一个具体的顺服行动。', 'You have brought this into the light. Walk today in one concrete act of obedience, trusting the grace of Christ.')}</p>}
    </section>
  )
}
