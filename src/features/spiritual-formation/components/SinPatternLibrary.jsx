import { t as i18nT } from '../../../i18n/runtime'
import { useState } from 'react'
import { sinPatterns } from '../data/sinPatterns'
import { T, localizePattern } from '../lib/localize'
import SinPatternCard from './SinPatternCard'

const CATEGORY_MAP = {
  desire: ['idolatry', 'greed_consumerism', 'sexual_disorder', 'entertainment_escapism'],
  self: ['self_centeredness', 'pride', 'babel_pride', 'religious_hypocrisy'],
  relation: ['coldness_lack_of_love', 'hatred_division', 'injustice_oppression', 'lies_falsehood'],
  spiritual: ['spiritual_numbness'],
}

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'desire', label: '欲望与偶像' },
  { key: 'self', label: '自我与骄傲' },
  { key: 'relation', label: '关系与冷漠' },
  { key: 'spiritual', label: '属灵生命' },
]

export default function SinPatternLibrary({ variant = 'full' }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const isEmbedded = variant === 'embedded'

  // Filter patterns based on search and category
  const filteredPatterns = sinPatterns.filter(rawPattern => {
    const pattern = localizePattern(rawPattern)
    
    // Category filter
    if (activeCategory !== 'all') {
      const allowedIds = CATEGORY_MAP[activeCategory] || []
      if (!allowedIds.includes(pattern.id)) return false
    }

    // Search query filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim()
      const nameMatch = pattern.name?.toLowerCase().includes(query) || pattern.shortName?.toLowerCase().includes(query)
      const descMatch = pattern.description?.toLowerCase().includes(query) || pattern.biblicalDiagnosis?.toLowerCase().includes(query)
      const lieMatch = pattern.coreLie?.toLowerCase().includes(query) || pattern.gospelTruth?.toLowerCase().includes(query)
      
      const symptomsMatch = pattern.commonSymptoms?.some(s => s.toLowerCase().includes(query))
      const idolsMatch = pattern.deepIdols?.some(i => i.toLowerCase().includes(query))
      const scripturesMatch = pattern.scriptures?.some(s => s.reference?.toLowerCase().includes(query))

      return nameMatch || descMatch || lieMatch || symptomsMatch || idolsMatch || scripturesMatch
    }

    return true
  })

  // Helper to count items in each category
  const getCategoryCount = (catKey) => {
    if (catKey === 'all') return sinPatterns.length
    const ids = CATEGORY_MAP[catKey] || []
    return sinPatterns.filter(p => ids.includes(p.id)).length
  }

  return (
    <section
      className={`sf-section sf-library-section${isEmbedded ? ' is-embedded' : ''}`}
      style={{ 
        padding: isEmbedded ? '0 0 20px' : '20px 16px 60px',
        boxSizing: 'border-box'
      }}
    >
      
      {/* ── 头部卡片与牧养提示 ── */}
      <div className="sf-library-intro" style={{
        background: 'linear-gradient(135deg, rgba(255,149,0,0.08) 0%, rgba(90,200,250,0.03) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: isEmbedded ? '16px' : '20px',
        marginBottom: isEmbedded ? '14px' : '20px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>🕯️</span>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#ffd699' }}>
            {T('罪的模式资料库', 'Sin Pattern Library')}
          </h2>
        </div>
        <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
          {T('可在神面前省察的可能模式，而非对内心的最终断定。在此对照、诚实承认，并选择穿上基督的新造。', 'Possible patterns to examine before God, not a final diagnosis of the heart.')}
        </p>
        <div style={{
          background: 'rgba(255,149,0,0.06)',
          borderLeft: '4px solid #ff9500',
          padding: '10px 14px',
          borderRadius: '4px 8px 8px 4px',
          fontSize: '11.5px',
          color: '#ffd699',
          lineHeight: '1.5'
        }}>
          <b>{i18nT('💡 恩典省察提示：')}</b>
          {i18nT('认罪的终点绝非自我定罪或陷入羞耻，而是将隐藏的幽暗带入神的光中，重新投入救主随时的恩典与饶恕之中。')}
        </div>
      </div>

      {/* ── 搜索与过滤栏 ── */}
      <div className="sf-library-controls" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: isEmbedded ? '14px' : '20px'
      }}>
        {/* 搜索框 */}
        <div style={{ position: 'relative', width: '100%' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', color: 'rgba(255,255,255,0.4)' }}>
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={i18nT('搜索名称、核心谎言、症状或经文...')}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '10px 36px 10px 38px',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
              transition: 'all 0.2s',
              boxSizing: 'border-box',
            }}
           aria-label={i18nT('搜索名称、核心谎言、症状或经文...')}/>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                fontSize: '14px',
                padding: 0
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* 分类过滤器 */}
        <div className="sf-library-category-row" style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}>
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.key
            const count = getCategoryCount(cat.key)
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid ' + (isActive ? 'rgba(255,149,0,0.4)' : 'rgba(255,255,255,0.08)'),
                  background: isActive ? 'rgba(255,149,0,0.15)' : 'rgba(255,255,255,0.04)',
                  color: isActive ? '#ff9500' : 'rgba(255,255,255,0.6)',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 400,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s',
                  outline: 'none',
                }}
              >
                <span>{cat.label}</span>
                <span style={{
                  fontSize: '10px',
                  background: isActive ? 'rgba(255,149,0,0.2)' : 'rgba(255,255,255,0.08)',
                  color: isActive ? '#ffd699' : 'rgba(255,255,255,0.4)',
                  padding: '1px 5px',
                  borderRadius: '8px',
                  fontWeight: 600,
                }}>{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 模式卡片网格 ── */}
      {filteredPatterns.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'rgba(255,255,255,0.3)',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '16px',
          border: '1px dashed rgba(255,255,255,0.08)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌾</div>
          <div style={{ fontSize: '13px' }}>{i18nT('没有找到符合条件的罪之模式，换个词试试？')}</div>
        </div>
      ) : (
        <div className="sf-pattern-grid sf-pattern-library-grid">
          {filteredPatterns.map((pattern) => (
            <SinPatternCard key={pattern.id} pattern={pattern} />
          ))}
        </div>
      )}
    </section>
  )
}
