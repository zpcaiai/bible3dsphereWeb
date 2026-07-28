// MemoryDeckPage — 背经卡复习（间隔重复 SM-2，纯本地离线可用）。
// 流程：看出处 → 心里背 → 翻面对照 → 自评（忘了/吃力/熟练），算法安排下次复习。
//
// 多模态：朗读（听一遍）、「只听不看」（出处用念的，不给看）、复诵评分（说一遍）。
// 这些都是练习辅助——SM-2 的自评流程原封不动，没有麦克风 / 没有网络 / 关掉声音时
// 仍旧是原来的纯文字卡片。
import { useEffect, useMemo, useRef, useState } from 'react'
import BackButton from './BackButton'
import { getDeck, getDueCards, reviewCard, removeMemoryCard, deckStats, syncDeckFromCloud } from './lib/memoryDeck'
import ShareCardModal from './components/ShareCardModal'
import { t, getRuntimeLang } from './i18n/runtime'
import { a11yClickProps } from './lib/a11yClick';
import { TTSButton, speakOnce, stopAllAudio } from './useGlobalAudio'
import { useRecitation } from './lib/media/useRecitation'
import { RECITATION_VERDICT_COPY } from './lib/media/recitationScore'
import { buildRecitationTokens } from './lib/memorizeAids'
import { getMediaPref } from './lib/media/mediaPrefs'

const toast = (m, ty = 'info') => window.showToast?.(m, ty)

export default function MemoryDeckPage({ onBack }) {
  const [tick, setTick] = useState(0)            // 数据变化驱动刷新
  const [flipped, setFlipped] = useState(false)
  const [mode, setMode] = useState('review')     // review | all
  const [shareVerse, setShareVerse] = useState(null)
  const [listenOnly, setListenOnly] = useState(false)  // 只听不看：卡片正面用念的
  const [speaking, setSpeaking] = useState(false)
  const aliveRef = useRef(true)

  // 云同步：登录用户换设备也能拿回卡组
  useEffect(() => { syncDeckFromCloud().then((changed) => { if (changed) setTick((x) => x + 1) }) }, [])

  // 离开页面必须收声，否则卡片会跟着用户跑到别的页面继续念
  useEffect(() => {
    aliveRef.current = true
    return () => { aliveRef.current = false; stopAllAudio() }
  }, [])

  const stats = useMemo(() => deckStats(), [tick])
  const due = useMemo(() => getDueCards(), [tick])
  const all = useMemo(() => getDeck().sort((a, b) => a.due - b.due), [tick])
  const cur = due[0] || null
  const en = getRuntimeLang() === 'en'
  const textOf = (c) => (en && c.textEsv ? c.textEsv : (c.textCuv || c.textEsv))

  async function sayFront(e) {
    e?.stopPropagation?.()
    if (!cur) return
    setSpeaking(true)
    try { await speakOnce(cur.ref) } finally { if (aliveRef.current) setSpeaking(false) }
  }
  function hushFront(e) {
    e?.stopPropagation?.()
    stopAllAudio()
    setSpeaking(false)
  }

  // 只听不看时换卡自动念出处——只在用户主动开了「自动播报」的前提下；
  // 否则一律等他点「听出处」，声音绝不自己冒出来。
  useEffect(() => {
    if (!listenOnly || !cur || flipped) return
    if (!getMediaPref('sound') || !getMediaPref('autoplay')) return
    sayFront()
  }, [listenOnly, cur?.id])   // eslint-disable-line react-hooks/exhaustive-deps

  function grade(q) {
    if (!cur) return
    stopAllAudio()
    setSpeaking(false)
    reviewCard(cur.id, q)
    setFlipped(false)
    setTick((x) => x + 1)
    if (due.length === 1) toast(t('今日复习完成 🎉'), 'success')
  }
  function del(id) {
    removeMemoryCard(id)
    setTick((x) => x + 1)
  }
  const nextDueText = (c) => {
    const d = Math.ceil((c.due - Date.now()) / 86400000)
    return d <= 0 ? t('待复习') : `${d} ${t('天后')}`
  }

  return (
    <div style={S.page}>
      <header style={S.header}>
        <BackButton onClick={onBack} />
        <span style={S.title}>{t('🃏 背经卡')}</span>
        <span style={{ width: 56 }} />
      </header>

      <div style={S.statsBar}>
        <span>{t('卡组')} <b>{stats.total}</b></span>
        <span style={{ color: '#f0ad4e' }}>{t('待复习')} <b>{stats.due}</b></span>
        <span style={{ color: '#34c759' }}>{t('已掌握')} <b>{stats.mature}</b></span>
        <button style={S.modeBtn} onClick={() => setMode(mode === 'review' ? 'all' : 'review')}>
          {mode === 'review' ? t('管理卡组') : t('返回复习')}
        </button>
      </div>

      {mode === 'review' && (
        <div style={S.body}>
          {stats.total === 0 && (
            <div style={S.empty}>
              {t('还没有背经卡。去「🔍 经文搜索」或读经页，把想背的经文一键存进来。')}
            </div>
          )}
          {stats.total > 0 && !cur && (
            <div style={S.empty}>
              ✅ {t('今天的复习都完成了！「我将你的话藏在心里，免得我得罪你。」（诗 119:11）')}
            </div>
          )}
          {cur && (
            <>
              <div style={S.progress}>{t('今日剩余')} {due.length}</div>

              {/* 只听不看：正面不给看出处，用耳朵接住它 */}
              <div style={S.aidRow}>
                <button type="button" aria-pressed={listenOnly}
                  style={{ ...S.aidChip, ...(listenOnly ? S.aidChipOn : null) }}
                  onClick={() => { if (listenOnly) hushFront(); setListenOnly((v) => !v) }}>
                  🎧 {t('只听不看')}
                </button>
                <span style={S.aidHint}>
                  {listenOnly ? t('出处用念的，评级方式不变') : t('用耳朵接出处，不给眼睛看')}
                </span>
              </div>

              <div style={S.card} onClick={() => setFlipped((f) => !f)} {...a11yClickProps(() => setFlipped((f) => !f))}>
                <div style={S.cardRef}>{listenOnly && !flipped ? t('🎧 听着背') : cur.ref}</div>
                {flipped ? (
                  <>
                    <p style={S.cardText}>{textOf(cur)}</p>
                    {/* 朗读：对照的时候顺便听一遍，眼睛耳朵一起记 */}
                    <div style={S.cardTools} onClick={(e) => e.stopPropagation()}>
                      <TTSButton text={`${cur.ref} ${textOf(cur)}`} style={{ fontSize: 16 }} />
                      <span style={S.aidHint}>{t('朗读这节经文')}</span>
                    </div>
                  </>
                ) : listenOnly ? (
                  <div style={S.listenBox} onClick={(e) => e.stopPropagation()}>
                    <button type="button" style={S.listenBtn} onClick={speaking ? hushFront : sayFront}>
                      {speaking ? t('⏹ 停一下') : t('🔊 听这张卡的出处')}
                    </button>
                    <p style={S.cardHint}>{t('听出处，在心里把整节背出来，再点卡片翻面对照')}</p>
                    <button type="button" style={S.plainLink} onClick={() => { hushFront(); setListenOnly(false) }}>
                      {t('👀 还是看文字')}
                    </button>
                  </div>
                ) : (
                  <p style={S.cardHint}>{t('心里背诵这节经文，然后点卡片翻面对照')}</p>
                )}
              </div>

              {flipped && <RecitePanel key={cur.id} text={textOf(cur)} />}

              {!flipped ? (
                <button style={S.flipBtn} onClick={() => setFlipped(true)}>{t('翻面对照 ↺')}</button>
              ) : (
                <div style={S.gradeRow}>
                  <button style={{ ...S.gradeBtn, background: 'rgba(255,107,107,0.2)', borderColor: '#ff6b6b' }}
                    onClick={() => grade(1)}>{t('😵 忘了')}<small style={S.gradeSub}>{t('10分钟后')}</small></button>
                  <button style={{ ...S.gradeBtn, background: 'rgba(240,173,78,0.18)', borderColor: '#f0ad4e' }}
                    onClick={() => grade(3)}>{t('🤔 吃力')}<small style={S.gradeSub}>{t('短间隔')}</small></button>
                  <button style={{ ...S.gradeBtn, background: 'rgba(52,199,89,0.18)', borderColor: '#34c759' }}
                    onClick={() => grade(5)}>{t('😊 熟练')}<small style={S.gradeSub}>{t('长间隔')}</small></button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {mode === 'all' && (
        <div style={S.body}>
          {all.length === 0 && <div style={S.empty}>{t('卡组是空的。')}</div>}
          {all.map((c) => (
            <div key={c.id} style={S.listItem}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.listRef}>{c.ref} <span style={S.listDue}>{nextDueText(c)}</span></div>
                <div style={S.listText}>{textOf(c)}</div>
              </div>
              <TTSButton text={`${c.ref} ${textOf(c)}`} style={{ fontSize: 15 }} />
              <button style={S.iconBtn} title={t('分享卡')} onClick={() => setShareVerse(c)}>🖼</button>
              <button style={{ ...S.iconBtn, color: '#ff8585' }} title={t('删除')} onClick={() => del(c.id)}>🗑</button>
            </div>
          ))}
        </div>
      )}

      {shareVerse && (
        <ShareCardModal text={textOf(shareVerse)} reference={shareVerse.ref} onClose={() => setShareVerse(null)} />
      )}
    </div>
  )
}

// ── 复诵评分 ──────────────────────────────────────────────────────────────
// 麦克风只在用户点按时才打开，失败原因照实说。
// 分数是「听见自己记到哪里」的镜子：不参与 SM-2 评级，也不拦住任何一步。
function RecitePanel({ text }) {
  const rec = useRecitation()
  const tokens = useMemo(() => buildRecitationTokens(rec.result), [rec.result])
  if (!text) return null

  return (
    <div style={S.recite}>
      <div style={S.aidRow}>
        {rec.recording ? (
          <button type="button" onClick={rec.stop} style={{ ...S.aidChip, ...S.reciteStop }}>
            ⏹ {t('说完了')} · {rec.seconds}s
          </button>
        ) : (
          <button type="button" onClick={() => rec.start(text)} disabled={rec.phase === 'scoring'}
            style={{ ...S.aidChip, ...S.reciteGo, opacity: rec.phase === 'scoring' ? 0.5 : 1 }}>
            🎙 {rec.result ? t('再复诵一遍') : t('复诵一遍')}
          </button>
        )}
        <span style={S.aidHint}>
          {rec.phase === 'scoring' ? t('正在听…') : t('念给自己听，看看记到哪里了')}
        </span>
      </div>

      {rec.error && (
        <div role="alert" style={S.reciteErr}>
          {rec.error}
          <button type="button" onClick={rec.reset} style={{ ...S.aidChip, marginLeft: 8 }}>{t('好，回到文字')}</button>
        </div>
      )}

      {rec.result && (
        <>
          <div style={S.reciteHead}>
            {t('对上了')} <b style={{ color: '#e8b04b' }}>{rec.result.accuracy}%</b>
            {' · '}{t(RECITATION_VERDICT_COPY[rec.result.verdict] || RECITATION_VERDICT_COPY.again)}
          </div>
          <div style={S.reciteText}>
            {tokens.map((tk) => {
              if (tk.type === 'missing') {
                // 漏掉的字留成空档：让眼睛看见「这里断了」，而不是被红字指责
                return (
                  <span key={tk.key} title={t('这里漏了')}
                    style={{ display: 'inline-block', width: `${Math.max(1, tk.text.length * (tk.spaced ? 0.6 : 1))}em`, borderBottom: '1px dashed rgba(255,255,255,0.28)', color: 'transparent' }}>
                    {tk.text}
                  </span>
                )
              }
              if (tk.type === 'extra') {
                return <sup key={tk.key} title={t('这里多念了')} style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>+{tk.text}{tk.spaced ? ' ' : ''}</sup>
              }
              const wrong = tk.type === 'wrong'
              return (
                <span key={tk.key} title={wrong ? `${t('你念的是')} ${tk.spoken}` : undefined}
                  style={{ color: wrong ? '#ffa94d' : 'rgba(255,255,255,0.94)', borderBottom: wrong ? '1px dotted #ffa94d' : 'none' }}>
                  {tk.text}{tk.spaced ? ' ' : ''}
                </span>
              )
            })}
          </div>
          <div style={S.reciteFoot}>{t('复诵只是练习的镜子，不算成绩，也不影响下次复习的安排。')}</div>
        </>
      )}
    </div>
  )
}

const S = {
  page: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#0d1117', color: '#fff', fontFamily: 'inherit' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 },
  title: { fontSize: 16, fontWeight: 700 },
  statsBar: { display: 'flex', alignItems: 'center', gap: 16, padding: '10px 16px', fontSize: 13, color: 'rgba(255,255,255,0.65)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  modeBtn: { marginLeft: 'auto', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 9, padding: '5px 12px', color: 'rgba(255,255,255,0.8)', fontSize: 12.5, cursor: 'pointer' },
  body: { flex: 1, overflowY: 'auto', padding: 16, boxSizing: 'border-box' },
  empty: { textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.9, padding: '48px 20px' },
  progress: { textAlign: 'center', fontSize: 12.5, color: 'rgba(255,255,255,0.45)', marginBottom: 12 },
  card: { minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'linear-gradient(150deg, rgba(232,176,75,0.12), rgba(122,59,103,0.14))', border: '1px solid rgba(232,176,75,0.35)', borderRadius: 18, padding: '28px 22px', cursor: 'pointer', textAlign: 'center' },
  cardRef: { fontSize: 17, fontWeight: 700, color: '#ffe9b3' },
  cardText: { margin: 0, fontSize: 16.5, lineHeight: 1.9, color: 'rgba(255,255,255,0.94)' },
  cardHint: { margin: 0, fontSize: 13.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 },
  flipBtn: { display: 'block', width: '100%', marginTop: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 13, padding: '13px 0', color: '#fff', fontSize: 15, cursor: 'pointer' },
  gradeRow: { display: 'flex', gap: 10, marginTop: 14 },
  gradeBtn: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, border: '1px solid', borderRadius: 13, padding: '12px 0', color: '#fff', fontSize: 14.5, cursor: 'pointer', fontFamily: 'inherit' },
  gradeSub: { fontSize: 10.5, color: 'rgba(255,255,255,0.5)' },
  listItem: { display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 13, padding: '11px 13px', marginBottom: 9 },
  listRef: { fontSize: 13.5, fontWeight: 700, color: '#e8b04b' },
  listDue: { fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', marginLeft: 8 },
  listText: { fontSize: 12.5, color: 'rgba(255,255,255,0.65)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 3 },
  iconBtn: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 9, padding: '6px 9px', fontSize: 14, cursor: 'pointer', color: '#fff' },
  // ── 多模态辅助 ──
  aidRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 10 },
  aidChip: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 999, fontSize: 12.5, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.72)', fontFamily: 'inherit' },
  aidChipOn: { background: 'rgba(232,176,75,0.18)', borderColor: 'rgba(232,176,75,0.5)', color: '#ffe9b3' },
  aidHint: { fontSize: 11.5, color: 'rgba(255,255,255,0.38)', lineHeight: 1.7 },
  cardTools: { display: 'flex', alignItems: 'center', gap: 6, cursor: 'default' },
  listenBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'default' },
  listenBtn: { background: 'rgba(232,176,75,0.16)', border: '1px solid rgba(232,176,75,0.45)', borderRadius: 13, padding: '11px 20px', color: '#ffe9b3', fontSize: 14.5, cursor: 'pointer', fontFamily: 'inherit' },
  plainLink: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' },
  recite: { marginTop: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 13, padding: '12px 13px' },
  reciteGo: { background: 'rgba(52,199,89,0.14)', borderColor: 'rgba(52,199,89,0.34)', color: '#8be9c0' },
  reciteStop: { background: 'rgba(255,107,107,0.18)', borderColor: 'rgba(255,107,107,0.45)', color: '#ff9f9f' },
  reciteErr: { fontSize: 12.5, color: '#ffd43b', lineHeight: 1.8, marginTop: 4 },
  reciteHead: { fontSize: 12.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 },
  reciteText: { marginTop: 8, fontSize: 15, lineHeight: 2 },
  reciteFoot: { marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.34)', lineHeight: 1.7 },
}
