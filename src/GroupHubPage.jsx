// GroupHubPage — 小组中心：把分散的「语音群 / 聊天 / 祷告墙 / 聚会排期」聚合到一页。
// 每个小组一张卡：成员数、下次聚会倒计时、快捷动作直达。
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { API_BASE, fetchVoiceGroups } from './api'
import MeetingScheduleModal from './MeetingScheduleModal'
import { t } from './i18n/runtime'
import { a11yClickProps } from './lib/a11yClick';

function authHeaders(token) {
  const h = {}
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

const fmtCountdown = (iso) => {
  const ms = new Date(iso) - Date.now()
  if (ms <= 0) return t('正在进行')
  const d = Math.floor(ms / 86400000), h = Math.floor(ms / 3600000) % 24, m = Math.floor(ms / 60000) % 60
  if (d > 0) return `${d}${t('天')}${h}${t('小时后')}`
  if (h > 0) return `${h}${t('小时')}${m}${t('分后')}`
  return `${m}${t('分钟后')}`
}

export default function GroupHubPage({ user, token, onBack, onOpenPanel }) {
  const [groups, setGroups] = useState(null)
  const [upcoming, setUpcoming] = useState([])
  const [scheduleFor, setScheduleFor] = useState(null)
  const [minutes, setMinutes] = useState([])
  const [openMinId, setOpenMinId] = useState(null)

  useEffect(() => {
    let alive = true
    fetchVoiceGroups(token).then((d) => { if (alive) setGroups(d.groups || []) }).catch(() => { if (alive) setGroups([]) })
    fetch(`${API_BASE}/meetings/upcoming`, { headers: authHeaders(token) })
      .then((r) => r.json()).then((j) => { if (alive && j.success) setUpcoming(j.data || []) }).catch((err) => { console.warn('[GroupHubPage.jsx] ignored async error', err) })
    fetch(`${API_BASE}/minutes?limit=20`, { headers: authHeaders(token) })
      .then((r) => r.json()).then((j) => { if (alive && j.success) setMinutes(j.data || []) }).catch((err) => { console.warn('[GroupHubPage.jsx] ignored async error', err) })
    return () => { alive = false }
  }, [token])

  const nextFor = (gid) => upcoming.find((m) => m.groupId === gid)

  return (
    <div style={S.page}>
      <header style={S.header}>
        <BackButton onClick={onBack} />
        <span style={S.title}>{t('👥 小组中心')}</span>
        <span style={{ width: 56 }} />
      </header>
      <div style={S.body}>
        {/* 最近聚会横幅 */}
        {upcoming.length > 0 && (
          <div style={S.banner}>
            📅 {t('下次聚会')}：<b>{upcoming[0].title}</b> · {upcoming[0].groupName} · {upcoming[0].whenLabel}
            <span style={S.countdown}>{fmtCountdown(upcoming[0].nextAt)}</span>
          </div>
        )}

        {groups === null && <div style={S.dim}>{t('加载中…')}</div>}
        {groups && groups.length === 0 && (
          <div style={S.dim}>
            {t('还没有小组。去「音视频通话」建一个群，邀请弟兄姊妹——小组中心会把聊天、通话、祷告、排期聚在这里。')}
          </div>
        )}
        {groups && groups.map((g) => {
          const nxt = nextFor(g.id)
          return (
            <div key={g.id} style={S.card}>
              <div style={S.cardHead}>
                <span style={S.gname}>{g.name}</span>
                <span style={S.gmeta}>{g.member_count}/{g.max_members} {t('人')}{g.is_owner ? ` · ${t('群主')}` : ''}</span>
              </div>
              {nxt ? (
                <div style={S.next}>📅 {nxt.title} · {nxt.whenLabel} <span style={S.countdown}>{fmtCountdown(nxt.nextAt)}</span></div>
              ) : (
                <div style={{ ...S.next, color: 'rgba(255,255,255,0.35)' }}>{t('暂无聚会排期')}</div>
              )}
              <div style={S.actions}>
                <button style={S.act} onClick={() => onOpenPanel('voice')}>🎙 {t('语音房')}</button>
                <button style={S.act} onClick={() => onOpenPanel('communion')}>💬 {t('聊天')}</button>
                <button style={S.act} onClick={() => onOpenPanel('prayer')}>🙏 {t('祷告墙')}</button>
                <button style={S.act} onClick={() => setScheduleFor(g)}>📅 {t('排期')}</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* 历史纪要：通话 AI 纪要自动归档于此 */}
      {minutes.length > 0 && (
        <div style={{ ...S.body, paddingTop: 0, flex: 'none' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '6px 2px 8px' }}>📝 {t('历史纪要')}</div>
          {minutes.map((m) => (
            <div key={m.id} style={{ ...S.card, cursor: 'pointer' }} onClick={() => setOpenMinId(openMinId === m.id ? null : m.id)} {...a11yClickProps(() => setOpenMinId(openMinId === m.id ? null : m.id))}>
              <div style={S.cardHead}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{m.title || t('聚会纪要')}</span>
                <span style={S.gmeta}>{(m.createdAt || '').slice(0, 16).replace('T', ' ')} {openMinId === m.id ? '▾' : '▸'}</span>
              </div>
              {openMinId === m.id && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: 12.5, lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>{m.summary}</div>
                  {(m.prayerItems || []).length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12.5, color: '#7dd3fc', lineHeight: 1.8 }}>
                      🙏 {m.prayerItems.map((x, i) => <div key={i}>· {x}</div>)}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {scheduleFor && (
        <MeetingScheduleModal group={scheduleFor} token={token} onClose={() => setScheduleFor(null)} />
      )}
    </div>
  )
}

const S = {
  page: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#0d1117', color: '#fff', fontFamily: 'inherit' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 },
  title: { fontSize: 16, fontWeight: 700 },
  body: { flex: 1, overflowY: 'auto', padding: 14, maxWidth: 560, width: '100%', margin: '0 auto', boxSizing: 'border-box' },
  banner: { background: 'rgba(232,176,75,0.1)', border: '1px solid rgba(232,176,75,0.35)', borderRadius: 13, padding: '11px 14px', fontSize: 13, lineHeight: 1.7, marginBottom: 14 },
  countdown: { marginLeft: 8, fontSize: 12, color: '#7dd3fc', fontWeight: 600 },
  dim: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13.5, lineHeight: 1.9, padding: '40px 18px' },
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 15, padding: '13px 15px', marginBottom: 11 },
  cardHead: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  gname: { fontSize: 15.5, fontWeight: 700 },
  gmeta: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  next: { fontSize: 12.5, color: 'rgba(255,255,255,0.65)', margin: '7px 0 10px' },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  act: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 10, padding: '7px 13px', color: 'rgba(255,255,255,0.85)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' },
}
