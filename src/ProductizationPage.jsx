import { t as i18nT } from './i18n/runtime'
/** ProductizationPage — 计划 / 订阅 / 组织 (B12)。入口：今日心镜 / 设置。 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { prodApi } from './api'
import { getToken } from './auth'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { cursor: 'pointer', borderRadius: 10, padding: '8px 12px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(125,211,252,0.6))' }
const fld = { width: '100%', padding: 10, borderRadius: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }

export default function ProductizationPage({ user, onBack }) {
  const [plans, setPlans] = useState([])
  const [sub, setSub] = useState(null)
  const [orgs, setOrgs] = useState([])
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState('')

  function load() {
    const t = getToken(); if (!t) return
    prodApi.plans(t).then(r => setPlans(r.plans || [])).catch(e => setError(e.message))
    prodApi.subscription(t).then(r => setSub(r.subscription)).catch((err) => { console.warn('[ProductizationPage.jsx] ignored async error', err) })
    prodApi.myOrgs(t).then(r => setOrgs(r.organizations || [])).catch((err) => { console.warn('[ProductizationPage.jsx] ignored async error', err) })
  }
  useEffect(load, [])
  async function subscribe(k) { const t = getToken(); try { await prodApi.subscribe({ plan_key: k }, t); load() } catch (e) { setError(e.message) } }
  async function createOrg() { const t = getToken(); if (!orgName.trim()) return; try { await prodApi.createOrg({ name: orgName.trim() }, t); setOrgName(''); load() } catch (e) { setError(e.message) } }

  const price = c => c === 0 ? '免费' : `¥${(c / 100).toFixed(0)}/月`
  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }
  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('💳 计划与组织')}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>{i18nT('个人 / 小组 / 教会 / 机构 · 危机与安全永不因订阅受限')}</div>
      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}

      {sub && <div style={{ ...card, background: 'rgba(52,199,89,0.08)' }}>
        <div style={{ fontSize: 13 }}>{i18nT('当前计划：')}<b>{sub.plan_name}</b>（{sub.status}）</div>
      </div>}

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{i18nT('计划')}</div>
        {plans.map(p => (
          <div key={p.plan_key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div><div style={{ fontSize: 14, fontWeight: 600 }}>{p.display_name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{price(p.price_cents)}</div></div>
            {sub && sub.plan_key === p.plan_key ? <span style={{ fontSize: 12, color: '#8be9c0' }}>{i18nT('当前')}</span>
              : <button style={{ ...btn, padding: '5px 12px', fontSize: 12 }} onClick={() => subscribe(p.plan_key)}>{i18nT('选择')}</button>}
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{i18nT('我的组织')}</div>
        {orgs.map(o => <div key={o.id} style={{ fontSize: 13, padding: '4px 0' }}>· {o.name}（{o.my_role}）</div>)}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder={i18nT('新建教会/机构名称')} style={{ ...fld, marginBottom: 0, flex: 1 }}  aria-label={i18nT('新建教会/机构名称')}/>
          <button style={btn} onClick={createOrg}>{i18nT('创建')}</button>
        </div>
      </div>
    </div>
  )
}
