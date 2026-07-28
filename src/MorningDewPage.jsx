import { t as i18nT } from './i18n/runtime'
/**
 * MorningDewPage — 清晨甘露 / Morning Dew（司布真式每日默想，5/10/15 分钟）
 * 灵修 tab 子页。
 *
 * 音频层（可选、加法）：清晨往往还不想睁眼看屏幕，所以这里额外提供一段
 * 约 60 秒的「经文 + 一句话」音频——念一句、安静一会儿、再念一句。
 * 关掉声音，这一页与从前完全一样。
 */
import { useEffect, useState } from 'react'
import { fetchDewToday } from './api'
import { getToken } from './auth'
import { useGuidedAudio } from './lib/media/useGuidedAudio'
import { useMediaPrefs } from './lib/media/useMediaPrefs'
import { GuidedAudioBar, MediaToggleRow, CountdownRing } from './lib/media/MediaControls'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18, marginBottom: 12 }
const TIERS = [[5, '5 分钟'], [10, '10 分钟'], [15, '15 分钟']]

// 60 秒版只取「一节经文 + 一句话」：清晨记得住的从来不是三段默想，而是一句话。
const DEW_VERSE_PAUSE = 12
const DEW_LINE_PAUSE = 20

/** 取正文的第一句作为「那一句话」——不整段念，60 秒装不下，也不该装。 */
function firstSentence(str) {
  const s = String(str || '').trim()
  if (!s) return ''
  // 不用后行断言（旧版 iOS Safari 会在解析期直接报错，整个模块就挂了）
  const i = s.search(/[。！？!?]/)
  return i >= 0 ? s.slice(0, i + 1) : s.slice(0, 90)
}

export default function MorningDewPage() {
  const [tier, setTier] = useState(10)
  const [dew, setDew] = useState(null)
  const [loading, setLoading] = useState(true)
  const { prefs } = useMediaPrefs()
  const guided = useGuidedAudio()

  useEffect(() => { load(tier) }, [tier])
  async function load(t) { setLoading(true); try { setDew(await fetchDewToday(t, getToken())) } catch (e) { setDew(null) } finally { setLoading(false) } }

  // 换时长档或离开页面都停声（依赖用稳定的 guided.stop，避免播报中被自己的 setState 掐掉）
  useEffect(() => () => guided.stop(), [tier, guided.stop])

  function startDewAudio() {
    if (!dew) return
    const verse = dew.scripture?.text
      ? `${dew.scripture.text}${dew.scripture.ref ? '。' + dew.scripture.ref : ''}`
      : ''
    const line = dew.reflection || firstSentence(dew.meditation) || dew.action || ''
    const steps = []
    if (verse) steps.push({ text: verse, pauseAfter: DEW_VERSE_PAUSE, label: i18nT('经文') })
    if (line) steps.push({ text: line, pauseAfter: DEW_LINE_PAUSE, label: i18nT('一句话') })
    steps.push({ text: i18nT('愿这滴甘露润泽你一整天。'), pauseAfter: 0 })
    // rate 0.85：清晨的语速要慢，快了像播报新闻
    guided.start(steps, { rate: 0.85 })
  }

  const pauseLen = guided.currentStep?.pauseAfter || 0
  const ringProgress = pauseLen > 0 && guided.state === 'waiting' ? (pauseLen - guided.remaining) / pauseLen : 0

  return (
    <div style={{ padding: '14px 16px 90px', maxWidth: 660, margin: '0 auto', color: '#fff' }}>
      <div style={{ ...card, background: 'linear-gradient(135deg, rgba(255,212,59,0.10), rgba(90,200,250,0.06))', textAlign: 'center', padding: '20px 16px' }}>
        <div style={{ fontSize: 26, marginBottom: 6 }}>🌅</div>
        <div style={{ fontSize: 17, fontWeight: 700 }}>{i18nT('清晨甘露')}</div>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>{i18nT('司布真式默想 · 每早晨都是新的')}</div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {TIERS.map(([v, l]) => (
          <button key={v} onClick={() => setTier(v)} style={{ flex: 1, padding: 9, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: tier === v ? 'rgba(255,212,59,0.20)' : 'rgba(255,255,255,0.05)', color: tier === v ? '#ffd43b' : 'rgba(255,255,255,0.5)' }}>{l}</button>
        ))}
      </div>

      {/* 音频层：默认不响，用户自己开、自己点播放 */}
      {dew && (
        <>
          <MediaToggleRow show={['sound']} compact />
          {prefs.sound ? (
            <GuidedAudioBar
              guided={guided}
              onStart={startDewAudio}
              label="60 秒晨间音频"
              hint={i18nT('一节经文 + 一句话，可以闭着眼睛听')}
            />
          ) : (
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.38)', marginBottom: 12, lineHeight: 1.6 }}>
              {i18nT('打开上面的「声音」，可以听 60 秒的晨间音频版。')}
            </div>
          )}
          {guided.state === 'waiting' && (
            <div style={{ display: 'grid', placeItems: 'center', margin: '2px 0 14px' }}>
              <CountdownRing progress={ringProgress} size={80} color="#ffd43b" label={`${i18nT('安静还剩')} ${guided.remaining} ${i18nT('秒')}`}>
                {guided.remaining}s
              </CountdownRing>
            </div>
          )}
          {guided.running && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginBottom: 12, textAlign: 'center' }}>
              {i18nT('声音只在这个页面开着时播放，切走或锁屏可能会停。')}
            </div>
          )}
        </>
      )}

      {loading ? <div style={{ ...card, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>{i18nT('正在汲取今晨的甘露…')}</div>
        : !dew ? <div style={{ ...card, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>{i18nT('加载失败，请稍后重试')}</div>
        : (
          <>
            {dew.scripture?.text && (
              <div style={{ ...card, background: 'rgba(255,212,59,0.06)', borderColor: 'rgba(255,212,59,0.2)' }}>
                <div style={{ fontSize: 15, lineHeight: 1.9, color: 'rgba(255,255,255,0.92)', fontStyle: 'italic' }}>「{dew.scripture.text}」</div>
                <div style={{ fontSize: 12.5, color: '#ffd43b', marginTop: 8, textAlign: 'right' }}>—— {dew.scripture.ref}</div>
              </div>
            )}
            <Sec title={i18nT('默想')}>{dew.meditation}</Sec>
            {dew.christ && <Sec title={i18nT('基督连结')} color="#a78bfa">{dew.christ}</Sec>}
            {dew.reflection && <Sec title={i18nT('反思')} color="#5ac8fa"><span style={{ fontStyle: 'italic' }}>{dew.reflection}</span></Sec>}
            {dew.prayer && <Sec title={i18nT('祷告')}>{dew.prayer}</Sec>}
            {dew.action && <Sec title={i18nT('今日信心行动')} color="#34c759">{dew.action}</Sec>}
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 8, lineHeight: 1.6 }}>
              {i18nT('愿这滴甘露润泽你一整天。默想不为知识，乃为与主相会。')}
            </div>
          </>
        )}
    </div>
  )
}

function Sec({ title, children, color }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 11, color: color || '#ffd43b', fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.95 }}>{children}</div>
    </div>
  )
}
