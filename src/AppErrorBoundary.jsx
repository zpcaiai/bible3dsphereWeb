// AppErrorBoundary — 顶层错误边界 + 旧 chunk 自愈。
// 场景：语言切换/SW 回退缓存的旧 index.html 引用了已被新部署删除的 hashed chunk，
// 懒加载失败抛错导致页面残缺/空白。这里捕获后：清 SW 缓存 → 整页强刷一次（防循环）。
import { Component } from 'react'
import { t } from './i18n/runtime'
import { purgeAndReload } from './lazyWithRetry'

const RETRY_KEY = 'app-crash-reload'

function isChunkError(err) {
  const msg = String(err?.message || err || '')
  return /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported/i.test(msg)
}

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) { return { error } }

  componentDidCatch(error, info) {
    console.error('[AppErrorBoundary] 页面渲染崩溃:', error, info?.componentStack)
    // 旧 chunk 失效 → 自动清缓存强刷一次（sessionStorage 防无限循环）
    if (isChunkError(error)) {
      try {
        if (sessionStorage.getItem(RETRY_KEY) !== '1') {
          sessionStorage.setItem(RETRY_KEY, '1')
          purgeAndReload().catch(() => { /* keep the explicit recovery button available */ })
          return
        }
      } catch { /* ignore */ }
    }
  }

  // A document mounting does not prove its deferred chunks can load. Retain
  // the automatic-reload cap across documents until the user explicitly retries.

  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24,
          background: '#0d1117', color: '#fff', textAlign: 'center', fontFamily: 'inherit',
        }}>
          <div style={{ fontSize: 40 }}>🌧</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{t('页面遇到了一点问题')}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, maxWidth: 320 }}>
            {t('通常是版本更新后的缓存不一致导致。点击下方按钮清理缓存并刷新即可恢复。')}
          </div>
          <button
            onClick={() => { try { sessionStorage.removeItem(RETRY_KEY) } catch { /* ignore */ } purgeAndReload().catch(() => {}) }}
            style={{
              padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: '#e8b04b', color: '#2a1d05', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
            }}
          >
            {t('🔄 清理缓存并刷新')}
          </button>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', maxWidth: 320, wordBreak: 'break-all' }}>
            {String(this.state.error?.message || this.state.error || '').slice(0, 200)}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
