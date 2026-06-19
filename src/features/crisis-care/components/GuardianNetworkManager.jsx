import { useState } from 'react'
import { GUARDIAN_ROLES } from '../data/crisisContent'

const EMPTY = {
  name: '', relationship: '', role: 'friend', phone: '', email: '',
  notifyMethods: ['sms'], permissionLevel: 'orange', consentEnabled: false,
}


const LEVEL_LABEL = { yellow: '低落时', orange: '危机时', red: '仅紧急时' }

/**
 * GuardianNetworkManager — 守护人网络。明确同意、可随时撤销。
 * 没有授权（consentEnabled）就绝不会自动通知任何人。
 */
export default function GuardianNetworkManager({ guardians, onAdd, onDelete }) {
  const [form, setForm] = useState(EMPTY)
  const roleLabel = (r) => (GUARDIAN_ROLES.find((x) => x.value === r) || {}).label || r

  function submit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    onAdd && onAdd(form)
    setForm(EMPTY)
  }

  return (
    <div className="cc-card">
      <h3>我的守护人</h3>
      <p className="cc-muted">危机时把你连接到真实的人。隐私由你掌控：只有你勾选「授权」的人，才会在危机时收到提醒。</p>

      {(guardians || []).length === 0 && <p className="cc-muted">还没有添加守护人。先加一位你信任的人吧。</p>}
      {(guardians || []).map((g) => (
        <div className="cc-resource" key={g.id}>
          <div>
            <div style={{ fontWeight: 600 }}>{g.name} <span className="cc-badge orange" style={{ fontSize: 10 }}>{roleLabel(g.role)}</span></div>
            <div className="meta">
              {g.phone || g.email || '—'} · 提醒级别：{LEVEL_LABEL[g.permissionLevel] || g.permissionLevel} · {g.consentEnabled ? '已授权通知' : '未授权'}
            </div>
          </div>
          <button className="cc-btn ghost" type="button" onClick={() => onDelete && onDelete(g.id)}>移除</button>
        </div>
      ))}

      <form onSubmit={submit} style={{ marginTop: 12 }}>
        <h3 style={{ fontSize: 14 }}>添加守护人</h3>
        <div className="cc-field"><label>姓名 / 称呼</label><input className="cc-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="cc-field">
          <label>角色</label>
          <select className="cc-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {GUARDIAN_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div className="cc-field"><label>电话</label><input className="cc-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="cc-field"><label>邮箱（可选）</label><input className="cc-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="cc-field">
          <label>在什么级别提醒 TA</label>
          <select className="cc-select" value={form.permissionLevel} onChange={(e) => setForm({ ...form, permissionLevel: e.target.value })}>
            <option value="yellow">我低落时</option>
            <option value="orange">我进入危机时</option>
            <option value="red">仅在紧急情况</option>
          </select>
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
          <input type="checkbox" checked={form.consentEnabled} onChange={(e) => setForm({ ...form, consentEnabled: e.target.checked })} style={{ marginTop: 3 }} />
          <span>我授权：在我进入相应级别的危机时，系统可以提醒这位守护人。我可以随时撤销。</span>
        </label>
        <button className="cc-btn full" type="submit" style={{ marginTop: 12 }}>添加</button>
      </form>
    </div>
  )
}
