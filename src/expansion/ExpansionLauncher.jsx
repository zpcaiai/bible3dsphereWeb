// ExpansionLauncher.jsx — 自挂载「扩充灵修」面板宿主（content-theology-expansion 批次）
// 提供常驻入口，同时暴露 window.__expansionOpen(featureKey|'') 供 PlanetHome 大陆入口深链。
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
    const openWithKey = (key) => { setOpenKey(key || null); setOpen(true) }
    const openFromEvent = (event) => openWithKey(event?.detail?.key || '')
    window.__expansionOpen = openWithKey
    window.addEventListener?.('expansion:open', openFromEvent)
    if (Object.prototype.hasOwnProperty.call(window, '__pendingExpansionOpen')) {
      const pendingKey = window.__pendingExpansionOpen
      try { delete window.__pendingExpansionOpen } catch { window.__pendingExpansionOpen = undefined }
      openWithKey(pendingKey)
    }
    return () => {
      window.removeEventListener?.('expansion:open', openFromEvent)
      try { delete window.__expansionOpen } catch { window.__expansionOpen = undefined }
    }
  }, [])

  const close = () => { setOpen(false); setOpenKey(null) }

  return (
    <>
      {!open && (
        <button
          type="button"
          aria-label={i18nT('扩充灵修 · 内容与神学扩充')}
          title={i18nT('扩充灵修 · 内容与神学扩充')}
          onClick={() => { setOpenKey(null); setOpen(true) }}
          style={launcherButton}
        >
          <span aria-hidden="true" style={{ fontSize: 22, lineHeight: 1 }}>📚</span>
          <span style={{ fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap' }}>{i18nT('扩充灵修')}</span>
        </button>
      )}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000' }}>
          <AppErrorBoundary><ExpansionHub key={openKey || 'root'} initialFeatureKey={openKey} onClose={close} /></AppErrorBoundary>
        </div>
      )}
    </>
  )
}

const launcherButton = {
  position: 'fixed',
  right: 'calc(14px + env(safe-area-inset-right, 0px))',
  bottom: 'calc(var(--tab-bar-height, 64px) + env(safe-area-inset-bottom, 0px) + 14px)',
  zIndex: 900,
  minHeight: 48,
  minWidth: 48,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  padding: '10px 12px',
  borderRadius: 999,
  border: '1px solid rgba(218,119,242,0.42)',
  color: '#fff',
  background: 'linear-gradient(135deg, rgba(67,56,202,0.94), rgba(14,165,233,0.88))',
  boxShadow: '0 10px 26px rgba(0,0,0,0.38)',
  cursor: 'pointer',
  backdropFilter: 'blur(12px)',
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
