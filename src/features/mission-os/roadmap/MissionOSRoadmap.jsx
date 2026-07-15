import { useCallback, useEffect, useMemo, useState } from 'react'
import { t } from '../../../i18n/runtime'
import { getMissionRoadmap } from '../api/missionApi'

const ORG_STORE_KEY = 'mission-os-selected-org'

const STATUS_META = {
  complete: { label: '已完成', icon: '✓' },
  active: { label: '进行中', icon: '→' },
  blocked: { label: '需处理', icon: '!' },
  upcoming: { label: '未开始', icon: '·' },
}

const DETAIL_LABELS = {
  active_discernment: '辨识中', ready_for_readiness_assessment: '可进入准备度评估', completed: '已完成',
  self_assessment: '自我评估', evidence_collection: '收集证据', mentor_review: '导师评审', church_review: '教会评审', panel_review: '小组评审',
  deployment_candidate: '部署候选', team_discernment_ready: '可进入团队辨识', pause_and_restore: '暂停与恢复',
  draft: '草稿', active: '进行中', approved: '已批准', committee_ready: '待委员会评审',
  approved_for_next_stage: '批准进入下一阶段', conditionally_approved: '有条件批准', revision_required: '需要修订', declined_current_application: '本次申请未通过',
  provisional: '暂定成员', probation: '考察期', research: '研究中', professional_review: '专业评审',
  cleared_for_next_stage: '合规放行', underfunded: '资金不足', blocked: '已阻塞',
  ready_for_deployment_planning: '可进入部署规划', review_required: '需要人工复核',
}

function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.upcoming
}

function readableDetail(detail) {
  if (!detail) return ''
  return DETAIL_LABELS[detail] || detail
}

function RoadmapSkeleton() {
  return (
    <div className="mission-roadmap-skeleton" aria-label={t('正在加载宣教旅程')}>
      <div className="mission-roadmap-skeleton-hero" />
      <div className="mission-roadmap-skeleton-track" />
      <div className="mission-roadmap-skeleton-grid"><span /><span /></div>
    </div>
  )
}

function RoadmapState({ title, description, actionLabel, onAction }) {
  return (
    <div className="mission-roadmap-state">
      <span className="mission-roadmap-state-mark" aria-hidden="true">⌁</span>
      <h2>{t(title)}</h2>
      <p>{t(description)}</p>
      {onAction ? <button className="mission-roadmap-primary" onClick={onAction}>{t(actionLabel)}</button> : null}
    </div>
  )
}

function StageTrack({ stages, selectedKey, onSelect }) {
  return (
    <nav className="mission-roadmap-track" aria-label={t('宣教旅程阶段')}>
      {stages.map((stage, index) => {
        const meta = statusMeta(stage.status)
        return (
          <button
            key={stage.key}
            className={`mission-roadmap-node is-${stage.status} ${selectedKey === stage.key ? 'is-selected' : ''}`}
            onClick={() => onSelect(stage.key)}
            aria-current={selectedKey === stage.key ? 'step' : undefined}
            aria-label={`${stage.number}. ${t(stage.title)}，${t(meta.label)}`}
          >
            <span className="mission-roadmap-node-index">{stage.status === 'complete' ? '✓' : stage.number}</span>
            <span className="mission-roadmap-node-copy">
              <strong>{t(stage.title)}</strong>
              <small>{t(meta.label)}</small>
            </span>
            {index < stages.length - 1 ? <span className="mission-roadmap-node-line" aria-hidden="true" /> : null}
          </button>
        )
      })}
    </nav>
  )
}

function StageDetail({ stage, onOpenWorkspace }) {
  const meta = statusMeta(stage.status)
  return (
    <article className={`mission-roadmap-detail is-${stage.status}`}>
      <header className="mission-roadmap-detail-header">
        <div>
          <span className="mission-roadmap-kicker">{t(`第 ${stage.number} 站`)}</span>
          <h2>{t(stage.title)}</h2>
          <p className="mission-roadmap-eyebrow">{t(stage.eyebrow)}</p>
        </div>
        <span className={`mission-roadmap-status is-${stage.status}`}><i>{meta.icon}</i>{t(meta.label)}</span>
      </header>
      <p className="mission-roadmap-description">{t(stage.description)}</p>

      <div
        className="mission-roadmap-stage-progress"
        role="progressbar"
        aria-label={t('阶段进度')}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={stage.progress}
      >
        <span style={{ width: `${stage.progress}%` }} />
      </div>

      <div className="mission-roadmap-checklist">
        {stage.items.map((item) => {
          const itemMeta = statusMeta(item.status)
          return (
            <div className={`mission-roadmap-check is-${item.status}`} key={item.key}>
              <span className="mission-roadmap-check-icon" aria-hidden="true">{itemMeta.icon}</span>
              <span className="mission-roadmap-check-copy">
                <strong>{t(item.label)}</strong>
                <small>{t(itemMeta.label)}{item.optional ? ` · ${t('按情况')}` : ''}</small>
              </span>
              {item.detail ? <span className="mission-roadmap-check-detail">{t(readableDetail(item.detail))}</span> : null}
            </div>
          )
        })}
      </div>

      <footer className="mission-roadmap-detail-footer">
        <p><span aria-hidden="true">◉</span>{t('进度来自真实记录，安全与差派 Gate 不能手动跳过。')}</p>
        <button className="mission-roadmap-primary" onClick={() => onOpenWorkspace(stage.workspacePanel)}>
          {t(stage.actionLabel)} <span aria-hidden="true">→</span>
        </button>
      </footer>
    </article>
  )
}

export default function MissionOSRoadmap({ token, organizationId, onOpenWorkspace = () => {} }) {
  const org = useMemo(() => {
    if (organizationId) return organizationId
    try { return localStorage.getItem(ORG_STORE_KEY) || '' } catch { return '' }
  }, [organizationId])
  const [roadmap, setRoadmap] = useState(null)
  const [selectedKey, setSelectedKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!token || !org) return
    setLoading(true); setError('')
    try {
      const result = await getMissionRoadmap(token, org)
      const next = result.roadmap
      setRoadmap(next)
      setSelectedKey((current) => next.stages.some((stage) => stage.key === current) ? current : next.summary.currentStageKey)
    } catch (err) {
      setError(err.detail || err.message || t('路线图暂时不可用'))
    } finally {
      setLoading(false)
    }
  }, [token, org])

  useEffect(() => { load() }, [load])

  if (!token) {
    return <RoadmapState title="先登录，再开始这段旅程" description="你的呼召反思、教会反馈与准备记录只会在登录后按权限读取。" />
  }
  if (!org) {
    return <RoadmapState title="先选择所属组织" description="宣教旅程按教会、差会或团队隔离。请先在工作台选择组织上下文。" actionLabel="前往工作台选择" onAction={() => onOpenWorkspace('calling')} />
  }
  if (loading && !roadmap) return <RoadmapSkeleton />
  if (error && !roadmap) {
    return <RoadmapState title="暂时无法读取路线图" description={error} actionLabel="重新加载" onAction={load} />
  }
  if (!roadmap) return null

  const selected = roadmap.stages.find((stage) => stage.key === selectedKey) || roadmap.stages[0]
  const current = roadmap.stages.find((stage) => stage.key === roadmap.summary.currentStageKey) || roadmap.stages[0]
  return (
    <section className="mission-roadmap" aria-labelledby="mission-roadmap-title">
      <header className="mission-roadmap-hero">
        <div className="mission-roadmap-hero-copy">
          <span className="mission-roadmap-overline">MISSION JOURNEY</span>
          <h1 id="mission-roadmap-title">{t('我的宣教旅程')}</h1>
          <p>{t('不是一张催促你出发的清单，而是一条由祷告、群体辨识、真实证据与持续关怀共同铺成的路。')}</p>
          <div className="mission-roadmap-current">
            <span>{t(roadmap.hasJourney ? '当前阶段' : '建议从这里开始')}</span>
            <strong>{t(current.title)}</strong>
            {roadmap.summary.blockedItems > 0 ? <em>{roadmap.summary.blockedItems} {t('项需要处理')}</em> : null}
          </div>
        </div>
        <div
          className="mission-roadmap-score"
          style={{ '--roadmap-progress': `${roadmap.summary.progress * 3.6}deg` }}
          role="progressbar"
          aria-label={t('宣教旅程证据进度')}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={roadmap.summary.progress}
        >
          <div><strong>{roadmap.summary.progress}%</strong><span>{t('旅程证据')}</span></div>
          <small>{roadmap.summary.completedItems}/{roadmap.summary.totalItems} {t('个关键项')}</small>
        </div>
      </header>

      {error ? (
        <div className="mission-roadmap-inline-error" role="status">
          <span>{error}</span><button onClick={load}>{t('重试')}</button>
        </div>
      ) : null}

      <StageTrack stages={roadmap.stages} selectedKey={selected.key} onSelect={setSelectedKey} />

      <div className="mission-roadmap-content">
        <StageDetail stage={selected} onOpenWorkspace={onOpenWorkspace} />
        <aside className="mission-roadmap-guardrails">
          <span className="mission-roadmap-guardrail-icon" aria-hidden="true">✦</span>
          <h2>{t('这条路如何保护人')}</h2>
          <ul>
            {roadmap.principles.map((principle) => <li key={principle}>{t(principle)}</li>)}
          </ul>
          <div className="mission-roadmap-legend" aria-label={t('状态说明')}>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <span key={key} className={`is-${key}`}><i>{meta.icon}</i>{t(meta.label)}</span>
            ))}
          </div>
          <button className="mission-roadmap-refresh" onClick={load} disabled={loading}>
            {loading ? t('同步中…') : t('同步最新记录')}
          </button>
        </aside>
      </div>
    </section>
  )
}
