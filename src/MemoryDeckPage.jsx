// MemoryDeckPage — 背经卡复习（间隔重复 SM-2，纯本地离线可用）。
// 流程：看出处 → 心里背 → 翻面对照 → 自评（忘了/吃力/熟练），算法安排下次复习。
import { useEffect, useMemo, useState } from 'react'
import BackButton from './BackButton'
import { getDeck, getDueCards, reviewCard, removeMemoryCard, deckStats, syncDeckFromCloud } from './lib/memoryDeck'
import ShareCardModal from './components/ShareCardModal'
import { t, getRuntimeLang } from './i18n/runtime'
import { a11yClickProps } from './lib/a11yClick';

const toast = (m, ty = 'info') => window.showToast?.(m, ty)

export default function MemoryDeckPage({ onBack }) {
  const [tick, setTick] = useState(0)            // 数据变化驱动刷新
  const [flipped, setFlipped] = useState(false)
  const [mode, setMode] = useState('review')     // review | all
  const [shareVerse, setShareVerse] = useState(null)

  // 云同步：登录用户换设备也能拿回卡组
  useEffect(() => { syncDeckFromCloud().then((changed) => { if (changed) setTick((x) => x + 1) }) }, [])

  const stats = useMemo(() => deckStats(), [tick])
  const due = useMemo(() => getDueCards(), [tick])
  const all = useMemo(() => getDeck().sort((a, b) => a.due - b.due), [tick])
  const cur = due[0] || null
  const en = getRuntimeLang() === 'en'
  const textOf = (c) => (en && c.textEsv ? c.textEsv : (c.textCuv || c.textEsv))

  function grade(q) {
    if (!cur) return
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
              <div style={S.card} onClick={() => setFlipped((f) => !f)} {...a11yClickProps(() => setFlipped((f) => !f))}>
                <div style={S.cardRef}>{cur.ref}</div>
                {flipped ? (
                  <p style={S.cardText}>{textOf(cur)}</p>
                ) : (
                  <p style={S.cardHint}>{t('心里背诵这节经文，然后点卡片翻面对照')}</p>
                )}
              </div>
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
}
