// 圣徒相通 — REST helpers for friends, chat history, and ICE servers.
import { API_BASE } from '../api'
import { getToken, hasRealToken } from '../auth'

function authHeaders(extra = {}) {
  const token = hasRealToken() ? getToken() : null
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function jsonOrThrow(res) {
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    const error = new Error('后端服务不可用')
    error.status = res.status
    throw error
  }
  const data = await res.json()
  if (!res.ok) {
    const error = new Error(data.detail || '请求失败')
    error.status = res.status
    const retryAfterSeconds = Number(res.headers.get('retry-after'))
    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
      error.retryAfterMs = retryAfterSeconds * 1000
    }
    throw error
  }
  return data
}

/** Exchange the HttpOnly session cookie for a 30-second, single-use WS ticket. */
export async function buildWsUrl() {
  const ticketResponse = await fetch(`${API_BASE}/rtc/ws-ticket`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: authHeaders(),
  })
  const ticketData = await jsonOrThrow(ticketResponse)
  let base = API_BASE // e.g. "https://x.hf.space/api" or "/api"
  if (/^https?:\/\//i.test(base)) {
    base = base.replace(/^http/i, 'ws')
  } else {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    base = `${proto}//${window.location.host}${base.startsWith('/') ? base : '/' + base}`
  }
  return `${base}/ws/rtc?ticket=${encodeURIComponent(ticketData.ticket)}`
}

export async function fetchIceServers() {
  const res = await fetch(`${API_BASE}/rtc/ice-servers`, { headers: authHeaders() })
  const data = await jsonOrThrow(res)
  return data.iceServers || [{ urls: ['stun:stun.l.google.com:19302'] }]
}

export async function fetchFriends() {
  const res = await fetch(`${API_BASE}/friends`, { headers: authHeaders() })
  return jsonOrThrow(res)
}

export async function requestFriend(email) {
  const res = await fetch(`${API_BASE}/friends/request`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ email }),
  })
  return jsonOrThrow(res)
}

export async function acceptFriend(email) {
  const res = await fetch(`${API_BASE}/friends/accept`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ email }),
  })
  return jsonOrThrow(res)
}

export async function removeFriend(email) {
  const res = await fetch(`${API_BASE}/friends/remove`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ email }),
  })
  return jsonOrThrow(res)
}

export async function fetchChatHistory(peer, { limit = 50, beforeId = 0 } = {}) {
  const params = new URLSearchParams({ peer, limit: String(limit) })
  if (beforeId) params.set('before_id', String(beforeId))
  const res = await fetch(`${API_BASE}/chat/history?${params}`, { headers: authHeaders() })
  return jsonOrThrow(res)
}

export async function markRead(peer) {
  const res = await fetch(`${API_BASE}/chat/read`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ peer }),
  })
  return jsonOrThrow(res)
}

// 语音群群聊（与语音群共用 voice_group_members 成员表）。
// ⚠ 后端 GroupChatSendRequest 只有 body 一个字段，group_messages 的 kind 列被写死成
// 默认值 'text'——没有任何字段可以标记「这条是口述的」。所以口述消息把标记写进正文本身，
// 任何客户端（含未来的原生端）读到的都是同一段自解释文字，不需要额外约定。
export const VOICE_TEXT_PREFIX = '\u{1F399} '

/** 正文是否为语音转写而来（前缀标记）。 */
export function isVoiceOriginated(body) {
  return typeof body === 'string' && body.startsWith(VOICE_TEXT_PREFIX)
}

/** 去掉语音标记，拿到纯文字。 */
export function stripVoicePrefix(body) {
  return isVoiceOriginated(body) ? body.slice(VOICE_TEXT_PREFIX.length) : body
}

/** 群聊历史。GET /api/groups/{gid}/chat → { ok, messages:[{id,sender,sender_name,body,kind,created_at,recalled}] } */
export async function fetchGroupChatHistory(gid, { limit = 50, beforeId = 0 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (beforeId) params.set('before_id', String(beforeId))
  const res = await fetch(`${API_BASE}/groups/${encodeURIComponent(gid)}/chat?${params}`, {
    headers: authHeaders(),
  })
  return jsonOrThrow(res)
}

/** 发一条群聊消息。POST /api/groups/{gid}/chat body:{ body } → { ok, message } */
export async function sendGroupChat(gid, body) {
  const res = await fetch(`${API_BASE}/groups/${encodeURIComponent(gid)}/chat`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ body }),
  })
  return jsonOrThrow(res)
}

/** 查询后端是否启用语音（LiveKit）。失败时安全返回 false。 */
export async function fetchVoiceEnabled() {
  try {
    const res = await fetch(`${API_BASE}/voice/config`, { headers: authHeaders() })
    const d = await jsonOrThrow(res)
    return !!d.enabled
  } catch { return false }
}

/** 取 1对1 秒拨语音的 LiveKit 凭据。返回 { url, token, room, identity, name, peer, peer_name }。 */
export async function fetchDirectVoiceToken(peer, room = '') {
  const res = await fetch(`${API_BASE}/voice/direct/token`, {
    method: 'POST', headers: authHeaders(), body: JSON.stringify({ peer, room }),
  })
  return jsonOrThrow(res)
}
