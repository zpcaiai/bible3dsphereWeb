import { useEffect, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import { getIntegrationHealth } from './platformApi'

const COLOR = { HEALTHY: '#65d690', DEGRADED: '#f0c674', DISABLED: '#9aa0aa', NOT_REGISTERED: '#ff9d9d' }

export default function IntegrationHealthPanel() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  useEffect(() => {
    getIntegrationHealth().then((data) => setItems(data.integrations || [])).catch((caught) => setError(caught.message))
  }, [])
  return (
    <section style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{i18nT('属灵星球集成健康')}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)', marginBottom: 10 }}>{i18nT('仅技术状态与脱敏原因码；不包含用户、情绪、危机、搜索词或属灵状态。')}</div>
      {error && <div role="alert" style={{ color: '#ffb4b4', fontSize: 11 }}>{error}</div>}
      <div style={{ display: 'grid', gap: 6 }}>
        {items.map((item) => (
          <article key={item.module} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 9, background: 'rgba(0,0,0,0.14)' }}>
            <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: COLOR[item.status] || '#aaa' }} />
            <strong style={{ flex: 1, fontSize: 11 }}>{item.module}</strong>
            <span style={{ color: COLOR[item.status] || '#aaa', fontSize: 9, fontWeight: 800 }}>{item.status}</span>
            <small style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8 }}>{(item.reason_codes || []).join(' / ')}</small>
          </article>
        ))}
      </div>
    </section>
  )
}
