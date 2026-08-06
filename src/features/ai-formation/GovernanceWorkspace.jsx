import { useCallback, useEffect, useMemo, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import {
  addAiFormationReleaseEvidence,
  createAiFormationReleaseDecision,
  fetchAiFormationCertification,
  fetchAiFormationContentVersion,
  fetchAiFormationReviewQueue,
  publishAiFormationContent,
  retireAiFormationContent,
  reviewAiFormationContent,
} from './api'

const HUMAN_GATES = new Set(['theology', 'pastoral_safety', 'child_safety', 'privacy_security', 'accessibility_manual', 'content_quality'])

const initialScope = { artifact_id: '', artifact_version: '', environment: 'staging', artifact_sha256: '' }

export default function GovernanceWorkspace({ releaseGates, user }) {
  const [queue, setQueue] = useState([])
  const [selected, setSelected] = useState(null)
  const [certification, setCertification] = useState(null)
  const [scope, setScope] = useState(initialScope)
  const [review, setReview] = useState({ reviewer_role: 'theology_reviewer', decision: 'approve', reason: '', note: '', attestations: [] })
  const [evidence, setEvidence] = useState({ gate: 'theology', result: 'not_run', command: '', exit_code: '' })
  const [decision, setDecision] = useState({ decision: 'blocked', rollout_percent: 0, rollback_owner: '', incident_owner: '', reason: '' })
  const [message, setMessage] = useState('')
  const latestEvidence = useMemo(() => Object.fromEntries((certification?.evidence || []).map((item) => [item.gate, item])), [certification])
  const loadQueue = useCallback(async () => {
    try { setQueue((await fetchAiFormationReviewQueue()).content || []) } catch (error) { setMessage(error.message) }
  }, [])
  useEffect(() => { loadQueue() }, [loadQueue])

  const openVersion = async (item) => {
    setMessage('')
    try {
      const detail = await fetchAiFormationContentVersion(item.id, item.version)
      setSelected(detail)
      const role = detail.content.required_reviews_json?.[0] || 'theology_reviewer'
      setReview({ reviewer_role: role, decision: 'approve', reason: '', note: '', attestations: [] })
    } catch (error) { setMessage(error.message) }
  }
  const submitReview = async (event) => {
    event.preventDefault()
    try {
      const required = selected.reviewSummary?.requiredAttestations?.[review.reviewer_role] || []
      const missing = required.filter((code) => !review.attestations.includes(code))
      if (review.decision === 'approve' && missing.length) {
        setMessage(i18nT('批准前必须逐项完成当前角色的全部人工核对。'))
        return
      }
      await reviewAiFormationContent(selected.content.id, selected.content.version, {
        reviewer_role: review.reviewer_role, decision: review.decision,
        content_sha256: selected.content.content_sha256,
        reason_codes: review.decision === 'approve'
          ? review.attestations
          : [review.reason.trim() || 'AUTHORIZED_HUMAN_REVIEW_CHANGE_REQUIRED'],
        note: review.note.trim(),
      })
      await openVersion(selected.content); await loadQueue(); setMessage(i18nT('审核已绑定到当前版本与 SHA-256。'))
    } catch (error) { setMessage(error.message) }
  }
  const toggleAttestation = (code) => {
    setReview((current) => ({
      ...current,
      attestations: current.attestations.includes(code)
        ? current.attestations.filter((item) => item !== code)
        : [...current.attestations, code],
    }))
  }
  const publish = async () => {
    try { await publishAiFormationContent(selected.content.id, selected.content.version, selected.content.content_sha256); await openVersion(selected.content); await loadQueue(); setMessage(i18nT('已由独立发布者发布该精确版本。')) } catch (error) { setMessage(error.message) }
  }
  const retire = async () => {
    try { await retireAiFormationContent(selected.content.id, selected.content.version); await openVersion(selected.content); await loadQueue(); setMessage(i18nT('该版本已停用，可回到上一已批准版本。')) } catch (error) { setMessage(error.message) }
  }
  const loadCertification = async (event) => {
    event?.preventDefault(); setMessage('')
    try { setCertification(await fetchAiFormationCertification(scope)) } catch (error) { setMessage(error.message) }
  }
  const submitEvidence = async (event) => {
    event.preventDefault()
    try {
      await addAiFormationReleaseEvidence({
        ...scope, gate: evidence.gate, result: evidence.result, command: evidence.command,
        exit_code: evidence.exit_code === '' ? null : Number(evidence.exit_code),
        executed_at: new Date().toISOString(),
        human_reviewer: HUMAN_GATES.has(evidence.gate) ? user?.email : null,
      })
      await loadCertification(); setMessage(i18nT('证据已记录；这不会自动批准发布。'))
    } catch (error) { setMessage(error.message) }
  }
  const submitDecision = async (event) => {
    event.preventDefault()
    try {
      await createAiFormationReleaseDecision({
        ...scope, decision: decision.decision, rollout_percent: Number(decision.rollout_percent),
        rollback_owner: decision.rollback_owner, incident_owner: decision.incident_owner,
        reason_codes: [decision.reason.trim() || 'AUTHORIZED_HUMAN_DECISION'],
      })
      await loadCertification(); setMessage(i18nT('人类发布决策已写入证据链。'))
    } catch (error) { setMessage(error.detail?.blockers ? `${error.message}: ${error.detail.blockers.join(', ')}` : error.message) }
  }

  return (
    <div className="aif-stack">
      <section className="aif-card aif-cert">
        <span className="aif-eyebrow">BATCH 12 · IMMUTABLE RELEASE SCOPE</span>
        <h2>{i18nT('生产认证与人工发布决策')}</h2>
        <strong>{certification?.certification?.status || 'NOT_CERTIFIED'}</strong>
        <p>{i18nT('认证必须绑定 artifact、版本、环境和 SHA-256；自动化只能提供证据。')}</p>
        <form className="aif-scope-form" onSubmit={loadCertification}>
          <label>artifact_id<input value={scope.artifact_id} onChange={(event) => setScope({ ...scope, artifact_id: event.target.value })} required /></label>
          <label>artifact_version<input value={scope.artifact_version} onChange={(event) => setScope({ ...scope, artifact_version: event.target.value })} required /></label>
          <label>environment<select value={scope.environment} onChange={(event) => setScope({ ...scope, environment: event.target.value })}><option value="staging">staging</option><option value="production">production</option></select></label>
          <label>artifact_sha256<input value={scope.artifact_sha256} onChange={(event) => setScope({ ...scope, artifact_sha256: event.target.value.trim().toLowerCase() })} minLength="64" maxLength="64" required /></label>
          <button type="submit">{i18nT('读取精确证据')}</button>
        </form>
      </section>

      <section className="aif-card"><h2>{i18nT('发布门禁')}</h2><div className="aif-gate-list">{releaseGates.map((gate) => <div key={gate}><span>{gate}</span><strong>{latestEvidence[gate]?.result?.toUpperCase() || 'NOT_RUN'}</strong></div>)}</div></section>

      <section className="aif-card">
        <h2>{i18nT('记录门禁证据')}</h2>
        <form className="aif-evidence-form" onSubmit={submitEvidence}>
          <label>gate<select value={evidence.gate} onChange={(event) => setEvidence({ ...evidence, gate: event.target.value })}>{releaseGates.map((gate) => <option key={gate}>{gate}</option>)}</select></label>
          <label>result<select value={evidence.result} onChange={(event) => setEvidence({ ...evidence, result: event.target.value })}><option>passed</option><option>failed</option><option>not_run</option><option>blocked</option></select></label>
          <label>command<input value={evidence.command} onChange={(event) => setEvidence({ ...evidence, command: event.target.value })} required /></label>
          <label>exit_code<input type="number" value={evidence.exit_code} onChange={(event) => setEvidence({ ...evidence, exit_code: event.target.value })} /></label>
          <button type="submit">{i18nT('写入证据')}</button>
        </form>
      </section>

      <section className="aif-card">
        <h2>{i18nT('人工发布决策')}</h2>
        <form className="aif-evidence-form" onSubmit={submitDecision}>
          <label>decision<select value={decision.decision} onChange={(event) => setDecision({ ...decision, decision: event.target.value, rollout_percent: event.target.value === 'approved' ? 100 : 0 })}><option>blocked</option><option>limited_rollout</option><option>approved</option><option>rolled_back</option></select></label>
          <label>rollout_percent<input type="number" min="0" max="100" value={decision.rollout_percent} onChange={(event) => setDecision({ ...decision, rollout_percent: event.target.value })} required /></label>
          <label>rollback_owner<input value={decision.rollback_owner} onChange={(event) => setDecision({ ...decision, rollback_owner: event.target.value })} required /></label>
          <label>incident_owner<input value={decision.incident_owner} onChange={(event) => setDecision({ ...decision, incident_owner: event.target.value })} required /></label>
          <label>reason_code<input value={decision.reason} onChange={(event) => setDecision({ ...decision, reason: event.target.value })} /></label>
          <button type="submit">{i18nT('提交人工决策')}</button>
        </form>
      </section>

      <section className="aif-card">
        <h2>{i18nT('内容审核队列')}（{queue.length}/67）</h2>
        <div className="aif-review-queue">{queue.map((item) => <button type="button" key={`${item.id}-${item.version}`} onClick={() => openVersion(item)} aria-current={selected?.content?.id === item.id ? 'true' : undefined}><span>B{item.batch_id} · {item.content_kind}</span><strong>{item.review_status}</strong></button>)}</div>
      </section>
      {selected && <section className="aif-card aif-review-detail">
        <span className="aif-eyebrow">{selected.content.id} · {selected.content.version}</span>
        <h2>{selected.content.content_kind}</h2>
        <p>SHA-256: <code>{selected.content.content_sha256}</code></p>
        <p>{i18nT('权威层级')}：{selected.content.authority_level} · {i18nT('审核状态')}：{selected.content.review_status}</p>
        <div className="aif-review-progress" aria-label={i18nT('所需独立人工审核')}>
          {selected.content.required_reviews_json.map((role) => <span key={role} data-complete={selected.reviewSummary?.approvedRoles?.includes(role) ? 'true' : 'false'}>{role} · {selected.reviewSummary?.approvedRoles?.includes(role) ? 'APPROVED' : 'PENDING'}</span>)}
        </div>
        <details><summary>{i18nT('查看完整待审核内容与来源')}</summary><pre>{JSON.stringify({ content: selected.content.content_json, provenance: selected.content.source_provenance_json }, null, 2)}</pre></details>
        <form className="aif-evidence-form" onSubmit={submitReview}>
          <label>reviewer_role<select value={review.reviewer_role} onChange={(event) => setReview({ ...review, reviewer_role: event.target.value, attestations: [] })}>{selected.content.required_reviews_json.map((role) => <option key={role}>{role}</option>)}</select></label>
          <label>decision<select value={review.decision} onChange={(event) => setReview({ ...review, decision: event.target.value })}><option>approve</option><option>request_changes</option><option>reject</option></select></label>
          {review.decision === 'approve' ? <fieldset className="aif-review-attestations">
            <legend>{i18nT('逐项确认人工审核范围')}</legend>
            {(selected.reviewSummary?.requiredAttestations?.[review.reviewer_role] || []).map((code) => <label key={code}><input type="checkbox" checked={review.attestations.includes(code)} onChange={() => toggleAttestation(code)} />{code}</label>)}
          </fieldset> : <label>reason_code<input value={review.reason} onChange={(event) => setReview({ ...review, reason: event.target.value })} required /></label>}
          <label>review_note<input value={review.note} onChange={(event) => setReview({ ...review, note: event.target.value })} maxLength="500" /></label>
          <button type="submit">{i18nT('提交当前哈希审核')}</button>
        </form>
        <div className="aif-data-actions"><button type="button" disabled={selected.content.review_status !== 'approved'} onClick={publish}>{i18nT('独立发布')}</button><button type="button" disabled={!selected.content.published_at || selected.content.retired_at} onClick={retire}>{i18nT('停用版本')}</button></div>
        <h3>{i18nT('审核历史')}</h3><ul>{selected.reviews.map((item) => <li key={item.id}>{item.reviewer_role} · {item.decision} · {item.reviewer_email}</li>)}</ul>
      </section>}
      {message && <p className="aif-form-message" role="status">{message}</p>}
    </div>
  )
}
