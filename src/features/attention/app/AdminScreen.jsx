import React, { useEffect, useState } from 'react'
import { attentionApi } from '../../../api'
import { ATTENTION_RELEASE_CHECKLIST } from '../lib/integration/release-checklist'

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

  useEffect(() => {
    let cancelled = false
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
      if (!cancelled) setError(err?.status === 403 ? '此页仅限管理员访问。' : (err?.message || '暂时无法加载守心运营后台。'))
    })
    return () => { cancelled = true }
  }, [token])

  const metrics = overview?.metrics || {}
  const health = overview?.health || {}
  const checks = audit?.checks || []

  return (
    <main className="attn-page">
      <header className="attn-header compact">
        <button className="attn-ghost" type="button" onClick={onBack}>返回守心首页</button>
        <h1>守心运营后台</h1>
        <p>只显示脱敏聚合数据和系统健康状态，不展示用户祷告、复盘、账本备注、代祷正文或敏感属灵内容。</p>
      </header>

      {error ? <div className="attn-alert">{error}</div> : null}
      {!overview && !error ? <div className="attn-loading">正在加载运营聚合状态…</div> : null}

      {overview ? (
        <>
          <section className="attn-section">
            <h2>7 天聚合指标</h2>
            <div className="attn-admin-grid">
              <MetricCard label="活跃守心用户" value={metrics.activeAttentionUsers7d} />
              <MetricCard label="每日立约" value={metrics.dailyCovenants7d} />
              <MetricCard label="专注段落" value={metrics.focusSessions7d} />
              <MetricCard label="账本记录" value={metrics.ledgerEntries7d} />
              <MetricCard label="晚间复盘" value={metrics.reviews7d} />
              <MetricCard label="AI 洞察" value={metrics.diagnoses7d} />
              <MetricCard label="活跃小组" value={metrics.groupsActive} />
              <MetricCard label="开放代祷数" value={metrics.prayerRequestsOpen} />
              <MetricCard label="危机安全触发" value={metrics.crisisSafetyTriggers7d} />
            </div>
          </section>

          <section className="attn-grid">
            <article className="attn-section">
              <h2>模块健康</h2>
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
              <h2>内容库摘要</h2>
              <div className="attn-list">
                <div className="attn-list-item"><strong>经文库</strong><span>{library?.scriptureCount || 0} 条</span></div>
                <div className="attn-list-item"><strong>争战模式</strong><span>{library?.warfarePatternCount || 0} 个</span></div>
                <div className="attn-list-item"><strong>挑战模板</strong><span>{library?.challengeTemplateCount || 0} 个</span></div>
                <div className="attn-list-item"><strong>评分规则</strong><span>{library?.scoreRuleVersion || 'v1'}</span></div>
              </div>
            </article>
          </section>

          <section className="attn-grid">
            <article className="attn-section">
              <h2>安全审计摘要</h2>
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
              <h2>发布前 Checklist</h2>
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
