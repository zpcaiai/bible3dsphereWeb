import { useGuardianStore } from './guardianStore'
import { C, S } from './guardianStyles'
import './guardian.css'

// 成长阶段 + 信望爱三维度（信心之火 / 盼望之树 / 爱之河流）
export default function GuardianGrowthBar() {
  const profile = useGuardianStore((s) => s.profile)
  const stateView = useGuardianStore((s) => s.stateView)

  const dims = [
    { label: '信心之火', emoji: '🔥', value: stateView?.faithLevel ?? 5, color: '#ffa94d' },
    { label: '盼望之树', emoji: '🌳', value: stateView?.hopeLevel ?? 5, color: '#69db7c' },
    { label: '爱之河流', emoji: '🌊', value: stateView?.loveLevel ?? 5, color: '#74c0fc' },
  ]

  const track = { height: 6, borderRadius: 999, background: 'rgba(42,51,88,0.5)', overflow: 'hidden' }

  return (
    <div style={{ ...S.card, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={S.dimText}>成长阶段</span>
        <span style={{ fontSize: 13.5, color: C.text }}>
          {profile ? `${profile.stageEmoji} ${profile.stageZh}` : '🌱 种子'}
        </span>
      </div>
      <div style={track}>
        <div className="guardian-grow-bar" style={{
          height: '100%', borderRadius: 999,
          background: `linear-gradient(90deg, ${C.flame}, ${C.glow})`,
          width: `${(profile?.stageProgress ?? 1 / 6) * 100}%`,
        }} />
      </div>

      {dims.map((d) => (
        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ ...S.dimText, width: 80, flexShrink: 0 }}>{d.emoji} {d.label}</span>
          <div style={{ ...track, flex: 1 }}>
            <div className="guardian-grow-bar" style={{
              height: '100%', borderRadius: 999, background: d.color,
              width: `${d.value * 10}%`,
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}
