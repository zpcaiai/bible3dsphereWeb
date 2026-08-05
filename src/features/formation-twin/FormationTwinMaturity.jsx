import { useCallback, useEffect, useMemo, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import {
  eraseMaturityData,
  getConsentScopes,
  getDisplayContract,
  getGrowthRoute,
  getPilotCapabilities,
  getProfile,
  grantConsent,
  isRenderableStage,
  runTriage,
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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    if (!user) { setLoaded(true); return }
    try {
      const [contractData, caps, scopeData] = await Promise.all([
        getDisplayContract(), getPilotCapabilities(), getConsentScopes(),
      ])
      setContract(contractData)
      setCapabilities(caps)
      setScopes(scopeData)
      try {
        const [profileData, routeData] = await Promise.all([getProfile(), getGrowthRoute()])
        setProfile(profileData)
        setRoute(routeData)
      } catch {
        // 还没做过评估是正常状态，不是错误
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
  const stages = useMemo(
    () => (profile?.dimensions || []).filter(isRenderableStage),
    [profile],
  )

  const submitTriage = async () => {
    setBusy(true); setError('')
    try {
      const result = await runTriage({ free_text: freeText })
      setTriage(result)
      if (result.assessment_allowed === false && typeof onSafety === 'function') onSafety()
    } catch (exc) {
      setError(exc.message || i18nT('提交失败'))
    } finally {
      setBusy(false)
    }
  }

  const toggleScope = async (scope, isGranted) => {
    setBusy(true); setError('')
    try {
      if (isGranted) {
        await withdrawConsent(scope)
        setGranted((prev) => prev.filter((item) => item !== scope))
      } else {
        const next = Array.from(new Set([...granted, REQUIRED_SCOPE, scope]))
        const decision = await grantConsent({
          requested_scopes: next, granted_scopes: next, user_acknowledged_limits: true,
        })
        setGranted(decision.granted_scopes || next)
      }
    } catch (exc) {
      setError(exc.message || i18nT('操作失败'))
    } finally {
      setBusy(false)
    }
  }

  const erase = async () => {
    setBusy(true); setError('')
    try {
      const receipt = await eraseMaturityData()
      setProfile(null); setRoute(null); setTriage(null); setGranted([])
      setError(receipt?.receipt?.user_message || i18nT('已删除'))
    } catch (exc) {
      setError(exc.message || i18nT('删除失败'))
    } finally {
      setBusy(false)
    }
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
    return <div className="ft-empty"><p>{i18nT('正在加载…')}</p></div>
  }

  return (
    <div className="ft-maturity" data-testid="emd-section">
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

      {error && <p className="ft-error" role="status" style={{ marginBottom: 12 }}>{error}</p>}

      {/* 安全永远排在评估之前 */}
      {blockedBySafety ? (
        <section className="ft-safety" aria-label={i18nT('安全优先')} data-testid="emd-safety-block">
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
          <section style={{ marginBottom: 18 }}>
            <label htmlFor="emd-triage-text" style={{ display: 'block', marginBottom: 8, fontSize: 14, opacity: 0.85 }}>
              {i18nT('用几句话说说最近的状态。系统会先做一次安全分流，再决定是否继续。')}
            </label>
            <textarea
              id="emd-triage-text"
              value={freeText}
              onChange={(event) => setFreeText(event.target.value)}
              rows={3}
              maxLength={800}
              placeholder={i18nT('例如：最近和家人有一次冲突，我当时很生气，事后想了很久。')}
              style={{ width: '100%', padding: 12, borderRadius: 10, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="button" className="ft-primary" disabled={busy || !freeText.trim()} onClick={submitTriage}>
                {busy ? i18nT('处理中…') : i18nT('开始一次自评')}
              </button>
              <button type="button" className="ft-secondary" onClick={() => (typeof onSafety === 'function' ? onSafety() : null)}>
                {i18nT('我现在需要帮助')}
              </button>
            </div>
          </section>

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
                  disabled={busy || scope === REQUIRED_SCOPE}
                  onChange={() => toggleScope(scope, isGranted)}
                />
                <span>
                  <strong>{i18nT(CONSENT_COPY[scope] || scope)}</strong>
                  {scope === REQUIRED_SCOPE && (
                    <small style={{ display: 'block', opacity: 0.7 }}>{i18nT('这一项是使用本功能的前提')}</small>
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
          <button type="button" onClick={erase} disabled={busy}>{i18nT('删除这一部分数据')}</button>
        </div>
      </details>
    </div>
  )
}
