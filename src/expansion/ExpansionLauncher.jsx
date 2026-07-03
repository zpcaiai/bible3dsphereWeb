// ExpansionLauncher.jsx — 自挂载悬浮入口 + 深链开启（content-theology-expansion 批次）
// 暴露 window.__expansionOpen(featureKey) 供 PlanetHome 等直接深链到某个扩充模块。
import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import ExpansionHub from './ExpansionHub'
import AppErrorBoundary from '../AppErrorBoundary'
import { t as i18nT } from '../i18n/runtime'
import './expansionI18n'

function Launcher() {
  const [open, setOpen] = useState(false)
  const [openKey, setOpenKey] = useState(null)

  useEffect(() => {
    // 深链：window.__expansionOpen('lament' | 'union' | 'contentment' | ...)
    window.__expansionOpen = (key) => { setOpenKey(key || null); setOpen(true) }
    return () => { try { delete window.__expansionOpen } catch { window.__expansionOpen = undefined } }
  }, [])

  const close = () => { setOpen(false); setOpenKey(null) }

  return (
    <>
      <button
        onClick={() => { setOpenKey(null); setOpen(true) }}
        title={i18nT('扩充灵修 · 内容与神学扩充')}
        aria-label={i18nT('扩充灵修 · 内容与神学扩充')}
        style={{
          position: 'fixed', right: 16, bottom: 96, zIndex: 9998,
          width: 52, height: 52, borderRadius: 26, cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.16)', color: '#fff', fontSize: 22,
          background: 'linear-gradient(135deg,#7b2ff7,#5ac8fa)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
        }}
      >📖</button>
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000' }}>
          <AppErrorBoundary><ExpansionHub key={openKey || 'root'} initialFeatureKey={openKey} onClose={close} /></AppErrorBoundary>
        </div>
      )}
    </>
  )
}

export function mountExpansionLauncher() {
  if (typeof document === 'undefined') return
  if (document.getElementById('expansion-launcher-root')) return  // 幂等
  const el = document.createElement('div')
  el.id = 'expansion-launcher-root'
  document.body.appendChild(el)
  ReactDOM.createRoot(el).render(<Launcher />)
}

export default Launcher
