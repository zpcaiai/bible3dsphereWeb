import { useEffect, useState } from 'react'
import { SuggestMenu } from '../SuggestField'
const GPJ_OPTS = ['主啊，谢谢你的恩典', '求你帮助我面对…', '为家人 / 朋友代求', '求你赐我平安与智慧', '我把忧虑交给你']
import { fetchPrayers, savePrayer, markPrayerAnswered } from './guardianApi'
import { C, S } from './guardianStyles'
import { t } from '../../i18n/runtime'
import { AutoText } from '../../autoTranslate.jsx'

const CATEGORIES = [
  { key: 'adoration', label: t("赞美") },
  { key: 'confession', label: t("认罪") },
  { key: 'thanksgiving', label: t("感恩") },
  { key: 'supplication', label: t("祈求") },
  { key: 'intercession', label: t("代祷") },
]

export default function PrayerJournal() {
  const [entries, setEntries] = useState([])
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('supplication')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    fetchPrayers().then((d) => setEntries(d.entries || [])).catch((err) => { console.warn('[PrayerJournal.jsx] ignored async error', err) })
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
      setError(err.message || t("保存失败"))
    } finally {
      setSaving(false)
    }
  }

  const markAnswered = async (id) => {
    try { await markPrayerAnswered(id); load() } catch { /* noop */ }
  }

  return (
    <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, height: '100%', boxSizing: 'border-box' }}>
      <h3 style={S.sectionTitle}>{t("🙏 祷告记录")}</h3>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {CATEGORIES.map((c) => (
          <button key={c.key} type="button" style={S.chip(category === c.key)}
            onClick={() => setCategory(c.key)}>{c.label}</button>
        ))}
      </div>

      <span style={{ position: 'relative', display: 'block' }}>
      <textarea value={content} rows={3} placeholder={t("把你的祷告写下来…")}
        onChange={(e) => setContent(e.target.value)} style={{ ...S.input, paddingRight: 92 }}  aria-label={t("把你的祷告写下来…")}/>
      <SuggestMenu accent="#a78bfa" top={8} right={8} options={GPJ_OPTS} value={content} onChange={setContent} />
      </span>
      {error && <p style={{ ...S.dimText, color: '#ff9f8a', margin: 0 }}>{error}</p>}
      <button type="button" onClick={submit} disabled={saving || !content.trim()}
        style={{ ...S.primaryBtn, opacity: saving || !content.trim() ? 0.4 : 1 }}>
        {saving ? t("保存中…") : t("保存祷告")}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.length === 0 && (
          <p style={{ ...S.dimText, textAlign: 'center', padding: '12px 0' }}>
            {t("还没有祷告记录。第一句祷告可以很简单。")}
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
                <span style={{ fontSize: 11.5, color: '#7ee2a8' }}>{t("✓ 已应允")}</span>
              ) : (
                <button type="button" onClick={() => markAnswered(e.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 11.5, color: C.dim, textDecoration: 'underline' }}>
                  {t("标记应允")}
                </button>
              )}
            </div>
            <p style={{ fontSize: 13.5, color: C.text, whiteSpace: 'pre-wrap', margin: 0 }}><AutoText>{e.content}</AutoText></p>
          </div>
        ))}
      </div>
    </div>
  )
}
