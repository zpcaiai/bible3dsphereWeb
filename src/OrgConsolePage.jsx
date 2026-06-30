/** OrgConsolePage — 组织管理台 (B12 真·多租户),标签页版:概览/小组/导师/门徒/教会。
 *  每次请求都按 org_id + RBAC 强制;只显示社区数据的计数,成员个人成长内容永不可见。 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { prodApi, orgApi } from './api'
import { getToken } from './auth'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const chip = (on) => ({ cursor: 'pointer', borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 600, border: '1px solid ' + (on ? 'rgba(139,92,246,0.7)' : 'rgba(255,255,255,0.15)'), color: '#fff', background: on ? 'rgba(139,92,246,0.2)' : 'transparent' })
const tabBtn = (on) => ({ cursor: 'pointer', flex: 1, borderRadius: 10, padding: '8px 4px', fontSize: 13, fontWeight: 700, border: 'none', color: on ? '#fff' : 'rgba(255,255,255,0.5)', background: on ? 'rgba(125,211,252,0.18)' : 'transparent' })
const TABS = [['overview', '概览'], ['groups', '小组'], ['mentor', '导师'], ['discipleship', '门徒'], ['church', '教会']]

function Metric({ label, value }) {
  return (
    <div style={{ flex: 1, minWidth: 90, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 12px' }}>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function OrgConsolePage({ user, onBack }) {
  const [orgs, setOrgs] = useState([])
  const [active, setActive] = useState(null)
  const [role, setRole] = useState(null)
  const [tab, setTab] = useState('overview')
  const [sum, setSum] = useState(null)
  const [groups, setGroups] = useState([])
  const [members, setMembers] = useState([])
  const [pairs, setPairs] = useState([])
  const [disc, setDisc] = useState([])
  const [mprog, setMprog] = useState([])
  const [ctrend, setCtrend] = useState([])
  const [ghealth, setGhealth] = useState([])
  const [atrend, setAtrend] = useState([])
  const [notes, setNotes] = useState([])
  const [error, setError] = useState('')

  useEffect(() => { loadOrgs() }, [])
  async function loadOrgs() {
    const t = getToken(); if (!t) return
    try {
      const d = await prodApi.myOrgs(t)
      const list = d.orgs || d.organizations || []
      setOrgs(list)
      if (list.length) selectOrg(list[0].id)
    } catch (e) { setError(e.message) }
  }
  async function selectOrg(oid) {
    const t = getToken(); if (!t) return
    setActive(oid); setTab('overview')
    setSum(null); setGroups([]); setMembers([]); setPairs([]); setDisc([]); setMprog([]); setCtrend([]); setGhealth([]); setAtrend([]); setNotes([]); setError('')
    const note = []
    try { const r = await orgApi.myRole(oid, t); setRole(r.role) } catch (e) { /* */ }
    try { const s = await orgApi.summary(oid, t); setSum(s.metrics) } catch (e) { note.push('概览:' + e.message) }
    try { const g = await orgApi.groups(oid, t); setGroups(g.groups || []) } catch (e) { /* perm */ }
    try { const gh = await orgApi.groupHealth(oid, t); setGhealth(gh.groups || []) } catch (e) { /* perm */ }
    try { const p = await orgApi.mentorRelationships(oid, t); setPairs(p.relationships || []) } catch (e) { /* perm */ }
    try { const mp = await orgApi.mentorProgress(oid, t); setMprog(mp.relationships || []) } catch (e) { /* perm */ }
    try { const d = await orgApi.discipleship(oid, t); setDisc(d.paths || []) } catch (e) { /* perm */ }
    try { const ct = await orgApi.churchTrend(oid, 12, t); setCtrend(ct.series || []) } catch (e) { /* perm */ }
    try { const at = await orgApi.activityTrend(oid, 12, t); setAtrend(at.series || []) } catch (e) { /* perm */ }
    try { const m = await orgApi.members(oid, t); setMembers(m.members || []) } catch (e) { note.push('成员名册:需要成员管理权限') }
    setNotes(note)
  }

  const wrap = { maxWidth: 700, margin: '0 auto', padding: 16, color: '#fff' }
  const healthColor = (h) => h === 'healthy' ? '#34c759' : h === 'watch' ? '#f5c451' : '#ff8a8a'

  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>🏛️ 组织管理台</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 12 }}>按组织隔离 · 按角色授权 · 只看社区数据计数,成员个人成长内容不可见</div>
      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}

      {orgs.length === 0 && <div style={{ ...card, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>你还不属于任何组织。可在「计划与组织」创建教会/机构后回到这里。</div>}

      {orgs.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {orgs.map(o => <button key={o.id} style={chip(o.id === active)} onClick={() => selectOrg(o.id)}>{o.name || o.id}</button>)}
        </div>
      )}

      {active && (
        <>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>你的角色:<b style={{ color: '#fff' }}>{role || '(非成员/受限)'}</b></div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4 }}>
            {TABS.map(([k, label]) => <button key={k} style={tabBtn(tab === k)} onClick={() => setTab(k)}>{label}</button>)}
          </div>

          {/* 概览 */}
          {tab === 'overview' && (
            <>
              {sum ? (
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>社区概览(近 30 天)</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Metric label="小组" value={sum.groups} />
                    <Metric label="成员" value={sum.members} />
                    <Metric label="导师配对" value={sum.mentor_pairings} />
                    <Metric label="门徒路径" value={sum.discipleship_paths} />
                    <Metric label="小组打卡" value={sum.group_checkins_30d} />
                    <Metric label="教会出勤" value={sum.church_checkins_30d} />
                  </div>
                </div>
              ) : (
                <div style={{ ...card, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>该组织概览需要「管理小组」权限(manage_groups)。当前角色无权查看,这是设计内的隔离。</div>
              )}
              {atrend.length > 1 && (
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>社区活跃度趋势 · 近 {atrend.length} 周</div>
                  <svg viewBox="0 0 300 60" width="100%" style={{ display: 'block' }}>
                    {(() => {
                      const mx = Math.max(1, ...atrend.map(w => Math.max(w.church, w.group)))
                      const X = (i) => atrend.length > 1 ? 4 + i * 292 / (atrend.length - 1) : 150
                      const Y = (v) => 54 - (v / mx) * 46
                      const path = (key) => atrend.map((w, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(w[key]).toFixed(1)).join(' ')
                      return (<g><path d={path('church')} fill="none" stroke="rgba(52,199,89,0.9)" strokeWidth="2" /><path d={path('group')} fill="none" stroke="rgba(125,211,252,0.9)" strokeWidth="2" /></g>)
                    })()}
                  </svg>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                    <span><span style={{ color: '#34c759' }}>●</span> 教会出勤</span>
                    <span><span style={{ color: '#7dd3fc' }}>●</span> 小组打卡</span>
                  </div>
                </div>
              )}
              {members.length > 0 && (
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>成员名册 · {members.length}</div>
                  {members.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                      <span style={{ color: 'rgba(255,255,255,0.8)' }}>{m.email}</span>
                      <span style={{ color: 'rgba(255,255,255,0.55)' }}>{m.role} · {m.status}</span>
                    </div>
                  ))}
                </div>
              )}
              {notes.length > 0 && (
                <div style={{ ...card, borderColor: 'rgba(245,196,81,0.3)', fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>
                  {notes.map((n, i) => <div key={i}>· {n}</div>)}
                  <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.45)' }}>受限是设计内的:不同角色看到不同范围,跨组织永不可见。</div>
                </div>
              )}
            </>
          )}

          {/* 小组 */}
          {tab === 'groups' && (
            <>
              {groups.length === 0 && ghealth.length === 0 && <div style={{ ...card, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>暂无小组,或当前角色无权查看。</div>}
              {groups.length > 0 && (
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>小组 · {groups.length}</div>
                  {groups.map(g => (
                    <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span>{g.name}</span>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{g.active_members} 人 · 近30天 {g.checkins_30d} 次</span>
                    </div>
                  ))}
                </div>
              )}
              {ghealth.length > 0 && (
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>小组健康度 · {ghealth.length}</div>
                  {ghealth.map(g => (
                    <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: 13 }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 999, background: healthColor(g.health), marginRight: 6 }} />{g.name}</div>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>参与 {g.participation_pct}% · 近30天 {g.checkins_30d}{g.support_flags_30d > 0 ? ' · 求助 ' + g.support_flags_30d : ''}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>仅参与计数与求助旗标;打卡正文不可见。</div>
                </div>
              )}
            </>
          )}

          {/* 导师 */}
          {tab === 'mentor' && (
            <>
              {pairs.length === 0 && mprog.length === 0 && <div style={{ ...card, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>暂无导师配对,或当前角色无权查看。</div>}
              {mprog.length > 0 && (
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>导师会面进度 · {mprog.length}</div>
                  {mprog.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                      <span style={{ color: 'rgba(255,255,255,0.8)' }}>{m.mentor} → {m.mentee}</span>
                      <span style={{ color: 'rgba(255,255,255,0.55)' }}>{m.sessions} 次{m.last_session ? ' · 最近 ' + m.last_session : ''}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>仅配对、会面计数与日期;会谈内容不可见。</div>
                </div>
              )}
            </>
          )}

          {/* 门徒 */}
          {tab === 'discipleship' && (
            <>
              {disc.length === 0 && <div style={{ ...card, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>暂无门徒路径,或当前角色无权查看。</div>}
              {disc.length > 0 && (
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>门徒路径进度 · {disc.length}</div>
                  {disc.map(d => (
                    <div key={d.id} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'rgba(255,255,255,0.8)' }}>{d.member} · {d.current_stage || '—'}</span>
                        <span style={{ color: 'rgba(255,255,255,0.55)' }}>{d.steps_done}/{d.steps_total} · {d.progress_pct}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', marginTop: 4 }}>
                        <div style={{ height: 6, borderRadius: 999, width: d.progress_pct + '%', background: 'linear-gradient(90deg, rgba(52,199,89,0.85), rgba(125,211,252,0.7))' }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>仅阶段与完成步数;步骤内容/反思不可见。</div>
                </div>
              )}
            </>
          )}

          {/* 教会 */}
          {tab === 'church' && (
            <>
              {ctrend.length === 0 && <div style={{ ...card, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>暂无教会出勤数据,或当前角色无权查看。</div>}
              {ctrend.length > 0 && (
                <div style={card}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>教会出勤趋势 · 近 {ctrend.length} 周</div>
                  <svg viewBox={'0 0 ' + (ctrend.length * 22) + ' 64'} width="100%" style={{ display: 'block' }}>
                    {(() => { const mx = Math.max(1, ...ctrend.map(w => w.total)); return ctrend.map((w, i) => {
                      const h = (w.total / mx) * 48, ah = (w.attended / mx) * 48
                      return (<g key={i}>
                        <rect x={i * 22 + 3} y={56 - h} width={16} height={h} rx={2} fill="rgba(255,255,255,0.10)" />
                        <rect x={i * 22 + 3} y={56 - ah} width={16} height={ah} rx={2} fill="rgba(52,199,89,0.75)" />
                      </g>)
                    }) })()}
                  </svg>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>绿色=出勤 · 浅色=签到总数;仅计数</div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
