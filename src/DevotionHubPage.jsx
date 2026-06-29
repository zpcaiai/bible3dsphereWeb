import { useState } from 'react'
import BackButton from './BackButton'
import { getToken } from './auth'
import { t } from './i18n/runtime'
import DevotionJournalPage from './DevotionJournalPage'
import DailyDevotionPage from './DailyDevotionPage'
import MorningDewPage from './MorningDewPage'
import PersonalDevotionPage from './PersonalDevotionPage'
import DailySoulQuestionPage from './DailySoulQuestionPage'
import QuickDevotionPage from './QuickDevotionPage'

// 灵修中心 / Devotion Hub —— 把分散的灵修入口收敛到一个门，按标签切换既有页面（复用，不重写）。
const TABS = [
  ['journal', '📔', '灵修日志'],
  ['daily', '🌅', '每日灵修'],
  ['dew', '💧', '晨露'],
  ['personal', '🪞', '个人灵修'],
  ['soul', '🔍', '每日一问'],
  ['quick', '⏱', '2分钟灵修'],
]

export default function DevotionHubPage({ user, onBack }) {
  const [tab, setTab] = useState('journal')
  const token = getToken()
  return (
    <div style={{ width: '100%', height: '100%', background: '#000', color: '#fff', overflowY: 'auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(20,20,22,0.95)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
          <BackButton onClick={onBack} />
          <div style={{ fontSize: 16, fontWeight: 700 }}>{t('灵修')}</div>
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
        {tab === 'journal' && <DevotionJournalPage user={user} token={token} contained onBack={onBack} />}
        {tab === 'daily' && <DailyDevotionPage onBack={onBack} />}
        {tab === 'dew' && <MorningDewPage />}
        {tab === 'personal' && <PersonalDevotionPage user={user} token={token} />}
        {tab === 'soul' && <DailySoulQuestionPage user={user} token={token} onBack={onBack} />}
        {tab === 'quick' && <QuickDevotionPage user={user} token={token} onBack={onBack} onDone={onBack} />}
      </div>
    </div>
  )
}
