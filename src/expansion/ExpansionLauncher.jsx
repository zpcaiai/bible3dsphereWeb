// ExpansionLauncher.jsx — 自挂载「扩充灵修」面板宿主（content-theology-expansion 批次）
// 不再悬浮首页按钮；仅暴露 window.__expansionOpen(featureKey|'') 供 PlanetHome 大陆入口
// 深链到某个扩充模块（传空则打开全部模块网格）。
import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import ExpansionHub from './ExpansionHub'
import AppErrorBoundary from '../AppErrorBoundary'
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

  // 无悬浮按钮：仅当被 window.__expansionOpen(...) 唤起时渲染全屏面板。
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000' }}>
      <AppErrorBoundary><ExpansionHub key={openKey || 'root'} initialFeatureKey={openKey} onClose={close} /></AppErrorBoundary>
    </div>
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
