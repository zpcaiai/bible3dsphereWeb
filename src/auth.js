import { API_BASE } from './api'
import { clearSensitiveOfflineData } from './missionBridgeOffline'

const TOKEN_KEY = 'bible-sphere-token'
const USER_KEY = 'bible-sphere-user'
const BACKEND_DOWN_MSG = '后端服务不可用，请稍后重试'

const authUrl = (path) => `${API_BASE}/auth${path}`

// Bearer credentials deliberately live only in this JavaScript realm. A reload
// requires re-authentication; that is preferable to leaving a long-lived account
// credential available in persistent web storage. Remove legacy persisted tokens
// eagerly so older deployments cannot keep exposing them.
try { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY) } catch { /* storage may be disabled */ }

export function getToken() {
  // Compatibility sentinel for older API helpers that conditionally add an
  // Authorization header. It is not a credential; authentication is cookie-based.
  return 'cookie-session'
}

export function setToken() { /* HttpOnly cookie is managed by the server */ }

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch { /* storage may be disabled */ }
}

export function getCachedUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCachedUser(user) {
  const userWithLoginTime = { ...user, lastLoginAt: new Date().toISOString() }
  localStorage.setItem(USER_KEY, JSON.stringify(userWithLoginTime))
}

export async function fetchCurrentUser() {
  try {
    const res = await fetch(authUrl('/me'), {
      credentials: 'same-origin',
    })
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      throw new Error(BACKEND_DOWN_MSG)
    }
    if (!res.ok) {
      clearToken()
      return null
    }
    const data = await res.json()
    if (data.ok && data.user) {
      setCachedUser(data.user)
      return data.user
    }
    clearToken()
    return null
  } catch {
    return null
  }
}

export async function logout() {
  try {
    await fetch(authUrl('/logout'), { method: 'POST', credentials: 'same-origin' })
  } catch { /* logout remains locally effective when offline */ }
  await clearSensitiveOfflineData().catch(() => {})
  clearToken()
}

export function redirectToWechatLogin() {
  window.location.href = authUrl('/wechat/login')
}

/**
 * Check if current browser is WeChat built-in browser
 */
export function isWechatBrowser() {
  return /MicroMessenger/i.test(navigator.userAgent)
}

/**
 * Check if current device is mobile
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Redirect to WeChat H5 OAuth for mobile (within WeChat app)
 * @param {Object} options
 * @param {string} options.scope - 'snsapi_base' (silent) or 'snsapi_userinfo' (with consent)
 * @param {string} options.frontendUrl - Optional custom frontend URL to redirect back
 */
export function redirectToWechatMobileLogin(options = {}) {
  const { scope = 'snsapi_userinfo', frontendUrl } = options
  const params = new URLSearchParams()
  params.set('scope', scope)
  params.set('redirect_type', 'mobile')
  if (frontendUrl) {
    params.set('frontend_url', frontendUrl)
  }
  window.location.href = `${authUrl('/wechat/mobile')}?${params.toString()}`
}

/**
 * Unified WeChat login - automatically detect PC or Mobile
 */
export function redirectToWechatLoginUnified(options = {}) {
  const { scope = 'snsapi_userinfo', frontendUrl } = options
  
  if (isWechatBrowser() || isMobileDevice()) {
    // Mobile/H5 flow (within WeChat app or mobile browser)
    redirectToWechatMobileLogin({ scope, frontendUrl })
  } else {
    // PC flow (QR code)
    redirectToWechatLogin()
  }
}

export async function sendEmailCode(email) {
  const res = await fetch(authUrl('/email/send-code'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(BACKEND_DOWN_MSG)
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to send code')
  // data may contain { dev_code: '123456' } when SMTP is not configured
  return data
}

export async function registerWithEmail(email, code, password, nickname = '') {
  const res = await fetch(authUrl('/email/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, password, nickname }),
  })
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(BACKEND_DOWN_MSG)
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Registration failed')
  if (data.user) setCachedUser(data.user)
  return data
}

export async function loginWithEmail(email, password) {
  const res = await fetch(authUrl('/email/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(BACKEND_DOWN_MSG)
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Login failed')
  if (data.user) setCachedUser(data.user)
  return data
}

export function extractTokenFromUrl() {
  const params = new URLSearchParams(window.location.search)
  // Remove legacy callback parameters without ever reading them into JS.
  if (params.has('token')) {
    const url = new URL(window.location.href)
    url.searchParams.delete('token')
    window.history.replaceState({}, '', url.toString())
  }
  return null
}


export async function sendResetCode(email) {
  const res = await fetch(authUrl('/email/send-reset-code'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(BACKEND_DOWN_MSG)
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Failed to send reset code')
  return data
}


export async function resetPassword(email, code, password) {
  const res = await fetch(authUrl('/email/reset-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, password }),
  })
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(BACKEND_DOWN_MSG)
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Password reset failed')
  return data
}
