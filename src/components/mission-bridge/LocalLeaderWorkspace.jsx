import { useEffect, useRef, useState } from 'react'
import {
  createLocalLeaderApprentice,
  fetchLocalLeaderDashboard,
  saveLocalLeaderObservation,
  saveLocalLeaderWeeklyReview,
} from '../../missionBridgeApi'
import { t } from '../../i18n/runtime'
import './localLeaderWorkspace.css'
import GuidedInput from './GuidedInput'

const PASSAGE_OPTIONS = [
  '马可福音 1:1–15',
  '路加福音 10:25–37',
  '约翰福音 4:1–26',
  '使徒行传 17:16–34',
]
const OBSERVATION_OPTIONS = [
  '重复出现的词语与行动',
  '人物之间的对比',
  '事件的因果与转折',
  '作者明确表达的重点',
]
const CONTEXT_OPTIONS = [
  '前后段落如何限定含义',
  '原始听众与历史背景',
  '文体及全书脉络',
  '尚需查证的背景资料',
]
const STRUCTURE_OPTIONS = [
  '开头—转折—回应三段结构',
  '对话问答推进层次',
  '叙事场景与核心宣告对照',
]
const MESSAGE_OPTIONS = [
  '这段经文显明上帝怎样的作为',
  '这段经文指出人的真实处境',
  '这段经文邀请群体作出怎样的回应',
]
const REVIEW_HAPPENED_OPTIONS = [
  '按计划完成并有充分互动',
  '部分完成，时间安排需要调整',
  '出现未预期的问题或张力',
  '有参与者需要单独跟进',
]
const REVIEW_HEARD_OPTIONS = [
  '参与者表达了新的理解',
  '参与者提出了真实疑问',
  '参与者希望获得进一步支持',
  '参与者对当前方式感到不适',
]
const REVIEW_CHANGE_OPTIONS = [
  '减少内容，增加倾听时间',
  '补充可信来源后再讨论',
  '邀请另一位同工共同带领',
  '先安排一对一关怀或专业转介',
]
const REFERRAL_CATEGORY_OPTIONS = [
  ['pastoral_care', '牧者关怀'],
  ['counseling', '专业心理辅导'],
  ['social_support', '社会福利支持'],
  ['medical_emergency', '医疗或紧急求助'],
]
const DEVELOPMENT_OPTIONS = [
  '共同预备并带领一次分享',
  '学习倾听与安全回应',
  '练习经文观察与提问',
  '建立复盘和反馈习惯',
]

export default function LocalLeaderWorkspace({ token }) {
  const [data, setData] = useState({ weeks: [], reviews: [], apprentices: [] })
  const [mode, setMode] = useState('course')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [observationFeedback, setObservationFeedback] = useState({
    flags: [],
    observationPrompts: [],
  })
  const [questionsDraft, setQuestionsDraft] = useState('')
  const [observation, setObservation] = useState({
    passageReference: '',
    observation: '',
    contextNotes: '',
    structureNotes: '',
    centralMessage: '',
    applicationQuestions: [],
  })
  const [review, setReview] = useState({
    week: 1,
    whatHappened: '',
    whatWasHeard: '',
    nextChange: '',
    referralCategories: [],
  })
  const [apprentice, setApprentice] = useState({
    name: '',
    developmentGoal: '',
    practiceSteps: ['共同预备一次分享'],
    consentConfirmed: false,
  })

  const load = () =>
    fetchLocalLeaderDashboard(token)
      .then(setData)
      .catch((e) => setError(e.message))

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const run = async (action, message, onResult = null) => {
    if (busyRef.current) return undefined
    busyRef.current = true
    setBusy(true)
    setError('')
    try {
      const value = await action()
      if (onResult) onResult(value)
      setNotice(message)
      await load()
      return value
    } catch (e) {
      setError(e.message)
      return undefined
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  const toggleReferralCategory = (categoryKey) => {
    setReview((prev) => {
      const exists = prev.referralCategories.includes(categoryKey)
      return {
        ...prev,
        referralCategories: exists
          ? prev.referralCategories.filter((item) => item !== categoryKey)
          : [...prev.referralCategories, categoryKey],
      }
    })
  }

  return (
    <section className="mb-leader">
      <div className="mb-leader-boundary">
        {data.aiBoundary || t('AI 只帮助观察经文，不替你作属灵权威判断。')}
      </div>
      <nav>
        {[
          ['course', '12周路径'],
          ['observe', '经文观察'],
          ['review', '带领复盘'],
          ['apprentice', '副组长培养'],
        ].map(([key, label]) => (
          <button
            type="button"
            className={mode === key ? 'active' : ''}
            onClick={() => setMode(key)}
            key={key}
          >
            {t(label)}
          </button>
        ))}
      </nav>
      {error && <div className="mb-alert error" role="alert">{error}</div>}
      {notice && <div className="mb-alert success" role="status">{notice}</div>}
      {mode === 'course' && (
        <div className="mb-week-list">
          {data.weeks.map((item) => (
            <div key={item.week}>
              <strong>{item.week}</strong>
              <span>{item.title}</span>
              <small>
                {data.reviews.some((r) => r.week === item.week)
                  ? t('✓ 已复盘')
                  : t('待完成')}
              </small>
            </div>
          ))}
        </div>
      )}
      {mode === 'observe' && (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const parsedQuestions = questionsDraft
                .split(/\r?\n/)
                .map((q) => q.trim())
                .filter(Boolean)
              const payload = {
                ...observation,
                applicationQuestions: parsedQuestions,
              }
              run(
                () => saveLocalLeaderObservation(token, payload),
                t('经文观察已保存'),
                (res) => {
                  setObservationFeedback({
                    flags: Array.isArray(res?.flags) ? res.flags : [],
                    observationPrompts: Array.isArray(res?.observationPrompts)
                      ? res.observationPrompts
                      : [],
                  })
                },
              )
            }}
          >
            <GuidedInput
              options={PASSAGE_OPTIONS}
              required
              placeholder={t('经文范围')}
              value={observation.passageReference}
              onChange={(passageReference) =>
                setObservation({ ...observation, passageReference })
              }
              aria-label={t('经文范围')}
            />
            <GuidedInput
              multiline
              options={OBSERVATION_OPTIONS}
              required
              minLength={5}
              placeholder={t('先记录经文中实际看见的重复、对比、人物与行动')}
              value={observation.observation}
              onChange={(value) => setObservation({ ...observation, observation: value })}
              aria-label={t('先记录经文中实际看见的重复、对比、人物与行动')}
            />
            <GuidedInput
              multiline
              options={CONTEXT_OPTIONS}
              placeholder={t('上下文与背景')}
              value={observation.contextNotes}
              onChange={(contextNotes) => setObservation({ ...observation, contextNotes })}
              aria-label={t('上下文与背景')}
            />
            <GuidedInput
              multiline
              options={STRUCTURE_OPTIONS}
              placeholder={t('段落结构与脉络笔记')}
              value={observation.structureNotes}
              onChange={(structureNotes) => setObservation({ ...observation, structureNotes })}
              aria-label={t('段落结构与脉络笔记')}
            />
            <GuidedInput
              multiline
              options={MESSAGE_OPTIONS}
              placeholder={t('中心信息草案')}
              value={observation.centralMessage}
              onChange={(centralMessage) =>
                setObservation({ ...observation, centralMessage })
              }
              aria-label={t('中心信息草案')}
            />
            <textarea
              rows={3}
              placeholder={t('开放式应用问题（每行一条，留给参与者自由回应）')}
              aria-label={t('开放式应用问题')}
              value={questionsDraft}
              onChange={(e) => {
                const raw = e.target.value
                setQuestionsDraft(raw)
                setObservation({
                  ...observation,
                  applicationQuestions: raw
                    .split(/\r?\n/)
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }}
            />
            <button type="submit" disabled={busy}>
              {t('保存观察')}
            </button>
          </form>

          {observationFeedback.flags.length > 0 && (
            <div
              className="mb-alert warning"
              role="alert"
              data-testid="leader-authoritarian-flags"
            >
              <strong>{t('语言边界复核提醒：请避免独断或属灵施压表述')}</strong>
              <ul>
                {observationFeedback.flags.map((flag, idx) => {
                  const text = typeof flag === 'string'
                    ? flag
                    : (flag?.message || flag?.reason || flag?.code || '')
                  return <li key={idx}>{text}</li>
                })}
              </ul>
            </div>
          )}

          {observationFeedback.observationPrompts.length > 0 && (
            <div
              className="mb-observation-prompts"
              data-testid="leader-observation-prompts"
            >
              <strong>{t('经文观察深化提示')}</strong>
              <ul>
                {observationFeedback.observationPrompts.map((prompt, idx) => {
                  const text = typeof prompt === 'string'
                    ? prompt
                    : (prompt?.prompt || prompt?.title || '')
                  return <li key={idx}>{text}</li>
                })}
              </ul>
            </div>
          )}
        </>
      )}
      {mode === 'review' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            run(() => saveLocalLeaderWeeklyReview(token, review), t('本周带领复盘已保存'))
          }}
        >
          <select
            value={review.week}
            onChange={(e) => setReview({ ...review, week: Number(e.target.value) })}
          >
            {data.weeks.map((w) => (
              <option key={w.week} value={w.week}>
                {t('第')} {w.week} {t('周')} · {w.title}
              </option>
            ))}
          </select>
          <GuidedInput
            multiline
            options={REVIEW_HAPPENED_OPTIONS}
            required
            minLength={5}
            placeholder={t('实际发生了什么')}
            value={review.whatHappened}
            onChange={(whatHappened) => setReview({ ...review, whatHappened })}
            aria-label={t('实际发生了什么')}
          />
          <GuidedInput
            multiline
            options={REVIEW_HEARD_OPTIONS}
            required
            minLength={5}
            placeholder={t('我听见参与者表达了什么')}
            value={review.whatWasHeard}
            onChange={(whatWasHeard) => setReview({ ...review, whatWasHeard })}
            aria-label={t('我听见参与者表达了什么')}
          />
          <GuidedInput
            multiline
            options={REVIEW_CHANGE_OPTIONS}
            required
            minLength={5}
            placeholder={t('下次具体改变')}
            value={review.nextChange}
            onChange={(nextChange) => setReview({ ...review, nextChange })}
            aria-label={t('下次具体改变')}
          />
          <fieldset className="mb-referral-categories" data-testid="leader-referral-categories">
            <legend>{t('如需转介支持（可多选）')}</legend>
            {REFERRAL_CATEGORY_OPTIONS.map(([catKey, catLabel]) => (
              <label key={catKey} className="inline">
                <input
                  type="checkbox"
                  checked={review.referralCategories.includes(catKey)}
                  onChange={() => toggleReferralCategory(catKey)}
                />
                {t(catLabel)}
              </label>
            ))}
          </fieldset>
          <button type="submit" disabled={busy}>
            {t('保存复盘')}
          </button>
        </form>
      )}
      {mode === 'apprentice' && (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              run(
                () => createLocalLeaderApprentice(token, apprentice),
                t('副组长培养计划已建立'),
              )
            }}
          >
            <input
              required
              placeholder={t('副组长姓名或称呼')}
              value={apprentice.name}
              onChange={(e) => setApprentice({ ...apprentice, name: e.target.value })}
              aria-label={t('副组长姓名或称呼')}
            />
            <GuidedInput
              multiline
              options={DEVELOPMENT_OPTIONS}
              required
              minLength={5}
              placeholder={t('培养目标')}
              value={apprentice.developmentGoal}
              onChange={(developmentGoal) =>
                setApprentice({ ...apprentice, developmentGoal })
              }
              aria-label={t('培养目标')}
            />
            <label>
              <input
                type="checkbox"
                checked={apprentice.consentConfirmed}
                onChange={(e) =>
                  setApprentice({ ...apprentice, consentConfirmed: e.target.checked })
                }
              />
              {t('对方已知情并同意参加培养')}
            </label>
            <button type="submit" disabled={busy || !apprentice.consentConfirmed}>
              {t('建立培养计划')}
            </button>
          </form>
          <div className="mb-apprentices">
            {data.apprentices.map((a) => (
              <div key={a.id}>
                <strong>{a.name}</strong>
                <span>{a.developmentGoal}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
