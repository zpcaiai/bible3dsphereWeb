import { C, S } from './guardianStyles'

// 行为模式卡片：温柔的镜子，不是定论
export default function PatternInsightCard({ pattern }) {
  return (
    <div style={S.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>
          🪞 {pattern.patternType}
        </span>
        <span style={S.dimText}>可信度 {Math.round((pattern.confidence || 0.5) * 100)}%</span>
      </div>
      {pattern.trigger && <p style={{ ...S.dimText, margin: '2px 0' }}>触发：{pattern.trigger}</p>}
      {pattern.typicalResponse && (
        <p style={{ ...S.dimText, margin: '2px 0' }}>常见反应：{pattern.typicalResponse}</p>
      )}
      {pattern.spiritualRoot && (
        <p style={{ fontSize: 11.5, lineHeight: 1.6, color: C.glow, margin: '6px 0 0',
          background: 'rgba(255,179,71,0.1)', borderRadius: 8, padding: '6px 8px' }}>
          {pattern.spiritualRoot}
        </p>
      )}
      <p style={{ fontSize: 11, lineHeight: 1.6, color: 'rgba(154,163,199,0.8)', margin: '6px 0 0' }}>
        这只是一面镜子，不是定论。被看见，就是改变的开始。
      </p>
    </div>
  )
}
