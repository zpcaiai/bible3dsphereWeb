import { t as i18nT } from './i18n/runtime'
/**
 * ExamenPage — 每日省察 Examen（依纳爵式）
 *
 * 回顾今天的「安慰 / 枯涩」，感恩一件、求恕一件、明日一个微顺服。
 * 不定罪、温柔陪伴。入口：今日心镜 (SoulDashboard) 卡片。
 *
 * 音频层（可选、加法）：依纳爵的省察本来是「被人问、在心里答」的操练——
 * 问题被念出来、然后留一段够长的安静，比盯着五个输入框更接近它本来的样子。
 * 打开「声音」后可以闭着眼睛被一路问下来；关掉声音，这一页与从前完全一样。
 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { fetchExamenToday, saveExamen, fetchExamenHistory } from './api'
import { getToken } from './auth'
import useDraft from './useDraft'
import { SuggestMenu } from './components/SuggestField'
import { useGuidedAudio } from './lib/media/useGuidedAudio'
import { useHaptics } from './lib/media/useHaptics'
import { useMediaPrefs } from './lib/media/useMediaPrefs'
import { GuidedAudioBar, MediaToggleRow, CountdownRing } from './lib/media/MediaControls'

const FIELD_MAX = 500
const EXAMEN_OPTS = {
  consolation: ['今天读经时心里被触动', '有人关心我 / 我关心了别人', '工作 / 学习中经历平安', '在祷告中感到与神亲近', '在一处小事里看见恩典', '危机中有意外的帮助'],
  desolation: ['忙碌中忘了神', '因某事焦虑 / 烦躁', '和人起了冲突', '感到孤单 / 不被理解', '被诱惑或软弱绊倒', '心里冷淡、不想祷告'],
  gratitude: ['为今天的饮食 / 平安', '为一位家人 / 朋友', '为神的话语', '为一次及时的帮助', '为健康 / 工作', '为主的赦免与同在'],
  confession: ['求主赦免我的骄傲', '把焦虑交托给主', '饶恕那位伤害我的人', '放下对结果的掌控', '承认我的拖延 / 懒散', '交还我紧抓的人或事'],
  tomorrow_step: ['明天主动问候一个人', '早起留十分钟读经', '向一个人表达感谢', '节制使用手机', '为一件事专心祷告', '完成一直拖延的小事'],
}

function friendlyError(e, fallback) {
  const msg = e?.message || ''
  return /[一-龥]/.test(msg) ? msg : (fallback || '网络不稳定，请稍后重试')
}

const FIELDS = [
  { key: 'consolation',   icon: '🌤', title: '安慰 · 神的同在',
    prompt: '今天哪一刻，我感到被爱、被陪伴，或心里有平安？', ph: '一个画面、一句话、一件小事…' },
  { key: 'desolation',    icon: '🌫', title: '枯涩 · 远离',
    prompt: '今天哪一刻，我感到焦虑、远离神，或失了平安？', ph: '诚实地写下，无需修饰…' },
  { key: 'gratitude',     icon: '🙏', title: '感恩一件',
    prompt: '今天我要为哪一件事，向神说谢谢？', ph: '哪怕很小…' },
  { key: 'confession',    icon: '🕊', title: '求恕 · 交托',
    prompt: '有什么我想求神赦免、或交在祂手中？', ph: '不是为了定罪，是为了被释放…' },
  { key: 'tomorrow_step', icon: '🌱', title: '明日一个微顺服',
    prompt: '明天我可以忠心去做的一件小事是什么？', ph: '一个具体、微小、可完成的行动…' },
]

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const hintTxt = { fontSize: 11.5, color: 'rgba(255,255,255,0.38)', marginBottom: 12, lineHeight: 1.6 }

// 每一问之后的安静。长度按「在心里真的答完它要多久」定，不是按朗读长度定：
// 安慰 / 枯涩要把一整天重演一遍，最久；感恩与明日一步只需想起一件事，短一些。
const EXAMEN_SILENCE = {
  consolation: 40,
  desolation: 40,
  gratitude: 30,
  confession: 40,
  tomorrow_step: 25,
}
const EXAMEN_OPENING = i18nT('安静下来。让这一天在神面前慢慢重演一遍——不为打分，只为看见祂在哪里。')
const EXAMEN_CLOSING = i18nT('好了。慢慢睁开眼睛，把刚才看见的写下来就好。')

export default function ExamenPage({ user, onBack, onNeedLogin }) {
  const [vals, setVals] = useState({ consolation: '', desolation: '', gratitude: '', confession: '', tomorrow_step: '', consolation_level: 5 })
  const [view, setView] = useState('today')   // today | history
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // 草稿自动保存（多字段表单，约 800ms 防抖）
  const { savedHint, clearDraft } = useDraft('examen-draft-v1', vals, (restored) => setVals(v => ({ ...v, ...restored })))

  const { prefs } = useMediaPrefs()
  const guided = useGuidedAudio()
  const haptics = useHaptics()
  const [audioField, setAudioField] = useState(null)   // 正在被问的那一栏

  // 离开页面 / 切到历史视图时都停声。依赖用稳定的 guided.stop，
  // 若依赖整个 guided 对象，播报中每次 setState 都会触发清理、把声音掐掉。
  useEffect(() => () => guided.stop(), [guided.stop])
  useEffect(() => { if (view !== 'today') guided.stop() }, [view, guided.stop])
  useEffect(() => { if (!guided.running) setAudioField(null) }, [guided.running])

  // 「念一问 → 安静一段 → 再念下一问」。不自动播放，由用户点开始。
  function startExamenAudio() {
    const steps = [
      { text: EXAMEN_OPENING, pauseAfter: 6, onEnter: () => setAudioField(null) },
      ...FIELDS.map(f => ({
        label: f.title,
        text: `${f.title}。${f.prompt}`,
        pauseAfter: EXAMEN_SILENCE[f.key] || 30,
        // 闭着眼睛时，一次轻振动就知道「换下一问了」，不必睁眼确认
        onEnter: () => { setAudioField(f.key); haptics.vibrate('tap') },
      })),
      { text: EXAMEN_CLOSING, pauseAfter: 0, onEnter: () => setAudioField(null) },
    ]
    // rate 0.85：省察的问题要问得慢，快了就变成问卷。
    guided.start(steps, { rate: 0.85, onComplete: () => setAudioField(null) })
  }

  useEffect(() => {
    const t = getToken(); if (!t) { setLoading(false); return }
    fetchExamenToday(t)
      .then(r => { if (r.entry) setVals(v => ({ ...v, ...r.entry })) })
      .catch((err) => { console.warn('[ExamenPage.jsx] ignored async error', err) })
      .finally(() => setLoading(false))
  }, [])

  function set(k, val) { setVals(v => ({ ...v, [k]: val })); setSaved(false) }

  async function save() {
    const t = getToken(); if (!t) { onNeedLogin && onNeedLogin(); return }
    setSaving(true); setError('')
    try {
      await saveExamen({
        consolation: vals.consolation, desolation: vals.desolation,
        gratitude: vals.gratitude, confession: vals.confession,
        tomorrow_step: vals.tomorrow_step, consolation_level: vals.consolation_level,
      }, t)
      setSaved(true)
      clearDraft()
    } catch (e) { setError(friendlyError(e, '保存失败，请稍后重试')) }
    finally { setSaving(false) }
  }

  async function openHistory() {
    const t = getToken(); if (!t) { onNeedLogin && onNeedLogin(); return }
    try { const r = await fetchExamenHistory(t, 30); setHistory(r.entries || []); setView('history') }
    catch (e) { setError(friendlyError(e, '加载失败，请稍后重试')) }
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#000', color: '#fff', overflowY: 'auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(28,28,30,0.92)', position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BackButton onClick={onBack} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{i18nT('今日省察')}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{i18nT('依纳爵式 Examen · 与神同回顾这一天')}</div>
          </div>
        </div>
        <button onClick={view === 'history' ? () => setView('today') : openHistory} style={pill}>
          {view === 'history' ? '← 返回' : '历史'}
        </button>
      </div>

      <div style={{ padding: '14px 16px 100px', maxWidth: 680, margin: '0 auto' }}>
        {error && <div style={{ ...card, borderColor: 'rgba(255,135,135,0.4)', color: '#ff8787', fontSize: 13 }}>{error}</div>}

        {view === 'today' && (
          <>
            <div style={{ ...card, background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(90,200,250,0.08))' }}>
              <div style={{ fontSize: 13, lineHeight: 1.75, color: 'rgba(255,255,255,0.8)' }}>
                {i18nT('安静一分钟。让这一天在神面前重演一遍——不为打分，只为看见祂在哪里， 也把心交还给祂。')}
              </div>
            </div>

            {/* 音频层：默认不响，用户自己开、自己点播放 */}
            <MediaToggleRow show={['sound', 'haptics']} compact />
            {prefs.sound ? (
              <GuidedAudioBar
                guided={guided}
                onStart={startExamenAudio}
                label="闭上眼睛，让我一问一问地带你回顾"
                hint={i18nT('五个问题，每问之后有一段安静')}
              />
            ) : (
              <div style={hintTxt}>{i18nT('打开上面的「声音」，就可以闭着眼睛听问题，并在安静里回答。')}</div>
            )}

            {/* 亲近感 */}
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'rgba(255,255,255,0.8)' }}>{i18nT('今天，我感到与神有多亲近？')}</span>
                <span style={{ color: '#a78bfa', fontWeight: 700 }}>{vals.consolation_level}</span>
              </div>
              <input type="range" min="0" max="10" step="1" value={vals.consolation_level}
                onChange={e => set('consolation_level', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#a78bfa', marginTop: 8 }} />
            </div>

            {FIELDS.map(f => {
              const asking = audioField === f.key
              const silence = EXAMEN_SILENCE[f.key] || 30
              // 倒计时只在留白阶段出现：那段安静才是在回答问题的时候
              const waiting = asking && guided.state === 'waiting'
              return (
              <div key={f.key} style={{ ...card, ...(asking ? { borderColor: 'rgba(167,139,250,0.55)', background: 'rgba(167,139,250,0.08)' } : null) }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 4 }}>{f.icon} {f.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, lineHeight: 1.6 }}>{f.prompt}</div>
                {waiting && (
                  <div style={{ display: 'grid', placeItems: 'center', margin: '4px 0 12px' }}>
                    <CountdownRing
                      progress={(silence - guided.remaining) / silence}
                      size={80}
                      color="#a78bfa"
                      label={`${i18nT('安静还剩')} ${guided.remaining} ${i18nT('秒')}`}
                    >
                      {guided.remaining}s
                    </CountdownRing>
                  </div>
                )}
                <span style={{ position: 'relative', display: 'block' }}>
                <textarea value={vals[f.key]} onChange={e => set(f.key, e.target.value.slice(0, FIELD_MAX))} rows={2} placeholder={f.ph}
                  aria-label={f.title}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 96px 10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, resize: 'vertical' }} />
                <SuggestMenu accent="#a78bfa" top={8} right={8} options={EXAMEN_OPTS[f.key] || []} value={vals[f.key] || ''} onChange={(v) => set(f.key, v.slice(0, FIELD_MAX))} />
                </span>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', textAlign: 'right', marginTop: 4 }}>{(vals[f.key] || '').length}/{FIELD_MAX}</div>
              </div>
              )
            })}

            {savedHint && <div role="status" style={{ fontSize: 11, color: 'rgba(52,199,89,0.75)', marginBottom: 8 }}>{i18nT('✓ 草稿已自动保存')}</div>}

            <button onClick={save} disabled={saving || loading} style={{ width: '100%', minHeight: 44, padding: 14, borderRadius: 12, border: 'none', background: saved ? 'rgba(52,199,89,0.25)' : 'linear-gradient(135deg, #8b5cf6, #5ac8fa)', color: saved ? '#34c759' : '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {saving ? '保存中…' : saved ? '✓ 已保存今日省察' : '保存今日省察'}
            </button>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
              {i18nT('每天一条；今天的省察会自动覆盖更新。这是温柔的回顾，不是考核。')}
            </div>
          </>
        )}

        {view === 'history' && (
          history.length === 0
            ? <div style={{ ...card, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>{i18nT('还没有省察记录')}</div>
            : history.map(e => (
              <div key={e.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{e.entry_date}</span>
                  <span style={{ fontSize: 11, color: '#a78bfa' }}>{i18nT('亲近感')} {Math.round(e.consolation_level)}</span>
                </div>
                {e.gratitude && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.74)', lineHeight: 1.6 }}>🙏 {e.gratitude}</div>}
                {e.tomorrow_step && <div style={{ fontSize: 12, color: '#5ac8fa', marginTop: 4 }}>🌱 {e.tomorrow_step}</div>}
              </div>
            ))
        )}
      </div>
    </div>
  )
}

const backBtn = { background: 'rgba(120,120,128,0.2)', border: 'none', borderRadius: '50%', width: 36, height: 36, color: '#fff', fontSize: 20, cursor: 'pointer' }
const pill = { background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 14, padding: '6px 12px', color: 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer' }
