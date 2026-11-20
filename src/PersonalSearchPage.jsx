// PersonalSearchPage — 个人数据全局搜索。
// 一个关键词横跨：灵修日记 / 个人笔记 / 主日笔记 / 我的祷告 / 聚会纪要 / 背经卡，
// 对接真实后端 GET /api/personal/search，支持防抖取消与账号隔离的本地背经卡合并。
import { useCallback, useEffect, useRef, useState } from 'react'
import BackButton from './BackButton'
import { searchPersonal } from './api'
import { getCachedUser } from './auth'
import { getDeck } from './lib/memoryDeck'
import { t } from './i18n/runtime'

const GROUP_ORDER = ['devotion', 'personal_note', 'sermon', 'prayer', 'minutes', 'memory']

const GROUP_META = {
  devotion:      { icon: '📖', label: '灵修日记', panel: 'devotion' },
  personal_note: { icon: '📔', label: '个人笔记', panel: 'devotion' },
  sermon:        { icon: '✍️', label: '主日笔记', panel: 'journal' },
  prayer:        { icon: '🙏', label: '我的祷告', panel: 'prayer' },
  minutes:       { icon: '📝', label: '聚会纪要', panel: 'group-hub' },
  memory:        { icon: '🃏', label: '背经卡',   panel: 'memory-deck' },
}

function Highlight({ text, q }) {
  if (!q || !text) return <>{text}</>
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(255,214,10,0.35)', color: '#ffe9b3', borderRadius: 3, padding: '0 2px' }}>
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  )
}

const _norm = (x) => String(x == null ? '' : x).toLowerCase()

function _snippet(text, kw, pad = 30) {
  const s = String(text || '')
  const i = s.toLowerCase().indexOf(String(kw).toLowerCase())
  if (i < 0) return s.slice(0, 90)
  const start = Math.max(0, i - pad)
  const end = Math.min(s.length, i + kw.length + pad)
  return (start > 0 ? '…' : '') + s.slice(start, end) + (end < s.length ? '…' : '')
}

function isAbortError(err) {
  if (!err) return false
  return err.name === 'AbortError' || /aborted/i.test(String(err.message || ''))
}

function loadOwnerScopedMemoryCards(kw, { token, user } = {}) {
  const needle = _norm(kw).trim()
  if (!needle || typeof localStorage === 'undefined') return []

  const effectiveUser = user || getCachedUser()
  const activeUserId = String(effectiveUser?.id ?? effectiveUser?.user_id ?? '').trim()
  let storedOwnerId = ''
  try {
    storedOwnerId = String(localStorage.getItem('memory-deck-owner-id') || '').trim()
  } catch {
    storedOwnerId = ''
  }

  let rawCards = []
  if (activeUserId) {
    try {
      const scopedRaw = localStorage.getItem(`memory-deck-v1:${activeUserId}`)
      if (scopedRaw) {
        const parsed = JSON.parse(scopedRaw)
        rawCards = Array.isArray(parsed) ? parsed : []
      } else if (!storedOwnerId || storedOwnerId === activeUserId) {
        rawCards = getDeck() || []
      }
    } catch {
      rawCards = []
    }
  } else if (token) {
    if (!storedOwnerId) {
      rawCards = getDeck() || []
    }
  } else if (!storedOwnerId) {
    rawCards = getDeck() || []
  }

  return rawCards
    .filter((card) => {
      if (!card || typeof card !== 'object') return false
      const cardOwner = String(card.userId ?? card.user_id ?? card.ownerId ?? '').trim()
      if (activeUserId && cardOwner && cardOwner !== activeUserId) return false
      if (!activeUserId && cardOwner) return false
      return [card.ref, card.textCuv, card.textEsv].map(_norm).join(' ').includes(needle)
    })
    .map((card) => ({
      id: card.id || card.ref,
      source: 'memory',
      title: card.ref || t('背经卡'),
      date: '',
      snippet: _snippet(card.textCuv || card.textEsv, kw),
      scripture: card.ref || '',
    }))
}

function buildDisplayGroups(apiData, localMemoryHits, kw) {
  const serverGroups = apiData?.groups || {}
  const groups = []

  for (const key of GROUP_ORDER) {
    const meta = GROUP_META[key]
    const serverItems = Array.isArray(serverGroups[key]) ? serverGroups[key] : []
    if (key === 'memory') {
      const seen = new Set()
      const merged = []
      for (const item of [...serverItems, ...localMemoryHits]) {
        const dedupeKey = String(item?.id ?? item?.scripture ?? item?.title ?? '').trim()
        if (!dedupeKey || seen.has(dedupeKey)) continue
        seen.add(dedupeKey)
        merged.push(item)
      }
      if (merged.length > 0) {
        groups.push({ type: key, label: meta.label, items: merged })
      }
    } else if (serverItems.length > 0) {
      groups.push({ type: key, label: meta.label, items: serverItems })
    }
  }

  return {
    q: apiData?.query || kw,
    total: groups.reduce((acc, g) => acc + g.items.length, 0),
    groups,
  }
}

export default function PersonalSearchPage({ token, user = null, onBack, onOpenPanel }) {
  const [q, setQ] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const timerRef = useRef(null)
  const abortRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      abortRef.current?.abort()
    }
  }, [])

  const doSearch = useCallback(async (kw) => {
    const trimmed = String(kw || '').trim()
    if (!trimmed) {
      abortRef.current?.abort()
      setResult(null)
      setErr('')
      setLoading(false)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setErr('')
    try {
      const apiData = await searchPersonal(trimmed, token, {
        signal: controller.signal,
        limit: 30,
      })
      if (controller.signal.aborted) return
      const localMemory = loadOwnerScopedMemoryCards(trimmed, { token, user })
      setResult(buildDisplayGroups(apiData, localMemory, trimmed))
    } catch (e) {
      if (isAbortError(e) || controller.signal.aborted) return
      setResult(null)
      setErr(String(e?.message || e || t('搜索失败，请稍后重试')))
    } finally {
      if (abortRef.current === controller) {
        setLoading(false)
      }
    }
  }, [token, user])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const kw = q.trim()
    if (!kw) {
      abortRef.current?.abort()
      setResult(null)
      setErr('')
      setLoading(false)
      return
    }
    timerRef.current = setTimeout(() => {
      void doSearch(kw)
    }, 400)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [q, doSearch])

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#0d1117', color: '#fff', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <BackButton onClick={onBack} />
        <div style={{ fontSize: 16, fontWeight: 700 }}>🗃 {t("我的数据搜索")}</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14, boxSizing: 'border-box' }}>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("搜灵修日记、主日笔记、祷告、纪要、背经卡…")}
          style={{
            width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12,
            padding: '12px 14px', color: '#fff', fontSize: 15, fontFamily: 'inherit', outline: 'none',
          }}
          aria-label={t("搜灵修日记、主日笔记、祷告、纪要、背经卡…")}
        />

        {!q.trim() && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', fontSize: 13.5, lineHeight: 2, padding: '40px 16px' }}>
            {t("输入关键词，一次搜遍你的全部属灵记录：")}<br />
            📖 {t("灵修日记")} · 📔 {t("个人笔记")} · ✍️ {t("主日笔记")} · 🙏 {t("我的祷告")}<br />
            📝 {t("聚会纪要")} · 🃏 {t("背经卡")}
          </div>
        )}

        {loading && (
          <div data-testid="personal-search-loading" style={{ textAlign: 'center', padding: 24, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            {t("搜索中…")}
          </div>
        )}

        {err && !loading && (
          <div data-testid="personal-search-error" role="alert" style={{ textAlign: 'center', padding: '24px 16px', color: '#ff6b6b', fontSize: 13 }}>
            <div>{err}</div>
            <button
              type="button"
              data-testid="personal-search-retry"
              onClick={() => void doSearch(q.trim())}
              style={{
                marginTop: 12,
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.08)',
                color: '#fff',
                fontSize: 12.5,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t("重试搜索")}
            </button>
          </div>
        )}

        {result && !loading && !err && result.groups?.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: 'rgba(255,255,255,0.45)', fontSize: 13.5 }}>
            {t("没有找到包含「")}{result.q}{t("」的记录。")}
            {!token && <div style={{ fontSize: 12, color: '#7dd3fc', marginTop: 10 }}>{t("（个人检索需要先登录）")}</div>}
          </div>
        )}

        {result && !loading && !err && result.groups?.map((g) => {
          const meta = GROUP_META[g.type] || { icon: '📄', panel: null }
          return (
            <div key={g.type} data-testid={`personal-search-group-${g.type}`} style={{ marginTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#e8b04b' }}>{meta.icon} {t(g.label)}</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{g.items.length}</span>
                {meta.panel && onOpenPanel && (
                  <button
                    type="button"
                    onClick={() => onOpenPanel(meta.panel)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#7dd3fc', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {t("去看看 →")}
                  </button>
                )}
              </div>
              {g.items.map((item, i) => (
                <div key={`${g.type}-${item.id}-${i}`} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, padding: '11px 13px', marginBottom: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                      <Highlight text={item.title} q={result.q} />
                    </span>
                    {item.scripture && item.scripture !== item.title && (
                      <span style={{ fontSize: 11, color: '#7dd3fc' }}>
                        <Highlight text={item.scripture} q={result.q} />
                      </span>
                    )}
                    {item.date && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginLeft: 'auto', flexShrink: 0 }}>{item.date}</span>}
                  </div>
                  {item.snippet && (
                    <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.6)' }}>
                      <Highlight text={item.snippet} q={result.q} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
