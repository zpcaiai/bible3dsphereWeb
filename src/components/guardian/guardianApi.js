// Guardian Widget API — 调用 bible3dsphere 后端 /api/guardian/*
import { API_BASE } from '../../api'
import { getToken } from '../../auth'

const headers = (json = false) => {
  const token = getToken()
  return {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function post(path, payload) {
  const res = await fetch(`${API_BASE}/guardian${path}`, {
    method: 'POST', headers: headers(true), body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '请求失败')
  return data
}

async function get(path) {
  const res = await fetch(`${API_BASE}/guardian${path}`, { headers: headers() })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '加载失败')
  return data
}

export const sendGuardianMessage = (message, mode) => post('/message', { message, mode })
export const checkinEmotion = (payload) => post('/checkin/emotion', payload)
export const checkinSpiritual = (payload) => post('/checkin/spiritual', payload)
export const savePrayer = (payload) => post('/prayer', payload)
export const markPrayerAnswered = (id) => post('/prayer', { action: 'markAnswered', id })
export const fetchPrayers = () => get('/prayer')
export const saveDevotion = (payload) => post('/devotion', payload)
export const fetchDevotions = () => get('/devotion')
export const fetchGuardianProfile = () => get('/profile')
export const fetchGuardianState = () => get('/state')
export const fetchGuardianMemories = () => get('/memories')
export const fetchGuardianInsights = () => get('/insights')
