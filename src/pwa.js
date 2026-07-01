let deferredPrompt = null

function showUpdateBanner() {
  try {
    if (typeof document === 'undefined' || document.getElementById('sw-update-banner')) return
    const bar = document.createElement('div')
    bar.id = 'sw-update-banner'
    bar.setAttribute('role', 'status')
    bar.style.cssText =
      'position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 16px);transform:translateX(-50%);z-index:10001;' +
      'display:flex;align-items:center;gap:12px;max-width:calc(100vw - 32px);padding:10px 12px 10px 16px;border-radius:12px;' +
      'background:linear-gradient(180deg,#1b1730,#141020);border:1px solid rgba(139,92,246,.3);' +
      'box-shadow:0 12px 40px rgba(0,0,0,.5);color:#eef1ff;font-size:13.5px;' +
      'font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif'
    const txt = document.createElement('span')
    txt.textContent = '发现新版本 · New version available'
    const refresh = document.createElement('button')
    refresh.type = 'button'
    refresh.textContent = '刷新'
    refresh.style.cssText =
      'flex:0 0 auto;padding:6px 14px;border-radius:8px;border:0;background:#6d7cff;color:#fff;font-weight:600;cursor:pointer'
    refresh.onclick = () => window.location.reload()
    const close = document.createElement('button')
    close.type = 'button'
    close.setAttribute('aria-label', '关闭')
    close.textContent = '\u00d7'
    close.style.cssText =
      'flex:0 0 auto;width:28px;height:28px;border-radius:8px;border:0;background:rgba(255,255,255,.08);color:#cdd3f0;font-size:16px;cursor:pointer'
    close.onclick = () => bar.remove()
    bar.append(txt, refresh, close)
    document.body.appendChild(bar)
  } catch { /* ignore */ }
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return
  }

  if (import.meta.env.DEV) {
    window.addEventListener('load', async () => {
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((reg) => reg.unregister()))
        if ('caches' in window) {
          const keys = await caches.keys()
          await Promise.all(keys.filter((key) => key !== 'offline-pack-v1').map((key) => caches.delete(key)))
        }
      } catch {
        // Development cleanup should never block app rendering.
      }
    })
    return
  }

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      // 检测到新版 SW：提示用户刷新以更新（不再强制自动刷新，避免打断正在进行的操作）
      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing
        if (!newSW) return
        newSW.addEventListener('statechange', () => {
          // 仅在「更新」（已存在 controller）时提示；首次安装不打扰
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner()
          }
        })
      })
    } catch (error) {
      console.error('Service worker registration failed:', error)
    }
  })
}

export function subscribeToInstallPrompt(callback) {
  function handleBeforeInstallPrompt(event) {
    event.preventDefault()
    deferredPrompt = event
    callback(true)
  }

  function handleAppInstalled() {
    deferredPrompt = null
    callback(false)
  }

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)

  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.removeEventListener('appinstalled', handleAppInstalled)
  }
}

export async function promptInstall() {
  if (!deferredPrompt) {
    return false
  }

  deferredPrompt.prompt()
  const choice = await deferredPrompt.userChoice
  deferredPrompt = null
  return choice?.outcome === 'accepted'
}

export function isIosInstallable() {
  if (typeof window === 'undefined') {
    return false
  }

  const userAgent = window.navigator.userAgent || ''
  const isIos = /iphone|ipad|ipod/i.test(userAgent)
  const isStandalone = window.navigator.standalone === true
  return isIos && !isStandalone
}
