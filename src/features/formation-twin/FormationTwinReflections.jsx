import { useCallback, useEffect, useMemo, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import {
  acceptInterventionProposal,
  answerReflectionQuestion,
  blockReflectionQuestion,
  completeWeeklyReflection,
  decideInterventionProposal,
  generateDailyReflection,
  generateWeeklyReflection,
  getCurrentDailyReflection,
  getCurrentWeeklyReflection,
  getInterventionPreferences,
  getReflectionSettings,
  listInterventions,
  modifyInterventionProposal,
  requestAlternativeIntervention,
  requestSmallerIntervention,
  resetInterventionPreferences,
  saveInterventionEffectReview,
  skipReflectionQuestion,
  skipWeeklyReflection,
  updateInterventionExecution,
  updateInterventionPreferences,
  updateReflectionSettings,
} from './formationTwinApi'

const TABS = [
  ['today', '今日镜像', '/formation-twin/reflection/today'],
  ['weekly', '周度回顾', '/formation-twin/reflection/weekly'],
  ['current', '当前行动', '/formation-twin/actions/current'],
  ['history', '行动历史', '/formation-twin/actions/history'],
  ['effects', '效果回顾', '/formation-twin/effect-reviews'],
  ['preferences', '偏好与节奏', '/formation-twin/reflection-settings'],
]

const EMPTY_SETTINGS = {
  daily_mirror_mode: 'ON_DEMAND', weekly_review_enabled: true, effect_review_enabled: true,
  cross_module_routing_enabled: false, preference_learning_enabled: true, interventions_paused: false,
  maximum_action_minutes: 10,
  quiet_hours_json: { start: '22:00', end: '07:00', timezone: 'Asia/Shanghai' },
  blocked_intervention_types_json: [], preferred_intervention_types_json: [],
}

function EmptyState({ title, children }) {
  return <div className="ft-reflection-empty"><strong>{i18nT(title)}</strong><p>{children}</p></div>
}

function SourceList({ sources = [], limitations = [] }) {
  return (
    <details className="ft-reflection-sources">
      <summary>{i18nT('来源与限制')}</summary>
      <p>{i18nT('镜像只使用当前用户主动记录、结构化事实和用户已经确认的模式。')}</p>
      <ul>
        {sources.map((source) => <li key={`${source.reference_type}-${source.reference_id}`}>{source.reference_type} · {source.reference_id}</li>)}
        {limitations.map((item) => <li key={item}>{i18nT(item)}</li>)}
      </ul>
    </details>
  )
}

function ProposalSummary({ proposal, effectReviewEnabled }) {
  if (!proposal) return null
  return (
    <dl className="ft-action-facts">
      <div><dt>{i18nT('预计时间')}</dt><dd>{proposal.estimated_duration_minutes} {i18nT('分钟')}</dd></div>
      <div><dt>{i18nT('目标模块')}</dt><dd>{proposal.target_module}</dd></div>
      <div><dt>{i18nT('执行方式')}</dt><dd>{proposal.one_time ? i18nT('一次性') : i18nT('需二次确认的短期习惯')}</dd></div>
      <div><dt>{i18nT('提醒')}</dt><dd>{proposal.reminder_enabled ? i18nT('已开启') : i18nT('关闭')}</dd></div>
      <div><dt>{i18nT('效果回顾')}</dt><dd>{effectReviewEnabled ? i18nT('可选开启') : i18nT('关闭')}</dd></div>
    </dl>
  )
}

export default function FormationTwinReflections({ user, onSafety }) {
  const [tab, setTab] = useState('today')
  const [daily, setDaily] = useState(null)
  const [weekly, setWeekly] = useState(null)
  const [interventions, setInterventions] = useState([])
  const [settings, setSettings] = useState(EMPTY_SETTINGS)
  const [learnedPreferences, setLearnedPreferences] = useState([])
  const [capacityMode, setCapacityMode] = useState('NORMAL')
  const [answer, setAnswer] = useState('')
  const [duration, setDuration] = useState(1)
  const [habitConfirmed, setHabitConfirmed] = useState(false)
  const [effectDraft, setEffectDraft] = useState({ execution_status: 'COMPLETED', helpfulness: 'UNCERTAIN', burden: 'ACCEPTABLE', preferred_adjustment: '' })
  const [selectedIntervention, setSelectedIntervention] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const proposal = daily?.proposal || weekly?.proposal || null
  const mirror = daily?.mirror || null
  const question = daily?.question || null
  const activeExecution = useMemo(
    () => interventions.find((item) => !['COMPLETED', 'CANCELLED', 'STOPPED'].includes(item.execution_status)) || null,
    [interventions],
  )

  const loadAll = useCallback(async () => {
    if (!user) return
    const results = await Promise.allSettled([
      getCurrentDailyReflection(), getCurrentWeeklyReflection(), listInterventions(), getReflectionSettings(), getInterventionPreferences(),
    ])
    if (results[0].status === 'fulfilled') setDaily(results[0].value?.mirror ? results[0].value : null)
    if (results[1].status === 'fulfilled') setWeekly(results[1].value?.review ? results[1].value : null)
    if (results[2].status === 'fulfilled') setInterventions(results[2].value?.interventions || [])
    if (results[3].status === 'fulfilled') setSettings({ ...EMPTY_SETTINGS, ...(results[3].value?.settings || {}) })
    if (results[4].status === 'fulfilled') setLearnedPreferences(results[4].value?.learned_preferences || [])
    if (results.every((item) => item.status === 'rejected')) setError(i18nT('暂时无法读取镜像中心，请稍后再试。'))
  }, [user])

  useEffect(() => { loadAll() }, [loadAll])

  const run = async (key, operation, success) => {
    setBusy(key); setError(''); setNotice('')
    try {
      const result = await operation()
      setNotice(i18nT(success))
      await loadAll()
      return result
    } catch (err) {
      setError(err?.message || i18nT('操作未完成，请稍后重试。'))
      return null
    } finally {
      setBusy('')
    }
  }

  const createDaily = () => run('daily', async () => {
    const result = await generateDailyReflection({ user_selected_mode: capacityMode })
    if (result?.crisis_first) onSafety?.()
    if (result?.mirror) setDaily(result)
    return result
  }, '今日镜像已生成。')

  const createWeekly = () => run('weekly', async () => {
    const result = await generateWeeklyReflection({ user_selected_mode: capacityMode })
    if (result?.crisis_first) onSafety?.()
    if (result?.review) setWeekly(result)
    return result
  }, '本周回顾已生成。')

  const submitAnswer = () => {
    if (!question?.id || !answer.trim()) return
    run('answer', () => answerReflectionQuestion(question.id, { answer_text: answer.trim(), answer_type: 'TEXT', processing_preference: 'STORE_ONLY' }), '回答已保存，不会自动变成行动。')
    setAnswer('')
  }

  const acceptProposal = () => {
    if (!proposal?.id) return
    const habit = proposal.target_module === 'HOLY_HABIT_ENGINE'
    if (habit && !habitConfirmed) {
      setError(i18nT('创建短期习惯前，请再次确认频率、持续时间和提醒设置。'))
      return
    }
    run('accept', () => acceptInterventionProposal(proposal.id, {
      allow_cross_module_write: true,
      habit_confirmation: habit ? { frequency: 'DAILY', duration_days: 5, reminder_enabled: false, weekly_review_usage: false } : null,
    }), '行动已按你的确认路由。')
  }

  const decision = (name, message) => proposal?.id && run(name, () => decideInterventionProposal(proposal.id, name), message)

  if (!user) {
    return (
      <div className="ft-reflections">
        <EmptyState title="登录后使用反思与行动中心">{i18nT('访客不会读取个人状态，也不会生成行动建议。')}</EmptyState>
      </div>
    )
  }

  return (
    <div className="ft-reflections" data-route={TABS.find((item) => item[0] === tab)?.[2]}>
      <header className="ft-reflections-head">
        <div><span>{i18nT('REFLECTION & MICRO ACTION')}</span><h3>{i18nT('每日镜像与最小行动')}</h3><p>{i18nT('一面可核对的镜子、一个问题、一个可自由选择的下一步。')}</p></div>
        <label>{i18nT('今天需要怎样的支持')}
          <select value={capacityMode} onChange={(event) => setCapacityMode(event.target.value)}>
            <option value="MICRO_ONLY">{i18nT('今天我只能做很小的事')}</option>
            <option value="NORMAL">{i18nT('今天可以做一个普通行动')}</option>
            <option value="REFLECTION_ONLY">{i18nT('今天只想被理解，不想接收建议')}</option>
            <option value="STORE_ONLY">{i18nT('今天只记录，不分析')}</option>
          </select>
        </label>
      </header>

      <p className="ft-reflection-boundary">{i18nT('这是一项可选建议，不是命令。完成并不等于成长，未完成也不等于失败。')}</p>
      {error && <div className="ft-reflection-error" role="alert">{error}</div>}
      {notice && <div className="ft-reflection-notice" role="status">{notice}</div>}

      <div className="ft-reflection-tabs" role="tablist" aria-label={i18nT('反思与行动页面')}>
        {TABS.map(([key, label, route]) => <button type="button" role="tab" aria-selected={tab === key} data-route={route} key={key} onClick={() => setTab(key)}>{i18nT(label)}</button>)}
      </div>

      {tab === 'today' && <section className="ft-reflection-view" aria-label={i18nT('今日镜像')}>
        <div className="ft-reflection-section-head"><div><h4>{i18nT('今天的一面镜子')}</h4><p>{i18nT('根据你主动记录和确认的内容')}</p></div><button type="button" disabled={!!busy} onClick={createDaily}>{busy === 'daily' ? i18nT('生成中…') : i18nT('生成今日镜像')}</button></div>
        {mirror ? <>
          <article className="ft-mirror-card"><span>{i18nT('镜像')}</span><h4>{mirror.headline}</h4><p>{mirror.mirror_text}</p><SourceList sources={mirror.source_references_json || []} limitations={mirror.limitations_json || []} /></article>
          {question && <article className="ft-question-card"><span>{i18nT('一个问题')}</span><h4>{question.question_text}</h4><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder={i18nT('可以简短回答，也可以跳过')} /><footer><button type="button" disabled={!answer.trim() || !!busy} onClick={submitAnswer}>{i18nT('保存回答')}</button><button type="button" onClick={() => run('question-skip', () => skipReflectionQuestion(question.id), '已跳过，不会产生负面标签。')}>{i18nT('跳过')}</button><button type="button" onClick={() => run('question-block', () => blockReflectionQuestion(question.id), '不再询问类似问题。')}>{i18nT('不再问类似问题')}</button></footer></article>}
          {proposal ? <article className="ft-action-card"><span>{i18nT('一个可选行动')}</span><h4>{proposal.title}</h4><p>{proposal.description}</p><small>{proposal.rationale}</small><ProposalSummary proposal={proposal} effectReviewEnabled={settings.effect_review_enabled} /><p className="ft-action-consent">{i18nT('只有点击接受后，系统才会写入目标模块。默认一次性、无提醒、不重复。')}</p></article> : <EmptyState title="今天不必增加行动">{i18nT('只保留这次看见，也是一个完整且合法的选择。')}</EmptyState>}
        </> : <EmptyState title="尚未生成今日镜像">{i18nT('系统不会为了填满页面而虚构状态。你可以主动生成，也可以今天不分析。')}</EmptyState>}
      </section>}

      {tab === 'weekly' && <section className="ft-reflection-view" aria-label={i18nT('周度回顾')}>
        <div className="ft-reflection-section-head"><div><h4>{i18nT('本周形成回顾')}</h4><p>{i18nT('最多三个观察、一个主题、一个可选行动')}</p></div><button type="button" disabled={!!busy} onClick={createWeekly}>{i18nT('生成本周回顾')}</button></div>
        {weekly?.review ? <article className="ft-weekly-card">
          <p className="ft-coverage">{weekly.review.data_coverage_json?.statement || i18nT('回顾只反映已有记录，可能没有覆盖全部经历。')}</p>
          <h4>{weekly.review.focus_theme || i18nT('本周值得继续观察的主题')}</h4>
          <ol>{(weekly.review.important_observations_json || []).slice(0, 3).map((item, index) => <li key={`${index}-${item.text}`}>{item.text}</li>)}</ol>
          <div className="ft-grace-list"><strong>{i18nT('保护、恩典与恢复')}</strong>{(weekly.review.grace_protection_json || []).map((item, index) => <p key={`${index}-${item.id || item.title}`}>{item.title || item.description || i18nT('一个已记录的保护因素')}</p>)}</div>
          <footer><button type="button" onClick={() => run('weekly-complete', () => completeWeeklyReflection(weekly.review.id), '本周回顾已完成。')}>{i18nT('完成回顾')}</button><button type="button" onClick={() => run('weekly-skip', () => skipWeeklyReflection(weekly.review.id), '本周已跳过，不会产生负面标签。')}>{i18nT('本周跳过')}</button></footer>
        </article> : <EmptyState title="尚无本周回顾">{i18nT('周回顾每周最多一次，也可以完全跳过。')}</EmptyState>}
      </section>}

      {tab === 'current' && <section className="ft-reflection-view" aria-label={i18nT('行动确认')}>
        <div className="ft-reflection-section-head"><div><h4>{i18nT('行动确认')}</h4><p>{i18nT('先看清将写入哪里，再决定是否接受')}</p></div></div>
        {proposal ? <article className="ft-action-confirm"><span>{i18nT('可选建议')}</span><h4>{proposal.title}</h4><p>{proposal.description}</p><ProposalSummary proposal={proposal} effectReviewEnabled={settings.effect_review_enabled} />
          <label>{i18nT('把行动调整为多少分钟')}<input type="number" min="0" max={settings.maximum_action_minutes || 10} value={duration} onChange={(event) => setDuration(Number(event.target.value))} /></label>
          {proposal.target_module === 'HOLY_HABIT_ENGINE' && <label className="ft-habit-confirm"><input type="checkbox" checked={habitConfirmed} onChange={(event) => setHabitConfirmed(event.target.checked)} />{i18nT('我再次确认：每天一次、持续5天、无提醒、无连续打卡奖励')}</label>}
          <div className="ft-action-buttons"><button type="button" className="primary" disabled={!!busy} onClick={acceptProposal}>{i18nT('接受并路由')}</button><button type="button" onClick={() => run('modify', () => modifyInterventionProposal(proposal.id, { estimated_duration_minutes: duration }), '已按你的修改生成新版本。')}>{i18nT('保存修改')}</button><button type="button" onClick={() => run('smaller', () => requestSmallerIntervention(proposal.id), '已换成更小的一步。')}>{i18nT('再小一点')}</button><button type="button" onClick={() => run('alternative', () => requestAlternativeIntervention(proposal.id), '已换成不同类别的建议。')}>{i18nT('换一个')}</button><button type="button" onClick={() => decision('defer', '已延后；不会自动提醒。')}>{i18nT('延后')}</button><button type="button" onClick={() => decision('skip', '已跳过。')}>{i18nT('跳过')}</button><button type="button" onClick={() => decision('reject', '已拒绝；系统会尊重这个类别偏好。')}>{i18nT('拒绝')}</button><button type="button" onClick={() => decision('no-action', '今天不增加行动。')}>{i18nT('今天不行动')}</button></div>
        </article> : <EmptyState title="当前没有待确认行动">{i18nT('系统不会未经确认创建任务。今天不行动也是合法选择。')}</EmptyState>}
        {activeExecution && <article className="ft-active-action"><span>{i18nT('正在进行')}</span><h4>{activeExecution.title}</h4><p>{activeExecution.execution_status}</p></article>}
      </section>}

      {tab === 'history' && <section className="ft-reflection-view" aria-label={i18nT('行动历史')}>
        <div className="ft-reflection-section-head"><div><h4>{i18nT('我的行动历史')}</h4><p>{i18nT('记录执行事实，不显示红色失败区')}</p></div></div>
        {interventions.length ? <div className="ft-action-history">{interventions.map((item) => <article key={item.id}><span>{item.execution_status}</span><h4>{item.title}</h4><p>{item.intervention_type} · {item.estimated_duration_minutes} {i18nT('分钟')}</p><footer><button type="button" onClick={() => run('start', () => updateInterventionExecution(item.id, 'start'), '已记录开始。')}>{i18nT('开始')}</button><button type="button" onClick={() => run('complete', () => updateInterventionExecution(item.id, 'complete'), '已记录完成；完成不等于效果。')}>{i18nT('完成')}</button><button type="button" onClick={() => run('stop', () => updateInterventionExecution(item.id, 'stop'), '已停止，不会解释为失败。')}>{i18nT('停止')}</button><button type="button" onClick={() => run('cancel', () => updateInterventionExecution(item.id, 'cancel'), '已取消。')}>{i18nT('取消')}</button></footer></article>)}</div> : <EmptyState title="还没有行动历史">{i18nT('接受、修改、停止或跳过都会以中性事实保存。')}</EmptyState>}
      </section>}

      {tab === 'effects' && <section className="ft-reflection-view" aria-label={i18nT('效果回顾')}>
        <div className="ft-reflection-section-head"><div><h4>{i18nT('轻量效果回顾')}</h4><p>{i18nT('最多三个问题；一次反馈不会建立确定因果')}</p></div></div>
        {interventions.length ? <form className="ft-effect-form" onSubmit={(event) => { event.preventDefault(); if (selectedIntervention) run('effect', () => saveInterventionEffectReview(selectedIntervention, effectDraft), '效果回顾已保存为用户自述。') }}>
          <label>{i18nT('选择行动')}<select required value={selectedIntervention} onChange={(event) => setSelectedIntervention(event.target.value)}><option value="">{i18nT('请选择')}</option>{interventions.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
          <label>{i18nT('你实际做了吗')}<select value={effectDraft.execution_status} onChange={(event) => setEffectDraft({ ...effectDraft, execution_status: event.target.value })}><option value="COMPLETED">{i18nT('完成')}</option><option value="PARTIALLY_COMPLETED">{i18nT('部分完成')}</option><option value="NOT_STARTED">{i18nT('未开始')}</option><option value="STOPPED">{i18nT('已停止')}</option><option value="NO_LONGER_RELEVANT">{i18nT('已不相关')}</option></select></label>
          <label>{i18nT('有多大帮助')}<select value={effectDraft.helpfulness} onChange={(event) => setEffectDraft({ ...effectDraft, helpfulness: event.target.value })}><option value="UNCERTAIN">{i18nT('不确定')}</option><option value="NOT_HELPFUL">{i18nT('没有帮助')}</option><option value="SLIGHTLY_HELPFUL">{i18nT('稍有帮助')}</option><option value="HELPFUL">{i18nT('有帮助')}</option><option value="VERY_HELPFUL">{i18nT('很有帮助')}</option></select></label>
          <label>{i18nT('负担如何')}<select value={effectDraft.burden} onChange={(event) => setEffectDraft({ ...effectDraft, burden: event.target.value })}><option value="VERY_LOW">{i18nT('非常低')}</option><option value="LOW">{i18nT('低')}</option><option value="ACCEPTABLE">{i18nT('可以接受')}</option><option value="HIGH">{i18nT('高')}</option><option value="TOO_HIGH">{i18nT('过高')}</option></select></label>
          <label>{i18nT('下次怎样调整')}<textarea value={effectDraft.preferred_adjustment} onChange={(event) => setEffectDraft({ ...effectDraft, preferred_adjustment: event.target.value })} /></label><button type="submit" disabled={!selectedIntervention || !!busy}>{i18nT('保存回顾')}</button>
        </form> : <EmptyState title="暂无可回顾行动">{i18nT('行动未完成不等于用户失败；也可以关闭效果跟踪。')}</EmptyState>}
      </section>}

      {tab === 'preferences' && <section className="ft-reflection-view" aria-label={i18nT('偏好与提醒设置')}>
        <div className="ft-reflection-section-head"><div><h4>{i18nT('支持偏好与节奏')}</h4><p>{i18nT('默认按需生成、无主动每日推送、通知内容脱敏')}</p></div></div>
        <div className="ft-reflection-settings">
          <label><input type="checkbox" checked={settings.daily_mirror_mode === 'REFLECTION_ONLY'} onChange={(event) => setSettings({ ...settings, daily_mirror_mode: event.target.checked ? 'REFLECTION_ONLY' : 'ON_DEMAND' })} /><span>{i18nT('只要镜像，不要行动')}</span></label>
          <label><input type="checkbox" checked={!!settings.weekly_review_enabled} onChange={(event) => setSettings({ ...settings, weekly_review_enabled: event.target.checked })} /><span>{i18nT('允许每周一次回顾')}</span></label>
          <label><input type="checkbox" checked={!!settings.effect_review_enabled} onChange={(event) => setSettings({ ...settings, effect_review_enabled: event.target.checked })} /><span>{i18nT('允许轻量效果回顾')}</span></label>
          <label><input type="checkbox" checked={!!settings.cross_module_routing_enabled} onChange={(event) => setSettings({ ...settings, cross_module_routing_enabled: event.target.checked })} /><span>{i18nT('允许我确认后写入其他模块')}</span></label>
          <label><input type="checkbox" checked={!!settings.preference_learning_enabled} onChange={(event) => setSettings({ ...settings, preference_learning_enabled: event.target.checked })} /><span>{i18nT('允许学习我的支持偏好')}</span></label>
          <label><span>{i18nT('最大行动分钟数')}</span><input type="number" min="0" max="30" value={settings.maximum_action_minutes} onChange={(event) => setSettings({ ...settings, maximum_action_minutes: Number(event.target.value) })} /></label>
          <label><span>{i18nT('安静时段开始')}</span><input type="time" value={settings.quiet_hours_json?.start || '22:00'} onChange={(event) => setSettings({ ...settings, quiet_hours_json: { ...(settings.quiet_hours_json || {}), start: event.target.value } })} /></label>
          <label><span>{i18nT('安静时段结束')}</span><input type="time" value={settings.quiet_hours_json?.end || '07:00'} onChange={(event) => setSettings({ ...settings, quiet_hours_json: { ...(settings.quiet_hours_json || {}), end: event.target.value } })} /></label>
        </div>
        <div className="ft-settings-actions"><button type="button" onClick={() => run('settings', () => updateReflectionSettings({ daily_mirror_mode: settings.daily_mirror_mode, weekly_review_enabled: settings.weekly_review_enabled, effect_review_enabled: settings.effect_review_enabled, cross_module_routing_enabled: settings.cross_module_routing_enabled, preference_learning_enabled: settings.preference_learning_enabled, maximum_action_minutes: settings.maximum_action_minutes, quiet_hours: { ...(settings.quiet_hours_json || {}), timezone: settings.quiet_hours_json?.timezone || 'Asia/Shanghai' } }), '设置已保存。')}>{i18nT('保存设置')}</button><button type="button" onClick={() => run('pause', () => updateReflectionSettings({ interventions_paused: !settings.interventions_paused }), settings.interventions_paused ? '微干预已恢复。' : '微干预已暂停。')}>{settings.interventions_paused ? i18nT('恢复微干预') : i18nT('暂停全部微干预')}</button><button type="button" onClick={() => run('reset', resetInterventionPreferences, '已重置学习到的支持偏好。')}>{i18nT('重置学习偏好')}</button></div>
        <div className="ft-learned-preferences"><h4>{i18nT('系统学到的支持偏好')}</h4>{learnedPreferences.length ? learnedPreferences.map((item) => <p key={item.id}>{item.preference_type}</p>) : <p>{i18nT('目前没有学习到的偏好。')}</p>}<button type="button" onClick={() => run('learning-off', () => updateInterventionPreferences({ preference_learning_enabled: false }), '已停止偏好学习。')}>{i18nT('禁止继续学习')}</button></div>
      </section>}
    </div>
  )
}
