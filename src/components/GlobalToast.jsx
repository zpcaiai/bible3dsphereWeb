import { useState, useEffect } from 'react'

export default function GlobalToast() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const remove = (id) =>
      setToasts(prev => prev.map(t => t.id === id ? { ...t, out: true } : t))
    const add = (e) => {
      const { msg, type = 'info', duration = 2600 } = e.detail
      const id = Date.now() + Math.random()
      setToasts(prev => [...prev.slice(-4), { id, msg, type }])
      setTimeout(() => remove(id), duration)
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration + 220)
    }
    const clearLoading = () => {
      setToasts(prev => prev.map(t => t.type === 'loading' ? { ...t, out: true } : t))
      setTimeout(() => setToasts(prev => prev.filter(t => t.type !== 'loading')), 220)
    }
    window.addEventListener('app-toast', add)
    window.addEventListener('app-toast-clear-loading', clearLoading)
    window.hideLoadingToast = () => window.dispatchEvent(new CustomEvent('app-toast-clear-loading'))
    window.showToast = (msg, type = 'info', duration) =>
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { msg, type, duration } }))
    // busyBtn: wraps any async fn, disables the button + shows toast
    window.busyBtn = async (e, fn, loadingMsg = '处理中…', doneMsg = null, errMsg = '操作失败，请重试') => {
      const btn = e?.currentTarget || e?.target
      if (btn?.disabled) return
      if (btn) { btn.disabled = true; btn.classList.add('busy') }
      window.showToast(loadingMsg, 'loading')
      try {
        await fn()
        if (doneMsg) window.showToast(doneMsg, 'success')
      } catch (err) {
        console.error(err)
        window.showToast(errMsg, 'error')
      } finally {
        if (btn) { btn.disabled = false; btn.classList.remove('busy') }
      }
    }
    return () => {
      window.removeEventListener('app-toast', add)
      window.removeEventListener('app-toast-clear-loading', clearLoading)
    }
  }, [])

  const icons = { loading: '⏳', success: '✅', error: '❌', info: 'ℹ️' }
  return (
    <div id="app-toast-root">
      {toasts.map(t => (
        <div key={t.id} className={`app-toast ${t.type}${t.out ? ' removing' : ''}`}>
          <span>{icons[t.type] || 'ℹ️'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  )
}
