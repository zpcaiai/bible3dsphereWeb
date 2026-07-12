// memoryDeck.js — 背经卡（间隔重复 / 简化 SM-2）。
// 纯 localStorage，离线可用；卡片来自经文搜索/读经页一键收藏。
// quality: 0=忘了 3=想起来但吃力 5=脱口而出

const KEY = 'memory-deck-v1'
const DAY = 24 * 60 * 60 * 1000

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function save(deck) {
  try { localStorage.setItem(KEY, JSON.stringify(deck)) } catch { /* 配额满忽略 */ }
}

/** 添加卡片；已存在（按 ref）返回 false */
export function addMemoryCard({ ref, textCuv = '', textEsv = '', pkId = '' }) {
  const deck = load()
  if (deck.some((c) => c.ref === ref)) return false
  deck.push({
    id: pkId || ref,
    ref, textCuv, textEsv,
    added: Date.now(),
    ease: 2.5, interval: 0, reps: 0,
    due: Date.now(),            // 新卡立即到期（今天就背）
  })
  save(deck)
  pushDeckToCloud()
  return true
}

export function removeMemoryCard(id) {
  save(load().filter((c) => c.id !== id))
  pushDeckToCloud()
}

export function getDeck() { return load() }

export function getDueCards(now = Date.now()) {
  return load().filter((c) => c.due <= now).sort((a, b) => a.due - b.due)
}

/** SM-2 复习：按回忆质量更新熟练度与下次复习时间 */
export function reviewCard(id, quality, now = Date.now()) {
  const deck = load()
  const c = deck.find((x) => x.id === id)
  if (!c) return null
  if (quality < 3) {
    // 没记住：重置间隔，10 分钟后再来
    c.reps = 0
    c.interval = 0
    c.due = now + 10 * 60 * 1000
  } else {
    c.reps += 1
    if (c.reps === 1) c.interval = 1
    else if (c.reps === 2) c.interval = 3
    else c.interval = Math.round(c.interval * c.ease)
    c.ease = Math.max(1.3, c.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
    c.due = now + c.interval * DAY
  }
  c.lastReview = now
  save(deck)
  pushDeckToCloud()
  return c
}

export function deckStats(now = Date.now()) {
  const deck = load()
  return {
    total: deck.length,
    due: deck.filter((c) => c.due <= now).length,
    mature: deck.filter((c) => c.interval >= 21).length, // 间隔≥21天视为已掌握
  }
}

// ── 云同步（登录后可换设备恢复；last-write-wins，失败静默） ──────────────
import { API_BASE } from '../api'
import { getToken } from '../auth'

let _pushTimer = null
function _auth() { const t = getToken(); return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : null }

/** 防抖上传整个卡组（添加/复习/删除后调用） */
export function pushDeckToCloud() {
  const h = _auth(); if (!h) return
  clearTimeout(_pushTimer)
  _pushTimer = setTimeout(() => {
    fetch(`${API_BASE}/memory-cards`, { method: 'PUT', headers: h, body: JSON.stringify({ cards: load() }) }).catch((err) => { console.warn('[memoryDeck.js] ignored async error', err) })
  }, 1500)
}

/** 启动时拉取云端并按 ref 合并（云端较新优先：以 lastReview/added 比较） */
export async function syncDeckFromCloud() {
  const h = _auth(); if (!h) return false
  try {
    const r = await fetch(`${API_BASE}/memory-cards`, { headers: h })
    const j = await r.json()
    if (!j.success) return false
    const remote = j.data?.cards || []
    if (!remote.length) { if (load().length) pushDeckToCloud(); return false }
    const local = load()
    const byRef = new Map(local.map((c) => [c.ref, c]))
    let changed = false
    for (const rc of remote) {
      const lc = byRef.get(rc.ref)
      const rT = rc.lastReview || rc.added || 0, lT = lc ? (lc.lastReview || lc.added || 0) : -1
      if (!lc || rT > lT) { byRef.set(rc.ref, rc); changed = true }
    }
    if (changed) save([...byRef.values()])
    return changed
  } catch { return false }
}
