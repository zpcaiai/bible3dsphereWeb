import { useEffect, useState } from 'react'
import { fetchFormationTimeline } from '../api'

// 统一「历史」：读 /api/formation/timeline（按 source 过滤）。gift 等可点开原记录（带 refId 时回调 onOpen）。
const SRC_LABEL = { worldview: '世界观', discernment: '辨识', gift: '恩赐', spiritual_formation: '塑造', weekly_review: '复盘', crisis: '危机', checkin: '签到', examen: '省察', gospel: '福音', habits: '操练', reflection: '反思' }

export default function FormationHistory({ token, source, onOpen, emptyText = '暂无记录', accent = '#9ecbff', limit = 50 }) {
  const [items, setItems] = useState(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    if (!token) { setItems([]); return }
    fetchFormationTimeline(token, limit, source).then((d) => setItems(d.events || [])).catch((e) => setErr(e.message || '加载失败'))
  }, [token, source, limit])
  const dim = { color: 'rgba(255,255,255,0.4)', fontSize: 13, padding: 20, textAlign: 'center' }
  if (err) return <div style={dim}>{err}</div>
  if (items == null) return <div style={dim}>加载中…</div>
  if (items.length === 0) return <div style={dim}>{emptyText}</div>
  return (
    <div>
      {items.map((e) => {
        const clickable = onOpen && e.refId
        return (
          <div key={e.id} onClick={clickable ? () => onOpen(e.refId) : undefined}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '11px 13px', marginBottom: 8, cursor: clickable ? 'pointer' : 'default' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>{SRC_LABEL[e.source] || e.source} · {e.title || e.type}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{(e.occurredAt || '').slice(0, 10)}</span>
            </div>
            {e.summary && <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6 }}>{e.summary}</div>}
          </div>
        )
      })}
    </div>
  )
}
