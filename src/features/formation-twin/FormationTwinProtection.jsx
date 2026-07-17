import { useCallback, useEffect, useMemo, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import {
  acceptProtectionAction,
  acknowledgeProtectionWarning,
  chooseRecoveryAction,
  createProtectionContact,
  createProtectionPlan,
  createTemptationCycle,
  deferRecoveryReview,
  deleteTemptationCycle,
  draftProtectionMessage,
  eraseProtectionData,
  getCurrentProtection,
  getCurrentProtectionRecovery,
  getProtectionSettings,
  listProtectionContacts,
  listProtectionPlans,
  listProtectionWarnings,
  listTemptationCycles,
  markProtectionWarning,
  recalculateProtection,
  requestAlternativeProtectionAction,
  requestSmallerProtectionAction,
  resetProtectionLearning,
  setAllProtectionWarningsPaused,
  stabilizeRecovery,
  startProtectionRecovery,
  updateProtectionAction,
  updateProtectionPlanStatus,
  updateProtectionSettings,
  updateRecoveryBehaviorStopped,
  updateRecoverySafety,
  updateTemptationCycleStatus,
} from './formationTwinApi'
import { PROTECTION_ROUTES } from './temptationRiskContract'

const TABS = [
  ['current', '当前保护', '/formation-twin/protection/current'],
  ['cycles', '我的循环', '/formation-twin/protection/cycles'],
  ['plans', '保护计划', '/formation-twin/protection/plans'],
  ['warnings', '提醒历史', '/formation-twin/protection/warnings'],
  ['recovery', '恢复支持', '/formation-twin/protection/recovery'],
  ['support', '支持联系人', '/formation-twin/protection/support-people'],
  ['settings', '隐私与设置', '/formation-twin/protection/settings'],
]

const DEFAULT_SETTINGS = {
  warnings_enabled: false,
  delivery_channel: 'IN_APP_ONLY',
  quiet_hours_json: { start: '22:00', end: '07:00', timezone: 'Asia/Shanghai' },
  cooldown_settings_json: { AWARENESS: 12, PROTECTION_SUGGESTED: 4 },
  model_assistance_enabled: false,
  passive_metadata_enabled: false,
  passive_metadata_consent: false,
  effect_learning_enabled: true,
  accountability_drafts_enabled: false,
  all_warnings_paused: false,
}

function Empty({ title, children }) {
  return <div className="ft-protection-empty"><strong>{i18nT(title)}</strong><div>{children}</div></div>
}

function Conditions({ snapshot }) {
  const active = snapshot?.active_conditions_json || snapshot?.active_conditions || []
  const protections = snapshot?.active_protective_factors_json || snapshot?.active_protective_factors || []
  const unknown = snapshot?.unknown_conditions_json || snapshot?.unknown_conditions || []
  const counter = snapshot?.counterevidence_json || snapshot?.counterevidence || []
  return (
    <div className="ft-protection-evidence">
      <article>
        <h5>{i18nT('当前出现的条件')}</h5>
        {active.length ? <ul>{active.map((item) => <li key={item.condition_code || item}>{i18nT(item.user_visible_description || item)}</li>)}</ul> : <p>{i18nT('目前没有足够且经过确认的条件。')}</p>}
      </article>
      <article>
        <h5>{i18nT('当前已有保护')}</h5>
        {[...protections, ...counter].length ? <ul>{[...protections, ...counter].map((item, index) => <li key={`${item.protection_type || item}-${index}`}>{i18nT(item.description || item)}</li>)}</ul> : <p>{i18nT('还没有记录当前保护因素。')}</p>}
      </article>
      <article>
        <h5>{i18nT('仍然未知')}</h5>
        {unknown.length ? <ul>{unknown.map((item) => <li key={item}>{item}</li>)}</ul> : <p>{i18nT('没有需要系统自动补全的未知条件。')}</p>}
      </article>
    </div>
  )
}

export default function FormationTwinProtection({ user, onSafety }) {
  const [tab, setTab] = useState('current')
  const [current, setCurrent] = useState(null)
  const [cycles, setCycles] = useState([])
  const [plans, setPlans] = useState([])
  const [warnings, setWarnings] = useState([])
  const [recovery, setRecovery] = useState(null)
  const [contacts, setContacts] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [cycleDraft, setCycleDraft] = useState({ title: '', cycle_type: 'USER_DEFINED', conditions: 'SLEEP_DEPRIVATION,ALONE_AT_NIGHT', user_confirmed: false })
  const [planTitle, setPlanTitle] = useState('')
  const [contactDraft, setContactDraft] = useState({ display_alias: '', support_role: 'FRIEND' })
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!user) return
    const results = await Promise.allSettled([
      getCurrentProtection(), listTemptationCycles(), listProtectionPlans(), listProtectionWarnings(),
      getCurrentProtectionRecovery(), listProtectionContacts(), getProtectionSettings(),
    ])
    if (results[0].status === 'fulfilled') setCurrent(results[0].value)
    if (results[1].status === 'fulfilled') setCycles(results[1].value?.cycles || [])
    if (results[2].status === 'fulfilled') setPlans(results[2].value?.plans || [])
    if (results[3].status === 'fulfilled') setWarnings(results[3].value?.warnings || [])
    if (results[4].status === 'fulfilled') setRecovery(results[4].value?.recovery || null)
    if (results[5].status === 'fulfilled') setContacts(results[5].value?.contacts || [])
    if (results[6].status === 'fulfilled') setSettings({ ...DEFAULT_SETTINGS, ...(results[6].value?.settings || {}) })
    if (results.every((item) => item.status === 'rejected')) setError(i18nT('暂时无法读取保护中心，请稍后再试。'))
  }, [user])

  useEffect(() => { load() }, [load])

  const run = async (key, operation, success) => {
    setBusy(key); setError(''); setNotice('')
    try {
      const result = await operation()
      if (result?.crisis_first) onSafety?.()
      setNotice(i18nT(success))
      await load()
      return result
    } catch (err) {
      setError(err?.message || i18nT('操作未完成，请稍后重试。'))
      return null
    } finally {
      setBusy('')
    }
  }

  const warning = current?.warning || null
  const action = current?.action || null
  const warningPrivate = warning?.sharing_status !== 'USER_INITIATED'
  const activePlan = useMemo(() => plans.find((item) => item.active) || null, [plans])

  const createCycle = () => {
    const required = cycleDraft.conditions.split(',').map((item) => item.trim()).filter(Boolean)
    return run('cycle', () => createTemptationCycle({
      title: cycleDraft.title,
      cycle_type: cycleDraft.cycle_type,
      required_conditions: required,
      trigger_conditions: required.slice(0, 1),
      vulnerability_conditions: required.slice(1),
      protective_factors: ['USER_DEFINED_PROTECTION'],
      interruption_points: ['EARLIEST_USER_DEFINED_POINT'],
      recovery_paths: ['RECONNECT_WITH_SUPPORT'],
      nodes: [],
      source_kind: 'USER_BUILT',
      user_confirmed: cycleDraft.user_confirmed,
    }), '循环已保存；只有你确认后才会用于提醒。')
  }

  const saveSettings = () => run('settings', () => updateProtectionSettings({
    warnings_enabled: settings.warnings_enabled,
    delivery_channel: settings.delivery_channel,
    quiet_hours: settings.quiet_hours_json,
    cooldown_settings: settings.cooldown_settings_json,
    model_assistance_enabled: settings.model_assistance_enabled,
    passive_metadata_enabled: settings.passive_metadata_enabled,
    passive_metadata_consent: settings.passive_metadata_consent,
    effect_learning_enabled: settings.effect_learning_enabled,
    accountability_drafts_enabled: settings.accountability_drafts_enabled,
  }), '保护设置已保存。')

  return (
    <section className="ft-protection" aria-label={i18nT('风险与保护中心')}>
      <header className="ft-protection-head">
        <div>
          <span>PROTECTION · USER CONTROLLED</span>
          <h3>{i18nT('看见条件，提前增加保护')}</h3>
          <p>{i18nT('试探不等于行为，风险也不等于命运。这里只使用你主动报告、授权并确认的有限信息。')}</p>
        </div>
        <div className="ft-protection-state">
          <strong>{settings.warnings_enabled ? i18nT('提醒已开启') : i18nT('提醒默认关闭')}</strong>
          <small>{settings.all_warnings_paused ? i18nT('当前已暂停') : i18nT('默认仅应用内显示')}</small>
        </div>
      </header>

      <p className="ft-protection-boundary">{i18nT('不会显示复发概率或属灵风险分；不会读取浏览正文、消息、键盘、摄像头、持续麦克风或精确位置；不会自动联系任何第三方。')}</p>

      <nav className="ft-protection-tabs" role="tablist" aria-label={i18nT('保护中心页面')}>
        {TABS.map(([key, label, route]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} data-route={route} onClick={() => setTab(key)}>{i18nT(label)}</button>
        ))}
      </nav>
      <div className="ft-protection-routes" aria-hidden="true">
        {PROTECTION_ROUTES.map((route) => <span key={route} data-protection-route={route} />)}
      </div>

      {error ? <div className="ft-protection-error" role="alert">{error}</div> : null}
      {notice ? <div className="ft-protection-notice" role="status">{notice}</div> : null}

      {tab === 'current' ? (
        <div className="ft-protection-view" role="tabpanel">
          <div className="ft-protection-section-head">
            <div><h4>{i18nT('当前保护状态')}</h4><p>{i18nT('条件、保护因素和未知项会同时显示。')}</p></div>
            <button type="button" disabled={!!busy} onClick={() => run('recalculate', () => recalculateProtection({}), '当前状态已重新核对。')}>{i18nT('重新核对')}</button>
          </div>
          <Conditions snapshot={current?.snapshot} />
          {warning ? (
            <article className={`ft-warning-card level-${String(warning.warning_level).toLowerCase()}`}>
              <span>{warning.warning_level}</span>
              <h4>{i18nT(warning.title)}</h4>
              <p>{i18nT(warning.message)}</p>
              <details><summary>{i18nT('为什么出现，以及仍然不确定什么')}</summary><ul>{(warning.uncertainty_notes_json || []).map((item) => <li key={item}>{i18nT(item)}</li>)}</ul></details>
              <small>{warningPrivate ? i18nT('仅你可见；未向第三方分享。') : i18nT('只共享了你这次明确授权的字段。')}</small>
              <footer>
                <button type="button" onClick={() => run('ack', () => acknowledgeProtectionWarning(warning.id), '提醒已确认。')}>{i18nT('我看到了')}</button>
                <button type="button" onClick={() => run('inaccurate', () => markProtectionWarning(warning.id, 'inaccurate'), '已标记为不准确，并降低后续打扰。')}>{i18nT('不准确')}</button>
                <button type="button" onClick={() => run('pause', () => setAllProtectionWarningsPaused(true), '全部提醒已暂停。')}>{i18nT('暂停提醒')}</button>
              </footer>
            </article>
          ) : <Empty title="当前没有保护提醒">{i18nT('这不代表系统对你作出了安全保证，只表示目前没有符合条件且经过授权的提醒。')}</Empty>}
          {action ? (
            <article className="ft-protection-action">
              <span>{i18nT('一个可选行动')}</span><h4>{i18nT(action.title)}</h4><p>{i18nT(action.description)}</p>
              <small>{i18nT('执行前需要你确认；高影响边界不会自动升级。')}</small>
              <footer>
                <button type="button" className="primary" onClick={() => run('accept', () => acceptProtectionAction(action.id, { user_confirmed: true, execution_mode: 'REMINDER_ONLY' }), '保护行动已记录并路由。')}>{i18nT('选择这个行动')}</button>
                <button type="button" onClick={() => run('smaller', () => requestSmallerProtectionAction(action.id), '已经换成更小一步。')}>{i18nT('再小一点')}</button>
                <button type="button" onClick={() => run('alternative', () => requestAlternativeProtectionAction(action.id), '已经换一个选择。')}>{i18nT('换一个')}</button>
                <button type="button" onClick={() => run('skip', () => updateProtectionAction(action.id, 'skip'), '今天不增加行动。')}>{i18nT('现在不行动')}</button>
              </footer>
            </article>
          ) : null}
        </div>
      ) : null}

      {tab === 'cycles' ? (
        <div className="ft-protection-view" role="tabpanel">
          <div className="ft-cycle-builder">
            <h4>{i18nT('共同建立一个有限循环')}</h4>
            <label>{i18nT('由你命名')}<input value={cycleDraft.title} onChange={(event) => setCycleDraft((value) => ({ ...value, title: event.target.value }))} /></label>
            <label>{i18nT('类型')}<select value={cycleDraft.cycle_type} onChange={(event) => setCycleDraft((value) => ({ ...value, cycle_type: event.target.value }))}><option value="USER_DEFINED">USER_DEFINED</option><option value="DIGITAL_ESCAPE">DIGITAL_ESCAPE</option><option value="ANGER_ESCALATION">ANGER_ESCALATION</option><option value="OVERWORK">OVERWORK</option><option value="PORNOGRAPHY_SELF_REPORTED">PORNOGRAPHY_SELF_REPORTED</option></select></label>
            <label>{i18nT('由你确认的条件代码，用逗号分隔')}<input value={cycleDraft.conditions} onChange={(event) => setCycleDraft((value) => ({ ...value, conditions: event.target.value }))} /></label>
            <label className="check"><input type="checkbox" checked={cycleDraft.user_confirmed} onChange={(event) => setCycleDraft((value) => ({ ...value, user_confirmed: event.target.checked }))} />{i18nT('我确认这个循环只描述有限情境；试探不等于行为。')}</label>
            <button type="button" disabled={!cycleDraft.title || !!busy} onClick={createCycle}>{i18nT('保存循环')}</button>
          </div>
          <div className="ft-cycle-list">
            {cycles.length ? cycles.map((item) => (
              <article key={item.id}>
                <span>{item.lifecycle_status} · v{item.version}</span><h4>{item.title}</h4>
                <p>{i18nT('触发与脆弱条件')}：{[...(item.trigger_conditions_json || []), ...(item.vulnerability_conditions_json || [])].join(' · ') || i18nT('尚未补充')}</p>
                <p>{i18nT('保护与中断点')}：{[...(item.protective_factors_json || []), ...(item.interruption_points_json || [])].join(' · ') || i18nT('尚未补充')}</p>
                <footer>
                  {!item.user_confirmed ? <button type="button" onClick={() => run('confirm-cycle', () => updateTemptationCycleStatus(item.id, 'confirm'), '循环已由你确认。')}>{i18nT('确认启用')}</button> : null}
                  <button type="button" onClick={() => run('pause-cycle', () => updateTemptationCycleStatus(item.id, item.lifecycle_status === 'PAUSED' ? 'resume' : 'pause'), '循环状态已更新。')}>{item.lifecycle_status === 'PAUSED' ? i18nT('恢复') : i18nT('暂停')}</button>
                  <button type="button" onClick={() => { if (window.confirm(i18nT('删除这个循环及其派生提醒？'))) run('delete-cycle', () => deleteTemptationCycle(item.id), '循环及相关派生提醒已删除。') }}>{i18nT('删除')}</button>
                </footer>
              </article>
            )) : <Empty title="还没有你确认的循环">{i18nT('可以只记录最早信号、一个保护因素和一个恢复路径，不必强行补全。')}</Empty>}
          </div>
        </div>
      ) : null}

      {tab === 'plans' ? (
        <div className="ft-protection-view" role="tabpanel">
          <div className="ft-plan-builder">
            <h4>{i18nT('在平稳时建立保护计划')}</h4>
            <input value={planTitle} placeholder={i18nT('计划名称')} onChange={(event) => setPlanTitle(event.target.value)} />
            <button type="button" disabled={!planTitle || !!busy} onClick={() => run('plan', () => createProtectionPlan({ title: planTitle, cycle_ids: [], protective_actions: [{ action_type: 'DELAY_DECISION', title: '延迟十分钟' }], sharing_policy: { mode: 'PRIVATE_ONLY' }, user_confirmed: true }), '私有保护计划已保存。')}>{i18nT('创建私有计划')}</button>
          </div>
          {activePlan ? <p className="ft-active-plan">{i18nT('当前计划')}：{activePlan.title}</p> : null}
          <div className="ft-plan-list">{plans.map((item) => <article key={item.id}><span>{item.active ? i18nT('已启用') : i18nT('未启用')}</span><h4>{item.title}</h4><p>{i18nT('默认私有；分享需要联系人、字段和有效期授权。')}</p><footer><button type="button" onClick={() => run('plan-status', () => updateProtectionPlanStatus(item.id, item.active ? 'pause' : 'activate'), '保护计划状态已更新。')}>{item.active ? i18nT('暂停') : i18nT('启用')}</button><button type="button" onClick={() => run('rehearse', () => updateProtectionPlanStatus(item.id, 'rehearse'), '计划演练已记录，不会执行外部动作。')}>{i18nT('演练')}</button></footer></article>)}</div>
        </div>
      ) : null}

      {tab === 'warnings' ? (
        <div className="ft-protection-view" role="tabpanel">
          <div className="ft-warning-history">{warnings.length ? warnings.map((item) => <article key={item.id}><span>{item.created_at} · {item.warning_level}</span><h4>{item.title}</h4><p>{item.message}</p><small>{i18nT('不显示犯罪预测成功率；反馈只用于减少误报和打扰。')}</small><footer><button type="button" onClick={() => run('helpful', () => markProtectionWarning(item.id, 'accurate', { feedback_type: 'ACCURATE_AND_HELPFUL' }), '反馈已保存。')}>{i18nT('准确且有帮助')}</button><button type="button" onClick={() => run('too-frequent', () => markProtectionWarning(item.id, 'too-frequent'), '提醒频率将被重新校准。')}>{i18nT('太频繁')}</button></footer></article>) : <Empty title="还没有提醒历史">{i18nT('历史按时间中性呈现，不统计失败次数或连续未复发天数。')}</Empty>}</div>
        </div>
      ) : null}

      {tab === 'recovery' ? (
        <div className="ft-protection-view" role="tabpanel">
          <p className="ft-recovery-order">{i18nT('安全 → 停止继续 → 真人连接 → 一个恢复行动 → 稳定后再复盘')}</p>
          {recovery ? <article className="ft-recovery-card"><span>{recovery.recovery_status}</span><h4>{i18nT('先处理当前安全')}</h4><p>{i18nT('不需要现在完整解释原因；一次跌倒不定义你的全部身份。')}</p><footer><button type="button" onClick={() => run('safe', () => updateRecoverySafety('SAFE'), '安全状态已更新。')}>{i18nT('我现在安全')}</button><button type="button" onClick={() => run('stopped', () => updateRecoveryBehaviorStopped(true), '已经记录停止继续。')}>{i18nT('行为已经停止')}</button><button type="button" onClick={() => run('leave', () => chooseRecoveryAction('LEAVE_ENVIRONMENT'), '已选择离开环境。')}>{i18nT('离开当前环境')}</button><button type="button" onClick={() => run('defer', deferRecoveryReview, '今天先不分析。')}>{i18nT('今天先不分析')}</button><button type="button" onClick={() => run('stabilized', stabilizeRecovery, '已稳定；稍后的复盘仍然可跳过。')}>{i18nT('我已经稳定')}</button></footer></article> : <Empty title="需要恢复支持时，可以从安全检查开始"><button type="button" onClick={() => run('recovery', () => startProtectionRecovery({ event_type: 'USER_REQUESTED_RECOVERY', occurred_at: new Date().toISOString(), immediate_safety_status: 'UNKNOWN', continuation_risk: 'UNKNOWN', processing_preference: 'ALLOW_RECOVERY_SUPPORT' }), '恢复支持已开始。')}>{i18nT('开始恢复支持')}</button></Empty>}
        </div>
      ) : null}

      {tab === 'support' ? (
        <div className="ft-protection-view" role="tabpanel">
          <div className="ft-contact-builder"><h4>{i18nT('添加一个由你选择的支持对象')}</h4><input value={contactDraft.display_alias} placeholder={i18nT('只保存显示别名')} onChange={(event) => setContactDraft((value) => ({ ...value, display_alias: event.target.value }))} /><select value={contactDraft.support_role} onChange={(event) => setContactDraft((value) => ({ ...value, support_role: event.target.value }))}><option value="FRIEND">FRIEND</option><option value="ACCOUNTABILITY_PARTNER">ACCOUNTABILITY_PARTNER</option><option value="PASTOR">PASTOR</option><option value="THERAPIST_OR_COUNSELOR">THERAPIST_OR_COUNSELOR</option></select><button type="button" disabled={!contactDraft.display_alias || !!busy} onClick={() => run('contact', () => createProtectionContact({ ...contactDraft, allowed_share_fields: [], allowed_actions: ['DRAFT_MESSAGE_ONLY'] }), '支持联系人已保存；没有获得 Twin 访问权。')}>{i18nT('保存联系人')}</button></div>
          <div className="ft-contact-list">{contacts.map((item) => <article key={item.id}><span>{item.support_role}</span><h4>{item.display_alias}</h4><p>{i18nT('角色标签不等于访问权限；默认只能生成草稿。')}</p><button type="button" onClick={() => run('draft', () => draftProtectionMessage(item.id, { request_type: 'ONE_TIME_HELP_REQUEST', message: '我现在需要有人陪我说五分钟。' }), '求助消息草稿已生成，尚未发送。')}>{i18nT('生成求助草稿')}</button></article>)}</div>
        </div>
      ) : null}

      {tab === 'settings' ? (
        <div className="ft-protection-view" role="tabpanel">
          <div className="ft-protection-settings">
            <label><input type="checkbox" checked={settings.warnings_enabled} onChange={(event) => setSettings((value) => ({ ...value, warnings_enabled: event.target.checked }))} />{i18nT('开启我确认的循环提醒')}</label>
            <label><input type="checkbox" checked={settings.effect_learning_enabled} onChange={(event) => setSettings((value) => ({ ...value, effect_learning_enabled: event.target.checked }))} />{i18nT('允许在我的范围内学习误报')}</label>
            <label><input type="checkbox" checked={settings.model_assistance_enabled} onChange={(event) => setSettings((value) => ({ ...value, model_assistance_enabled: event.target.checked }))} />{i18nT('允许可选模型候选；候选仍需确认')}</label>
            <label><input type="checkbox" checked={settings.accountability_drafts_enabled} onChange={(event) => setSettings((value) => ({ ...value, accountability_drafts_enabled: event.target.checked }))} />{i18nT('允许生成守望联系草稿')}</label>
            <label><input type="checkbox" checked={settings.passive_metadata_consent} onChange={(event) => setSettings((value) => ({ ...value, passive_metadata_consent: event.target.checked, passive_metadata_enabled: event.target.checked ? value.passive_metadata_enabled : false }))} />{i18nT('单独授权低敏感度被动元数据')}</label>
            <label><input type="checkbox" checked={settings.passive_metadata_enabled} disabled={!settings.passive_metadata_consent} onChange={(event) => setSettings((value) => ({ ...value, passive_metadata_enabled: event.target.checked }))} />{i18nT('启用已授权的布尔状态或摘要')}</label>
          </div>
          <p className="ft-passive-disclosure">{i18nT('允许：你主动设定的时间、签到睡眠、Attention 汇总和边界状态。不允许：浏览正文、搜索、消息、键盘、相机、麦克风、照片、精确位置或第三方秘密报告。')}</p>
          <div className="ft-protection-setting-actions"><button type="button" onClick={saveSettings}>{i18nT('保存设置')}</button><button type="button" onClick={() => run('pause-all', () => setAllProtectionWarningsPaused(!settings.all_warnings_paused), settings.all_warnings_paused ? '全部提醒已恢复。' : '全部提醒已暂停。')}>{settings.all_warnings_paused ? i18nT('恢复全部提醒') : i18nT('暂停全部提醒')}</button><button type="button" onClick={() => run('reset-learning', resetProtectionLearning, '误报学习已经重置。')}>{i18nT('重置学习')}</button><button type="button" className="danger" onClick={() => { if (window.confirm(i18nT('删除全部循环、提醒、计划、联系人授权和恢复记录？'))) run('erase', eraseProtectionData, '保护子系统数据已删除。') }}>{i18nT('删除全部风险与保护数据')}</button></div>
        </div>
      ) : null}
    </section>
  )
}
