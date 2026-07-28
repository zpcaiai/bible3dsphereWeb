import { t as i18nT } from './i18n/runtime'
/**
 * MemoryVersePage — 背经（SM-2 间隔重复）
 * 灵修 tab 子页。复习 / 我的 / 添加。
 *
 * 多模态：朗读 → 分句跟读 → 遮词卡 → 复诵评分。
 * 背诵是多通道的事——听见、说出、看见，都比默读有效。
 * 但这些全是「练习辅助」：没有麦克风、没有网络、关掉声音时，
 * 原来的「回想 → 翻看 → 自评」流程一字不改地照常可用。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { SuggestMenu } from './components/SuggestField'
const MV_OPTS = ['你要专心仰赖耶和华，不可倚靠自己的聪明。(箴3:5)', '应当一无挂虑，只要凡事借着祷告祈求，将所要的告诉神。(腓4:6)', '我靠着那加给我力量的，凡事都能做。(腓4:13)', '耶和华是我的牧者，我必不致缺乏。(诗23:1)', '神爱世人，甚至将他的独生子赐给他们。(约3:16)', '你们要先求他的国和他的义。(太6:33)']
import { addMemoryVerse, fetchMemoryDue, fetchMemoryList, reviewMemoryVerse, deleteMemoryVerse, fetchMemoryMilestones } from './api'
import { getToken } from './auth'
import { TTSButton, stopAllAudio } from './useGlobalAudio'
import { useGuidedAudio } from './lib/media/useGuidedAudio'
import { GuidedAudioBar } from './lib/media/MediaControls'
import { useRecitation } from './lib/media/useRecitation'
import { RECITATION_VERDICT_COPY } from './lib/media/recitationScore'
import { buildClauseSteps, maskVerse, maskPlaceholderEm, buildRecitationTokens, MASK_LEVELS } from './lib/memorizeAids'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, marginBottom: 12 }
const GRADES = [
  { g: 0, label: '忘了', color: '#ff8787' },
  { g: 1, label: '吃力', color: '#ffa94d' },
  { g: 2, label: '记得', color: '#5ac8fa' },
  { g: 3, label: '轻松', color: '#34c759' },
]

export default function MemoryVersePage({ user }) {
  const [tab, setTab] = useState('review')   // review | list | add
  const [due, setDue] = useState([])
  const [list, setList] = useState([])
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [ref, setRef] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [milestones, setMilestones] = useState(null)   // {total, memorized, mastered, next_target, milestones:[]}
  const [maskLevel, setMaskLevel] = useState(0)        // 遮词卡等级 0~4
  const guided = useGuidedAudio()                      // 分句跟读
  const lastCardRef = useRef(null)

  useEffect(() => { loadDue(); loadList(); loadMilestones() }, [])
  async function loadDue() { const t = getToken(); if (!t) return; try { const r = await fetchMemoryDue(t); setDue(r.cards || []); setIdx(0); setRevealed(false) } catch (e) {} }
  async function loadList() { const t = getToken(); if (!t) return; try { const r = await fetchMemoryList(t); setList(r.cards || []) } catch (e) {} }
  async function loadMilestones() { const t = getToken(); if (!t) return; try { const r = await fetchMemoryMilestones(t); if (r.ok) setMilestones(r) } catch (e) {} }

  const cur = due[idx] || null
  const curText = cur?.verse_text || ''

  // 换卡时：把上一节的跟读停掉、遮词等级归零（不在首次挂载时打断别处的播放）
  useEffect(() => {
    const id = cur?.id ?? null
    if (lastCardRef.current !== null && lastCardRef.current !== id) { guided.stop(); setMaskLevel(0) }
    lastCardRef.current = id
  }, [cur?.id, guided.stop])   // eslint-disable-line react-hooks/exhaustive-deps

  // 离开页面必须收声，否则经文会跟着用户跑到别的页面继续念
  useEffect(() => () => stopAllAudio(), [])

  function startFollowAlong() {
    const steps = buildClauseSteps(curText)
    if (!steps.length) return
    // force: 用户亲手点的「分句跟读」，不受 autoplay 偏好限制（自动播放才需要那道闸）
    guided.start(steps, { force: true, rate: 0.9 })
  }

  async function grade(g) {
    const t = getToken(); const cardObj = due[idx]; if (!t || !cardObj) return
    setBusy(true)
    try {
      guided.stop()
      await reviewMemoryVerse(cardObj.id, g, t)
      const rest = due.filter((_, i) => i !== idx)
      setDue(rest); setIdx(0); setRevealed(false); setMaskLevel(0)
      loadList(); loadMilestones()
    } catch (e) {} finally { setBusy(false) }
  }

  async function add() {
    const t = getToken(); if (!t) return
    if (!ref.trim() || !text.trim()) { setMsg('请填写经节与经文'); return }
    setBusy(true); setMsg('')
    try { await addMemoryVerse({ reference: ref.trim(), verse_text: text.trim() }, t); setRef(''); setText(''); setMsg('✓ 已加入背诵'); loadDue(); loadList(); loadMilestones() }
    catch (e) { setMsg(/[一-龥]/.test(e.message || '') ? e.message : '网络不稳定，请稍后重试') } finally { setBusy(false) }
  }

  async function del(id) {
    const t = getToken(); if (!t) return
    await deleteMemoryVerse(id, t); loadList(); loadDue(); loadMilestones()
  }

  const TABS = [['review', `复习 ${due.length ? `(${due.length})` : ''}`], ['list', '我的'], ['add', '＋ 添加']]

  // 背经里程碑：最高已达成的祝福经文 + 下一目标
  const achievedList = (milestones?.milestones || []).filter(m => m.achieved)
  const lastAchieved = achievedList.length ? achievedList[achievedList.length - 1] : null
  const nextGap = milestones?.next_target ? milestones.next_target - (milestones.memorized || 0) : 0

  return (
    <div style={{ padding: '14px 16px 90px', maxWidth: 640, margin: '0 auto', color: '#fff' }}>
      {/* 背经里程碑 */}
      {milestones && (
        <div style={{ ...card, background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(90,200,250,0.06))', borderColor: 'rgba(167,139,250,0.3)' }} role="region" aria-label={i18nT('背经里程碑')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>{i18nT('🏅 背经里程碑')}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              {i18nT('已背诵')} <strong style={{ color: '#a78bfa' }}>{milestones.memorized || 0}</strong> {i18nT('节 · 熟记')} <strong style={{ color: '#34c759' }}>{milestones.mastered || 0}</strong> {i18nT('节')}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(milestones.milestones || []).map(m => (
              <span key={m.count} title={m.blessing} style={{
                flex: '1 1 0', minWidth: 56, textAlign: 'center', padding: '7px 4px', borderRadius: 10, fontSize: 11, lineHeight: 1.5,
                background: m.achieved ? 'rgba(167,139,250,0.22)' : 'rgba(255,255,255,0.04)',
                border: m.achieved ? '1px solid rgba(167,139,250,0.5)' : '1px solid rgba(255,255,255,0.08)',
                color: m.achieved ? '#a78bfa' : 'rgba(255,255,255,0.35)', fontWeight: m.achieved ? 700 : 400,
              }}>
                <span style={{ display: 'block', fontSize: 13 }}>{m.achieved ? '✓' : '🔒'}</span>
                {m.title} · {m.count}{i18nT('节')}
              </span>
            ))}
          </div>
          {milestones.next_target && nextGap > 0 && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 10 }}>
              {i18nT('距离下一里程碑还差')} <strong style={{ color: '#5ac8fa' }}>{nextGap}</strong> {i18nT('节')}
            </div>
          )}
          {lastAchieved?.blessing && (
            <div style={{ marginTop: 10, borderLeft: '3px solid rgba(167,139,250,0.6)', paddingLeft: 10, fontSize: 12.5, color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, fontStyle: 'italic' }}>
              「{lastAchieved.blessing}」
              <span style={{ fontStyle: 'normal', color: '#a78bfa' }}> —— {lastAchieved.title}{i18nT('的祝福')}</span>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, padding: '9px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
            background: tab === k ? 'rgba(139,92,246,0.22)' : 'rgba(255,255,255,0.05)', color: tab === k ? '#a78bfa' : 'rgba(255,255,255,0.5)' }}>{l}</button>
        ))}
      </div>

      {tab === 'review' && (
        due.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ fontSize: 26, marginBottom: 8 }}>🎉</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{i18nT('今天的背诵都复习完了')}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{i18nT('愿这些话语住在你心里。明天会有新的卡片到期。')}</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textAlign: 'center' }}>{i18nT('还剩')} {due.length} {i18nT('张 · 先回想，再翻看')}</div>
            <div style={{ ...card, minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', padding: '28px 18px' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#a78bfa', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span>{cur?.reference}</span>
                {/* 朗读：听一遍再背，比默读记得牢 */}
                <TTSButton text={`${cur?.reference || ''} ${curText}`} />
              </div>
              {revealed
                ? <MaskedVerse text={curText} level={maskLevel} />
                : <button onClick={() => setRevealed(true)} style={{ alignSelf: 'center', padding: '10px 22px', borderRadius: 20, border: '1px solid rgba(167,139,250,0.4)', background: 'rgba(167,139,250,0.12)', color: '#a78bfa', fontSize: 14, cursor: 'pointer' }}>{i18nT('先在心里背一遍，再点开')}</button>}
            </div>

            {revealed && (
              <div style={card}>
                {/* 分句跟读：一句一句念，句后留白正好够复述一遍 */}
                <GuidedAudioBar
                  guided={guided}
                  onStart={startFollowAlong}
                  label={i18nT('分句跟读')}
                  hint={i18nT('念一句，停一停，你跟着说一遍')}
                />
                <MaskLevelRow level={maskLevel} onChange={setMaskLevel} />
                <RecitePanel key={cur?.id} text={curText} />
              </div>
            )}

            {revealed && (
              <div style={{ display: 'flex', gap: 8 }}>
                {GRADES.map(gr => (
                  <button key={gr.g} onClick={() => grade(gr.g)} disabled={busy} style={{ flex: 1, padding: '12px 4px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: `${gr.color}24`, color: gr.color }}>{gr.label}</button>
                ))}
              </div>
            )}
          </>
        )
      )}

      {tab === 'list' && (
        list.length === 0
          ? <div style={{ ...card, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>{i18nT('还没有背诵卡片，去「添加」开始吧')}</div>
          : list.map(c => (
            <div key={c.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: '#a78bfa' }}>{c.reference}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <TTSButton text={`${c.reference || ''} ${c.verse_text || ''}`} />
                  <button onClick={() => del(c.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,135,135,0.6)', fontSize: 12, cursor: 'pointer' }}>{i18nT('删除')}</button>
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, marginTop: 6 }}>{c.verse_text}</div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>{i18nT('下次复习')} {c.due_date} {i18nT('· 已复习')} {c.repetitions} {i18nT('次')}</div>
            </div>
          ))
      )}

      {tab === 'add' && (
        <div style={card}>
          <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>{i18nT('经节出处')}</label>
          <input value={ref} onChange={e => setRef(e.target.value)} placeholder={i18nT('如：腓立比书 4:6-7')} style={inp}  aria-label={i18nT('如：腓立比书 4:6-7')}/>
          <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '14px 0 6px' }}>{i18nT('经文')}</label>
          <span style={{ position: 'relative', display: 'block' }}>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={4} placeholder={i18nT('把要背诵的经文抄在这里…')} style={{ ...inp, resize: 'vertical', paddingRight: 96 }}  aria-label={i18nT('把要背诵的经文抄在这里…')}/>
          <SuggestMenu top={8} right={8} options={MV_OPTS} value={text} onChange={setText} />
          </span>
          <button onClick={add} disabled={busy} style={{ width: '100%', marginTop: 14, padding: 13, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #8b5cf6, #5ac8fa)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>{i18nT('加入背诵')}</button>
          {msg && <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: msg.startsWith('✓') ? '#34c759' : '#ffd43b' }}>{msg}</div>}
        </div>
      )}
    </div>
  )
}

const inp = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13 }

// ── 遮词卡 ────────────────────────────────────────────────────────────────
// 遮哪些字由 maskVerse(经文, 等级) 用「经文哈希」定死：同一节经文同一级，
// 每次渲染遮的都是同一批字，用户才能在同一个空格上反复练出记忆。

const maskChip = {
  padding: '5px 10px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.62)',
}
const maskChipOn = { background: 'rgba(167,139,250,0.2)', borderColor: 'rgba(167,139,250,0.5)', color: '#a78bfa' }

function MaskLevelRow({ level, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginRight: 2 }}>{i18nT('遮词卡')}</span>
      {MASK_LEVELS.map(l => (
        <button key={l.level} type="button" onClick={() => onChange(l.level)} aria-pressed={level === l.level}
          style={{ ...maskChip, ...(level === l.level ? maskChipOn : null) }}>{i18nT(l.label)}</button>
      ))}
      <span style={{ flexBasis: '100%', fontSize: 11, color: 'rgba(255,255,255,0.36)' }}>{i18nT('点一下被遮住的字，就只揭开那一个')}</span>
    </div>
  )
}

function MaskedVerse({ text, level }) {
  const { tokens } = useMemo(() => maskVerse(text, level), [text, level])
  const [shown, setShown] = useState(() => new Set())
  useEffect(() => { setShown(new Set()) }, [text, level])

  const reveal = (i) => setShown(prev => { const next = new Set(prev); next.add(i); return next })

  return (
    <div style={{ fontSize: 15, lineHeight: 1.9, color: 'rgba(255,255,255,0.92)' }}>
      {tokens.map(tk => (tk.masked && !shown.has(tk.index)
        ? (
          <button key={tk.index} type="button" onClick={() => reveal(tk.index)} aria-label={i18nT('揭开这个被遮住的字')}
            style={{
              // 宽度按原文估算并固定，揭开时排版不会跳动
              display: 'inline-block', boxSizing: 'border-box', width: `${maskPlaceholderEm(tk)}em`,
              padding: 0, margin: '0 1px', verticalAlign: 'baseline', cursor: 'pointer',
              fontSize: 'inherit', fontFamily: 'inherit', lineHeight: 'inherit', textAlign: 'center',
              background: 'rgba(167,139,250,0.12)', border: 'none', borderBottom: '1px solid rgba(167,139,250,0.45)',
              borderRadius: 3, color: 'rgba(167,139,250,0.85)',
            }}>{tk.hint || ' '}</button>
        )
        : <span key={tk.index}>{tk.text}</span>
      ))}
    </div>
  )
}

// ── 复诵评分 ──────────────────────────────────────────────────────────────
// 麦克风必须由用户点按开启；出错就把原因说清楚。
// 分数只是「听见自己记到哪里」的镜子，绝不参与 SM-2 评级，也绝不拦住任何操作。

const RECITE_INK = {
  ok: 'rgba(255,255,255,0.92)',
  wrong: '#ffa94d',
  missing: 'rgba(255,255,255,0.28)',
  extra: 'rgba(255,255,255,0.35)',
}

function RecitePanel({ text }) {
  const rec = useRecitation()
  const tokens = useMemo(() => buildRecitationTokens(rec.result), [rec.result])
  if (!text) return null

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        {rec.recording ? (
          <button type="button" onClick={rec.stop} style={{ ...maskChip, background: 'rgba(255,107,107,0.18)', borderColor: 'rgba(255,107,107,0.45)', color: '#ff9f9f' }}>
            ⏹ {i18nT('说完了')} · {rec.seconds}s
          </button>
        ) : (
          <button type="button" onClick={() => rec.start(text)} disabled={rec.phase === 'scoring'}
            style={{ ...maskChip, background: 'rgba(52,199,89,0.14)', borderColor: 'rgba(52,199,89,0.34)', color: '#8be9c0', opacity: rec.phase === 'scoring' ? 0.5 : 1 }}>
            🎙 {rec.result ? i18nT('再复诵一遍') : i18nT('复诵一遍')}
          </button>
        )}
        {rec.phase === 'scoring' && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{i18nT('正在听…')}</span>}
        {rec.phase === 'idle' && !rec.result && (
          <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.36)' }}>{i18nT('念给自己听，看看记到哪里了')}</span>
        )}
      </div>

      {rec.error && (
        <div role="alert" style={{ marginTop: 8, fontSize: 12.5, color: '#ffd43b', lineHeight: 1.7 }}>
          {rec.error}
          <button type="button" onClick={rec.reset} style={{ ...maskChip, marginLeft: 8, fontSize: 11.5 }}>{i18nT('好，回到文字')}</button>
        </div>
      )}

      {rec.result && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
            {i18nT('对上了')} <strong style={{ color: '#a78bfa' }}>{rec.result.accuracy}%</strong>
            {' · '}{i18nT(RECITATION_VERDICT_COPY[rec.result.verdict] || RECITATION_VERDICT_COPY.again)}
          </div>
          <div style={{ marginTop: 8, fontSize: 14.5, lineHeight: 2, textAlign: 'left' }}>
            {tokens.map(tk => {
              if (tk.type === 'missing') {
                // 漏掉的字留成空档：让眼睛看见「这里断了」，而不是被红字指责
                return (
                  <span key={tk.key} title={i18nT('这里漏了')} style={{ display: 'inline-block', width: `${Math.max(1, tk.text.length * (tk.spaced ? 0.6 : 1))}em`, borderBottom: `1px dashed ${RECITE_INK.missing}`, color: 'transparent' }}>
                    {tk.text}
                  </span>
                )
              }
              if (tk.type === 'extra') {
                return <sup key={tk.key} title={i18nT('这里多念了')} style={{ fontSize: 10, color: RECITE_INK.extra }}>+{tk.text}{tk.spaced ? ' ' : ''}</sup>
              }
              const wrong = tk.type === 'wrong'
              return (
                <span key={tk.key} title={wrong ? `${i18nT('你念的是')} ${tk.spoken}` : undefined}
                  style={{ color: wrong ? RECITE_INK.wrong : RECITE_INK.ok, borderBottom: wrong ? '1px dotted #ffa94d' : 'none' }}>
                  {tk.text}{tk.spaced ? ' ' : ''}
                </span>
              )
            })}
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.34)', lineHeight: 1.7 }}>
            {i18nT('复诵只是练习的镜子，不算成绩，也不影响下次复习的安排。')}
          </div>
        </div>
      )}
    </div>
  )
}
