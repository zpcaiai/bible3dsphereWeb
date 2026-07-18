// EN 模式「自动翻译用户内容」引擎 + <AutoText> 组件
// ------------------------------------------------------------------
// 设计目标：任何 tab 想让动态中文内容（UGC / AI 生成）在 EN 模式下自动
// 显示英文，只需把字符串包进 <AutoText>…</AutoText> 即可，无需点按。
//
// 工作机制：
//  - 模块级缓存 cache：中文原文 -> 英文译文，跨组件/卡片/页面复用。
//  - 微批队列：同一渲染帧内所有 AutoText 的请求合并成一次 /api/translate-batch，
//    避免每条内容各发一次请求。
//  - 订阅刷新：译文到达后通知所有挂载的 AutoText 重渲染。
//  - 渐进：首帧先显示「auto-en 预填译文 / 原文」占位，机翻到达后替换。
//  - ZH 模式：直接走 t()（即既有静态 auto-en 词典），不发任何请求。
import { useEffect, useState } from 'react'
import { getRuntimeLang, t, setEnEntry, registerTranslationMiss } from './i18n/runtime'
import { translateTexts } from './api'

const CJK = /[一-鿿]/
const cache = new Map()      // src -> translated
const pending = new Set()    // 待翻译
const inflight = new Set()   // 翻译中
const tried = new Set()      // 已尝试(成功入缓存或失败)，避免渲染中重复请求
const listeners = new Set()  // 重渲染订阅者
let scheduled = false

const LS_KEY = 'auto-tr-en-cache'

// 启动注水：把上次会话译好的内容填回内存缓存 + en 词典，
// 使静态 t() 文案与动态内容在「下次加载」即同步命中英文（不再闪中文）。
function hydrate() {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    if (!raw) return
    const obj = JSON.parse(raw)
    for (const k in obj) { if (obj[k]) { cache.set(k, obj[k]); setEnEntry(k, obj[k]) } }
  } catch { /* ignore */ }
}
hydrate()

let _persistTimer = null
function persist() {
  if (typeof window === 'undefined' || _persistTimer) return
  _persistTimer = setTimeout(() => {
    _persistTimer = null
    try {
      const obj = {}
      cache.forEach((v, k) => { obj[k] = v })
      window.localStorage.setItem(LS_KEY, JSON.stringify(obj))
    } catch { /* 配额满等忽略 */ }
  }, 800)
}

// 统一入队（去重）
function enqueue(s) {
  if (!s || cache.has(s) || inflight.has(s) || tried.has(s)) return
  tried.add(s); pending.add(s); schedule()
}

// 注入「EN 缺词」处理器：runtime.t() 缺词时把中文丢进来后台机翻
registerTranslationMiss(enqueue)

function notify() {
  listeners.forEach((fn) => { try { fn() } catch { /* ignore */ } })
}

export function subscribeTranslationUpdates(listener) {
  if (typeof listener !== 'function') return () => {}
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

function flush() {
  scheduled = false
  const batch = [...pending].filter((s) => !cache.has(s) && !inflight.has(s))
  pending.clear()
  if (batch.length === 0) return
  batch.forEach((s) => inflight.add(s))
  translateTexts(batch, 'en')
    .then((res) => {
      if (Array.isArray(res)) {
        batch.forEach((s, i) => { const v = res[i]; if (v) { cache.set(s, v); setEnEntry(s, v) } })
        persist()
      }
    })
    .catch(() => { /* 失败保留原文占位 */ })
    .finally(() => {
      batch.forEach((s) => inflight.delete(s))
      notify()
    })
}

function schedule() {
  if (scheduled) return
  scheduled = true
  const run = typeof queueMicrotask === 'function' ? queueMicrotask : (f) => setTimeout(f, 0)
  run(flush)
}

// 请求翻译一条文本，返回「当前最佳显示值」（可能是占位，译好后通过订阅刷新）。
export function requestTranslation(s) {
  if (s == null) return s
  const str = String(s)
  if (getRuntimeLang() !== 'en') return t(str)        // ZH：静态词典
  if (!CJK.test(str)) return str                       // 非中文：原样
  if (cache.has(str)) return cache.get(str)
  // auto-en 预填命中（已是纯英文）：直接采用，省一次网络请求
  const pre = t(str)
  if (pre && pre !== str && !CJK.test(pre)) { cache.set(str, pre); return pre }
  enqueue(str)
  return pre && pre !== str ? pre : str                // 占位
}

// 订阅译文到达后的重渲染
function useTranslationTick() {
  const [, force] = useState(0)
  useEffect(() => {
    const fn = () => force((x) => x + 1)
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  }, [])
}

// <AutoText>动态中文</AutoText>  或  <AutoText text={content} />
// EN 模式自动机翻；ZH 模式走 t()。默认零额外 DOM（直接产出文本）。
// 传 as / className / style 时包一层标签。
export function AutoText({ children, text, as, className, style, ...rest }) {
  useTranslationTick()
  const raw = text != null ? text : (typeof children === 'string' ? children : null)
  if (raw == null) return children ?? null
  const out = requestTranslation(raw)
  const Tag = as
  if (Tag) return <Tag className={className} style={style} {...rest}>{out}</Tag>
  if (className || style || Object.keys(rest).length > 0) {
    return <span className={className} style={style} {...rest}>{out}</span>
  }
  return <>{out}</>
}

// 列表型 hook（镜鉴等「一次拿到一批文本」的场景）：
// 预热入队全部中文项，返回取值函数 tr(str)。
export function useAutoTranslate(texts) {
  useTranslationTick()
  const lang = getRuntimeLang()
  const list = Array.isArray(texts) ? texts : []
  if (lang === 'en') {
    for (const s of list) {
      if (s && CJK.test(String(s))) requestTranslation(String(s))
    }
  }
  return (s) => requestTranslation(s)
}
