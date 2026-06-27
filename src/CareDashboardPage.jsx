// CareDashboardPage.jsx — Advanced Batch · Module 3 (Group Leader Care Dashboard)
// Shows CARE SIGNALS only (authorised summaries) — never private journals,
// diagnostic detail, "spiritual scores", or rankings. Leaders log care actions.
import React, { useCallback, useEffect, useState } from 'react'
import { API_BASE } from './api'

function authHeaders(token, json) {
  const h = json ? { 'Content-Type': 'application/json' } : {}
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

const LEVEL_STYLES = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-amber-100 text-amber-800 border-amber-300',
  low: 'bg-emerald-100 text-emerald-800 border-emerald-300',
}
const ACTIONS = [
  ['pray', '为他/她祷告'],
  ['message', '私信关怀'],
  ['meet_1on1', '约一对一'],
  ['refer_to_pastor', '转介牧者'],
  ['follow_up', '稍后跟进'],
]

export default function CareDashboardPage({ user, token, churchId: churchIdProp, onBack }) {
  const [churchId, setChurchId] = useState(churchIdProp || '')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState('')
  const [flags, setFlags] = useState(null)

  const load = useCallback(async () => {
    if (!churchId) return
    setLoading(true); setError('')
    try {
      const r = await fetch(`${API_BASE}/care/groups/${churchId}/care-dashboard`, { headers: authHeaders(token) })
      if (r.status === 403) throw new Error('你没有权限查看这个小组的关怀面板。')
      if (!r.ok) throw new Error('加载失败，请稍后再试。')
      setData(await r.json())
      try {
        const fr = await fetch(`${API_BASE}/care/groups/${churchId}/formation-flags`, { headers: authHeaders(token) })
        setFlags(fr.ok ? await fr.json() : null)
      } catch { setFlags(null) }
    } catch (e) {
      setError(e.message); setData(null)
    } finally {
      setLoading(false)
    }
  }, [churchId, token])

  useEffect(() => { load() }, [load])

  async function act(signalId, actionType) {
    setBusy(signalId + actionType)
    try {
      await fetch(`${API_BASE}/care/signals/${signalId}/actions`, {
        method: 'POST', headers: authHeaders(token, true),
        body: JSON.stringify({ action_type: actionType }),
      })
      await load()
    } finally {
      setBusy('')
    }
  }

  const s = data?.summary || {}
  return (
    <div className="max-w-3xl mx-auto p-4 text-slate-800">
      <div className="flex items-center gap-3 mb-3">
        {onBack && <button onClick={onBack} className="text-sm text-slate-500">← 返回</button>}
        <h1 className="text-xl font-semibold">小组关怀面板</h1>
      </div>

      {!churchIdProp && (
        <div className="flex gap-2 mb-4">
          <input value={churchId} onChange={(e) => setChurchId(e.target.value)} placeholder="小组/教会 ID"
                 className="border rounded px-2 py-1 text-sm w-40" />
          <button onClick={load} className="text-sm bg-slate-800 text-white rounded px-3 py-1">加载</button>
        </div>
      )}

      <p className="text-xs text-slate-400 mb-4">
        本面板只显示关怀信号与授权摘要，不显示私密日志、属灵分数或排名。AI 不替代真实关怀。
      </p>

      {loading && <p className="text-sm text-slate-500">加载中…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {data && (
        <>
          <div className="grid grid-cols-4 gap-3 mb-5">
            <Kpi label="成员" value={s.members_count} />
            <Kpi label="代祷请求" value={s.prayer_requests_count} />
            <Kpi label="待跟进" value={s.needs_followup_count} />
            <Kpi label="高风险" value={s.high_risk_count} danger={s.high_risk_count > 0} />
          </div>

          {data.items.length === 0 && <p className="text-sm text-slate-500">暂无需要关注的关怀信号。</p>}

          <ul className="space-y-3">
            {data.items.map((it) => (
              <li key={it.signal_id} className={`border rounded-lg p-3 ${LEVEL_STYLES[it.signal_level] || ''}`}>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="font-medium">{it.display_name} · {it.title}</div>
                    <div className="text-sm mt-1 opacity-90">{it.summary}</div>
                    {it.suggested_action && <div className="text-xs mt-1 opacity-80">建议：{it.suggested_action}</div>}
                  </div>
                  <span className="text-xs uppercase shrink-0">{it.signal_level}</span>
                </div>
                {it.high_touch_notice && (
                  <div className="mt-2 text-sm font-medium text-red-700">⚠ {it.high_touch_notice}</div>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {ACTIONS.map(([key, label]) => (
                    <button key={key} disabled={busy === it.signal_id + key}
                            onClick={() => act(it.signal_id, key)}
                            className="text-xs bg-white/70 hover:bg-white border rounded px-2 py-1">
                      {label}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          {flags && flags.restricted && (
            <p className="mt-6 text-xs text-slate-400">成长风险汇总仅向牧者级开放；小组长请使用上方关怀信号。</p>
          )}
          {flags && !flags.restricted && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold mb-1">成长风险汇总 · 近 {flags.window_days} 天</h2>
              <p className="text-xs text-slate-400 mb-3">由统一成长事件聚合，仅显示风险类别与时间，不含日志全文——帮助你看见谁这阵子可能需要主动关怀。</p>
              {(!flags.items || flags.items.length === 0) && (
                <p className="text-sm text-slate-500">近期没有需要留意的成长风险信号。</p>
              )}
              <ul className="space-y-2">
                {(flags.items || []).map((m) => (
                  <li key={m.user_id} className={`border rounded-lg p-3 ${m.risk === 'red' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex justify-between items-center gap-2">
                      <div className="font-medium">{m.name} <span className="text-xs text-slate-400">{m.email_masked}</span></div>
                      <span className={`text-xs px-2 py-0.5 rounded shrink-0 ${m.risk === 'red' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800'}`}>
                        {m.risk === 'red' ? '高负荷' : '需留意'}{m.red ? ` · ${m.red}红` : ''}{m.amber ? ` · ${m.amber}黄` : ''}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(m.flags || []).map((f, i) => (
                        <span key={i} className="text-xs bg-white/70 border rounded px-2 py-0.5">
                          {f.title}{f.at ? ` · ${String(f.at).slice(5, 10)}` : ''}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">最近活动：{m.last_at ? String(m.last_at).slice(0, 10) : '—'}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Kpi({ label, value, danger }) {
  return (
    <div className={`rounded-lg border p-3 text-center ${danger ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
      <div className={`text-2xl font-semibold ${danger ? 'text-red-700' : ''}`}>{value ?? 0}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  )
}
