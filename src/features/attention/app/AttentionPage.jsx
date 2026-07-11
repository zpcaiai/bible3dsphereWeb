import React, { useEffect, useId, useMemo, useState } from 'react'
import { attentionApi } from '../../../api'
import {
  ATTENTION_DURATION_OPTIONS,
  ATTENTION_ENTRY_QUICK_ACTIVITIES,
  AttentionCategoryLabel,
  AttentionPullLabel,
  CHECKIN_STATUS_LABELS,
  DEFAULT_ATTENTION_PRAYER,
  FOCUS_TYPE_META,
  REVIEW_PRAYER_TEMPLATE,
  WarfareIntensityLabel,
} from '../lib/constants'
import { getUserLocalDate, stableAttentionReminder } from '../lib/date'
import { buildAttentionCovenantSuggestion } from '../lib/suggest'
import { validateAttentionCovenantInput } from '../lib/validators'
import {
  buildPlanDraftFromPattern,
  calculateDailySummary,
  categoryLabel,
  emptyDailySummary,
  getPatternDefinition,
  WARFARE_PATTERNS,
} from '../lib/attention-domain'
import {
  AttentionCard,
  AttentionCovenantPreview,
  AttentionEmptyState,
  AttentionPullSelector,
  AttentionQuickActions,
  AttentionStatusBadge,
  ScriptureSelector,
} from '../components/attentionComponents'
import AttentionShell from '../components/AttentionShell'
import { attentionFeatureFlags } from '../lib/integration/feature-flags'
import { attentionSectionFromPath, enabledAttentionRoutes } from '../lib/integration/route-registry'
import AccountabilityScreen from './AccountabilityScreen'
import AdminScreen from './AdminScreen'
import GroupsScreen from './GroupsScreen'
import PrivacyScreen from './PrivacyScreen'
import ReportsScreen from './ReportsScreen'
import './attention.css'
import { t as i18nT } from '../../../i18n/runtime'

const BLANK_FORM = {
  primaryOffering: '',
  missionFocus: '',
  worshipFocus: '',
  relationshipFocus: '',
  restorationFocus: '',
  mainRisk: '',
  riskPulls: [],
  digitalBoundary: '',
  timeBoundary: '',
  spiritualBoundary: '',
  scriptureReference: i18nT('箴言 4:23'),
  scriptureText: i18nT('你要保守你心，胜过保守一切，因为一生的果效是由心发出。'),
  prayer: DEFAULT_ATTENTION_PRAYER,
}

const QUICK = {
  worshipFocus: [i18nT('读经'), i18nT('祷告'), i18nT('默想'), i18nT('敬拜'), i18nT('安静等候'), i18nT('属灵阅读')],
  restorationFocus: [i18nT('早点睡'), i18nT('散步'), i18nT('运动'), i18nT('午休'), i18nT('放下手机'), i18nT('整理环境'), i18nT('安息片刻')],
  mainRisk: [i18nT('短视频'), i18nT('AI 资讯'), i18nT('财经/股价'), i18nT('社交媒体'), i18nT('购物'), i18nT('色情试探'), i18nT('网络争论'), i18nT('工作焦虑'), i18nT('比较'), i18nT('拖延'), i18nT('游戏'), i18nT('熬夜娱乐')],
  digitalBoundary: [i18nT('上午 11 点前不看资讯'), i18nT('晚上 9 点后不刷短视频'), i18nT('今天不打开短视频 App'), i18nT('只在固定时间查看消息'), i18nT('工作时手机放到另一个房间'), i18nT('财经/AI 资讯限制在 30 分钟内')],
  timeBoundary: [i18nT('15 分钟'), i18nT('30 分钟'), i18nT('45 分钟'), i18nT('60 分钟'), i18nT('今天不消费')],
  spiritualBoundary: [i18nT('想刷资讯前，先祷告 30 秒'), i18nT('焦虑时，先读一遍诗篇 46 篇'), i18nT('冲动购物前，先写下真实需要'), i18nT('想逃避时，先完成 5 分钟当前任务'), i18nT('想比较时，先写下 3 个感恩'), i18nT('受试探时，立即离开场景并联系守望伙伴')],
}

const ENTRY_BLANK = {
  category: 'mission',
  activityName: '',
  durationMinutes: 30,
  attentionState: 'focused',
  pulls: [],
  note: '',
}

const REVIEW_BLANK = {
  biggestCapture: '',
  biggestGrace: '',
  repentancePoint: '',
  tomorrowBoundary: '',
  prayer: REVIEW_PRAYER_TEMPLATE,
}

function consumeLedgerDraft() {
  try {
    const raw = window.sessionStorage.getItem('attention:ledger-draft')
    window.sessionStorage.removeItem('attention:ledger-draft')
    return raw ? { ...ENTRY_BLANK, ...JSON.parse(raw) } : ENTRY_BLANK
  } catch {
    return ENTRY_BLANK
  }
}

function toForm(covenant) {
  if (!covenant) return BLANK_FORM
  return {
    primaryOffering: covenant.primaryOffering || '',
    missionFocus: covenant.missionFocus || '',
    worshipFocus: covenant.worshipFocus || '',
    relationshipFocus: covenant.relationshipFocus || '',
    restorationFocus: covenant.restorationFocus || '',
    mainRisk: covenant.mainRisk || '',
    riskPulls: covenant.riskPulls || [],
    digitalBoundary: covenant.digitalBoundary || '',
    timeBoundary: covenant.timeBoundary || '',
    spiritualBoundary: covenant.spiritualBoundary || '',
    scriptureReference: covenant.scriptureReference || '',
    scriptureText: covenant.scriptureText || '',
    prayer: covenant.prayer || '',
  }
}

function stripEmpty(form) {
  return Object.fromEntries(Object.entries(form).map(([key, value]) => [
    key,
    typeof value === 'string' ? value.trim() : value,
  ]))
}

export default function AttentionPage({ user, token, onBack, initialSection = 'dashboard' }) {
  const [section, setSection] = useState(initialSection)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [covenant, setCovenant] = useState(null)
  const [summary, setSummary] = useState(null)
  const [summaryError, setSummaryError] = useState('')
  const [summaryRefresh, setSummaryRefresh] = useState(0)
  const localDate = useMemo(() => getUserLocalDate(user), [user])
  const reminder = useMemo(() => stableAttentionReminder(localDate), [localDate])
  const timezone = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Taipei'
  const flags = useMemo(() => attentionFeatureFlags(), [])
  const isAdmin = Boolean(user?.is_admin || user?.isAdmin)
  const routes = useMemo(() => enabledAttentionRoutes(flags, isAdmin), [flags, isAdmin])
  const allowedSections = useMemo(() => new Set(routes.map((route) => route.key)), [routes])
  const routeSections = useMemo(() => new Set(enabledAttentionRoutes(flags, true).map((route) => route.key)), [flags])

  useEffect(() => {
    setSection(routeSections.has(initialSection) ? initialSection : 'dashboard')
  }, [initialSection, routeSections])

  useEffect(() => {
    function syncFromHistory() {
      const next = attentionSectionFromPath(window.location.pathname)
      if (next && routeSections.has(next)) setSection(next)
      else if (!next) onBack?.()
      else setSection('dashboard')
    }
    window.addEventListener('popstate', syncFromHistory)
    return () => window.removeEventListener('popstate', syncFromHistory)
  }, [onBack, routeSections])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    attentionApi.today(token, timezone).then((data) => {
      if (cancelled) return
      setCovenant(data.covenant || null)
    }).catch((err) => {
      if (!cancelled) setError(err?.status === 401 ? i18nT('请先登录后使用守心模块。') : i18nT('暂时无法加载今日立约，请稍后再试。'))
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [token, timezone])

  useEffect(() => {
    if (section !== 'dashboard') return undefined
    let cancelled = false
    setSummaryError('')
    attentionApi.todaySummary(token, timezone)
      .then((data) => { if (!cancelled) setSummary(data) })
      .catch(() => { if (!cancelled) setSummaryError(i18nT('部分守心摘要暂时无法更新，其他功能仍可继续使用。')) })
    return () => { cancelled = true }
  }, [section, summaryRefresh, token, timezone])

  function openPage(next, options = {}) {
    const safeNext = routeSections.has(next) ? next : 'dashboard'
    setSection(safeNext)
    try {
      const path = safeNext === 'dashboard' ? '/attention' : `/attention/${safeNext}`
      const method = options.replace ? 'replaceState' : 'pushState'
      if (window.location.pathname !== path) window.history[method]({}, '', path)
    } catch { /* ignore */ }
  }

  const shellProps = { section, openPage, flags, isAdmin }

  if (!flags.ATTENTION_MODULE_ENABLED) {
    return <AttentionEmptyState title={i18nT("守心模块暂未开放")} onBack={onBack}>{i18nT("当前环境尚未启用守心模块。")}</AttentionEmptyState>
  }

  if (section === 'covenant') {
    return <AttentionShell {...shellProps}><AttentionCovenantScreen covenant={covenant} token={token} timezone={timezone} onSaved={setCovenant} onBack={() => openPage('dashboard')} openPage={openPage} /></AttentionShell>
  }
  if (section === 'focus') return <AttentionShell {...shellProps}><FocusScreen token={token} onBack={() => openPage('dashboard')} openPage={openPage} /></AttentionShell>
  if (section === 'ledger') return <AttentionShell {...shellProps}><LedgerScreen token={token} localDate={localDate} onBack={() => openPage('dashboard')} openPage={openPage} /></AttentionShell>
  if (section === 'review') return <AttentionShell {...shellProps}><ReviewScreen token={token} timezone={timezone} onBack={() => openPage('dashboard')} openPage={openPage} /></AttentionShell>
  if (section === 'diagnosis') return <AttentionShell {...shellProps}><DiagnosisScreen token={token} localDate={localDate} onBack={() => openPage('dashboard')} openPage={openPage} /></AttentionShell>
  if (section === 'warfare') return <AttentionShell {...shellProps}><WarfareScreen token={token} onBack={() => openPage('dashboard')} /></AttentionShell>
  if (section === 'accountability') return <AttentionShell {...shellProps}><AccountabilityScreen token={token} onBack={() => openPage('dashboard')} openPage={openPage} /></AttentionShell>
  if (section === 'groups') return <AttentionShell {...shellProps}><GroupsScreen token={token} onBack={() => openPage('dashboard')} openPage={openPage} /></AttentionShell>
  if (section === 'privacy') return <AttentionShell {...shellProps}><PrivacyScreen token={token} onBack={() => openPage('dashboard')} /></AttentionShell>
  if (section === 'admin' && !isAdmin) return <AttentionShell {...shellProps}><AttentionEmptyState title={i18nT("无权访问运营后台")} onBack={() => openPage('dashboard')}>{i18nT("运营后台仅向管理员开放，普通用户数据不会在这里展示。")}</AttentionEmptyState></AttentionShell>
  if (section === 'admin') return <AttentionShell {...shellProps}><AdminScreen token={token} onBack={() => openPage('dashboard')} /></AttentionShell>
  if (section === 'reports') {
    return <AttentionShell {...shellProps}><ReportsScreen token={token} timezone={timezone} onBack={() => openPage('dashboard')} openPage={openPage} /></AttentionShell>
  }

  const status = covenant ? 'covenant_done' : 'not_started'
  const ledger = summary?.ledger || emptyDailySummary()
  const focus = summary?.focus || {}
  const dashboardMessage = summary?.review?.exists
    ? i18nT('今天已经完成复盘。愿你在恩典中安息。')
    : ledger.capturedMinutes > 0
      ? i18nT('今天有一段注意力被牵引。看见它，是归回的开始。')
      : covenant && !ledger.entriesCount
        ? i18nT('今天已经完成立约。接下来可以记录一段注意力流向。')
        : covenant
          ? i18nT('今天的守心节奏已经开始，继续忠心走下一小步。')
          : i18nT('今天还没有开始守心操练。可以先用一分钟，把心带回神面前。')
  const priorityActions = [
    ...(focus.activeSessionExists ? ['focus'] : []),
    ...(!covenant ? ['covenant'] : []),
    ...(!summary?.review?.exists ? ['review'] : []),
    ...(summary?.groups?.todayChallengeCheckinsDue ? ['groups'] : []),
    'ledger', 'diagnosis', 'warfare', 'reports', 'accountability', 'privacy', 'admin',
  ]
  return (
    <AttentionShell {...shellProps}>
      <main className="attn-page">
      <header className="attn-header">
        <button className="attn-ghost" type="button" onClick={onBack}>{i18nT("返回星球")}</button>
        <div>
          <h1>{i18nT("守心")}</h1>
          <p>{i18nT("管理注意力，守住心的方向。")}</p>
          <p className="attn-sub">{i18nT("看见不是为了定罪，而是为了重新得自由。")}</p>
        </div>
      </header>

      {error ? <div className="attn-alert">{error}</div> : null}
      {summaryError ? <div className="attn-alert attn-alert-action" role="status"><span>{summaryError}</span><button className="attn-button secondary" type="button" onClick={() => setSummaryRefresh((value) => value + 1)}>{i18nT("重新加载摘要")}</button></div> : null}
      {loading ? <div className="attn-loading">{i18nT("正在加载今日守心状态…")}</div> : null}

      <section className="attn-grid">
        <AttentionCard title={i18nT("今日守心状态")} subtitle={localDate}>
          <div className="attn-status-row"><AttentionStatusBadge status={status} /></div>
          <p>{dashboardMessage}</p>
          <ul className="attn-checks">
            <li>{covenant ? i18nT('今日已立约') : i18nT('今日尚未立约')}</li>
            <li>{i18nT("账本记录：")} {ledger.entriesCount || 0} {i18nT("条")}</li>
            <li>{i18nT("使命/敬拜/关系/恢复：")} {ledger.investedMinutes || 0} {i18nT("分钟")}</li>
            <li>{i18nT("被掳型注意力：")} {ledger.capturedMinutes || 0} {i18nT("分钟")}</li>
            <li>{i18nT("专注完成：")} {focus.completedSessions || 0} {i18nT("段 /")} {focus.totalActualMinutes || 0} {i18nT("分钟")}</li>
            <li>{summary?.review?.exists ? i18nT('晚间复盘已完成') : i18nT('晚间复盘待完成')}</li>
          </ul>
        </AttentionCard>

        <AttentionCard title={covenant ? i18nT('今日守心立约') : i18nT('今日尚未立约')} actionLabel={covenant ? i18nT('查看 / 编辑立约') : i18nT('开始今日立约')} onAction={() => openPage('covenant')} status={covenant ? 'active' : 'empty'}>
          <AttentionCovenantPreview covenant={covenant} />
        </AttentionCard>

        <AttentionCard title={i18nT("AI 守心洞察")} actionLabel={i18nT("生成洞察")} onAction={() => openPage('diagnosis')}>
          {summary?.diagnosis ? (
            <>
              <p>{i18nT("今日已生成守心洞察。")}</p>
              <p className="attn-muted">{summary.diagnosis.result?.shortSummary?.slice(0, 90)}</p>
            </>
          ) : <p>{i18nT("基于今天的立约、账本和复盘，生成温柔的属灵反思。")}</p>}
        </AttentionCard>

        <AttentionCard title={i18nT("注意力争战地图")} actionLabel={i18nT("查看地图")} onAction={() => openPage('warfare')}>
          <p>{i18nT("看见近期最常牵引你的注意力路径，并建立具体防线。")}</p>
          {summary?.warfare?.activePlansCount ? <p>{i18nT("活跃守心计划：")} {summary.warfare.activePlansCount} {i18nT("个")}</p> : <p className="attn-muted">{i18nT("继续记录后，地图会更清晰。")}</p>}
        </AttentionCard>

        <AttentionCard title={i18nT("本周守心摘要")} actionLabel={summary?.weekly?.reportExists ? i18nT('查看周报') : i18nT('生成 / 查看周报')} onAction={() => openPage('reports')}>
          {summary?.weekly?.reportExists ? (
            <>
              <p>{i18nT("平均守心节奏：")} {summary.weekly.scoreAverage ?? i18nT('记录不足')}</p>
              <p>{i18nT("本周主要牵引：")} {(summary.weekly.topPulls || []).map((p) => p.label).join('、') || i18nT('暂无明显记录')}</p>
              <p className="attn-muted">{i18nT("下周操练：")} {summary.weekly.nextWeekPractice || i18nT('保留当前节奏，并为一个高风险时段预设边界。')}</p>
            </>
          ) : (
            <p>{i18nT("本周还没有生成守心周报。你可以在周末或现在生成一个临时回顾。")}</p>
          )}
        </AttentionCard>

        <AttentionCard title={i18nT("同伴守望")} actionLabel={i18nT("进入守望")} onAction={() => openPage('accountability')}>
          <p>{i18nT("只在你选择的边界内，把守心状态、代祷请求或摘要分享给可信任的人。")}</p>
          <ul className="attn-checks">
            <li>{i18nT("同行伙伴：")} {summary?.accountability?.activePartnersCount || 0} {i18nT("位")}</li>
            <li>{i18nT("待处理邀请：")} {summary?.accountability?.pendingInvitationsCount || 0} {i18nT("条")}</li>
            <li>{i18nT("开放代祷：")} {summary?.accountability?.openPrayerRequestsCount || 0} {i18nT("条")}</li>
          </ul>
        </AttentionCard>

        <AttentionCard title={i18nT("守心小组与挑战")} actionLabel={i18nT("进入小组")} onAction={() => openPage('groups')}>
          <p>{i18nT("和小组一起建立节奏，不排名，不公开比较，只看温柔的整体进展。")}</p>
          <ul className="attn-checks">
            <li>{i18nT("已加入小组：")}{summary?.groups?.activeGroupsCount || 0} {i18nT("个")}</li>
            <li>{i18nT("参与中挑战：")}{summary?.groups?.activeChallengesCount || 0} {i18nT("个")}</li>
            <li>{i18nT("今日待 Check-in：")}{summary?.groups?.todayChallengeCheckinsDue || 0} {i18nT("个")}</li>
          </ul>
        </AttentionCard>

        <AttentionCard title={i18nT("隐私边界")} actionLabel={i18nT("查看设置")} onAction={() => openPage('privacy')}>
          <p>{i18nT("原始祷告、复盘、洞察和敏感牵引不会自动分享。")}</p>
          <ul className="attn-checks">
            <li>{i18nT("伙伴默认：")}{summary?.privacy?.defaultPartnerVisibility === 'status_only' ? i18nT('只显示完成状态') : i18nT('按你的设置')}</li>
            <li>{i18nT("小组默认：")}{summary?.privacy?.defaultGroupVisibility === 'status_only' ? i18nT('只显示完成状态') : i18nT('按你的设置')}</li>
            <li>{summary?.privacy?.sensitiveProtectionEnabled !== false ? i18nT('敏感内容保护已开启') : i18nT('请检查敏感内容保护')}</li>
          </ul>
        </AttentionCard>
      </section>

      <section className="attn-section">
        <h2>{i18nT("快速入口")}</h2>
        <AttentionQuickActions openPage={openPage} isAdmin={isAdmin} allowedSections={allowedSections} priorityKeys={priorityActions} />
      </section>

      <section className="attn-section attn-reminder">
        <h2>{i18nT("今日属灵提醒")}</h2>
        <p>{reminder}</p>
        <div className="attn-mini-links">
          <button type="button" onClick={() => openPage('diagnosis')}>{i18nT("AI 守心洞察")}</button>
          <button type="button" onClick={() => openPage('warfare')}>{i18nT("注意力争战地图")}</button>
          <button type="button" onClick={() => openPage('reports')}>{i18nT("守心周报")}</button>
          <button type="button" onClick={() => openPage('privacy')}>{i18nT("隐私边界")}</button>
        </div>
      </section>
      </main>
    </AttentionShell>
  )
}

function AttentionCovenantScreen({ covenant, token, timezone, onSaved, onBack, openPage }) {
  const [editing, setEditing] = useState(!covenant)
  const [form, setForm] = useState(() => toForm(covenant))
  const [saving, setSaving] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setEditing(!covenant)
    setForm(toForm(covenant))
  }, [covenant])

  function patch(values) {
    setForm((current) => ({ ...current, ...values }))
  }

  async function handleSuggest() {
    setSuggesting(true)
    setMessage('')
    try {
      let suggestion
      try {
        suggestion = await attentionApi.suggestCovenant({
          primaryOffering: form.primaryOffering,
          mainRisk: form.mainRisk,
          riskPulls: form.riskPulls,
        }, token)
      } catch {
        suggestion = buildAttentionCovenantSuggestion(form)
      }
      const next = {}
      if (!form.digitalBoundary) next.digitalBoundary = suggestion.suggestedDigitalBoundary
      if (!form.timeBoundary) next.timeBoundary = suggestion.suggestedTimeBoundary
      if (!form.spiritualBoundary) next.spiritualBoundary = suggestion.suggestedSpiritualBoundary
      if (!form.scriptureReference || form.scriptureReference === BLANK_FORM.scriptureReference) next.scriptureReference = suggestion.suggestedScripture?.reference || ''
      if (!form.scriptureText || form.scriptureText === BLANK_FORM.scriptureText) next.scriptureText = suggestion.suggestedScripture?.text || ''
      if (!form.prayer || form.prayer === BLANK_FORM.prayer) next.prayer = suggestion.suggestedPrayer
      patch(next)
      setMessage(i18nT('已使用系统建议填充空白项。'))
    } catch {
      setMessage(i18nT('暂时无法生成建议，你仍然可以手动填写。'))
    } finally {
      setSuggesting(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const payload = validateAttentionCovenantInput(stripEmpty(form))
      const result = covenant
        ? await attentionApi.updateCovenant(covenant.id, payload, token, timezone)
        : await attentionApi.createCovenant(payload, token, timezone)
      onSaved(result.covenant)
      setEditing(false)
      setMessage(i18nT('今日守心立约已保存。'))
    } catch (err) {
      setMessage(err?.message || i18nT('保存今日立约时遇到问题，请稍后再试。'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="attn-page">
      <PageHeader title={i18nT("今日注意力立约")} subtitle={i18nT("在世界争夺你之前，先把心归给主。")} onBack={onBack} />
      {message ? <div className="attn-alert">{message}</div> : null}
      {!editing && covenant ? (
        <AttentionCard title={i18nT("今日守心立约")} actionLabel={i18nT("编辑立约")} onAction={() => setEditing(true)}>
          <FullSummary covenant={covenant} />
          <div className="attn-footer-actions">
            <button type="button" className="attn-button" onClick={() => openPage('focus')}>{i18nT("开始专注")}</button>
            <button type="button" className="attn-button secondary" onClick={onBack}>{i18nT("返回守心首页")}</button>
          </div>
        </AttentionCard>
      ) : (
        <form className="attn-form" onSubmit={handleSubmit}>
          <Field label={i18nT("今天你最想把注意力献给什么？")} hint="这不是要写一个完美答案，而是在神面前确认今天的心要朝向哪里。">
            <textarea rows={3} required value={form.primaryOffering} placeholder={i18nT("例如：完成一个深度工作任务、安静读经祷告、陪伴家人、推进一个重要项目")} onChange={(e) => patch({ primaryOffering: e.target.value })}  aria-label={i18nT("例如：完成一个深度工作任务、安静读经祷告、陪伴家人、推进一个重要项目")}/>
          </Field>
          <Field label={i18nT("今天你最重要的使命任务是什么？")}><input value={form.missionFocus} placeholder={i18nT("例如：完成 90 分钟深度工作")} onChange={(e) => patch({ missionFocus: e.target.value })}  aria-label={i18nT("例如：完成 90 分钟深度工作")}/></Field>
          <QuickField label={i18nT("今天你希望怎样先把心归给神？")} field="worshipFocus" value={form.worshipFocus} options={QUICK.worshipFocus} onQuick={(field, value) => patch({ [field]: value })} onChange={patch} />
          <Field label={i18nT("今天你希望把真实注意力给到谁？")}><input value={form.relationshipFocus} placeholder={i18nT("例如：认真陪伴家人")} onChange={(e) => patch({ relationshipFocus: e.target.value })}  aria-label={i18nT("例如：认真陪伴家人")}/></Field>
          <QuickField label={i18nT("今天你需要怎样照顾自己的有限？")} field="restorationFocus" value={form.restorationFocus} options={QUICK.restorationFocus} onQuick={(field, value) => patch({ [field]: value })} onChange={patch} />
          <QuickField label={i18nT("今天最可能抢夺你注意力的是什么？")} field="mainRisk" value={form.mainRisk} options={QUICK.mainRisk} hint="诚实看见风险，不是为了定罪，而是为了设立防线。" onQuick={(field, value) => patch({ [field]: value })} onChange={patch} />
          <Field label={i18nT("这背后可能是什么在牵引你？")}><AttentionPullSelector selected={form.riskPulls} onChange={(riskPulls) => patch({ riskPulls })} /></Field>
          <QuickField label={i18nT("今天你要设立哪一道数字边界？")} field="digitalBoundary" value={form.digitalBoundary} options={QUICK.digitalBoundary} onQuick={(field, value) => patch({ [field]: value })} onChange={patch} />
          <QuickField label={i18nT("今天你希望给信息消费设定什么时间上限？")} field="timeBoundary" value={form.timeBoundary} options={QUICK.timeBoundary} onQuick={(field, value) => patch({ [field]: value })} onChange={patch} />
          <QuickField label={i18nT("当你想被牵走时，你要如何回到神面前？")} field="spiritualBoundary" value={form.spiritualBoundary} options={QUICK.spiritualBoundary} onQuick={(field, value) => patch({ [field]: value })} onChange={patch} />
          <div className="attn-suggest-row"><button type="button" className="attn-button secondary" disabled={suggesting} onClick={handleSuggest}>{suggesting ? i18nT('正在整理今日守心建议…') : i18nT('生成今日守心建议')}</button></div>
          <Field label={i18nT("今日经文")}><ScriptureSelector reference={form.scriptureReference} text={form.scriptureText} onChange={patch} /></Field>
          <Field label={i18nT("今日开始祷告")}><textarea rows={8} value={form.prayer} onChange={(e) => patch({ prayer: e.target.value })} /></Field>
          <div className="attn-footer-actions">
            <button type="submit" className="attn-button" disabled={saving}>{saving ? i18nT('保存中…') : covenant ? i18nT('保存修改') : i18nT('提交今日立约')}</button>
            {covenant ? <button type="button" className="attn-button secondary" onClick={() => setEditing(false)}>{i18nT("取消编辑")}</button> : null}
          </div>
        </form>
      )}
    </main>
  )
}

function FocusScreen({ token, onBack, openPage }) {
  const [active, setActive] = useState(null)
  const [sessions, setSessions] = useState([])
  const [form, setForm] = useState({ focusType: 'mission', plannedMinutes: 25, intention: '', openingPrayer: FOCUS_TYPE_META.mission.prayer })
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [tick, setTick] = useState(Date.now())
  const [closingReflection, setClosingReflection] = useState('')
  const [interruptionReason, setInterruptionReason] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([attentionApi.activeFocusSession(token), attentionApi.listFocusSessions({ limit: 10 }, token)]).then(([a, l]) => {
      if (cancelled) return
      if (a.status === 'fulfilled') setActive(a.value.active)
      if (l.status === 'fulfilled') setSessions(l.value.sessions || [])
      if (a.status === 'rejected' && l.status === 'rejected') setMessage(i18nT('暂时无法加载专注状态，请稍后重试。'))
    })
    return () => { cancelled = true }
  }, [token])

  useEffect(() => {
    if (!active) return undefined
    const id = window.setInterval(() => setTick(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [active])

  function patch(values) {
    setForm((current) => ({ ...current, ...values }))
  }

  async function start() {
    setBusy(true)
    setMessage('')
    try {
      const result = await attentionApi.startFocusSession(form, token)
      setActive(result.session)
      setSessions((current) => [result.session, ...current])
    } catch (err) {
      setMessage(err.message || i18nT('开始专注时遇到问题。'))
    } finally {
      setBusy(false)
    }
  }

  async function end() {
    if (!active) return
    setBusy(true)
    try {
      const result = await attentionApi.endFocusSession(active.id, { closingReflection }, token)
      setActive(null)
      setSessions((current) => [result.session, ...current.filter((s) => s.id !== result.session.id)])
      setClosingReflection('')
      try {
        window.sessionStorage.setItem('attention:ledger-draft', JSON.stringify({
          category: active.focusType || 'mission',
          activityName: active.intention || i18nT('{label}记录', { label: FOCUS_TYPE_META[active.focusType]?.label || i18nT('专注') }),
          durationMinutes: result.session.actualMinutes || active.plannedMinutes || 25,
          attentionState: active.interrupted ? 'scattered' : 'focused',
        }))
      } catch { /* transient prefill is optional */ }
      openPage('ledger')
    } catch (err) {
      setMessage(err.message || i18nT('结束专注时遇到问题。'))
    } finally {
      setBusy(false)
    }
  }

  async function interrupt() {
    if (!active) return
    const reason = interruptionReason.trim()
    if (!reason) return
    try {
      const result = await attentionApi.interruptFocusSession(active.id, { interruptionReason: reason }, token)
      setActive(result.session)
      setInterruptionReason('')
      setMessage(i18nT('已记录中断。看见牵引，是重新归回的开始。'))
    } catch (err) {
      setMessage(err.message || i18nT('记录中断时遇到问题。'))
    }
  }

  const elapsed = active ? Math.max(0, Math.floor((tick - new Date(active.startedAt).getTime()) / 60000)) : 0
  const remaining = active ? Math.max(0, Number(active.plannedMinutes || 0) - elapsed) : 0

  return (
    <main className="attn-page">
      <PageHeader title={i18nT("专注模式")} subtitle={i18nT("以祷告开始一段使命专注，结束后把实际时间带回账本。")} onBack={onBack} />
      {message ? <div className="attn-alert">{message}</div> : null}
      <section className="attn-grid">
        <AttentionCard title={active ? i18nT('专注进行中') : i18nT('开始一段专注')}>
          {active ? (
            <div className="attn-focus-timer" aria-live="polite">
              <strong>{remaining} {i18nT("分钟")}</strong>
              <span>{i18nT("已进行")} {elapsed} {i18nT("分钟 / 计划")} {active.plannedMinutes} {i18nT("分钟")}</span>
              <p>{active.intention || i18nT('愿这段注意力忠心献上。')}</p>
              <Field label={i18nT("刚才是什么牵引了注意力？")}>
                <input value={interruptionReason} onChange={(event) => setInterruptionReason(event.target.value)} placeholder={i18nT("只在需要记录中断时填写")}  aria-label={i18nT("只在需要记录中断时填写")}/>
              </Field>
              <Field label={i18nT("结束时的一句话复盘")}>
                <textarea rows={3} value={closingReflection} onChange={(event) => setClosingReflection(event.target.value)} placeholder={i18nT("这段专注结束时，我留意到…")}  aria-label={i18nT("这段专注结束时，我留意到…")}/>
              </Field>
              <div className="attn-footer-actions">
                <button type="button" className="attn-button" disabled={busy} onClick={end}>{i18nT("结束专注")}</button>
                <button type="button" className="attn-button secondary" disabled={busy || !interruptionReason.trim()} onClick={interrupt}>{i18nT("记录中断")}</button>
                <button type="button" className="attn-button secondary" onClick={() => openPage('ledger')}>{i18nT("去账本")}</button>
              </div>
            </div>
          ) : (
            <div className="attn-form compact-form">
              <Field label={i18nT("专注类型")}>
                <div className="attn-pill-grid">{Object.entries(FOCUS_TYPE_META).map(([key, meta]) => <button key={key} type="button" aria-pressed={form.focusType === key} className={`attn-pill ${form.focusType === key ? 'active' : ''}`} onClick={() => patch({ focusType: key, openingPrayer: meta.prayer })}>{meta.label}</button>)}</div>
              </Field>
              <Field label={i18nT("计划时长")}>
                <div className="attn-pill-grid">{ATTENTION_DURATION_OPTIONS.map((min) => <button key={min} type="button" aria-pressed={form.plannedMinutes === min} className={`attn-pill ${form.plannedMinutes === min ? 'active' : ''}`} onClick={() => patch({ plannedMinutes: min })}>{min} {i18nT("分钟")}</button>)}</div>
              </Field>
              <Field label={i18nT("这段专注献给什么？")}><input value={form.intention} onChange={(e) => patch({ intention: e.target.value })} placeholder={i18nT("例如：完成一个核心任务")}  aria-label={i18nT("例如：完成一个核心任务")}/></Field>
              <Field label={i18nT("开始祷告")}><textarea rows={4} value={form.openingPrayer} onChange={(e) => patch({ openingPrayer: e.target.value })} /></Field>
              <button type="button" className="attn-button" disabled={busy} onClick={start}>{busy ? i18nT('启动中…') : i18nT('开始专注')}</button>
            </div>
          )}
        </AttentionCard>
        <AttentionCard title={i18nT("最近专注")}>
          <SimpleList items={sessions.slice(0, 8)} empty={i18nT("还没有专注记录。")} render={(s) => <span>{FOCUS_TYPE_META[s.focusType]?.label || s.focusType} · {s.actualMinutes || s.plannedMinutes} {i18nT("分钟")}{s.interrupted ? i18nT(' · 有中断') : ''}</span>} />
        </AttentionCard>
      </section>
    </main>
  )
}

function LedgerScreen({ token, localDate, onBack, openPage }) {
  const [entries, setEntries] = useState([])
  const [summary, setSummary] = useState(emptyDailySummary())
  const [form, setForm] = useState(consumeLedgerDraft)
  const [message, setMessage] = useState('')

  const load = async () => {
    try {
      const result = await attentionApi.listEntries({ date: localDate }, token)
      setEntries(result.entries || [])
      setSummary(result.summary || calculateDailySummary(result.entries || []))
    } catch (err) {
      setMessage(err.message || i18nT('暂时无法加载注意力账本。'))
    }
  }

  useEffect(() => { load() }, [localDate, token])

  function patch(values) {
    setForm((current) => ({ ...current, ...values }))
  }

  async function submit(event) {
    event.preventDefault()
    try {
      const result = await attentionApi.createEntry({ ...form, entryDate: localDate }, token)
      const next = [result.entry, ...entries]
      setEntries(next)
      setSummary(calculateDailySummary(next))
      setForm(ENTRY_BLANK)
      setMessage(i18nT('注意力记录已保存。'))
    } catch (err) {
      setMessage(err.message || i18nT('保存注意力记录时遇到问题。'))
    }
  }

  async function remove(id) {
    if (!window.confirm(i18nT('确定删除这条注意力记录吗？'))) return
    try {
      await attentionApi.deleteEntry(id, token)
      const next = entries.filter((e) => e.id !== id)
      setEntries(next)
      setSummary(calculateDailySummary(next))
      setMessage(i18nT('注意力记录已删除。'))
    } catch (err) {
      setMessage(err?.message || i18nT('删除注意力记录时遇到问题。'))
    }
  }

  return (
    <main className="attn-page">
      <PageHeader title={i18nT("注意力账本")} subtitle={i18nT("记录注意力流向，看见今天的心被什么塑造。")} onBack={onBack} />
      {message ? <div className="attn-alert">{message}</div> : null}
      <section className="attn-grid">
        <AttentionCard title={i18nT("今日摘要")} subtitle={localDate}>
          <MetricGrid items={[
            [i18nT('总记录'), i18nT('{count} 条', { count: summary.entriesCount })],
            [i18nT('投入型注意力'), i18nT('{count} 分钟', { count: summary.investedMinutes })],
            [i18nT('被掳型注意力'), i18nT('{count} 分钟', { count: summary.capturedMinutes })],
            [i18nT('主要牵引'), summary.topPulls?.map((p) => p.label).join('、') || i18nT('暂无')],
          ]} />
          <div className="attn-bars">{Object.entries(summary.categoryMinutes || {}).map(([category, minutes]) => <div key={category}><span>{categoryLabel(category)}</span><meter min="0" max={Math.max(60, summary.totalMinutes || 1)} value={minutes} /><strong>{minutes} {i18nT("分钟")}</strong></div>)}</div>
        </AttentionCard>
        <AttentionCard title={i18nT("新增记录")}>
          <form className="attn-form compact-form" onSubmit={submit}>
            <Field label={i18nT("注意力类型")}>
              <div className="attn-pill-grid">{Object.entries(AttentionCategoryLabel).map(([key, label]) => <button key={key} type="button" aria-pressed={form.category === key} className={`attn-pill ${form.category === key ? 'active' : ''}`} onClick={() => patch({ category: key, pulls: key === 'captured' ? form.pulls : [] })}>{label}</button>)}</div>
            </Field>
            <Field label={i18nT("活动名称")}>
              <div className="attn-pill-grid">{(ATTENTION_ENTRY_QUICK_ACTIVITIES[form.category] || []).map((name) => <button key={name} type="button" className="attn-pill" onClick={() => patch({ activityName: name })}>{name}</button>)}</div>
              <input required value={form.activityName} onChange={(e) => patch({ activityName: e.target.value })} />
            </Field>
            <Field label={i18nT("时长")}><input type="number" min="1" max="1440" value={form.durationMinutes} onChange={(e) => patch({ durationMinutes: Number(e.target.value) })} /></Field>
            {form.category === 'captured' ? <Field label={i18nT("背后牵引")}><AttentionPullSelector selected={form.pulls} onChange={(pulls) => patch({ pulls })} /></Field> : null}
            <Field label={i18nT("简短备注")}><textarea rows={3} value={form.note} onChange={(e) => patch({ note: e.target.value })} /></Field>
            <button type="submit" className="attn-button">{i18nT("保存记录")}</button>
          </form>
        </AttentionCard>
      </section>
      <section className="attn-section">
        <h2>{i18nT("今日记录")}</h2>
        <div className="attn-list">{entries.length ? entries.map((entry) => <article key={entry.id} className="attn-list-row"><div><strong>{entry.activityName}</strong><span>{categoryLabel(entry.category)} · {entry.durationMinutes} {i18nT("分钟 ·")} {(entry.pulls || []).map((p) => AttentionPullLabel[p] || p).join('、')}</span></div><button type="button" className="attn-ghost" onClick={() => remove(entry.id)}>{i18nT("删除")}</button></article>) : <p className="attn-muted">{i18nT("还没有记录。可以先记录一段敬拜、使命、关系、恢复或被掳型注意力。")}</p>}</div>
        <div className="attn-footer-actions"><button type="button" className="attn-button secondary" onClick={() => openPage('review')}>{i18nT("去晚间复盘")}</button></div>
      </section>
    </main>
  )
}

function ReviewScreen({ token, timezone, onBack, openPage }) {
  const [review, setReview] = useState(null)
  const [form, setForm] = useState(REVIEW_BLANK)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    attentionApi.todayReview(token, timezone).then((result) => {
      if (result.review) {
        setReview(result.review)
        setForm({ ...REVIEW_BLANK, ...result.review })
      }
    }).catch((err) => setMessage(err.message || i18nT('暂时无法加载晚间复盘。')))
  }, [token, timezone])

  function patch(values) {
    setForm((current) => ({ ...current, ...values }))
  }

  async function suggest() {
    setBusy(true)
    setMessage('')
    try {
      const result = await attentionApi.suggestReview(token)
      patch(result.suggestion || {})
      setMessage(i18nT('已生成复盘建议，你可以继续调整。'))
    } catch (err) {
      setMessage(err?.message || i18nT('暂时无法生成复盘建议，你仍然可以手动填写。'))
    } finally {
      setBusy(false)
    }
  }

  async function submit(event) {
    event.preventDefault()
    try {
      const result = review ? await attentionApi.updateReview(review.id, form, token) : await attentionApi.saveReview(form, token)
      setReview(result.review)
      setMessage(i18nT('晚间复盘已保存。'))
    } catch (err) {
      setMessage(err.message || i18nT('保存晚间复盘时遇到问题。'))
    }
  }

  return (
    <main className="attn-page">
      <PageHeader title={i18nT("晚间复盘")} subtitle={i18nT("在一天结束时感恩、悔改，并设立明日防线。")} onBack={onBack} />
      {message ? <div className="attn-alert">{message}</div> : null}
      <form className="attn-form" onSubmit={submit}>
        <Field label={i18nT("今天我最被什么牵引？")}><textarea rows={4} value={form.biggestCapture || ''} onChange={(e) => patch({ biggestCapture: e.target.value })} /></Field>
        <Field label={i18nT("今天我在哪里看见恩典？")}><textarea rows={4} value={form.biggestGrace || ''} onChange={(e) => patch({ biggestGrace: e.target.value })} /></Field>
        <Field label={i18nT("今天需要悔改或交托的是什么？")}><textarea rows={4} value={form.repentancePoint || ''} onChange={(e) => patch({ repentancePoint: e.target.value })} /></Field>
        <Field label={i18nT("明天要设立哪一道防线？")}><textarea rows={3} value={form.tomorrowBoundary || ''} onChange={(e) => patch({ tomorrowBoundary: e.target.value })} /></Field>
        <Field label={i18nT("结束祷告")}><textarea rows={5} value={form.prayer || ''} onChange={(e) => patch({ prayer: e.target.value })} /></Field>
        <div className="attn-footer-actions">
          <button type="submit" className="attn-button" disabled={busy}>{review ? i18nT('保存复盘修改') : i18nT('保存晚间复盘')}</button>
          <button type="button" className="attn-button secondary" disabled={busy} onClick={suggest}>{busy ? i18nT('正在生成建议…') : i18nT('生成复盘建议')}</button>
          <button type="button" className="attn-button secondary" onClick={() => openPage('diagnosis')}>{i18nT("生成 AI 守心洞察")}</button>
        </div>
      </form>
    </main>
  )
}

function DiagnosisScreen({ token, localDate, onBack, openPage }) {
  const [date, setDate] = useState(localDate)
  const [diagnosisType, setDiagnosisType] = useState('daily')
  const [save, setSave] = useState(false)
  const [result, setResult] = useState(null)
  const [record, setRecord] = useState(null)
  const [history, setHistory] = useState([])
  const [quick, setQuick] = useState({ currentStruggle: '', pulls: [] })
  const [question, setQuestion] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const loadHistory = async () => {
    try {
      const data = await attentionApi.listDiagnoses({ limit: 10 }, token)
      setHistory(data.diagnoses || [])
    } catch { /* non-blocking */ }
  }
  useEffect(() => { loadHistory() }, [token])

  async function generate() {
    setLoading(true)
    setMessage('')
    try {
      const data = await attentionApi.generateDiagnosis({ date, diagnosisType, includeRecentPatterns: true, save }, token)
      setResult(data.diagnosis)
      setRecord(data.record)
      if (data.record) await loadHistory()
    } catch (err) {
      setMessage(err.message || i18nT('暂时无法生成守心洞察，请稍后再试。你仍然可以手动做晚间复盘。'))
    } finally {
      setLoading(false)
    }
  }

  async function quickReset() {
    setLoading(true)
    try {
      const data = await attentionApi.quickReset({ ...quick, save: false }, token)
      setResult(data.diagnosis)
      setRecord(data.record)
    } catch (err) {
      setMessage(err.message || i18nT('暂时无法生成归回建议。你可以先停下 30 秒，做一个简短祷告。'))
    } finally {
      setLoading(false)
    }
  }

  async function ask() {
    setLoading(true)
    try {
      const data = await attentionApi.askDiagnosis({ question, date, includeRecentPatterns: true, save: false }, token)
      setResult(data.diagnosis)
      setRecord(data.record)
    } catch (err) {
      setMessage(err.message || i18nT('暂时无法询问守心 Agent。'))
    } finally {
      setLoading(false)
    }
  }

  async function deleteHistory(id) {
    if (!window.confirm(i18nT('确定删除这份守心洞察吗？删除后无法恢复。'))) return
    try {
      await attentionApi.deleteDiagnosis(id, token)
      setHistory((items) => items.filter((item) => item.id !== id))
      setMessage(i18nT('守心洞察已删除。'))
    } catch (err) {
      setMessage(err?.message || i18nT('删除守心洞察时遇到问题。'))
    }
  }

  async function createPlanFromDiagnosis() {
    if (!record?.id) {
      setMessage(i18nT('请先勾选“生成后保存到历史”，保存洞察后再转为守心计划。'))
      return
    }
    try {
      const data = await attentionApi.createPlanFromDiagnosis(record.id, token)
      setMessage(i18nT('已创建守心计划，你可以在注意力争战地图中继续调整。'))
      if (data.plan) openPage('warfare')
    } catch (err) {
      setMessage(err?.message || i18nT('暂时无法从这份洞察创建守心计划。'))
    }
  }

  return (
    <main className="attn-page">
      <PageHeader title={i18nT("AI 守心洞察")} subtitle={i18nT("看见注意力背后的牵引，并学习重新归回。")} onBack={onBack} />
      {message ? <div className="attn-alert">{message}</div> : null}
      <section className="attn-grid">
        <AttentionCard title={i18nT("生成今日洞察")}>
          <div className="attn-form compact-form">
            <Field label={i18nT("日期")}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <Field label={i18nT("诊断类型")}>
              <div className="attn-pill-grid">
                <button type="button" aria-pressed={diagnosisType === 'daily'} className={`attn-pill ${diagnosisType === 'daily' ? 'active' : ''}`} onClick={() => setDiagnosisType('daily')}>{i18nT("今日守心洞察")}</button>
                <button type="button" aria-pressed={diagnosisType === 'weekly_pattern'} className={`attn-pill ${diagnosisType === 'weekly_pattern' ? 'active' : ''}`} onClick={() => setDiagnosisType('weekly_pattern')}>{i18nT("最近 7 天模式")}</button>
              </div>
            </Field>
            <label className="attn-inline"><input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} /> {i18nT("生成后保存到历史")}</label>
            <button type="button" className="attn-button" disabled={loading} onClick={generate}>{loading ? i18nT('正在整理你的守心记录…') : i18nT('生成守心洞察')}</button>
          </div>
        </AttentionCard>
        <AttentionCard title={i18nT("现在被牵引了吗？")}>
          <Field label={i18nT("当前牵引")}><textarea rows={4} value={quick.currentStruggle} placeholder={i18nT("例如：我现在一直想刷 AI 新闻，停不下来。")} onChange={(e) => setQuick((q) => ({ ...q, currentStruggle: e.target.value }))}  aria-label={i18nT("例如：我现在一直想刷 AI 新闻，停不下来。")}/></Field>
          <AttentionPullSelector selected={quick.pulls} onChange={(pulls) => setQuick((q) => ({ ...q, pulls }))} />
          <button type="button" className="attn-button" disabled={loading || !quick.currentStruggle.trim()} onClick={quickReset}>{i18nT("生成现在归回建议")}</button>
        </AttentionCard>
        <AttentionCard title={i18nT("问守心 Agent")}>
          <Field label={i18nT("问题")}><textarea rows={4} value={question} placeholder={i18nT("例如：为什么我一焦虑就想刷资讯？")} onChange={(e) => setQuestion(e.target.value)}  aria-label={i18nT("例如：为什么我一焦虑就想刷资讯？")}/></Field>
          <button type="button" className="attn-button" disabled={loading || !question.trim()} onClick={ask}>{i18nT("询问")}</button>
        </AttentionCard>
      </section>
      {result ? <DiagnosisResultCard result={result} onCopy={() => navigator.clipboard?.writeText(result.prayer || '')} onCreatePlan={createPlanFromDiagnosis} onReview={() => openPage('review')} onCovenant={() => openPage('covenant')} /> : null}
      <section className="attn-section">
        <h2>{i18nT("历史洞察")}</h2>
        <div className="attn-list">{history.length ? history.map((item) => <article key={item.id} className="attn-list-row"><div><strong>{item.result?.title || i18nT('守心洞察')}</strong><span>{item.diagnosisDate} · {item.result?.shortSummary}</span></div><button type="button" className="attn-ghost" onClick={() => { setResult(item.result); setRecord(item) }}>{i18nT("查看")}</button><button type="button" className="attn-ghost" onClick={() => deleteHistory(item.id)}>{i18nT("删除")}</button></article>) : <p className="attn-muted">{i18nT("还没有保存的守心洞察。你可以先生成今日洞察。")}</p>}</div>
      </section>
      <SafetyNotice />
    </main>
  )
}

function DiagnosisResultCard({ result, onCopy, onCreatePlan, onReview, onCovenant }) {
  if (result.safetyLevel === 'crisis') {
    return (
      <section className="attn-section attn-crisis">
        <h2>{i18nT("请先确保你的安全")}</h2>
        <p>{result.shortSummary}</p>
        <p>{i18nT("若你可能伤害自己或他人，请现在就寻求现实中的紧急帮助。")}</p>
      </section>
    )
  }
  return (
    <section className="attn-section">
      <h2>{result.title}</h2>
      <p>{result.shortSummary}</p>
      <div className="attn-grid tight">
        <InfoBlock title={i18nT("主要注意力模式")}><h3>{result.primaryPattern?.label}</h3><p>{result.primaryPattern?.description}</p><ul>{(result.primaryPattern?.evidence || []).map((e) => <li key={e}>{e}</li>)}</ul></InfoBlock>
        <InfoBlock title={i18nT("今天可以感恩的地方")}><ul>{(result.graceNoticed || []).map((g) => <li key={g}>{g}</li>)}</ul></InfoBlock>
        <InfoBlock title={result.repentanceInvitation?.title || i18nT('悔改邀请')}><p>{result.repentanceInvitation?.content}</p><p className="attn-muted">{result.repentanceInvitation?.notShamingReminder}</p></InfoBlock>
        <InfoBlock title={i18nT("推荐经文")}>{(result.scriptureSuggestions || []).map((s) => <blockquote key={s.reference}><strong>{s.reference}</strong><p>{s.text}</p><small>{s.reason}</small></blockquote>)}</InfoBlock>
        <InfoBlock title={i18nT("祷告")}><p>{result.prayer}</p><button type="button" className="attn-ghost" onClick={onCopy}>{i18nT("复制祷告")}</button></InfoBlock>
        <InfoBlock title={i18nT("行动计划")}><ul><li>{result.actionPlan?.todayReset}</li><li>{result.actionPlan?.tomorrowBoundary}</li><li>{result.actionPlan?.replacementPractice}</li><li>{result.actionPlan?.concreteNextStep}</li></ul></InfoBlock>
      </div>
      <div className="attn-footer-actions">
        <button type="button" className="attn-button" onClick={onCreatePlan}>{i18nT("转为守心计划")}</button>
        <button type="button" className="attn-button secondary" onClick={onReview}>{i18nT("去晚间复盘")}</button>
        <button type="button" className="attn-button secondary" onClick={onCovenant}>{i18nT("去今日立约")}</button>
      </div>
      <p className="attn-muted">{result.disclaimer}</p>
    </section>
  )
}

function WarfareScreen({ token, onBack }) {
  const [days, setDays] = useState(7)
  const [map, setMap] = useState(null)
  const [selected, setSelected] = useState(null)
  const [planDraft, setPlanDraft] = useState(null)
  const [message, setMessage] = useState('')

  const load = async () => {
    try {
      const result = await attentionApi.warfareMap({ days }, token)
      setMap(result.map)
      if (!selected && result.map?.primaryPattern) setSelected(getPatternDefinition(result.map.primaryPattern.patternKey))
    } catch (err) {
      setMessage(err.message || i18nT('暂时无法加载争战地图，请稍后再试。'))
    }
  }
  useEffect(() => { load() }, [days, token])

  async function savePlan(event) {
    event.preventDefault()
    try {
      await attentionApi.createWarfarePlan(planDraft, token)
      setPlanDraft(null)
      setMessage(i18nT('守心计划已保存。'))
      await load()
    } catch (err) {
      setMessage(err.message || i18nT('保存守心计划时遇到问题，请稍后再试。'))
    }
  }

  async function saveCheckin(planId, status) {
    try {
      await attentionApi.savePlanCheckin(planId, { status, noticed: status !== 'not_seen', returnedToGod: status === 'returned' }, token)
      setMessage(i18nT('今日 check-in 已保存。'))
      await load()
    } catch (err) {
      setMessage(err?.message || i18nT('保存今日 check-in 时遇到问题。'))
    }
  }

  const scores = map?.patternScores || WARFARE_PATTERNS.map((p) => ({ patternKey: p.key, label: p.label, intensity: 'none', score: 0, evidence: {}, suggestedNextStep: i18nT('近期没有明显记录。') }))
  return (
    <main className="attn-page">
      <PageHeader title={i18nT("注意力争战地图")} subtitle={i18nT("看见注意力被牵引的路径，并建立归回的防线。")} onBack={onBack} />
      {message ? <div className="attn-alert">{message}</div> : null}
      <section className="attn-section">
        <div className="attn-pill-grid">{[7, 14, 30].map((d) => <button key={d} type="button" aria-pressed={days === d} className={`attn-pill ${days === d ? 'active' : ''}`} onClick={() => setDays(d)}>{i18nT("最近")} {d} {i18nT("天")}</button>)}</div>
      </section>
      <section className="attn-grid">
        <AttentionCard title={i18nT("地图总览")}>
          <MetricGrid items={[
            [i18nT('被掳型注意力'), i18nT('{count} 分钟', { count: map?.summary?.totalCapturedMinutes || 0 })],
            [i18nT('投入型注意力'), i18nT('{count} 分钟', { count: map?.summary?.totalInvestedMinutes || 0 })],
            [i18nT('专注中断'), i18nT('{count} 次', { count: map?.summary?.focusInterruptedCount || 0 })],
            [i18nT('活跃守心计划'), i18nT('{count} 个', { count: map?.summary?.activePlansCount || 0 })],
          ]} />
          <p>{map?.summary?.totalCapturedMinutes > 0 ? i18nT('最近有一些注意力被牵引。我们不是停在自责里，而是看见路径、设立防线、重新归回。') : i18nT('最近记录中没有明显被掳型注意力。愿你继续在安静中守住心的方向。')}</p>
        </AttentionCard>
        <AttentionCard title={i18nT("近期最明显的牵引模式")}>
          {map?.primaryPattern ? <PatternScore score={map.primaryPattern} onDetail={() => setSelected(getPatternDefinition(map.primaryPattern.patternKey))} onPlan={() => setPlanDraft(buildPlanDraftFromPattern(map.primaryPattern.patternKey))} /> : <p className="attn-muted">{i18nT("目前记录还不够，或近期没有明显牵引。继续记录后，地图会逐渐清晰。")}</p>}
        </AttentionCard>
      </section>
      <section className="attn-section">
        <h2>{i18nT("模式地图")}</h2>
        <div className="attn-pattern-grid">{scores.map((score) => <button key={score.patternKey} type="button" className="attn-pattern-node" onClick={() => setSelected(getPatternDefinition(score.patternKey))}><strong>{getPatternDefinition(score.patternKey).shortLabel}</strong><span>{WarfareIntensityLabel[score.intensity]} · {score.score}</span><small>{score.label}</small></button>)}</div>
      </section>
      {selected ? <PatternDetail pattern={selected} score={scores.find((s) => s.patternKey === selected.key)} onPlan={() => setPlanDraft(buildPlanDraftFromPattern(selected))} /> : null}
      {planDraft ? <PlanForm draft={planDraft} setDraft={setPlanDraft} onSubmit={savePlan} onCancel={() => setPlanDraft(null)} /> : null}
      <section className="attn-section">
        <h2>{i18nT("活跃守心计划")}</h2>
        <div className="attn-grid tight">{(map?.activePlans || []).length ? map.activePlans.map((plan) => <AttentionCard key={plan.id} title={plan.title}><p>{plan.digitalBoundary || plan.spiritualBoundary || plan.replacementPractice}</p><div className="attn-pill-grid">{Object.entries(CHECKIN_STATUS_LABELS).map(([status, label]) => <button key={status} type="button" className="attn-pill" onClick={() => saveCheckin(plan.id, status)}>{label}</button>)}</div></AttentionCard>) : <p className="attn-muted">{i18nT("还没有活跃的守心计划。可以从近期最明显的模式开始，建立一道具体防线。")}</p>}</div>
      </section>
      <section className="attn-section">
        <h2>{i18nT("最近 AI 洞察中的模式")}</h2>
        <SimpleList items={map?.recentDiagnosisPatterns || []} empty={i18nT("还没有可转化的 AI 守心洞察。")} render={(item) => <span>{item.diagnosisDate} · {item.label} · {item.shortSummary}</span>} />
      </section>
      <SafetyNotice />
    </main>
  )
}

function PatternScore({ score, onDetail, onPlan }) {
  return <div><h3>{score.label}</h3><p>{WarfareIntensityLabel[score.intensity]} {i18nT("· 分数")} {score.score}</p><p>{score.suggestedNextStep}</p><div className="attn-footer-actions"><button type="button" className="attn-button secondary" onClick={onDetail}>{i18nT("查看详情")}</button><button type="button" className="attn-button" onClick={onPlan}>{i18nT("建立守心计划")}</button></div></div>
}

function PatternDetail({ pattern, score, onPlan }) {
  return (
    <section className="attn-section">
      <h2>{pattern.label}</h2>
      <p>{pattern.description}</p>
      <div className="attn-path"><span>{i18nT("触发场景")}</span><span>{i18nT("牵引声音")}</span><span>{i18nT("常见行为")}</span><span>{i18nT("心的结果")}</span><span>{i18nT("归回路径")}</span></div>
      <div className="attn-grid tight">
        <InfoBlock title={i18nT("最近证据")}><ul>{score?.evidence?.pullMatches?.length ? score.evidence.pullMatches.map((p) => <li key={p.pull}>{p.label} · {p.count} {i18nT("次 ·")} {p.minutes} {i18nT("分钟")}</li>) : <li>{i18nT("近期没有明显记录。")}</li>}</ul></InfoBlock>
        <InfoBlock title={i18nT("可能根源")}><ul>{pattern.possibleRoots.map((r) => <li key={r}>{r}</li>)}</ul></InfoBlock>
        <InfoBlock title={i18nT("福音真理")}><p>{pattern.gospelTruth}</p></InfoBlock>
        <InfoBlock title={i18nT("推荐经文")}>{pattern.scriptureSuggestions.map((s) => <blockquote key={s.reference}><strong>{s.reference}</strong><p>{s.text}</p></blockquote>)}</InfoBlock>
        <InfoBlock title={i18nT("边界模板")}><ul>{[...pattern.boundaryTemplates.digital, ...pattern.boundaryTemplates.time, ...pattern.boundaryTemplates.spiritual].map((b) => <li key={b}>{b}</li>)}</ul></InfoBlock>
        <InfoBlock title={i18nT("替代操练")}><ul>{pattern.replacementPractices.map((p) => <li key={p}>{p}</li>)}</ul></InfoBlock>
      </div>
      <button type="button" className="attn-button" onClick={onPlan}>{i18nT("用这个模式创建守心计划")}</button>
    </section>
  )
}

function PlanForm({ draft, setDraft, onSubmit, onCancel }) {
  const patch = (values) => setDraft((current) => ({ ...current, ...values }))
  return (
    <section className="attn-section">
      <h2>{i18nT("创建守心计划")}</h2>
      <form className="attn-form" onSubmit={onSubmit}>
        <Field label={i18nT("标题")}><input required value={draft.title || ''} onChange={(e) => patch({ title: e.target.value })} /></Field>
        <Field label={i18nT("描述")}><textarea rows={3} value={draft.description || ''} onChange={(e) => patch({ description: e.target.value })} /></Field>
        <Field label={i18nT("数字边界")}><textarea rows={2} value={draft.digitalBoundary || ''} onChange={(e) => patch({ digitalBoundary: e.target.value })} /></Field>
        <Field label={i18nT("时间边界")}><textarea rows={2} value={draft.timeBoundary || ''} onChange={(e) => patch({ timeBoundary: e.target.value })} /></Field>
        <Field label={i18nT("属灵边界")}><textarea rows={2} value={draft.spiritualBoundary || ''} onChange={(e) => patch({ spiritualBoundary: e.target.value })} /></Field>
        <Field label={i18nT("替代操练")}><textarea rows={2} value={draft.replacementPractice || ''} onChange={(e) => patch({ replacementPractice: e.target.value })} /></Field>
        <Field label={i18nT("逃离计划")}><textarea rows={2} value={draft.escapePlan || ''} onChange={(e) => patch({ escapePlan: e.target.value })} /></Field>
        <div className="attn-footer-actions"><button type="submit" className="attn-button">{i18nT("保存守心计划")}</button><button type="button" className="attn-button secondary" onClick={onCancel}>{i18nT("取消")}</button></div>
      </form>
    </section>
  )
}

function PageHeader({ title, subtitle, onBack }) {
  return (
    <header className="attn-header compact">
      <button className="attn-ghost" type="button" onClick={onBack}>{i18nT("返回守心首页")}</button>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  )
}

function Field({ label, hint, children }) {
  const id = useId()
  const items = React.Children.toArray(children)
  const singleControl = items.length === 1
    && React.isValidElement(items[0])
    && ['input', 'textarea', 'select'].includes(items[0].type)
  return (
    <section className="attn-field" role={singleControl ? undefined : 'group'} aria-labelledby={singleControl ? undefined : `${id}-label`}>
      {singleControl ? (
        <label htmlFor={`${id}-control`}>
          <span>{label}</span>
          {hint ? <small>{hint}</small> : null}
        </label>
      ) : (
        <div className="attn-field-label" id={`${id}-label`}>
        <span>{label}</span>
        {hint ? <small>{hint}</small> : null}
        </div>
      )}
      {singleControl ? React.cloneElement(items[0], { id: items[0].props.id || `${id}-control` }) : children}
    </section>
  )
}

function QuickField({ label, hint, field, value, options, onQuick, onChange }) {
  return (
    <Field label={label} hint={hint}>
      <div className="attn-pill-grid">{options.map((option) => <button key={option} type="button" aria-pressed={value === option} className={`attn-pill ${value === option ? 'active' : ''}`} onClick={() => onQuick(field, option)}>{option}</button>)}</div>
      <input aria-label={i18nT('{label}（自定义）', { label })} value={value} onChange={(e) => onChange({ [field]: e.target.value })} />
    </Field>
  )
}

function FullSummary({ covenant }) {
  const riskPulls = (covenant.riskPulls || []).map((p) => AttentionPullLabel[p] || p).join('、') || i18nT('未选择')
  const rows = [
    [i18nT('我今天将注意力献给'), covenant.primaryOffering],
    [i18nT('今日使命焦点'), covenant.missionFocus || i18nT('未填写')],
    [i18nT('今日敬拜焦点'), covenant.worshipFocus || i18nT('未填写')],
    [i18nT('今日关系焦点'), covenant.relationshipFocus || i18nT('未填写')],
    [i18nT('今日恢复焦点'), covenant.restorationFocus || i18nT('未填写')],
    [i18nT('今日主要风险'), covenant.mainRisk || i18nT('未填写')],
    [i18nT('背后牵引'), riskPulls],
    [i18nT('今日数字边界'), covenant.digitalBoundary || i18nT('未填写')],
    [i18nT('今日时间边界'), covenant.timeBoundary || i18nT('未填写')],
    [i18nT('今日属灵边界'), covenant.spiritualBoundary || i18nT('未填写')],
    [i18nT('今日经文'), `${covenant.scriptureReference || i18nT('未填写')}${covenant.scriptureText ? `\n${covenant.scriptureText}` : ''}`],
    [i18nT('今日祷告'), covenant.prayer || i18nT('未填写')],
  ]
  return <dl className="attn-summary-list full">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
}

function MetricGrid({ items }) {
  return <div className="attn-metric-grid">{items.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
}

function SimpleList({ items, empty, render }) {
  if (!items?.length) return <p className="attn-muted">{empty}</p>
  return <div className="attn-list">{items.map((item, idx) => <article key={item.id || idx} className="attn-list-row"><div>{render(item)}</div></article>)}</div>
}

function InfoBlock({ title, children }) {
  return <article className="attn-info-block"><h3>{title}</h3>{children}</article>
}

function SafetyNotice() {
  return (
    <section className="attn-section attn-safety">
      <h2>{i18nT("隐私与安全提醒")}</h2>
      <p>{i18nT("守心洞察会使用你的立约、专注、账本和复盘摘要来生成建议，系统会尽量减少发送和保存敏感原文。你可以删除已保存的洞察。")}</p>
      <p>{i18nT("如果你正在经历自伤冲动、伤害他人的冲动或即时危险，请优先联系身边可信任的人、当地紧急服务或专业危机援助。AI 守心洞察不能替代现实中的帮助。")}</p>
    </section>
  )
}
