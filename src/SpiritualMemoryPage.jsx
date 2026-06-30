import { t as i18nT } from './i18n/runtime'
/** SpiritualMemoryPage — 属灵记忆库 (B10)。你拥有自己的记忆;敏感条目默认不喂 AI 导师。 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { memoryApi } from './api'
import { getToken } from './auth'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { cursor: 'pointer', borderRadius: 10, padding: '8px 12px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(125,211,252,0.85), rgba(139,92,246,0.6))' }
const inp = { width: '100%', boxSizing: 'border-box', borderRadius: 10, padding: '9px 11px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, marginBottom: 8 }
const TYPES = [['insight', '洞见'], ['pattern', '模式'], ['milestone', '里程碑'], ['struggle', '挣扎'], ['prayer', '祷告'], ['preference', '偏好']]
const SENS = { normal: '常规', sensitive: '敏感', crisis: '危机' }

export default function SpiritualMemoryPage({ user, onBack }) {
  const [profile, setProfile] = useState(null)
  const [consent, setConsent] = useState(null)
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [season, setSeason] = useState('')
  const [focus, setFocus] = useState('')
  const [draft, setDraft] = useState({ content: '', title: '', memory_type: 'insight', importance: 3 })

  useEffect(() => { load() }, [])
  async function load() {
    const t = getToken(); if (!t) return
    try {
      const [p, c, it] = await Promise.all([memoryApi.profile(t), memoryApi.consent(t), memoryApi.items('', t)])
      setProfile(p.profile); setSeason(p.profile.current_season || ''); setFocus(p.profile.primary_focus || '')
      setConsent(c.consent); setItems(it.items || [])
    } catch (e) { setError(e.message) }
  }
  async function saveProfile() {
    const t = getToken(); if (!t) return
    try { const d = await memoryApi.patchProfile({ current_season: season, primary_focus: focus }, t); setProfile(d.profile) }
    catch (e) { setError(e.message) }
  }
  async function toggle(field) {
    const t = getToken(); if (!t || !consent) return
    try { const d = await memoryApi.patchConsent({ [field]: !consent[field] }, t); setConsent(d.consent) }
    catch (e) { setError(e.message) }
  }
  async function addItem() {
    const t = getToken(); if (!t || !draft.content.trim()) return
    try {
      await memoryApi.addItem(draft, t)
      setDraft({ content: '', title: '', memory_type: 'insight', importance: 3 })
      const it = await memoryApi.items('', t); setItems(it.items || [])
    } catch (e) { setError(e.message) }
  }
  async function del(id) {
    const t = getToken(); if (!t) return
    try { await memoryApi.deleteItem(id, t); setItems(items.filter(x => x.id !== id)) }
    catch (e) { setError(e.message) }
  }

  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }
  const Toggle = ({ field, label, hint }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
      <div><div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>{hint && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{hint}</div>}</div>
      <button onClick={() => toggle(field)} style={{ cursor: 'pointer', borderRadius: 999, width: 46, height: 26, border: 'none', position: 'relative', background: consent && consent[field] ? 'rgba(52,199,89,0.8)' : 'rgba(255,255,255,0.18)' }}>
        <span style={{ position: 'absolute', top: 3, left: consent && consent[field] ? 23 : 3, width: 20, height: 20, borderRadius: 999, background: '#fff', transition: 'left .15s' }} />
      </button>
    </div>
  )

  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('🧠 属灵记忆库')}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 12 }}>{i18nT('记忆是仆人不是主人 · 你可随时编辑、删除或关闭共享')}</div>
      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{i18nT('成长画像')}</div>
        <input style={inp} value={season} onChange={e => setSeason(e.target.value)} placeholder={i18nT('当前属灵季节(例如:旷野 / 复苏 / 忙乱)')} maxLength={60} />
        <input style={inp} value={focus} onChange={e => setFocus(e.target.value)} placeholder={i18nT('主要成长焦点(例如:恢复祷告生活)')} maxLength={120} />
        <button style={btn} onClick={saveProfile}>{i18nT('保存画像')}</button>
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{i18nT('共享与隐私')}</div>
        <Toggle field="allow_ai_tutor" label={i18nT('允许 AI 导师参考记忆')} hint={i18nT('关闭后,导师对话不会读取你的记忆库')} />
        <Toggle field="exclude_sensitive" label={i18nT('敏感/危机条目不喂 AI')} hint={i18nT('建议保持开启')} />
        <Toggle field="allow_mentor" label={i18nT('允许人类导师查看')} hint={i18nT('默认关闭')} />
        <Toggle field="allow_group" label={i18nT('允许小组查看')} hint={i18nT('默认关闭')} />
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{i18nT('新增一条记忆')}</div>
        <input style={inp} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder={i18nT('标题(可选)')} maxLength={200} />
        <textarea style={{ ...inp, resize: 'none' }} rows={3} value={draft.content} onChange={e => setDraft({ ...draft, content: e.target.value })} placeholder={i18nT('想记住的洞见、模式或祷告…')} maxLength={4000} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={draft.memory_type} onChange={e => setDraft({ ...draft, memory_type: e.target.value })} style={{ ...inp, width: 'auto', marginBottom: 0 }}>
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select value={draft.importance} onChange={e => setDraft({ ...draft, importance: Number(e.target.value) })} style={{ ...inp, width: 'auto', marginBottom: 0 }}>
            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{i18nT('重要度')} {n}</option>)}
          </select>
          <button style={btn} onClick={addItem}>{i18nT('添加')}</button>
        </div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, margin: '4px 0 8px' }}>{i18nT('我的记忆 ·')} {items.length}</div>
      {items.length === 0 && <div style={{ ...card, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{i18nT('还没有记忆条目。')}</div>}
      {items.map(it => (
        <div key={it.id} style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1 }}>
              {it.title && <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{it.title}</div>}
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{it.content}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 5 }}>
                {(TYPES.find(x => x[0] === it.memory_type) || [null, it.memory_type])[1]} {i18nT('· 重要度')} {it.importance}{it.sensitivity !== 'normal' ? ` · ${SENS[it.sensitivity] || it.sensitivity}` : ''}
              </div>
            </div>
            <button onClick={() => del(it.id)} style={{ cursor: 'pointer', border: 'none', background: 'transparent', color: 'rgba(255,140,140,0.8)', fontSize: 12 }}>{i18nT('删除')}</button>
          </div>
        </div>
      ))}
    </div>
  )
}
