import { getCached, setCached, getManyCached, setManyCached } from './translationCache'
import { getRuntimeLang } from './i18n/runtime'
const configuredApiBase = import.meta.env.VITE_API_BASE?.trim()

function resolveDefaultApiBase() {
  if (typeof window === 'undefined') {
    return '/api'
  }

  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return '/api'  // 本地开发使用 Vite proxy
  }

  // Hugging Space / Netlify / Render：后端和前端同域名，使用相对路径
  if (hostname.includes('hf.space') || hostname.includes('netlify.app') || hostname.includes('onrender.com')) {
    return '/api'
  }

  return '/api'
}

export const API_BASE = configuredApiBase || resolveDefaultApiBase()

const BIBLE_TEXT_FIXES = [
  [/酒\?/g, '酒榨'],
  [/大\?疯/g, '大麻风'],
  [/洪水\?滥/g, '洪水泛滥'],
  [/不\?滥/g, '不泛滥'],
  [/灯\?/g, '灯台'],
  [/门\?/g, '门帘'],
  [/血\?在/g, '血洒在'],
  [/就\?在/g, '就洒在'],
  [/要\?在/g, '要洒在'],
  [/\?七次/g, '洒七次'],
  [/\?房子/g, '洒房子'],
]

export function normalizeBibleText(text) {
  if (typeof text !== 'string' || !text) return text
  let fixed = text
  for (const [pattern, replacement] of BIBLE_TEXT_FIXES) {
    fixed = fixed.replace(pattern, replacement)
  }
  return fixed.replace(/([\u3400-\u9fff])\?([\u3400-\u9fff])/g, '$1$2')
}

function normalizeScripturePayload(data) {
  if (!data || !Array.isArray(data.verses)) return data
  return {
    ...data,
    verses: data.verses.map((verse) => ({
      ...verse,
      text: normalizeBibleText(verse.text),
    })),
  }
}

export async function fetchLayout() {
  console.log('[api] fetchLayout')
  try {
    const response = await fetch(`${API_BASE}/layout`)
    if (!response.ok) throw new Error('Failed to fetch layout')
    const data = await response.json()
    console.log(`[api] fetchLayout ok: ${data.count} items`)
    return data
  } catch (err) {
    console.log('[api] fetchLayout api failed, fallback to static json', err.message)
    try {
      const response = await fetch('/emotion_sphere_layout.json')
      if (!response.ok) throw new Error('static fallback not found')
      const items = await response.json()
      console.log(`[api] fetchLayout static ok: ${items.length} items`)
      return { items, count: items.length }
    } catch (err2) {
      console.log('[api] fetchLayout static fallback also failed, returning empty', err2.message)
      return { items: [], count: 0 }
    }
  }
}

export async function fetchHistory() {
  console.log('[api] fetchHistory')
  const response = await fetch(`${API_BASE}/history`)
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    console.log('[api] fetchHistory backend unavailable, returning empty')
    return { items: [], total: 0 }
  }
  if (!response.ok) throw new Error('Failed to fetch history')
  const data = await response.json()
  console.log(`[api] fetchHistory ok: ${data.items?.length ?? 0} records`)
  return data
}

export async function fetchStats() {
  console.log('[api] fetchStats')
  const response = await fetch(`${API_BASE}/stats`)
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  if (!response.ok) throw new Error('Failed to fetch stats')
  const data = await response.json()
  console.log('[api] fetchStats ok:', data)
  return data
}

export async function trackStats(visitorId) {
  console.log(`[api] trackStats visitorId=${visitorId}`)
  const response = await fetch(`${API_BASE}/stats/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorId }),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Failed to track stats')
  console.log('[api] trackStats ok:', data)
  return data
}

export async function fetchFeatureDetail(featureKey) {
  console.log(`[api] fetchFeatureDetail key=${featureKey}`)
  const response = await fetch(`${API_BASE}/feature?key=${encodeURIComponent(featureKey)}`)
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  if (!response.ok) throw new Error('Failed to fetch feature detail')
  const data = await response.json()
  console.log(`[api] fetchFeatureDetail ok key=${featureKey}`)
  return data
}

export async function fetchRetrievalEvaluation() {
  console.log('[api] fetchRetrievalEvaluation')
  const response = await fetch(`${API_BASE}/retrieval/evaluation`)
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Failed to fetch retrieval evaluation')
  return data
}

export async function runQuery(payload) {
  console.log(`[api] runQuery query=${payload.query?.slice(0, 60)} rerank=${payload.enableRerank}`)
  const response = await fetch(`${API_BASE}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error(`后端服务未运行 (HTTP ${response.status})`)
  }
  const data = await response.json()
  if (!response.ok) {
    let msg = data.error || '请求失败'
    if (Array.isArray(data.detail)) {
      msg = data.detail.map(e => `${e.loc?.join('.') || ''}: ${e.msg}`).join('; ')
    } else if (typeof data.detail === 'string') {
      msg = data.detail
    } else if (data.detail) {
      msg = JSON.stringify(data.detail)
    }
    throw new Error(`[HTTP ${response.status}] ${msg}`)
  }
  console.log(`[api] runQuery ok latency=${data.query_latency_ms}ms features=${data.selected_emotions?.length ?? 0}`)
  return data
}

export async function fetchGuidance(query) {
  console.log(`[api] fetchGuidance query=${query?.slice(0, 60)}`)
  const response = await fetch(`${API_BASE}/guidance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Guidance failed')
  console.log(`[api] fetchGuidance ok emotions=${data.core_emotions}`)
  return data
}

export async function fetchSermon(query) {
  console.log(`[api] fetchSermon query=${query?.slice(0, 60)}`)
  const response = await fetch(`${API_BASE}/sermon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Sermon failed')
  console.log(`[api] fetchSermon ok title=${data.title}`)
  return data
}

export async function fetchDailySnapshot(token) {
  const response = await fetch(`${API_BASE}/daily-snapshot`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  })
  if (!response.ok) return null
  const data = await response.json()
  return data.ok ? data : null
}

export async function fetchEmotionTrajectory(token, limit = 30) {
  const response = await fetch(`${API_BASE}/user/emotion-trajectory?limit=${limit}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  })
  if (!response.ok) return null
  const data = await response.json()
  return data.ok ? data : null
}

export async function fetchCommunityHeatmap(windowHours = 24, topN = 8) {
  try {
    const params = new URLSearchParams({ window_hours: windowHours, top_n: topN })
    const res = await fetch(`${API_BASE}/community/emotion-heatmap?${params}`)
    if (!res.ok) return { emotions: [], total_checkins: 0 }
    return await res.json()
  } catch {
    return { emotions: [], total_checkins: 0 }
  }
}

export async function fetchMeditationQuestions(reference, text) {
  console.log(`[api] fetchMeditationQuestions ref=${reference}`)
  const response = await fetch(`${API_BASE}/meditation-questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lang': getRuntimeLang() },
    body: JSON.stringify({ reference, text }),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) throw new Error('后端服务未运行')
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Meditation questions failed')
  return data.questions || []
}

export async function transcribeAudioBlob(audioBlob, { contentType } = {}) {
  const form = new FormData()
  const type = contentType || audioBlob?.type || 'audio/webm'
  form.append('file', audioBlob, `voice.${type.includes('mp4') ? 'mp4' : 'webm'}`)

  const response = await fetch(`${API_BASE}/speech/transcribe`, {
    method: 'POST',
    body: form,
  })
  const responseType = response.headers.get('content-type') || ''
  const data = responseType.includes('application/json') ? await response.json() : {}
  if (!response.ok) {
    if (response.status === 503) throw new Error('云转写未配置：请在后端设置 DEEPGRAM_API_KEY。')
    if (response.status === 413) throw new Error('录音太长，请缩短后重试。')
    if (response.status === 415) throw new Error('当前音频格式不支持，请换浏览器或重试。')
    throw new Error(data.detail || data.error || '语音识别失败，请检查网络连接')
  }
  return {
    transcript: String(data.transcript || '').trim(),
    detectedLanguage: data.detected_language || data.detectedLanguage || '',
    provider: data.provider || 'server',
  }
}

// ── A1: 每日灵魂一问 ──────────────────────────────────────────
export async function fetchDailySoulQuestion(token) {
  const response = await fetch(`${API_BASE}/daily-soul-question`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Failed')
  return data
}

export async function saveSoulAnswer(answer, saveToJournal, token) {
  const response = await fetch(`${API_BASE}/daily-soul-question/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: JSON.stringify({ answer, save_to_journal: saveToJournal }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Failed')
  return data
}

export async function fetchSoulQuestionHistory(token) {
  const response = await fetch(`${API_BASE}/daily-soul-question/history`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  })
  const data = await response.json()
  return data.ok ? data.items : []
}

// ── A3: 属灵健康检查 ──────────────────────────────────────────
export async function fetchSpiritualHealthCheck(token) {
  const response = await fetch(`${API_BASE}/spiritual-health-check`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  })
  if (!response.ok) return null
  const data = await response.json()
  return data.ok ? data : null
}

// ── A4: 属灵伙伴 ──────────────────────────────────────────────
export async function fetchPartnerStatus(token) {
  const response = await fetch(`${API_BASE}/spiritual-partner/status`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  })
  if (!response.ok) return null
  const data = await response.json()
  return data.ok ? data : null
}

export async function requestPartner(partnerEmail, token) {
  const response = await fetch(`${API_BASE}/spiritual-partner/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: JSON.stringify({ partner_email: partnerEmail }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Failed')
  return data
}

export async function respondPartner(requester, accept, token) {
  const response = await fetch(`${API_BASE}/spiritual-partner/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: JSON.stringify({ requester, accept }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Failed')
  return data
}

export async function sendEncouragement(token) {
  const response = await fetch(`${API_BASE}/spiritual-partner/encourage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: JSON.stringify({}),
  })
  const data = await response.json()
  return data
}

// ── A7: 里程碑徽章 ────────────────────────────────────────────
export async function fetchMilestones(token) {
  const response = await fetch(`${API_BASE}/milestones`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  })
  if (!response.ok) return []
  const data = await response.json()
  return data.ok ? data.items : []
}

// ── A10: 圣经通读 ─────────────────────────────────────────────
export async function markChapterRead(book, chapter, highlight, token) {
  const response = await fetch(`${API_BASE}/bible-reading/mark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: JSON.stringify({ book, chapter, highlight }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Failed')
  return data
}

export async function fetchReadingProgress(token) {
  const response = await fetch(`${API_BASE}/bible-reading/progress`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  })
  if (!response.ok) return { items: [], by_book: {} }
  const data = await response.json()
  return data.ok ? data : { items: [], by_book: {} }
}

export async function fetchTranslate(text, targetLang = 'en') {
  // 先查本地内容寻址缓存：命中即时返回，无网络往返。
  const cachedHit = getCached(text, targetLang)
  if (cachedHit !== undefined) return cachedHit

  console.log(`[api] fetchTranslate target=${targetLang} text=${text?.slice(0, 60)}`)
  const response = await fetch(`${API_BASE}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, target_lang: targetLang }),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Translation failed')
  console.log(`[api] fetchTranslate ok len=${data.translation?.length}`)
  setCached(text, targetLang, data.translation)
  return data.translation
}

// 批量翻译：仅把"本地未命中"的文本发往后端 /translate-batch，
// 返回结果按原顺序对齐（失败项回退原文），并写回本地缓存。
// 内容寻址缓存保证：任一文本变化即视为新键，自动重新翻译，永不返回过期译文。
export async function fetchTranslateBatch(texts, targetLang = 'en') {
  const list = (Array.isArray(texts) ? texts : []).map((t) => String(t ?? ''))
  if (list.length === 0) return []
  const { hits, misses } = getManyCached(list, targetLang)
  const fresh = {}
  if (misses.length > 0) {
    try {
      const response = await fetch(`${API_BASE}/translate-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: misses, target_lang: targetLang }),
      })
      if (response.ok) {
        const data = await response.json()
        const arr = Array.isArray(data.translations) ? data.translations : []
        misses.forEach((m, i) => {
          const tr = arr[i]
          if (tr && tr !== m) fresh[m] = tr
        })
        if (Object.keys(fresh).length) setManyCached(fresh, targetLang)
      }
    } catch (err) {
      console.warn('[api] fetchTranslateBatch failed:', err?.message || err)
    }
  }
  // 按原顺序组装：空串/未译回退原文。
  return list.map((raw) => {
    const t = raw.trim()
    if (!t) return raw
    return hits[t] ?? fresh[t] ?? raw
  })
}

// 按需机翻：texts[] → translations[]（与输入等长，失败项回退原文）。
// autoTranslate.jsx 的统一入口，复用 fetchTranslateBatch 的内容寻址缓存与批量逻辑。
export async function translateTexts(texts, targetLang = 'en') {
  return fetchTranslateBatch(texts, targetLang)
}

export async function fetchFaithQA(question) {
  console.log(`[api] fetchFaithQA question=${question?.slice(0, 60)}`)
  const response = await fetch(`${API_BASE}/faith-qa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Faith QA failed')
  console.log(`[api] fetchFaithQA ok summary=${data.question_summary?.slice(0, 40)}`)
  return data
}

export async function fetchVersePrayer(reference, text) {
  console.log(`[api] fetchVersePrayer ref=${reference}`)
  const response = await fetch(`${API_BASE}/verse-prayer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Lang': getRuntimeLang() },
    body: JSON.stringify({ reference, text }),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || '祷告生成失败')
  console.log(`[api] fetchVersePrayer ok len=${data.prayer?.length}`)
  return data
}

export async function fetchBiblicalExample(query) {
  console.log(`[api] fetchBiblicalExample query=${query?.slice(0, 60)}`)
  const response = await fetch(`${API_BASE}/biblical-example`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Biblical example failed')
  console.log(`[api] fetchBiblicalExample ok person=${data.person} era=${data.era}`)
  return data
}

export async function* sendChat(messages, sessionId, token) {
  console.log(`[api] sendChat session=${sessionId} msgs=${messages.length}`)
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ session_id: sessionId || '', messages }),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json') && !contentType.includes('text/event-stream')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    console.error('[api] sendChat error:', err)
    throw new Error(err.detail || err.error || 'Chat failed')
  }
  console.log('[api] sendChat stream started')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let totalChunks = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (!raw) continue
      try {
        const obj = JSON.parse(raw)
        if (obj.delta) totalChunks++
        if (obj.done) console.log(`[api] sendChat stream done session=${obj.session_id} chunks=${totalChunks}`)
        yield obj
      } catch { /* ignore malformed */ }
    }
  }
}

export async function fetchPrayers(limit = 40, offset = 0, token = null) {
  console.log(`[api] fetchPrayers limit=${limit} offset=${offset}`)
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/prayers?limit=${limit}&offset=${offset}`, { headers })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  if (!response.ok) throw new Error('Failed to fetch prayers')
  const data = await response.json()
  console.log(`[api] fetchPrayers ok: ${data.items?.length ?? 0}/${data.total} items`)
  return data
}

export async function submitPrayer(content, isAnonymous, token, isPublic = false) {
  console.log(`[api] submitPrayer anon=${isAnonymous} len=${content.length}`)
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/prayers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content, is_anonymous: isAnonymous, is_public: isPublic }),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Submit failed')
  console.log(`[api] submitPrayer ok id=${data.id}`)
  return data
}

export async function amenPrayer(prayerId, token) {
  console.log(`[api] amenPrayer id=${prayerId}`)
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/prayers/${prayerId}/amen`, {
    method: 'POST',
    headers,
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Amen failed')
  console.log(`[api] amenPrayer ok id=${prayerId} count=${data.amen_count}`)
  return data
}

export async function updatePrayer(prayerId, content, token) {
  console.log(`[api] updatePrayer id=${prayerId}`)
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/prayers/${prayerId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ content: content.trim() }),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Update failed')
  console.log(`[api] updatePrayer ok id=${prayerId}`)
  return data
}

export async function updatePrayerStatus(prayerId, status, token) {
  console.log(`[api] updatePrayerStatus id=${prayerId} status=${status}`)
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/prayers/${prayerId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || 'Update status failed')
  return data
}

export async function deletePrayer(prayerId, token) {
  console.log(`[api] deletePrayer id=${prayerId}`)
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/prayers/${prayerId}`, {
    method: 'DELETE',
    headers,
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Delete failed')
  console.log(`[api] deletePrayer ok id=${prayerId}`)
  return data
}

export async function restorePrayer(prayerId, token) {
  console.log(`[api] restorePrayer id=${prayerId}`)
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/prayers/${prayerId}/restore`, {
    method: 'POST',
    headers,
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Restore failed')
  console.log(`[api] restorePrayer ok id=${prayerId}`)
  return data
}

// ── Evangelism Prayers (传福音祷告墙) ─────────────────────────

export async function fetchEvangelismPrayers(limit = 40, offset = 0, token = null) {
  console.log(`[api] fetchEvangelismPrayers limit=${limit} offset=${offset}`)
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/evangelism?limit=${limit}&offset=${offset}`, { headers })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  if (!response.ok) throw new Error('Failed to fetch evangelism prayers')
  const data = await response.json()
  console.log(`[api] fetchEvangelismPrayers ok: ${data.items?.length ?? 0}/${data.total} items`)
  return data
}

export async function submitEvangelismPrayer(content, isAnonymous, token) {
  console.log(`[api] submitEvangelismPrayer anon=${isAnonymous} len=${content.length}`)
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/evangelism`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content: content.trim(), is_anonymous: isAnonymous }),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Submit failed')
  console.log(`[api] submitEvangelismPrayer ok id=${data.id}`)
  return data
}

export async function amenEvangelismPrayer(prayerId, token) {
  console.log(`[api] amenEvangelismPrayer id=${prayerId}`)
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/evangelism/${prayerId}/amen`, {
    method: 'POST',
    headers,
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Amen failed')
  console.log(`[api] amenEvangelismPrayer ok id=${prayerId} count=${data.amen_count}`)
  return data
}

export async function updateEvangelismPrayer(prayerId, content, token) {
  console.log(`[api] updateEvangelismPrayer id=${prayerId}`)
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/evangelism/${prayerId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ content: content.trim() }),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Update failed')
  console.log(`[api] updateEvangelismPrayer ok id=${prayerId}`)
  return data
}

export async function deleteEvangelismPrayer(prayerId, token) {
  console.log(`[api] deleteEvangelismPrayer id=${prayerId}`)
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/evangelism/${prayerId}`, {
    method: 'DELETE',
    headers,
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Delete failed')
  console.log(`[api] deleteEvangelismPrayer ok id=${prayerId}`)
  return data
}

export async function restoreEvangelismPrayer(prayerId, token) {
  console.log(`[api] restoreEvangelismPrayer id=${prayerId}`)
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/evangelism/${prayerId}/restore`, {
    method: 'POST',
    headers,
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Restore failed')
  console.log(`[api] restoreEvangelismPrayer ok id=${prayerId}`)
  return data
}

export async function submitCheckin(payload, token) {
  console.log(`[api] submitCheckin emotion=${payload.emotionLabel} anon=${!token}`)
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/user/checkin`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Checkin failed')
  console.log(`[api] submitCheckin ok tags=${data.tags_extracted}`)
  return data
}

export async function fetchJournals(token, limit = 50, offset = 0) {
  console.log(`[api] fetchJournals limit=${limit} offset=${offset}`)
  const response = await fetch(`${API_BASE}/devotion/journals?limit=${limit}&offset=${offset}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Fetch journals failed')
  console.log(`[api] fetchJournals ok ${data.items?.length ?? 0}/${data.total}`)
  return data
}

export async function saveJournal(payload, token) {
  console.log(`[api] saveJournal date=${payload.date} title=${payload.title?.slice(0, 30)}`)
  const response = await fetch(`${API_BASE}/devotion/journals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Save journal failed')
  console.log(`[api] saveJournal ok id=${data.journal?.id}`)
  return data
}

export async function deleteJournal(journalId, token) {
  console.log(`[api] deleteJournal id=${journalId}`)
  const response = await fetch(`${API_BASE}/devotion/journals/${journalId}`, {
    method: 'DELETE',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Delete journal failed')
  console.log(`[api] deleteJournal ok id=${journalId}`)
  return data
}

// ── Sermon Journal API ─────────────────────────────────────

export async function fetchSermonJournals(token, limit = 50, offset = 0) {
  console.log(`[api] fetchSermonJournals limit=${limit} offset=${offset}`)
  const response = await fetch(`${API_BASE}/sermon/journals?limit=${limit}&offset=${offset}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Fetch sermon journals failed')
  console.log(`[api] fetchSermonJournals ok ${data.items?.length ?? 0}/${data.total}`)
  return data
}

export async function saveSermonJournal(payload, token) {
  console.log(`[api] saveSermonJournal date=${payload.date} title=${payload.title?.slice(0, 30)}`)
  const body = {
    date: payload.date || '',
    title: payload.title || '',
    preacher: payload.preacher || '',
    scripture: payload.scripture || '',
    summary: payload.summary || '',
    questions: payload.questions || [],
    bible_study: payload.bibleStudy || payload.bible_study || '',
    practices: payload.practices || [],
    reflection: payload.reflection || '',
    lesson: payload.lesson || '',
    conclusion: payload.conclusion || '',
    encouragement: payload.encouragement || '',
    phase: payload.phase || 'active',
  }
  const response = await fetch(`${API_BASE}/sermon/journals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Save sermon journal failed')
  console.log(`[api] saveSermonJournal ok id=${data.journal?.id}`)
  return data
}

export async function deleteSermonJournal(journalId, token) {
  console.log(`[api] deleteSermonJournal id=${journalId}`)
  const response = await fetch(`${API_BASE}/sermon/journals/${journalId}`, {
    method: 'DELETE',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Delete sermon journal failed')
  console.log(`[api] deleteSermonJournal ok id=${journalId}`)
  return data
}

// ── Personal Notes API (我的日记) ──────────────────────────

export async function fetchPersonalNotes(token) {
  console.log(`[api] fetchPersonalNotes`)
  const response = await fetch(`${API_BASE}/personal/notes`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Fetch personal notes failed')
  console.log(`[api] fetchPersonalNotes ok ${data.items?.length ?? 0}`)
  return data
}

export async function savePersonalNote(payload, token) {
  console.log(`[api] savePersonalNote id=${payload.id} date=${payload.date}`)
  const response = await fetch(`${API_BASE}/personal/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Save personal note failed')
  console.log(`[api] savePersonalNote ok id=${data.note?.id}`)
  return data
}

export async function deletePersonalNote(noteId, token) {
  console.log(`[api] deletePersonalNote id=${noteId}`)
  const response = await fetch(`${API_BASE}/personal/notes/${noteId}`, {
    method: 'DELETE',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Delete personal note failed')
  console.log(`[api] deletePersonalNote ok id=${noteId}`)
  return data
}

export async function searchPersonal(kw, token) {
  console.log(`[api] searchPersonal kw=${kw}`)
  const params = new URLSearchParams({ kw: kw.trim() })
  const response = await fetch(`${API_BASE}/personal/search?${params}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    // fallback: 本地搜索 personal notes / journal entries
    const notes = JSON.parse(localStorage.getItem('personal_notes') || '[]')
    const entries = JSON.parse(localStorage.getItem('journal_entries') || '[]')
    const all = [...notes, ...entries].filter(item => {
      const text = JSON.stringify(item).toLowerCase()
      return text.includes(kw.trim().toLowerCase())
    })
    return { query: kw.trim(), results: all, total: all.length }
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Search failed')
  return data
}

// ── User Profile API ─────────────────────────────────────────

export async function updateUserProfile(payload, token) {
  console.log(`[api] updateUserProfile nickname=${payload.nickname}`)
  const response = await fetch(`${API_BASE}/user/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || 'Update profile failed')
  console.log(`[api] updateUserProfile ok nickname=${data.nickname}`)
  return data
}

// ── Google Cloud Text-to-Speech ─────────────────────────────────
export async function fetchScripture(ref) {
  // ref e.g. "以赛亚书40:3" or "创世记1"
  const r = await fetch(`${API_BASE}/scripture?ref=${encodeURIComponent(ref)}`)
  if (!r.ok) throw new Error(`scripture ${r.status}`)
  const data = await r.json()  // {ok, ref, verses:[{verse,text},...]}
  return normalizeScripturePayload(data)
}

export async function fetchTTS(text, language_code = 'zh-CN', voice_name = 'zh-CN-XiaoxiaoNeural') {
  console.log(`[api] fetchTTS text=${text?.slice(0, 60)}... lang=${language_code}`)
  const response = await fetch(`${API_BASE}/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language_code, voice_name }),
  })
  
  // 502/503 表示后端 TTS 未配置或上游不可用，前端应 fallback 到浏览器原生 TTS
  if ([502, 503].includes(response.status)) {
    console.log('[api] fetchTTS backend unavailable, fallback to native TTS')
    throw new Error('TTS_NOT_CONFIGURED')
  }
  
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || 'TTS failed')
  }
  
  // 返回音频 Blob
  const audioBlob = await response.blob()
  console.log(`[api] fetchTTS ok blob=${audioBlob.size} bytes`)
  return audioBlob
}


// ── Share Wall (分享墙) ─────────────────────────────────────

export async function fetchSharedNotes(token = null, page = 1, limit = 20) {
  console.log(`[api] fetchSharedNotes page=${page}`)
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/shared/notes?page=${page}&limit=${limit}`, { headers })
  if (response.status === 401) {
    return { ok: false, requireLogin: true, items: [], total: 0, pages: 0 }
  }
  if (!response.ok) throw new Error('Failed to fetch shared notes')
  const data = await response.json()
  console.log(`[api] fetchSharedNotes ok: ${data.items?.length ?? 0}/${data.total} items page=${page}`)
  return data
}

export async function fetchBibleStudy(book, chapter, verses, token = null) {
  console.log(`[api] fetchBibleStudy ${book} ${chapter}`)
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/bible/study`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ book, chapter, verses }),
  })
  if (!response.ok) {
    let msg = 'Failed to generate study'
    try { const d = await response.json(); msg = d.detail || msg } catch (_) {}
    throw new Error(msg)
  }
  return response.json()
}

export async function toggleShareSermonJournal(journalId, token = null) {
  console.log(`[api] toggleShareSermonJournal id=${journalId}`)
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/sermon/journals/${journalId}/share`, {
    method: 'POST',
    headers,
  })
  if (response.status === 403) throw new Error('Only the creator can share/unshare')
  if (!response.ok) throw new Error('Failed to toggle share')
  return response.json()
}

export async function toggleShareNote(noteId, token = null) {
  console.log(`[api] toggleShareNote id=${noteId}`)
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/personal/notes/${noteId}/share`, {
    method: 'POST',
    headers,
  })
  if (response.status === 401) throw new Error('Login required')
  if (response.status === 403) throw new Error('Only the creator can share/unshare')
  if (!response.ok) throw new Error('Failed to toggle share')
  return await response.json()
}

export async function amenSharedNote(noteId, token) {
  console.log(`[api] amenSharedNote id=${noteId}`)
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/shared/notes/${noteId}/amen`, { method: 'POST', headers })
  if (response.status === 401) throw new Error('Login required')
  if (!response.ok) throw new Error('Amen failed')
  return await response.json()
}

// ── Recycle Bin API ──────────────────────────────────────────

export async function fetchRecycleBin(token) {
  console.log('[api] fetchRecycleBin')
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/recycle-bin`, { headers })
  if (response.status === 401) throw new Error('Login required')
  if (!response.ok) {
    let detail = 'Failed to fetch recycle bin'
    try {
      const errData = await response.json()
      detail = errData.detail || errData.error || detail
    } catch {}
    throw new Error(detail)
  }
  return await response.json()
}

export async function restoreRecycleItem(type, id, token) {
  console.log(`[api] restoreRecycleItem type=${type} id=${id}`)
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const response = await fetch(`${API_BASE}/recycle-bin/${type}/${id}/restore`, {
    method: 'POST',
    headers,
  })
  if (response.status === 401) throw new Error('Login required')
  if (response.status === 403) throw new Error('Not authorized')
  if (response.status === 404) throw new Error('Item not found')
  if (!response.ok) throw new Error('Restore failed')
  return await response.json()
}


// ── 人格塑造、习惯养成、行为追踪 API ───────────────────────

export async function regulateBehavior(task, energyLevel = 3, motivation = 5, token = null) {
  console.log(`[api] regulateBehavior task=${task} energy=${energyLevel}`)
  const response = await fetch(`${API_BASE}/behavior/regulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: JSON.stringify({ task, energy_level: energyLevel, motivation })
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || '行为调节失败')
  console.log(`[api] regulateBehavior tier=${data.selected_tier}`)
  return data
}

export async function createHabit(habitName, anchor = '', energyLevel = 3, token) {
  console.log(`[api] createHabit name=${habitName}`)
  const response = await fetch(`${API_BASE}/habits/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: JSON.stringify({ habit_name: habitName, anchor, energy_level: energyLevel })
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || '创建习惯失败')
  console.log(`[api] createHabit ok id=${data.saved_habit_id}`)
  return data
}

export async function fetchHabits(token) {
  console.log(`[api] fetchHabits`)
  const response = await fetch(`${API_BASE}/habits`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || '获取习惯列表失败')
  console.log(`[api] fetchHabits ok count=${data.items?.length || 0}`)
  return data
}

export async function executeHabit(habitId, energyLevel = 3, token) {
  console.log(`[api] executeHabit ${habitId} energy=${energyLevel}`)
  const response = await fetch(`${API_BASE}/habits/${habitId}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: JSON.stringify({ habit_id: habitId, energy_level: energyLevel })
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || '执行习惯失败')
  console.log(`[api] executeHabit tier=${data.selected_tier}`)
  return data
}

export async function logHabitExecution(habitId, tierExecuted, wasCompleted, completionPercentage, moodBefore, moodAfter, token) {
  console.log(`[api] logHabitExecution ${habitId} tier=${tierExecuted} completed=${wasCompleted}`)
  const response = await fetch(`${API_BASE}/habits/${habitId}/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
    body: JSON.stringify({ 
      habit_id: habitId, 
      tier_executed: tierExecuted,
      was_completed: wasCompleted,
      completion_percentage: completionPercentage,
      mood_before: moodBefore,
      mood_after: moodAfter
    })
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || '记录执行失败')
  console.log(`[api] logHabitExecution tokens=${data.tokens_earned}`)
  return data
}

export async function fetchHabitsDashboard(token) {
  console.log(`[api] fetchHabitsDashboard`)
  const response = await fetch(`${API_BASE}/habits/dashboard`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || '获取仪表盘失败')
  console.log(`[api] fetchHabitsDashboard tokens=${data.token_balance}`)
  return data
}

// ==================== Formation Engine (人格塑造) API ====================

export async function fetchFormationProfile(userId, token) {
  console.log(`[api] fetchFormationProfile userId=${userId}`)
  const response = await fetch(`${API_BASE}/sfds/v3/formation/profile/${userId}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || '获取人格塑造档案失败')
  console.log(`[api] fetchFormationProfile schema=${data.schema}`)
  return data
}

export async function fetchFormationDimensions(token) {
  console.log(`[api] fetchFormationDimensions`)
  const response = await fetch(`${API_BASE}/sfds/v3/formation/dimensions`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || '获取维度定义失败')
  console.log(`[api] fetchFormationDimensions dimensions=${data.dimensions?.length}`)
  return data
}

// ==================== Reflection Survey API ====================

export async function saveReflectionAnswers(userId, answers, token) {
  const response = await fetch(`${API_BASE}/reflection/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ user_id: String(userId), answers })
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) throw new Error('后端服务未运行')
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || '保存失败')
  return data
}

export async function fetchReflectionAnswers(userId, token) {
  const response = await fetch(`${API_BASE}/reflection/load?user_id=${userId}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) throw new Error('后端服务未运行')
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || '加载失败')
  return data
}

// ==================== Behavior Tracking (行为追踪) API ====================

export async function fetchBehaviorHistory(userId, token, limit = 30) {
  console.log(`[api] fetchBehaviorHistory userId=${userId} limit=${limit}`)
  const response = await fetch(`${API_BASE}/behavior/history?user_id=${userId}&limit=${limit}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || '获取行为历史失败')
  console.log(`[api] fetchBehaviorHistory count=${data.items?.length}`)
  return data
}

export async function fetchBehaviorStats(userId, token) {
  console.log(`[api] fetchBehaviorStats userId=${userId}`)
  const response = await fetch(`${API_BASE}/behavior/stats?user_id=${userId}`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || '获取行为统计失败')
  console.log(`[api] fetchBehaviorStats total_regulations=${data.total_regulations}`)
  return data
}

// ==================== Formation → Habits Sync API ====================

export async function createHabitsFromFormationPlan(userId, planItems, planType, token) {
  console.log(`[api] createHabitsFromFormationPlan userId=${userId} items=${planItems.length}`)
  const response = await fetch(`${API_BASE}/habits/create-from-formation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      user_id: userId,
      plan_items: planItems,
      plan_type: planType // 'short' | 'mid'
    })
  })
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行')
  }
  const data = await response.json()
  if (!response.ok) throw new Error(data.detail || data.error || '从人格塑造计划创建习惯失败')
  console.log(`[api] createHabitsFromFormationPlan created=${data.created_count}`)
  return data
}

// ==================== Bible Video Generation ====================

export async function fetchBibleVideo(book, chapter, verses, token = null) {
  console.log(`[api] fetchBibleVideo ${book} ${chapter} verses=${verses.length}`)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 5 * 60 * 1000)
  try {
    const response = await fetch(`${API_BASE}/bible/video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ book, chapter, verses }),
      signal: controller.signal,
    })
    if (!response.ok) {
      let msg = `视频生成失败 (${response.status})`
      try { const d = await response.json(); msg = d.detail || msg } catch (_) {}
      throw new Error(msg)
    }
    const blob = await response.blob()
    console.log(`[api] fetchBibleVideo ok size=${blob.size}`)
    return blob
  } finally {
    clearTimeout(timeoutId)
  }
}

// ── Sunday School Videos (主日学视频) ──────────────────────────────────────────

export async function fetchSundaySchoolVideos() {
  console.log('[api] fetchSundaySchoolVideos')
  const response = await fetch(`${API_BASE}/sunday-school/videos`)
  if (!response.ok) throw new Error(`Failed to load videos: ${response.status}`)
  return response.json()  // { ok, videos: [{id, title, teacher, scripture, description, video_url, thumbnail_url, duration_sec}...] }
}

// ── Seekers Class Courses (慕道班课程：文字/PPT/视频) ──────────────────────────

export async function fetchSeekersClassCourses() {
  console.log('[api] fetchSeekersClassCourses')
  const response = await fetch(`${API_BASE}/seekers-class/courses`)
  if (!response.ok) throw new Error(`Failed to load courses: ${response.status}`)
  return response.json()  // { ok, courses: [{id, title, filename, media_type, url, modified_ts}...] }
}

// ─────────────────────────────────────────────────────────────────────────────
// 语音群组 (LiveKit 群语音) — /api/voice/*
// ─────────────────────────────────────────────────────────────────────────────
const voiceHeaders = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

export async function fetchVoiceConfig(token) {
  const res = await fetch(`${API_BASE}/voice/config`, { headers: voiceHeaders(token) })
  if (!res.ok) throw new Error('voice config failed')
  return res.json()
}

export async function fetchVoiceGroups(token) {
  const res = await fetch(`${API_BASE}/voice/groups`, { headers: voiceHeaders(token) })
  if (!res.ok) throw new Error('加载语音群失败')
  return res.json()
}

export async function createVoiceGroup(name, token, maxMembers = 10) {
  const res = await fetch(`${API_BASE}/voice/groups`, {
    method: 'POST',
    headers: voiceHeaders(token, true),
    body: JSON.stringify({ name, max_members: maxMembers }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '建群失败')
  return data
}

export async function joinVoiceGroup(joinCode, token) {
  const res = await fetch(`${API_BASE}/voice/groups/join`, {
    method: 'POST',
    headers: voiceHeaders(token, true),
    body: JSON.stringify({ join_code: joinCode }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '加入失败')
  return data
}

export async function fetchVoiceMembers(groupId, token) {
  const res = await fetch(`${API_BASE}/voice/groups/${groupId}/members`, { headers: voiceHeaders(token) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '加载成员失败')
  return data
}

export async function fetchVoiceToken(groupId, token) {
  const res = await fetch(`${API_BASE}/voice/groups/${groupId}/token`, {
    method: 'POST',
    headers: voiceHeaders(token, true),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '获取通话凭证失败')
  return data
}

export async function leaveVoiceGroup(groupId, token) {
  const res = await fetch(`${API_BASE}/voice/groups/${groupId}/leave`, {
    method: 'POST',
    headers: voiceHeaders(token, true),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '退群失败')
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// 偶像监测 (依附强度指数) / Idolatry Detection — Attachment Intensity Index
// ─────────────────────────────────────────────────────────────────────────────
const idolHeaders = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

export async function fetchIdolatryMeta() {
  const res = await fetch(`${API_BASE}/idolatry/meta`)
  if (!res.ok) throw new Error('加载配置失败')
  return res.json()
}

export async function fetchIdolatrySignals(token) {
  const res = await fetch(`${API_BASE}/idolatry/signals`, { headers: idolHeaders(token) })
  if (!res.ok) throw new Error('加载信号失败')
  return res.json()
}

export async function assessIdolatry(payload, token) {
  const res = await fetch(`${API_BASE}/idolatry/assess`, {
    method: 'POST', headers: idolHeaders(token, true), body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '省察提交失败')
  return data
}

export async function fetchIdolatryPatterns(token, limit = 20) {
  const res = await fetch(`${API_BASE}/idolatry/patterns?limit=${limit}`, { headers: idolHeaders(token) })
  if (!res.ok) throw new Error('加载历史失败')
  return res.json()
}

export async function fetchIdolatryLatest(token) {
  const res = await fetch(`${API_BASE}/idolatry/latest`, { headers: idolHeaders(token) })
  if (!res.ok) throw new Error('加载失败')
  return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// 等候之路 / Waiting Transformation Module
// ─────────────────────────────────────────────────────────────────────────────
const waitHeaders = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

export async function fetchWaitingMeta() {
  const res = await fetch(`${API_BASE}/waiting/meta`)
  if (!res.ok) throw new Error('加载配置失败')
  return res.json()
}

export async function fetchWaitingCases(token, limit = 30) {
  const res = await fetch(`${API_BASE}/waiting/cases?limit=${limit}`, { headers: waitHeaders(token) })
  if (!res.ok) throw new Error('加载等待案例失败')
  return res.json()
}

export async function createWaitingCase(payload, token) {
  const res = await fetch(`${API_BASE}/waiting/cases`, {
    method: 'POST', headers: waitHeaders(token, true), body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '创建失败')
  return data
}

export async function analyzeWaitingCase(caseId, token, useAi = true) {
  const res = await fetch(`${API_BASE}/waiting/cases/${caseId}/analyze`, {
    method: 'POST', headers: waitHeaders(token, true), body: JSON.stringify({ use_ai: useAi }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '分析失败')
  return data
}

export async function generateWaitingPractices(caseId, token) {
  const res = await fetch(`${API_BASE}/waiting/cases/${caseId}/practices/generate`, {
    method: 'POST', headers: waitHeaders(token, true),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '生成操练失败')
  return data
}

export async function fetchWaitingCase(caseId, token) {
  const res = await fetch(`${API_BASE}/waiting/cases/${caseId}`, { headers: waitHeaders(token) })
  if (!res.ok) throw new Error('加载详情失败')
  return res.json()
}

export async function completeWaitingPractice(practiceId, payload, token) {
  const res = await fetch(`${API_BASE}/waiting/practices/${practiceId}/complete`, {
    method: 'POST', headers: waitHeaders(token, true), body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '提交失败')
  return data
}

export async function submitWaitingReflection(caseId, payload, token) {
  const res = await fetch(`${API_BASE}/waiting/cases/${caseId}/reflect`, {
    method: 'POST', headers: waitHeaders(token, true), body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '复盘提交失败')
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// 每周牧养小结 / Weekly pastoral summary
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchWeeklyPastoral(token) {
  const res = await fetch(`${API_BASE}/pastoral/weekly`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error('加载牧养小结失败')
  return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// 每日省察 / Daily Examen
// ─────────────────────────────────────────────────────────────────────────────
const examenHeaders = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

export async function fetchExamenToday(token) {
  const res = await fetch(`${API_BASE}/examen/today`, { headers: examenHeaders(token) })
  if (!res.ok) throw new Error('加载今日省察失败')
  return res.json()
}

export async function saveExamen(payload, token) {
  const res = await fetch(`${API_BASE}/examen`, {
    method: 'POST', headers: examenHeaders(token, true), body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '保存失败')
  return data
}

export async function fetchExamenHistory(token, limit = 30) {
  const res = await fetch(`${API_BASE}/examen/history?limit=${limit}`, { headers: examenHeaders(token) })
  if (!res.ok) throw new Error('加载历史失败')
  return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// Web Push 提醒 / Reminders
// ─────────────────────────────────────────────────────────────────────────────
const pushHeaders = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

export async function fetchVapidKey() {
  const res = await fetch(`${API_BASE}/push/vapid-public-key`)
  if (!res.ok) throw new Error('加载推送配置失败')
  return res.json()
}
export async function fetchPushPrefs(token) {
  const res = await fetch(`${API_BASE}/push/prefs`, { headers: pushHeaders(token) })
  if (!res.ok) throw new Error('加载提醒偏好失败')
  return res.json()
}
export async function subscribePush(payload, token) {
  const res = await fetch(`${API_BASE}/push/subscribe`, { method: 'POST', headers: pushHeaders(token, true), body: JSON.stringify(payload) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '订阅失败'); return d
}
export async function savePushPrefs(payload, token) {
  const res = await fetch(`${API_BASE}/push/prefs`, { method: 'POST', headers: pushHeaders(token, true), body: JSON.stringify(payload) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '保存失败'); return d
}
export async function testPush(token) {
  const res = await fetch(`${API_BASE}/push/test`, { method: 'POST', headers: pushHeaders(token, true) })
  return res.json().catch(() => ({}))
}

// ─────────────────────────────────────────────────────────────────────────────
// 读经计划 / Reading plan
// ─────────────────────────────────────────────────────────────────────────────
const rdHeaders = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})
export async function fetchReadingStatus(planId, token) {
  const res = await fetch(`${API_BASE}/reading/status?plan_id=${encodeURIComponent(planId)}`, { headers: rdHeaders(token) })
  if (!res.ok) throw new Error('加载进度失败'); return res.json()
}
export async function enrollReadingPlan(planId, token) {
  const res = await fetch(`${API_BASE}/reading/enroll`, { method: 'POST', headers: rdHeaders(token, true), body: JSON.stringify({ plan_id: planId }) })
  if (!res.ok) throw new Error('报名失败'); return res.json()
}
export async function completeReadingDay(planId, dayKey, token) {
  const res = await fetch(`${API_BASE}/reading/complete`, { method: 'POST', headers: rdHeaders(token, true), body: JSON.stringify({ plan_id: planId, day_key: dayKey }) })
  if (!res.ok) throw new Error('标记失败'); return res.json()
}
export async function uncompleteReadingDay(planId, dayKey, token) {
  const res = await fetch(`${API_BASE}/reading/uncomplete`, { method: 'POST', headers: rdHeaders(token, true), body: JSON.stringify({ plan_id: planId, day_key: dayKey }) })
  if (!res.ok) throw new Error('取消失败'); return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// 背经 / Scripture memory (SM-2)
// ─────────────────────────────────────────────────────────────────────────────
export async function addMemoryVerse(payload, token) {
  const res = await fetch(`${API_BASE}/memory/verses`, { method: 'POST', headers: rdHeaders(token, true), body: JSON.stringify(payload) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '添加失败'); return d
}
export async function fetchMemoryDue(token) {
  const res = await fetch(`${API_BASE}/memory/due`, { headers: rdHeaders(token) })
  if (!res.ok) throw new Error('加载失败'); return res.json()
}
export async function fetchMemoryList(token) {
  const res = await fetch(`${API_BASE}/memory/list`, { headers: rdHeaders(token) })
  if (!res.ok) throw new Error('加载失败'); return res.json()
}
export async function reviewMemoryVerse(id, grade, token) {
  const res = await fetch(`${API_BASE}/memory/review`, { method: 'POST', headers: rdHeaders(token, true), body: JSON.stringify({ id, grade }) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '提交失败'); return d
}
export async function deleteMemoryVerse(id, token) {
  const res = await fetch(`${API_BASE}/memory/verses/${id}`, { method: 'DELETE', headers: rdHeaders(token) })
  if (!res.ok) throw new Error('删除失败'); return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// 感恩日记 / 灵修问责 / 认罪与赦免 / 数据导出
// ─────────────────────────────────────────────────────────────────────────────
const hubHeaders = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})
export async function addGratitude(content, token) {
  const res = await fetch(`${API_BASE}/gratitude`, { method: 'POST', headers: hubHeaders(token, true), body: JSON.stringify({ content }) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '添加失败'); return d
}
export async function fetchGratitude(token) {
  const res = await fetch(`${API_BASE}/gratitude/list`, { headers: hubHeaders(token) }); if (!res.ok) throw new Error('加载失败'); return res.json()
}
export async function deleteGratitude(id, token) {
  const res = await fetch(`${API_BASE}/gratitude/${id}`, { method: 'DELETE', headers: hubHeaders(token) }); if (!res.ok) throw new Error('删除失败'); return res.json()
}
export async function fetchGoals(token) {
  const res = await fetch(`${API_BASE}/accountability/goals`, { headers: hubHeaders(token) }); if (!res.ok) throw new Error('加载失败'); return res.json()
}
export async function addGoal(payload, token) {
  const res = await fetch(`${API_BASE}/accountability/goals`, { method: 'POST', headers: hubHeaders(token, true), body: JSON.stringify(payload) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '添加失败'); return d
}
export async function checkinGoal(payload, token) {
  const res = await fetch(`${API_BASE}/accountability/checkin`, { method: 'POST', headers: hubHeaders(token, true), body: JSON.stringify(payload) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '打卡失败'); return d
}
export async function deleteGoal(id, token) {
  const res = await fetch(`${API_BASE}/accountability/goals/${id}`, { method: 'DELETE', headers: hubHeaders(token) }); if (!res.ok) throw new Error('删除失败'); return res.json()
}
export async function recordConfession(token) {
  const res = await fetch(`${API_BASE}/confession/record`, { method: 'POST', headers: hubHeaders(token, true) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '提交失败'); return d
}
export async function exportMyData(token) {
  const res = await fetch(`${API_BASE}/export/me`, { headers: hubHeaders(token) }); if (!res.ok) throw new Error('导出失败'); return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// 福音诊断室 / Gospel Diagnostic Lab
// ─────────────────────────────────────────────────────────────────────────────
export async function diagnoseGospel(payload, token) {
  const res = await fetch(`${API_BASE}/gospel/diagnose`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '诊断失败'); return d
}
export async function fetchGospelHistory(token, limit = 20) {
  const res = await fetch(`${API_BASE}/gospel/history?limit=${limit}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!res.ok) throw new Error('加载失败'); return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// 门徒塑造引擎 / Disciple Formation Engine (/api/disciple)
// ─────────────────────────────────────────────────────────────────────────────
const _dAuth = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

export async function fetchDiscipleMeta() {
  const res = await fetch(`${API_BASE}/disciple/meta`)
  if (!res.ok) throw new Error('加载失败'); return res.json()
}

export async function fetchDiscipleProfile(token) {
  const res = await fetch(`${API_BASE}/disciple/profile`, { headers: _dAuth(token) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '加载画像失败'); return d
}

export async function assessDisciple(payload, token) {
  const res = await fetch(`${API_BASE}/disciple/assess`, {
    method: 'POST', headers: _dAuth(token, true), body: JSON.stringify(payload),
  })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '评估失败'); return d
}

export async function fetchDiscipleHistory(token, limit = 20) {
  const res = await fetch(`${API_BASE}/disciple/history?limit=${limit}`, { headers: _dAuth(token) })
  if (!res.ok) throw new Error('加载历史失败'); return res.json()
}

export async function askDiscipleMentor(question, token) {
  const res = await fetch(`${API_BASE}/disciple/mentor`, {
    method: 'POST', headers: _dAuth(token, true), body: JSON.stringify({ question }),
  })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '导师暂不可用'); return d
}

export async function fetchDiscipleNetwork(token) {
  const res = await fetch(`${API_BASE}/disciple/network`, { headers: _dAuth(token) })
  if (!res.ok) throw new Error('加载网络失败'); return res.json()
}

export async function addDiscipleRelationship(payload, token) {
  const res = await fetch(`${API_BASE}/disciple/network`, {
    method: 'POST', headers: _dAuth(token, true), body: JSON.stringify(payload),
  })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '添加失败'); return d
}

export async function endDiscipleRelationship(relId, token) {
  const res = await fetch(`${API_BASE}/disciple/network/${relId}/end`, {
    method: 'POST', headers: _dAuth(token),
  })
  if (!res.ok) throw new Error('操作失败'); return res.json()
}

export async function fetchDiscipleReview(kind, token) {
  const res = await fetch(`${API_BASE}/disciple/review/${kind}`, { headers: _dAuth(token) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '加载复盘失败'); return d
}

export async function fetchDiscipleGraph(token) {
  const res = await fetch(`${API_BASE}/disciple/graph`, { headers: _dAuth(token) })
  if (!res.ok) throw new Error('加载图谱失败'); return res.json()
}

export async function fetchDiscipleMilestones(token) {
  const res = await fetch(`${API_BASE}/disciple/milestones`, { headers: _dAuth(token) })
  if (!res.ok) throw new Error('加载里程碑失败'); return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// 清晨甘露 / Morning Dew (司布真默想)
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchDewToday(tier = 10, token) {
  const res = await fetch(`${API_BASE}/dew/today?tier=${tier}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!res.ok) throw new Error('加载今日甘露失败'); return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// 属灵低潮体检 / Spiritual Checkup (钟马田)
// ─────────────────────────────────────────────────────────────────────────────
export async function submitCheckup(ratings, token) {
  const res = await fetch(`${API_BASE}/checkup/submit`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ ratings, use_ai: true }),
  })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '体检失败'); return d
}

// ─────────────────────────────────────────────────────────────────────────────
// 天路客 / Pilgrim Journey
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchPilgrimCurrent(token) {
  const res = await fetch(`${API_BASE}/pilgrim/current`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!res.ok) throw new Error('加载天路历程失败'); return res.json()
}
export async function fetchPilgrimJourney(token) {
  const res = await fetch(`${API_BASE}/pilgrim/journey`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!res.ok) throw new Error('加载旅程失败'); return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// 信望爱星系 / Faith-Hope-Love
// ─────────────────────────────────────────────────────────────────────────────
export async function evaluateVirtues(stateVector, token) {
  const res = await fetch(`${API_BASE}/virtues/evaluate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ state_vector: stateVector || {}, use_ai: true }),
  })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '评估失败'); return d
}

// ─────────────────────────────────────────────────────────────────────────────
// 决策辨识（司布真版）/ Decision Discernment
// ─────────────────────────────────────────────────────────────────────────────
export async function runDiscernment(payload, token) {
  const res = await fetch(`${API_BASE}/discern/run`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '辨识失败'); return d
}

// ─────────────────────────────────────────────────────────────────────────────
// 养料库 / Spiritual Fuel
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchFuelMeta() {
  const res = await fetch(`${API_BASE}/fuel/meta`); if (!res.ok) throw new Error('加载失败'); return res.json()
}
export async function fetchFuelPack(key, ai = 0) {
  const res = await fetch(`${API_BASE}/fuel/pack/${key}?ai=${ai}`); if (!res.ok) throw new Error('加载失败'); return res.json()
}
export async function fetchRecommendedFuel(token) {
  const res = await fetch(`${API_BASE}/formation/recommend`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '加载失败'); return d
}

// ─────────────────────────────────────────────────────────────────────────────
// 双属灵 Agent / Spiritual Agents (司布真 / 钟马田)
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchAgentMeta(token) {
  const res = await fetch(`${API_BASE}/agent/meta`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  if (!res.ok) throw new Error('加载失败'); return res.json()
}
export async function chatAgent(agent, messages, token) {
  const res = await fetch(`${API_BASE}/agent/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ agent, messages }),
  })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '对话失败'); return d
}


// ===== 在线社区 =====
export async function fetchCommunityFeed(limit = 20, offset = 0, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const r = await fetch(`${API_BASE}/community/feed?limit=${limit}&offset=${offset}`, { headers })
  const ct = r.headers.get('content-type') || ''
  if (!ct.includes('application/json')) throw new Error('后端服务未运行（请先启动 backend/main.py）')
  const data = await r.json()
  if (!r.ok) throw new Error(data.detail || data.error || '加载失败')
  return data
}
export async function createCommunityPost({ content, statusKey, statusLabel, statusEmoji }, token, isPublic = false) {
  const r = await fetch(`${API_BASE}/community/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ content: content || '', status_key: statusKey || '', status_label: statusLabel || '', status_emoji: statusEmoji || '', is_public: isPublic }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.detail || '发布失败')
  return data
}
export async function deleteCommunityPost(id, token) {
  const r = await fetch(`${API_BASE}/community/feed/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.detail || '删除失败')
  return data
}
export async function amenCommunityPost(id, token) {
  const r = await fetch(`${API_BASE}/community/feed/${id}/amen`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.detail || '操作失败')
  return data
}
export async function fetchCommunityComments(postId, token) {
  const r = await fetch(`${API_BASE}/community/feed/${postId}/comments`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.detail || '加载评论失败')
  return data
}
export async function createCommunityComment(postId, content, token) {
  const r = await fetch(`${API_BASE}/community/feed/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ content }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.detail || '评论失败')
  return data
}
export async function deleteCommunityComment(id, token) {
  const r = await fetch(`${API_BASE}/community/feed/comments/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(data.detail || '删除失败')
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// 多教会 SaaS — Church API (/api/church)
// ─────────────────────────────────────────────────────────────────────────────
const churchHeaders = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

export async function fetchMyChurch(token) {
  const res = await fetch(`${API_BASE}/church/me`, { headers: churchHeaders(token) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '获取教会信息失败')
  return data  // { church: {id,name,role,member_count,join_code?} | null }
}

export async function createChurch(name, token) {
  const res = await fetch(`${API_BASE}/church/create`, {
    method: 'POST',
    headers: churchHeaders(token, true),
    body: JSON.stringify({ name }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '创建教会失败')
  return data
}

export async function joinChurch(code, token) {
  const res = await fetch(`${API_BASE}/church/join`, {
    method: 'POST',
    headers: churchHeaders(token, true),
    body: JSON.stringify({ code }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '邀请码无效')
  return data
}

export async function fetchChurchMembers(token) {
  const res = await fetch(`${API_BASE}/church/members`, { headers: churchHeaders(token) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '获取成员失败')
  return data  // [{email,role,joined_at,nickname,avatar}]
}

export async function regenerateChurchCode(token) {
  const res = await fetch(`${API_BASE}/church/regenerate-code`, {
    method: 'POST',
    headers: churchHeaders(token, true),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '重新生成失败')
  return data
}

export async function leaveChurch(token) {
  const res = await fetch(`${API_BASE}/church/leave`, {
    method: 'POST',
    headers: churchHeaders(token, true),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '退出教会失败')
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// 背经里程碑 / Memory milestones (1/10/30/50/100)
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchMemoryMilestones(token) {
  const res = await fetch(`${API_BASE}/memory/milestones`, { headers: rdHeaders(token) })
  if (!res.ok) throw new Error('加载里程碑失败')
  return res.json()  // {ok, total, memorized, mastered, next_target, milestones:[{count,title,blessing,achieved}]}
}

// ─────────────────────────────────────────────────────────────────────────────
// 见证墙 / Testimony Wall (/api/testimonies)
// ─────────────────────────────────────────────────────────────────────────────
const twHeaders = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

export async function fetchTestimonies(limit = 20, offset = 0, token = null) {
  console.log(`[api] fetchTestimonies limit=${limit} offset=${offset}`)
  const res = await fetch(`${API_BASE}/testimonies?limit=${limit}&offset=${offset}`, { headers: twHeaders(token) })
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('后端服务未运行（请先启动 backend/main.py）')
  }
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || data.error || '加载见证失败')
  console.log(`[api] fetchTestimonies ok: ${data.items?.length ?? 0}/${data.total} items`)
  return data
}

export async function submitTestimony(payload, token) {
  console.log(`[api] submitTestimony title=${payload.title?.slice(0, 30)}`)
  const res = await fetch(`${API_BASE}/testimonies`, {
    method: 'POST', headers: twHeaders(token, true), body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || data.error || '提交见证失败')
  console.log(`[api] submitTestimony ok id=${data.id}`)
  return data
}

export async function amenTestimony(id, token) {
  console.log(`[api] amenTestimony id=${id}`)
  const res = await fetch(`${API_BASE}/testimonies/${id}/amen`, { method: 'POST', headers: twHeaders(token) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || data.error || '阿们失败')
  return data  // {ok, amen_count}
}

export async function deleteTestimony(id, token) {
  console.log(`[api] deleteTestimony id=${id}`)
  const res = await fetch(`${API_BASE}/testimonies/${id}`, { method: 'DELETE', headers: twHeaders(token) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || data.error || '删除失败')
  return data
}

// ─────────────────────────────────────────────────────────────────────────────
// 感恩回顾 / Gratitude review (近 N 天恩典回顾)
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchGratitudeReview(days = 7, token) {
  const res = await fetch(`${API_BASE}/gratitude/review?days=${days}`, { headers: hubHeaders(token) })
  if (!res.ok) throw new Error('加载恩典回顾失败')
  return res.json()  // {ok, days, total, active_days, by_day:[{day, entries:[{id,content,created_at}]}], verse}
}


// ─────────────────────────────────────────────────────────────────────────────
// 恩赐与呼召识别系统 / Gift & Calling OS (/api/gift)
// ─────────────────────────────────────────────────────────────────────────────
const _gAuth = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

export async function fetchGiftMeta() {
  const res = await fetch(`${API_BASE}/gift/meta`)
  if (!res.ok) throw new Error('加载失败'); return res.json()
}

// ── 世界观 / 生命叙事 (Worldview Formation OS, /api/worldview) ──
export async function rewriteNarrative(payload, token) {
  const res = await fetch(`${API_BASE}/worldview/narrative/rewrite`, {
    method: 'POST', headers: _gAuth(token, true), body: JSON.stringify(payload),
  })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '生成失败'); return d
}

export async function diagnoseWorldview(payload, token) {
  const res = await fetch(`${API_BASE}/worldview/diagnose`, {
    method: 'POST', headers: _gAuth(token, true), body: JSON.stringify(payload),
  })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '诊断失败'); return d
}

export async function fetchWorldviewProfile(token) {
  const res = await fetch(`${API_BASE}/worldview/profile`, { headers: _gAuth(token) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '加载画像失败'); return d
}

export async function fetchWorldviewAssessments(token, limit = 20) {
  const res = await fetch(`${API_BASE}/worldview/assessments?limit=${limit}`, { headers: _gAuth(token) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '加载失败'); return d
}

export async function fetchWorldviewMeta() {
  const res = await fetch(`${API_BASE}/worldview/meta`)
  if (!res.ok) throw new Error('加载失败'); return res.json()
}

// ── 统一成长闭环 (/api/formation) ──
export async function fetchFormationState(token) {
  const res = await fetch(`${API_BASE}/formation/state`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '加载失败'); return d
}
export async function fetchFormationTimeline(token, limit = 30, source = null) {
  const qs = new URLSearchParams({ limit: String(limit) }); if (source) qs.set('source', source)
  const res = await fetch(`${API_BASE}/formation/timeline?${qs.toString()}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '加载失败'); return d
}
export async function fetchFormationNext(token) {
  const res = await fetch(`${API_BASE}/formation/next`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '加载失败'); return d
}
export async function fetchFormationCurve(token, days = 90, bucket = 'week') {
  const qs = new URLSearchParams({ days: String(days), bucket })
  const res = await fetch(`${API_BASE}/formation/curve?${qs.toString()}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '加载失败'); return d
}

// ── 关怀可见性同意 (/api/care/my-consent) ──
export async function fetchCareConsent(token) {
  const res = await fetch(`${API_BASE}/care/my-consent`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '加载失败'); return d
}
export async function saveCareConsent(share, token) {
  const res = await fetch(`${API_BASE}/care/my-consent`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ share_formation_flags: share }) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '保存失败'); return d
}
export async function postFormationEvent(payload, token) {
  const res = await fetch(`${API_BASE}/formation/event`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '写入失败'); return d
}
export async function postFormationBaseline(payload, token) {
  const res = await fetch(`${API_BASE}/formation/baseline`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '诊断失败'); return d
}

// ── 统一辨识 (/api/discernment) ──
export async function diagnoseDiscernment(payload, token) {
  const res = await fetch(`${API_BASE}/discernment/diagnose`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '诊断失败'); return d
}

export async function fetchGiftProfile(token) {
  const res = await fetch(`${API_BASE}/gift/profile`, { headers: _gAuth(token) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '加载画像失败'); return d
}

export async function assessGift(payload, token) {
  const res = await fetch(`${API_BASE}/gift/assess`, {
    method: 'POST', headers: _gAuth(token, true), body: JSON.stringify(payload),
  })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '评估失败'); return d
}

export async function fetchGiftHistory(token, limit = 20) {
  const res = await fetch(`${API_BASE}/gift/history?limit=${limit}`, { headers: _gAuth(token) })
  if (!res.ok) throw new Error('加载历史失败'); return res.json()
}

export async function fetchGiftAssessment(id, token) {
  const res = await fetch(`${API_BASE}/gift/assessment/${id}`, { headers: _gAuth(token) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '加载报告失败'); return d
}

export async function submitGiftFeedback(payload, token) {
  const res = await fetch(`${API_BASE}/gift/feedback`, {
    method: 'POST', headers: _gAuth(token, true), body: JSON.stringify(payload),
  })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '提交反馈失败'); return d
}

export async function fetchGiftFeedback(token) {
  const res = await fetch(`${API_BASE}/gift/feedback`, { headers: _gAuth(token) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '加载反馈失败'); return d
}

export async function submitGiftReview(payload, token) {
  const res = await fetch(`${API_BASE}/gift/review`, {
    method: 'POST', headers: _gAuth(token, true), body: JSON.stringify(payload),
  })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '提交复盘失败'); return d
}

export async function fetchGiftReviews(token, limit = 20) {
  const res = await fetch(`${API_BASE}/gift/review?limit=${limit}`, { headers: _gAuth(token) })
  if (!res.ok) throw new Error('加载复盘失败'); return res.json()
}

// ── SWR 缓存（只读接口秒出，后台静默刷新）──
const _swrMem = new Map()
const _swrInflight = new Map()
function _swrLsGet(key) {
  try { const r = localStorage.getItem('swr:' + key); return r ? JSON.parse(r) : null } catch { return null }
}
function _swrLsSet(key, data) {
  try { localStorage.setItem('swr:' + key, JSON.stringify({ data, ts: Date.now() })) } catch { /* 配额满则忽略 */ }
}
function _swrRevalidate(key, fetcher) {
  if (_swrInflight.has(key)) return _swrInflight.get(key)
  const p = Promise.resolve().then(fetcher)
    .then((data) => { const e = { data, ts: Date.now() }; _swrMem.set(key, e); _swrLsSet(key, data); _swrInflight.delete(key); return data })
    .catch((err) => { _swrInflight.delete(key); throw err })
  _swrInflight.set(key, p)
  return p
}
export async function swr(key, fetcher, ttlMs = 5 * 60 * 1000) {
  const entry = _swrMem.get(key) || _swrLsGet(key)
  if (entry && typeof entry.ts === 'number') {
    const fresh = (Date.now() - entry.ts) < ttlMs
    if (!fresh) _swrRevalidate(key, fetcher).catch(() => {})
    return entry.data
  }
  return _swrRevalidate(key, fetcher)
}
export function clearSwrCache() {
  _swrMem.clear(); _swrInflight.clear()
  try { Object.keys(localStorage).filter(k => k.startsWith('swr:')).forEach(k => localStorage.removeItem(k)) } catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lectio Divina 圣经默想 / Scripture meditation
// ─────────────────────────────────────────────────────────────────────────────
const lectioHeaders = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

export async function fetchLectioPassages(token) {
  const res = await fetch(`${API_BASE}/lectio/passages`, { headers: lectioHeaders(token) })
  if (!res.ok) throw new Error('加载经文库失败')
  return res.json()
}

export async function fetchDailyLectio(token) {
  const res = await fetch(`${API_BASE}/lectio/passages/daily`, { headers: lectioHeaders(token) })
  if (!res.ok) throw new Error('加载今日经文失败')
  return res.json()
}

export async function createLectioSession(passageId, token) {
  const res = await fetch(`${API_BASE}/lectio/sessions`, {
    method: 'POST', headers: lectioHeaders(token, true),
    body: JSON.stringify({ passage_id: passageId || '' }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '开始默想失败')
  return data
}

export async function submitLectioStage(sid, payload, token) {
  const res = await fetch(`${API_BASE}/lectio/sessions/${sid}/stage`, {
    method: 'POST', headers: lectioHeaders(token, true), body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '保存失败')
  return data
}

export async function completeLectioSession(sid, payload, token) {
  const res = await fetch(`${API_BASE}/lectio/sessions/${sid}/complete`, {
    method: 'POST', headers: lectioHeaders(token, true), body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '完成失败')
  return data
}

export async function fetchLectioHistory(token, limit = 30) {
  const res = await fetch(`${API_BASE}/lectio/history?limit=${limit}`, { headers: lectioHeaders(token) })
  if (!res.ok) throw new Error('加载历史失败')
  return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// Psalm Prayer 诗篇祷告 / pray through the Psalms
// ─────────────────────────────────────────────────────────────────────────────
const psalmHeaders = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})

export async function fetchPsalms(token) {
  const res = await fetch(`${API_BASE}/psalm/psalms`, { headers: psalmHeaders(token) })
  if (!res.ok) throw new Error('加载诗篇库失败')
  return res.json()
}

export async function recommendPsalms(payload, token) {
  const res = await fetch(`${API_BASE}/psalm/recommend`, {
    method: 'POST', headers: psalmHeaders(token, true), body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('推荐失败')
  return res.json()
}

export async function createPsalmSession(payload, token) {
  const res = await fetch(`${API_BASE}/psalm/sessions`, {
    method: 'POST', headers: psalmHeaders(token, true), body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '开始祷告失败')
  return data
}

export async function submitPsalmMovement(sid, payload, token) {
  const res = await fetch(`${API_BASE}/psalm/sessions/${sid}/movement`, {
    method: 'POST', headers: psalmHeaders(token, true), body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '保存失败')
  return data
}

export async function completePsalmSession(sid, payload, token) {
  const res = await fetch(`${API_BASE}/psalm/sessions/${sid}/complete`, {
    method: 'POST', headers: psalmHeaders(token, true), body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || '完成失败')
  return data
}

export async function fetchPsalmHistory(token, limit = 30) {
  const res = await fetch(`${API_BASE}/psalm/history?limit=${limit}`, { headers: psalmHeaders(token) })
  if (!res.ok) throw new Error('加载历史失败')
  return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// Mission Life Design 使命生活设计
// ─────────────────────────────────────────────────────────────────────────────
const missionHeaders = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})
export async function fetchMissionDomains(token) {
  const res = await fetch(`${API_BASE}/mission-life/domains`, { headers: missionHeaders(token) })
  if (!res.ok) throw new Error('加载使命领域失败'); return res.json()
}
export async function designMissionLife(payload, token) {
  const res = await fetch(`${API_BASE}/mission-life/design`, { method: 'POST', headers: missionHeaders(token, true), body: JSON.stringify(payload) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '生成失败'); return d
}
export async function createMissionProfile(payload, token) {
  const res = await fetch(`${API_BASE}/mission-life/profiles`, { method: 'POST', headers: missionHeaders(token, true), body: JSON.stringify(payload) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '创建失败'); return d
}
export async function fetchLatestMissionProfile(token) {
  const res = await fetch(`${API_BASE}/mission-life/profiles/latest`, { headers: missionHeaders(token) })
  if (!res.ok) throw new Error('加载画像失败'); return res.json()
}
export async function addMissionCommitment(pid, payload, token) {
  const res = await fetch(`${API_BASE}/mission-life/profiles/${pid}/commitments`, { method: 'POST', headers: missionHeaders(token, true), body: JSON.stringify(payload) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '添加失败'); return d
}
export async function fetchMissionCommitments(token) {
  const res = await fetch(`${API_BASE}/mission-life/commitments`, { headers: missionHeaders(token) })
  if (!res.ok) throw new Error('加载承诺失败'); return res.json()
}
export async function createMissionProject(payload, token) {
  const res = await fetch(`${API_BASE}/mission-life/projects`, { method: 'POST', headers: missionHeaders(token, true), body: JSON.stringify(payload) })
  const d = await res.json().catch(() => ({})); if (!res.ok) throw new Error(d.detail || '创建失败'); return d
}
export async function fetchMissionProjects(token) {
  const res = await fetch(`${API_BASE}/mission-life/projects`, { headers: missionHeaders(token) })
  if (!res.ok) throw new Error('加载项目失败'); return res.json()
}
export async function fetchMissionReview(token) {
  const res = await fetch(`${API_BASE}/mission-life/review`, { headers: missionHeaders(token) })
  if (!res.ok) throw new Error('加载回顾失败'); return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// B1-6 新 skill 统一封装：祷告规则/代祷/同在/试探/果子/安息/禁食
// ─────────────────────────────────────────────────────────────────────────────
const _fH = (token, json = false) => ({
  ...(json ? { 'Content-Type': 'application/json' } : {}),
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
})
async function _fGet(path, token) {
  const r = await fetch(`${API_BASE}${path}`, { headers: _fH(token) })
  if (!r.ok) throw new Error('加载失败')
  return r.json()
}
async function _fPost(path, body, token) {
  const r = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: _fH(token, true), body: JSON.stringify(body || {}) })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d.detail || '操作失败')
  return d
}

export const formationApi = {
  // Prayer Rule
  prayerToday: (t) => _fGet('/prayer-rule/today', t),
  createDefaultRule: (t) => _fPost('/prayer-rule/rules/default', {}, t),
  startPrayerSession: (b, t) => _fPost('/prayer-rule/sessions', b, t),
  completePrayerSession: (id, b, t) => _fPost(`/prayer-rule/sessions/${id}/complete`, b, t),
  prayerReview: (t) => _fGet('/prayer-rule/review', t),
  // Intercession
  intercessionToday: (t) => _fGet('/intercession/today', t),
  intercessionRequests: (status, t) => _fGet(`/intercession/requests?status=${status || 'active'}`, t),
  addIntercessionRequest: (b, t) => _fPost('/intercession/requests', b, t),
  prayRequest: (id, b, t) => _fPost(`/intercession/requests/${id}/pray`, b, t),
  answerRequest: (id, b, t) => _fPost(`/intercession/requests/${id}/answered`, b, t),
  // Practicing Presence
  presencePractices: (t) => _fGet('/presence/practices', t),
  recommendPresence: (b, t) => _fPost('/presence/recommend', b, t),
  startPresenceCheckin: (b, t) => _fPost('/presence/checkins', b, t),
  completePresenceCheckin: (id, b, t) => _fPost(`/presence/checkins/${id}/complete`, b, t),
  presenceReflection: (t) => _fGet('/presence/reflection', t),
  // Temptation
  temptationTypes: (t) => _fGet('/temptation/types', t),
  resistTemptation: (b, t) => _fPost('/temptation/resist', b, t),
  createTemptationPlan: (b, t) => _fPost('/temptation/plans', b, t),
  temptationPlans: (t) => _fGet('/temptation/plans', t),
  temptationCheckin: (b, t) => _fPost('/temptation/checkins', b, t),
  // Fruit
  fruitDimensions: (t) => _fGet('/fruit/dimensions', t),
  submitFruit: (b, t) => _fPost('/fruit/assessments', b, t),
  fruitLatest: (t) => _fGet('/fruit/latest', t),
  fruitTrends: (t) => _fGet('/fruit/trends', t),
  fruitInsights: (t) => _fPost('/fruit/insights', {}, t),
  // Sabbath & Rest
  sabbathAudit: (b, t) => _fPost('/sabbath/audit', b, t),
  sabbathLatestAudit: (t) => _fGet('/sabbath/audit/latest', t),
  sabbathRecommend: (t) => _fGet('/sabbath/recommend', t),
  createSabbathPlan: (b, t) => _fPost('/sabbath/plans', b, t),
  sabbathActivePlan: (t) => _fGet('/sabbath/plans/active', t),
  // Fasting & Simplicity
  fastingPractices: (t) => _fGet('/fasting/practices', t),
  recommendFasting: (b, t) => _fPost('/fasting/recommend', b, t),
  createFastingPlan: (b, t) => _fPost('/fasting/plans', b, t),
  fastingActivePlans: (t) => _fGet('/fasting/plans/active', t),
  simplicityAudit: (b, t) => _fPost('/fasting/simplicity/audit', b, t),
}

// ─────────────────────────────────────────────────────────────────────────────
// B7 群体/门训 + B9 教义 统一封装
// ─────────────────────────────────────────────────────────────────────────────
async function _fPatch(path, body, token) {
  const r = await fetch(`${API_BASE}${path}`, { method: 'PATCH', headers: _fH(token, true), body: JSON.stringify(body || {}) })
  const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d.detail || '操作失败'); return d
}

export const communityApi = {
  // Mentor
  mentorRels: (t) => _fGet('/mentor/relationships', t),
  createMentorRel: (b, t) => _fPost('/mentor/relationships', b, t),
  mentorSessions: (rid, t) => _fGet(`/mentor/relationships/${rid}/sessions`, t),
  createMentorSession: (rid, b, t) => _fPost(`/mentor/relationships/${rid}/sessions`, b, t),
  mentorRecommend: (b, t) => _fPost('/mentor/recommend', b, t),
  mentorQuestions: (t) => _fGet('/mentor/questions', t),
  // Accountability Group
  myGroups: (t) => _fGet('/accountability-group/groups', t),
  createGroup: (b, t) => _fPost('/accountability-group/groups', b, t),
  groupDetail: (id, t) => _fGet(`/accountability-group/groups/${id}`, t),
  groupCheckin: (id, b, t) => _fPost(`/accountability-group/groups/${id}/checkins`, b, t),
  groupCheckins: (id, t) => _fGet(`/accountability-group/groups/${id}/checkins`, t),
  groupPrayers: (id, t) => _fGet(`/accountability-group/groups/${id}/prayer-requests`, t),
  addGroupPrayer: (id, b, t) => _fPost(`/accountability-group/groups/${id}/prayer-requests`, b, t),
  // Discipleship
  discStages: (t) => _fGet('/discipleship/stages', t),
  discAssess: (b, t) => _fPost('/discipleship/assessments', b, t),
  discRecommend: (t) => _fPost('/discipleship/recommend', {}, t),
  discCreatePath: (b, t) => _fPost('/discipleship/paths', b, t),
  discActivePath: (t) => _fGet('/discipleship/paths/active', t),
  discUpdateStep: (id, b, t) => _fPatch(`/discipleship/steps/${id}`, b, t),
  // Church Integration
  churchCurrent: (t) => _fGet('/church-integration/connections/current', t),
  churchUpsert: (b, t) => _fPost('/church-integration/connections', b, t),
  churchRecommend: (b, t) => _fPost('/church-integration/recommend', b, t),
  churchRhythms: (t) => _fGet('/church-integration/rhythms', t),
  churchCreateRhythm: (b, t) => _fPost('/church-integration/rhythms', b, t),
  churchReentry: (b, t) => _fPost('/church-integration/reentry-plans', b, t),
  // Doctrine (B9)
  doctrineTopics: (t) => _fGet('/doctrine/topics', t),
  doctrinePaths: (t) => _fGet('/doctrine/paths', t),
  doctrineRecommend: (b, t) => _fPost('/doctrine/recommend', b, t),
  doctrineProgress: (b, t) => _fPost('/doctrine/progress', b, t),
}

// ── 属灵塑造扩展 6 模块 (爱之秩序 / 恩典身份 / 信经问答 / 生命规则+辨识 / 十架哀歌 / 圣礼年历) ──
export const formationExtApi = {
  // 爱之秩序星图
  ordoRecord: (b, t) => _fPost('/ordo-amoris/record', b, t),
  ordoHistory: (t, limit = 20) => _fGet(`/ordo-amoris/history?limit=${limit}`, t),
  // 与基督联合 / 恩典身份
  graceLog: (b, t) => _fPost('/grace-identity/log', b, t),
  graceHistory: (t, limit = 20) => _fGet(`/grace-identity/history?limit=${limit}`, t),
  // 信经与教理问答
  creedState: (t) => _fGet('/creed-catechism/state', t),
  creedComplete: (b, t) => _fPost('/creed-catechism/complete', b, t),
  creedUncomplete: (b, t) => _fPost('/creed-catechism/uncomplete', b, t),
  // 生命规则 + 依纳爵辨识
  ruleSave: (b, t) => _fPost('/rule-discernment/rule', b, t),
  ruleLatest: (t) => _fGet('/rule-discernment/rule/latest', t),
  discernmentSave: (b, t) => _fPost('/rule-discernment/discernment', b, t),
  discernmentHistory: (t, limit = 20) => _fGet(`/rule-discernment/discernment/history?limit=${limit}`, t),
  // 十架 · 哀歌 · 盼望
  lamentSave: (b, t) => _fPost('/cross-lament-hope/lament', b, t),
  lamentHistory: (t, limit = 20) => _fGet(`/cross-lament-hope/history?limit=${limit}`, t),
  // 圣礼与教会年历
  sacramentCurrent: (t) => _fGet('/sacrament-calendar/current', t),
  lordDaySave: (b, t) => _fPost('/sacrament-calendar/lord-day', b, t),
  lordDayHistory: (t, limit = 20) => _fGet(`/sacrament-calendar/lord-day/history?limit=${limit}`, t),
}

// ── AI Formation Agent 统一层 (B10) ──
export const agentApi = {
  dashboard: (t) => _fGet('/formation-agent/dashboard', t),
  route: (b, t) => _fPost('/formation-agent/route', b, t),
  dailyPlan: (b, t) => _fPost('/formation-agent/daily-plan', b, t),
  todayPlan: (t) => _fGet('/formation-agent/daily-plan/today', t),
  recommendations: (t) => _fGet('/formation-agent/recommendations', t),
}

// ── Formation Analytics (B11) ──
export const analyticsApi = {
  summary: (period, t) => _fGet(`/analytics/summary?period=${period || 'monthly'}`, t),
  series: (days, t) => _fGet(`/analytics/series?days=${days || 84}`, t),
  graceEvidence: (t) => _fGet('/analytics/grace-evidence', t),
  addGrace: (b, t) => _fPost('/analytics/grace-evidence', b, t),
  generateReport: (period, t) => _fPost(`/analytics/reports/generate?period=${period || 'monthly'}`, {}, t),
  reports: (t) => _fGet('/analytics/reports', t),
}

// ── Productization (B12) ──
export const prodApi = {
  plans: (t) => _fGet('/productization/plans', t),
  subscription: (t) => _fGet('/productization/subscription', t),
  subscribe: (b, t) => _fPost('/productization/subscribe', b, t),
  myOrgs: (t) => _fGet('/productization/orgs', t),
  createOrg: (b, t) => _fPost('/productization/orgs', b, t),
}

async function _fDelete(path, token) {
  const r = await fetch(`${API_BASE}${path}`, { method: 'DELETE', headers: _fH(token) })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d.detail || '操作失败')
  return d
}

// ── Spiritual Memory 记忆库 (B10) ──
export const memoryApi = {
  profile: (t) => _fGet('/spiritual-memory/profile', t),
  patchProfile: (b, t) => _fPatch('/spiritual-memory/profile', b, t),
  consent: (t) => _fGet('/spiritual-memory/consent', t),
  patchConsent: (b, t) => _fPatch('/spiritual-memory/consent', b, t),
  items: (type, t) => _fGet(`/spiritual-memory/items${type ? `?memory_type=${encodeURIComponent(type)}` : ''}`, t),
  addItem: (b, t) => _fPost('/spiritual-memory/items', b, t),
  patchItem: (id, b, t) => _fPatch(`/spiritual-memory/items/${id}`, b, t),
  deleteItem: (id, t) => _fDelete(`/spiritual-memory/items/${id}`, t),
  search: (b, t) => _fPost('/spiritual-memory/search', b, t),
  summary: (t) => _fGet('/spiritual-memory/summary', t),
}

// ── AI Tutor 属灵导师对话 (B10) ──
export const tutorApi = {
  threads: (t) => _fGet('/ai-tutor/threads', t),
  createThread: (b, t) => _fPost('/ai-tutor/threads', b, t),
  thread: (id, t) => _fGet(`/ai-tutor/threads/${id}`, t),
  send: (id, b, t) => _fPost(`/ai-tutor/threads/${id}/messages`, b, t),
  archive: (id, t) => _fDelete(`/ai-tutor/threads/${id}`, t),
  chat: (b, t) => _fPost('/ai-tutor/chat', b, t),
}

// ── Org Console 组织管理台 (B12 多租户) ──
export const orgApi = {
  myRole: (oid, t) => _fGet(`/org-console/${oid}/my-role`, t),
  summary: (oid, t) => _fGet(`/org-console/${oid}/summary`, t),
  groups: (oid, t) => _fGet(`/org-console/${oid}/groups`, t),
  claimGroup: (oid, gid, t) => _fPost(`/org-console/${oid}/groups/${gid}/claim`, {}, t),
  mentorRelationships: (oid, t) => _fGet(`/org-console/${oid}/mentor-relationships`, t),
  members: (oid, t) => _fGet(`/org-console/${oid}/members`, t),
  discipleship: (oid, t) => _fGet(`/org-console/${oid}/discipleship`, t),
  mentorProgress: (oid, t) => _fGet(`/org-console/${oid}/mentor-progress`, t),
  churchTrend: (oid, weeks, t) => _fGet(`/org-console/${oid}/church-trend?weeks=${weeks || 12}`, t),
  groupHealth: (oid, t) => _fGet(`/org-console/${oid}/group-health`, t),
  activityTrend: (oid, weeks, t) => _fGet(`/org-console/${oid}/activity-trend?weeks=${weeks || 12}`, t),
}

// ── Billing / Stripe (B12-4) ──
export const billingApi = {
  status: (t) => _fGet('/billing/status', t),
  checkout: (b, t) => _fPost('/billing/checkout', b, t),
}

// ── Platform Admin / Moderation (B12-4) ──
export const platformApi = {
  overview: (t) => _fGet('/platform/overview', t),
  crisisQueue: (days, t) => _fGet(`/platform/moderation/crisis-queue?days=${days || 30}`, t),
  reviewCrisis: (id, b, t) => _fPost(`/platform/moderation/crisis/${id}/review`, b, t),
  orgs: (t) => _fGet('/platform/orgs', t),
  suspendOrg: (id, b, t) => _fPost(`/platform/orgs/${id}/suspend`, b, t),
  reactivateOrg: (id, b, t) => _fPost(`/platform/orgs/${id}/reactivate`, b, t),
  modLog: (t) => _fGet('/platform/moderation/log', t),
}

// ─────────────────────────────────────────────────────────────────────────────
// Church Health OS · 健康教会九标志 (9Marks 教会健康生态层)
// ─────────────────────────────────────────────────────────────────────────────
async function _fPut(path, body, token) {
  const r = await fetch(`${API_BASE}${path}`, { method: 'PUT', headers: _fH(token, true), body: JSON.stringify(body || {}) })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d.detail || '操作失败')
  return d
}

export const churchHealthApi = {
  meta: (t) => _fGet('/church-health/meta', t),
  marks: (t) => _fGet('/church-health/marks', t),
  overview: (t) => _fGet('/church-health/dashboard/overview', t),
  computeSnapshot: (t) => _fPost('/church-health/snapshots/compute', {}, t),
  snapshots: (t) => _fGet('/church-health/snapshots/me', t),
  getMembership: (t) => _fGet('/church-health/membership/me', t),
  saveMembership: (b, t) => _fPut('/church-health/membership', b, t),
  createSermon: (b, t) => _fPost('/church-health/sermons', b, t),
  listSermons: (t) => _fGet('/church-health/sermons/me', t),
  formSermon: (b, t) => _fPost('/church-health/sermons/form', b, t),
  assessGospel: (b, t) => _fPost('/church-health/gospel/assess', b, t),
  listGospel: (t) => _fGet('/church-health/gospel/me', t),
  createRepentance: (b, t) => _fPost('/church-health/repentance', b, t),
  listRepentance: (t) => _fGet('/church-health/repentance/me', t),
  createDiscipleship: (b, t) => _fPost('/church-health/discipleship', b, t),
  listDiscipleship: (t) => _fGet('/church-health/discipleship/me', t),
  careSignals: (t) => _fGet('/church-health/care-signals', t),
}
