import { useEffect, useState } from 'react'
import { crisisApi } from '../lib/api'

/**
 * CaregiverInbox — 牧者/咨询师只读收件箱。
 * 列出「分享给我的人」+ 只读摘要 + 一键回拨。
 * 每次查看都会让对方看到（留痕）。复用于「协作」Tab 与独立牧者协作台。
 */
const SCOPE_LABEL = { status: '当前状态', safety_plan: '安全计划', events: '近期事件' }
const LEVEL_BADGE = { green: 'green', yellow: 'yellow', orange: 'orange', red: 'red' }
const LEVEL_ZH = { green: '一般', yellow: '需陪伴', orange: '需确保安全', red: '紧急' }

function telHref(phone) {
  const d = String(phone || '').replace(/[^0-9+]/g, '')
  return d.length >= 3 ? `tel:${d}` : null
}

export default function CaregiverInbox({ heading = '分享给我的人' }) {
  const [incoming, setIncoming] = useState([])
  const [viewing, setViewing] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [err, setErr] = useState('')

  function reload() {
    crisisApi.caregiverIncoming()
      .then((r) => { setIncoming(r.items || []); setLoaded(true) })
      .catch(() => setLoaded(true))
  }
  useEffect(() => { reload() }, [])

  async function view(id) {
    setErr('')
    try { const s = await crisisApi.caregiverView(id); setViewing({ ...s, _shareId: id }) }
    catch (e) { setErr('无法查看：' + (e?.message || '')) }
  }

  return (
    <div>
      <div className="cc-card">
        <h3>{heading}</h3>
        <p className="cc-muted">只读，且按对方设置的范围。每次查看都会让对方看到。请用于陪伴，而非审判。</p>
        {loaded && incoming.length === 0 && <p className="cc-muted">目前没有人分享给你。</p>}
        {incoming.map((s) => (
          <div className="cc-resource" key={s.id}>
            <div>
              <div style={{ fontWeight: 600 }}>{s.sharerEmail}</div>
              <div className="meta">范围：{(s.scope || []).map((x) => SCOPE_LABEL[x] || x).join('、')}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
              {telHref(s.contactPhone) && <a className="cc-call" href={telHref(s.contactPhone)}>回拨</a>}
              <button className="cc-btn secondary" type="button" onClick={() => view(s.id)}>查看</button>
            </div>
          </div>
        ))}
      </div>

      {viewing && (
        <div className="cc-card">
          <h3>只读摘要 · {viewing.sharerEmail}</h3>
          {viewing.latestStatus
            ? <p>当前状态：<span className={`cc-badge ${LEVEL_BADGE[viewing.latestStatus.riskLevel]}`}>{LEVEL_ZH[viewing.latestStatus.riskLevel]}</span> <span className="cc-muted">（{viewing.latestStatus.at}）</span></p>
            : ((viewing.scope || []).includes('status') && <p className="cc-muted">暂无状态记录。</p>)}
          {viewing.safetyPlan && (
            <>
              <h4>安全计划（只读）</h4>
              {(viewing.safetyPlan.safePeople || []).length > 0 && <p>安全联系人：{viewing.safetyPlan.safePeople.join('、')}</p>}
              {(viewing.safetyPlan.warningSigns || []).length > 0 && <p className="cc-muted">警讯：{viewing.safetyPlan.warningSigns.join('、')}</p>}
              {(viewing.safetyPlan.internalCopingStrategies || []).length > 0 && <p className="cc-muted">应对：{viewing.safetyPlan.internalCopingStrategies.join('、')}</p>}
            </>
          )}
          {Array.isArray(viewing.recentEvents) && viewing.recentEvents.length > 0 && (
            <>
              <h4>近期事件</h4>
              {viewing.recentEvents.map((ev) => (
                <p key={ev.id} className="cc-muted">{ev.createdAt} · <span className={`cc-badge ${LEVEL_BADGE[ev.riskLevel]}`}>{LEVEL_ZH[ev.riskLevel]}</span></p>
              ))}
            </>
          )}

          {telHref(viewing.contactPhone) && (
            <div style={{ marginTop: 12 }}>
              <a className="cc-btn full" style={{ display: 'flex', justifyContent: 'center', textDecoration: 'none' }} href={telHref(viewing.contactPhone)}>📞 一键回拨 {viewing.contactPhone}</a>
            </div>
          )}

          <p className="cc-muted" style={{ marginTop: 10 }}>请用这些信息温柔地陪伴、联系当事人，而不是审判。必要时协助连接专业资源。</p>
          <button className="cc-btn ghost" type="button" onClick={() => setViewing(null)}>关闭</button>
        </div>
      )}
      {err && <p className="cc-toast" style={{ color: '#ff9f8a', padding: '0 4px' }}>{err}</p>}
    </div>
  )
}
