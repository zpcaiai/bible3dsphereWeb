// lazyWithRetry — React.lazy 的 chunk 失效自愈包装。
// 场景：语言切换整页刷新后，SW 缓存的旧 index.html 引用的 hashed chunk 已被新部署删除，
// React.lazy 的动态 import 直接 reject（注意：vite:preloadError 事件不覆盖这条路径！）。
// 处理：失败时清 SW 缓存并整页刷新一次拿新版本（sessionStorage 防循环）；
// 二次仍失败则抛给 ErrorBoundary 显示恢复页。
import { lazy } from 'react'

const KEY = 'lazy-chunk-reload'

async function purgeAndReload() {
  try {
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => k !== 'offline-pack-v1').map((k) => caches.delete(k)))
    }
  } catch { /* ignore */ }
  window.location.reload()
}

export default function lazyWithRetry(importer) {
  return lazy(() =>
    importer().then((m) => {
      try { sessionStorage.removeItem(KEY) } catch { /* ignore */ }
      return m
    }).catch((err) => {
      let reloaded = false
      try { reloaded = sessionStorage.getItem(KEY) === '1'; sessionStorage.setItem(KEY, '1') } catch { /* ignore */ }
      if (!reloaded) {
        purgeAndReload()
        // 返回永不 resolve 的 promise，维持 Suspense fallback 直到刷新接管
        return new Promise(() => {})
      }
      throw err
    })
  )
}
