import { useState } from 'react'
import { T } from '../lib/localize'
import RepentancePathView from './RepentancePathView'

// 福音回应面板 / Gospel-response panel — 渲染 buildGospelResponse 的结果。
export default function GospelResponsePanel({ plan }) {
  const [showPath, setShowPath] = useState(false)
  if (!plan) return null

  const Section = ({ icon, title, accent, children }) => (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px', marginBottom: '12px' }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 800, color: accent, display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>{icon}</span>{title}
      </h3>
      {children}
    </div>
  )

  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 2px 12px' }}>
        <span style={{ fontSize: '18px' }}>🌿</span>
        <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#a3e2ab' }}>{T('福音回应', 'Gospel Response')}</h2>
      </div>

      {/* 1. 假福音 → 福音更正 */}
      <Section icon="🎭" title={T('假福音 → 福音更正', 'False gospel → Gospel correction')} accent="#ffcf8b">
        <div style={{ background: 'rgba(255,69,58,0.05)', border: '1px solid rgba(255,69,58,0.16)', borderRadius: '10px', padding: '10px 12px', marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#ff8a84', marginBottom: '4px' }}>
            {plan.falseGospel.label} · {T('它的假应许', 'its false promise')}
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#ffb3b0', lineHeight: '1.6' }}>{plan.falseGospel.falsePromise}</p>
        </div>
        <div style={{ background: 'rgba(48,209,88,0.05)', border: '1px solid rgba(48,209,88,0.16)', borderRadius: '10px', padding: '10px 12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#5fd98a', marginBottom: '4px' }}>{T('福音更正', 'Gospel correction')}</div>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#a3e2ab', lineHeight: '1.6' }}>{plan.falseGospel.gospelCorrection}</p>
        </div>
      </Section>

      {/* 2. 被遮蔽真理 */}
      <Section icon="📖" title={T('此刻较难领受的真理', 'The truth hardest to receive right now')} accent="#aee8ff">
        <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#fff', fontWeight: 700 }}>
          {plan.blockedDoctrine.name}
          <span style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}> · {plan.blockedDoctrine.teachingTheme}</span>
        </p>
        <p style={{ margin: '0 0 10px 0', fontSize: '12.5px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.65' }}>{plan.blockedDoctrine.healingTruth}</p>
        {plan.blockedDoctrine.reflectionQuestion && (
          <div style={{ background: 'rgba(90,200,250,0.05)', borderLeft: '3px solid #5ac8fa', borderRadius: '4px 8px 8px 4px', padding: '8px 12px', fontSize: '12.5px', color: '#aee8ff', lineHeight: '1.6' }}>
            💭 {plan.blockedDoctrine.reflectionQuestion}
          </div>
        )}
        {plan.blockedDoctrine.alsoBlocked?.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{T('也被遮蔽：', 'Also blocked: ')}</span>
            {plan.blockedDoctrine.alsoBlocked.map((d) => (
              <span key={d.code} style={{ fontSize: '11px', color: '#aee8ff', background: 'rgba(90,200,250,0.06)', border: '1px solid rgba(90,200,250,0.18)', padding: '2px 8px', borderRadius: '999px' }}>{d.name}</span>
            ))}
          </div>
        )}
      </Section>

      {/* 经文主题 */}
      {plan.scriptureThemes?.length > 0 && (
        <Section icon="📚" title={T('经文主题', 'Scripture themes')} accent="#5ac8fa">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {plan.scriptureThemes.map((t) => (
              <div key={t.code} style={{ background: 'rgba(90,200,250,0.04)', border: '1px solid rgba(90,200,250,0.14)', borderRadius: '10px', padding: '10px 12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#aee8ff', marginBottom: '3px' }}>{t.name}</div>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.55' }}>{t.reason}</p>
                {t.practiceSuggestion && <p style={{ margin: 0, fontSize: '11.5px', color: '#ffd699', lineHeight: '1.5' }}>🌱 {t.practiceSuggestion}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 3. 经文阅读计划 */}
      {plan.scripturePlan.days.length > 0 && (
        <Section icon="🗓️" title={plan.scripturePlan.title} accent="#5ac8fa">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {plan.scripturePlan.days.map((d) => (
              <div key={d.reference} style={{ background: 'rgba(90,200,250,0.03)', border: '1px solid rgba(90,200,250,0.12)', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#5ac8fa', background: 'rgba(90,200,250,0.12)', borderRadius: '999px', padding: '2px 8px' }}>{T('第', 'Day ')}{d.day}{T(' 天', '')}</span>
                  <strong style={{ color: '#5ac8fa', fontSize: '12.5px' }}>{d.reference}</strong>
                </div>
                <p style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: 'rgba(255,255,255,0.78)', fontStyle: 'italic', lineHeight: '1.55' }}>“{d.text}”</p>
                <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.5' }}>💭 {d.meditationQuestion}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#ffd699', lineHeight: '1.5' }}>🙏 {d.prayerPrompt}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 4. 祷告 */}
      <div style={{ background: 'linear-gradient(135deg, rgba(255,149,0,0.08) 0%, rgba(255,149,0,0.02) 100%)', border: '1px solid rgba(255,149,0,0.22)', borderLeft: '4px solid #ff9500', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 800, color: '#ff9500', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🙏</span>{plan.prayer.title || T('一个祷告', 'A prayer')}
        </h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#ffd699', lineHeight: '1.75', whiteSpace: 'pre-wrap' }}>{plan.prayer.text}</p>
      </div>

      {/* 5. 反思问题 */}
      {plan.reflectionQuestions.length > 0 && (
        <Section icon="🪞" title={T('反思问题', 'Reflection questions')} accent="#d3b0ff">
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.7' }}>
            {plan.reflectionQuestions.map((q) => <li key={q} style={{ marginBottom: '4px' }}>{q}</li>)}
          </ul>
        </Section>
      )}

      {/* 6. 行动回应 */}
      <Section icon="👣" title={T('行动回应', 'Action response')} accent="#ffd699">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px 12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#ffd699', marginBottom: '3px' }}>{T('今天', 'Today')}</div>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>{plan.action.today}</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px 12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#ffd699', marginBottom: '3px' }}>{T('本周', 'This week')}</div>
            <p style={{ margin: 0, fontSize: '12.5px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>{plan.action.thisWeek}</p>
          </div>
        </div>
      </Section>

      {/* 7. 悔改路径 */}
      <div style={{ marginTop: '14px', background: 'rgba(255,149,0,0.04)', border: '1px solid rgba(255,149,0,0.16)', borderRadius: '14px', padding: '16px' }}>
        <button type="button" onClick={() => setShowPath((v) => !v)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#ffcf8b', fontSize: '14px', fontWeight: 800, padding: 0 }}>
          <span>🛤️ {T('把这次看见化作悔改路径', 'Turn this into a repentance path')}</span>
          <span style={{ transform: showPath ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
        </button>
        {showPath && <RepentancePathView strongholdCode={plan.primaryStrongholdCode} />}
      </div>
    </div>
  )
}
