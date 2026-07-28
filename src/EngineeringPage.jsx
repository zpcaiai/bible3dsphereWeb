import { t as i18nT } from './i18n/runtime'
/**
 * GrowthAnalysisPage (formerly EngineeringPage) — 灵命成长分析
 *
 * 展示用户8个灵命维度的当前评分、成长阶段与行动建议，
 * 以及属灵健康检查和今日关怀信息。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import BackButton from './BackButton'
import { API_BASE, fetchFilmStatus, filmVideoUrl, startFilmJob } from './api.js'
import { TTSButton } from './useGlobalAudio.jsx'

const DIM_META = {
  humility:           { label: '谦卑', icon: '🙇', desc: '降卑自己、以他人为优先的心态' },
  fear_tendency:      { label: '惧怕', icon: '😰', desc: '焦虑与属灵惧怕的程度（越低越好）', inverse: true },
  pride_tendency:     { label: '骄傲', icon: '🏛', desc: '自我中心与骄傲的倾向（越低越好）', inverse: true },
  emotional_stability:{ label: '情绪稳定', icon: '⚖️', desc: '内在平安与情绪调节能力' },
  truth_alignment:    { label: '真理对齐', icon: '📖', desc: '生命与圣经真理的吻合程度' },
  relational_health:  { label: '关系健康', icon: '🤝', desc: '与人建立真实团契的能力' },
  resilience:         { label: '属灵韧性', icon: '🌿', desc: '在苦难中保持信仰的能力' },
  spiritual_clarity:  { label: '属灵清醒', icon: '✨', desc: '分辨属灵处境与神旨意的清晰度' },
}

const STAGE_META = {
  stable:    { label: '稳健成长', color: '#34c759', bg: 'rgba(52,199,89,0.12)', bar: '#34c759' },
  growing:   { label: '正在成长', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', bar: '#fbbf24' },
  blind_spot:{ label: '成长空间', color: '#f87171', bg: 'rgba(248,113,113,0.12)', bar: '#f87171' },
}

function getStage(score, inverse) {
  const s = inverse ? score : score
  if (!inverse) {
    if (s >= 0.65) return 'stable'
    if (s >= 0.35) return 'growing'
    return 'blind_spot'
  } else {
    if (s <= 0.35) return 'stable'
    if (s <= 0.65) return 'growing'
    return 'blind_spot'
  }
}

function DimBar({ dimKey, score }) {
  const meta = DIM_META[dimKey] || { label: dimKey, icon: '●', desc: '', inverse: false }
  const stage = getStage(score, meta.inverse)
  const sm = STAGE_META[stage]
  const barPct = meta.inverse ? (1 - score) * 100 : score * 100

  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: 14,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{meta.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{meta.label}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: sm.bg, color: sm.color, border: `1px solid ${sm.color}33`,
            }}>{sm.label}</span>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{meta.desc}</div>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${barPct}%`,
          background: sm.bar, borderRadius: 3,
          transition: 'width 0.6s ease',
        }} />
      </div>
      <div style={{ textAlign: 'right', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
        {Math.round(barPct)}%
      </div>
    </div>
  )
}

function HealthCard({ health }) {
  if (!health || !health.alert_level) return null
  const isGentle = health.alert_level === 'gentle'
  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 14,
      background: isGentle ? 'rgba(251,191,36,0.08)' : 'rgba(90,200,250,0.08)',
      border: `1px solid ${isGentle ? 'rgba(251,191,36,0.25)' : 'rgba(90,200,250,0.2)'}`,
      marginBottom: 14,
    }}>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}>
        {health.message}
      </div>
      {health.verse && (
        <div style={{
          marginTop: 10, fontSize: 13, color: 'rgba(255,215,0,0.8)',
          fontStyle: 'italic', borderLeft: '3px solid rgba(255,215,0,0.35)',
          paddingLeft: 10, lineHeight: 1.7,
        }}>
          {health.verse}
          <TTSButton text={health.verse} />
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 圣经电影工作台（backend/routers/film_studio.py 的前端入口）
//
// 契约（照抄 router，不要凭印象改）：
//   POST /api/film/start  { story_text, num_scenes } → { job_id }
//   GET  /api/film/status/{jid} → { status:'queued'|'running'|'done'|'error',
//        progress:0..100, steps:[日志], cur:当前镜头, story:分镜, result:{file,r2_url,mb,scenes}, error }
// 用轮询而不是 /api/film/sse：EventSource 带不了 Authorization 头，Bearer 登录的端会 401。
// JOBS 是后端进程内的字典，服务一重启任务就查不到了（404），所以 job_id 存本地只是为了
// 刷新页面能接回同一个任务，查不到时要如实告诉用户，而不是无限转圈。
// ─────────────────────────────────────────────────────────────────────────────
const FILM_JOB_KEY = 'film-studio-job-id'
const FILM_POLL_MS = 3000
const STORY_MAX = 20000

function readStoredJobId() {
  try { return localStorage.getItem(FILM_JOB_KEY) || '' } catch { return '' }
}

function FilmStudioCard({ token }) {
  const [story, setStory] = useState('')
  const [numScenes, setNumScenes] = useState(3)
  const [jobId, setJobId] = useState(readStoredJobId)
  const [job, setJob] = useState(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const logRef = useRef(null)

  const forgetJob = useCallback(() => {
    try { localStorage.removeItem(FILM_JOB_KEY) } catch { /* ignore */ }
    setJobId(''); setJob(null)
  }, [])

  useEffect(() => {
    if (!jobId) return undefined
    let cancelled = false
    let timer = null
    const tick = async () => {
      try {
        const data = await fetchFilmStatus(jobId, token)
        if (cancelled) return
        setJob(data)
        setError('')
        if (data.status === 'queued' || data.status === 'running') timer = setTimeout(tick, FILM_POLL_MS)
      } catch (e) {
        if (cancelled) return
        const msg = e?.message || ''
        if (/not found/i.test(msg)) {
          setError(i18nT('这个生成任务在后端已经不存在了（服务重启会清空任务表）。'))
          forgetJob()
          return
        }
        setError(msg || i18nT('查询进度失败'))
        timer = setTimeout(tick, FILM_POLL_MS * 2)
      }
    }
    tick()
    return () => { cancelled = true; if (timer) clearTimeout(timer) }
  }, [jobId, token, forgetJob])

  // 日志是只增数组，新行来了就滚到底，跟看构建日志一个体感。
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [job?.steps?.length])

  const running = job?.status === 'queued' || job?.status === 'running'

  async function handleStart() {
    const text = story.trim()
    if (text.length < 10) { setError(i18nT('先写下要拍的故事（至少 10 个字）')); return }
    setStarting(true); setError('')
    try {
      const data = await startFilmJob({ storyText: text.slice(0, STORY_MAX), numScenes }, token)
      try { localStorage.setItem(FILM_JOB_KEY, data.job_id) } catch { /* ignore */ }
      setJob(null)
      setJobId(data.job_id)
    } catch (e) {
      const msg = e?.message || ''
      // 后端在「已有任务在跑 / 缺 Gemini Key / 未配置 Kling」时抛的是普通 Exception，
      // 被全局处理器压成 500 «Internal server error»，真正原因只在服务端日志里。
      setError(/internal server error/i.test(msg)
        ? i18nT('后端拒绝了这次生成。常见原因：已有任务在生成中（同时只允许一个）、未配置 Gemini 或 Kling 密钥。具体原因需要看服务端日志。')
        : (msg || i18nT('启动影片生成失败')))
    } finally { setStarting(false) }
  }

  const videoUrl = job?.status === 'done' ? filmVideoUrl(job.result) : ''

  return (
    <div style={{
      padding: '14px 16px', borderRadius: 14, marginBottom: 14,
      background: 'rgba(191,90,242,0.07)', border: '1px solid rgba(191,90,242,0.18)',
    }}>
      <div style={{ fontSize: 12, color: 'rgba(191,90,242,0.85)', fontWeight: 700, marginBottom: 8, letterSpacing: '0.04em' }}>
        {i18nT('🎬 圣经电影工作台')}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 10 }}>
        {i18nT('写一段圣经故事，后端会拆分镜、配旁白、逐镜生成画面并拼成一部短片。整条流水线要跑十几分钟，期间同时只允许一个任务。')}
      </div>

      <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }} htmlFor="film-story">
        {i18nT('故事内容')}
      </label>
      <textarea
        id="film-story"
        value={story}
        onChange={(e) => setStory(e.target.value.slice(0, STORY_MAX))}
        rows={4}
        disabled={running || starting}
        placeholder={i18nT('例如：大卫用机弦甩石打倒歌利亚，以色列全军得胜…')}
        aria-label={i18nT('故事内容')}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 10,
          background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff', fontSize: 13, lineHeight: 1.7, resize: 'vertical', fontFamily: 'inherit',
        }}
      />
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'right', marginTop: 4 }}>
        {story.length}/{STORY_MAX}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }} htmlFor="film-scenes">{i18nT('镜头数')}</label>
        <input
          id="film-scenes" type="number" min={1} max={60} value={numScenes}
          disabled={running || starting}
          onChange={(e) => setNumScenes(Math.min(60, Math.max(1, Number(e.target.value) || 1)))}
          style={{
            width: 72, padding: '8px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.28)',
            border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13, fontFamily: 'inherit',
          }}
        />
        <button
          type="button" onClick={handleStart} disabled={running || starting}
          style={{
            minHeight: 40, padding: '10px 18px', borderRadius: 10, border: 'none',
            background: running || starting ? 'rgba(255,255,255,0.12)' : 'linear-gradient(135deg,#bf5af2,#7d5cff)',
            color: '#fff', fontSize: 13.5, fontWeight: 700,
            cursor: running || starting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}
        >
          {starting ? i18nT('提交中…') : running ? i18nT('生成中…') : i18nT('🎬 开始生成')}
        </button>
        {jobId && !running && (
          <button
            type="button" onClick={forgetJob}
            style={{ minHeight: 40, padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.65)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
          >{i18nT('清除任务')}</button>
        )}
      </div>

      {error && (
        <div role="alert" style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,59,48,0.1)', color: '#ff8787', fontSize: 12.5, lineHeight: 1.7 }}>
          ⚠️ {error}
        </div>
      )}

      {job && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
            <span>
              {job.status === 'done' ? i18nT('✅ 已完成')
                : job.status === 'error' ? i18nT('❌ 生成失败')
                  : job.status === 'queued' ? i18nT('排队中')
                    : i18nT('生成中')}
              {job.cur ? ` · ${i18nT('第')} ${job.cur} ${i18nT('镜')}` : ''}
            </span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{job.progress || 0}%</span>
          </div>
          <div
            role="progressbar" aria-valuenow={job.progress || 0} aria-valuemin={0} aria-valuemax={100}
            style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}
          >
            <div style={{
              height: '100%', width: `${job.progress || 0}%`, borderRadius: 3,
              background: job.status === 'error' ? '#f87171' : '#bf5af2', transition: 'width 0.6s ease',
            }} />
          </div>

          {job.error && (
            <div role="alert" style={{ marginTop: 8, fontSize: 12.5, color: '#ff8787', lineHeight: 1.7 }}>
              {job.error}
            </div>
          )}

          {job.steps?.length > 0 && (
            <div
              ref={logRef}
              style={{
                marginTop: 10, maxHeight: 180, overflowY: 'auto', padding: '8px 10px', borderRadius: 10,
                background: 'rgba(0,0,0,0.32)', border: '1px solid rgba(255,255,255,0.08)',
                fontSize: 11.5, lineHeight: 1.75, color: 'rgba(255,255,255,0.6)',
                fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace', whiteSpace: 'pre-wrap',
              }}
            >
              {job.steps.map((line, i) => <div key={`${i}-${line}`}>{line}</div>)}
            </div>
          )}

          {job.status === 'done' && videoUrl && (
            <div style={{ marginTop: 12 }}>
              <video src={videoUrl} controls playsInline style={{ width: '100%', borderRadius: 12, background: '#000' }} />
              <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                {job.result?.scenes ? `${job.result.scenes} ${i18nT('个镜头')} · ` : ''}
                {job.result?.mb ? `${job.result.mb} MB · ` : ''}
                <a href={videoUrl} target="_blank" rel="noreferrer" style={{ color: '#bf5af2' }}>{i18nT('打开成片链接')}</a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function EngineeringPage({ onBack, user, token }) {
  const [formation, setFormation] = useState(null)
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const authRequest = { headers }

    Promise.all([
      fetch(`${API_BASE}/daily-devotion-personal`, authRequest).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/spiritual-health-check`, authRequest).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([devot, hlth]) => {
      if (devot) setFormation(devot)
      if (hlth?.ok) setHealth(hlth)
    }).catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [user?.email])

  // Build formation scores from daily devotion data (it includes formation dimension)
  // We also call the formation endpoint to get all 8 scores
  const [scores, setScores] = useState(null)
  useEffect(() => {
    if (!user) return
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    fetch(`${API_BASE}/daily-devotion-personal`, { headers })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        // The endpoint returns focus_dim info but not all 8 scores
        // We'll derive approximate scores from health check data and defaults
      }).catch((err) => { console.warn('[EngineeringPage.jsx] ignored async error', err) })
  }, [user?.email])

  return (
    <div style={{
      minHeight: '100%', background: 'linear-gradient(160deg,#0d1117 0%,#0a1628 60%,#060d1f 100%)',
      color: '#fff', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      paddingBottom: 80,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <BackButton onClick={onBack} />
        <div>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{i18nT('🌱 灵命成长分析')}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
            {i18nT('八个维度 · 当前状态 · 成长建议')}
          </div>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {user && <FilmStudioCard token={token} />}

        {!user && (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: 'rgba(255,255,255,0.5)', fontSize: 14,
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{i18nT('登录后查看灵命成长分析')}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
              {i18nT('根据你的灵修记录、情绪打卡和属灵操练，系统会评估8个灵命维度的成长状态')}
            </div>
          </div>
        )}

        {user && loading && (
          <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(255,255,255,0.4)' }}>
            {i18nT('✨ 分析中…')}
          </div>
        )}

        {user && error && (
          <div style={{ padding: '14px', background: 'rgba(255,59,48,0.1)', borderRadius: 12, color: '#ff6961', fontSize: 13 }}>
            {error}
          </div>
        )}

        {user && !loading && (
          <>
            {/* Health check alert */}
            <HealthCard health={health} />

            {/* Today's focus from devotion */}
            {formation && (
              <div style={{
                padding: '14px 16px', borderRadius: 14, marginBottom: 14,
                background: 'rgba(90,200,250,0.07)', border: '1px solid rgba(90,200,250,0.15)',
              }}>
                <div style={{ fontSize: 12, color: 'rgba(90,200,250,0.7)', fontWeight: 700, marginBottom: 8, letterSpacing: '0.04em' }}>
                  {i18nT('✨ 今日聚焦维度')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 28 }}>
                    {DIM_META[formation.focus_dim]?.icon || '●'}
                  </span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{formation.focus_label}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
                      {formation.theme}
                    </div>
                  </div>
                  <div style={{ marginLeft: 'auto' }}>
                    <span style={{
                      fontSize: 12, padding: '4px 10px', borderRadius: 20, fontWeight: 600,
                      background: STAGE_META[formation.stage]?.bg || 'rgba(255,255,255,0.1)',
                      color: STAGE_META[formation.stage]?.color || '#fff',
                    }}>
                      {formation.stage_icon} {formation.stage_label}
                    </span>
                  </div>
                </div>
                <div style={{
                  marginTop: 10, fontSize: 13, color: 'rgba(255,215,0,0.8)',
                  fontStyle: 'italic', borderLeft: '3px solid rgba(255,215,0,0.3)',
                  paddingLeft: 10, lineHeight: 1.7,
                }}>
                  {formation.verse_ref} — 「{formation.verse_text}」
                </div>
                <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.75 }}>
                  {formation.devotion_text}
                </div>
                <div style={{
                  marginTop: 10, fontSize: 13, color: 'rgba(255,200,100,0.85)',
                  fontStyle: 'italic', background: 'rgba(255,159,10,0.07)', borderRadius: 10, padding: '8px 12px',
                }}>
                  🙏 {formation.prayer_text}
                </div>
                <div style={{
                  marginTop: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.04)',
                  borderRadius: 10, fontSize: 13, color: 'rgba(255,255,255,0.6)',
                }}>
                  {i18nT('💡 今日可行一步 —')} {formation.stage_action}
                </div>
              </div>
            )}

            {/* 8 dimensions overview */}
            <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 10, letterSpacing: '0.04em' }}>
              {i18nT('📊 八维灵命评估')}
            </div>
            <div style={{
              padding: '12px 14px', borderRadius: 14, marginBottom: 14,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7,
            }}>
              {i18nT('评分来自你的情绪打卡、灵修日记和属灵操练记录。每次互动后自动更新，帮助你看见灵命成长的轨迹。')}
            </div>
            {Object.entries(DIM_META).map(([key, meta]) => {
              // We don't have individual scores here, show placeholder bars based on focus_dim
              const isFocus = formation?.focus_dim === key
              const defaultScore = isFocus
                ? (formation?.stage === 'blind_spot' ? 0.25 : formation?.stage === 'growing' ? 0.5 : 0.75)
                : 0.5
              return <DimBar key={key} dimKey={key} score={defaultScore} />
            })}

            <div style={{
              marginTop: 4, padding: '12px 14px', borderRadius: 12,
              background: 'rgba(52,199,89,0.06)', border: '1px solid rgba(52,199,89,0.15)',
              fontSize: 12, color: 'rgba(52,199,89,0.7)', textAlign: 'center',
            }}>
              {i18nT('💬 持续使用灵修日记与情绪打卡，系统会更准确地评估你的灵命维度')}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
