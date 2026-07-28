import { t as i18nT } from './i18n/runtime'
/**
 * LectioPage — 圣经默想 Lectio Divina（读经 → 默想 → 祷告 → 默观 → 顺服）
 *
 * 慢读一段经文，留意触动你的字句，在神面前默想，从经文出发祷告，
 * 安静默观，最后选择一个 24 小时内的具体顺服。入口：今日心镜 (SoulDashboard)。
 * 任一步的文字若流露属灵危机，会温柔地提示寻求即时陪伴（不阻断保存）。
 *
 * 音频层（可选、加法）：Lectio 本来就是闭着眼睛做的操练，
 * 盯着屏幕读引导语其实与它相冲突。打开「声音」后每一步会「念一句 → 安静 N 秒」，
 * 留白期间显示倒计时环。关掉声音，这一页与从前完全一样。
 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import {
  fetchDailyLectio, fetchLectioPassages,
  createLectioSession, submitLectioStage, completeLectioSession,
} from './api'
import { getToken } from './auth'
import { useGuidedAudio } from './lib/media/useGuidedAudio'
import { useAmbience } from './lib/media/useAmbience'
import { useMediaPrefs } from './lib/media/useMediaPrefs'
import { GuidedAudioBar, MediaToggleRow, CountdownRing } from './lib/media/MediaControls'

const STAGE_META = {
  read:        { icon: '📖', title: '读经 · 慢读', ph: '哪一个字、词或画面停留在你心里？' },
  meditate:    { icon: '🤍', title: '默想 · 联于生活', ph: '它触到你的什么渴望、惧怕、盼望或亏欠？' },
  pray:        { icon: '🙏', title: '祷告 · 化为祈求', ph: '把默想化作向神的一句祷告…' },
  contemplate: { icon: '🕊', title: '默观 · 安静同在', ph: '不必做什么，只记下此刻与神同在的感受…' },
  obey:        { icon: '🌱', title: '顺服 · 一个微小行动', ph: '一个 24 小时内、具体、可衡量的小顺服…' },
}

// 每一步「说完之后的安静」。Lectio 的重量从来不在字句本身，而在字句落下之后的留白，
// 所以留白按步骤的性质递增：默想要把经文带进生活，比读经需要更久；
// 默观最长（60 秒）且期间不给任何文字——见下面 silentContemplation 的注释。
const STAGE_AUDIO = {
  read:        { pause: 30, line: i18nT('慢慢读这段经文。不追求读完，只留意哪一个字停在你心里。') },
  meditate:    { pause: 45, line: i18nT('把那个字带进你今天的生活。它触到你的什么渴望、惧怕、盼望或亏欠？') },
  pray:        { pause: 30, line: i18nT('把刚才看见的，直接向神说出来。不必修饰，祂听得懂。') },
  contemplate: { pause: 60, line: i18nT('现在什么都不用做。闭上眼睛，只是安静地和祂在一起。') },
  obey:        { pause: 20, line: i18nT('如果祂今天只要你做一件小事，会是什么？') },
}

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { display: 'block', width: '100%', cursor: 'pointer', borderRadius: 12, padding: '12px 16px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(52,199,89,0.85), rgba(90,200,250,0.7))' }
const hintTxt = { fontSize: 11.5, color: 'rgba(255,255,255,0.38)', marginBottom: 12, lineHeight: 1.6 }

function friendlyError(e, fallback) {
  const msg = e?.message || ''
  return /[一-龥]/.test(msg) ? msg : (fallback || '网络不稳定，请稍后重试')
}

export default function LectioPage({ user, onBack }) {
  const [passages, setPassages] = useState([])
  const [daily, setDaily] = useState(null)
  const [selected, setSelected] = useState(null)
  const [session, setSession] = useState(null)
  const [stage, setStage] = useState('read')
  const [guidance, setGuidance] = useState('')
  const [text, setText] = useState('')
  const [keywords, setKeywords] = useState('')
  const [grace, setGrace] = useState('')
  const [crisis, setCrisis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const { prefs } = useMediaPrefs()
  const guided = useGuidedAudio()
  const ambience = useAmbience()

  useEffect(() => {
    const t = getToken(); if (!t) { setLoading(false); return }
    Promise.all([fetchDailyLectio(t).catch(() => ({})), fetchLectioPassages(t).catch(() => ({}))])
      .then(([d, p]) => { setDaily(d.passage || null); setSelected(d.passage || null); setPassages(p.passages || []) })
      .finally(() => setLoading(false))
  }, [])

  // 换步或离开页面都必须停声：上一步的引导语绝不能盖到下一步上去。
  // 依赖用的是稳定的 guided.stop / ambience.stop（而非每次渲染都新建的 guided 对象），
  // 否则播报中的每一次 setState 都会触发清理、把自己的声音掐掉。
  useEffect(() => () => { guided.stop(); ambience.stop() }, [stage, guided.stop, ambience.stop])

  async function start() {
    const t = getToken(); if (!t || !selected) return
    setBusy(true); setError('')
    try {
      const r = await createLectioSession(selected.id, t)
      setSession(r.session); setStage(r.session.stage || 'read'); setGuidance(r.guidance || ''); setCrisis(null); setText(''); setKeywords('')
    } catch (e) { setError(friendlyError(e, '开始默想失败')) } finally { setBusy(false) }
  }

  async function next() {
    const t = getToken(); if (!t || !session) return
    setBusy(true); setError('')
    try {
      const payload = { stage, text, key_words: stage === 'read' ? keywords.split(/[,，\s]+/).filter(Boolean) : [] }
      const r = await submitLectioStage(session.id, payload, t)
      setSession(r.session); setStage(r.next_stage); setGuidance(r.guidance || ''); setCrisis(r.crisis || null); setText('')
    } catch (e) { setError(friendlyError(e, '保存失败')) } finally { setBusy(false) }
  }

  async function finish() {
    const t = getToken(); if (!t || !session) return
    if (!text.trim()) { setError(i18nT('需要一个具体的顺服行动才能完成')); return }
    setBusy(true); setError('')
    try {
      const r = await completeLectioSession(session.id, { obedience_action: text, grace_received: grace }, t)
      setSession(r.session); setStage('completed'); setGuidance(r.guidance || ''); setCrisis(r.crisis || null)
    } catch (e) { setError(friendlyError(e, '完成失败')) } finally { setBusy(false) }
  }

  // 「念一句 → 安静 N 秒」。读经这一步会先把经文本身慢慢念一遍再进入留白。
  function startStageAudio() {
    const conf = STAGE_AUDIO[stage]
    if (!conf) return
    // 默观期间铺一层极轻的底噪：安静不等于真空，有一点点声音反而更容易待得住。
    if (stage === 'contemplate') ambience.start('hush')
    const steps = []
    if (stage === 'read' && selected?.passage_text) {
      steps.push({ text: selected.passage_text, pauseAfter: 6, label: STAGE_META.read.title })
    }
    steps.push({ text: guidance || conf.line, pauseAfter: conf.pause, label: STAGE_META[stage]?.title })
    // rate 0.85：默想式朗读要比正常语速慢，让人跟得上、也跟得进去。
    guided.start(steps, { rate: 0.85, onComplete: () => ambience.stop() })
  }

  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }

  if (loading) return <div style={wrap}><BackButton onClick={onBack} />{i18nT('加载中…')}</div>

  const meta = STAGE_META[stage]
  const pauseLen = STAGE_AUDIO[stage]?.pause || 0
  const ringProgress = pauseLen > 0 && guided.state === 'waiting' ? (pauseLen - guided.remaining) / pauseLen : 0
  // 默观的整个音频段（念完那一句 + 60 秒留白）刻意不显示任何文字：
  // 默观不是「再读一段提示」，而是停止用语言处理神。文字会把人拉回分析模式，
  // 所以这里只留倒计时环；播报结束后表单原样回来，随时可以写下感受。
  const silentContemplation = stage === 'contemplate' && guided.running

  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('📖 圣经默想 · Lectio Divina')}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>{i18nT('读经 · 默想 · 祷告 · 默观 · 一个微顺服')}</div>

      {error && <div style={{ ...card, borderColor: 'rgba(255,107,107,0.4)', color: '#ffb4b4' }}>{error}</div>}

      {crisis && (
        <div style={{ ...card, background: 'rgba(255,107,107,0.10)', borderColor: 'rgba(255,107,107,0.35)' }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>💗 {crisis.message}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{crisis.note}</div>
        </div>
      )}

      {/* 选择经文 + 开始 */}
      {!session && (
        <div style={card}>
          {selected && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#8be9c0' }}>{selected.ref}{daily && selected.id === daily.id ? ' · 今日推荐' : ''}</div>
              <div style={{ fontSize: 14, lineHeight: 1.8, marginTop: 6, color: 'rgba(255,255,255,0.9)' }}>{selected.passage_text}</div>
            </div>
          )}
          <select value={selected?.id || ''} onChange={e => setSelected(passages.find(p => p.id === e.target.value) || daily)}
            style={{ width: '100%', padding: 10, borderRadius: 10, marginBottom: 12, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
            {passages.map(p => <option key={p.id} value={p.id}>{p.ref}</option>)}
          </select>
          <button style={btn} disabled={busy || !selected} onClick={start}>{busy ? '…' : '开始默想'}</button>
        </div>
      )}

      {/* 五步流程 */}
      {session && stage !== 'completed' && (
        <div style={card}>
          {session.passage_ref && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>{session.passage_ref}</div>}
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{meta.icon} {meta.title}</div>

          {/* 音频层：默认不响，用户自己开、自己点播放 */}
          {/* 默观的留白里连开关行都收起来，屏幕上只剩倒计时环 */}
          {!silentContemplation && <MediaToggleRow show={['sound', 'ambience']} compact />}
          {prefs.sound ? (
            <GuidedAudioBar
              guided={guided}
              onStart={startStageAudio}
              label="听这一步，然后安静"
              hint={`${i18nT('念完会安静')} ${pauseLen}s`}
            />
          ) : (
            <div style={hintTxt}>{i18nT('打开上面的「声音」，就可以闭着眼睛听引导，并跟着留白安静。')}</div>
          )}

          {/* 留白倒计时：这段安静才是 Lectio 真正在做的事 */}
          {guided.state === 'waiting' && (
            <div style={{ display: 'grid', placeItems: 'center', margin: '6px 0 14px' }}>
              <CountdownRing
                progress={ringProgress}
                color={stage === 'contemplate' ? '#a6b8ff' : '#5ac8fa'}
                label={`${i18nT('安静还剩')} ${guided.remaining} ${i18nT('秒')}`}
              >
                {guided.remaining}s
              </CountdownRing>
            </div>
          )}

          {!silentContemplation && (
            <>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>{guidance || meta.ph}</div>
              {stage === 'read' && (
                <input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder={i18nT('触动你的字 / 词（用逗号分隔）')}
                  style={{ width: '100%', padding: 10, borderRadius: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}  aria-label={i18nT('触动你的字 / 词（用逗号分隔）')}/>
              )}
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder={meta.ph} rows={4}
                style={{ width: '100%', padding: 10, borderRadius: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', resize: 'vertical' }}  aria-label={meta.ph}/>
              {stage === 'obey' && (
                <input value={grace} onChange={e => setGrace(e.target.value)} placeholder={i18nT('今天领受到的恩典（可选）')}
                  style={{ width: '100%', padding: 10, borderRadius: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}  aria-label={i18nT('今天领受到的恩典（可选）')}/>
              )}
              {stage === 'obey'
                ? <button style={btn} disabled={busy} onClick={finish}>{busy ? '…' : i18nT('完成默想')}</button>
                : <button style={btn} disabled={busy} onClick={next}>{busy ? '…' : i18nT('下一步 ›')}</button>}
            </>
          )}
        </div>
      )}

      {/* 完成 */}
      {stage === 'completed' && session && (
        <div style={card}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{i18nT('🌱 愿这段话今天与你同行')}</div>
          <div style={{ fontSize: 13, marginBottom: 6 }}><b>{i18nT('经文：')}</b>{session.passage_ref}</div>
          {session.obedience_action && <div style={{ fontSize: 13, marginBottom: 6 }}><b>{i18nT('今日顺服：')}</b>{session.obedience_action}</div>}
          {session.grace_received && <div style={{ fontSize: 13, marginBottom: 6 }}><b>{i18nT('领受的恩典：')}</b>{session.grace_received}</div>}
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>{i18nT('完成度')} {session.completion_score}%</div>
          <button style={{ ...btn, marginTop: 12 }} onClick={onBack}>{i18nT('返回')}</button>
        </div>
      )}
    </div>
  )
}
