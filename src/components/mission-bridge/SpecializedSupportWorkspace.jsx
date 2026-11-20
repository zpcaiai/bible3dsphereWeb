import { useEffect, useRef, useState } from 'react'
import * as mbApi from '../../missionBridgeApi'
import { t } from '../../i18n/runtime'
import './specializedSupportWorkspace.css'
import GuidedInput from './GuidedInput'
import { missionOptionLabel } from './optionLabels'

const RESPITE_OPTIONS = [
  '陪伴长者并进行安全看顾',
  '协助短时家务与生活支持',
  '陪同一次就诊或外出',
  '让主要照护者获得连续休息时间',
]
const REMINDER_OPTIONS = ['复诊提醒', '服药提醒', '心理咨询预约提醒', '检查与化验提醒']
const WARNING_OPTIONS = [
  '连续数日失眠并拒绝日常进食',
  '情绪剧烈波动并要求立即联系家属或医生',
  '表达无望感，需要真人牧者与专业危机干预',
]
const modules = [
  ['elder', '老人家庭照护者'],
  ['mental', '精神健康家属'],
  ['access', '无障碍'],
  ['harm', '教会伤害'],
  ['transition', '单亲离异丧偶'],
  ['ministry', '服事者家庭'],
  ['youth', '过渡青年'],
  ['reentry', '重返社会'],
]

function resolveMbFn(...names) {
  for (const fnName of names) {
    if (fnName && fnName in mbApi && typeof mbApi[fnName] === 'function') {
      return mbApi[fnName]
    }
  }
  return null
}

function getLoader(modeKey) {
  const map = {
    elder: 'fetchElderCaregiverDashboard',
    mental: 'fetchMentalHealthFamilyDashboard',
    access: 'fetchAccessibilityPreferences',
    harm: 'fetchChurchHarmDashboard',
    transition: 'fetchFamilyTransitionDashboard',
    ministry: 'fetchMinistryFamilyDashboard',
    youth: 'fetchTransitionYouthDashboard',
    reentry: 'fetchReentryDashboard',
  }
  return resolveMbFn(map[modeKey])
}

function isL3SafeguardingResponse(res) {
  if (!res || typeof res !== 'object') return false
  const level = String(
    res.safeguardingLevel || res.escalationLevel || res.level || res.escalation?.level || '',
  ).toUpperCase()
  return Boolean(
    res.incidentId
      || level === 'L3'
      || level === 'S3'
      || res.requiresHumanEscalation === true,
  )
}

export default function SpecializedSupportWorkspace({ token }) {
  const [mode, setMode] = useState('elder')
  const [data, setData] = useState({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [safeguardingEscalation, setSafeguardingEscalation] = useState(null)
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [assessment, setAssessment] = useState({
    stressLevel: 3,
    sleepMinutes: 420,
    fatigue: 3,
    angerPresent: false,
    selfHarmSignal: false,
  })
  const [respite, setRespite] = useState({ durationMinutes: 120, supportScope: '' })
  const [reminder, setReminder] = useState({
    reminderType: 'appointment',
    label: '复诊提醒',
    schedule: { time: '09:00' },
    explicitlyEnabled: false,
  })
  const [warningForm, setWarningForm] = useState({
    signalSummary: '',
    immediateDanger: false,
  })
  const [prefs, setPrefs] = useState({
    highContrast: false,
    fontScale: 1,
    plainLanguage: false,
    lowBandwidth: false,
    preferredFormat: 'standard_text',
  })
  const [harmPseudonym, setHarmPseudonym] = useState('')
  const [ministryPseudonym, setMinistryPseudonym] = useState('')
  const [pathway, setPathway] = useState('single_parent')
  const [participantType, setParticipantType] = useState('spouse')
  const [youth, setYouth] = useState({
    age: 18,
    guardianOrAgencyConsent: false,
    emergencyContact: '',
  })
  const [reentry, setReentry] = useState({
    pseudonym: '',
    participantType: 'released_person',
    criminalRecordDetail: '',
  })

  const load = async () => {
    setError('')
    try {
      const loader = getLoader(mode)
      if (!loader) return
      const value = await loader(token)
      setData(value || {})
      if (mode === 'access' && value?.preferences) setPrefs(value.preferences)
    } catch (e) {
      setError(e.message)
    }
  }

  useEffect(() => {
    setNotice('')
    setSafeguardingEscalation(null)
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, mode])

  const run = async (action, message) => {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    setError('')
    try {
      const value = await action()
      if (isL3SafeguardingResponse(value)) {
        setSafeguardingEscalation(value)
        setNotice(t('已升级真人安全跟进'))
      } else {
        setSafeguardingEscalation(null)
        setNotice(message)
      }
      await load()
    } catch (e) {
      setError(e.message)
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  const youthConsentBlocked = Number(youth.age) < 18 && !youth.guardianOrAgencyConsent

  const handleYouthSubmit = (e) => {
    e.preventDefault()
    if (youthConsentBlocked) {
      setError(t('未满18岁须先取得监护人或机构同意'))
      return
    }
    run(() => mbApi.createTransitionYouthProfile(token, youth), t('过渡支持档案已建立'))
  }

  const handleMentalWarningSubmit = (e) => {
    e.preventDefault()
    const warningFn = resolveMbFn('createMentalHealthWarning', 'triggerMentalHealthWarnings')
    if (!warningFn) return
    run(
      () => warningFn(token, warningForm),
      t('预警信号已记录并通知授权支持同工'),
    )
  }

  const boundaries =
    data.aiBoundaries ||
    data.rules ||
    data.standards ||
    data.principles ||
    data.privacy ||
    data.prohibited ||
    []

  const assessmentsList = Array.isArray(data.assessments) ? data.assessments : []
  const remindersList = Array.isArray(data.reminders) ? data.reminders : []
  const resourcesList = Array.isArray(data.resources) ? data.resources : []

  return (
    <section
      className={`mb-specialized ${prefs.highContrast ? 'high-contrast' : ''}`}
      style={{ fontSize: `${prefs.fontScale || 1}em` }}
    >
      <nav>
        {modules.map(([key, label]) => (
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
      <div className="mb-special-boundaries">
        {boundaries.map((item) => (
          <span key={typeof item === 'string' ? item : item.title}>
            ✓ {typeof item === 'string' ? item : item.title}
          </span>
        ))}
      </div>
      {error && (
        <div className="mb-alert error" role="alert">
          {error}
        </div>
      )}
      {safeguardingEscalation && (
        <div
          className="mb-alert error"
          role="alert"
          data-testid="specialized-l3-safeguarding"
        >
          <strong>{t('L3 紧急安全守护已启动')}</strong>
          <div>
            {safeguardingEscalation.message
              || safeguardingEscalation.escalation?.message
              || t('系统已停止自动化处理并转交授权真人跟进。若有立即生命危险，请拨打当地紧急救援电话。')}
          </div>
        </div>
      )}
      {notice && (
        <div className="mb-alert success" role="status">
          {notice}
        </div>
      )}
      {mode === 'elder' && (
        <div className="mb-special-grid">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              run(
                () => mbApi.createElderCaregiverAssessment(token, assessment),
                t('照护压力评估已保存'),
              )
            }}
          >
            <h3>{t('照护压力自评')}</h3>
            <label>
              {t('压力')}
              <input
                type="range"
                min="1"
                max="5"
                value={assessment.stressLevel}
                onChange={(e) =>
                  setAssessment({ ...assessment, stressLevel: Number(e.target.value) })
                }
              />
            </label>
            <label>
              {t('近24小时睡眠分钟数')}
              <input
                type="number"
                min="0"
                max="960"
                step="15"
                aria-label={t('近24小时睡眠分钟数')}
                value={assessment.sleepMinutes}
                onChange={(e) =>
                  setAssessment({ ...assessment, sleepMinutes: Number(e.target.value) })
                }
              />
            </label>
            <label>
              {t('疲惫')}
              <input
                type="range"
                min="1"
                max="5"
                value={assessment.fatigue}
                onChange={(e) =>
                  setAssessment({ ...assessment, fatigue: Number(e.target.value) })
                }
              />
            </label>
            <label className="inline">
              <input
                type="checkbox"
                checked={assessment.angerPresent}
                onChange={(e) =>
                  setAssessment({ ...assessment, angerPresent: e.target.checked })
                }
              />
              {t('愤怒也可以被诚实表达')}
            </label>
            <label className="inline">
              <input
                type="checkbox"
                aria-label={t('出现自伤或轻生念头（立即转入真人守护）')}
                checked={assessment.selfHarmSignal}
                onChange={(e) =>
                  setAssessment({ ...assessment, selfHarmSignal: e.target.checked })
                }
              />
              {t('出现自伤或轻生念头（立即转入真人守护）')}
            </label>
            <button type="submit" disabled={busy}>
              {t('保存并获得支持分流')}
            </button>
          </form>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              run(() => mbApi.requestElderCaregiverRespite(token, respite), t('短时支持申请已提交'))
            }}
          >
            <h3>{t('申请志愿者短时支持')}</h3>
            <label>
              {t('申请支持时长（分钟）')}
              <input
                type="number"
                min="30"
                max="480"
                step="30"
                aria-label={t('申请支持时长（分钟）')}
                value={respite.durationMinutes}
                onChange={(e) =>
                  setRespite({ ...respite, durationMinutes: Number(e.target.value) })
                }
              />
            </label>
            <GuidedInput
              multiline
              options={RESPITE_OPTIONS}
              required
              minLength={4}
              value={respite.supportScope}
              onChange={(supportScope) => setRespite({ ...respite, supportScope })}
              aria-label={t('需要哪些短时支持')}
            />
            <button type="submit" disabled={busy}>
              {t('提交申请')}
            </button>
          </form>

          {assessmentsList.length > 0 && (
            <div className="mb-saved-list" data-testid="specialized-assessments-list">
              <h4>{t('已保存的照护评估记录')}</h4>
              <ul>
                {assessmentsList.map((item, idx) => (
                  <li key={item.id || idx}>
                    {t('压力')} {item.stressLevel ?? '-'} · {t('睡眠')} {item.sleepMinutes ?? '-'} {t('分钟')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {mode === 'mental' && (
        <div className="mb-special-grid">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              run(() => mbApi.createMentalHealthReminder(token, reminder), t('提醒已由你主动启用'))
            }}
          >
            <h3>{t('主动启用就诊或服药提醒')}</h3>
            <select
              value={reminder.reminderType}
              onChange={(e) => setReminder({ ...reminder, reminderType: e.target.value })}
            >
              <option value="appointment">{t('就诊（Appointment）')}</option>
              <option value="medication">{t('服药（Medication）')}</option>
            </select>
            <GuidedInput
              options={REMINDER_OPTIONS}
              required
              value={reminder.label}
              onChange={(label) => setReminder({ ...reminder, label })}
              aria-label={t('提醒名称')}
            />
            <label>
              {t('提醒时间')}
              <input
                type="time"
                aria-label={t('提醒时间')}
                value={reminder.schedule?.time || '09:00'}
                onChange={(e) =>
                  setReminder({
                    ...reminder,
                    schedule: { ...(reminder.schedule || {}), time: e.target.value },
                  })
                }
              />
            </label>
            <label className="inline">
              <input
                type="checkbox"
                checked={reminder.explicitlyEnabled}
                onChange={(e) =>
                  setReminder({ ...reminder, explicitlyEnabled: e.target.checked })
                }
              />
              {t('我主动启用此提醒')}
            </label>
            <button type="submit" disabled={busy || !reminder.explicitlyEnabled}>
              {t('启用提醒')}
            </button>
          </form>

          <form
            data-testid="mental-health-warning-form"
            onSubmit={handleMentalWarningSubmit}
          >
            <h3>{t('早期预警与紧急求助信号')}</h3>
            <GuidedInput
              multiline
              options={WARNING_OPTIONS}
              required
              minLength={4}
              value={warningForm.signalSummary}
              onChange={(signalSummary) => setWarningForm({ ...warningForm, signalSummary })}
              placeholder={t('描述需要同工或专业团队关注的预警迹象')}
              aria-label={t('预警信号描述')}
            />
            <label className="inline">
              <input
                type="checkbox"
                checked={warningForm.immediateDanger}
                onChange={(e) =>
                  setWarningForm({ ...warningForm, immediateDanger: e.target.checked })
                }
              />
              {t('存在立即安全风险（触发真人紧急响应）')}
            </label>
            <button type="submit" disabled={busy}>
              {t('提交预警信号')}
            </button>
          </form>

          {remindersList.length > 0 && (
            <div className="mb-saved-list" data-testid="specialized-reminders-list">
              <h4>{t('已启用的提醒')}</h4>
              <ul>
                {remindersList.map((item, idx) => (
                  <li key={item.id || idx}>
                    {item.label} · {item.schedule?.time || ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {mode === 'access' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            run(() => mbApi.saveAccessibilityPreferences(token, prefs), t('无障碍偏好已保存'))
          }}
          aria-label={t('无障碍偏好')}
        >
          <h3>{t('无障碍偏好')}</h3>
          <label className="inline">
            <input
              type="checkbox"
              checked={prefs.highContrast}
              onChange={(e) => setPrefs({ ...prefs, highContrast: e.target.checked })}
            />
            {t('高对比度')}
          </label>
          <label>
            {t('字号')}
            <input
              aria-label={t('字号')}
              type="range"
              min="1"
              max="2"
              step="0.25"
              value={prefs.fontScale}
              onChange={(e) => setPrefs({ ...prefs, fontScale: Number(e.target.value) })}
            />
          </label>
          <label className="inline">
            <input
              type="checkbox"
              checked={prefs.plainLanguage}
              onChange={(e) => setPrefs({ ...prefs, plainLanguage: e.target.checked })}
            />
            {t('简明语言')}
          </label>
          <label className="inline">
            <input
              type="checkbox"
              checked={prefs.lowBandwidth}
              onChange={(e) => setPrefs({ ...prefs, lowBandwidth: e.target.checked })}
            />
            {t('低带宽模式')}
          </label>
          <select
            value={prefs.preferredFormat}
            onChange={(e) => setPrefs({ ...prefs, preferredFormat: e.target.value })}
          >
            {(data.formats || []).map((x) => (
              <option key={x} value={x}>
                {missionOptionLabel(x)}
              </option>
            ))}
          </select>
          <button type="submit" disabled={busy}>
            {t('保存偏好')}
          </button>
        </form>
      )}
      {mode === 'harm' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            run(
              () => mbApi.saveChurchHarmProfile(token, { pseudonym: harmPseudonym }),
              t('化名档案已建立，原教会无权自动查看'),
            )
          }}
        >
          <h3>{t('信仰重建与安全对话')}</h3>
          <input
            required
            minLength={2}
            value={harmPseudonym}
            onChange={(e) => setHarmPseudonym(e.target.value)}
            placeholder={t('化名')}
            aria-label={t('化名')}
          />
          <button type="submit" disabled={busy}>
            {t('建立保密档案')}
          </button>
          <div className="mb-stage-list">
            {(data.stages || []).map((x) => (
              <span key={x.number}>
                {x.number}. {x.title}
              </span>
            ))}
          </div>
        </form>
      )}
      {mode === 'transition' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            run(
              () => mbApi.saveFamilyTransitionProfile(token, { pathway }),
              t('支持路径已保存，不设置再婚目标'),
            )
          }}
        >
          <h3>{t('选择当前支持路径')}</h3>
          <select value={pathway} onChange={(e) => setPathway(e.target.value)}>
            {(data.pathways || []).map((x) => (
              <option value={x.key} key={x.key}>
                {missionOptionLabel(x.key, x.title)}
              </option>
            ))}
          </select>
          <button type="submit" disabled={busy}>
            {t('保存路径')}
          </button>
          <p>{data.principle}</p>
        </form>
      )}
      {mode === 'ministry' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            run(
              () =>
                mbApi.saveMinistryFamilyProfile(token, {
                  pseudonym: ministryPseudonym,
                  participantType,
                  homeChurchOrgId: null,
                }),
              t('保密档案已建立，不向所在教会共享'),
            )
          }}
        >
          <h3>{t('服事者家庭化名档案')}</h3>
          <input
            required
            minLength={2}
            value={ministryPseudonym}
            onChange={(e) => setMinistryPseudonym(e.target.value)}
            placeholder={t('化名')}
            aria-label={t('化名')}
          />
          <select
            value={participantType}
            onChange={(e) => setParticipantType(e.target.value)}
          >
            <option value="pastor">{t('牧者（Pastor）')}</option>
            <option value="spouse">{t('配偶（Spouse）')}</option>
            <option value="adult_child">{t('成年子女（Adult child）')}</option>
          </select>
          <button type="submit" disabled={busy}>
            {t('建立跨机构保密档案')}
          </button>
        </form>
      )}
      {mode === 'youth' && (
        <div className="mb-partner-gate">
          <h3>{t('16–25岁成年过渡支持')}</h3>
          {!data.enabled ? (
            <div className="mb-alert warning">
              {t('尚未建立有效的儿童福利、学校或专业社工合作，本模块保持关闭。')}
            </div>
          ) : (
            <form onSubmit={handleYouthSubmit}>
              <input
                type="number"
                min="16"
                max="25"
                aria-label={t('16–25岁成年过渡支持')}
                value={youth.age}
                onChange={(e) => setYouth({ ...youth, age: Number(e.target.value) })}
              />
              <input
                required
                minLength={4}
                value={youth.emergencyContact}
                onChange={(e) => setYouth({ ...youth, emergencyContact: e.target.value })}
                placeholder={t('紧急联系人')}
                aria-label={t('紧急联系人')}
              />
              {Number(youth.age) < 18 && (
                <label className="inline">
                  <input
                    type="checkbox"
                    checked={youth.guardianOrAgencyConsent}
                    onChange={(e) =>
                      setYouth({ ...youth, guardianOrAgencyConsent: e.target.checked })
                    }
                  />
                  {t('已取得监护人或机构同意')}
                </label>
              )}
              <button type="submit" disabled={busy || youthConsentBlocked}>
                {t('建立档案')}
              </button>
            </form>
          )}
        </div>
      )}
      {mode === 'reentry' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            run(() => mbApi.saveReentryProfile(token, reentry), t('受限档案已建立，不形成长期标签'))
          }}
        >
          <h3>{t('重返社会隐私档案')}</h3>
          <input
            required
            minLength={2}
            value={reentry.pseudonym}
            onChange={(e) => setReentry({ ...reentry, pseudonym: e.target.value })}
            placeholder={t('化名')}
            aria-label={t('化名')}
          />
          <select
            value={reentry.participantType}
            onChange={(e) => setReentry({ ...reentry, participantType: e.target.value })}
          >
            <option value="released_person">{t('返社人员（Returning citizen）')}</option>
            <option value="family_member">{t('家属（Family member）')}</option>
          </select>
          <p>{t('不需要填写案件细节，也不会展示风险评分。')}</p>
          <button type="submit" disabled={busy}>
            {t('建立受限隐私档案')}
          </button>
        </form>
      )}

      {resourcesList.length > 0 && (
        <div className="mb-saved-list" data-testid="specialized-resources-list">
          <h4>{t('可用专业支持资源')}</h4>
          <ul>
            {resourcesList.map((res, idx) => (
              <li key={res.id || res.title || idx}>
                {typeof res === 'string'
                  ? res
                  : `${res.title || res.name || ''}${res.contact ? ` · ${res.contact}` : ''}`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
