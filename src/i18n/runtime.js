// 模块级运行时翻译 / Module-level runtime translation
//
// 设计：语言在「页面加载时」从 localStorage 读定，存入模块级 currentLang。
// t() 读取它即可。切换语言时（见 LanguageContext）持久化新语言并整页刷新，
// 于是所有模块（含模块级常量数组里的文案）都会在新语言下重新求值——
// 这让 codemod 可以安全地包裹包括模块顶层常量在内的所有界面文案。
//
// 查表顺序：当前语言包 → 中文兜底 → 直接返回 key 本身。
// 约定：大规模 codemod 用「中文原文」作为 key，英文缺失时自动回退显示中文，
//      渐进翻译时不会出现空白或报错。

import { translations, SUPPORTED_LANGS, DEFAULT_LANG } from './translations'

const STORAGE_KEY = 'app-lang'

function detectInitialLang() {
  if (typeof window === 'undefined') return DEFAULT_LANG
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved
  } catch { /* ignore */ }
  const nav = (window.navigator?.language || '').toLowerCase()
  if (nav && !nav.startsWith('zh')) return 'en'
  return DEFAULT_LANG
}

let currentLang = detectInitialLang()

export function setRuntimeLang(lang) {
  if (SUPPORTED_LANGS.includes(lang)) currentLang = lang
}

export function getRuntimeLang() {
  return currentLang
}

export { STORAGE_KEY }

function interpolate(str, params) {
  if (!params) return str
  return str.replace(/\{(\w+)\}/g, (m, k) => (k in params ? String(params[k]) : m))
}

// 全站统一翻译函数。key 可为命名空间键（'topbar.title'）或中文原文（'保存'）。
export function t(key, params) {
  if (key == null) return key
  const table = translations[currentLang] || translations[DEFAULT_LANG]
  const fallback = translations[DEFAULT_LANG]
  const raw = (table && key in table) ? table[key]
    : (fallback && key in fallback) ? fallback[key]
    : key
  return typeof raw === 'string' ? interpolate(raw, params) : raw
}

// 情绪/特征向量的显示名 / Display name for an emotion-vector feature.
// EN 模式：只显示英文（short_en / source_keyword），无英文则回退中文。
// ZH 模式：显示中文；withEn=true 时显示「中文(English)」（用于星球标签）。
export function featureLabel(item, { withEn = false } = {}) {
  if (!item) return ''
  const zh = item.zh_label || ''
  const en = item.short_en || item.source_keyword || ''
  if (currentLang === 'en') return en || zh
  return withEn && zh && en ? `${zh}(${en})` : (zh || en)
}
