import { useState, useEffect } from 'react'
import { API_BASE } from '../api'

export default function AiStatusBanner() {
  const [st, setSt] = useState(null)
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => {
    let alive = true
    const check = () => fetch(`${API_BASE}/ai-status`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive && d) setSt(d) })
      .catch(() => {})
    check()
    const t = setInterval(check, 120000)
    return () => { alive = false; clearInterval(t) }
  }, [])
  if (dismissed || !st || !st.degraded) return null
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'rgba(255,159,10,0.96)', color: '#1a1200', padding: '8px 14px',
      fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px',
      justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
      <span>⚠️ AI 服务暂时维护中，经文匹配与牧养内容质量可能暂时下降，请稍后再试。</span>
      <button type="button" onClick={() => setDismissed(true)}
        style={{ background: 'rgba(0,0,0,0.18)', border: 'none', borderRadius: '6px',
          color: '#1a1200', padding: '3px 10px', cursor: 'pointer', fontSize: '12px' }}>知道了</button>
    </div>
  )
}
