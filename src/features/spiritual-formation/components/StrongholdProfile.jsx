import { useEffect, useState } from 'react'
import { strongholdMap } from '../data/strongholds'
import { T, localizeStronghold, archetypeName, doctrineName, patternNameById, emotionName, pickVal } from '../lib/localize'
import { TRIGGER_LABEL } from '../lib/strongholdHistory'
import { loadProfileRemote, loadProgressRemote } from '../lib/strongholdApi'

const RANGES = [[30, '30天'], [90, '90天'], [180, '180天']]
const nameOf = (c) => (strongholdMap[c] ? localizeStronghold(strongholdMap[c]).name : c)
const triggerLabel = (t) => pickVal(TRIGGER_LABEL[t]?.zh, TRIGGER_LABEL[t]?.en) || t

const TREND = {
  growing: { label: T('在成长的方向上', 'Moving toward growth'), color: '#5fd98a', icon: '🌿' },
  stable: { label: T('较为平稳', 'Fairly steady'), color: '#a9abff', icon: '🕊️' },
  struggling: { label: T('正在经历挣扎——没关系，恩典够用', 'In a season of struggle — that’s okay, grace is enough'), color: '#ffcf8b', icon: '🤲' },
  insufficient_data: { label: T('记录还不够，先多做几次辨识', 'Not enough yet — try a few more discernments'), color: 'rgba(255,255,255,0.5)', icon: '🌱' },
}

function Bar({ label, value, color = '#8c5cff' }) {
  const v = Math.max(0, Math.min(100, Math.round(value || 0)))
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px' }}>
        <span>{label}</span><span style={{ color: 'rgba(255,255,255,0.4)' }}>{v}%</span>
      </div>
      <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ width: `${v}%`, height: '100%', background: color, borderRadius: '999px' }} />
      </div>
    </div>
  )
}

function Chips({ items }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {items.map((x) => (
        <span key={x.key} style={{ fontSize: '12px', color: '#c7c8ff', background: 'rgba(120,120,255,0.10)', border: '1px solid rgba(120,120,255,0.22)', padding: '3px 10px', borderRadius: '999px' }}>
          {x.label}{x.count != null ? ` · ${x.count}` : ''}
        </span>
      ))}
    </div>
  )
}

export default function StrongholdProfile({ token }) {
  const [rangeDays, setRangeDays] = useState(90)
  const [st, setSt] = useState({ loading: false, error: '', profile: null, progress: null })

  useEffect(() => {
    if (!token) { setSt({ loading: false, error: '', profile: null, progress: null }); return }
    let cancelled = false
    setSt((s) => ({ ...s, loading: true, error: '' }))
    Promise.all([loadProfileRemote(rangeDays, token), loadProgressRemote(Math.min(rangeDays, 90), token)])
      .then(([profile, progress]) => { if (!cancelled) setSt({ loading: false, error: '', profile, progress }) })
      .catch((e) => { if (!cancelled) setSt({ loading: false, error: e?.message || '加载失败', profile: null, progress: null }) })
    return () => { cancelled = true }
  }, [token, rangeDays])

  const wrap = (children) => (
    <section className="sf-section" style={{ padding: '20px 16px 60px', boxSizing: 'border-box' }}>
      <div style={{ background: 'linear-gradient(135deg, rgba(120,120,255,0.08) 0%, rgba(90,200,250,0.03) 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>🪞</span>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#c7c8ff' }}>{T('属灵画像', 'Spiritual Profile')}</h2>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
          {T('这是基于你云端记录（自高之事辨识 + 每日省察）的动态画像——描述模式与方向，不给你贴标签、不打属灵分数。',
             'A dynamic picture from your cloud records (stronghold discernment + daily examen) — describing patterns and direction, never labeling you or scoring your soul.')}
        </p>
      </div>
      {children}
    </section>
  )

  if (!token) {
    return wrap(
      <div style={{ textAlign: 'center', padding: '50px 20px', color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: '30px', marginBottom: '8px' }}>🔐</div>
        <div style={{ fontSize: '13px', lineHeight: '1.6' }}>{T('属灵画像基于云端统计，登录后即可查看。', 'The spiritual profile is computed in the cloud — sign in to view it.')}</div>
      </div>,
    )
  }

  if (st.loading) return wrap(<div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>{T('正在生成画像…', 'Building your profile…')}</div>)
  if (st.error) return wrap(<div style={{ textAlign: 'center', padding: '40px', color: '#ff8a84', fontSize: '13px' }}>{st.error}</div>)

  const p = st.profile
  const pr = st.progress
  const trend = TREND[pr?.overallTrend] || TREND.insufficient_data
  const hasStronghold = p && p.stronghold.dominant.length > 0
  const hasSin = p && p.sinPattern.dominant.length > 0

  return wrap(
    <>
      {/* 范围 */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {RANGES.map(([d, label]) => {
          const on = rangeDays === d
          return (
            <button key={d} type="button" onClick={() => setRangeDays(d)}
              style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '12.5px', cursor: 'pointer', border: '1px solid ' + (on ? 'rgba(140,140,255,0.45)' : 'rgba(255,255,255,0.1)'), background: on ? 'rgba(120,120,255,0.16)' : 'rgba(255,255,255,0.04)', color: on ? '#c7c8ff' : 'rgba(255,255,255,0.6)', fontWeight: on ? 700 : 400 }}>
              {T(label, label.replace('天', 'd'))}
            </button>
          )
        })}
      </div>

      {/* 成长方向 */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <span style={{ fontSize: '18px' }}>{trend.icon}</span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: trend.color }}>{trend.label}</span>
        </div>
        {pr && pr.overallTrend !== 'insufficient_data' && (
          <>
            <Bar label={T('省察参与度', 'Reflection engagement')} value={pr.awarenessScore} color="#6a6aff" />
            <Bar label={T('主要模式的松动', 'Easing of the main pattern')} value={pr.strongholdReductionScore} color="#5fd98a" />
          </>
        )}
        {pr?.growthSignals?.length > 0 && (
          <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#a3e2ab', lineHeight: '1.6' }}>
            🌱 {T('成长信号：', 'Growth signals: ')}{pr.growthSignals.map((g) => nameOf(g.strongholdCode)).join('、')}
          </div>
        )}
        {pr?.struggleSignals?.length > 0 && (
          <div style={{ marginTop: '4px', fontSize: '12.5px', color: '#ffcf8b', lineHeight: '1.6' }}>
            🔎 {T('需留意：', 'Watch: ')}{pr.struggleSignals.map((g) => nameOf(g.strongholdCode)).join('、')}
          </div>
        )}
      </div>

      {/* 节奏 */}
      {p && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
          {[
            [p.rhythm.strongholdScans, T('次辨识', 'discernments')],
            [p.rhythm.dailyExamens, T('次日省', 'examens')],
            [p.rhythm.activeDays, T('个省察日', 'active days')],
          ].map(([n, label]) => (
            <div key={label} style={{ flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '12px 6px' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#c7c8ff' }}>{n}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* 自高之事维度 */}
      {hasStronghold && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 800, color: '#c7c8ff' }}>🗼 {T('自高之事维度', 'Stronghold dimension')}</h3>
          <Chips items={p.stronghold.dominant.slice(0, 6).map((s) => ({ key: s.code, label: nameOf(s.code), count: s.count }))} />
          {p.stronghold.archetypes.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>{T('原型', 'Archetypes')}</div>
              <Chips items={p.stronghold.archetypes.map((a) => ({ key: a.code, label: archetypeName(a.code), count: a.count }))} />
            </div>
          )}
          {p.stronghold.blockedDoctrines.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>{T('较难领受的真理', 'Truths hardest to receive')}</div>
              <Chips items={p.stronghold.blockedDoctrines.map((d) => ({ key: d.code, label: doctrineName(d.code), count: d.count }))} />
            </div>
          )}
        </div>
      )}

      {/* 罪模式维度（来自每日省察） */}
      {hasSin && (
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 800, color: '#ffd699' }}>🕯️ {T('罪模式维度（每日省察）', 'Sin-pattern dimension (daily examen)')}</h3>
          <Chips items={p.sinPattern.dominant.slice(0, 6).map((s) => ({ key: s.code, label: patternNameById(s.code), count: s.count }))} />
          {p.sinPattern.emotions.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>{T('常见情绪', 'Common emotions')}</div>
              <Chips items={p.sinPattern.emotions.slice(0, 6).map((e) => ({ key: e.emotion, label: emotionName(e.emotion), count: e.count }))} />
            </div>
          )}
        </div>
      )}

      {/* 建议焦点 */}
      {p?.recommendedFocus && (
        <div style={{ background: 'rgba(120,120,255,0.06)', border: '1px solid rgba(120,120,255,0.2)', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.7' }}>
            🎯 {T('下阶段建议关注：', 'Suggested focus next: ')}<b style={{ color: '#c7c8ff' }}>{nameOf(p.recommendedFocus.strongholdCode)}</b>
            {p.recommendedFocus.topTrigger ? T(`（常被「${triggerLabel(p.recommendedFocus.topTrigger)}」触发）`, ` (often triggered by ${triggerLabel(p.recommendedFocus.topTrigger)})`) : ''}
          </div>
        </div>
      )}

      {/* 鼓励 + 留意 */}
      {p?.encouragements?.length > 0 && (
        <div style={{ background: 'rgba(48,209,88,0.05)', border: '1px solid rgba(48,209,88,0.16)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }}>
          {p.encouragements.map((e) => <p key={e} style={{ margin: '4px 0', fontSize: '12.5px', color: '#a3e2ab', lineHeight: '1.6' }}>💚 {e}</p>)}
        </div>
      )}
      {p?.cautions?.length > 0 && (
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' }}>
          {p.cautions.map((c) => <p key={c} style={{ margin: '4px 0' }}>· {c}</p>)}
        </div>
      )}
    </>,
  )
}
