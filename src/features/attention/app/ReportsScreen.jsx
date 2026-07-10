import React, { useEffect, useState } from 'react'
import { attentionApi } from '../../../api'
import { AttentionCategoryLabel } from '../lib/constants'
import { ScoreLabelText } from '../lib/score-types'
import { AttentionCard } from '../components/attentionComponents'
import { t as i18nT } from '../../../i18n/runtime'

const TREND_LABEL = {
  up: i18nT('比上周更稳定'),
  down: i18nT('本周节奏有些波动'),
  stable: i18nT('与上周大致稳定'),
  insufficient: i18nT('趋势参考不足'),
}

const CATEGORY_KEYS = ['worship', 'mission', 'relationship', 'restoration', 'captured']

function isoDate(date) {
  return date.toISOString().slice(0, 10)
}

function mondayOf(date) {
  const copy = new Date(date)
  const day = copy.getDay() || 7
  copy.setDate(copy.getDate() - day + 1)
  return copy
}

function addDays(date, days) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + days)
  return copy
}

function formatRange(report, weekStart) {
  const start = report?.weekStart || weekStart
  const end = report?.weekEnd || isoDate(addDays(new Date(`${start}T00:00:00`), 6))
  return `${start} - ${end}`
}

function copyText(text, setMessage, fallback = i18nT('已复制。')) {
  if (!text) return
  navigator.clipboard?.writeText(text).then(() => setMessage(fallback)).catch(() => setMessage(i18nT('暂时无法复制，请手动选择文字。')))
}

function SparkBars({ points, metric = 'score', nullLabel = i18nT('记录不足') }) {
  const values = points.map((point) => point?.[metric]).filter((value) => value != null)
  const max = Math.max(100, ...values, 1)
  return (
    <div className="attn-spark-bars">
      {points.map((point) => {
        const value = point?.[metric]
        const height = value == null ? 10 : Math.max(8, Math.round((value / max) * 88))
        return (
          <div className="attn-spark-item" key={point.date} title={`${point.date}: ${value == null ? nullLabel : value}`}>
            <div className={`attn-spark-bar ${value == null ? 'muted' : ''}`} style={{ height: `${height}px` }} />
            <span>{point.date.slice(5)}</span>
          </div>
        )
      })}
    </div>
  )
}

function ScoreMeaningNotice({ report }) {
  return (
    <section className="attn-section attn-notice">
      <h2>{i18nT("评分说明")}</h2>
      <p>{i18nT("守心评分是节奏指标，不是属灵身份，也不是神对你的评价。它只帮助你看见：哪些节奏正在建立，哪些地方需要温柔留意。")}</p>
      {report?.dataCompleteness < 60 ? <p>{i18nT("本周记录还不够完整，因此分数仅供参考，或者暂不显示。")}</p> : null}
    </section>
  )
}

function WeekSelector({ weekStart, setWeekStart, loading, onGenerate, onRefresh }) {
  const current = isoDate(mondayOf(new Date()))
  return (
    <section className="attn-section attn-week-selector">
      <div className="attn-week-controls">
        <button type="button" className="attn-ghost" onClick={() => setWeekStart(isoDate(addDays(new Date(`${weekStart}T00:00:00`), -7)))}>{i18nT("上一周")}</button>
        <input type="date" value={weekStart} onChange={(e) => setWeekStart(isoDate(mondayOf(new Date(`${e.target.value}T00:00:00`))))} />
        <button type="button" className="attn-ghost" onClick={() => setWeekStart(isoDate(addDays(new Date(`${weekStart}T00:00:00`), 7)))}>{i18nT("下一周")}</button>
        <button type="button" className="attn-ghost" onClick={() => setWeekStart(current)}>{i18nT("本周")}</button>
        <button type="button" className="attn-ghost" onClick={() => setWeekStart(isoDate(addDays(new Date(`${current}T00:00:00`), -7)))}>{i18nT("上周")}</button>
      </div>
      <div className="attn-week-actions">
        <button type="button" className="attn-button" disabled={loading} onClick={() => onGenerate(false)}>{i18nT("生成 / 查看周报")}</button>
        <button type="button" className="attn-button secondary" disabled={loading} onClick={() => onRefresh()}>{i18nT("重新加载")}</button>
        <button type="button" className="attn-button secondary" disabled={loading} onClick={() => onGenerate(true)}>{i18nT("重新生成")}</button>
      </div>
      {weekStart === current ? <p>{i18nT("这是本周截至今天的临时报告，周末后可重新生成完整周报。")}</p> : null}
    </section>
  )
}

function WeeklyHero({ report, weekStart }) {
  return (
    <section className="attn-section attn-report-hero">
      <p className="attn-sub">{formatRange(report, weekStart)}</p>
      <h2>{report?.scoreAverage == null ? i18nT('记录不足，暂不显示评分') : i18nT('{score} 分 · {label}', { score: report.scoreAverage, label: ScoreLabelText[report.scoreLabel] || report.scoreLabel })}</h2>
      <p>{report?.reportSections?.weeklySummary || i18nT('你可以根据这一周的立约、账本、专注、复盘和守心计划生成一份温柔回顾。')}</p>
      {report ? <p>{i18nT("趋势：")}{TREND_LABEL[report.scoreTrend] || i18nT('趋势参考不足')} {i18nT("· 数据完整度")} {report.dataCompleteness}%</p> : null}
    </section>
  )
}

function ScoreBreakdown({ report }) {
  const components = report?.dailyScores?.flatMap((score) => score.components || []) || []
  const byKey = {}
  components.forEach((component) => {
    byKey[component.key] ||= { ...component, score: 0, count: 0 }
    byKey[component.key].score += Number(component.score || 0)
    byKey[component.key].count += 1
  })
  const averaged = Object.values(byKey).map((item) => ({ ...item, score: Math.round(item.score / Math.max(1, item.count)) }))
  return (
    <AttentionCard title={i18nT("评分组成")} subtitle={i18nT("展示的是本周每日组件的平均值")}>
      <div className="attn-breakdown">
        {averaged.length ? averaged.map((item) => (
          <div key={item.key} className="attn-breakdown-row">
            <strong>{item.label}</strong>
            <span>{item.score} / {item.max}</span>
            <div><i style={{ width: `${Math.min(100, (item.score / item.max) * 100)}%` }} /></div>
            <p>{item.reason}</p>
            {item.gentleSuggestion ? <p>{item.gentleSuggestion}</p> : null}
          </div>
        )) : <p>{i18nT("生成周报后会显示 6 个维度的节奏参考。")}</p>}
      </div>
    </AttentionCard>
  )
}

function AllocationChart({ report }) {
  const minutes = report?.categoryMinutes || {}
  const percentages = report?.categoryPercentages || {}
  const invested = CATEGORY_KEYS.filter((key) => key !== 'captured').reduce((sum, key) => sum + Number(minutes[key] || 0), 0)
  return (
    <AttentionCard title={i18nT("五类注意力分布")}>
      <div className="attn-allocation">
        {CATEGORY_KEYS.map((key) => (
          <div key={key}>
            <span>{AttentionCategoryLabel[key] || key}</span>
            <strong>{minutes[key] || 0} {i18nT("分钟 ·")} {percentages[key] || 0}%</strong>
            <div><i className={`attn-cat-${key}`} style={{ width: `${percentages[key] || 0}%` }} /></div>
          </div>
        ))}
      </div>
      {minutes.captured > 0 ? <p>{i18nT("本周有一部分注意力被牵引。看见它，是重新设防的开始。")}</p> : null}
      {invested > (minutes.captured || 0) ? <p>{i18nT("本周更多注意力投入在敬拜、使命、关系与恢复上，这是可以感恩的节奏。")}</p> : null}
    </AttentionCard>
  )
}

function PullTrendList({ pulls }) {
  return (
    <AttentionCard title={i18nT("主要牵引")}>
      {pulls?.length ? (
        <ul className="attn-report-list">
          {pulls.slice(0, 5).map((pull) => (
            <li key={pull.pull}>
              <strong>{pull.label}</strong>
              <span>{pull.count} {i18nT("次 ·")} {pull.minutes} {i18nT("分钟")}</span>
              <p>{pull.label}{i18nT("出现时，可以把查看、回应或逃避放到固定窗口，而不是让它随时接管注意力。")}</p>
            </li>
          ))}
        </ul>
      ) : <p>{i18nT("本周没有记录明显牵引。继续保持温柔觉察。")}</p>}
    </AttentionCard>
  )
}

function GrowthCurvePanel({ trend, days, setDays }) {
  const summary = trend?.summary || {}
  return (
    <section className="attn-section">
      <div className="attn-card-head">
        <div>
          <h2>{i18nT("成长曲线")}</h2>
          <p>{i18nT("看见长期节奏，而不是被某一天定义。")}</p>
        </div>
        <div className="attn-segmented">
          {[30, 60, 90].map((value) => <button type="button" key={value} aria-pressed={days === value} className={days === value ? 'active' : ''} onClick={() => setDays(value)}>{value} {i18nT("天")}</button>)}
        </div>
      </div>
      {trend?.points?.length ? (
        <div className="attn-growth-grid">
          <AttentionCard title={i18nT("守心评分趋势")} subtitle={i18nT('平均 {value}', { value: summary.averageScore ?? i18nT('记录不足') })}><SparkBars points={trend.points} metric="score" /></AttentionCard>
          <AttentionCard title={i18nT("投入型注意力")} subtitle={i18nT('日均 {count} 分钟', { count: summary.averageInvestedMinutes || 0 })}><SparkBars points={trend.points} metric="investedMinutes" /></AttentionCard>
          <AttentionCard title={i18nT("被牵引注意力")} subtitle={i18nT('日均 {count} 分钟', { count: summary.averageCapturedMinutes || 0 })}><SparkBars points={trend.points} metric="capturedMinutes" /></AttentionCard>
          <AttentionCard title={i18nT("专注分钟")} subtitle={summary.focusTrend === 'up' ? i18nT('专注投入有增加趋势。') : summary.focusTrend === 'insufficient' ? i18nT('趋势仅供参考。') : i18nT('继续温柔观察。')}><SparkBars points={trend.points} metric="focusMinutes" /></AttentionCard>
        </div>
      ) : <p>{i18nT("成长曲线还没有足够记录。")}</p>}
      {summary.capturedTrend === 'down' ? <p>{i18nT("被牵引时长有下降趋势，这是值得感恩的变化。")}</p> : null}
      {summary.capturedTrend === 'up' ? <p>{i18nT("被牵引时长近期有上升趋势，可以温柔留意触发场景。")}</p> : null}
    </section>
  )
}

export default function ReportsScreen({ token, timezone, onBack, openPage }) {
  const [weekStart, setWeekStart] = useState(() => isoDate(mondayOf(new Date())))
  const [report, setReport] = useState(null)
  const [history, setHistory] = useState([])
  const [growth, setGrowth] = useState(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function loadReport() {
    setLoading(true)
    setError('')
    try {
      const data = await attentionApi.weeklyReport({ weekStart }, token, timezone)
      setReport(data.report || null)
    } catch {
      setError(i18nT('暂时无法加载守心周报，请稍后再试。'))
    } finally {
      setLoading(false)
    }
  }

  async function generate(forceRegenerate = false) {
    setLoading(true)
    setError('')
    setMessage('')
    try {
      const data = await attentionApi.generateWeeklyReport({ weekStart, forceRegenerate }, token, timezone)
      setReport(data.report)
      setMessage(forceRegenerate ? i18nT('已重新生成这份周报。') : i18nT('已生成守心周报。'))
      await loadHistory()
    } catch {
      setError(i18nT('生成守心周报时遇到问题，请稍后再试。'))
    } finally {
      setLoading(false)
    }
  }

  async function loadHistory() {
    const data = await attentionApi.weeklyReportHistory({ limit: 12 }, token, timezone)
    setHistory(data.reports || [])
  }

  async function hideReport(id) {
    if (!window.confirm(i18nT('确定隐藏这份周报吗？这不会影响原始注意力记录。'))) return
    try {
      await attentionApi.deleteWeeklyReport(id, token, timezone)
      setMessage(i18nT('已隐藏这份周报。'))
      if (report?.id === id) setReport(null)
      await loadHistory()
    } catch {
      setError(i18nT('隐藏周报时遇到问题，请稍后再试。'))
    }
  }

  useEffect(() => {
    loadReport()
  }, [weekStart])

  useEffect(() => {
    loadHistory().catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    attentionApi.growthTrend({ days }, token, timezone)
      .then((data) => { if (!cancelled) setGrowth(data.trend) })
      .catch(() => { if (!cancelled) setError(i18nT('暂时无法加载成长曲线，请稍后再试。')) })
    return () => { cancelled = true }
  }, [days, token, timezone])

  const sections = report?.reportSections || {}

  return (
    <main className="attn-page">
      <header className="attn-header">
        <button className="attn-ghost" type="button" onClick={onBack}>{i18nT("返回守心首页")}</button>
        <div>
          <h1>{i18nT("守心周报")}</h1>
          <p>{i18nT("安静回看这一周：注意力献给了什么，心被什么牵引，又在哪里重新归回。")}</p>
          <p className="attn-sub">{i18nT("周报不是属灵成绩单，而是帮助你看见节奏、恩典与下周一个小小的操练方向。")}</p>
        </div>
      </header>

      {error ? <div className="attn-alert">{error}</div> : null}
      {message ? <div className="attn-alert">{message}</div> : null}
      {loading ? <div className="attn-loading">{i18nT("正在整理这一周的守心记录…")}</div> : null}

      <ScoreMeaningNotice report={report} />
      <WeekSelector weekStart={weekStart} setWeekStart={setWeekStart} loading={loading} onGenerate={generate} onRefresh={loadReport} />
      <WeeklyHero report={report} weekStart={weekStart} />

      {!report ? (
        <section className="attn-section">
          <h2>{i18nT("这周还没有生成守心周报")}</h2>
          <p>{i18nT("你可以根据这一周的立约、账本、专注、复盘和守心计划生成一份温柔回顾。")}</p>
          <button type="button" className="attn-button" onClick={() => generate(false)} disabled={loading}>{i18nT("生成本周报告")}</button>
        </section>
      ) : (
        <>
          <section className="attn-grid">
            <AttentionCard title={i18nT("平均守心节奏")} subtitle={i18nT("这个分数不是属灵价值，只是根据记录计算出的节奏参考。")}>
              <div className="attn-score-number">{report.scoreAverage == null ? i18nT('记录不足') : report.scoreAverage}</div>
              <p>{ScoreLabelText[report.scoreLabel] || report.scoreLabel} {i18nT("· 数据完整度")} {report.dataCompleteness}%</p>
            </AttentionCard>
            <AttentionCard title={i18nT("专注与执行")}>
              <p>{i18nT("专注不是证明自己，而是把一段注意力忠心献上。")}</p>
              <dl className="attn-summary-list">
                <div><dt>{i18nT("总专注分钟")}</dt><dd>{report.focusSummary?.totalMinutes || 0}</dd></div>
                <div><dt>{i18nT("完成段数")}</dt><dd>{report.focusSummary?.completedSessions || 0}</dd></div>
                <div><dt>{i18nT("中断段数")}</dt><dd>{report.focusSummary?.interruptedSessions || 0}</dd></div>
              </dl>
            </AttentionCard>
            <AttentionCard title={i18nT("晚间复盘节奏")}>
              <p>{i18nT("晚间复盘不是总结失败，而是在神面前看见恩典、承认失守、设立明日防线。")}</p>
              <strong>{report.reviewSummary?.reviewDays || 0} / 7</strong>
              <p>{report.reviewSummary?.reviewRhythmLabel}</p>
            </AttentionCard>
            <AttentionCard title={i18nT("守心计划进展")} actionLabel={i18nT("查看争战地图")} onAction={() => openPage('warfare')}>
              <p>{i18nT("守心计划不是靠意志力硬撑，而是提前铺好归回路径。")}</p>
              <p>{i18nT("活跃计划")} {report.warfareSummary?.activePlansCount || 0} {i18nT("个 · check-in")} {report.warfareSummary?.checkinsCount || 0} {i18nT("次")}</p>
            </AttentionCard>
          </section>

          <section className="attn-grid">
            <AttentionCard title={i18nT("每日评分曲线")}><SparkBars points={report.dailyScores || []} /></AttentionCard>
            <ScoreBreakdown report={report} />
          </section>

          <section className="attn-grid">
            <AllocationChart report={report} />
            <PullTrendList pulls={report.topPulls || []} />
          </section>

          <section className="attn-grid">
            <AttentionCard title={i18nT("本周可以感恩的地方")}>
              <ul className="attn-report-list">{(sections.graceHighlights || [i18nT('即使本周记录不多，愿你看见：你愿意回看自己的注意力，这本身就是恩典的开始。')]).map((item) => <li key={item}>{item}</li>)}</ul>
            </AttentionCard>
            <AttentionCard title={i18nT("本周需要温柔留意的模式")}>
              <p>{sections.mainPattern}</p>
              <p>{sections.warningWithoutShame}</p>
            </AttentionCard>
            <AttentionCard title={i18nT("下周一个操练")}>
              <p>{report.nextWeekPractice || sections.nextWeekPractice}</p>
              <p>{sections.suggestedBoundary}</p>
              <button type="button" className="attn-button secondary" onClick={() => copyText(`${report.nextWeekPractice || ''}\n${sections.suggestedBoundary || ''}`, setMessage, i18nT('已复制下周操练。'))}>{i18nT("复制到下周操练")}</button>
            </AttentionCard>
            <AttentionCard title={i18nT("周报祷告")}>
              <p>{report.prayer}</p>
              <button type="button" className="attn-button secondary" onClick={() => copyText(report.prayer, setMessage, i18nT('祷告已复制。'))}>{i18nT("复制祷告")}</button>
            </AttentionCard>
          </section>
        </>
      )}

      <GrowthCurvePanel trend={growth} days={days} setDays={setDays} />

      <section className="attn-section">
        <h2>{i18nT("历史周报")}</h2>
        {history.length ? (
          <div className="attn-history-list">
            {history.map((item) => (
              <article key={item.id} className="attn-history-row">
                <div>
                  <strong>{formatRange(item, item.weekStart)}</strong>
                  <p>{item.scoreAverage == null ? i18nT('记录不足') : `${item.scoreAverage} · ${ScoreLabelText[item.scoreLabel] || item.scoreLabel}`} · {(item.reportSections?.weeklySummary || '').slice(0, 80)}</p>
                </div>
                <div className="attn-history-actions">
                  <button type="button" className="attn-ghost" onClick={() => setWeekStart(item.weekStart)}>{i18nT("查看")}</button>
                  <button type="button" className="attn-ghost" onClick={() => hideReport(item.id)}>{i18nT("隐藏")}</button>
                </div>
              </article>
            ))}
          </div>
        ) : <p>{i18nT("还没有历史周报。")}</p>}
      </section>
    </main>
  )
}
