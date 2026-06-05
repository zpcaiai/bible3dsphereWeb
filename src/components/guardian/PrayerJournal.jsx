import { useEffect, useState } from 'react'
import { fetchPrayers, savePrayer, markPrayerAnswered } from './guardianApi'
import { C, S } from './guardianStyles'

const CATEGORIES = [
  { key: 'adoration', label: '赞美' },
  { key: 'confession', label: '认罪' },
  { key: 'thanksgiving', label: '感恩' },
  { key: 'supplication', label: '祈求' },
  { key: 'intercession', label: '代祷' },
]

export default function PrayerJournal() {
  const [entries, setEntries] = useState([])
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('supplication')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    fetchPrayers().then((d) => setEntries(d.entries || [])).catch(() => {})
  }
  useEffect(load, [])

  const submit = async () => {
    if (!content.trim()) return
    setSaving(true); setError('')
    try {
      await savePrayer({ content: content.trim(), category })
      setContent('')
      load()
    } catch (err) {
      setError(err.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const markAnswered = async (id) => {
    try { await markPrayerAnswered(id); load() } catch { /* noop */ }
  }

  return (
    <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, height: '100%', boxSizing: 'border-box' }}>
      <h3 style={S.sectionTitle}>🙏 祷告记录</h3>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {CATEGORIES.map((c) => (
          <button key={c.key} type="button" style={S.chip(category === c.key)}
            onClick={() => setCategory(c.key)}>{c.label}</button>
        ))}
      </div>

      <textarea value={content} rows={3} placeholder="把你的祷告写下来…"
        onChange={(e) => setContent(e.target.value)} style={S.input} />
      {error && <p style={{ ...S.dimText, color: '#ff9f8a', margin: 0 }}>{error}</p>}
      <button type="button" onClick={submit} disabled={saving || !content.trim()}
        style={{ ...S.primaryBtn, opacity: saving || !content.trim() ? 0.4 : 1 }}>
        {saving ? '保存中…' : '保存祷告'}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.length === 0 && (
          <p style={{ ...S.dimText, textAlign: 'center', padding: '12px 0' }}>
            还没有祷告记录。第一句祷告可以很简单。
          </p>
        )}
        {entries.map((e) => (
          <div key={e.id} style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={S.dimText}>
                {CATEGORIES.find((c) => c.key === e.category)?.label || e.category}
                {e.createdAt ? ` · ${e.createdAt.slice(0, 10)}` : ''}
              </span>
              {e.status === 'answered' ? (
                <span style={{ fontSize: 11.5, color: '#7ee2a8' }}>✓ 已应允</span>
              ) : (
                <button type="button" onClick={() => markAnswered(e.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 11.5, color: C.dim, textDecoration: 'underline' }}>
                  标记应允
                </button>
              )}
            </div>
            <p style={{ fontSize: 13.5, color: C.text, whiteSpace: 'pre-wrap', margin: 0 }}>{e.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
