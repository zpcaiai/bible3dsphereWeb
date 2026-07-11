// 经文搜索 — 语义检索（"找那节讲压伤的芦苇的经文"）+ 关键词回退。
// 结果可：复制 / 生成分享卡 / 存入背经卡 / 跳相关地图。
import { useEffect, useRef, useState } from 'react'
import BackButton from './BackButton'
import { API_BASE, normalizeBibleText } from './api'
import { t, getRuntimeLang } from './i18n/runtime'
import ShareCardModal from './components/ShareCardModal'
import { addMemoryCard } from './lib/memoryDeck'
import { mapsForBook, openMapEntry } from './data/bibleMapLinks'
import VirtualList from './components/VirtualList'

const toast = (m, ty = 'info') => window.showToast?.(m, ty)

const EXAMPLES = ['压伤的芦苇', '不要为明天忧虑', '我的恩典够你用', '安静等候神', 'love your enemies']

export default function BibleSearchPage({ onBack, onOpenMap }) {
  const [q, setQ] = useState('')
  const [lang, setLang] = useState(getRuntimeLang() === 'en' ? 'esv' : 'cuv')
  const [results, setResults] = useState(null)   // null=未搜索 []=无结果
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [shareVerse, setShareVerse] = useState(null)
  const seqRef = useRef(0)

  async function doSearch(text) {
    const query = (text ?? q).trim()
    if (!query) return
    setLoading(true)
    const seq = ++seqRef.current
    try {
      const res = await fetch(`${API_BASE}/bible/search?q=${encodeURIComponent(query)}&lang=${lang}&top=20`)
      const json = await res.json()
      if (seq !== seqRef.current) return
      if (json.success) { setResults(json.data || []); setSource(json.source || '') }
      else { setResults([]); toast(json.error || t('搜索失败'), 'error') }
    } catch (e) {
      if (seq === seqRef.current) { setResults([]); toast(t('网络错误，请稍后再试'), 'error') }
    } finally {
      if (seq === seqRef.current) setLoading(false)
    }
  }

  useEffect(() => () => { seqRef.current++ }, [])

  const refOf = (v) => getRuntimeLang() === 'en'
    ? `${v.bookEn} ${v.chapter}:${v.verse}`
    : `${v.bookZh} ${v.chapter}:${v.verse}`
  const textOf = (v) => (lang === 'esv' || getRuntimeLang() === 'en') ? v.textEsv : normalizeBibleText(v.textCuv)

  function copyVerse(v) {
    navigator.clipboard?.writeText(`${textOf(v)}（${refOf(v)}）`)
      .then(() => toast(t('已复制经文'), 'success')).catch(() => {})
  }
  function saveCard(v) {
    const added = addMemoryCard({ ref: refOf(v), textCuv: normalizeBibleText(v.textCuv), textEsv: v.textEsv, pkId: v.pkId })
    toast(added ? t('已存入背经卡 🃏') : t('这节已在背经卡中'), added ? 'success' : 'info')
  }

  return (
    <div style={S.page}>
      <header style={S.header}>
        <BackButton onClick={onBack} />
        <span style={S.title}>{t('🔍 经文搜索')}</span>
        <button
          style={{ width: 56, background: 'none', border: 'none', color: '#e8b04b', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
          onClick={() => onOpenMap && onOpenMap('memory-deck')}
        >
          {t('🃏 背经')}
        </button>
      </header>

      <div style={S.body}>
        <div style={S.searchRow}>
          <input
            style={S.input} value={q} autoFocus
            placeholder={t('凭印象搜：压伤的芦苇 / 不要忧虑 / bruised reed…')}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
           aria-label={t('凭印象搜：压伤的芦苇 / 不要忧虑 / bruised reed…')}/>
          <button style={S.searchBtn} disabled={loading} onClick={() => doSearch()}>
            {loading ? t('搜索中…') : t('搜索')}
          </button>
        </div>
        <div style={S.langRow}>
          {[['cuv', t('和合本')], ['esv', 'ESV']].map(([id, label]) => (
            <button key={id} onClick={() => setLang(id)}
              style={{ ...S.langChip, ...(lang === id ? S.langChipOn : {}) }}>{label}</button>
          ))}
          {source && results && (
            <span style={S.srcTag}>
              {source === 'semantic' ? t('✨ 语义检索') : t('🔤 关键词检索')} · {results.length} {t('节')}
            </span>
          )}
        </div>

        {results === null && (
          <div style={S.empty}>
            <p style={{ margin: '0 0 10px' }}>{t('记不清出处？用你记得的意思搜——语义检索能听懂"那节讲压伤的芦苇的经文"。')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {EXAMPLES.map((ex) => (
                <button key={ex} style={S.exampleChip} onClick={() => { setQ(ex); doSearch(ex) }}>{ex}</button>
              ))}
            </div>
          </div>
        )}
        {results && results.length === 0 && !loading && (
          <div style={S.empty}>{t('没有找到匹配的经文，换个说法试试。')}</div>
        )}

        {results && <VirtualList items={results} keyOf={(v) => v.pkId} estimatedHeight={185} renderItem={(v) => {
          const maps = mapsForBook(v.bookCode)
          return (
            <div key={v.pkId} style={S.verseCard}>
              <div style={S.verseRef}>
                {refOf(v)}
                {typeof v.score === 'number' && source === 'semantic' && (
                  <span style={S.score}>{Math.round(v.score * 100)}%</span>
                )}
              </div>
              <p style={S.verseText}>{textOf(v)}</p>
              {lang === 'cuv' && getRuntimeLang() !== 'en' && v.textEsv && (
                <p style={S.verseAlt}>{v.textEsv}</p>
              )}
              <div style={S.actions}>
                <button style={S.actBtn} onClick={() => copyVerse(v)}>{t('📋 复制')}</button>
                <button style={S.actBtn} onClick={() => setShareVerse(v)}>{t('🖼 分享卡')}</button>
                <button style={S.actBtn} onClick={() => saveCard(v)}>{t('🃏 背经卡')}</button>
                {onOpenMap && (
                  <button style={{ ...S.actBtn, color: '#7ee2a0' }} onClick={() => {
                    try { sessionStorage.setItem('bible-reading-open', JSON.stringify({ book: v.bookZh, chapter: v.chapter })) } catch (e) { /* ignore */ }
                    onOpenMap('bible-reading')
                  }}>{t('📖 读本章')}</button>
                )}
                {maps.length > 0 && onOpenMap && (
                  <button style={{ ...S.actBtn, color: '#7dd3fc' }} onClick={() => onOpenMap(openMapEntry(maps[0]))}>
                    🗺 {maps[0].label}
                  </button>
                )}
              </div>
            </div>
          )
        }} />}
      </div>

      {shareVerse && (
        <ShareCardModal
          text={textOf(shareVerse)}
          reference={refOf(shareVerse)}
          onClose={() => setShareVerse(null)}
        />
      )}
    </div>
  )
}

const S = {
  page: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#0d1117', color: '#fff', fontFamily: 'inherit' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 },
  title: { fontSize: 16, fontWeight: 700 },
  body: { flex: 1, overflowY: 'auto', padding: 14, boxSizing: 'border-box' },
  searchRow: { display: 'flex', gap: 8 },
  input: { flex: 1, minWidth: 0, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 12, padding: '12px 14px', color: '#fff', fontSize: 15, fontFamily: 'inherit', outline: 'none' },
  searchBtn: { background: '#e8b04b', border: 'none', borderRadius: 12, padding: '12px 18px', color: '#2a1d05', fontWeight: 700, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' },
  langRow: { display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 14px' },
  langChip: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, padding: '4px 12px', color: 'rgba(255,255,255,0.7)', fontSize: 12.5, cursor: 'pointer' },
  langChipOn: { background: 'rgba(232,176,75,0.18)', borderColor: '#e8b04b', color: '#ffe9b3' },
  srcTag: { marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  empty: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 13.5, lineHeight: 1.8, padding: '36px 16px' },
  exampleChip: { background: 'rgba(125,211,252,0.1)', border: '1px solid rgba(125,211,252,0.3)', borderRadius: 999, padding: '5px 13px', color: '#7dd3fc', fontSize: 13, cursor: 'pointer' },
  verseCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '13px 15px', marginBottom: 10 },
  verseRef: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#e8b04b', marginBottom: 6 },
  score: { fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.07)', borderRadius: 6, padding: '1px 6px' },
  verseText: { margin: 0, fontSize: 15, lineHeight: 1.75, color: 'rgba(255,255,255,0.92)' },
  verseAlt: { margin: '6px 0 0', fontSize: 12.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' },
  actions: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  actBtn: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: 9, padding: '5px 11px', color: 'rgba(255,255,255,0.8)', fontSize: 12.5, cursor: 'pointer' },
}
