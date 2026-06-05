import { useEffect, useState } from 'react'
import { fetchGuardianMemories } from './guardianApi'
import { C, S } from './guardianStyles'

const TYPE_LABELS = {
  event: '事件', stressor: '压力源', goal: '目标',
  'prayer-item': '祷告事项', relationship: '关系', preference: '偏好',
}

export default function GuardianMemoryPanel() {
  const [memories, setMemories] = useState([])

  useEffect(() => {
    fetchGuardianMemories().then((d) => setMemories(d.memories || [])).catch(() => {})
  }, [])

  return (
    <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h3 style={S.sectionTitle}>💭 守护者记得的事</h3>
      {memories.length === 0 && (
        <p style={{ ...S.dimText, textAlign: 'center', padding: '12px 0' }}>
          还没有记忆。多聊一些，我会慢慢记住对你重要的事。
        </p>
      )}
      {memories.map((m) => (
        <div key={m.id} style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ ...S.dimText, background: 'rgba(42,51,88,0.4)',
              borderRadius: 999, padding: '2px 8px' }}>
              {TYPE_LABELS[m.memoryType] || m.memoryType}
            </span>
            <span style={S.dimText}>{'★'.repeat(Math.min(5, m.importance || 1))}</span>
          </div>
          <p style={{ fontSize: 13.5, color: C.text, margin: 0 }}>{m.content}</p>
        </div>
      ))}
    </div>
  )
}
