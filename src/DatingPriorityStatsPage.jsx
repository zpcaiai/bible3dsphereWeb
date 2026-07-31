import { useCallback, useEffect, useState } from 'react'
import BackButton from './BackButton'
import { fetchDatingPriorityStats } from './api'
import { DATING_PRIORITY_PERSPECTIVES } from './datingPriorityData'
import { getRuntimeLang, t as i18nT } from './i18n/runtime'
import './DatingPriorityPage.css'

const PERSPECTIVE_KEYS = Object.keys(DATING_PRIORITY_PERSPECTIVES)
const AUTO_REFRESH_MS = 30_000

function StatList({ items, veto = false }) {
  if (!items.length) {
    return (
      <p className="dp-stats-empty">
        {i18nT(veto ? '当前还没有否决条件统计。' : '当前还没有优先因素统计。')}
      </p>
    )
  }

  return (
    <div className={`dp-stats-group${veto ? ' dp-stats-veto-group' : ''}`}>
      <h4>
        {i18nT(veto
          ? '所有被选择的否决条件 · 按选择率排序'
          : '所有被选择的因素 · 按选择率排序')}
      </h4>
      <ol className="dp-stats-list">
        {items.map((item, index) => (
          <li key={`${item.category || 'veto'}-${item.label}`}>
            <span className="dp-stat-rank">{index + 1}</span>
            <div className="dp-stat-main">
              <div>
                <strong>{item.label}</strong>
                <span>
                  {veto
                    ? i18nT('{rate}% 选择', { rate: item.selection_rate })
                    : i18nT('{rate}% 选择 · 平均第 {rank} 位 · 平均权重 {score}', {
                        rate: item.selection_rate,
                        rank: item.avg_rank,
                        score: item.avg_score,
                      })}
                </span>
              </div>
              <div className={`dp-stat-bar${veto ? ' dp-stat-veto-bar' : ''}`} aria-hidden="true">
                <i style={{ width: `${Math.min(100, Number(item.selection_rate) || 0)}%` }} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function PerspectiveStats({ perspectiveKey, stats }) {
  const perspective = DATING_PRIORITY_PERSPECTIVES[perspectiveKey]
  return (
    <section className="dp-current-stats dp-summary-card" aria-labelledby={`stats-${perspectiveKey}`}>
      <div className="dp-stats-heading">
        <div>
          <p>{i18nT('匿名聚合 · 不显示任何个人答案')}</p>
          <h2 id={`stats-${perspectiveKey}`}>{i18nT(perspective.label)}</h2>
        </div>
        <strong>{stats.total || 0}<span> {i18nT('份')}</span></strong>
      </div>
      <StatList items={stats.priority_stats || []} />
      <StatList items={stats.veto_stats || []} veto />
    </section>
  )
}

export default function DatingPriorityStatsPage({ onBack, onOpenSurvey }) {
  const [statsByPerspective, setStatsByPerspective] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)

  const loadStats = useCallback(async ({ background = false } = {}) => {
    if (background) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const results = await Promise.all(
        PERSPECTIVE_KEYS.map((key) => fetchDatingPriorityStats(key)),
      )
      setStatsByPerspective(Object.fromEntries(
        PERSPECTIVE_KEYS.map((key, index) => [key, results[index]]),
      ))
      setUpdatedAt(new Date())
    } catch (loadError) {
      const message = typeof loadError?.message === 'string'
        && loadError.message
        && loadError.message !== '[object Object]'
        ? loadError.message
        : i18nT('统计结果加载失败')
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
    const refreshTimer = window.setInterval(() => loadStats({ background: true }), AUTO_REFRESH_MS)
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadStats({ background: true })
    }
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      window.clearInterval(refreshTimer)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [loadStats])

  const isEnglish = getRuntimeLang() === 'en'
  const locale = isEnglish ? 'en-US' : 'zh-CN'
  const total = statsByPerspective
    ? PERSPECTIVE_KEYS.reduce((sum, key) => sum + Number(statsByPerspective[key]?.total || 0), 0)
    : 0

  return (
    <main className="dating-priority-page dp-summary-page">
      <header className="dp-header">
        <BackButton onClick={onBack} />
        <div className="dp-header-copy">
          <p className="dp-eyebrow">{i18nT('实时汇总')}</p>
          <h1>{i18nT('长期伴侣选择优先级统计')}</h1>
        </div>
      </header>

      <div className="dp-shell">
        <section className="dp-summary-hero">
          <div>
            <p>{i18nT('AMOR SURVEY SUMMARY')}</p>
            <h2>{i18nT('当前最新统计结果')}</h2>
            <span>{i18nT('两个答题视角分别统计；页面每 30 秒自动刷新。')}</span>
          </div>
          <strong>{total}<small>{i18nT('份匿名回答')}</small></strong>
        </section>

        <div className="dp-summary-toolbar" aria-live="polite">
          <span>
            {updatedAt
              ? i18nT('更新时间：{time}', { time: updatedAt.toLocaleString(locale) })
              : i18nT('正在获取最新数据…')}
          </span>
          <div>
            <button type="button" className="dp-button dp-button-secondary" onClick={onOpenSurvey}>
              {i18nT('填写问卷')}
            </button>
            <button
              type="button"
              className="dp-button dp-button-primary"
              disabled={loading || refreshing}
              onClick={() => loadStats({ background: true })}
            >
              {isEnglish
                ? (refreshing ? 'Refreshing…' : 'Refresh now')
                : (refreshing ? '刷新中…' : '立即刷新')}
            </button>
          </div>
        </div>

        {loading && !statsByPerspective && (
          <div className="dp-summary-status" role="status">{i18nT('正在获取最新统计结果…')}</div>
        )}

        {error && (
          <div className="dp-submit-error dp-summary-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => loadStats()}>{i18nT('重试')}</button>
          </div>
        )}

        {statsByPerspective && PERSPECTIVE_KEYS.map((key) => (
          <PerspectiveStats key={key} perspectiveKey={key} stats={statsByPerspective[key] || {}} />
        ))}

        {statsByPerspective && (
          <p className="dp-stats-privacy dp-summary-privacy">
            {i18nT('统计仅包含匿名聚合结果；不会显示或返回浏览器匿名标识。')}
          </p>
        )}
      </div>
    </main>
  )
}
