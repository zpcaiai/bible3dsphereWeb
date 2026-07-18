import { Suspense, useEffect, useState } from 'react'
import lazyWithRetry from '../lazyWithRetry'
import { saveJournal } from '../api'
import { t as i18nT } from '../i18n/runtime'
import { buildExpansionJournalPayload } from '../expansion/expansionJournal'
import DevotionTopicsHome from './DevotionTopicsHome'
import { DEVOTION_TOPICS } from './devotionTopicRecommendations'

const PersonalDevotionPage = lazyWithRetry(() => import('../PersonalDevotionPage'))
const MorningDewPage = lazyWithRetry(() => import('../MorningDewPage'))
const ReadingPlanPage = lazyWithRetry(() => import('../ReadingPlanPage'))
const MemoryVersePage = lazyWithRetry(() => import('../MemoryVersePage'))
const SpiritualBooksPage = lazyWithRetry(() => import('../SpiritualBooksPage'))
const DevotionJournalPage = lazyWithRetry(() => import('../DevotionJournalPage'))
const ExpansionHub = lazyWithRetry(() => import('../expansion/ExpansionHub'))
const LAST_TOPIC_KEY = 'devotion-last-topic'
const LAST_TOPIC_META_KEY = 'devotion-last-topic-meta'

function compactTopic(feature) {
  if (!feature?.key || !feature?.name) return null
  return { key: feature.key, emoji: feature.emoji || '🧭', name: feature.name, sub: feature.sub || '专题灵修' }
}

function readLastTopic() {
  try {
    const stored = window.localStorage.getItem(LAST_TOPIC_META_KEY)
    if (stored) return compactTopic(JSON.parse(stored))
    const legacyKey = window.localStorage.getItem(LAST_TOPIC_KEY)
    return legacyKey ? compactTopic(DEVOTION_TOPICS[legacyKey]) : null
  } catch {
    return null
  }
}

const SECTIONS = [
  { id: 'today', icon: '🌟', labelKey: 'devotion.section.today' },
  { id: 'scripture', icon: '📖', labelKey: 'devotion.section.scripture' },
  { id: 'topics', icon: '🧭', labelKey: 'devotion.section.topics' },
  { id: 'journal', icon: '📔', labelKey: 'devotion.section.journal' },
]

function SecondaryTabs({ items, value, onChange }) {
  return (
    <div role="tablist" aria-label={i18nT('灵修内容分类')} style={{ display: 'flex', gap: 6, padding: '8px 10px', background: 'rgba(8,11,18,0.97)', borderBottom: '1px solid rgba(255,255,255,0.07)', overflowX: 'auto', flexShrink: 0 }}>
      {items.map((item) => (
        <button key={item.id} type="button" role="tab" aria-selected={value === item.id} onClick={() => onChange(item.id)} style={{ flex: '1 0 auto', minHeight: 38, padding: '7px 12px', borderRadius: 11, border: value === item.id ? '1px solid rgba(52,199,89,0.3)' : '1px solid transparent', background: value === item.id ? 'rgba(52,199,89,0.1)' : 'transparent', color: value === item.id ? '#54d879' : 'rgba(255,255,255,0.54)', fontSize: 12, fontWeight: value === item.id ? 700 : 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          {item.icon} {i18nT(item.labelKey)}
        </button>
      ))}
    </div>
  )
}
export default function DevotionTabContainer({
  user,
  token,
  showLogin,
  renderInlineLogin,
  onBack,
  dailySnapshot,
  initialSection = 'today',
  initialFeatureKey = null,
  onOpenFormationTwin,
  onOpenSafety,
  onJournalSaved,
}) {
  const [section, setSection] = useState(initialSection)
  const [todayView, setTodayView] = useState('personal')
  const [scriptureView, setScriptureView] = useState(window.__deepLink?.kind === 'book' ? 'books' : 'plan')
  const [topicView, setTopicView] = useState(initialSection === 'topics' && initialFeatureKey ? 'hub' : 'home')
  const [featureKey, setFeatureKey] = useState(initialFeatureKey)
  const [hubSession, setHubSession] = useState(0)
  const [lastFeature, setLastFeature] = useState(readLastTopic)

  useEffect(() => {
    setSection(initialSection)
    if (initialSection === 'topics') {
      setFeatureKey(initialFeatureKey)
      setTopicView(initialFeatureKey ? 'hub' : 'home')
      setHubSession((value) => value + 1)
    }
  }, [initialSection, initialFeatureKey])

  function rememberFeature(feature) {
    const topic = compactTopic(typeof feature === 'string' ? DEVOTION_TOPICS[feature] : feature)
    if (!topic) return
    setLastFeature(topic)
    try {
      window.localStorage.setItem(LAST_TOPIC_KEY, topic.key)
      window.localStorage.setItem(LAST_TOPIC_META_KEY, JSON.stringify(topic))
    } catch { /* device-local continuation preference only */ }
  }

  function openFeature(key) {
    setFeatureKey(key || null)
    setTopicView('hub')
    setHubSession((value) => value + 1)
    if (key) rememberFeature(key)
  }

  async function saveExpansionResult({ feature, input, result }) {
    if (!user || !token) throw new Error(i18nT('请先登录，再保存灵修日记'))
    const payload = buildExpansionJournalPayload({ feature, input, result })
    const saved = await saveJournal(payload, token)
    try {
      await onJournalSaved?.(saved)
    } catch (refreshError) {
      console.warn('[DevotionTabContainer.jsx] journal saved but snapshot refresh failed', refreshError)
    }
    return saved
  }

  const todayTabs = [
    { id: 'personal', icon: '🌟', labelKey: 'devotion.tab.personal' },
    { id: 'dew', icon: '🌅', labelKey: 'devotion.tab.dew' },
  ]
  const scriptureTabs = [
    { id: 'plan', icon: '📅', labelKey: 'devotion.tab.plan' },
    { id: 'memory', icon: '🧠', labelKey: 'devotion.tab.memory' },
    { id: 'books', icon: '📚', labelKey: 'devotion.tab.books' },
  ]

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#070a11' }}>
      <div role="tablist" aria-label={i18nT('灵修主导航')} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', background: 'rgba(13,17,23,0.99)', borderBottom: '1px solid rgba(255,255,255,0.1)', zIndex: 300, flexShrink: 0 }}>
        {SECTIONS.map((item) => (
          <button key={item.id} type="button" role="tab" aria-selected={section === item.id} onClick={() => setSection(item.id)} style={{ minWidth: 0, minHeight: 58, padding: '8px 3px 7px', border: 'none', borderBottom: section === item.id ? '2px solid #34c759' : '2px solid transparent', background: section === item.id ? 'rgba(52,199,89,0.07)' : 'none', color: section === item.id ? '#45d36b' : 'rgba(255,255,255,0.46)', cursor: 'pointer', fontFamily: 'inherit' }}>
            <span aria-hidden="true" style={{ display: 'block', fontSize: 17 }}>{item.icon}</span>
            <span style={{ display: 'block', marginTop: 2, fontSize: 12, fontWeight: section === item.id ? 750 : 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{i18nT(item.labelKey)}</span>
          </button>
        ))}
      </div>

      {section === 'today' && <SecondaryTabs items={todayTabs} value={todayView} onChange={setTodayView} />}
      {section === 'scripture' && <SecondaryTabs items={scriptureTabs} value={scriptureView} onChange={setScriptureView} />}

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
        {section === 'today' && (todayView === 'personal' ? (
          <Suspense fallback={null}>
            <PersonalDevotionPage
              user={user}
              token={token}
              dailySnapshot={dailySnapshot}
              onOpenTopic={(key) => { setSection('topics'); openFeature(key) }}
              onOpenTopics={() => { setTopicView('home'); setSection('topics') }}
              onOpenSafety={onOpenSafety}
            />
          </Suspense>
        ) : (
          <Suspense fallback={null}><MorningDewPage /></Suspense>
        ))}

        {section === 'scripture' && (scriptureView === 'plan' ? (
          <Suspense fallback={null}><ReadingPlanPage user={user} /></Suspense>
        ) : scriptureView === 'memory' ? (
          <Suspense fallback={null}><MemoryVersePage user={user} /></Suspense>
        ) : (
          <Suspense fallback={null}><SpiritualBooksPage onBack={onBack} /></Suspense>
        ))}

        {section === 'topics' && (topicView === 'home' ? (
          <DevotionTopicsHome
            dailySnapshot={dailySnapshot}
            lastFeature={lastFeature}
            onOpenFeature={openFeature}
            onOpenAll={() => openFeature(null)}
            onOpenSafety={onOpenSafety}
          />
        ) : (
          <Suspense fallback={null}>
            <ExpansionHub
              key={`${featureKey || 'root'}-${hubSession}`}
              initialFeatureKey={featureKey}
              onClose={() => setTopicView('home')}
              onSaveJournal={saveExpansionResult}
              onOpenJournal={() => { setTopicView('home'); setSection('journal') }}
              onOpenFormationTwin={onOpenFormationTwin}
              onOpenSafety={onOpenSafety}
              onSelectFeature={rememberFeature}
            />
          </Suspense>
        ))}

        {section === 'journal' && (user ? (
          <Suspense fallback={null}><DevotionJournalPage user={user} token={token} onBack={() => setSection('today')} contained /></Suspense>
        ) : (showLogin ? renderInlineLogin() : null))}
      </div>
    </div>
  )
}
