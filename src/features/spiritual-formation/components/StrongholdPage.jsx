import { useState, useCallback, useEffect } from 'react'
import { T } from '../lib/localize'
import { recordFromScan, saveScanRecord, clearScanRecords } from '../lib/strongholdHistory'
import { pushScanRemote, listScansRemote, clearScansRemote } from '../lib/strongholdApi'
import StrongholdLibrary from './StrongholdLibrary'
import StrongholdDiscernmentForm from './StrongholdDiscernmentForm'
import StrongholdTimeline from './StrongholdTimeline'
import StrongholdProfile from './StrongholdProfile'

// 自高之事 tab 容器 / "Strongholds" tab — 本体库 + 自我辨识 + 成长追踪。
// 登录后辨识记录会同步到云端（routers/strongholds.py），未登录则本地优先。
export default function StrongholdPage({ userId = 'local-user', token, initialView = 'library' }) {
  const [view, setView] = useState(initialView)
  const [refreshKey, setRefreshKey] = useState(0)
  const [cloudRecords, setCloudRecords] = useState(null) // null = 本地模式 / not loaded

  // 登录后从云端拉取记录（失败则回退本地）
  useEffect(() => {
    let cancelled = false
    if (!token) { setCloudRecords(null); return }
    listScansRemote(365, token)
      .then((items) => { if (!cancelled) setCloudRecords(items) })
      .catch(() => { if (!cancelled) setCloudRecords(null) })
    return () => { cancelled = true }
  }, [token, refreshKey])

  // 辨识完成：始终写本地（离线可用）；已登录再推送云端
  const onScanSave = useCallback((payload) => {
    if (!payload?.result) return
    let record = null
    try {
      record = recordFromScan(userId, payload.text || '', payload.emotions || [], payload.result)
      saveScanRecord(record)
    } catch { /* localStorage 不可用时静默 */ }
    if (token && record) {
      pushScanRemote(record, token).then(() => setRefreshKey((k) => k + 1)).catch(() => setRefreshKey((k) => k + 1))
    } else {
      setRefreshKey((k) => k + 1)
    }
  }, [userId, token])

  // 清空：本地 + 云端
  const onClear = useCallback(() => {
    try { clearScanRecords(userId) } catch { /* ignore */ }
    if (token) clearScansRemote(token).catch(() => {})
    setCloudRecords(token ? [] : null)
    setRefreshKey((k) => k + 1)
  }, [userId, token])

  const views = [
    ['library', T('本体库', 'Library'), '🗼'],
    ['scan', T('自我辨识', 'Self-Discernment'), '🧭'],
    ['growth', T('成长追踪', 'Growth'), '📈'],
    ['profile', T('属灵画像', 'Profile'), '🪞'],
  ]

  return (
    <section className="sf-section" style={{ padding: '16px 16px 0', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '4px', marginBottom: '4px' }}>
        {views.map(([key, label, icon]) => {
          const on = view === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              style={{ flex: 1, padding: '10px', borderRadius: '9px', border: 'none', cursor: 'pointer', background: on ? 'linear-gradient(135deg, rgba(120,120,255,0.22) 0%, rgba(140,92,255,0.18) 100%)' : 'transparent', color: on ? '#c7c8ff' : 'rgba(255,255,255,0.55)', fontSize: '12px', fontWeight: on ? 800 : 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}
            >
              <span>{icon}</span>{label}
            </button>
          )
        })}
      </div>

      {view === 'library' && <StrongholdLibrary />}
      {view === 'scan' && <StrongholdDiscernmentForm onSave={onScanSave} />}
      {view === 'growth' && (
        <StrongholdTimeline
          userId={userId}
          refreshKey={refreshKey}
          records={token ? (cloudRecords || []) : undefined}
          synced={Boolean(token)}
          onClear={token ? onClear : undefined}
        />
      )}
      {view === 'profile' && <StrongholdProfile token={token} />}
    </section>
  )
}
