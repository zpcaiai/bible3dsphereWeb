// 全站语言上下文 / Global language context
//
// - <LanguageProvider> 包裹整个 App（见 main.jsx）
// - useLang() 返回 { lang, setLang, toggle, t }
// - 切换语言：持久化到 localStorage，并整页刷新，让所有模块在新语言下重新求值
//   （这样模块级常量里的界面文案也能正确切换）

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { SUPPORTED_LANGS, DEFAULT_LANG } from './translations'
import { t as runtimeT, getRuntimeLang, setRuntimeLang, STORAGE_KEY } from './runtime'

const LanguageContext = createContext(null)

function applyLangAndReload(next) {
  if (!SUPPORTED_LANGS.includes(next)) return
  if (next === getRuntimeLang()) return
  try { window.localStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
  setRuntimeLang(next)
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', next === 'zh' ? 'zh-CN' : 'en')
  }
  // 整页刷新，确保所有模块（含顶层常量文案）在新语言下重建
  // 置 flag：刷新后让 App 恢复到切换前的 tab（在当前 tab 自由切换语言）
  try { window.sessionStorage.setItem('lang-switch', '1') } catch { /* ignore */ }
  if (typeof window !== 'undefined') window.location.reload()
}

export function LanguageProvider({ children }) {
  const [lang] = useState(getRuntimeLang)

  // 首次同步 <html lang>
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en')
  }

  const setLang = useCallback((next) => applyLangAndReload(next), [])
  const toggle = useCallback(() => applyLangAndReload(getRuntimeLang() === 'zh' ? 'en' : 'zh'), [])

  const value = useMemo(() => ({ lang, setLang, toggle, t: runtimeT }), [lang, setLang, toggle])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    return { lang: getRuntimeLang(), setLang: () => {}, toggle: () => {}, t: runtimeT }
  }
  return ctx
}
