// 属灵守护者 / AI Companion Sprite — 右下角常驻 Widget
// 定位：属灵同行者，不是神/牧者/医生/心理咨询师的替代。
import { useEffect, useState } from 'react'
import { useGuardianStore } from './guardianStore'
import { fetchGuardianInsights } from './guardianApi'
import GuardianSprite from './GuardianSprite'
import GuardianChatPanel from './GuardianChatPanel'
import EmotionCheckIn from './EmotionCheckIn'
import SpiritualCheckIn from './SpiritualCheckIn'
import PrayerJournal from './PrayerJournal'
import DailyDevotionCard from './DailyDevotionCard'
import GuardianGrowthBar from './GuardianGrowthBar'
import GuardianMemoryPanel from './GuardianMemoryPanel'
import PatternInsightCard from './PatternInsightCard'
import IdolMonitorCard from './IdolMonitorCard'
import { C, S } from './guardianStyles'
import './guardian.css'

const TABS = [
  { key: 'chat', label: '聊天', icon: '💬' },
  { key: 'emotion', label: '心情', icon: '🫶' },
  { key: 'spiritual', label: '灵程', icon: '🌿' },
  { key: 'prayer', label: '祷告', icon: '🙏' },
  { key: 'devotion', label: '灵修', icon: '📖' },
  { key: 'reflection', label: '镜子', icon: '🪞' },
  { key: 'memory', label: '记忆', icon: '💭' },
]

const TAB_TO_WIDGET_MODE = {
  emotion: 'checkin', spiritual: 'checkin', prayer: 'prayer',
  devotion: 'devotion', reflection: 'reflection',
}

function ReflectionPanel() {
  const [patterns, setPatterns] = useState([])
  const [idolSignals, setIdolSignals] = useState([])

  useEffect(() => {
    fetchGuardianInsights()
      .then((d) => { setPatterns(d.patterns || []); setIdolSignals(d.idolSignals || []) })
      .catch(() => {})
  }, [])

  return (
    <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <h3 style={S.sectionTitle}>🪞 行为模式与心的方向</h3>
      {patterns.length === 0 && idolSignals.length === 0 && (
        <p style={{ ...S.dimText, textAlign: 'center', padding: '12px 0' }}>
          还没有足够的觉察。继续记录心情，我会温柔地陪你看见自己。
        </p>
      )}
      {patterns.map((p) => <PatternInsightCard key={p.id} pattern={p} />)}
      {idolSignals.slice(0, 3).map((s) => <IdolMonitorCard key={s.id} signal={s} />)}
    </div>
  )
}

export default function GuardianWidget() {
  const { widgetMode, setWidgetMode, spriteState, profile, refresh } = useGuardianStore()
  const [tab, setTab] = useState('chat')
  const expanded = widgetMode !== 'collapsed'

  useEffect(() => { refresh() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const openTab = (t) => {
    setTab(t)
    setWidgetMode(TAB_TO_WIDGET_MODE[t] || 'expanded')
  }

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1200,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
      {expanded && (
        <div className="guardian-panel" style={{
          width: 360, maxWidth: 'calc(100vw - 40px)', height: 540,
          maxHeight: 'calc(100vh - 130px)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          borderRadius: 16, border: `1px solid ${C.line}`,
          background: C.panel, backdropFilter: 'blur(10px)',
          boxShadow: '0 18px 50px rgba(0,0,0,0.5)',
        }}>
          {/* 头部 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10,
            borderBottom: `1px solid ${C.lineSoft}`, padding: '10px 12px' }}>
            <GuardianSprite state={spriteState} size={36} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13.5, fontWeight: 600, color: C.text, margin: 0 }}>
                {profile?.name || '属灵守护者'}
              </p>
              <p style={{ fontSize: 11, color: C.dim, margin: 0 }}>
                {profile ? `${profile.stageEmoji} ${profile.stageZh} · ` : ''}同行者，不是替代者
              </p>
            </div>
            <button type="button" onClick={() => setWidgetMode('collapsed')} aria-label="收起"
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                color: C.dim, fontSize: 14, padding: '4px 8px' }}>─</button>
          </div>

          {/* Tab 栏 */}
          <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${C.lineSoft}`,
            padding: '6px 8px' }}>
            {TABS.map((t) => (
              <button key={t.key} type="button" title={t.label} onClick={() => openTab(t.key)}
                style={{ flex: 1, border: 'none', cursor: 'pointer', fontSize: 14,
                  borderRadius: 8, padding: '4px 0',
                  background: tab === t.key ? 'rgba(42,51,88,0.6)' : 'transparent',
                  opacity: tab === t.key ? 1 : 0.6 }}>
                {t.icon}
              </button>
            ))}
          </div>

          {/* 内容 */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {tab === 'chat' && <GuardianChatPanel />}
            {tab === 'emotion' && <EmotionCheckIn onDone={() => openTab('chat')} />}
            {tab === 'spiritual' && <SpiritualCheckIn onDone={() => openTab('chat')} />}
            {tab === 'prayer' && <PrayerJournal />}
            {tab === 'devotion' && <DailyDevotionCard />}
            {tab === 'reflection' && <ReflectionPanel />}
            {tab === 'memory' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '12px 12px 0' }}><GuardianGrowthBar /></div>
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                  <GuardianMemoryPanel />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 收起状态的小精灵 */}
      <button type="button" aria-label="打开属灵守护者"
        onClick={() => setWidgetMode(expanded ? 'collapsed' : 'expanded')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
        <GuardianSprite state={spriteState} size={58} />
      </button>
    </div>
  )
}
