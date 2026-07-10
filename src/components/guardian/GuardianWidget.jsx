// 属灵守护者 / AI Companion Sprite — 右下角常驻 Widget
// 定位：属灵同行者，不是神/牧者/医生/心理咨询师的替代。
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
import { t } from '../../i18n/runtime'
import { AutoText } from '../../autoTranslate.jsx'

const TABS = [
  { key: 'chat', label: t("聊天"), icon: '💬' },
  { key: 'emotion', label: t("心情"), icon: '🫶' },
  { key: 'spiritual', label: t("灵程"), icon: '🌿' },
  { key: 'prayer', label: t("祷告"), icon: '🙏' },
  { key: 'devotion', label: t("灵修"), icon: '📖' },
  { key: 'reflection', label: t("镜子"), icon: '🪞' },
  { key: 'memory', label: t("记忆"), icon: '💭' },
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
      <h3 style={S.sectionTitle}>{t("🪞 行为模式与心的方向")}</h3>
      {patterns.length === 0 && idolSignals.length === 0 && (
        <p style={{ ...S.dimText, textAlign: 'center', padding: '12px 0' }}>
          {t("还没有足够的觉察。继续记录心情，我会温柔地陪你看见自己。")}
        </p>
      )}
      {patterns.map((p) => <PatternInsightCard key={p.id} pattern={p} />)}
      {idolSignals.slice(0, 3).map((s) => <IdolMonitorCard key={s.id} signal={s} />)}
    </div>
  )
}

const POS_KEY = 'guardian-sprite-pos'
const SPRITE_BOX = 70 // 小精灵按钮可视尺寸（58 + padding）
const PANEL_WIDTH = 180
const PANEL_HEIGHT = 270

function clampPos({ x, y }, width = SPRITE_BOX, height = SPRITE_BOX) {
  return {
    x: Math.min(Math.max(0, x), Math.max(0, window.innerWidth - width)),
    y: Math.min(Math.max(0, y), Math.max(0, window.innerHeight - height)),
  }
}

function savePos(position) {
  try { localStorage.setItem(POS_KEY, JSON.stringify(position)) } catch { /* storage is optional */ }
}

function loadPos() {
  try {
    const raw = localStorage.getItem(POS_KEY)
    if (!raw) return null
    const { x, y } = JSON.parse(raw)
    if (typeof x !== 'number' || typeof y !== 'number') return null
    // 读取时夹紧到当前视口内（换设备/转屏后不丢）
    return clampPos({ x, y })
  } catch { return null }
}

export default function GuardianWidget() {
  const { widgetMode, setWidgetMode, spriteState, profile, refresh } = useGuardianStore()
  const [tab, setTab] = useState('chat')
  const expanded = widgetMode !== 'collapsed'

  // —— 拖拽：手指/鼠标皆可。null = 默认右下角；拖过后用 left/top 定位并持久化 ——
  // 收起态拖小鸽子本体；展开态拖面板头部（拖拽手柄）。
  const [pos, setPos] = useState(loadPos)
  const rootRef = useRef(null)
  const dragRef = useRef(null)      // { startX, startY, originX, originY }
  const movedRef = useRef(false)    // 本次手势是否构成拖动（抑制 click）

  const onSpritePointerDown = (e) => {
    if (e.target.closest('[data-no-drag]')) return
    if (e.button != null && e.button !== 0) return
    e.preventDefault()
    const el = e.currentTarget
    // 以整个容器（面板+小鸽子）为基准拖动，展开状态下也不会跳位
    const box = rootRef.current?.getBoundingClientRect()
      || el.parentElement?.getBoundingClientRect() || el.getBoundingClientRect()
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: box.left, originY: box.top, w: box.width, h: box.height }
    movedRef.current = false
    el.setPointerCapture?.(e.pointerId)
  }
  const onSpritePointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    if (!movedRef.current && Math.hypot(dx, dy) < 6) return // 阈值内视为点按
    movedRef.current = true
    const x = Math.min(Math.max(0, d.originX + dx), Math.max(0, window.innerWidth - (d.w || SPRITE_BOX)))
    const y = Math.min(Math.max(0, d.originY + dy), Math.max(0, window.innerHeight - (d.h || SPRITE_BOX)))
    setPos({ x, y })
  }
  const onSpritePointerUp = () => {
    if (movedRef.current && dragRef.current) {
      setPos((p) => { if (p) savePos(p); return p })
    }
    dragRef.current = null
  }

  // 展开、收起或转屏后，按真实容器尺寸重新夹紧，避免窗口被留在屏幕外。
  useLayoutEffect(() => {
    if (!pos || !rootRef.current) return
    const box = rootRef.current.getBoundingClientRect()
    setPos((current) => {
      if (!current) return current
      const next = clampPos(current, box.width || SPRITE_BOX, box.height || SPRITE_BOX)
      if (next.x === current.x && next.y === current.y) return current
      savePos(next)
      return next
    })
  }, [expanded]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const keepVisible = () => {
      const box = rootRef.current?.getBoundingClientRect()
      if (!box) return
      setPos((current) => {
        if (!current) return current
        const next = clampPos(current, box.width || SPRITE_BOX, box.height || SPRITE_BOX)
        if (next.x === current.x && next.y === current.y) return current
        savePos(next)
        return next
      })
    }
    window.addEventListener('resize', keepVisible)
    return () => window.removeEventListener('resize', keepVisible)
  }, [])

  useEffect(() => { refresh() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const openTab = (t) => {
    setTab(t)
    setWidgetMode(TAB_TO_WIDGET_MODE[t] || 'expanded')
  }

  return (
    <div ref={rootRef} className="guardian-widget-root" style={{ position: 'fixed', zIndex: 1200,
      ...(pos ? { left: pos.x, top: pos.y } : { bottom: 20, right: 20 }),
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
      {expanded && (
        <div className="guardian-panel guardian-panel--compact" data-testid="guardian-panel" style={{
          width: PANEL_WIDTH, maxWidth: 'calc(100vw - 16px)', height: PANEL_HEIGHT,
          maxHeight: 'calc(100vh - 94px)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          borderRadius: 10, border: `1px solid ${C.line}`,
          background: C.panel, backdropFilter: 'blur(10px)',
          boxShadow: '0 12px 34px rgba(0,0,0,0.48)',
        }}>
          {/* 头部（拖拽手柄：展开状态按住这里也能拖动） */}
          <div
            onPointerDown={onSpritePointerDown}
            onPointerMove={onSpritePointerMove}
            onPointerUp={onSpritePointerUp}
            onPointerCancel={onSpritePointerUp}
            data-testid="guardian-drag-handle"
            aria-label={t("拖动守护者窗口")}
            style={{ display: 'flex', alignItems: 'center', gap: 6,
              borderBottom: `1px solid ${C.lineSoft}`, padding: '5px 6px',
              cursor: 'grab', touchAction: 'none', userSelect: 'none' }}>
            <GuardianSprite state={spriteState} size={24} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.text, margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.name ? <AutoText>{profile.name}</AutoText> : t("属灵守护者")}
              </p>
              <p style={{ fontSize: 9, color: C.dim, margin: 0,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile ? <>{profile.stageEmoji} <AutoText>{profile.stageZh}</AutoText> · </> : ''}{t("同行者，不是替代者")}
              </p>
            </div>
            <button type="button" data-no-drag onClick={() => setWidgetMode('collapsed')} aria-label={t("收起")}
              style={{ background: 'none', border: 'none', cursor: 'pointer',
                color: C.dim, fontSize: 13, width: 28, height: 28, padding: 0 }}>─</button>
          </div>

          {/* Tab 栏 */}
          <div style={{ display: 'flex', gap: 1, borderBottom: `1px solid ${C.lineSoft}`,
            padding: '3px 2px' }}>
            {TABS.map((t) => (
              <button key={t.key} type="button" title={t.label} onClick={() => openTab(t.key)}
                style={{ flex: 1, minWidth: 20, height: 26, border: 'none', cursor: 'pointer', fontSize: 12,
                  borderRadius: 6, padding: 0,
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

      {/* 小鸽子（可拖动，点按开合） */}
      <button type="button" aria-label={t("打开属灵守护者（按住可拖动）")}
        onClick={() => { if (movedRef.current) { movedRef.current = false; return } setWidgetMode(expanded ? 'collapsed' : 'expanded') }}
        onPointerDown={onSpritePointerDown}
        onPointerMove={onSpritePointerMove}
        onPointerUp={onSpritePointerUp}
        onPointerCancel={onSpritePointerUp}
        style={{ background: 'none', border: 'none', cursor: 'grab', padding: 6, touchAction: 'none' }}>
        <GuardianSprite state={spriteState} size={58} />
      </button>
    </div>
  )
}
