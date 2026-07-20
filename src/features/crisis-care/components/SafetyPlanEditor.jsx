import { t as i18nT } from '../../../i18n/runtime'
import { useState } from 'react'
import { SuggestMenu } from '../../../components/SuggestField'
const SP_MSG_OPTS = ['我现在很不好，需要你陪我说说话。', '我正在经历危机，请尽快联系我。', '我需要帮助，请打电话给我。', '我现在不安全，请帮我联系专业支持。']
import { buildSafetyPlanTemplate, EMERGENCY_COPY_TEXT } from '../data/crisisContent'
import { getResources } from '../data/crisisResources'

/** Small inline list editor */
function ListEditor({ label, items, onChange, placeholder }) {
  const [draft, setDraft] = useState('')
  function add() {
    const v = draft.trim()
    if (!v) return
    onChange([...(items || []), v])
    setDraft('')
  }
  return (
    <div className="cc-field">
      <label>{label}</label>
      {(items || []).map((it, i) => (
        <div className="cc-list-item" key={`${it}-${i}`}>
          <input className="cc-input" value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" aria-label={i18nT('删除')} onClick={() => onChange(items.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <div className="cc-list-item">
        <input className="cc-input" value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()}  aria-label={placeholder}/>
        <button type="button" aria-label={i18nT('新增')} onClick={add} style={{ color: '#34c759' }}>＋</button>
      </div>
    </div>
  )
}

/**
 * SafetyPlanEditor — 个人安全计划（Stanley-Brown 结构 + 属灵锚点）。
 * 至少要有一个真人联系人。保存由父组件处理（本地优先 + 后端同步）。
 */
export default function SafetyPlanEditor({ plan, regionCode = 'TW', onSave, syncing }) {
  const [draft, setDraft] = useState(() => plan || buildSafetyPlanTemplate(regionCode))
  const [saved, setSaved] = useState(false)

  function patch(key, value) {
    setDraft((d) => ({ ...d, [key]: value }))
    setSaved(false)
  }

  function save() {
    if (!hasPerson) return
    const resources = getResources(draft.regionCode || regionCode).resources
    const finalPlan = {
      ...draft,
      professionalResources: resources,
      emergencyMessageTemplate: draft.emergencyMessageTemplate || EMERGENCY_COPY_TEXT,
      lastReviewedAt: new Date().toISOString(),
    }
    onSave && onSave(finalPlan)
    setSaved(true)
  }

  const hasPerson = (draft.safePeople || []).some((p) => p && p.trim())
  const readiness = [hasPerson, (draft.safePlaces || []).some(Boolean), (draft.meansRestrictionSteps || []).some(Boolean), Boolean(draft.emergencyMessageTemplate?.trim())].filter(Boolean).length

  return (
    <div className="cc-card">
      <h3>{i18nT('我的安全计划')}</h3>
      <p className="cc-muted">{i18nT('在平静的时候写好它，危机时它会替你记得该做什么。')}</p>

      <ListEditor label={i18nT('我的危机警讯（提前察觉）')} items={draft.warningSigns} onChange={(v) => patch('warningSigns', v)} placeholder={i18nT('例如：连续失眠 / 想消失')} />
      <ListEditor label={i18nT('我可以先做的 5 分钟动作')} items={draft.internalCopingStrategies} onChange={(v) => patch('internalCopingStrategies', v)} placeholder={i18nT('例如：打开灯、喝水')} />
      <ListEditor label={i18nT('我的安全联系人（至少一位真人）')} items={draft.safePeople} onChange={(v) => patch('safePeople', v)} placeholder={i18nT('姓名 + 联系方式')} />
      <ListEditor label={i18nT('我可以去的安全地点')} items={draft.safePlaces} onChange={(v) => patch('safePlaces', v)} placeholder={i18nT('例如：客厅 / 楼下便利店')} />
      <ListEditor label={i18nT('减少危险物品接触')} items={draft.meansRestrictionSteps} onChange={(v) => patch('meansRestrictionSteps', v)} placeholder={i18nT('例如：把药交给家人保管')} />

      <div className="cc-field">
        <label>{i18nT('计划就绪度')}：{readiness}/4</label>
        <p className="cc-muted">{i18nT('联系人、安全地点、限制危险物品、求助文本均准备好后才算就绪。')}</p>
        <label><input type="checkbox" checked={Boolean(draft.rehearsedAt)} onChange={(event) => patch('rehearsedAt', event.target.checked ? new Date().toISOString() : '')} /> {i18nT('我已在平静时演练过：联系真人、前往安全地点、复制求助文本')}</label>
        {draft.lastReviewedAt ? <p className="cc-muted">{i18nT('上次复核：')}{new Date(draft.lastReviewedAt).toLocaleString()}</p> : null}
      </div>

      <div className="cc-field">
        <label>{i18nT('我的紧急求助文本（可一键复制给真人）')}</label>
        <span style={{ position: 'relative', display: 'block' }}><textarea className="cc-input" style={{ paddingRight: 92 }} rows={3} value={draft.emergencyMessageTemplate || ''} onChange={(e) => patch('emergencyMessageTemplate', e.target.value)} /><SuggestMenu accent="#7dd3fc" top={8} right={8} options={SP_MSG_OPTS} value={draft.emergencyMessageTemplate || ''} onChange={(v) => patch('emergencyMessageTemplate', v)} /></span>
      </div>

      {!hasPerson && <p className="cc-muted" style={{ color: '#ff9f8a' }}>{i18nT('建议至少填一位可以联系的真人 —— 危机中，被真实的人接住很重要。')}</p>}

      <button className="cc-btn full" type="button" onClick={save} disabled={syncing || !hasPerson}>{syncing ? '保存中…' : '保存安全计划'}</button>
      <div className="cc-toast">{saved ? '已保存。' : ''}</div>
    </div>
  )
}
