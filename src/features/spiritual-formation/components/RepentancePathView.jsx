import { useMemo, useState } from 'react'
import { T } from '../lib/localize'
import { buildRepentancePath } from '../lib/repentancePath'
import { getActivePathFor, startPath, toggleDay, setStatus } from '../lib/repentancePathStore'
import { MilestoneTrack } from '../../../components/charts'

const LENGTHS = [
  ['seven_days', T('7 天', '7-day')],
  ['thirty_days', T('30 天', '30-day')],
  ['one_day', T('今天一步', 'Today')],
]

/**
 * 把 plan.days 折叠成「阶段」。
 * 7 天路径里一天一个阶段；30 天路径是同样 7 个阶段循环四轮多（见 repentancePath.ts 的取模），
 * 逐日列 30 站没人看得下去，也会让人误以为悔改有三十个关卡。真正的骨架只有 STAGE_TEMPLATE 那七步。
 * 阶段顺序按它们在 plan.days 中首次出现的次序，不重新排。
 */
function stageStops(plan, doneSet) {
  const byStage = new Map()
  plan.days.forEach((d) => {
    if (!byStage.has(d.stage)) byStage.set(d.stage, { stage: d.stage, focus: d.focus, days: [] })
    byStage.get(d.stage).days.push(d.day)
  })
  return [...byStage.values()].map((row) => ({
    ...row,
    done: row.days.filter((day) => doneSet.has(day)).length,
  }))
}

const STAGE_LABEL = {
  awareness: T('看见', 'See'),
  naming: T('命名', 'Name'),
  confession: T('承认', 'Confess'),
  turning: T('转向', 'Turn'),
  renunciation: T('弃绝', 'Renounce'),
  replacement: T('新顺服', 'Replace'),
  fruit_review: T('回顾果子', 'Fruit'),
}

export default function RepentancePathView({ strongholdCode, userId = 'local-user' }) {
  const [length, setLength] = useState('seven_days')
  const [progress, setProgress] = useState(() => getActivePathFor(userId, strongholdCode))
  const [, force] = useState(0)

  const activeLength = progress?.length || length
  const plan = useMemo(() => buildRepentancePath(strongholdCode, activeLength), [strongholdCode, activeLength])
  if (!plan) return null

  const done = new Set(progress?.completedDays || [])
  const pct = progress ? Math.round((done.size / plan.days.length) * 100) : 0

  function begin() {
    const p = startPath(userId, strongholdCode, length)
    setProgress(p)
  }
  function check(day) {
    if (!progress) return
    const p = toggleDay(progress.id, day)
    setProgress(p ? { ...p } : progress)
    force((n) => n + 1)
  }
  function finish(status) {
    if (!progress) return
    setStatus(progress.id, status)
    setProgress(null)
  }

  // 未开始：长度选择 + 开始
  if (!progress) {
    return (
      <div style={{ marginTop: '10px' }}>
        <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }}>
          {T('把这次看见，化作一条具体的悔改之路——看见谎言、命名偶像、转向基督、操练新顺服。终点是恩典，不是自责。',
             'Turn this moment of seeing into a concrete path of repentance — see the lie, name the idol, turn to Christ, practice new obedience. The end is grace, not self-blame.')}
        </p>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          {LENGTHS.map(([key, label]) => {
            const on = length === key
            return (
              <button key={key} type="button" onClick={() => setLength(key)}
                style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', border: '1px solid ' + (on ? 'rgba(255,149,0,0.45)' : 'rgba(255,255,255,0.1)'), background: on ? 'rgba(255,149,0,0.14)' : 'rgba(255,255,255,0.04)', color: on ? '#ffcf8b' : 'rgba(255,255,255,0.6)', fontWeight: on ? 700 : 400 }}>
                {label}
              </button>
            )
          })}
        </div>
        <button type="button" onClick={begin}
          style={{ padding: '10px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #ff9500 0%, #ff6a00 100%)', color: '#fff', fontSize: '13.5px', fontWeight: 700 }}>
          🛤️ {T('开始悔改路径', 'Begin the path')}
        </button>
      </div>
    )
  }

  // 进行中
  const stops = stageStops(plan, done)
  // 「你在这里」= 第一天还没打勾的那一天所属的阶段；全部走完时停在最后一站。
  const firstUndone = plan.days.find((d) => !done.has(d.day))
  const currentStage = firstUndone
    ? Math.max(0, stops.findIndex((row) => row.stage === firstUndone.stage))
    : stops.length - 1

  return (
    <div style={{ marginTop: '10px' }}>
      <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 700, color: '#ffcf8b' }}>{plan.title}</p>

      {/* 进度 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #ff9500, #ffcf8b)', borderRadius: '999px' }} />
        </div>
        <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.5)' }}>{done.size}/{plan.days.length}</span>
      </div>

      {/* 阶段里程碑：让人先看见整条路的形状，再去打每天的勾 */}
      <div style={{ marginBottom: '12px' }}>
        <MilestoneTrack
          title={T('这条路会经过的阶段', 'The stages this path passes through')}
          subtitle={T(
            `${stops.length} 个阶段，现在停在「${STAGE_LABEL[stops[currentStage].stage] || stops[currentStage].stage}」。这条路的终点是恩典，不是自责；走慢了不算掉队。`,
            `${stops.length} stages; you are at “${STAGE_LABEL[stops[currentStage].stage] || stops[currentStage].stage}”. This road ends in grace, not self-blame — going slowly is not falling behind.`,
          )}
          stops={stops.map((row) => ({
            key: row.stage,
            label: STAGE_LABEL[row.stage] || row.stage,
            note: `${row.focus} · ${row.done}/${row.days.length}`,
          }))}
          currentIndex={currentStage}
        />
      </div>

      {/* 主祷告 */}
      {plan.prayer.text && (
        <div style={{ background: 'linear-gradient(135deg, rgba(255,149,0,0.08) 0%, rgba(255,149,0,0.02) 100%)', borderLeft: '4px solid #ff9500', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: '#ff9500', marginBottom: '4px' }}>🙏 {plan.prayer.title}</div>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#ffd699', lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>{plan.prayer.text}</p>
        </div>
      )}

      {/* 日卡 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {plan.days.map((d) => {
          const isDone = done.has(d.day)
          return (
            <div key={d.day} style={{ background: isDone ? 'rgba(48,209,88,0.05)' : 'rgba(255,255,255,0.02)', border: '1px solid ' + (isDone ? 'rgba(48,209,88,0.2)' : 'rgba(255,255,255,0.07)'), borderRadius: '10px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <button type="button" onClick={() => check(d.day)} aria-label="toggle"
                  style={{ flexShrink: 0, width: '22px', height: '22px', borderRadius: '6px', cursor: 'pointer', border: '1px solid ' + (isDone ? '#30d158' : 'rgba(255,255,255,0.25)'), background: isDone ? '#30d158' : 'transparent', color: '#fff', fontSize: '13px', lineHeight: '20px', padding: 0 }}>
                  {isDone ? '✓' : ''}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#ffcf8b', background: 'rgba(255,149,0,0.12)', borderRadius: '999px', padding: '1px 7px' }}>{T('第', 'Day ')}{d.day}{T(' 天', '')}</span>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{STAGE_LABEL[d.stage]} · {d.scriptureTheme}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#fff', fontWeight: 600, marginBottom: '4px' }}>{d.focus}</div>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12.5px', color: 'rgba(255,255,255,0.78)', lineHeight: '1.55' }}>📿 {d.action}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5' }}>💭 {d.reviewQuestion}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 果子指标 */}
      {plan.fruitIndicators.length > 0 && (
        <div style={{ marginTop: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>
          🕊️ {T('你或许会渐渐看见：', 'You may gradually see: ')}{plan.fruitIndicators.join('、')}
        </div>
      )}

      {/* 牧养提醒 */}
      {plan.cautions.map((c) => (
        <p key={c} style={{ marginTop: '8px', fontSize: '11.5px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.55' }}>· {c}</p>
      ))}

      {/* 控制 */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
        <button type="button" onClick={() => finish('completed')}
          style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(48,209,88,0.3)', background: 'rgba(48,209,88,0.08)', color: '#a3e2ab', fontSize: '12.5px', cursor: 'pointer' }}>
          {T('完成', 'Complete')}
        </button>
        <button type="button" onClick={() => finish('abandoned')}
          style={{ padding: '8px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: '12.5px', cursor: 'pointer' }}>
          {T('暂停', 'Pause')}
        </button>
      </div>
    </div>
  )
}
