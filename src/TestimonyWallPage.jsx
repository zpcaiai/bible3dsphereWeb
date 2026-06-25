/**
 * TestimonyWallPage — ✨ 见证墙 · 述说祂的作为
 *
 * 引导式三段见证（信主之前 / 如何遇见主 / 生命的改变）+ 阿们 + 删除。
 * 作为分享墙 (ShareWallPage) 的子标签挂载，接收 { user, token }。
 */
import { useEffect, useState } from 'react'
import { SuggestMenu } from './components/SuggestField'
const TW_OPTS = {
  before_story: ['那时我心里很空虚', '我在用…填补内心', '我对人生感到迷茫', '我经历了一段苦难', '我曾抗拒 / 怀疑神'],
  how_story: ['一位…带我认识主', '借着一本书 / 一句经文', '在一次聚会 / 患难中', '神回应了我的祷告', '我决定接受耶稣'],
  after_story: ['我心里有了平安', '我与家人的关系改善', '我有了活下去的盼望', '我学会把重担交给神', '最感恩的是…'],
}
import { amenTestimony, deleteTestimony, fetchTestimonies, submitTestimony } from './api'
import useDraft from './useDraft'

const AMEN_KEY = 'tw-amened-v1'
const PAGE = 20
const TITLE_MAX = 80
const STORY_MAX = 2000

function loadAmened() {
  try { return new Set(JSON.parse(localStorage.getItem(AMEN_KEY) || '[]')) }
  catch { return new Set() }
}
function saveAmened(set) {
  try { localStorage.setItem(AMEN_KEY, JSON.stringify([...set])) } catch { /* ignore */ }
}

function friendlyError(e) {
  const msg = e?.message || ''
  return /[一-龥]/.test(msg) ? msg : '网络不稳定，请稍后重试'
}

function formatDateTime(ts) {
  if (!ts) return ''
  const d = typeof ts === 'string' ? new Date(ts) : (ts > 1e12 ? new Date(ts) : new Date(ts * 1000))
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

const card = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const inp = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 13, resize: 'vertical', fontFamily: 'inherit' }

const SECTIONS = [
  { key: 'before_story', label: '信主之前', icon: '🌑', required: false,
    ph: '那时我的光景、挣扎、心里的空虚或寻求…（可留空）' },
  { key: 'how_story', label: '如何遇见主', icon: '✝️', required: true,
    ph: '神借着什么人、什么事吸引了我？我是怎样信靠祂的…' },
  { key: 'after_story', label: '生命的改变', icon: '🌅', required: true,
    ph: '如今有什么不同、最感恩的是…' },
]

const EMPTY_DRAFT = { title: '', before_story: '', how_story: '', after_story: '' }

export default function TestimonyWallPage({ user, token }) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [amened, setAmened] = useState(loadAmened)
  const [showCompose, setShowCompose] = useState(false)
  const [form, setForm] = useState(EMPTY_DRAFT)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')   // ✓ 成功 / 其它=错误
  const [deletingId, setDeletingId] = useState(null)

  const { savedHint, clearDraft } = useDraft('testimony-draft-v1', form, setForm)

  async function load(replace = true) {
    try {
      replace ? setLoading(true) : setLoadingMore(true)
      const data = await fetchTestimonies(PAGE, replace ? 0 : items.length, token)
      setTotal(data.total || 0)
      setItems(prev => replace ? (data.items || []) : [...prev, ...(data.items || [])])
      setError('')
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => { load() }, [])

  function setField(key, val, max) {
    setForm(f => ({ ...f, [key]: val.slice(0, max) }))
    setSubmitMsg('')
  }

  async function handleAmen(id) {
    if (amened.has(id)) return
    const next = new Set(amened)
    next.add(id)
    setAmened(next)
    saveAmened(next)
    setItems(prev => prev.map(t => t.id === id ? { ...t, amen_count: (t.amen_count || 0) + 1 } : t))
    try { await amenTestimony(id, token) } catch { /* optimistic */ }
  }

  async function handleDelete(id) {
    try {
      await deleteTestimony(id, token)
      setItems(prev => prev.filter(t => t.id !== id))
      setTotal(prev => Math.max(0, prev - 1))
      setDeletingId(null)
    } catch (e) {
      setError(friendlyError(e))
      setDeletingId(null)
    }
  }

  async function handleSubmit() {
    if (submitting) return
    if (!token) { setSubmitMsg('请先登录后再分享见证'); return }
    if (!form.title.trim()) { setSubmitMsg('请先给见证起一个标题'); return }
    if (!form.how_story.trim()) { setSubmitMsg('请写下你是如何遇见主的'); return }
    if (!form.after_story.trim()) { setSubmitMsg('请写下生命的改变'); return }
    setSubmitting(true)
    setSubmitMsg('')
    try {
      await submitTestimony({
        title: form.title.trim(),
        before_story: form.before_story.trim(),
        how_story: form.how_story.trim(),
        after_story: form.after_story.trim(),
        is_anonymous: isAnonymous,
        is_public: isPublic,
      }, token)
      setForm(EMPTY_DRAFT)
      setIsAnonymous(false)
      setIsPublic(false)
      clearDraft()
      setShowCompose(false)
      setSubmitMsg('✓ 见证已发布，愿一切荣耀归于神')
      await load(true)
      setTimeout(() => setSubmitMsg(''), 3000)
    } catch (e) {
      setSubmitMsg(friendlyError(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 90px' }} role="region" aria-label="见证墙">
      {/* 标题 */}
      <div style={{ textAlign: 'center', margin: '4px 0 14px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>✨ 见证墙 · 述说祂的作为</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
          {total > 0 ? `共 ${total} 篇见证` : '「来听我诉说，我要述说他为我所行的事。」（诗 66:16）'}
        </div>
      </div>

      {/* 成功提示 */}
      {submitMsg.startsWith('✓') && !showCompose && (
        <div role="status" style={{ ...card, textAlign: 'center', color: '#34c759', borderColor: 'rgba(52,199,89,0.35)', fontSize: 13 }}>{submitMsg}</div>
      )}

      {/* 写见证（可折叠引导表单） */}
      <button
        type="button"
        onClick={() => setShowCompose(v => !v)}
        aria-expanded={showCompose}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', minHeight: 44, padding: '11px 14px', marginBottom: 12, borderRadius: 12, border: '1px solid rgba(255,184,76,0.35)', background: showCompose ? 'rgba(255,184,76,0.16)' : 'rgba(255,184,76,0.10)', color: '#ffd43b', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        ✍️ {showCompose ? '收起' : '写下我的见证'}
      </button>

      {showCompose && (
        <div style={{ ...card, borderColor: 'rgba(255,184,76,0.25)' }}>
          <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }} htmlFor="tw-title">见证标题</label>
          <input
            id="tw-title"
            value={form.title}
            onChange={e => setField('title', e.target.value, TITLE_MAX)}
            placeholder="如：祂在病床边遇见了我"
            style={{ ...inp, resize: 'none' }}
          />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'right', marginTop: 4 }}>{form.title.length}/{TITLE_MAX}</div>

          {SECTIONS.map(s => (
            <div key={s.key} style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }} htmlFor={`tw-${s.key}`}>
                {s.icon} 「{s.label}」{s.required ? '' : '（选填）'}
              </label>
              <span style={{ position: 'relative', display: 'block' }}>
              <textarea
                id={`tw-${s.key}`}
                value={form[s.key]}
                onChange={e => setField(s.key, e.target.value, STORY_MAX)}
                rows={3}
                placeholder={`${s.label}：${s.ph}`}
                style={{ ...inp, paddingRight: 92 }}
              />
              <SuggestMenu top={8} right={8} options={TW_OPTS[s.key] || []} value={form[s.key]} onChange={(v) => setField(s.key, v, STORY_MAX)} />
              </span>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'right', marginTop: 4 }}>{form[s.key].length}/{STORY_MAX}</div>
            </div>
          ))}

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.55)', cursor: 'pointer', userSelect: 'none', margin: '8px 0 4px' }}>
            <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} style={{ accentColor: '#ffd43b' }} />
            🙈 匿名分享
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.55)', cursor: 'pointer', userSelect: 'none', margin: '4px 0 8px' }}>
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} style={{ accentColor: '#ffd43b' }} />
            🌍 公开到众教会
          </label>

          {savedHint && <div role="status" style={{ fontSize: 11, color: 'rgba(52,199,89,0.75)', marginBottom: 6 }}>✓ 草稿已自动保存</div>}
          {submitMsg && !submitMsg.startsWith('✓') && (
            <div role="alert" style={{ fontSize: 12.5, color: '#ff8787', marginBottom: 8 }}>⚠️ {submitMsg}</div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ width: '100%', minHeight: 44, marginTop: 4, padding: 12, borderRadius: 12, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontSize: 14.5, fontWeight: 700, background: 'linear-gradient(135deg, #ffb84c, #ff9f0a)', color: '#1a1a2e', opacity: submitting ? 0.6 : 1, fontFamily: 'inherit' }}
          >
            {submitting ? '发布中…' : '✨ 发布见证'}
          </button>
        </div>
      )}

      {/* 列表 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'rgba(255,255,255,0.4)', fontSize: 13 }} role="status">加载中…</div>
      ) : error ? (
        <div style={{ ...card, textAlign: 'center' }} role="alert">
          <div style={{ fontSize: 30, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>{error}</div>
          <button type="button" onClick={() => load(true)} style={{ minHeight: 44, padding: '10px 26px', borderRadius: 10, border: '1px solid rgba(90,200,250,0.4)', background: 'rgba(90,200,250,0.12)', color: '#5ac8fa', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}>重试</button>
        </div>
      ) : items.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '32px 18px' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🕊️</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>还没有见证</div>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8 }}>
            「他们胜过他，是因羔羊的血和自己所见证的道。」（启 12:11）<br />成为第一个述说神恩典的人吧。
          </div>
        </div>
      ) : (
        <>
          {items.map(t => {
            const name = t.nickname || (t.is_anonymous ? '匿名弟兄姊妹' : '弟兄/姐妹')
            return (
              <article key={t.id} style={card} aria-label={`见证：${t.title}`}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#ffd43b', lineHeight: 1.5 }}>✨ {t.title}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
                      {name} · {formatDateTime(t.created_at)}
                    </div>
                  </div>
                  {t.is_own && (
                    deletingId === t.id ? (
                      <span style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button type="button" onClick={() => handleDelete(t.id)} aria-label="确认删除见证" style={{ minWidth: 44, minHeight: 32, padding: '4px 8px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.18)', color: '#ef4444', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>确认</button>
                        <button type="button" onClick={() => setDeletingId(null)} aria-label="取消删除" style={{ minWidth: 44, minHeight: 32, padding: '4px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>取消</button>
                      </span>
                    ) : (
                      <button type="button" onClick={() => setDeletingId(t.id)} aria-label="删除这篇见证" style={{ flexShrink: 0, minWidth: 44, minHeight: 32, background: 'none', border: 'none', color: 'rgba(255,135,135,0.6)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>删除</button>
                    )
                  )}
                </div>

                {[['before_story', '信主之前'], ['how_story', '如何遇见主'], ['after_story', '生命的改变']].map(([k, label]) => (
                  t[k] ? (
                    <div key={k} style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,184,76,0.8)', marginBottom: 4 }}>「{label}」</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.82)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{t[k]}</div>
                    </div>
                  ) : null
                ))}

                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => handleAmen(t.id)}
                    disabled={amened.has(t.id)}
                    aria-label={`为这篇见证说阿们${t.amen_count ? `，已有 ${t.amen_count} 人阿们` : ''}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '9px 16px', borderRadius: 22, border: '1px solid rgba(255,184,76,0.35)', background: amened.has(t.id) ? 'rgba(255,184,76,0.2)' : 'rgba(255,255,255,0.04)', color: '#ffd43b', fontSize: 13, fontWeight: 700, cursor: amened.has(t.id) ? 'default' : 'pointer', fontFamily: 'inherit' }}
                  >
                    🙏 {amened.has(t.id) ? '已阿们' : '阿们'}
                    {(t.amen_count || 0) > 0 && <span style={{ fontWeight: 400, opacity: 0.85 }}>{t.amen_count}</span>}
                  </button>
                </div>
              </article>
            )
          })}

          {items.length < total && (
            <button
              type="button"
              onClick={() => load(false)}
              disabled={loadingMore}
              style={{ display: 'block', width: '100%', minHeight: 44, padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {loadingMore ? '加载中…' : `↓ 加载更多 (${total - items.length})`}
            </button>
          )}
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
            「你们就是这些事的见证。」（路 24:48）
          </div>
        </>
      )}
    </div>
  )
}
