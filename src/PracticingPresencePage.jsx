import { t as i18nT } from './i18n/runtime'
/**
 * PracticingPresencePage — 操练与神同在 (B2)。入口：今日心镜。
 *
 * 音频层（可选、加法）：劳伦斯弟兄的「时时操练同在」本来就是不看屏幕的操练——
 * 手里在做事，心里回到神面前。所以这里加的是「整点锚点」：一声轻钟 + 一句短话，
 * 不需要看、不需要点。
 *
 * ⚠ 诚实说明：这一页没有后台调度能力（无 Service Worker 推送、无本地通知权限），
 * 所以锚点只在**这个页面开着的时候**生效。UI 文案必须照实说，不能承诺做不到的事。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import BackButton from './BackButton'
import { formationApi } from './api'
import { getToken } from './auth'
import { useGuidedAudio } from './lib/media/useGuidedAudio'
import { useRhythmTone } from './lib/media/useRhythmTone'
import { useHaptics } from './lib/media/useHaptics'
import { useMediaPrefs } from './lib/media/useMediaPrefs'
import { MediaToggleRow } from './lib/media/MediaControls'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { cursor: 'pointer', borderRadius: 10, padding: '10px 14px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(125,211,252,0.85), rgba(52,199,89,0.6))' }
const fld = { width: '100%', padding: 10, borderRadius: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }

// 整点锚点的短句：一句就够。太长会变成又一个要「完成」的任务，
// 而这个操练的重点恰恰是不增加任务，只是回头看祂一眼。
const ANCHOR_LINES = [
  i18nT('主啊，我在这里。祢也在这里。'),
  i18nT('停一下。这一刻，祂正看着你。'),
  i18nT('把手上的这件事，做给祂看。'),
  i18nT('松一口气。你不必自己撑住一切。'),
  i18nT('主啊，谢谢祢刚才这一个小时。'),
  i18nT('回到祂面前，就在这里，不用换地方。'),
]

function nextHourDelayMs(now = new Date()) {
  const ms = (60 - now.getMinutes()) * 60000 - now.getSeconds() * 1000 - now.getMilliseconds()
  return Math.max(1000, ms)
}

function hhmm(ts) {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function PracticingPresencePage({ user, onBack }) {
  const [context, setContext] = useState('')
  const [recs, setRecs] = useState([])
  const [checkin, setCheckin] = useState(null)
  const [prayer, setPrayer] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reflection, setReflection] = useState(null)

  const { prefs } = useMediaPrefs()
  const guided = useGuidedAudio()
  const tone = useRhythmTone()
  const haptics = useHaptics()
  const [anchorOn, setAnchorOn] = useState(false)
  const [nextAnchorAt, setNextAnchorAt] = useState(null)
  const anchorIdxRef = useRef(0)

  useEffect(() => { const t = getToken(); if (t) formationApi.presenceReflection(t).then(setReflection).catch((err) => { console.warn('[PracticingPresencePage.jsx] ignored async error', err) }) }, [])

  // 一次锚点 = 轻钟 + 一次轻振动 + 一句短话。钟先响，是为了让人先「听见」再「听懂」。
  const fireAnchor = useCallback(() => {
    tone.chime()
    haptics.vibrate('tap')
    const line = ANCHOR_LINES[anchorIdxRef.current % ANCHOR_LINES.length]
    anchorIdxRef.current += 1
    // 稍等一下再说话，别和钟声叠在一起
    setTimeout(() => { guided.start([{ text: line, pauseAfter: 0 }], { rate: 0.85 }) }, 900)
  }, [guided, haptics, tone])

  const fireRef = useRef(fireAnchor)
  useEffect(() => { fireRef.current = fireAnchor }, [fireAnchor])

  // 整点提醒：只能在页面开着时生效（见文件头说明），所以用 setTimeout 链对齐到下一个整点。
  useEffect(() => {
    if (!anchorOn) { setNextAnchorAt(null); return undefined }
    let timer = null
    const schedule = () => {
      const delay = nextHourDelayMs()
      setNextAnchorAt(Date.now() + delay)
      timer = setTimeout(() => { fireRef.current(); schedule() }, delay)
    }
    schedule()
    return () => { if (timer) clearTimeout(timer) }
  }, [anchorOn])

  // 离开页面时把声音全部收干净
  useEffect(() => () => { guided.stop(); tone.stopAll() }, [guided.stop, tone.stopAll])

  async function recommend() {
    const t = getToken(); setBusy(true); setError('')
    try { const r = await formationApi.recommendPresence({ context_label: context, emotion: context }, t); setRecs(r.practices || []) }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function start(p) {
    const t = getToken(); setBusy(true); setError('')
    try { const r = await formationApi.startPresenceCheckin({ practice_key: p.practice_key, context_label: context }, t); setCheckin({ practice: p, id: r.checkin.id }); setPrayer('') }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }
  async function done() {
    const t = getToken(); setBusy(true); setError('')
    try { await formationApi.completePresenceCheckin(checkin.id, { short_prayer: prayer }, t); setCheckin(null); setRecs([]); setContext(''); const rf = await formationApi.presenceReflection(t); setReflection(rf) }
    catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }
  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('🌿 操练与神同在')}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>{i18nT('30–60 秒，短而频地回到神面前 · 不是打卡')}</div>
      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}

      {/* 整点锚点：不看屏幕的那一半操练 */}
      <div style={card}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{i18nT('🔔 整点锚点')}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 10, lineHeight: 1.7 }}>
          {i18nT('每到整点，一声轻钟加一句短话，把你叫回祂面前。手上的事不用停。')}
        </div>
        <MediaToggleRow show={['sound', 'haptics']} compact />
        {prefs.sound ? (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                type="button"
                style={{ ...btn, background: anchorOn ? 'rgba(52,199,89,0.28)' : 'rgba(255,255,255,0.08)' }}
                onClick={() => setAnchorOn(v => !v)}
              >
                {anchorOn ? `⏹ ${i18nT('停止整点锚点')}` : `🔔 ${i18nT('开启整点锚点')}`}
              </button>
              <button type="button" style={{ ...btn, background: 'rgba(255,255,255,0.08)' }} onClick={() => fireRef.current()}>
                {i18nT('现在就来一次')}
              </button>
            </div>
            {anchorOn && nextAnchorAt && (
              <div style={{ fontSize: 12, color: '#8be9c0', marginTop: 8 }} aria-live="polite">
                {i18nT('下一次：')}{hhmm(nextAnchorAt)}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>
            {i18nT('打开上面的「声音」，就可以让整点的轻钟和短句陪你。')}
          </div>
        )}
        {/* 做不到的事就不要承诺 */}
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginTop: 10, lineHeight: 1.6 }}>
          {i18nT('只在这个页面开着的时候有效。关掉页面、切到别的应用或锁屏，锚点就会停——它不是后台提醒。')}
        </div>
      </div>

      {checkin ? (
        <div style={card}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{checkin.practice.title}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>{checkin.practice.description}</div>
          <input value={prayer} onChange={e => setPrayer(e.target.value)} placeholder={i18nT('一句短祷（可选）')} style={fld}  aria-label={i18nT('一句短祷（可选）')}/>
          <button style={btn} disabled={busy} onClick={done}>{i18nT('完成')}</button>
        </div>
      ) : (
        <div style={card}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={context} onChange={e => setContext(e.target.value)} placeholder={i18nT('此刻的情境/情绪（如：工作焦虑、通勤、疲惫）')} style={{ ...fld, marginBottom: 0, flex: 1 }}  aria-label={i18nT('此刻的情境/情绪（如：工作焦虑、通勤、疲惫）')}/>
            <button style={btn} disabled={busy} onClick={recommend}>{i18nT('推荐')}</button>
          </div>
          {recs.map(p => (
            <div key={p.practice_key} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '2px 0 6px' }}>{p.description}</div>
              <button style={{ ...btn, padding: '5px 12px', fontSize: 12 }} onClick={() => start(p)}>{i18nT('开始（')}{p.duration_seconds}s）</button>
            </div>
          ))}
        </div>
      )}

      {reflection && reflection.insights && (
        <div style={card}>
          {reflection.insights.map((i, k) => <div key={k} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>· {i}</div>)}
        </div>
      )}
    </div>
  )
}
