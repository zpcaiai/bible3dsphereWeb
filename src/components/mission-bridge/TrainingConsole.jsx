import { useEffect, useRef, useState } from 'react'
import {
  createMissionBridgeCohort,
  fetchMissionBridgeTraining,
  saveMissionBridgeMentor,
  submitMissionBridgeTrainerCandidate,
} from '../../missionBridgeApi'
import { t } from '../../i18n/runtime'
import './trainingConsole.css'
import GuidedInput from './GuidedInput'
import { missionOptionLabel } from './optionLabels'

const evidenceKeys = [
  ['leadership_observation', '真实带领观察'],
  ['safeguarding_training', '安全培训'],
  ['power_boundaries_training', '权力边界培训'],
  ['supervisor_recommendation', '监督者推荐'],
  ['trial_period', '试运行期'],
  ['participant_feedback', '参与者反馈'],
]
const COHORT_OPTIONS = [
  '倾听与同行小组',
  '跨文化预备小组',
  '本地带领者训练小组',
  '家庭支持实践小组',
]

function isCandidateEvidenceIncomplete(res) {
  if (!res || typeof res !== 'object') return false
  if (res.evaluation?.eligibleForHumanReview === false) return true
  const status = String(
    res.status || res.candidate?.status || res.evaluation?.status || '',
  ).toLowerCase()
  return ['incomplete', 'needs_more_evidence', 'pending_evidence', 'draft', 'insufficient_evidence'].includes(status)
}

export default function TrainingConsole({ token, programs = [] }) {
  const [data, setData] = useState({ metrics: {}, cohorts: [] })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [warningNotice, setWarningNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [cohort, setCohort] = useState({
    programId: programs[0]?.id || '',
    title: '',
    capacity: 12,
  })
  const [mentor, setMentor] = useState({
    userId: '',
    capacity: 2,
    matchingPreferences: {},
  })
  const [candidate, setCandidate] = useState({ userId: '', evidence: {} })

  const load = () =>
    fetchMissionBridgeTraining(token)
      .then(setData)
      .catch((e) => setError(e.message))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    if (!Array.isArray(programs) || programs.length === 0) return
    setCohort((prev) => {
      const hasMatch = programs.some((p) => p.id === prev.programId)
      if (hasMatch) return prev
      return { ...prev, programId: programs[0]?.id || '' }
    })
  }, [programs])

  const run = async (action, resolveFeedback) => {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError('')
    setWarningNotice('')
    try {
      const res = await action()
      if (typeof resolveFeedback === 'function') {
        resolveFeedback(res)
      } else {
        setNotice(resolveFeedback)
      }
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  return (
    <section className="mb-training">
      <div className="mb-training-metrics">
        {[
          ['cohorts', '小组'],
          ['mentors', '导师'],
          ['assignments', '配对'],
          ['candidates', '训练者候选'],
        ].map(([key, label]) => (
          <div key={key}>
            <strong>{data.metrics?.[key] || 0}</strong>
            <span>{t(label)}</span>
          </div>
        ))}
      </div>
      {error && <div className="mb-alert error" role="alert">{error}</div>}
      {warningNotice && (
        <div
          className="mb-alert warning"
          role="status"
          data-testid="trainer-candidate-incomplete-warning"
        >
          {warningNotice}
        </div>
      )}
      {notice && <div className="mb-alert success" role="status">{notice}</div>}
      <div className="mb-training-grid">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            run(
              () => createMissionBridgeCohort(token, cohort),
              t('小组已创建并锁定项目版本'),
            )
          }}
        >
          <h3>{t('创建项目小组')}</h3>
          <select
            aria-label={t('选择项目')}
            value={cohort.programId}
            onChange={(e) => setCohort({ ...cohort, programId: e.target.value })}
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {missionOptionLabel(p.id, p.title)}
              </option>
            ))}
          </select>
          <GuidedInput
            options={COHORT_OPTIONS}
            required
            minLength={3}
            placeholder={t('小组名称')}
            value={cohort.title}
            onChange={(title) => setCohort({ ...cohort, title })}
            aria-label={t('小组名称')}
          />
          <input
            type="number"
            min="2"
            max="200"
            value={cohort.capacity}
            onChange={(e) => setCohort({ ...cohort, capacity: Number(e.target.value) })}
          />
          <button type="submit" disabled={busy}>
            {t('创建小组')}
          </button>
        </form>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            run(
              () => saveMissionBridgeMentor(token, mentor),
              t('导师档案已保存，仍需人工审核'),
            )
          }}
        >
          <h3>{t('导师容量')}</h3>
          <input
            required
            type="email"
            placeholder={t('导师邮箱')}
            value={mentor.userId}
            onChange={(e) => setMentor({ ...mentor, userId: e.target.value })}
            aria-label={t('导师邮箱')}
          />
          <input
            type="number"
            min="1"
            max="20"
            value={mentor.capacity}
            onChange={(e) => setMentor({ ...mentor, capacity: Number(e.target.value) })}
          />
          <button type="submit" disabled={busy}>
            {t('保存导师档案')}
          </button>
        </form>
      </div>
      <form
        className="mb-candidate"
        onSubmit={(e) => {
          e.preventDefault()
          run(
            () => submitMissionBridgeTrainerCandidate(token, candidate),
            (res) => {
              if (isCandidateEvidenceIncomplete(res)) {
                setNotice('')
                const missing = Array.isArray(res?.evaluation?.missingEvidence)
                  ? res.evaluation.missingEvidence.join('、')
                  : ''
                setWarningNotice(
                  missing
                    ? `${t('候选人证据尚未齐备，暂未进入人工评审队列。缺失项：')}${missing}`
                    : t('候选人证据尚未齐备，暂未进入人工评审队列；请补齐证据后再提交。'),
                )
              } else {
                setNotice(t('候选证据已提交人工评审'))
              }
            },
          )
        }}
      >
        <h3>{t('训练者认证证据')}</h3>
        <input
          required
          type="email"
          placeholder={t('候选人邮箱')}
          value={candidate.userId}
          onChange={(e) => setCandidate({ ...candidate, userId: e.target.value })}
          aria-label={t('候选人邮箱')}
        />
        <div>
          {evidenceKeys.map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={Boolean(candidate.evidence[key])}
                onChange={(e) =>
                  setCandidate({
                    ...candidate,
                    evidence: { ...candidate.evidence, [key]: e.target.checked },
                  })
                }
              />
              {t(label)}
            </label>
          ))}
        </div>
        <p>{t('系统不会根据出勤率、测验、AI评分、奉献或发展人数自动批准。')}</p>
        <button type="submit" disabled={busy}>
          {t('提交人工评审')}
        </button>
      </form>
      <div className="mb-cohort-list">
        {data.cohorts?.map((c) => (
          <div key={c.id}>
            <strong>{c.title}</strong>
            <span>
              {c.programId} · {c.capacity} {t('人')} · {c.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
