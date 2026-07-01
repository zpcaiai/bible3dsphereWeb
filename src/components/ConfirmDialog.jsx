import { useState, useEffect, useRef } from 'react'
import { t as i18nT } from '../i18n/runtime'

// 全局 Promise 版确认弹窗——替代阻塞式 window.confirm。
// 用法（任意位置，无需 import）：
//   if (!(await window.confirmDialog?.('确定删除？'))) return
//   const ok = await window.confirmDialog?.('确定退出？', { tone: 'danger', confirmText: '退出' })
// 说明：使用可选链 ?. 调用——若组件尚未挂载则返回 undefined（falsy），
// 破坏性操作将安全中止而非误执行。
export default function ConfirmDialog() {
  const [state, setState] = useState(null)
  const resolveRef = useRef(null)

  useEffect(() => {
    window.confirmDialog = (msg, opts = {}) =>
      new Promise((resolve) => {
        resolveRef.current = resolve
        setState({
          msg: msg || '',
          confirmText: opts.confirmText || i18nT('确定'),
          cancelText: opts.cancelText || i18nT('取消'),
          tone: opts.tone === 'danger' ? 'danger' : 'default',
        })
      })
    return () => {
      try { delete window.confirmDialog } catch { window.confirmDialog = undefined }
    }
  }, [])

  const close = (val) => {
    const r = resolveRef.current
    resolveRef.current = null
    setState(null)
    if (r) r(val)
  }

  useEffect(() => {
    if (!state) return
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false) }
      else if (e.key === 'Enter') { e.preventDefault(); close(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state])

  if (!state) return null
  return (
    <div className="confirm-overlay" role="presentation" onClick={() => close(false)}>
      <div
        className="confirm-box"
        role="alertdialog"
        aria-modal="true"
        aria-label={state.msg}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-msg">{state.msg}</div>
        <div className="confirm-actions">
          <button type="button" className="confirm-btn cancel" onClick={() => close(false)}>
            {state.cancelText}
          </button>
          <button
            type="button"
            className={`confirm-btn ok${state.tone === 'danger' ? ' danger' : ''}`}
            autoFocus
            onClick={() => close(true)}
          >
            {state.confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
