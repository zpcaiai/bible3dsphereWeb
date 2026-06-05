import { useEffect, useState } from 'react'
import { fetchDevotions, saveDevotion } from './guardianApi'
import { C, S } from './guardianStyles'

export default function DailyDevotionCard() {
  const [scripture, setScripture] = useState(null)
  const [observation, setObservation] = useState('')
  const [application, setApplication] = useState('')
  const [prayer, setPrayer] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchDevotions().then((d) => setScripture(d.scriptureOfTheDay)).catch(() => {})
  }, [])

  const submit = async () => {
    setSaving(true); setError('')
    try {
      await saveDevotion({ scripture: scripture?.reference || '', observation, application, prayer })
      setSaved(true)
    } catch (err) {
      setError(err.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 30 }}>📖</div>
        <p style={{ fontSize: 13.5, color: C.text, margin: 0 }}>今天的灵修已保存。愿这节经文一路陪着你。</p>
      </div>
    )
  }

  const fields = [
    { label: 'O · 观察 — 这段经文在说什么？', value: observation, set: setObservation },
    { label: 'A · 应用 — 对你今天意味着什么？', value: application, set: setApplication },
    { label: 'P · 祷告 — 用一句话回应神', value: prayer, set: setPrayer },
  ]

  return (
    <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={S.sectionTitle}>📖 今日灵修（SOAP）</h3>

      <div style={{ borderRadius: 12, border: '1px solid rgba(255,179,71,0.4)',
        background: 'rgba(255,179,71,0.1)', padding: 12 }}>
        <p style={{ fontSize: 13.5, lineHeight: 1.7, color: C.text, margin: 0 }}>
          {scripture ? `「${scripture.text}」` : '加载今日经文…'}
        </p>
        {scripture && (
          <p style={{ fontSize: 11.5, color: C.glow, textAlign: 'right', margin: '4px 0 0' }}>
            —— {scripture.reference}
          </p>
        )}
      </div>

      {fields.map((f) => (
        <div key={f.label}>
          <label style={{ ...S.dimText, display: 'block', marginBottom: 4 }}>{f.label}</label>
          <textarea value={f.value} rows={2} onChange={(e) => f.set(e.target.value)} style={S.input} />
        </div>
      ))}

      {error && <p style={{ ...S.dimText, color: '#ff9f8a', margin: 0 }}>{error}</p>}

      <button type="button" onClick={submit} disabled={saving}
        style={{ ...S.primaryBtn, opacity: saving ? 0.4 : 1 }}>
        {saving ? '保存中…' : '保存今日灵修'}
      </button>
    </div>
  )
}
