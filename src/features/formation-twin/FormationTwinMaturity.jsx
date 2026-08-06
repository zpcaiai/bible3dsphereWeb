import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import {
  createGrowthRoute,
  eraseMaturityData,
  getConsentScopes,
  getDisplayContract,
  getGrowthRoute,
  getNextAssessmentItem,
  getPilotCapabilities,
  getProfile,
  grantConsent,
  isRenderableStage,
  runTriage,
  scoreAssessment,
  submitAssessmentIntake,
  submitAssessmentResponse,
  withdrawConsent,
} from './emotionalMaturityApi'

/**
 * 情感成熟度诊断域（EMD-OS）的展示层。
 *
 * 这一屏最容易出错的地方不是取不到数据，而是把「当前一段时间的表现」画成「我这个人的等级」。
 * 所以标签、免责声明、置信度词表全部来自后端的 /display-contract，前端不另写一份——
 * 契约变了这里立刻跟上，前端也无法擅自造出分数感。禁用图形（进度条、仪表盘、雷达图、
 * 排行榜、百分位徽章）在契约里有名字，下面一个都不用。
 *
 * 安全优先于展示：分流一旦判定需要危机路由，本区块停止一切评估内容，只留安全入口。
 */

const CONSENT_COPY = {
  EMD_SELF_ASSESSMENT: '进行一次性的私人情感成熟度自评',
  EMD_BEHAVIOR_EVIDENCE: '记录并使用最近真实行为作为证据',
  EMD_LONGITUDINAL_TWIN: '把结果写入 Formation Twin 并长期复测',
  EMD_MODEL_ASSIST: '允许模型辅助整理开放文本（不参与最终评分）',
}

const REQUIRED_SCOPE = 'EMD_SELF_ASSESSMENT'
const BEHAVIOR_SCOPE = 'EMD_BEHAVIOR_EVIDENCE'
const ASSESSMENT_ITEM_BUDGET = 6

function responseLabelsFor(mode) {
  if (mode === 'frequency') {
    return [i18nT('几乎没有'), i18nT('偶尔'), i18nT('有时'), i18nT('经常'), i18nT('几乎总是')]
  }
  return [i18nT('很不符合'), i18nT('较不符合'), i18nT('不确定或一半一半'), i18nT('较符合'), i18nT('很符合')]
}

function sourceTypeFor(item) {
  if (item?.item_type === 'BE') return 'recent_behavior'
  if (item?.item_type === 'SF') return 'scenario_intention'
  return 'self_report'
}

function StageCard({ entry, confidenceVocabulary }) {
  const confidenceLabel = entry.confidence_label
    || confidenceVocabulary?.[entry.confidence]
    || entry.confidence

  return (
    <article className="ft-fact" data-testid="emd-stage-card">
      <span className="ft-fact-type inferred">{i18nT(entry.stage_label || entry.stage)}</span>
      <div className="ft-fact-label">{i18nT(entry.dimension_name || entry.dimension_code)}</div>
      {/* 情境与时间范围必须与阶段同时出现，否则阶段就会被读成分数 */}
      <strong style={{ fontSize: 15, lineHeight: 1.5 }}>{i18nT(entry.context)}</strong>
      <small>
        {i18nT(entry.timeframe)} · {i18nT(confidenceLabel)}
        {Number(entry.evidence_count) > 0 ? ` · ${entry.evidence_count} ${i18nT('条证据')}` : ''}
      </small>
    </article>
  )
}

export default function FormationTwinMaturity({ user, onSafety, onOpen }) {
  const [contract, setContract] = useState(null)
  const [capabilities, setCapabilities] = useState(null)
  const [scopes, setScopes] = useState(null)
  const [profile, setProfile] = useState(null)
  const [route, setRoute] = useState(null)
  const [triage, setTriage] = useState(null)
  const [freeText, setFreeText] = useState('')
  const [granted, setGranted] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [currentItem, setCurrentItem] = useState(null)
  const [assessmentAnswer, setAssessmentAnswer] = useState('')
  const [assessmentStartedAt, setAssessmentStartedAt] = useState(0)
  const [responseMetadata, setResponseMetadata] = useState([])
  const [assessmentComplete, setAssessmentComplete] = useState(false)
  const [behaviorConfirmed, setBehaviorConfirmed] = useState(false)
  const [deleteConfirming, setDeleteConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loaded, setLoaded] = useState(false)
  const itemHeadingRef = useRef(null)
  const safetyBlockRef = useRef(null)

  const load = useCallback(async () => {
    if (!user) { setLoaded(true); return }
    setLoaded(false)
    setError('')
    setNotice('')
    try {
      const [contractData, caps, scopeData] = await Promise.all([
        getDisplayContract(), getPilotCapabilities(), getConsentScopes(),
      ])
      setContract(contractData)
      setCapabilities(caps)
      setScopes(scopeData)
      setGranted(Array.isArray(scopeData?.granted_scopes) ? scopeData.granted_scopes : [])
      const [profileResult, routeResult] = await Promise.allSettled([getProfile(), getGrowthRoute()])
      if (profileResult.status === 'fulfilled') setProfile(profileResult.value?.profile || null)
      if (routeResult.status === 'fulfilled') setRoute(routeResult.value?.route || null)
      if (profileResult.status === 'rejected' || routeResult.status === 'rejected') {
        setNotice(i18nT('已有阶段描述或下一步暂时无法加载；你仍可进行新的私人自评。'))
      }
    } catch (exc) {
      setError(exc.message || i18nT('暂时无法加载'))
    } finally {
      setLoaded(true)
    }
  }, [user])

  useEffect(() => { load() }, [load])

  const offeredScopes = useMemo(() => Object.keys(scopes?.scopes || {}), [scopes])
  const withheldScopes = useMemo(() => Object.entries(scopes?.withheld_scopes || {}), [scopes])

  // 分流说不安全，这一屏就不再谈评估。
  const blockedBySafety = triage?.assessment_allowed === false
  const hasRequiredConsent = granted.includes(REQUIRED_SCOPE)
  const loadUnavailable = !contract || !capabilities || !scopes
  const stages = useMemo(
    () => (profile?.dimensions || []).filter(isRenderableStage),
    [profile],
  )

  useEffect(() => {
    if (currentItem?.item_id) itemHeadingRef.current?.focus()
  }, [currentItem?.item_id])

  useEffect(() => {
    if (blockedBySafety) safetyBlockRef.current?.focus()
  }, [blockedBySafety])

  const ensureAssessmentSession = async () => {
    if (sessionId) return sessionId
    const requested = Array.from(new Set([REQUIRED_SCOPE, ...granted]))
    const decision = await grantConsent({
      requested_scopes: requested,
      granted_scopes: requested,
      user_acknowledged_limits: true,
    })
    if (decision?.decision !== 'GRANTED' || !decision?.session_id) {
      throw new Error(i18nT('需要先完成私人自评授权'))
    }
    setGranted(decision.granted_scopes || requested)
    setSessionId(decision.session_id)
    return decision.session_id
  }

  const requestNextItem = async (activeSessionId) => {
    const next = await getNextAssessmentItem({
      session_id: activeSessionId,
      priority_dimensions: [],
      blocked_topics: [],
      fatigue: 0,
      item_budget: ASSESSMENT_ITEM_BUDGET,
      reading_level: 'standard',
    })
    if (next?.decision !== 'ask_item' || !next?.rendered_item) {
      setCurrentItem(null)
      return false
    }
    setCurrentItem({ ...next, ...next.rendered_item })
    setAssessmentAnswer('')
    setBehaviorConfirmed(false)
    setAssessmentStartedAt(Date.now())
    return true
  }

  const submitTriage = async () => {
    setBusy(true); setError('')
    try {
      if (!hasRequiredConsent) throw new Error(i18nT('请先授权私人自评范围'))
      setAssessmentComplete(false)
      const activeSessionId = await ensureAssessmentSession()
      const result = await runTriage({ session_id: activeSessionId, free_text: freeText })
      setFreeText('')
      setTriage(result)
      if (result.assessment_allowed === false) {
        setCurrentItem(null)
        if (typeof onSafety === 'function') onSafety()
      } else {
        await submitAssessmentIntake({ session_id: activeSessionId, submitted: {} })
        await requestNextItem(activeSessionId)
      }
    } catch (exc) {
      setError(exc.message || i18nT('提交失败'))
    } finally {
      setBusy(false)
    }
  }

  const finishAssessment = async (metadata = responseMetadata) => {
    const activeSessionId = sessionId
    if (!activeSessionId) return
    setBusy(true); setError('')
    try {
      const scored = await scoreAssessment({ session_id: activeSessionId, responses: metadata })
      const profileId = scored?.emd_profile_id
      if (profileId) {
        try {
          await createGrowthRoute(profileId)
        } catch {
          setNotice(i18nT('阶段描述已生成，但下一步建议暂时不可用。'))
        }
      }
      const [profileResult, routeResult] = await Promise.allSettled([getProfile(), getGrowthRoute()])
      if (profileResult.status === 'fulfilled') setProfile(profileResult.value?.profile || null)
      else throw profileResult.reason
      if (routeResult.status === 'fulfilled') setRoute(routeResult.value?.route || null)
      setCurrentItem(null)
      setAssessmentComplete(true)
    } catch (exc) {
      setError(exc.message || i18nT('生成阶段描述失败'))
    } finally {
      setBusy(false)
    }
  }

  const submitItem = async (skipped = false) => {
    if (!currentItem || !sessionId || (!skipped && !assessmentAnswer.trim())) return
    if (!skipped && currentItem.item_type === 'BE' && !behaviorConfirmed) return
    setBusy(true); setError('')
    const duration = assessmentStartedAt ? Math.max(0, Date.now() - assessmentStartedAt) : null
    const metadata = [...responseMetadata, { duration_ms: duration }]
    try {
      await submitAssessmentResponse({
        session_id: sessionId,
        item_id: currentItem.item_id,
        dimension_code: currentItem.dimension_code,
        source_type: sourceTypeFor(currentItem),
        context: 'OTHER',
        raw_response: skipped ? '' : assessmentAnswer,
        occurred_in_real_life: currentItem.item_type === 'BE' && behaviorConfirmed,
        response_time_ms: duration,
        skipped,
      })
      setResponseMetadata(metadata)
      const hasNext = await requestNextItem(sessionId)
      if (!hasNext) await finishAssessment(metadata)
    } catch (exc) {
      setError(exc.message || i18nT('保存回答失败'))
    } finally {
      setBusy(false)
    }
  }

  const toggleScope = async (scope, isGranted) => {
    setBusy(true); setError('')
    try {
      if (isGranted) {
        const decision = await withdrawConsent(scope)
        const remaining = decision?.remaining_scopes || granted.filter((item) => item !== scope)
        setGranted(remaining)
        if (scope === REQUIRED_SCOPE) {
          setSessionId(''); setTriage(null); setCurrentItem(null); setResponseMetadata([]); setAssessmentComplete(false)
        } else if (scope === BEHAVIOR_SCOPE && currentItem?.item_type === 'BE') {
          setCurrentItem(null)
          setNotice(i18nT('已撤回真实行为证据授权；当前行为题已关闭。'))
        }
      } else {
        if (scope !== REQUIRED_SCOPE && !hasRequiredConsent) {
          throw new Error(i18nT('请先授权私人自评范围'))
        }
        const next = Array.from(new Set([...granted, scope]))
        const decision = await grantConsent({
          requested_scopes: next, granted_scopes: next, user_acknowledged_limits: true,
        })
        setGranted(decision.granted_scopes || next)
        if (decision?.session_id) setSessionId(decision.session_id)
      }
    } catch (exc) {
      setError(exc.message || i18nT('操作失败'))
    } finally {
      setBusy(false)
    }
  }

  const erase = async () => {
    setBusy(true); setError(''); setNotice('')
    try {
      const receipt = await eraseMaturityData()
      setProfile(null); setRoute(null); setTriage(null); setGranted([]); setSessionId('')
      setCurrentItem(null); setResponseMetadata([]); setAssessmentComplete(false)
      setDeleteConfirming(false)
      setNotice(receipt?.receipt?.user_message || i18nT('已删除'))
    } catch (exc) {
      setError(exc.message || i18nT('删除失败'))
    } finally {
      setBusy(false)
    }
  }

  const startNewAssessment = () => {
    setSessionId('')
    setTriage(null)
    setCurrentItem(null)
    setAssessmentAnswer('')
    setResponseMetadata([])
    setAssessmentComplete(false)
    setBehaviorConfirmed(false)
    setError('')
    setNotice(i18nT('已准备一次新的私人自评；上一份阶段描述仍会保留，直到新结果生成或你主动删除。'))
  }

  if (!user) {
    return (
      <div className="ft-empty">
        <div aria-hidden="true">⋯</div>
        <p>{i18nT('登录后才会读取你的情感成熟度记录；访客只能查看模块边界。')}</p>
      </div>
    )
  }

  if (!loaded) {
    return <div className="ft-empty" role="status" aria-live="polite"><p>{i18nT('正在加载…')}</p></div>
  }

  return (
    <div className="ft-maturity" data-testid="emd-section" aria-busy={busy}>
      {/* 试点标签来自契约，不在前端硬写 */}
      {contract?.required_labels?.length > 0 && (
        <div
          className="ft-maturity-labels"
          style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}
        >
          {contract.required_labels.map((label) => (
            <span
              key={label}
              data-testid="emd-label"
              style={{
                fontSize: 12, letterSpacing: '0.04em', padding: '3px 10px', borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.22)', opacity: 0.85,
              }}
            >
              {i18nT(label)}
            </span>
          ))}
        </div>
      )}

      {error && (
        <div className="ft-error" role="alert" style={{ marginBottom: 12 }}>
          <span>{error}</span>
          {loadUnavailable && <button type="button" className="ft-secondary" disabled={busy} onClick={load}>{i18nT('重试加载')}</button>}
        </div>
      )}
      {notice && <p className="ft-notice" role="status" aria-live="polite" style={{ marginBottom: 12 }}>{notice}</p>}

      {/* 安全永远排在评估之前 */}
      {blockedBySafety ? (
        <section ref={safetyBlockRef} tabIndex={-1} role="alert" className="ft-safety" aria-label={i18nT('安全优先')} data-testid="emd-safety-block">
          <span className="ft-safety-icon" aria-hidden="true">🛟</span>
          <div>
            <strong>{i18nT('先照顾此刻的安全，评估可以等。')}</strong>
            <p>{i18nT('你刚才写下的内容里有需要优先处理的信号。这一部分暂时停下，请使用危机安全入口并联系可信任的真人。')}</p>
          </div>
          <button type="button" onClick={() => (typeof onSafety === 'function' ? onSafety() : null)}>
            {i18nT('打开安全帮助')}
          </button>
        </section>
      ) : (
        <>
          {!hasRequiredConsent && (
            <section className="ft-safety" aria-label={i18nT('使用前授权')} style={{ marginBottom: 18 }}>
              <span className="ft-safety-icon" aria-hidden="true">🔐</span>
              <div>
                <strong>{i18nT('先授权私人自评，之后仍可随时撤回')}</strong>
                <p>{i18nT('未授权前不会开始安全分流或评估；授权不包含第三方分享，也不允许生成总分、诊断或属灵结论。')}</p>
              </div>
              <button type="button" disabled={busy} onClick={() => toggleScope(REQUIRED_SCOPE, false)}>
                {i18nT('授权私人自评')}
              </button>
            </section>
          )}
          {!assessmentComplete && <section style={{ marginBottom: 18 }}>
            <label htmlFor="emd-triage-text" style={{ display: 'block', marginBottom: 8, fontSize: 14, opacity: 0.85 }}>
              {i18nT('可选：用几句话说说最近的状态。系统会先做安全分流，原文不写入评估记录。')}
            </label>
            <textarea
              id="emd-triage-text"
              value={freeText}
              onChange={(event) => setFreeText(event.target.value)}
              disabled={!hasRequiredConsent || busy}
              rows={3}
              maxLength={800}
              placeholder={i18nT('例如：最近和家人有一次冲突，我当时很生气，事后想了很久。')}
              style={{ width: '100%', padding: 12, borderRadius: 10, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="button" className="ft-primary" disabled={busy || !hasRequiredConsent} onClick={submitTriage}>
                {busy ? i18nT('处理中…') : i18nT('完成安全分流并开始自评')}
              </button>
              <button type="button" className="ft-secondary" onClick={() => (typeof onSafety === 'function' ? onSafety() : null)}>
                {i18nT('我现在需要帮助')}
              </button>
            </div>
          </section>}

          {currentItem && (
            <section className="ft-fact" aria-labelledby="emd-current-item-title" data-testid="emd-assessment-item" style={{ marginBottom: 18 }}>
              <span className="ft-fact-type inferred">{i18nT(currentItem.item_type_label || '可跳过的问题')}</span>
              <p className="ft-assessment-progress" role="status" aria-live="polite">
                {i18nT('第')} {responseMetadata.length + 1} {i18nT('题，最多')} {ASSESSMENT_ITEM_BUDGET} {i18nT('题；可随时跳过或结束。')}
              </p>
              <h3 ref={itemHeadingRef} tabIndex={-1} id="emd-current-item-title" style={{ fontSize: 16, lineHeight: 1.55 }}>
                {i18nT(currentItem.rendered_text)}
              </h3>
              {['likert', 'frequency'].includes(currentItem.response_mode) ? (
                <fieldset style={{ border: 0, padding: 0, margin: '12px 0' }}>
                  <legend style={{ fontSize: 13, marginBottom: 8 }}>{i18nT('选择最接近当前情况的一项')}</legend>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <label key={value} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <input type="radio" name="emd-assessment-answer" value={value} checked={assessmentAnswer === String(value)} onChange={(event) => setAssessmentAnswer(event.target.value)} />
                        <span>{value} · {responseLabelsFor(currentItem.response_mode)[value - 1]}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : (
                <label style={{ display: 'block', margin: '12px 0' }}>
                  <span style={{ display: 'block', fontSize: 13, marginBottom: 6 }}>{i18nT('你的回答（可跳过）')}</span>
                  <textarea value={assessmentAnswer} onChange={(event) => setAssessmentAnswer(event.target.value)} rows={3} maxLength={800} style={{ width: '100%', padding: 10, borderRadius: 8 }} />
                </label>
              )}
              {currentItem.item_type === 'BE' && (
                <label className="ft-behavior-confirm">
                  <input type="checkbox" checked={behaviorConfirmed} onChange={(event) => setBehaviorConfirmed(event.target.checked)} />
                  <span>{i18nT('我确认回答描述的是最近真实发生的事；系统只保存结构化证据，不保存原文。')}</span>
                </label>
              )}
              <p style={{ fontSize: 12, opacity: 0.7 }}>{i18nT(currentItem.skip_note || '跳过不会降低任何阶段。')}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <button type="button" className="ft-primary" disabled={busy || !assessmentAnswer.trim() || (currentItem.item_type === 'BE' && !behaviorConfirmed)} onClick={() => submitItem(false)}>{i18nT('保存并继续')}</button>
                <button type="button" className="ft-secondary" disabled={busy} onClick={() => submitItem(true)}>{i18nT('跳过此题')}</button>
                <button type="button" className="ft-secondary" disabled={busy} onClick={() => finishAssessment()}>{i18nT('现在结束并生成阶段描述')}</button>
              </div>
            </section>
          )}

          {assessmentComplete && (
            <div role="status" className="ft-empty" data-testid="emd-assessment-complete">
              <p>{i18nT('本次自评已完成。以下阶段描述只反映现有证据；证据不足会明确显示，不会补猜。')}</p>
              <button type="button" onClick={startNewAssessment}>{i18nT('开始一次新的私人自评')}</button>
            </div>
          )}

          {stages.length > 0 ? (
            <section aria-labelledby="emd-stages-title" style={{ marginBottom: 18 }}>
              <h3 id="emd-stages-title" style={{ fontSize: 15, marginBottom: 10 }}>
                {i18nT('当前阶段描述（按情境与时间范围）')}
              </h3>
              <div className="ft-fact-grid">
                {stages.map((entry) => (
                  <StageCard
                    key={entry.dimension_code}
                    entry={entry}
                    confidenceVocabulary={contract?.confidence_vocabulary}
                  />
                ))}
              </div>
            </section>
          ) : (
            <div className="ft-empty" data-testid="emd-empty">
              <div aria-hidden="true">⋯</div>
              <p>{i18nT('还没有足够的证据形成阶段描述。系统不会为了填满页面而虚构一个结论。')}</p>
            </div>
          )}

          {route?.assignments?.length > 0 && (
            <section aria-labelledby="emd-route-title" style={{ marginBottom: 18 }}>
              <h3 id="emd-route-title" style={{ fontSize: 15, marginBottom: 10 }}>
                {i18nT('可以试的下一步')}
              </h3>
              <p style={{ fontSize: 13, opacity: 0.75, marginBottom: 10 }}>
                {i18nT('这些是既有训练模块，不是新的评分。一次只做一件。')}
              </p>
              <div className="ft-integration-grid">
                {route.assignments.slice(0, 4).map((item) => (
                  <button
                    type="button"
                    key={item.route || item.module}
                    onClick={() => (typeof onOpen === 'function' ? onOpen(item.target || item.module) : null)}
                  >
                    <span><strong>{i18nT(item.title || item.module)}</strong></span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* 契约里的三条免责声明，逐字渲染 */}
      {contract?.disclaimers?.length > 0 && (
        <ul
          data-testid="emd-disclaimers"
          style={{ fontSize: 13, opacity: 0.78, lineHeight: 1.7, margin: '0 0 16px', paddingLeft: 18 }}
        >
          {contract.disclaimers.map((line) => <li key={line}>{i18nT(line)}</li>)}
        </ul>
      )}

      <details className="ft-maturity-consent">
        <summary>{i18nT('我授权了什么（可逐项撤回）')}</summary>
        <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
          {offeredScopes.map((scope) => {
            const isGranted = granted.includes(scope)
            return (
              <label key={scope} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={isGranted}
                  disabled={busy || (scope !== REQUIRED_SCOPE && !hasRequiredConsent)}
                  onChange={() => toggleScope(scope, isGranted)}
                />
                <span>
                  <strong>{i18nT(CONSENT_COPY[scope] || scope)}</strong>
                  {scope === REQUIRED_SCOPE && (
                    <small style={{ display: 'block', opacity: 0.7 }}>{i18nT('这一项是使用本功能的前提，但仍可随时撤回')}</small>
                  )}
                </span>
              </label>
            )
          })}
          {/* 试点期关掉的同意项要说明「为什么没有」，而不是悄悄不显示 */}
          {withheldScopes.map(([scope, reason]) => (
            <p key={scope} data-testid="emd-withheld" style={{ fontSize: 12, opacity: 0.65, margin: 0 }}>
              {i18nT(CONSENT_COPY[scope] || scope)}：{i18nT(reason)}
            </p>
          ))}
        </div>
      </details>

      <details>
        <summary>{i18nT('这个功能不做什么')}</summary>
        <ul>
          <li>{i18nT('不生成总分、百分位或与他人的排名。')}</li>
          <li>{i18nT('不做临床诊断，也不评估救恩、圣灵同在或神的评价。')}</li>
          <li>{i18nT('不用于服事资格、按立或教会纪律判断。')}</li>
          <li>{i18nT('不替代牧者、可信关系、心理咨询或医疗服务。')}</li>
          {capabilities?.sharing_allowed === false && (
            <li data-testid="emd-sharing-off">{i18nT('试点期不向任何第三方分享，包括牧者。')}</li>
          )}
        </ul>
      </details>

      <details>
        <summary>{i18nT('删除我的情感成熟度数据')}</summary>
        <p style={{ fontSize: 13, opacity: 0.8 }}>
          {i18nT('删除会清空评估记录、证据、阶段描述与派生画像。备份副本会在保留期内自然过期，在此期间不会被恢复或使用。')}
        </p>
        <div className="ft-details-actions">
          {!deleteConfirming ? (
            <button type="button" onClick={() => setDeleteConfirming(true)} disabled={busy}>{i18nT('删除这一部分数据')}</button>
          ) : (
            <div className="ft-delete-confirm" role="group" aria-label={i18nT('确认删除情感成熟度数据')}>
              <p>{i18nT('此操作会删除主库中的评估、证据、阶段描述和建议，且无法在应用内恢复。')}</p>
              <button type="button" className="ft-danger" onClick={erase} disabled={busy}>{busy ? i18nT('正在删除…') : i18nT('确认永久删除')}</button>
              <button type="button" onClick={() => setDeleteConfirming(false)} disabled={busy}>{i18nT('取消')}</button>
            </div>
          )}
        </div>
      </details>
    </div>
  )
}
