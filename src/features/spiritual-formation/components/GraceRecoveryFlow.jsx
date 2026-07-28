import { useEffect, useState } from 'react'
import { sinPatternMap, sinPatterns } from '../data/sinPatterns'
import SuggestField, { SuggestMenu } from '../../../components/SuggestField'
import { getPastoralSafetyMessage, GRACE_RECOVERY_STATEMENT } from '../lib/pastoralSafety'
import GraceIdentityCard from './grace-identity/GraceIdentityCard'
import { MilestoneTrack } from '../../../components/charts'
import { T } from '../lib/localize'
import { speakOnce, stopAllAudio } from '../../../useGlobalAudio'
import { getMediaPref } from '../../../lib/media/mediaPrefs'

function uid() {
  return `recovery_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export default function GraceRecoveryFlow({ userId, onSave, token }) {
  const [form, setForm] = useState({ whatHappened: '', sinPattern: '', confession: '', repairAction: '', boundaryAction: '', accountabilityAction: '', nextObedienceStep: '', recurringBondage: false, mentionsSevereDistress: false })
  const [saved, setSaved] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  // 卸载时收掉声音；空依赖 = 只在卸载时跑一次，不会被每次 re-render 打断播放。
  useEffect(() => () => stopAllAudio(), [])
  const gp = form.sinPattern ? sinPatternMap[form.sinPattern] : null
  const WHAT_OPTS = ['I gave in to a temptation I meant to resist.', 'I reacted in anger / harsh words.', 'I escaped into something to numb myself.', 'I was dishonest or hid something.', 'I neglected what God called me to do.']
  const CONFESSION_OPTS = ['Father, I confess my sin before You; I do not hide or excuse it.', 'Lord, I have no excuse; I need Your mercy.', 'I trusted myself / an idol instead of You.', 'Forgive me, cleanse me, restore me in Christ.']
  const REPAIR_OPTS = ['Apologize to the person I hurt.', 'Make restitution where I can.', 'Confess to a trusted brother / sister.', 'No repair needed — receive grace and move on.']
  const BOUNDARY_OPTS = ['Remove the access / trigger that led here.', 'Add accountability with someone I trust.', 'Set a time / place limit to avoid the pattern.', 'Replace the habit with a healthy alternative.']
  const OBEY_OPTS = ['Return to one concrete act of obedience today.', 'Resume daily prayer / Scripture.', 'Serve someone instead of self-focus.', 'Take the next small faithful step.']
  const safety = getPastoralSafetyMessage({ recurringBondage: form.recurringBondage, mentionsSevereDistress: form.mentionsSevereDistress })

  // 恢复之路是有次序的：先说出来，才命名；先认罪，才领受赦免；先被赦免，才谈修复与界限。
  // 每一站的「到了没有」只看这张表单里真实填过的字段，不做任何推测。
  // 「领受赦免」这一站没有输入框——它不是你要完成的一项任务，而是认罪之后神那边已经成立的事，
  // 所以它以 confession 是否写下为准。
  const STEPS = [
    { key: 'whatHappened', label: T('说出发生了什么', 'Say what happened'), value: form.whatHappened, hint: T('不隐藏、不美化，只是说出来。', 'No hiding, no polishing — just say it.') },
    { key: 'sinPattern', label: T('命名模式', 'Name the pattern'), value: form.sinPattern ? (gp?.name || form.sinPattern) : '', hint: T('说不出名字也没关系，这一站可以空着。', 'It is fine to leave this one empty if no name fits yet.') },
    { key: 'confession', label: T('诚实认罪', 'Confess honestly'), value: form.confession, hint: T('认罪不是自我惩罚，是把事情带到光中。', 'Confession is not self-punishment; it is bringing the thing into the light.') },
    { key: '__grace', label: T('领受赦免', 'Receive the absolution'), value: form.confession.trim() ? GRACE_RECOVERY_STATEMENT : '', hint: GRACE_RECOVERY_STATEMENT },
    { key: 'repairAction', label: T('去修复', 'Repair what can be repaired'), value: form.repairAction, hint: T('有些事需要道歉或赔偿，有些不需要。', 'Some things call for an apology or restitution; some do not.') },
    { key: 'boundaryAction', label: T('加固界限', 'Strengthen the boundary'), value: form.boundaryAction, hint: T('拿掉入口，比咬牙硬撑有用。', 'Removing the access works better than gritting your teeth.') },
    { key: 'nextObedienceStep', label: T('重新进入顺服', 'Re-enter obedience'), value: form.nextObedienceStep, hint: T('一件小事就够了，今天就能做的那种。', 'One small thing is enough — the kind you can do today.') },
  ]
  const firstEmpty = STEPS.findIndex((step) => !String(step.value || '').trim())
  const currentStep = firstEmpty === -1 ? STEPS.length - 1 : firstEmpty

  const soundOn = getMediaPref('sound')

  // 「你被赦免了」听见和读到不是一回事。所以这里朗读的就是 GRACE_RECOVERY_STATEMENT 本身，
  // 一字不改，也不额外生成任何「神对你说」的话。必须由用户按下按钮，且声音开关是开的。
  async function speakAbsolution() {
    if (speaking) {
      stopAllAudio()
      setSpeaking(false)
      return
    }
    setSpeaking(true)
    await speakOnce(GRACE_RECOVERY_STATEMENT, { rate: 0.82 })
    setSpeaking(false)
  }

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
      <GraceIdentityCard compact inputText={form.whatHappened || '我又失败了，所以我想躲起来'} token={token} />

      <MilestoneTrack
        title={T('回来的这条路', 'The road back')}
        subtitle={T(
          `一共七站，现在停在第 ${currentStep + 1} 站「${STEPS[currentStep].label}」。站与站的先后是有理由的：先被赦免，才谈修复；顺序反过来，修复就变成了赎罪。`,
          `Seven stops; you are at stop ${currentStep + 1}, "${STEPS[currentStep].label}". The order matters: absolution comes before repair. Reversed, repair turns into self-atonement.`,
        )}
        stops={STEPS.map((step) => ({
          key: step.key,
          label: step.label,
          note: String(step.value || '').trim() || step.hint,
        }))}
        currentIndex={currentStep}
      />

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

      <div className="sf-card sf-absolution">
        <h3>{T('领受赦免', 'Receive the absolution')}</h3>
        <p>{GRACE_RECOVERY_STATEMENT}</p>
        {soundOn ? (
          <button className="sf-primary" type="button" onClick={speakAbsolution}>
            {speaking ? `⏹ ${T('停止', 'Stop')}` : `🔊 ${T('念给我听', 'Say it to me')}`}
          </button>
        ) : (
          <p className="sf-empty">
            {T('声音是关着的。想听见这句话，请在设置里打开「声音」。', 'Sound is off. To hear this sentence, turn on “Sound” in settings.')}
          </p>
        )}
        <p style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: '8px 0 0' }}>
          {T('自己读一遍，和听见有人对你说，不是同一件事。这句话不会自己响起，只有你按下才会。',
             'Reading it yourself and hearing it said to you are not the same thing. Nothing plays on its own — only when you press.')}
        </p>
      </div>

      <button className="sf-primary" type="button" onClick={save}>Save Recovery Entry</button>
      {saved && <p className="sf-success">{GRACE_RECOVERY_STATEMENT}</p>}
    </section>
  )
}
