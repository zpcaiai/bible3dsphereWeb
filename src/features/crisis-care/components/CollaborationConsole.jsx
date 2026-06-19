import { useEffect, useState } from 'react'
import { crisisApi } from '../lib/api'
import CaregiverInbox from './CaregiverInbox'

/**
 * CollaborationConsole — 牧者/咨询师协作（在 App 内的「协作」Tab）。
 *  · 我分享给谁：明确授权、按范围、可随时撤销，并显示「谁查看过、查看几次」。
 *  · 分享给我的人：复用 CaregiverInbox（只读）。
 * 设计：陪伴而非审判；只读、最小必要、可撤销、可审计。
 */
const ROLE_LABEL = { pastor: '牧者', counselor: '咨询师', small_group_leader: '小组长' }
const SCOPE_LABEL = { status: '当前状态', safety_plan: '安全计划', events: '近期事件' }

export default function CollaborationConsole({ authed }) {
  const [outgoing, setOutgoing] = useState([])
  const [form, setForm] = useState({ caregiverEmail: '', caregiverName: '', caregiverRole: 'pastor', contactPhone: '', expiresInDays: 0, scope: ['status', 'safety_plan', 'events'] })
  const [msg, setMsg] = useState('')
  const [views, setViews] = useState({})

  async function reload() {
    if (!authed) return
    try { setOutgoing((await crisisApi.listShares()).items || []) } catch { /* offline */ }
  }
  useEffect(() => { reload() /* eslint-disable-next-line */ }, [authed])

  async function grant(e) {
    e.preventDefault()
    if (!form.caregiverEmail.includes('@')) { setMsg('请输入有效邮箱'); return }
    if (form.scope.length === 0) { setMsg('请至少选择一个分享范围'); return }
    try {
      const res = await crisisApi.createShare(form)
      setForm({ ...form, caregiverEmail: '', caregiverName: '', contactPhone: '' })
      setMsg(res?.share?.caregiverRegistered === false
        ? '已授权。注意：该邮箱还没有注册属灵星球账号——对方需用这个邮箱注册并登录后才能查看。'
        : '已授权分享。对方登录后可只读查看你勾选的范围。')
      reload()
    } catch (err) { setMsg('分享失败：' + (err?.message || '')) }
  }
  async function revoke(id) { try { await crisisApi.revokeShare(id); reload() } catch { /* keep */ } }
  async function toggleViews(id) {
    if (views[id]) { setViews((v) => { const n = { ...v }; delete n[id]; return n }); return }
    try { const r = await crisisApi.listShareViews(id); setViews((v) => ({ ...v, [id]: r.items || [] })) } catch { /* offline */ }
  }
  function toggleScope(k) { setForm((f) => ({ ...f, scope: f.scope.includes(k) ? f.scope.filter((x) => x !== k) : [...f.scope, k] })) }

  if (!authed) {
    return (
      <div className="cc-card">
        <h3>协作</h3>
        <p className="cc-muted">登录后，你可以把危机状态有限地、可撤销地分享给你的牧者或咨询师；牧者/咨询师登录后，也能在这里看到分享给他们的人（只读）。</p>
        <p className="cc-muted">牧者/咨询师也可以直接访问独立入口 <code>/caregiver</code> 登录查看。</p>
      </div>
    )
  }

  return (
    <div>
      <div className="cc-card">
        <h3>我分享给谁</h3>
        <p className="cc-muted">明确授权、随时可撤销。对方只能看到你勾选的范围，且每次查看你都会看到记录。</p>
        {outgoing.length === 0 && <p className="cc-muted">还没有分享给任何人。</p>}
        {outgoing.map((s) => (
          <div key={s.id}>
            <div className="cc-resource">
              <div>
                <div style={{ fontWeight: 600 }}>
                  {s.caregiverName || s.caregiverEmail} <span className="cc-badge orange" style={{ fontSize: 10 }}>{ROLE_LABEL[s.caregiverRole] || s.caregiverRole}</span>
                  {s.caregiverRegistered === false && <span className="cc-badge yellow" style={{ fontSize: 10, marginLeft: 6 }}>未注册</span>}
                </div>
                <div className="meta">
                  {s.caregiverEmail} · 范围：{(s.scope || []).map((x) => SCOPE_LABEL[x] || x).join('、')}
                  {typeof s.viewCount === 'number' ? ` · 已被查看 ${s.viewCount} 次${s.lastViewedAt ? `（最近 ${s.lastViewedAt}）` : ''}` : ''}{s.expiresAt ? (new Date(s.expiresAt) < new Date() ? ' · 已过期' : ` · ${s.expiresAt} 到期`) : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
                {s.viewCount > 0 && <button className="cc-btn ghost" type="button" onClick={() => toggleViews(s.id)}>{views[s.id] ? '收起' : '查看记录'}</button>}
                <button className="cc-btn ghost" type="button" onClick={() => revoke(s.id)}>撤销</button>
              </div>
            </div>
            {views[s.id] && (
              <div style={{ padding: '2px 12px 10px' }}>
                {views[s.id].length === 0 && <p className="cc-muted" style={{ margin: 0 }}>暂无查看记录。</p>}
                {views[s.id].map((v, i) => (<p key={i} className="cc-muted" style={{ margin: '2px 0' }}>{v.viewedAt} · {v.caregiverEmail}</p>))}
              </div>
            )}
          </div>
        ))}
        <form onSubmit={grant} style={{ marginTop: 12 }}>
          <div className="cc-field"><label>对方邮箱（TA 登录属灵星球用的邮箱，需唯一且已验证）</label><input className="cc-input" value={form.caregiverEmail} onChange={(e) => setForm({ ...form, caregiverEmail: e.target.value })} /></div>
          <div className="cc-field"><label>称呼（可选）</label><input className="cc-input" value={form.caregiverName} onChange={(e) => setForm({ ...form, caregiverName: e.target.value })} /></div>
          <div className="cc-field"><label>我的回拨电话（可选，便于牧者一键联系你）</label><input className="cc-input" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} /></div>
          <div className="cc-field">
            <label>有效期</label>
            <select className="cc-select" value={form.expiresInDays} onChange={(e) => setForm({ ...form, expiresInDays: Number(e.target.value) })}>
              <option value={0}>长期有效</option>
              <option value={30}>30 天后自动失效</option>
              <option value={90}>90 天后自动失效</option>
            </select>
          </div>
          <div className="cc-field">
            <label>角色</label>
            <select className="cc-select" value={form.caregiverRole} onChange={(e) => setForm({ ...form, caregiverRole: e.target.value })}>
              <option value="pastor">牧者</option><option value="counselor">咨询师</option><option value="small_group_leader">小组长</option>
            </select>
          </div>
          <div className="cc-field">
            <label>分享范围</label>
            <div className="cc-pill-row">
              {Object.keys(SCOPE_LABEL).map((k) => (
                <button key={k} type="button" className={`cc-pill ${form.scope.includes(k) ? 'active' : ''}`} onClick={() => toggleScope(k)}>{SCOPE_LABEL[k]}</button>
              ))}
            </div>
          </div>
          <button className="cc-btn full" type="submit">授权分享</button>
        </form>
        {msg && <p className="cc-toast" style={{ padding: '0 4px' }}>{msg}</p>}
      </div>

      <CaregiverInbox />
    </div>
  )
}
