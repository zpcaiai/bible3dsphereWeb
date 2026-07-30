import { useMemo, useState } from 'react'
import BackButton from './BackButton'
import {
  DATING_PRIORITY_PERSPECTIVES,
  getDatingPriorityItems,
  getDatingVetoItems,
} from './datingPriorityData'
import { submitAnonymousDatingPriority } from './api'
import './DatingPriorityPage.css'

const MAX_SELECTIONS = 10
const STORAGE_KEY = 'dating-priority-survey:last'
const ANONYMOUS_ID_KEY = 'dating-priority-survey:anonymous-id'

function getOrCreateAnonymousSurveyId() {
  try {
    const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY)
    if (existing) return existing
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? `survey-${crypto.randomUUID()}`
      : `survey-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
    window.localStorage.setItem(ANONYMOUS_ID_KEY, id)
    return id
  } catch {
    return `survey-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
  }
}

// 用户不再手动配分：权重直接由点选顺序推导，第 1 位最重、依次递减。
// 后端要求所选项分数合计恰好等于 100，所以用最大余数法取整，
// 避免四舍五入后总和变成 99 或 101 而被拒收。
export function rankWeightedPoints(ids) {
  const count = ids.length
  if (count === 0) return {}
  const weights = ids.map((_, index) => count - index)
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0)
  const exact = weights.map((weight) => (weight * 100) / weightSum)
  const points = exact.map((value) => Math.floor(value))
  const byLargestRemainder = exact
    .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)
  let leftover = 100 - points.reduce((sum, value) => sum + value, 0)
  for (let i = 0; leftover > 0; i += 1, leftover -= 1) {
    points[byLargestRemainder[i % count].index] += 1
  }
  return Object.fromEntries(ids.map((id, index) => [id, points[index]]))
}
function buildDatingPriorityResult({
  perspectiveKey,
  selectedIds,
  selectedVetoIds,
  scores,
  items,
  vetoItems,
}) {
  const perspective = DATING_PRIORITY_PERSPECTIVES[perspectiveKey]
  const byId = new Map(items.map((item) => [item.id, item]))
  const vetoById = new Map(vetoItems.map((item) => [item.id, item]))
  return {
    version: 3,
    submittedAt: new Date().toISOString(),
    perspective: perspectiveKey,
    perspectiveLabel: perspective?.label || '',
    selected: selectedIds.map((id, index) => {
      const item = byId.get(id)
      return {
        rank: index + 1,
        category: item?.categoryLabel || '',
        label: item?.label || '',
        description: item?.description || '',
        score: Number(scores[id] || 0),
      }
    }),
    vetoes: selectedVetoIds.map((id) => {
      const item = vetoById.get(id)
      return {
        suppliedRank: item?.rank || 0,
        label: item?.label || '',
        strength: item?.strength || '',
      }
    }),
    totalScore: selectedIds.reduce((sum, id) => sum + Number(scores[id] || 0), 0),
  }
}

export default function DatingPriorityPage({ onBack, onSubmit }) {
  const [perspectiveKey, setPerspectiveKey] = useState('')
  const [stage, setStage] = useState('select')
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedVetoIds, setSelectedVetoIds] = useState([])
  const [result, setResult] = useState(null)
  const [stats, setStats] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [notice, setNotice] = useState('')

  const perspective = DATING_PRIORITY_PERSPECTIVES[perspectiveKey]
  const items = useMemo(() => getDatingPriorityItems(perspectiveKey), [perspectiveKey])
  const vetoItems = useMemo(() => getDatingVetoItems(perspectiveKey), [perspectiveKey])
  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])

  const choosePerspective = (key) => {
    setPerspectiveKey(key)
    setStage('select')
    setSelectedIds([])
    setSelectedVetoIds([])
    setResult(null)
    setStats(null)
    setSubmitError('')
    setNotice('')
  }

  const toggleItem = (id) => {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        setNotice('')
        return current.filter((selectedId) => selectedId !== id)
      }
      if (current.length >= MAX_SELECTIONS) {
        setNotice('最多选择 10 项。如需更换，请先反选一项。')
        return current
      }
      setNotice('')
      return [...current, id]
    })
  }

  const clearSelection = () => {
    setSelectedIds([])
    setNotice('')
  }

  const toggleVeto = (id) => {
    setSelectedVetoIds((current) => (
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    ))
  }

  const submitResult = async (nextResult) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextResult))
    } catch {
      // Private browsing or storage limits should not block completion.
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      const response = await submitAnonymousDatingPriority(
        getOrCreateAnonymousSurveyId(),
        nextResult,
      )
      setStats(response.stats || null)
      setResult(nextResult)
      setStage('complete')
      try {
        onSubmit?.(nextResult, response.stats || null)
      } catch {
        // Consumer callbacks must not turn a successful anonymous submission into an error.
      }
      window.scrollTo?.({ top: 0, behavior: 'smooth' })
    } catch (error) {
      setSubmitError(error?.message || '匿名提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const submitSelection = () => {
    setNotice('')
    submitResult(buildDatingPriorityResult({
      perspectiveKey,
      selectedIds,
      selectedVetoIds,
      scores: rankWeightedPoints(selectedIds),
      items,
      vetoItems,
    }))
  }

  const restart = () => {
    setPerspectiveKey('')
    setStage('select')
    setSelectedIds([])
    setSelectedVetoIds([])
    setResult(null)
    setStats(null)
    setSubmitError('')
    setNotice('')
  }

  const backFromHeader = () => {
    if (stage === 'complete') {
      setStage('select')
      return
    }
    if (perspectiveKey) {
      setPerspectiveKey('')
      setSelectedIds([])
      setSelectedVetoIds([])
      setStats(null)
      setSubmitError('')
      setNotice('')
      return
    }
    onBack?.()
  }

  const headerStep = !perspectiveKey
    ? '开始'
    : stage === 'select'
      ? '选择与排序'
      : '完成'

  return (
    <main className="dating-priority-page">
      <header className="dp-header">
        <BackButton onClick={backFromHeader} />
        <div className="dp-header-copy">
          <p className="dp-eyebrow">{headerStep}</p>
          <h1>长期伴侣选择优先级</h1>
        </div>
      </header>

      <div className="dp-shell">
        {!perspectiveKey && (
          <>
            <section className="dp-intro">
              <div>
                <h2>认真辨认，什么对你真正重要</h2>
                <p>
                  假设你正在选择一位可能结婚并长期共同生活的伴侣，请根据真实的结婚决策作答，
                  而不是社会普遍认为“应该重视”的因素。你可以选择 0–10 项，点选顺序就是优先级。
                </p>
              </div>
              <div className="dp-intro-mark" aria-hidden="true">∞</div>
            </section>

            <section aria-labelledby="perspective-title">
              <div className="dp-section-heading">
                <h2 id="perspective-title">选择答题视角</h2>
              </div>
              <div className="dp-perspective-grid">
                {Object.entries(DATING_PRIORITY_PERSPECTIVES).map(([key, option]) => {
                  const count = getDatingPriorityItems(key).length
                  return (
                    <button
                      key={key}
                      type="button"
                      className="dp-perspective-card"
                      onClick={() => choosePerspective(key)}
                    >
                      <span className="dp-perspective-icon" aria-hidden="true">{option.icon}</span>
                      <span>
                        <strong>{option.shortLabel}</strong>
                        <small>{option.label} · 共 {count} 个备选因素</small>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          </>
        )}

        {perspectiveKey && stage === 'select' && (
          <>
            <section className="dp-intro">
              <div>
                <h2>选出最重视的 10 项，并按重要性排序</h2>
                <p>
                  每次点选会依次成为第 1、第 2……优先级，权重按这个顺序自动计算，你不需要手动配分。
                  再次点击即可反选，后续项目会自动前移。你也可以一项都不选，或在提交前清空全部选择。
                </p>
              </div>
              <div className="dp-intro-mark" aria-hidden="true">{perspective.icon}</div>
            </section>

            <div className="dp-toolbar" aria-live="polite">
              <div className="dp-toolbar-copy">
                <strong>{perspective.shortLabel}</strong>
                <span>顺序代表优先级 · 最多 10 项</span>
              </div>
              <div className="dp-counter">已选 {selectedIds.length} / {MAX_SELECTIONS}</div>
            </div>

            <section className="dp-selection-panel" aria-labelledby="selected-heading">
              <div className="dp-section-heading">
                <h2 id="selected-heading">当前优先级</h2>
                <button
                  type="button"
                  className="dp-text-button"
                  onClick={clearSelection}
                  disabled={selectedIds.length === 0}
                >
                  全部反选
                </button>
              </div>
              {selectedIds.length === 0 ? (
                <p className="dp-empty-selection">尚未选择。0 项也是有效答案，你可以直接提交。</p>
              ) : (
                <ol className="dp-rank-list">
                  {selectedIds.map((id, index) => {
                    const item = itemById.get(id)
                    return (
                      <li className="dp-rank-item" key={id}>
                        <span className="dp-rank-number">{index + 1}</span>
                        <span className="dp-rank-label">{item?.label}</span>
                        <button
                          type="button"
                          className="dp-rank-remove"
                          aria-label={`反选${item?.label}`}
                          onClick={() => toggleItem(id)}
                        >
                          ×
                        </button>
                      </li>
                    )
                  })}
                </ol>
              )}
            </section>

            {notice && <div className="dp-notice" role="status">{notice}</div>}

            {perspective.categories.map((category) => {
              const categoryItems = items.filter((item) => item.categoryKey === category.key)
              return (
                <section className="dp-category" key={category.key} aria-labelledby={`category-${category.key}`}>
                  <h2 className="dp-category-title" id={`category-${category.key}`}>
                    <span aria-hidden="true">{category.icon}</span>
                    {category.label}
                    <span>{categoryItems.length} 项</span>
                  </h2>
                  <div className="dp-options-grid">
                    {categoryItems.map((item) => {
                      const rank = selectedIds.indexOf(item.id)
                      const selected = rank >= 0
                      const limitDisabled = !selected && selectedIds.length >= MAX_SELECTIONS
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-testid="priority-option"
                          className={`dp-option${selected ? ' is-selected' : ''}${limitDisabled ? ' is-limit-disabled' : ''}`}
                          aria-pressed={selected}
                          aria-disabled={limitDisabled}
                          onClick={() => toggleItem(item.id)}
                        >
                          <span className="dp-option-check" aria-hidden="true">✓</span>
                          <span className="dp-option-copy">
                            <strong>{item.label}</strong>
                            {item.description && <small>{item.description}</small>}
                          </span>
                          {selected && <span className="dp-option-rank">#{rank + 1}</span>}
                        </button>
                      )
                    })}
                  </div>
                </section>
              )
            })}

            <section className="dp-veto-section" aria-labelledby="veto-heading">
              <div className="dp-section-heading">
                <div>
                  <p className="dp-veto-eyebrow">独立多选 · 不占用前面的 10 项名额</p>
                  <h2 id="veto-heading">哪些情况会成为你的否决条件？</h2>
                </div>
                <button
                  type="button"
                  className="dp-text-button dp-veto-clear"
                  onClick={() => setSelectedVetoIds([])}
                  disabled={selectedVetoIds.length === 0}
                >
                  清空否决条件
                </button>
              </div>
              <p className="dp-veto-help">
                以下顺序仅用于呈现，不会改变你的优先级排序。请选择所有适用于你的条件，也可以一项不选。
              </p>
              <div className="dp-veto-count" aria-live="polite">
                已选 {selectedVetoIds.length} / {vetoItems.length}
              </div>
              <div className="dp-veto-grid">
                {vetoItems.map((item) => {
                  const selected = selectedVetoIds.includes(item.id)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-testid="veto-option"
                      className={`dp-veto-option${selected ? ' is-selected' : ''}`}
                      aria-pressed={selected}
                      onClick={() => toggleVeto(item.id)}
                    >
                      <span className="dp-veto-rank">{item.rank}</span>
                      <span className="dp-veto-copy">
                        <strong>{item.label}</strong>
                      </span>
                      <span className="dp-veto-check" aria-hidden="true">✓</span>
                    </button>
                  )
                })}
              </div>
            </section>

            <div className="dp-actions">
              <button
                type="button"
                className="dp-button dp-button-secondary"
                disabled={submitting}
                onClick={() => {
                  clearSelection()
                  setSelectedVetoIds([])
                }}
              >
                清空全部选择
              </button>
              <button
                type="button"
                className="dp-button dp-button-primary"
                disabled={submitting}
                onClick={submitSelection}
              >
                {submitting ? '正在匿名提交…' : '匿名提交并查看统计'}
              </button>
            </div>
            {submitError && <div className="dp-submit-error" role="alert">{submitError}</div>}
          </>
        )}

        {perspectiveKey && stage === 'complete' && result && (
          <section className="dp-complete" aria-labelledby="complete-heading">
            <div className="dp-complete-icon" aria-hidden="true">✓</div>
            <h2 id="complete-heading">问卷已完成</h2>
            <p>
              你的回答已保存在当前浏览器中。
              {result.selected.length === 0
                ? '你没有选择优先因素，这仍是一份完整且有效的回答。'
                : `你选择了 ${result.selected.length} 项，权重已按你的点选顺序自动计算。`}
              {result.vetoes.length > 0
                ? ` 同时选择了 ${result.vetoes.length} 项否决条件。`
                : ' 你没有选择否决条件。'}
            </p>

            {result.selected.length > 0 && (
              <ol className="dp-result-list">
                {result.selected.map((item) => (
                  <li className="dp-result-row" key={`${item.rank}-${item.label}`}>
                    <span className="dp-rank-number">{item.rank}</span>
                    <strong>{item.label}</strong>
                    <span className="dp-result-score">权重 {item.score}</span>
                  </li>
                ))}
              </ol>
            )}

            {result.vetoes.length > 0 && (
              <div className="dp-result-vetoes">
                <h3>已选择的否决条件</h3>
                <ol className="dp-veto-result-list">
                  {result.vetoes.map((item) => (
                    <li key={`${item.suppliedRank}-${item.label}`}>
                      <span>{item.suppliedRank}</span>
                      <strong>{item.label}</strong>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {stats && (
              <section className="dp-current-stats" aria-labelledby="current-stats-heading">
                <div className="dp-stats-heading">
                  <div>
                    <p>匿名聚合 · 不显示任何个人答案</p>
                    <h3 id="current-stats-heading">当前统计结果</h3>
                  </div>
                  <strong>{stats.total || 0}<span> 份</span></strong>
                </div>

                {(stats.priority_stats || []).length > 0 ? (
                  <div className="dp-stats-group">
                    <h4>最常被选入前 10 项</h4>
                    <ol className="dp-stats-list">
                      {stats.priority_stats.slice(0, 10).map((item, index) => (
                        <li key={`${item.category}-${item.label}`}>
                          <span className="dp-stat-rank">{index + 1}</span>
                          <div className="dp-stat-main">
                            <div>
                              <strong>{item.label}</strong>
                              <span>{item.selection_rate}% 选择 · 平均第 {item.avg_rank} 位 · 平均权重 {item.avg_score}</span>
                            </div>
                            <div className="dp-stat-bar" aria-hidden="true">
                              <i style={{ width: `${Math.min(100, item.selection_rate)}%` }} />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : (
                  <p className="dp-stats-empty">当前还没有优先因素统计。</p>
                )}

                {(stats.veto_stats || []).length > 0 && (
                  <div className="dp-stats-group dp-stats-veto-group">
                    <h4>最常选择的否决条件</h4>
                    <ol className="dp-stats-list">
                      {stats.veto_stats.slice(0, 12).map((item, index) => (
                        <li key={item.label}>
                          <span className="dp-stat-rank">{index + 1}</span>
                          <div className="dp-stat-main">
                            <div>
                              <strong>{item.label}</strong>
                              <span>{item.selection_rate}% 选择</span>
                            </div>
                            <div className="dp-stat-bar dp-stat-veto-bar" aria-hidden="true">
                              <i style={{ width: `${Math.min(100, item.selection_rate)}%` }} />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <p className="dp-stats-privacy">
                  统计仅包含同一答题视角下的匿名聚合结果；不会显示或返回浏览器匿名标识。
                </p>
              </section>
            )}

            <div className="dp-actions">
              <button type="button" className="dp-button dp-button-secondary" onClick={restart}>
                重新填写
              </button>
              <button type="button" className="dp-button dp-button-primary" onClick={() => onBack?.()}>
                完成并返回
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
