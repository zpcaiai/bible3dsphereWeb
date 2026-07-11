import { t as i18nT } from './i18n/runtime'
/**
 * PersonalDevotionPage — 千人千面每日灵修 + 麦琴读经计划
 *
 * 根据用户灵命状态生成个性化灵修内容，并显示今日麦琴读经计划章节。
 * 经文区块默认折叠（手风琴式），可展开阅读全文并点击播放语音。
 */

import React, { useEffect, useState } from 'react'
import { TTSButton, TTSFullBar } from './useGlobalAudio.jsx'
import { API_BASE, fetchScripture } from './api.js'
import { a11yClickProps } from './lib/a11yClick';

// ── Mobile detection ──────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = React.useState(() => window.innerWidth < 480)
  React.useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 480)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

const API = API_BASE

// ── ScriptureVerses — 手风琴式，默认折叠，含 TTS ─────────────────────────────
const SV = {
  wrapper: { marginTop: 8 },
  loading: { fontSize: 12, color: 'rgba(90,200,250,0.5)', padding: '6px 0' },
  // Accordion toggle row
  toggleRow: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 10px', borderRadius: 8, cursor: 'pointer', userSelect: 'none',
    background: 'rgba(90,200,250,0.06)', border: '1px solid rgba(90,200,250,0.14)',
    marginBottom: 0,
  },
  refLabel: {
    fontSize: 12, color: 'rgba(90,200,250,0.7)',
    fontWeight: 600, letterSpacing: '0.03em', flex: 1,
  },
  chevron: (open) => ({
    fontSize: 11, color: 'rgba(90,200,250,0.5)',
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.2s', flexShrink: 0, marginLeft: 2,
  }),
  versesWrap: { paddingTop: 6 },
  verseRow: {
    display: 'flex', gap: 8, padding: '5px 0',
    borderBottom: '1px solid rgba(90,200,250,0.07)', alignItems: 'flex-start',
  },
  verseNum: {
    fontSize: 11, fontWeight: 700, color: 'rgba(90,200,250,0.5)',
    minWidth: 22, paddingTop: 2, flexShrink: 0,
  },
  verseText: { fontSize: 14, lineHeight: 1.8, color: 'rgba(255,255,255,0.88)' },
}

function ScriptureVerses({ scriptureRef, initialOpen = false }) {
  const [verses, setVerses]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [open, setOpen]       = useState(initialOpen)

  useEffect(() => {
    if (!scriptureRef) return
    setLoading(true); setVerses(null); setError(null)
    fetchScripture(scriptureRef)
      .then(d => { if (d.ok && d.verses?.length) setVerses(d); else setError(d.error || '暂无经文') })
      .catch(() => setError(i18nT('加载失败')))
      .finally(() => setLoading(false))
  }, [scriptureRef])

  if (loading) return <div style={SV.loading}>{i18nT('加载经文中…')}</div>
  if (error)   return <div style={SV.loading}>{error}</div>
  if (!verses) return null

  const { book, chapter, verses: list } = verses
  const ttsAll = list.map(v => v.text).join('　')

  return (
    <div style={SV.wrapper}>
      {/* ── Toggle header ── */}
      <div style={SV.toggleRow} onClick={() => setOpen(o => !o)} {...a11yClickProps(() => setOpen(o => !o))}>
        <span style={SV.refLabel}>📖 {book} {chapter}{i18nT('章 ·')} {list.length}{i18nT('节')}</span>
        {/* TTS — stop propagation so click doesn't toggle accordion */}
        <div onClick={e => e.stopPropagation()} {...a11yClickProps(e => e.stopPropagation())}>
          <TTSButton text={ttsAll} />
        </div>
        <span style={SV.chevron(open)}>▼</span>
      </div>

      {/* ── Verse list (shown when open) ── */}
      {open && (
        <div style={SV.versesWrap}>
          {list.map(v => (
            <div key={v.verse} style={SV.verseRow}>
              <span style={SV.verseNum}>{v.verse}</span>
              <span style={SV.verseText}>{v.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── McCheyne reading plan (loaded from public/mccheyne.json) ──────────────────
function useMcCheyne() {
  const [plan, setPlan] = useState(null)
  useEffect(() => {
    fetch('/mccheyne.json').then(r => r.json()).then(setPlan).catch(() => setPlan({}))
  }, [])
  const today = new Date()
  const key = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return plan ? (plan[key] || null) : undefined
}

function readingSummary(reading) {
  if (!reading) return ''
  const refs = [reading.f1, reading.f2, reading.n1, reading.ps].filter(Boolean)
  return refs.length ? refs.join('、') : ''
}

function buildFallbackDevotion(reading) {
  const refs = readingSummary(reading)
  const readingLine = refs ? `今天的麦琴读经是：${refs}。` : '今天先安静读一段经文，把心重新归向神。'
  return {
    ok: true,
    localFallback: true,
    theme: '今日读经与归回',
    verse_ref: reading?.ps || reading?.n1 || '诗篇 119:105',
    verse_text: '你的话是我脚前的灯，是我路上的光。',
    devotion_text: `${readingLine}\n\n个性化灵修服务暂时不可用，但今天的操练仍然清楚：先来到神的话语前，不急着追求新的内容，而是把已经领受的真理认真听进去。读经时留意一个词、一句命令、一个应许，并问：今天我可以怎样具体顺服？`,
    prayer_text: '主啊，求你借着今天的经文光照我的心，使我不只是读过，而是真实回应。帮助我在普通的一天里记得你、信靠你、顺服你。阿们。',
    stage: 'stable',
    stage_icon: '📖',
    stage_label: '本地读经',
    stage_action: refs ? `先读完：${refs}` : '先读一段经文，并写下一步顺服。',
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────
const bg = 'linear-gradient(160deg,#0d1117 0%,#0a1628 60%,#060d1f 100%)'

const S = {
  page: { minHeight: '100%', background: bg, color: '#fff', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' },
  section: { margin: '10px 12px 0', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' },
  sectionHeader: (color) => ({ padding: '10px 14px', background: color || 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', rowGap: 6 }),
  sectionBody: { padding: '14px 16px' },
  label: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 },
  verse: { background: 'rgba(255,215,0,0.07)', borderLeft: '3px solid rgba(255,215,0,0.45)', borderRadius: '0 8px 8px 0', padding: '10px 12px', fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.92)', fontStyle: 'italic' },
  body: { fontSize: 13, lineHeight: 1.75, color: 'rgba(255,255,255,0.82)', whiteSpace: 'pre-wrap' },
  prayer: { fontSize: 13, lineHeight: 1.8, color: 'rgba(255,200,100,0.85)', fontStyle: 'italic', background: 'rgba(255,159,10,0.07)', borderRadius: 10, padding: '10px 12px' },
  stageTag: (key) => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    background: key === 'blind_spot' ? 'rgba(248,113,113,0.18)' : key === 'growing' ? 'rgba(251,191,36,0.18)' : 'rgba(74,222,128,0.18)',
    color: key === 'blind_spot' ? '#f87171' : key === 'growing' ? '#fbbf24' : '#4ade80',
    border: `1px solid ${key === 'blind_spot' ? 'rgba(248,113,113,0.3)' : key === 'growing' ? 'rgba(251,191,36,0.3)' : 'rgba(74,222,128,0.3)'}`,
  }),
  mcChapter: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(90,200,250,0.1)', border: '1px solid rgba(90,200,250,0.2)', borderRadius: 20, fontSize: 13, color: '#5ac8fa', margin: '4px 4px 4px 0', flexShrink: 0 },
  // Accordion item
  accItem: { borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 8, overflow: 'hidden' },
  accHeader: (open) => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
    cursor: 'pointer', userSelect: 'none',
    background: open ? 'rgba(90,200,250,0.08)' : 'rgba(255,255,255,0.03)',
    borderBottom: open ? '1px solid rgba(90,200,250,0.12)' : 'none',
    transition: 'background 0.2s',
  }),
  accBody: { padding: '10px 12px 12px' },
  accChevron: (open) => ({
    fontSize: 11, color: 'rgba(255,255,255,0.35)',
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.2s', flexShrink: 0,
  }),
}

// ── Personal devotion card ────────────────────────────────────────────────────
function PersonalCard({ user, token }) {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(false)
  const [fallbackReason, setFallbackReason] = useState('')
  const reading = useMcCheyne()

  const cacheKey = `personal_devot_${new Date().toISOString().slice(0, 10)}_${user?.email || ''}`

  useEffect(() => {
    if (!user) return
    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) { setData(JSON.parse(cached)); return }
    } catch { /**/ }
    setLoading(true)
    fetch(`${API}/daily-devotion-personal`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : Promise.reject(new Error(String(r.status))))
      .then(d => { setFallbackReason(''); setData(d); try { localStorage.setItem(cacheKey, JSON.stringify(d)) } catch { /**/ } })
      .catch((err) => {
        setFallbackReason(err?.message === '401'
          ? '登录状态已过期，已切换为本地读经灵修。'
          : '个性化灵修服务暂时不可用，已切换为本地读经灵修。')
        setData(buildFallbackDevotion(reading))
      })
      .finally(() => setLoading(false))
  }, [user?.email, token, reading])

  if (!user) return (
    <div style={{ ...S.section, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px', textAlign: 'center', gap: 8 }}>
      <div style={{ fontSize: 32 }}>🌟</div>
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)' }}>{i18nT('登录后查看个性化灵修')}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{i18nT('根据你的灵命状态每天生成专属灵修内容')}</div>
    </div>
  )

  if (loading) return (
    <div style={S.section}>
      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
        <div style={{ fontSize: 28, marginBottom: 10 }}>✨</div>{i18nT('正在为你生成今日灵修…')}
      </div>
    </div>
  )

  if (!data) return (
    <div style={S.section}>
      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
        {i18nT('暂无个性化灵修内容')}
      </div>
    </div>
  )

  const ttsText = [`今日聚焦：${data.theme}`, `${data.verse_ref}——${data.verse_text}`, data.devotion_text, `今日祷告：${data.prayer_text}`].join('\n\n')

  return (
    <div style={S.section}>
      <div style={S.sectionHeader('rgba(90,200,250,0.07)')}>
        <span style={{ fontSize: 18 }}>🌟</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>{i18nT('今日个性化灵修')}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{i18nT('聚焦 ·')} {data.theme}</div>
        </div>
        <span style={S.stageTag(data.stage)}>{data.stage_icon} {data.stage_label}</span>
        <TTSFullBar buildText={() => ttsText} label={i18nT('朗读')} />
      </div>

      <div style={S.sectionBody}>
        {fallbackReason && (
          <div style={{ marginBottom: 12, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,193,7,0.08)', border: '1px solid rgba(255,193,7,0.18)', color: 'rgba(255,226,150,0.78)', fontSize: 12, lineHeight: 1.5 }}>
            {fallbackReason}
          </div>
        )}
        {/* Verse */}
        <div style={S.label}>
          <span>{i18nT('✨ 今日经文')}</span>
          <TTSButton text={`${data.verse_ref}——${data.verse_text}`} />
        </div>
        <div style={{ marginBottom: 4, fontSize: 11, color: 'rgba(90,200,250,0.7)', fontWeight: 600 }}>{data.verse_ref}</div>
        <div style={S.verse}>「{data.verse_text}」</div>
        {/* 完整章节 — 手风琴，默认折叠 */}
        {!data.localFallback && <ScriptureVerses scriptureRef={data.verse_ref} initialOpen={false} />}

        {/* Devotion text */}
        <div style={{ ...S.label, marginTop: 16 }}>
          <span>{i18nT('📖 灵修默想')}</span>
          <TTSButton text={data.devotion_text} />
        </div>
        <div style={S.body}>{data.devotion_text}</div>

        {/* Prayer */}
        <div style={{ ...S.label, marginTop: 16 }}>
          <span>{i18nT('🙏 今日祷告')}</span>
          <TTSButton text={data.prayer_text} />
        </div>
        <div style={S.prayer}>{data.prayer_text}</div>

        {/* Stage action */}
        <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
          💡 <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{i18nT('今日可行一步')}</strong> — {data.stage_action}
        </div>
      </div>
    </div>
  )
}

// ── McCheyne reading plan card ────────────────────────────────────────────────
function McCheyneCard() {
  const reading = useMcCheyne()
  const [openSet, setOpenSet] = useState(new Set())   // track which chapters are expanded

  const today  = new Date()
  const dayStr = `${today.getMonth() + 1}月${today.getDate()}日`

  const chapters = reading ? [
    { label: '家庭晨读', icon: '🌅', ref: reading.f1 },
    { label: '家庭晚读', icon: '🌙', ref: reading.f2 },
    { label: '个人新约', icon: '✝️',  ref: reading.n1 },
    { label: '个人诗篇', icon: '🎵', ref: reading.ps },
  ] : []

  const ttsFull = reading
    ? `今日麦琴读经计划，${dayStr}。家庭晨读：${reading.f1}。家庭晚读：${reading.f2}。个人新约：${reading.n1}。个人诗篇：${reading.ps}。`
    : ''

  function toggle(idx) {
    setOpenSet(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  return (
    <div style={S.section}>
      {/* Card header */}
      <div style={S.sectionHeader('rgba(52,199,89,0.06)')}>
        <span style={{ fontSize: 18 }}>📖</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.95)' }}>{i18nT('麦琴读经计划')}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{dayStr} {i18nT('· 麦契尼一年读经计划')}</div>
        </div>
        {reading && <TTSFullBar buildText={() => ttsFull} label={i18nT('朗读')} />}
      </div>

      <div style={S.sectionBody}>
        {reading === undefined ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{i18nT('加载中…')}</div>
        ) : reading === null ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{i18nT('今日读经计划暂无数据')}</div>
        ) : (
          <>
            {/* Summary chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {chapters.map(ch => (
                <div key={ch.label} style={S.mcChapter}>
                  <span>{ch.icon}</span>
                  <span style={{ fontWeight: 600 }}>{ch.ref}</span>
                </div>
              ))}
            </div>

            {/* Accordion items — each chapter */}
            {chapters.map((ch, idx) => {
              const isOpen = openSet.has(idx)
              return (
                <div key={ch.label} style={S.accItem}>
                  {/* ── Accordion header ── */}
                  <div style={S.accHeader(isOpen)} onClick={() => toggle(idx)} {...a11yClickProps(() => toggle(idx))}>
                    <span style={{ fontSize: 16 }}>{ch.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{ch.label}</div>
                      <div style={{ fontSize: 12, color: 'rgba(90,200,250,0.7)', marginTop: 1 }}>{ch.ref}</div>
                    </div>
                    {/* TTS for this chapter ref — stop propagation */}
                    <div onClick={e => e.stopPropagation()} {...a11yClickProps(e => e.stopPropagation())}>
                      <TTSButton text={`${ch.label}：${ch.ref}`} />
                    </div>
                    <span style={S.accChevron(isOpen)}>▼</span>
                  </div>

                  {/* ── Accordion body — scripture verses ── */}
                  {isOpen && (
                    <div style={S.accBody}>
                      {/* ScriptureVerses with initialOpen=true since user already expanded */}
                      <ScriptureVerses scriptureRef={ch.ref} initialOpen={true} />
                    </div>
                  )}
                </div>
              )
            })}

            <div style={{ marginTop: 4, padding: '7px 12px', background: 'rgba(52,199,89,0.05)', borderRadius: 8, fontSize: 11, color: 'rgba(52,199,89,0.6)', textAlign: 'center' }}>
              {i18nT('麦契尼一年读经计划 · 每日4章 · 一年读完圣经')}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function PersonalDevotionPage({ user, token }) {
  return (
    <div style={S.page}>
      <PersonalCard user={user} token={token} />
      <McCheyneCard />
    </div>
  )
}
