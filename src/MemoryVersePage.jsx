import { t as i18nT } from './i18n/runtime'
/**
 * MemoryVersePage — 背经（SM-2 间隔重复）
 * 灵修 tab 子页。复习 / 我的 / 添加。
 */
import { useEffect, useState } from 'react'
import { SuggestMenu } from './components/SuggestField'
const MV_OPTS = ['你要专心仰赖耶和华，不可倚靠自己的聪明。(箴3:5)', '应当一无挂虑，只要凡事借着祷告祈求，将所要的告诉神。(腓4:6)', '我靠着那加给我力量的，凡事都能做。(腓4:13)', '耶和华是我的牧者，我必不致缺乏。(诗23:1)', '神爱世人，甚至将他的独生子赐给他们。(约3:16)', '你们要先求他的国和他的义。(太6:33)']
import { addMemoryVerse, fetchMemoryDue, fetchMemoryList, reviewMemoryVerse, deleteMemoryVerse, fetchMemoryMilestones } from './api'
import { getToken } from './auth'

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

  useEffect(() => { loadDue(); loadList(); loadMilestones() }, [])
  async function loadDue() { const t = getToken(); if (!t) return; try { const r = await fetchMemoryDue(t); setDue(r.cards || []); setIdx(0); setRevealed(false) } catch (e) {} }
  async function loadList() { const t = getToken(); if (!t) return; try { const r = await fetchMemoryList(t); setList(r.cards || []) } catch (e) {} }
  async function loadMilestones() { const t = getToken(); if (!t) return; try { const r = await fetchMemoryMilestones(t); if (r.ok) setMilestones(r) } catch (e) {} }

  async function grade(g) {
    const t = getToken(); const cardObj = due[idx]; if (!t || !cardObj) return
    setBusy(true)
    try {
      await reviewMemoryVerse(cardObj.id, g, t)
      const rest = due.filter((_, i) => i !== idx)
      setDue(rest); setIdx(0); setRevealed(false)
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
              <div style={{ fontSize: 16, fontWeight: 700, color: '#a78bfa', marginBottom: 14 }}>{due[idx]?.reference}</div>
              {revealed
                ? <div style={{ fontSize: 15, lineHeight: 1.9, color: 'rgba(255,255,255,0.92)' }}>{due[idx]?.verse_text}</div>
                : <button onClick={() => setRevealed(true)} style={{ alignSelf: 'center', padding: '10px 22px', borderRadius: 20, border: '1px solid rgba(167,139,250,0.4)', background: 'rgba(167,139,250,0.12)', color: '#a78bfa', fontSize: 14, cursor: 'pointer' }}>{i18nT('先在心里背一遍，再点开')}</button>}
            </div>
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
                <button onClick={() => del(c.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,135,135,0.6)', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>{i18nT('删除')}</button>
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
