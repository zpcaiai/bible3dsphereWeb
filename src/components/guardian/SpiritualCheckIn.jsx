import { useState } from 'react'
import { checkinSpiritual } from './guardianApi'
import { useGuardianStore } from './guardianStore'
import { C, S } from './guardianStyles'

const STATES = [
  { key: 'growing', label: '在成长' },
  { key: 'steady', label: '平稳' },
  { key: 'seeking', label: '在寻求' },
  { key: 'dry', label: '有些干渴' },
  { key: 'struggling', label: '在挣扎' },
]

const DIMS = [
  { key: 'faithLevel', label: '信心之火', emoji: '🔥' },
  { key: 'hopeLevel', label: '盼望之树', emoji: '🌳' },
  { key: 'loveLevel', label: '爱之河流', emoji: '🌊' },
]

export default function SpiritualCheckIn({ onDone }) {
  const refresh = useGuardianStore((s) => s.refresh)
  const [levels, setLevels] = useState({ faithLevel: 5, hopeLevel: 5, loveLevel: 5 })
  const [state, setState] = useState('steady')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setSaving(true); setError('')
    try {
      await checkinSpiritual({ ...levels, spiritualState: state, note })
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
        <div style={{ fontSize: 30 }}>🌿</div>
        <p style={{ fontSize: 13.5, color: C.text, margin: 0 }}>已经记下了。每个属灵季节都被神看见。</p>
      </div>
    )
  }

  return (
    <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={S.sectionTitle}>这段日子，你与神的关系——</h3>

      {DIMS.map((d) => (
        <div key={d.key}>
          <label style={{ ...S.dimText, display: 'flex', justifyContent: 'space-between' }}>
            <span>{d.emoji} {d.label}</span>
            <span>{levels[d.key]}/10</span>
          </label>
          <input type="range" min={1} max={10} value={levels[d.key]}
            onChange={(e) => setLevels((l) => ({ ...l, [d.key]: Number(e.target.value) }))}
            style={{ width: '100%', accentColor: C.flame }} />
        </div>
      ))}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {STATES.map((s) => (
          <button key={s.key} type="button" style={S.chip(state === s.key)}
            onClick={() => setState(s.key)}>{s.label}</button>
        ))}
      </div>

      <textarea value={note} rows={2} placeholder="（可选）想对神或对自己说点什么？"
        onChange={(e) => setNote(e.target.value)} style={S.input} />

      {error && <p style={{ ...S.dimText, color: '#ff9f8a', margin: 0 }}>{error}</p>}

      <button type="button" onClick={submit} disabled={saving}
        style={{ ...S.primaryBtn, opacity: saving ? 0.4 : 1 }}>
        {saving ? '记录中…' : '记录属灵状态'}
      </button>
    </div>
  )
}
