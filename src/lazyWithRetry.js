// lazyWithRetry — React.lazy 的 chunk 失效自愈包装。
// 场景：语言切换整页刷新后，SW 缓存的旧 index.html 引用的 hashed chunk 已被新部署删除，
// React.lazy 的动态 import 直接 reject（注意：vite:preloadError 事件不覆盖这条路径！）。
// 处理：失败时清 SW 缓存并整页刷新一次拿新版本（sessionStorage 防循环）；
// 二次仍失败则抛给 ErrorBoundary 显示恢复页。
import { lazy } from 'react'

const KEY = 'lazy-chunk-reload'

export async function purgeAndReload(reload = () => window.location.reload()) {
  // A recovery reload must return to the mirror entry the user opened.
  // App consumes this one-shot marker; ordinary reloads keep their behavior.
  try {
    const panel = sessionStorage.getItem('nav-activePanel')
    if (panel === 'mirror' || panel === 'mirror-graph') {
      sessionStorage.setItem('lazy-chunk-mirror-restore', '1')
    }
  } catch { /* storage may be unavailable */ }
  // CacheStorage can hang (for example while the storage process is stalled).
  // Optional cleanup must never prevent the navigation that repairs a chunk.
  let timeout
  try {
    await Promise.race([
      (async () => {
        if ('caches' in window) {
          const keys = await caches.keys()
          await Promise.all(keys.filter((k) => k !== 'offline-pack-v1').map((k) => caches.delete(k)))
        }
      })(),
      new Promise(resolve => { timeout = setTimeout(resolve, 1000) }),
    ])
  } catch { /* cleanup is best effort */ }
  finally { clearTimeout(timeout) }
  reload()
}

export default function lazyWithRetry(importer, { retryKey = KEY, renderError } = {}) {
  return lazy(() =>
    importer().then((m) => {
      try { sessionStorage.removeItem(retryKey) } catch { /* ignore */ }
      return m
    }).catch((err) => {
      let reloaded = false
      try { reloaded = sessionStorage.getItem(retryKey) === '1'; sessionStorage.setItem(retryKey, '1') } catch { /* ignore */ }
      if (!reloaded) {
        // Propagate a rejected navigation to the normal error boundary. Keep
        // Suspense only after the reload has actually been requested.
        return purgeAndReload().then(() => new Promise(() => {}))
      }
      if (renderError) {
        return { default: (props) => renderError({ ...props, retry: () => {
          try { sessionStorage.removeItem(retryKey) } catch { /* ignore */ }
          purgeAndReload()
        } }) }
      }
      throw err
    })
  )
}
