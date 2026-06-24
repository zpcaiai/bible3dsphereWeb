import { Suspense, useState } from 'react'
import lazyWithRetry from '../lazyWithRetry'

const PersonalDevotionPage = lazyWithRetry(() => import('../PersonalDevotionPage'))
const MorningDewPage = lazyWithRetry(() => import('../MorningDewPage'))
const ReadingPlanPage = lazyWithRetry(() => import('../ReadingPlanPage'))
const MemoryVersePage = lazyWithRetry(() => import('../MemoryVersePage'))
const SpiritualBooksPage = lazyWithRetry(() => import('../SpiritualBooksPage'))
const DevotionJournalPage = lazyWithRetry(() => import('../DevotionJournalPage'))

export default function DevotionTabContainer({ user, token, showLogin, renderInlineLogin, onBack }) {
  const [subTab, setSubTab] = useState(window.__deepLink?.kind === 'book' ? 'daily' : 'personal') // 'personal' | 'daily' | 'journal'
  const SUBTABS = [
    { id: 'personal', label: '🌟', full: '今日灵修' },
    { id: 'dew',      label: '🌅', full: '清晨甘露' },
    { id: 'plan',     label: '📅', full: '读经计划' },
    { id: 'memory',   label: '🧠', full: '背经' },
    { id: 'daily',    label: '📚', full: '属灵书籍' },
    { id: 'journal',  label: '📔', full: '灵修日记' },
  ]
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Sub-tab nav */}
      <div style={{
        display: 'flex',
        background: 'rgba(13,17,23,0.98)',
        borderBottom: '1px solid rgba(255,255,255,0.10)',
        zIndex: 300,
        flexShrink: 0,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}>
        {SUBTABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            style={{
              flex: 1,
              background: subTab === t.id ? 'rgba(52,199,89,0.07)' : 'none',
              border: 'none',
              borderBottom: subTab === t.id ? '2px solid #34c759' : '2px solid transparent',
              color: subTab === t.id ? '#34c759' : 'rgba(255,255,255,0.45)',
              fontSize: 12,
              fontWeight: subTab === t.id ? 700 : 400,
              padding: '11px 4px',
              cursor: 'pointer',
              transition: 'color 0.2s, background 0.2s',
              fontFamily: 'inherit',
              minHeight: 54,
            }}
          >
            <div style={{ fontSize: 16 }}>{t.label}</div>
            <div style={{ marginTop: 1 }}>{t.full}</div>
          </button>
        ))}
      </div>
      {/* Sub-tab content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
        {subTab === 'personal' ? (
          <Suspense fallback={null}>
            <PersonalDevotionPage user={user} token={token} />
          </Suspense>
        ) : subTab === 'dew' ? (
          <Suspense fallback={null}>
            <MorningDewPage />
          </Suspense>
        ) : subTab === 'plan' ? (
          <Suspense fallback={null}>
            <ReadingPlanPage user={user} />
          </Suspense>
        ) : subTab === 'memory' ? (
          <Suspense fallback={null}>
            <MemoryVersePage user={user} />
          </Suspense>
        ) : subTab === 'daily' ? (
          <Suspense fallback={null}>
            <SpiritualBooksPage onBack={onBack} />
          </Suspense>
        ) : (
          user ? (
            <DevotionJournalPage user={user} token={token} onBack={() => setSubTab('personal')} contained />
          ) : (showLogin ? renderInlineLogin() : null)
        )}
      </div>
    </div>
  )
}
