import { creedCatechismItems } from '../data/creedCatechismSeed'
import { todayKey } from './scriptureFormationEngine'

const STORAGE_KEY = 'spiritualFormation.creedCatechism.completed'

function hash(value) {
  return Array.from(String(value)).reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function hasStorage() {
  return typeof window !== 'undefined' && window.localStorage
}

export function listCatechismItems(filters = {}) {
  const q = String(filters.query || '').toLowerCase()
  return creedCatechismItems.filter((item) => {
    if (filters.pathway && filters.pathway !== 'all' && !item.pathwayTags.includes(filters.pathway)) return false
    if (filters.category && item.category !== filters.category) return false
    if (!q) return true
    return [item.question, item.shortAnswer, item.category, ...(item.scriptureRefs || [])].join(' ').toLowerCase().includes(q)
  })
}

export function getDailyCatechism(dateOrKey = todayKey(), pathway = 'beginner') {
  const day = typeof dateOrKey === 'string' ? dateOrKey : todayKey(dateOrKey)
  const pool = listCatechismItems({ pathway })
  const items = pool.length ? pool : creedCatechismItems
  return items[hash(`${day}:${pathway}`) % items.length]
}

export function recommendCatechismPath(inputText = '') {
  const input = String(inputText || '').toLowerCase()
  if (/教会|church|小组|肢体/.test(input)) return listCatechismItems({ category: 'Church' })
  if (/焦虑|爱我|接纳|父|anxiety|love|father/.test(input)) return creedCatechismItems.filter((item) => ['God', 'Redemption', 'Spirit'].includes(item.category))
  if (/苦|死|盼望|痛|grief|death|hope/.test(input)) return creedCatechismItems.filter((item) => ['Resurrection', 'New Creation', 'Christ'].includes(item.category))
  if (/祷告|pray|prayer/.test(input)) return listCatechismItems({ category: 'Prayer' })
  return creedCatechismItems.slice(0, 4)
}

export function readCatechismCompleted(userId = 'local-user') {
  if (!hasStorage()) return []
  try {
    const all = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
    return all[userId] || []
  } catch {
    return []
  }
}

export function markCatechismComplete(userId = 'local-user', itemKey) {
  if (!hasStorage() || !itemKey) return []
  const current = readCatechismCompleted(userId)
  const next = Array.from(new Set([itemKey, ...current]))
  let all = {}
  try { all = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') } catch { all = {} }
  all[userId] = next
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  return next
}

export function buildDoctrineFormationConnection(item) {
  if (!item) return null
  return {
    category: item.category,
    doctrine: item.shortAnswer,
    formationConnection: item.formationConnection,
    practice: item.practice,
    prayer: item.prayer,
    caution: item.category === 'Sacraments'
      ? '不同传统在细节上有差异；这里先呈现大公核心，并鼓励在本地教会牧者带领下实践。'
      : '',
  }
}

export { creedCatechismItems }
