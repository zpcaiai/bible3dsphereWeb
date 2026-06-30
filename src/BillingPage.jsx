import { t as i18nT } from './i18n/runtime'
/** BillingPage — 订阅与计费 (B12-4)。Stripe Checkout;未配置时优雅降级。
 *  危机/安全功能永远不受订阅限制。 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { billingApi, prodApi } from './api'
import { getToken } from './auth'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { cursor: 'pointer', borderRadius: 10, padding: '8px 14px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(125,211,252,0.85), rgba(139,92,246,0.6))' }

export default function BillingPage({ user, onBack }) {
  const [status, setStatus] = useState(null)
  const [plans, setPlans] = useState([])
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => { load() }, [])
  async function load() {
    const t = getToken(); if (!t) return
    try { setStatus(await billingApi.status(t)) } catch (e) { setError(e.message) }
    try { const d = await prodApi.plans(t); setPlans(d.plans || d.product_plans || []) } catch (e) { /* ignore */ }
  }
  async function upgrade(planKey) {
    const t = getToken(); if (!t) return
    setError(''); setInfo('')
    try {
      const d = await billingApi.checkout({ plan_key: planKey }, t)
      if (d.checkout_url) { window.location.href = d.checkout_url; return }
      setInfo('已创建会话,但未返回跳转链接。')
    } catch (e) {
      // 503 = 未配置 Stripe → 友好降级
      setInfo(String(e.message || '').includes('billing_not_configured')
        ? '订阅支付尚未在本环境配置(需要 Stripe 密钥)。危机与安全功能始终免费、不受影响。'
        : '发起结账失败:' + e.message)
    }
  }

  const wrap = { maxWidth: 600, margin: '0 auto', padding: 16, color: '#fff' }
  const sub = status && status.subscription
  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('💳 订阅与计费')}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 12 }}>{i18nT('危机与安全功能永远免费、不受订阅限制')}</div>
      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}
      {info && <div style={{ ...card, borderColor: 'rgba(245,196,81,0.3)', fontSize: 13 }}>{info}</div>}

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{i18nT('当前订阅')}</div>
        {sub ? (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)' }}>
            {i18nT('计划:')}<b>{sub.plan_key}</b> {i18nT('· 状态')} {sub.status} {i18nT('· 渠道')} {sub.billing_provider}{sub.stripe_linked ? ' · 已关联 Stripe' : ''}
          </div>
        ) : <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{i18nT('免费版(free_individual)')}</div>}
        {status && !status.billing_configured && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{i18nT('本环境未配置 Stripe;升级按钮将提示降级说明。')}</div>}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, margin: '4px 0 8px' }}>{i18nT('可选计划')}</div>
      {plans.length === 0 && <div style={{ ...card, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{i18nT('暂无计划数据。')}</div>}
      {plans.map(p => {
        const key = p.plan_key || p.key || p.id
        return (
          <div key={key} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name || key}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{p.scope || p.description || ''}</div>
              </div>
              {key === 'free_individual'
                ? <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{i18nT('免费')}</span>
                : <button style={btn} onClick={() => upgrade(key)}>{i18nT('升级')}</button>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
