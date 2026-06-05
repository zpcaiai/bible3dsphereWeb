import { useState } from 'react'
import { checkinEmotion } from './guardianApi'
import { useGuardianStore } from './guardianStore'
import { C, S } from './guardianStyles'

const EMOTIONS = [
  { key: 'joy', label: '喜乐', emoji: '😊' },
  { key: 'peace', label: '平安', emoji: '😌' },
  { key: 'gratitude', label: '感恩', emoji: '🙏' },
  { key: 'sadness', label: '难过', emoji: '😢' },
  { key: 'anxiety', label: '焦虑', emoji: '😰' },
  { key: 'anger', label: '愤怒', emoji: '😠' },
  { key: 'shame', label: '自责', emoji: '😞' },
  { key: 'loneliness', label: '孤单', emoji: '🫥' },
  { key: 'tired', label: '疲惫', emoji: '😮‍💨' },
]

export default function EmotionCheckIn({ onDone }) {
  const refresh = useGuardianStore((s) => s.refresh)
  const [selected, setSelected] = useState(null)
  const [intensity, setIntensity] = useState(5)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!selected) return
    setSaving(true); setError('')
    try {
      await checkinEmotion({ emotionType: selected, intensity, note })
      setSaved(true)
      refresh()
      setTimeout(() => onDone?.(), 900)
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
        <div style={{ fontSize: 30 }}>🕊️</div>
        <p style={{ fontSize: 13.5, color: C.text, margin: 0 }}>已经记下了。谢谢你诚实地面对自己的感受。</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={S.sectionTitle}>此刻，你的心情更接近——</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {EMOTIONS.map((e) => (
          <button key={e.key} type="button" onClick={() => setSelected(e.key)}
            style={{
              borderRadius: 12, padding: '10px 4px', fontSize: 12, cursor: 'pointer',
              border: `1px solid ${selected === e.key ? C.flame : C.line}`,
              background: selected === e.key ? 'rgba(255,179,71,0.2)' : 'rgba(11,16,38,0.4)',
              color: selected === e.key ? C.text : C.dim,
            }}>
            <div style={{ fontSize: 18 }}>{e.emoji}</div>
            {e.label}
          </button>
        ))}
      </div>

      <div>
        <label style={S.dimText}>强度：{intensity}/10</label>
        <input type="range" min={1} max={10} value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          style={{ width: '100%', accentColor: C.flame }} />
      </div>

      <textarea value={note} rows={2} placeholder="（可选）是什么带来了这个感受？"
        onChange={(e) => setNote(e.target.value)} style={S.input} />

      {error && <p style={{ ...S.dimText, color: '#ff9f8a', margin: 0 }}>{error}</p>}

      <button type="button" onClick={submit} disabled={!selected || saving}
        style={{ ...S.primaryBtn, opacity: !selected || saving ? 0.4 : 1 }}>
        {saving ? '记录中…' : '记录这个感受'}
      </button>
    </div>
  )
}
