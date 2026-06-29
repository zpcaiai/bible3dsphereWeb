import { useState } from 'react'
import BackButton from './BackButton'
import { getToken } from './auth'
import { t } from './i18n/runtime'
import CommunityPage from './CommunityPage'
import GroupHubPage from './GroupHubPage'
import PrayerWallPage from './PrayerWallPage'
import ShareWallPage from './ShareWallPage'
import TestimonyWallPage from './TestimonyWallPage'
import CommunionPage from './CommunionPage'

// 群体中心 / Community Hub —— 把分散的群体入口收敛到一个门，按标签切换既有页面（复用，不重写）。
const TABS = [
  ['community', '🌐', '社区'],
  ['group', '👥', '小组'],
  ['prayer', '🙏', '祷告墙'],
  ['share', '📝', '分享墙'],
  ['testimony', '✨', '见证墙'],
  ['communion', '💬', '圣徒相通'],
]

export default function CommunityHubPage({ user, onBack, onOpenPanel, onOpenVoice }) {
  const [tab, setTab] = useState('community')
  const token = getToken()
  return (
    <div style={{ width: '100%', height: '100%', background: '#000', color: '#fff', overflowY: 'auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(20,20,22,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
          <BackButton onClick={onBack} />
          <div style={{ fontSize: 16, fontWeight: 700 }}>{t('群体')}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 12px 10px' }}>
          {TABS.map(([k, icon, name]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ whiteSpace: 'nowrap', fontSize: 12.5, padding: '6px 12px', borderRadius: 999, cursor: 'pointer',
                border: '1px solid ' + (tab === k ? '#5ac8fa' : 'rgba(255,255,255,0.14)'),
                background: tab === k ? 'rgba(90,200,250,0.16)' : 'transparent',
                color: tab === k ? '#cfe9ff' : 'rgba(255,255,255,0.6)' }}>
              {icon} {t(name)}
            </button>
          ))}
        </div>
      </div>
      <div>
        {tab === 'community' && <CommunityPage user={user} token={token} onBack={onBack} />}
        {tab === 'group' && <GroupHubPage user={user} token={token} onBack={onBack} onOpenPanel={onOpenPanel} />}
        {tab === 'prayer' && <PrayerWallPage user={user} token={token} onBack={onBack} />}
        {tab === 'share' && <ShareWallPage user={user} onBack={onBack} />}
        {tab === 'testimony' && <TestimonyWallPage user={user} token={token} />}
        {tab === 'communion' && <CommunionPage user={user} onBack={onBack} onOpenVoice={onOpenVoice} />}
      </div>
    </div>
  )
}
