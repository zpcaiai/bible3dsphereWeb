import { t as i18nT } from './i18n/runtime'
import { useCallback, useEffect, useState } from 'react'
import { fetchMilestones } from './api'
import { API_BASE } from './api'
import { Radar } from './components/charts'
import { CardActions } from './lib/media/CardActions'

const DIM_LABELS = {
  humility: { zh: '谦卑', icon: '🌿', color: '#34c759' },
  fear_tendency: { zh: '恐惧倾向', icon: '⚡', color: '#ff9500' },
  pride_tendency: { zh: '骄傲倾向', icon: '🏆', color: '#ff3b30' },
  emotional_stability: { zh: '情绪稳定', icon: '💧', color: '#5ac8fa' },
  truth_alignment: { zh: '真理对齐', icon: '✝️', color: '#c4b5fd' },
  relational_health: { zh: '关系健康', icon: '❤️', color: '#ff6b9d' },
  resilience: { zh: '韧性', icon: '🌊', color: '#00d2ff' },
  spiritual_clarity: { zh: '属灵清晰度', icon: '🌟', color: '#ffd700' },
}

const HEALTHY_DIMS = ['humility', 'emotional_stability', 'truth_alignment', 'relational_health', 'resilience', 'spiritual_clarity']

// 雷达图统一走共享原语 components/charts 的 Radar：
// 配色、图例、无障碍概述、「看数据」表格视图都由原语保证，页面只负责喂真实数据。
const RADAR_AXES = Object.keys(DIM_LABELS).map((key) => ({ key, label: i18nT(DIM_LABELS[key].zh) }))

/** 找出 state_vector 里最高 / 最低的一维，用来写「结论式」副标题。 */
function radarTakeaway(scores) {
  const rows = Object.keys(DIM_LABELS)
    .filter((key) => typeof scores[key] === 'number')
    .map((key) => ({ key, zh: i18nT(DIM_LABELS[key].zh), pct: Math.round(scores[key] * 100) }))
  if (!rows.length) return null
  const sorted = [...rows].sort((a, b) => b.pct - a.pct)
  return { top: sorted[0], bottom: sorted[sorted.length - 1], rows }
}

// Mini bar for a single dimension
function DimBar({ dim, value, delta }) {
  const meta = DIM_LABELS[dim] || { zh: dim, color: '#888', icon: '' }
  const pct = Math.round(value * 100)
  const isHealthy = HEALTHY_DIMS.includes(dim)
  const arrow = delta > 0.02 ? '↑' : delta < -0.02 ? '↓' : '–'
  const arrowColor = (isHealthy ? delta > 0 : delta < 0) ? '#34c759' : delta === 0 ? '#888' : '#ff9500'
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: 'rgba(255,255,255,0.75)' }}>{meta.icon} {meta.zh}</span>
        <span style={{ color: arrowColor, fontWeight: 600 }}>{pct}% <span style={{ fontSize: 13 }}>{arrow}</span></span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: meta.color, borderRadius: 3, transition: 'width .4s' }} />
      </div>
    </div>
  )
}

export default function GrowthMapPage({ user, token, onBack }) {
  const [tab, setTab] = useState('chart') // 'chart' | 'milestones'
  const [profile, setProfile] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    Promise.all([
      fetch(`${API_BASE}/sfds/v3/formation/profile/${encodeURIComponent(user.email)}`, { headers })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetchMilestones(token),
    ]).then(([prof, ms]) => {
      setProfile(prof)
      setMilestones(ms || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user, token])

  const stateVector = profile?.formation?.state_vector || {}
  const dimScores = profile?.formation?.dimension_scores || []
  const arc = profile?.formation?.formation_arc || ''
  const trajectory = profile?.formation?.trajectory_direction || ''
  const dominantLoop = profile?.formation?.dominant_loop || ''
  const alignmentTrend = profile?.formation?.alignment_trend || ''

  const takeaway = radarTakeaway(stateVector)

  // 图卡内容只用 state_vector 的真实数值 + 后端给的轨迹标签，不加任何推测性的话。
  const buildGrowthCardSpec = useCallback(() => ({
    badge: i18nT('灵命成长图谱'),
    kicker: new Date().toLocaleDateString(),
    title: takeaway
      ? i18nT('最稳：{top} · 最需照顾：{bottom}', { top: takeaway.top.zh, bottom: takeaway.bottom.zh })
      : i18nT('八维灵命状态'),
    subtitle: i18nT('这是一次状态快照，不是属灵评分。'),
    sections: [
      { heading: i18nT('八个维度'), items: (takeaway?.rows || []).map((row) => `${row.zh} ${row.pct}%`) },
    ],
    footer: i18nT('属灵星球 · 数值来自你自己的记录'),
  }), [takeaway])

  const ARC_LABELS = { breaking_through: '🌟 突破成长中', deepening_loops: '🔄 循环加深', stabilizing: '🌱 趋于稳定', unknown: '🔮 轨迹未知' }
  const TRAJ_LABELS = { stabilizing: '🌱 稳定成长', improving_clarity: '✨ 属灵清晰度提升', fragmenting: '🌊 内心正在挣扎', increasing_volatility: '⚡ 情绪波动较大', cyclical: '🔄 循环模式中' }
  const LOOP_LABELS = { fear_control_loop: '🔒 恐惧控制循环', shame_avoidance_loop: '🙈 羞耻回避循环', pride_comparison_loop: '🏆 骄傲比较循环', desire_impulse_loop: '🌊 欲望冲动循环', truth_stability_loop: '✨ 真理稳固循环' }

  return (
    <div className="pw-page">
      <header className="pw-header">
        <button className="checkin-back-btn" onClick={onBack} aria-label={i18nT('返回')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="pw-header-center">
          <div className="pw-title">{i18nT('📊 灵命成长图谱')}</div>
          <div className="pw-subtitle">{i18nT('SFDS 8维度灵命轨迹可视化')}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['chart', '图谱'], ['milestones', '徽章']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, border: 'none', background: tab === k ? 'rgba(88,86,214,0.4)' : 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>{l}</button>
          ))}
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', boxSizing: 'border-box' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.4)' }}>{i18nT('加载中...')}</div>
        ) : tab === 'chart' ? (
          <>
            {/* Summary chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {arc && <span style={{ fontSize: 12, background: 'rgba(88,86,214,0.2)', border: '1px solid rgba(88,86,214,0.4)', borderRadius: 20, padding: '4px 12px', color: '#c4b5fd' }}>{ARC_LABELS[arc] || arc}</span>}
              {trajectory && <span style={{ fontSize: 12, background: 'rgba(0,122,255,0.15)', border: '1px solid rgba(0,122,255,0.3)', borderRadius: 20, padding: '4px 12px', color: '#5eb0ff' }}>{TRAJ_LABELS[trajectory] || trajectory}</span>}
              {dominantLoop && <span style={{ fontSize: 12, background: 'rgba(255,149,0,0.15)', border: '1px solid rgba(255,149,0,0.3)', borderRadius: 20, padding: '4px 12px', color: '#ffb340' }}>{LOOP_LABELS[dominantLoop] || dominantLoop}</span>}
              {alignmentTrend && <span style={{ fontSize: 12, background: alignmentTrend === 'improving' ? 'rgba(52,199,89,0.15)' : 'rgba(255,59,48,0.1)', border: `1px solid ${alignmentTrend === 'improving' ? 'rgba(52,199,89,0.3)' : 'rgba(255,59,48,0.25)'}`, borderRadius: 20, padding: '4px 12px', color: alignmentTrend === 'improving' ? '#34c759' : '#ff6b6b' }}>{alignmentTrend === 'improving' ? '📈 属灵对齐趋势向好' : alignmentTrend === 'declining' ? '📉 属灵对齐趋势下行' : '➡️ 属灵对齐稳定'}</span>}
            </div>

            {Object.keys(stateVector).length > 0 ? (
              <>
                {/* Radar：共享原语，八维一次看完 */}
                <div style={{ marginBottom: 20 }}>
                  <Radar
                    axes={RADAR_AXES}
                    series={[{ name: i18nT('当前状态'), values: stateVector }]}
                    max={1}
                    size={280}
                    title={i18nT('八维灵命状态雷达')}
                    subtitle={takeaway
                      ? i18nT('目前最稳的是{top}（{topPct}%），最需要照顾的是{bottom}（{bottomPct}%）。', { top: takeaway.top.zh, topPct: takeaway.top.pct, bottom: takeaway.bottom.zh, bottomPct: takeaway.bottom.pct })
                      : i18nT('这是当前一次快照，不是评分。')}
                  />
                  <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.32)', lineHeight: 1.6 }}>
                    {i18nT('后端只回传当前这一份状态向量，没有按日期排列的历史快照，所以这里不做时间滑杆——宁可少一个功能，也不编造过去的数值。')}
                  </div>
                </div>

                {/* 成长图卡：把这次快照带走 */}
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>{i18nT('🖼 成长图卡')}</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.42)', marginTop: 4, lineHeight: 1.6 }}>
                    {i18nT('卡上只有维度名称与百分比，没有任何你写过的内容，可以放心分享或存档。')}
                  </div>
                  <CardActions buildSpec={buildGrowthCardSpec} filename="growth-map-card.png" label="生成成长图卡" templates={['calm', 'ink', 'dawn']} />
                </div>

                {/* Bars */}
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '18px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: 14 }}>{i18nT('8维度详细数值')}</div>
                  {Object.keys(DIM_LABELS).map(dim => {
                    const ds = dimScores.find(s => s.dimension === dim)
                    return <DimBar key={dim} dim={dim} value={stateVector[dim] ?? 0.5} delta={ds?.delta ?? 0} />
                  })}
                </div>

                {/* Trajectory narrative */}
                {profile?.formation?.trajectory_narrative && (
                  <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(88,86,214,0.08)', border: '1px solid rgba(88,86,214,0.2)', borderRadius: 12, fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
                    <div style={{ fontSize: 11, color: '#c4b5fd', fontWeight: 700, marginBottom: 6 }}>{i18nT('🧭 轨迹叙述')}</div>
                    {profile.formation.trajectory_narrative}
                  </div>
                )}

                {/* Reflective question from SFDS */}
                {profile?.formation?.reflective_question && (
                  <div style={{ marginTop: 12, padding: '14px 16px', background: 'rgba(255,215,0,0.07)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 12, fontSize: 14, color: '#ffd700', lineHeight: 1.7, fontStyle: 'italic', textAlign: 'center' }}>
                    💭 {profile.formation.reflective_question}
                  </div>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                <div>{i18nT('完成几次情绪打卡或心迹分析后')}</div>
                <div>{i18nT('图谱将自动生成你的灵命轨迹')}</div>
              </div>
            )}
          </>
        ) : (
          /* Milestones tab */
          <>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>
              {i18nT('里程碑是你属灵旅程中的见证，不是成就，而是回忆。')}
            </div>
            {milestones.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14, lineHeight: 1.8 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🌱</div>
                <div>{i18nT('旅程才刚刚开始')}</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>{i18nT('连续7天灵修、提交10条代祷、回答7次灵魂一问...')}</div>
                <div style={{ fontSize: 12 }}>{i18nT('每一步都会被记录。')}</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {milestones.map((m, i) => (
                  <div key={i} style={{
                    background: 'linear-gradient(135deg, rgba(88,86,214,0.15), rgba(255,215,0,0.06))',
                    border: '1px solid rgba(255,215,0,0.25)', borderRadius: 14,
                    padding: '18px 14px', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>{m.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ffd700', marginBottom: 4 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{m.desc}</div>
                    <div style={{ marginTop: 8, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{m.earned_at}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Future badges preview */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>{i18nT('🔒 待解锁')}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { icon: '🌿', name: '旷野七日', desc: '连续7天灵修' },
                  { icon: '🕯️', name: '月光守望', desc: '连续30天灵修' },
                  { icon: '🙏', name: '守望者', desc: '提交10条代祷' },
                  { icon: '✝️', name: '信心见证者', desc: '3个祷告蒙恩答应' },
                  { icon: '🔍', name: '七日自省者', desc: '回答7次灵魂一问' },
                  { icon: '📖', name: '书卷完成者', desc: '读完整卷圣经' },
                ].filter(b => !milestones.find(m => m.name === b.name)).map((b, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 16, filter: 'grayscale(1)', opacity: 0.4 }}>{b.icon}</span>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{b.name}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{b.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
