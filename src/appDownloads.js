export const ANDROID_PACKAGE_FILENAME = 'biblesphere-android.apk'
export const IOS_PACKAGE_FILENAME = 'biblesphere-ios.ipa'
export const DEFAULT_APP_DOWNLOAD_BASE = 'https://cdn.holiness.uk/app'
export const SAME_ORIGIN_ANDROID_APP_URL = `/downloads/${ANDROID_PACKAGE_FILENAME}`
export const SAME_ORIGIN_IOS_APP_URL = `/downloads/${IOS_PACKAGE_FILENAME}`
export const DEFAULT_ANDROID_APP_URL = `${DEFAULT_APP_DOWNLOAD_BASE}/${ANDROID_PACKAGE_FILENAME}`
export const DEFAULT_IOS_APP_URL = `${DEFAULT_APP_DOWNLOAD_BASE}/${IOS_PACKAGE_FILENAME}`

function extractFilename(url, fallback) {
  try {
    const parsed = new URL(url, 'https://holiness.uk')
    const seg = parsed.pathname.split('/').filter(Boolean).pop()
    if (seg && /\.(apk|ipa|aab|zip)$/i.test(seg)) return seg
  } catch {
    // ignore malformed URL and use fallback
  }
  return fallback
}

export function resolveAppDownloads(env = import.meta.env) {
  const baseRaw = typeof env?.VITE_APP_DOWNLOAD_BASE === 'string'
    ? env.VITE_APP_DOWNLOAD_BASE.trim().replace(/\/+$/, '')
    : ''
  const base = baseRaw || DEFAULT_APP_DOWNLOAD_BASE
  const androidRaw = typeof env?.VITE_ANDROID_APP_URL === 'string' ? env.VITE_ANDROID_APP_URL.trim() : ''
  const iosRaw = typeof env?.VITE_IOS_APP_URL === 'string' ? env.VITE_IOS_APP_URL.trim() : ''
  const androidUrl = androidRaw || `${base}/${ANDROID_PACKAGE_FILENAME}`
  const iosUrl = iosRaw || `${base}/${IOS_PACKAGE_FILENAME}`

  return {
    androidUrl,
    iosUrl,
    sameOriginAndroidUrl: SAME_ORIGIN_ANDROID_APP_URL,
    sameOriginIosUrl: SAME_ORIGIN_IOS_APP_URL,
    androidFilename: extractFilename(androidUrl, ANDROID_PACKAGE_FILENAME),
    iosFilename: extractFilename(iosUrl, IOS_PACKAGE_FILENAME),
  }
}

export function isStoreOrCustomSchemeUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return false
  const trimmed = url.trim()
  if (/^(itms-services|itms-apps|market):/i.test(trimmed)) return true
  try {
    const parsed = new URL(trimmed, 'https://holiness.uk')
    return /(?:^|\.)(?:apps\.apple\.com|testflight\.apple\.com|play\.google\.com)$/i.test(parsed.hostname)
  } catch {
    return false
  }
}

export function isSameOriginHttpDownload(url, currentOrigin) {
  if (typeof url !== 'string' || !url.trim()) return false
  const trimmed = url.trim()
  if (isStoreOrCustomSchemeUrl(trimmed)) return false
  const origin = currentOrigin || (typeof window !== 'undefined' && window.location?.origin) || 'https://holiness.uk'
  try {
    const parsed = new URL(trimmed, origin)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    return parsed.origin === origin
  } catch {
    return false
  }
}

export function triggerBrowserDownload(url, filename) {
  if (typeof document === 'undefined') return
  const sameOrigin = isSameOriginHttpDownload(url)
  const link = document.createElement('a')
  link.href = url
  if (filename && sameOrigin) {
    link.setAttribute('download', filename)
  } else if (!sameOrigin) {
    link.target = '_blank'
  }
  link.rel = 'noopener noreferrer'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

async function probeBinaryPackageExists(candidateUrl, fetchImpl) {
  if (!candidateUrl || !fetchImpl) return false
  const checkResponse = (res) => {
    if (!res?.ok) return false
    const contentType = (res.headers?.get?.('content-type') || '').toLowerCase()
    const contentLength = res.headers?.get?.('content-length')
    if (contentType.includes('text/html')) return false
    if (contentLength === '0') return false
    return true
  }

  try {
    const headRes = await fetchImpl(candidateUrl, { method: 'HEAD', cache: 'no-store' })
    if (checkResponse(headRes)) return true
    if (headRes && headRes.status !== 405 && headRes.status !== 501) return false
  } catch {
    // Fall back to header-only aborted GET in case R2 CORS only allows GET
  }

  try {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
    const getRes = await fetchImpl(candidateUrl, {
      method: 'GET',
      cache: 'no-store',
      ...(controller ? { signal: controller.signal } : {}),
    })
    const valid = checkResponse(getRes)
    controller?.abort?.()
    return valid
  } catch {
    return false
  }
}

/**
 * Supports BOTH same-origin `/downloads/...` AND CDN `https://cdn.holiness.uk/app/...`
 * out of the box:
 * 1. Store/TestFlight links open natively without interception.
 * 2. Checks same-origin `/downloads/...` first (if present and not SPA `index.html` fallback),
 *    then checks configured `url` (e.g. `https://cdn.holiness.uk/app/...`).
 * 3. Before the binary package is uploaded to either location, shows a friendly
 *    "preparing" toast instead of downloading `index.html` or opening a raw 404 XML page.
 */
export async function handleAppDownloadClick(
  event,
  {
    url,
    sameOriginFallbackUrl,
    filename,
    onUnavailable,
    fetchImpl = typeof fetch === 'function' ? fetch : null,
    downloadTrigger = triggerBrowserDownload,
  } = {},
) {
  if (!url && !sameOriginFallbackUrl) {
    event?.preventDefault?.()
    onUnavailable?.()
    return false
  }

  if (url && isStoreOrCustomSchemeUrl(url)) {
    return true
  }

  event?.preventDefault?.()
  if (!fetchImpl) {
    onUnavailable?.()
    return false
  }

  const candidates = []
  if (sameOriginFallbackUrl) candidates.push(sameOriginFallbackUrl)
  if (url && !candidates.includes(url)) candidates.push(url)

  for (const candidate of candidates) {
    if (await probeBinaryPackageExists(candidate, fetchImpl)) {
      downloadTrigger(candidate, filename)
      return true
    }
  }

  onUnavailable?.()
  return false
}
