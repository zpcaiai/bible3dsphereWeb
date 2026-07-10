import React from 'react'
import { AttentionPullLabel, AttentionStatusLabel, SCRIPTURE_OPTIONS } from '../lib/constants'
import { t as i18nT } from '../../../i18n/runtime'

export function AttentionCard({ title, subtitle, children, actionLabel, onAction, href, status = 'active' }) {
  const action = actionLabel ? (
    href ? <a className="attn-button" href={href}>{actionLabel}</a> : <button className="attn-button" type="button" onClick={onAction}>{actionLabel}</button>
  ) : null
  return (
    <article className={`attn-card attn-card-${status}`}>
      <div className="attn-card-head">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children ? <div className="attn-card-body">{children}</div> : null}
    </article>
  )
}

export function AttentionStatusBadge({ status }) {
  return <span className={`attn-badge attn-badge-${status}`}>{AttentionStatusLabel[status] || status}</span>
}

export function AttentionEmptyState({ title, children, onBack }) {
  return (
    <main className="attn-page">
      <header className="attn-header compact">
        <button className="attn-ghost" type="button" onClick={onBack}>{i18nT("返回守心首页")}</button>
        <h1>{title}</h1>
        <p>{children}</p>
      </header>
    </main>
  )
}

export function AttentionPullSelector({ selected, onChange }) {
  const values = selected || []
  function toggle(value) {
    onChange(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  }
  return (
    <div className="attn-pill-grid" role="group" aria-label={i18nT("背后的牵引")}>
      {Object.entries(AttentionPullLabel).map(([value, label]) => (
        <button
          key={value}
          type="button"
          className={`attn-pill ${values.includes(value) ? 'active' : ''}`}
          aria-pressed={values.includes(value)}
          onClick={() => toggle(value)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export function ScriptureSelector({ reference, text, onChange }) {
  return (
    <div className="attn-scripture-picker">
      <div className="attn-pill-grid">
        {SCRIPTURE_OPTIONS.map(([ref, body]) => (
          <button
            key={ref}
            type="button"
            className={`attn-pill ${reference === ref ? 'active' : ''}`}
            aria-pressed={reference === ref}
            onClick={() => onChange({ scriptureReference: ref, scriptureText: body })}
          >
            {ref}
          </button>
        ))}
      </div>
      <label> {i18nT("经文出处")} <input value={reference || ''} onChange={(e) => onChange({ scriptureReference: e.target.value })} />
      </label>
      <label> {i18nT("经文内容")} <textarea rows={3} value={text || ''} onChange={(e) => onChange({ scriptureText: e.target.value })} />
      </label>
    </div>
  )
}

export function AttentionCovenantPreview({ covenant }) {
  if (!covenant) {
    return (
      <div className="attn-empty">
        <h4>{i18nT("今日尚未立约")}</h4>
        <p>{i18nT("在开始一天之前，先确认：你今天最宝贵的注意力要献给什么？你今天最需要防备什么？")}</p>
      </div>
    )
  }
  const riskPulls = (covenant.riskPulls || []).map((p) => AttentionPullLabel[p] || p).join('、') || i18nT('未选择')
  return (
    <dl className="attn-summary-list">
      <div><dt>{i18nT("我今天将注意力献给")}</dt><dd>{covenant.primaryOffering}</dd></div>
      <div><dt>{i18nT("今日使命焦点")}</dt><dd>{covenant.missionFocus || i18nT('未填写')}</dd></div>
      <div><dt>{i18nT("今日主要风险")}</dt><dd>{covenant.mainRisk || i18nT('未填写')}</dd></div>
      <div><dt>{i18nT("背后牵引")}</dt><dd>{riskPulls}</dd></div>
      <div><dt>{i18nT("今日数字边界")}</dt><dd>{covenant.digitalBoundary || i18nT('未填写')}</dd></div>
      <div><dt>{i18nT("今日经文")}</dt><dd>{covenant.scriptureReference || i18nT('未填写')}{covenant.scriptureText ? `：${covenant.scriptureText}` : ''}</dd></div>
    </dl>
  )
}

export function AttentionQuickActions({ openPage, isAdmin = false, allowedSections, priorityKeys = [] }) {
  const actions = [
    ['covenant', i18nT('今日立约'), i18nT('开始或编辑今天的注意力立约。')],
    ['focus', i18nT('开始专注'), i18nT('祷告后进入使命专注，记录中断与完成。')],
    ['ledger', i18nT('记录注意力'), i18nT('记录注意力流向，看见今天的心被什么塑造。')],
    ['review', i18nT('晚间复盘'), i18nT('感恩、悔改并设立明日防线。')],
    ['diagnosis', i18nT('AI 守心洞察'), i18nT('基于记录生成温柔的属灵反思。')],
    ['warfare', i18nT('争战地图'), i18nT('看见牵引路径并建立守心计划。')],
    ['reports', i18nT('守心周报'), i18nT('回看本周节奏、恩典和下周一个操练。')],
    ['accountability', i18nT('同伴守望'), i18nT('选择性分享摘要、发送代祷请求。')],
    ['groups', i18nT('守心小组'), i18nT('加入小组挑战，不排名、不比较。')],
    ['privacy', i18nT('隐私边界'), i18nT('管理伙伴、小组和挑战可见范围。')],
  ]
  if (isAdmin) actions.push(['admin', i18nT('运营后台'), i18nT('查看脱敏聚合指标和上线审计状态。')])
  const priority = new Map(priorityKeys.map((key, index) => [key, index]))
  const visibleActions = actions
    .filter(([id]) => !allowedSections || allowedSections.has(id))
    .sort(([a], [b]) => (priority.get(a) ?? 99) - (priority.get(b) ?? 99))
  return (
    <div className="attn-action-grid">
      {visibleActions.map(([id, title, sub]) => (
        <button key={id} type="button" className="attn-action" onClick={() => openPage(id)}>
          <strong>{title}</strong>
          <span>{sub}</span>
        </button>
      ))}
    </div>
  )
}
