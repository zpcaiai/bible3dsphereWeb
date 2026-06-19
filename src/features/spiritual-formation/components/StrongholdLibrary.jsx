import { useMemo, useState } from 'react'
import { strongholds, strongholdArchetypes } from '../data/strongholds'
import { T, localizeStronghold, archetypeName } from '../lib/localize'
import StrongholdCard from './StrongholdCard'

// 自高之事本体库 / Stronghold ontology library — 与「罪模式库」并列的浏览视图。
export default function StrongholdLibrary({ variant = 'full' }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeArchetype, setActiveArchetype] = useState('all')
  const isEmbedded = variant === 'embedded'

  const categories = useMemo(() => ([
    { key: 'all', label: T('全部', 'All') },
    ...strongholdArchetypes.map((a) => ({ key: a.code, label: archetypeName(a.code) })),
  ]), [])

  const countFor = (key) =>
    key === 'all' ? strongholds.length : strongholds.filter((s) => s.archetypeCode === key).length

  const filtered = strongholds.filter((raw) => {
    if (activeArchetype !== 'all' && raw.archetypeCode !== activeArchetype) return false
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    const s = localizeStronghold(raw)
    const hay = [
      s.name, s.shortName, s.summary, s.coreLie, s.falseGospel, s.falseIdentity, s.gospelReframe,
      ...(s.rootDesires || []), ...(s.rootFears || []), ...(s.exampleUserPhrases || []),
      ...(raw.detectionKeywords || []),
    ].join(' ').toLowerCase()
    return hay.includes(q)
  })

  return (
    <section className="sf-section sf-library-section" style={{ padding: isEmbedded ? '0 0 20px' : '20px 16px 60px', boxSizing: 'border-box' }}>
      {/* 头部与牧养提示 */}
      <div className="sf-library-intro" style={{ background: 'linear-gradient(135deg, rgba(120,120,255,0.08) 0%, rgba(90,200,250,0.03) 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: isEmbedded ? '16px' : '20px', marginBottom: isEmbedded ? '14px' : '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>🗼</span>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#c7c8ff' }}>{T('自高之事辨识库', 'Stronghold Discernment Library')}</h2>
        </div>
        <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
          {T('「自高之事」是一切自高、抵挡神、拦阻人认识神的思想堡垒（林后10:5）。这里列出现代人常见的拦阻——可在神面前对照省察，而非对内心的最终断定。',
             'Strongholds are lofty arguments that exalt themselves against the knowledge of God (2 Cor 10:5). These are common modern patterns to examine before God, not a final verdict on the heart.')}
        </p>
        <div style={{ background: 'rgba(120,120,255,0.06)', borderLeft: '4px solid #8c8cff', padding: '10px 14px', borderRadius: '4px 8px 8px 4px', fontSize: '11.5px', color: '#c7c8ff', lineHeight: '1.5' }}>
          <b>💡 {T('恩典省察提示', 'Grace-shaped reflection')}：</b>
          {T('辨识自高之事的终点不是自我定罪或羞耻，而是让基督的真理拆毁谎言，把你重新带回恩典里。',
             'The goal is not self-condemnation but to let Christ’s truth pull down the lie and return you to grace.')}
        </div>
      </div>

      {/* 搜索 */}
      <div className="sf-library-controls" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: isEmbedded ? '14px' : '20px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'rgba(255,255,255,0.4)' }}>🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={T('搜索名称、核心谎言、欲望、恐惧或说法…', 'Search name, core lie, desire, fear, or phrase…')}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 36px 10px 38px', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '14px', padding: 0 }}>✕</button>
          )}
        </div>

        {/* 原型过滤器 */}
        <div className="sf-library-category-row" style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
          {categories.map((cat) => {
            const isActive = activeArchetype === cat.key
            return (
              <button
                key={cat.key}
                onClick={() => setActiveArchetype(cat.key)}
                style={{ whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: '20px', border: '1px solid ' + (isActive ? 'rgba(140,140,255,0.45)' : 'rgba(255,255,255,0.08)'), background: isActive ? 'rgba(120,120,255,0.15)' : 'rgba(255,255,255,0.04)', color: isActive ? '#c7c8ff' : 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: isActive ? 700 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', outline: 'none' }}
              >
                <span>{cat.label}</span>
                <span style={{ fontSize: '10px', background: isActive ? 'rgba(120,120,255,0.2)' : 'rgba(255,255,255,0.08)', color: isActive ? '#c7c8ff' : 'rgba(255,255,255,0.4)', padding: '1px 5px', borderRadius: '8px', fontWeight: 600 }}>{countFor(cat.key)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 卡片网格 */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌾</div>
          <div style={{ fontSize: '13px' }}>{T('没有找到符合条件的模式，换个词试试？', 'No matching patterns — try another word?')}</div>
        </div>
      ) : (
        <div className="sf-pattern-grid sf-pattern-library-grid">
          {filtered.map((s) => <StrongholdCard key={s.code} stronghold={s} />)}
        </div>
      )}
    </section>
  )
}
