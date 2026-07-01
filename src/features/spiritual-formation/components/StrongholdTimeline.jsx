import { useMemo, useState } from 'react'
import { strongholdMap } from '../data/strongholds'
import { T, localizeStronghold, archetypeName, pickVal } from '../lib/localize'
import {
  listScanRecords,
  summarizeStrongholdHistory,
  buildGrowthInsight,
  clearScanRecords,
  TRIGGER_LABEL,
  TRIGGER_INTERVENTION,
} from '../lib/strongholdHistory'

const RANGES = [[7, '7天'], [30, '30天'], [90, '90天']]

const nameOf = (code) => (strongholdMap[code] ? localizeStronghold(strongholdMap[code]).name : code)
const triggerLabel = (t) => pickVal(TRIGGER_LABEL[t]?.zh, TRIGGER_LABEL[t]?.en) || t

function TrendBadge({ trend }) {
  // rising = 该模式近期出现更多（需留意），falling = 出现更少（成长信号）
  const map = {
    rising: { icon: '↑', color: '#ff8a84', label: T('上升', 'rising') },
    falling: { icon: '↓', color: '#5fd98a', label: T('下降', 'easing') },
    stable: { icon: '→', color: 'rgba(255,255,255,0.4)', label: T('平稳', 'stable') },
  }
  const m = map[trend] || map.stable
  return <span style={{ color: m.color, fontSize: '11px', fontWeight: 700 }}>{m.icon} {m.label}</span>
}

export default function StrongholdTimeline({ userId = 'local-user', refreshKey = 0, records, onClear, synced = false }) {
  const [rangeDays, setRangeDays] = useState(30)
  const [cleared, setCleared] = useState(0)

  const summary = useMemo(
    () => summarizeStrongholdHistory(records ?? listScanRecords(userId), rangeDays),
    [userId, rangeDays, refreshKey, cleared, records],
  )

  const insight = buildGrowthInsight(summary)
  const maxCount = summary.topStrongholds[0]?.count || 1

  async function handleClear() {
    const ok = typeof window === 'undefined' || await window.confirmDialog?.(T('确定清空辨识记录吗？此操作不可恢复。', 'Clear all discernment records? This cannot be undone.'))
    if (!ok) return
    if (onClear) { onClear(); return }
    clearScanRecords(userId)
    setCleared((c) => c + 1)
  }

  return (
    <section className="sf-section" style={{ padding: '20px 16px 60px', boxSizing: 'border-box' }}>
      {/* 头部 */}
      <div style={{ background: 'linear-gradient(135deg, rgba(120,120,255,0.08) 0%, rgba(90,200,250,0.03) 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>📈</span>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#c7c8ff' }}>{T('成长追踪', 'Growth Tracking')}</h2>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
          {T('这里汇总你最近的自我辨识，帮助你看见反复出现的模式与触发情境——这是恩典中的省察，不是给你打分。所有记录只存在你本地。',
             'A gentle summary of your recent self-discernment, to help you notice recurring patterns and triggers — reflection in grace, not a score. All records stay on your device only.')}
        </p>
      </div>

      {/* 范围切换 */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {RANGES.map(([days, label]) => {
          const on = rangeDays === days
          return (
            <button key={days} type="button" onClick={() => setRangeDays(days)}
              style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12.5px', cursor: 'pointer', border: '1px solid ' + (on ? 'rgba(140,140,255,0.45)' : 'rgba(255,255,255,0.1)'), background: on ? 'rgba(120,120,255,0.16)' : 'rgba(255,255,255,0.04)', color: on ? '#c7c8ff' : 'rgba(255,255,255,0.6)', fontWeight: on ? 700 : 400 }}>
              {T(label, label.replace('天', 'd'))}
            </button>
          )
        })}
        <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
          {summary.totalScans} {T('次辨识', 'scans')}{synced ? T(' · 已同步云端', ' · synced') : ''}
        </span>
      </div>

      {summary.totalScans === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '30px', marginBottom: '8px' }}>🌱</div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>{T('这个时间段还没有记录。去「自我辨识」做一次，结果会自动出现在这里。', 'No records in this range yet. Run a self-discernment and it will appear here.')}</div>
        </div>
      ) : (
        <>
          {/* 本周关注点 */}
          {insight.hasData && insight.focus && (
            <div style={{ background: 'linear-gradient(135deg, rgba(255,149,0,0.08) 0%, rgba(120,120,255,0.04) 100%)', border: '1px solid rgba(255,149,0,0.2)', borderRadius: '14px', padding: '16px', marginBottom: '18px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 800, color: '#ffcf8b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🌤️</span>{T('本周关注点', "This week's focus")}
              </h3>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.7' }}>
                {T('最近你较常回到', 'Lately you often return to ')}「<b style={{ color: '#ffd699' }}>{nameOf(insight.focus.strongholdCode)}</b>」
                {insight.focus.topTrigger ? T(`，尤其在「${triggerLabel(insight.focus.topTrigger)}」的时候`, ` — especially around ${triggerLabel(insight.focus.topTrigger)}`) : ''}
                {T('。这不是定罪，而是一个邀请：在这一点上多倚靠基督的恩典。', '. This is not condemnation but an invitation to lean more on Christ\'s grace here.')}
              </p>
              {insight.focus.topTrigger && TRIGGER_INTERVENTION[insight.focus.topTrigger] && (
                <p style={{ margin: 0, fontSize: '12.5px', color: '#ffd699', lineHeight: '1.6' }}>
                  🙏 {pickVal(TRIGGER_INTERVENTION[insight.focus.topTrigger].microPrayer.zh, TRIGGER_INTERVENTION[insight.focus.topTrigger].microPrayer.en)}
                </p>
              )}
              {insight.growthSignals.length > 0 && (
                <div style={{ marginTop: '10px', background: 'rgba(48,209,88,0.06)', border: '1px solid rgba(48,209,88,0.16)', borderRadius: '10px', padding: '8px 12px', fontSize: '12.5px', color: '#a3e2ab', lineHeight: '1.6' }}>
                  🌱 {T('成长信号：', 'Growth signal: ')}{insight.growthSignals.map((g) => nameOf(g.strongholdCode)).join('、')} {T('最近出现得更少了。', 'has been showing up less.')}
                </div>
              )}
            </div>
          )}

          {/* 最常见自高之事 */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 800, color: '#c7c8ff' }}>🗼 {T('最常见的自高之事', 'Most frequent strongholds')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {summary.topStrongholds.map((s) => (
                <div key={s.code}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{nameOf(s.code)}</span>
                    <span style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <TrendBadge trend={s.trend} />
                      <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{s.count}×</span>
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round((s.count / maxCount) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #6a6aff, #8c5cff)', borderRadius: '999px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 原型分布 */}
          {summary.archetypeDistribution.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 800, color: '#c7c8ff' }}>🏛️ {T('原型分布', 'Archetype spread')}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {summary.archetypeDistribution.map((a) => (
                  <span key={a.code} style={{ fontSize: '12px', color: '#a9abff', background: 'rgba(120,120,255,0.10)', border: '1px solid rgba(120,120,255,0.22)', padding: '4px 10px', borderRadius: '999px' }}>
                    {archetypeName(a.code)} · {a.count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 触发模式 */}
          {summary.topTriggers.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 800, color: '#ffcf8b' }}>⚡ {T('最常见的触发情境', 'Most common triggers')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {summary.topTriggers.map((tr) => {
                  const prayer = pickVal(TRIGGER_INTERVENTION[tr.type]?.microPrayer?.zh, TRIGGER_INTERVENTION[tr.type]?.microPrayer?.en)
                  return (
                    <div key={tr.type} style={{ background: 'rgba(255,159,10,0.04)', border: '1px solid rgba(255,159,10,0.16)', borderRadius: '10px', padding: '10px 12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#ffcf8b', fontWeight: 700 }}>{triggerLabel(tr.type)}</span>
                        <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.45)' }}>{tr.count}×</span>
                      </div>
                      {tr.linkedStrongholds.length > 0 && (
                        <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.55)', marginTop: '4px' }}>
                          → {tr.linkedStrongholds.map(nameOf).join('、')}
                        </div>
                      )}
                      {prayer && <div style={{ fontSize: '11.5px', color: '#ffd699', marginTop: '6px', lineHeight: '1.5' }}>🙏 {prayer}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 最近记录 */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>🕘 {T('最近记录', 'Recent')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {summary.recent.map((r) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.6)', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                  <span>{new Date(r.date).toLocaleDateString()} · {nameOf(r.primaryCode)}</span>
                  {r.triggerType && <span style={{ color: 'rgba(255,207,139,0.7)' }}>{triggerLabel(r.triggerType)}</span>}
                </div>
              ))}
            </div>
          </div>

          <button type="button" onClick={handleClear} style={{ fontSize: '12px', color: 'rgba(255,107,107,0.7)', background: 'none', border: '1px solid rgba(255,107,107,0.2)', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer' }}>
            {T('清空本地记录', 'Clear local records')}
          </button>
        </>
      )}
    </section>
  )
}
