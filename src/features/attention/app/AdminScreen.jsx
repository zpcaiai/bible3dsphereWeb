import React, { useEffect, useState } from 'react'
import { attentionApi } from '../../../api'
import { ATTENTION_RELEASE_CHECKLIST } from '../lib/integration/release-checklist'
import { t as i18nT } from '../../../i18n/runtime'

function MetricCard({ label, value }) {
  return (
    <div className="attn-admin-metric">
      <strong>{value ?? 0}</strong>
      <span>{label}</span>
    </div>
  )
}

export default function AdminScreen({ token, onBack }) {
  const [overview, setOverview] = useState(null)
  const [audit, setAudit] = useState(null)
  const [library, setLibrary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  function load() {
    let cancelled = false
    setLoading(true)
    setError('')
    Promise.all([
      attentionApi.adminOverview(token),
      attentionApi.adminAudit(token),
      attentionApi.adminContentLibrary(token),
    ]).then(([overviewData, auditData, libraryData]) => {
      if (cancelled) return
      setOverview(overviewData)
      setAudit(auditData)
      setLibrary(libraryData.contentLibrary || libraryData)
    }).catch((err) => {
      if (!cancelled) setError(err?.status === 403 ? i18nT('此页仅限管理员访问。') : (err?.message || i18nT('暂时无法加载守心运营后台。')))
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }

  useEffect(() => {
    const cancel = load()
    return cancel
  }, [token])

  const metrics = overview?.metrics || {}
  const health = overview?.health || {}
  const checks = audit?.checks || []

  return (
    <main className="attn-page">
      <header className="attn-header compact">
        <button className="attn-ghost" type="button" onClick={onBack}>{i18nT("返回守心首页")}</button>
        <h1>{i18nT("守心运营后台")}</h1>
        <p>{i18nT("只显示脱敏聚合数据和系统健康状态，不展示用户祷告、复盘、账本备注、代祷正文或敏感属灵内容。")}</p>
      </header>

      {error ? <div className="attn-alert" role="alert">{error}{!overview && !loading ? <button type="button" onClick={load}>{i18nT("重试")}</button> : null}</div> : null}
      {loading ? <div className="attn-loading">{i18nT("正在加载运营聚合状态…")}</div> : null}

      {overview ? (
        <>
          <section className="attn-section">
            <h2>{i18nT("7 天聚合指标")}</h2>
            <div className="attn-admin-grid">
              <MetricCard label={i18nT("活跃守心用户")} value={metrics.activeAttentionUsers7d} />
              <MetricCard label={i18nT("每日立约")} value={metrics.dailyCovenants7d} />
              <MetricCard label={i18nT("专注段落")} value={metrics.focusSessions7d} />
              <MetricCard label={i18nT("账本记录")} value={metrics.ledgerEntries7d} />
              <MetricCard label={i18nT("晚间复盘")} value={metrics.reviews7d} />
              <MetricCard label={i18nT("AI 洞察")} value={metrics.diagnoses7d} />
              <MetricCard label={i18nT("活跃守心计划")} value={metrics.warfarePlansActive} />
              <MetricCard label={i18nT("已生成周报")} value={metrics.weeklyReportsGenerated7d} />
              <MetricCard label={i18nT("活跃小组")} value={metrics.groupsActive} />
              <MetricCard label={i18nT("活跃挑战")} value={metrics.challengesActive} />
              <MetricCard label={i18nT("开放代祷数")} value={metrics.prayerRequestsOpen} />
              <MetricCard label={i18nT("危机安全触发")} value={metrics.crisisSafetyTriggers7d} />
            </div>
          </section>

          <section className="attn-grid">
            <article className="attn-section">
              <h2>{i18nT("模块健康")}</h2>
              <div className="attn-list">
                {Object.entries(health.checks || {}).map(([key, value]) => (
                  <div className="attn-list-item" key={key}>
                    <strong>{key}</strong>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="attn-section">
              <h2>{i18nT("内容库摘要")}</h2>
              <div className="attn-list">
                <div className="attn-list-item"><strong>{i18nT("经文库")}</strong><span>{library?.scriptureCount || 0} {i18nT("条")}</span></div>
                <div className="attn-list-item"><strong>{i18nT("争战模式")}</strong><span>{library?.warfarePatternCount || 0} {i18nT("个")}</span></div>
                <div className="attn-list-item"><strong>{i18nT("挑战模板")}</strong><span>{library?.challengeTemplateCount || 0} {i18nT("个")}</span></div>
                <div className="attn-list-item"><strong>{i18nT("评分规则")}</strong><span>{library?.scoreRuleVersion || 'v1'}</span></div>
              </div>
            </article>

            <article className="attn-section">
              <h2>{i18nT("功能开关")}</h2>
              <div className="attn-list">
                {Object.entries(overview.featureFlags || {}).map(([key, value]) => (
                  <div className="attn-list-item" key={key}><strong>{key}</strong><span>{value ? i18nT('启用') : i18nT('关闭')}</span></div>
                ))}
              </div>
            </article>
          </section>

          <section className="attn-grid">
            <article className="attn-section">
              <h2>{i18nT("注意力分类分布")}</h2>
              <div className="attn-list">
                {Object.entries(overview.categoryDistribution || {}).map(([key, value]) => <div className="attn-list-item" key={key}><strong>{key}</strong><span>{value} {i18nT("分钟")}</span></div>)}
              </div>
            </article>
            <article className="attn-section">
              <h2>{i18nT("聚合牵引")}</h2>
              <div className="attn-list">
                {(overview.topPullsAggregate || []).map((item) => <div className="attn-list-item" key={item.pull}><strong>{item.label}</strong><span>{item.count} {i18nT("次")}</span></div>)}
              </div>
            </article>
          </section>

          <section className="attn-grid">
            <article className="attn-section">
              <h2>{i18nT("安全审计摘要")}</h2>
              <div className="attn-list">
                {checks.map((item) => (
                  <div className="attn-list-item" key={item.key}>
                    <strong>{item.key}</strong>
                    <span>{item.status.toUpperCase()} · {item.message}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="attn-section">
              <h2>{i18nT("发布前 Checklist")}</h2>
              <div className="attn-list">
                {ATTENTION_RELEASE_CHECKLIST.map((item) => (
                  <div className="attn-list-item" key={item}>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </>
      ) : null}
    </main>
  )
}
