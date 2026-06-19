import { useState } from 'react'
import { T, localizeStronghold } from '../lib/localize'

// 自高之事卡片 / Stronghold card — 与 SinPatternCard 视觉一致，可折叠展开。
export default function StrongholdCard({ stronghold: raw, defaultOpen = false, onSelect }) {
  const [open, setOpen] = useState(defaultOpen)
  const s = localizeStronghold(raw)

  const panel = {
    background: 'rgba(255, 255, 255, 0.015)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '14px',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
  }
  const h4 = (color) => ({ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 800, color, display: 'flex', alignItems: 'center', gap: '6px' })
  const ul = { margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }

  return (
    <article
      className="sf-card sf-stronghold-card"
      style={{
        background: open
          ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(120,120,255,0.02) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
        border: open ? '1px solid rgba(140,140,255,0.28)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: open ? '0 8px 32px rgba(0,0,0,0.25), 0 0 15px rgba(120,120,255,0.05)' : '0 4px 20px rgba(0,0,0,0.15)',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        marginBottom: '4px',
      }}
    >
      {/* 头部折叠开关 */}
      <button
        className="sf-card-button"
        type="button"
        onClick={() => { setOpen(!open); onSelect?.(s.code) }}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: '#fff', outline: 'none', whiteSpace: 'normal' }}
      >
        <div style={{ flex: '1 1 200px', paddingRight: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: open ? '#c7c8ff' : '#fff', transition: 'color 0.2s', wordBreak: 'break-word' }}>
              <span style={{ marginRight: '6px' }}>🗼</span>{s.name}
            </h3>
            {s.archetype && (
              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#a9abff', background: 'rgba(120,120,255,0.10)', border: '1px solid rgba(120,120,255,0.22)', padding: '2px 7px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
                {s.archetype.name}
              </span>
            )}
          </div>
          <p style={{ margin: '6px 0 0 0', fontSize: '12.5px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.5', wordBreak: 'break-word' }}>{s.summary}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span className="sf-card-short" style={{ borderRadius: '999px', background: open ? 'rgba(120,120,255,0.12)' : 'rgba(255,255,255,0.06)', color: open ? '#c7c8ff' : 'rgba(255,255,255,0.7)', border: open ? '1px solid rgba(120,120,255,0.25)' : '1px solid rgba(255,255,255,0.12)', padding: '3px 8px', fontSize: '11px', fontWeight: 800, whiteSpace: 'nowrap' }}>{s.shortName}</span>
          <span style={{ fontSize: '14px', color: open ? '#a9abff' : 'rgba(255,255,255,0.3)', transition: 'transform 0.25s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
        </div>
      </button>

      {/* 核心谎言 vs 圣经真理 */}
      <div className="sf-detail-grid" style={{ marginTop: '16px' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(255,69,58,0.06) 0%, rgba(255,69,58,0.01) 100%)', border: '1px solid rgba(255,69,58,0.16)', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px' }}>⚠️</span>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#ff453a', letterSpacing: '0.5px' }}>{T('核心谎言', 'CORE LIE')}</span>
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#ffb3b0', lineHeight: '1.5', fontWeight: 500, wordBreak: 'break-word' }}>{s.coreLie}</p>
        </div>
        <div style={{ background: 'linear-gradient(135deg, rgba(48,209,88,0.06) 0%, rgba(48,209,88,0.01) 100%)', border: '1px solid rgba(48,209,88,0.16)', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px' }}>✨</span>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#30d158', letterSpacing: '0.5px' }}>{T('圣经真理', 'BIBLICAL TRUTH')}</span>
          </div>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#a3e2ab', lineHeight: '1.5', fontWeight: 500, wordBreak: 'break-word' }}>{s.biblicalCounterTruth}</p>
        </div>
      </div>

      {/* 被拦阻的真理标签 */}
      {s.blockedDoctrines?.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{T('被遮蔽：', 'Blocks: ')}</span>
          {s.blockedDoctrines.map((d) => (
            <span key={d.code} style={{ fontSize: '11px', fontWeight: 600, background: 'rgba(90,200,250,0.06)', border: '1px solid rgba(90,200,250,0.18)', color: '#aee8ff', padding: '3px 8px', borderRadius: '20px' }}>📖 {d.name}</span>
          ))}
        </div>
      )}

      {/* 展开详情 */}
      {open && (
        <div style={{ marginTop: '16px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '16px' }}>
          {/* 假福音 / 假身份 */}
          <div className="sf-detail-grid">
            <div style={{ ...panel, background: 'rgba(255,159,10,0.04)', border: '1px solid rgba(255,159,10,0.16)' }}>
              <h4 style={h4('#ffcf8b')}><span>🎭</span> {T('假福音', 'False Gospel')}</h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.6' }}>{s.falseGospel}</p>
            </div>
            <div style={{ ...panel, background: 'rgba(255,159,10,0.04)', border: '1px solid rgba(255,159,10,0.16)' }}>
              <h4 style={h4('#ffcf8b')}><span>🪞</span> {T('假身份', 'False Identity')}</h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.6' }}>{s.falseIdentity}</p>
            </div>
          </div>

          {/* 欲望 / 恐惧 / 信号 / 文化助燃 */}
          <div className="sf-detail-grid" style={{ marginTop: '14px' }}>
            <div style={panel}>
              <h4 style={h4('#ffd699')}><span>🔥</span> {T('根部欲望', 'Root Desires')}</h4>
              <ul style={ul}>{s.rootDesires.map((x) => <li key={x} style={{ marginBottom: '4px' }}>{x}</li>)}</ul>
            </div>
            <div style={panel}>
              <h4 style={h4('#ffb3b0')}><span>😰</span> {T('根部恐惧', 'Root Fears')}</h4>
              <ul style={ul}>{s.rootFears.map((x) => <li key={x} style={{ marginBottom: '4px' }}>{x}</li>)}</ul>
            </div>
            <div style={panel}>
              <h4 style={h4('#d3b0ff')}><span>🧭</span> {T('内在信号', 'Inner Signals')}</h4>
              <ul style={ul}>{[...s.cognitiveSignals, ...s.emotionalSignals].slice(0, 5).map((x) => <li key={x} style={{ marginBottom: '4px' }}>{x}</li>)}</ul>
            </div>
            <div style={panel}>
              <h4 style={h4('#aee8ff')}><span>🌐</span> {T('文化助燃', 'Cultural Reinforcers')}</h4>
              <ul style={ul}>{s.culturalReinforcers.map((x) => <li key={x} style={{ marginBottom: '4px' }}>{x}</li>)}</ul>
            </div>
          </div>

          {/* 行为信号 */}
          {s.behavioralSignals?.length > 0 && (
            <div style={{ ...panel, marginTop: '14px' }}>
              <h4 style={h4('#ff9f8b')}><span>👣</span> {T('行为表现', 'Behavioral Signals')}</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {s.behavioralSignals.map((x) => (
                  <span key={x} style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '3px 9px', borderRadius: '20px' }}>{x}</span>
                ))}
              </div>
            </div>
          )}

          {/* 相关经文 */}
          {s.scriptures?.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '12.5px', color: '#5ac8fa', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}><span>📖</span>{T('相关圣经经文', 'Relevant Scriptures')}：</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {s.scriptures.map((sc) => (
                  <div key={sc.reference} style={{ background: 'rgba(90,200,250,0.03)', border: '1px solid rgba(90,200,250,0.12)', borderRadius: '8px', padding: '10px 12px', fontSize: '12.5px' }}>
                    <strong style={{ color: '#5ac8fa', display: 'block', marginBottom: '4px', fontSize: '12px' }}>{sc.reference}</strong>
                    <span style={{ color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', lineHeight: '1.5', display: 'block' }}>“{sc.text}”</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 福音重构（橙色强调块） */}
          <div style={{ background: 'linear-gradient(135deg, rgba(255,149,0,0.08) 0%, rgba(255,149,0,0.02) 100%)', border: '1px solid rgba(255,149,0,0.22)', borderLeft: '4px solid #ff9500', borderRadius: '8px', padding: '14px', marginTop: '16px', wordBreak: 'break-word' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 800, color: '#ff9500', display: 'flex', alignItems: 'center', gap: '6px' }}><span>🌅</span>{T('福音重构', 'Gospel Reframe')}</h4>
            <p style={{ margin: 0, fontSize: '13px', color: '#ffd699', lineHeight: '1.7' }}>{s.gospelReframe}</p>
          </div>

          {/* 常见说法 */}
          {s.exampleUserPhrases?.length > 0 && (
            <div style={{ marginTop: '14px' }}>
              <h5 style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'rgba(255,255,255,0.45)', fontWeight: 700 }}>{T('常听见的说法', 'Things people often say')}：</h5>
              {s.exampleUserPhrases.map((p) => (
                <p key={p} style={{ margin: '4px 0', fontSize: '12.5px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>「{p}」</p>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  )
}
