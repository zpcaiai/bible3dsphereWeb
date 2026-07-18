import { useState } from 'react'
import { t as i18nT } from '../i18n/runtime'
import '../expansion/expansionI18n'
import { DEVOTION_SITUATIONS, DEVOTION_TOPICS, needsSafetyFirst, recommendExpansionTopics } from './devotionTopicRecommendations'

function TopicCard({ topic, onOpen, compact = false }) {
  if (!topic) return null
  return (
    <button type="button" onClick={() => onOpen(topic.key)} style={{
      width: '100%', minHeight: 68, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
      padding: compact ? '11px 12px' : '14px', borderRadius: 14, cursor: 'pointer', color: '#fff',
      background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(90,200,250,0.07))',
      border: '1px solid rgba(167,139,250,0.2)', fontFamily: 'inherit',
    }}>
      <span style={{ fontSize: 24 }} aria-hidden="true">{topic.emoji}</span>
      <span style={{ flex: 1 }}>
        <strong style={{ display: 'block', fontSize: 13.5 }}>{i18nT(topic.name)}</strong>
        <small style={{ display: 'block', marginTop: 3, color: 'rgba(255,255,255,0.5)', lineHeight: 1.45 }}>{i18nT(topic.sub)}</small>
      </span>
      <span aria-hidden="true" style={{ color: '#b9b8ff', fontSize: 19 }}>›</span>
    </button>
  )
}

export default function DevotionTopicsHome({ dailySnapshot, lastFeature, lastFeatureKey, onOpenFeature, onOpenAll, onOpenSafety }) {
  const [selectedSituation, setSelectedSituation] = useState('')
  const recommendations = recommendExpansionTopics(dailySnapshot)
  const lastTopic = lastFeature || (lastFeatureKey ? DEVOTION_TOPICS[lastFeatureKey] : null)
  const situationTopics = selectedSituation
    ? DEVOTION_SITUATIONS.find((situation) => situation.label === selectedSituation)?.keys.map((key) => DEVOTION_TOPICS[key]).filter(Boolean) || []
    : []
  const hasSignal = Boolean(dailySnapshot?.last_emotion || dailySnapshot?.trajectory_label)
  const safetyFirst = needsSafetyFirst(dailySnapshot)

  return (
    <div style={{ minHeight: '100%', padding: '14px 14px 110px', background: 'linear-gradient(160deg,#0d1117,#090d1b 58%,#060914)', color: '#fff' }}>
      {safetyFirst && onOpenSafety && (
        <button type="button" onClick={onOpenSafety} style={{ width: '100%', marginBottom: 12, padding: '14px', borderRadius: 14, textAlign: 'left', border: '1px solid rgba(255,159,64,0.42)', color: '#ffe1c2', background: 'linear-gradient(135deg, rgba(255,159,64,0.16), rgba(255,69,58,0.1))', cursor: 'pointer', fontFamily: 'inherit' }}>
          <strong style={{ display: 'block', fontSize: 13.5, marginBottom: 4 }}>{i18nT('先照顾安全，再继续灵修')}</strong>
          <span style={{ display: 'block', fontSize: 11.5, lineHeight: 1.55, color: 'rgba(255,230,205,0.8)' }}>{i18nT('你已记录的状态包含需要优先确认安全的信号。专题灵修不能替代即时帮助，请先打开安全支持。')}</span>
        </button>
      )}
      <section style={{ padding: 16, borderRadius: 18, background: 'radial-gradient(circle at 15% 10%, rgba(139,92,246,0.2), transparent 42%), rgba(255,255,255,0.035)', border: '1px solid rgba(167,139,250,0.2)', marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: '#aeb2ff', letterSpacing: '0.08em' }}>{i18nT('根据你已记录的状态')}</div>
        <h2 style={{ fontSize: 18, margin: '7px 0 5px' }}>{i18nT('今天可以从这里开始')}</h2>
        <p style={{ margin: '0 0 13px', color: 'rgba(255,255,255,0.56)', fontSize: 12.5, lineHeight: 1.65 }}>
          {hasSignal
            ? i18nT('这些只是基于你可见记录的温柔建议，不是对你属灵生命的评判；你可以自由更换。')
            : i18nT('还没有足够的今日状态记录，先从认识神或爱慕神的话开始，也可以按处境自己选择。')}
        </p>
        <div style={{ display: 'grid', gap: 9 }}>
          {recommendations.map((topic) => <TopicCard key={topic.key} topic={topic} onOpen={onOpenFeature} />)}
        </div>
      </section>

      {lastTopic && (
        <section style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.68)', marginBottom: 8 }}>{i18nT('继续上次专题')}</div>
          <TopicCard topic={lastTopic} onOpen={onOpenFeature} compact />
        </section>
      )}

      <section style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.68)', marginBottom: 8 }}>{i18nT('按当前处境选择')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          {DEVOTION_SITUATIONS.map((situation) => (
            <button
              key={situation.label}
              type="button"
              aria-expanded={selectedSituation === situation.label}
              onClick={() => setSelectedSituation((current) => current === situation.label ? '' : situation.label)}
              style={{ minHeight: 48, padding: '9px 10px', borderRadius: 12, border: selectedSituation === situation.label ? '1px solid rgba(167,139,250,0.42)' : '1px solid rgba(255,255,255,0.1)', background: selectedSituation === situation.label ? 'rgba(139,92,246,0.13)' : 'rgba(255,255,255,0.045)', color: 'rgba(255,255,255,0.82)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {i18nT(situation.label)}
            </button>
          ))}
        </div>
        {situationTopics.length > 0 && (
          <div aria-live="polite" style={{ display: 'grid', gap: 8, marginTop: 10 }}>
            {situationTopics.map((topic) => <TopicCard key={topic.key} topic={topic} onOpen={onOpenFeature} compact />)}
          </div>
        )}
      </section>

      <button type="button" onClick={onOpenAll} style={{ width: '100%', minHeight: 50, borderRadius: 14, border: '1px solid rgba(90,200,250,0.24)', color: '#c8ecff', background: 'rgba(90,200,250,0.08)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        {i18nT('查看全部专题灵修')} ›
      </button>

      {onOpenSafety && (
        <button type="button" onClick={onOpenSafety} style={{ width: '100%', marginTop: 12, padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,159,64,0.2)', color: 'rgba(255,210,165,0.86)', background: 'rgba(255,159,64,0.06)', fontSize: 11.5, lineHeight: 1.5, cursor: 'pointer', fontFamily: 'inherit' }}>
          {i18nT('如果你此刻无法保证自己或他人的安全，请先打开安全帮助')}
        </button>
      )}
    </div>
  )
}
