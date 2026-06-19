import { useState } from 'react'
import { scanStrongholds } from '../lib/strongholdDiscernment'
import { strongholdMap } from '../data/strongholds'
import { T, localizeStronghold } from '../lib/localize'
import { MODULE_DISCLAIMER } from '../lib/pastoralSafety'
import StrongholdCard from './StrongholdCard'
import GospelResponsePanel from './GospelResponsePanel'
import { buildGospelResponse } from '../lib/gospelResponse'

const EMOTIONS = [
  ['焦虑', 'Anxiety'], ['羞耻', 'Shame'], ['愤怒', 'Anger'], ['恐惧', 'Fear'],
  ['空虚', 'Emptiness'], ['嫉妒', 'Envy'], ['孤独', 'Loneliness'], ['麻木', 'Numbness'],
  ['烦躁', 'Restlessness'], ['悲伤', 'Grief'],
]

export default function StrongholdDiscernmentForm({ onSave }) {
  const [text, setText] = useState('')
  const [emotions, setEmotions] = useState([])
  const [result, setResult] = useState(null)

  const toggleEmotion = (zh) =>
    setEmotions((cur) => (cur.includes(zh) ? cur.filter((e) => e !== zh) : [...cur, zh]))

  function run() {
    if (!text.trim() && emotions.length === 0) return
    const r = scanStrongholds({ text, emotions })
    setResult(r)
    onSave?.({ text, emotions, result: r, date: new Date().toISOString() })
  }

  function reset() {
    setText(''); setEmotions([]); setResult(null)
  }

  const primary = result?.primary ? localizeStronghold(strongholdMap[result.primary.code]) : null
  const secondary = (result?.detected || []).slice(1)

  return (
    <section className="sf-section" style={{ padding: '20px 16px 60px', boxSizing: 'border-box' }}>
      {/* 引导 */}
      <div style={{ background: 'linear-gradient(135deg, rgba(120,120,255,0.08) 0%, rgba(90,200,250,0.03) 100%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px' }}>🧭</span>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#c7c8ff' }}>{T('自我辨识', 'Self-Discernment')}</h2>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
          {T('写下你此刻的挣扎、念头或情绪——例如你最想抓住什么、最怕失去什么、在哪件事上最难信靠神。这只是帮助你在神面前省察的镜子，不是最终断定。',
             'Write what you are wrestling with right now — what you most want to hold onto, most fear losing, or find hardest to trust God with. This is a mirror for reflection before God, not a verdict.')}
        </p>
      </div>

      {/* 输入 */}
      <div style={{ marginBottom: '14px' }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={T('比如：只要事情有一点不确定我就很焦虑，必须把每个细节都安排好…',
                         'e.g. The moment anything is uncertain I get anxious and need every detail arranged…')}
          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 14px', color: '#fff', fontSize: '13.5px', lineHeight: '1.6', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
        />
      </div>

      {/* 情绪标签 */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '8px' }}>{T('此刻较明显的情绪（可选）', 'Strongest emotions right now (optional)')}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {EMOTIONS.map(([zh, en]) => {
            const on = emotions.includes(zh)
            return (
              <button key={zh} type="button" onClick={() => toggleEmotion(zh)}
                style={{ padding: '5px 12px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', border: '1px solid ' + (on ? 'rgba(140,140,255,0.45)' : 'rgba(255,255,255,0.1)'), background: on ? 'rgba(120,120,255,0.16)' : 'rgba(255,255,255,0.04)', color: on ? '#c7c8ff' : 'rgba(255,255,255,0.6)', fontWeight: on ? 700 : 400 }}>
                {T(zh, en)}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
        <button type="button" onClick={run} disabled={!text.trim() && emotions.length === 0}
          style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', cursor: (!text.trim() && emotions.length === 0) ? 'not-allowed' : 'pointer', background: (!text.trim() && emotions.length === 0) ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #6a6aff 0%, #8c5cff 100%)', color: '#fff', fontSize: '14px', fontWeight: 700 }}>
          🔎 {T('开始辨识', 'Discern')}
        </button>
        {result && (
          <button type="button" onClick={reset} style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', fontSize: '14px', cursor: 'pointer' }}>
            {T('重来', 'Reset')}
          </button>
        )}
      </div>

      {/* 结果 */}
      {result && result.safety.level === 'crisis' && (
        <div style={{ background: 'linear-gradient(135deg, rgba(255,69,58,0.12) 0%, rgba(255,69,58,0.03) 100%)', border: '1px solid rgba(255,69,58,0.35)', borderLeft: '4px solid #ff453a', borderRadius: '12px', padding: '18px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 800, color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🛟</span>{T('你的安全最重要', 'Your safety matters most')}
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#ffd0cd', lineHeight: '1.7' }}>{result.safety.message}</p>
        </div>
      )}

      {result && result.safety.level === 'none' && !result.hasSignal && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '30px', marginBottom: '8px' }}>🕊️</div>
          <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
            {T('暂时没有看到明显的模式。你可以再具体一点描述你最想抓住或最怕失去的是什么，或直接浏览辨识库。',
               'No clear pattern yet. Try describing more specifically what you most want to hold onto or fear losing — or browse the library.')}
          </div>
        </div>
      )}

      {result && result.safety.level === 'none' && result.hasSignal && primary && (
        <div>
          {/* 摘要 */}
          <div style={{ background: 'rgba(120,120,255,0.06)', border: '1px solid rgba(120,120,255,0.2)', borderRadius: '12px', padding: '14px 16px', marginBottom: '14px' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}>
              {T('在你所写的内容里，最明显的模式可能是：', 'The most likely pattern in what you wrote:')}
              <b style={{ color: '#c7c8ff' }}> {primary.name}</b>
              <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: '6px', fontSize: '12px' }}>
                · {T('可能性', 'likelihood')} {Math.round(result.primary.confidence * 100)}%
              </span>
            </p>
            {result.primary.evidence?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{T('线索：', 'Cues: ')}</span>
                {result.primary.evidence.slice(0, 8).map((e) => (
                  <span key={e} style={{ fontSize: '11px', color: '#c7c8ff', background: 'rgba(120,120,255,0.1)', border: '1px solid rgba(120,120,255,0.2)', padding: '2px 8px', borderRadius: '999px' }}>{e}</span>
                ))}
              </div>
            )}
          </div>

          {/* 福音回应层 */}
          <GospelResponsePanel plan={buildGospelResponse(result)} />

          {/* 主模式完整卡片（可展开查看细节） */}
          <h4 style={{ margin: '22px 0 10px 0', fontSize: '13px', color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>{T('完整模式卡片', 'Full pattern card')}</h4>
          <StrongholdCard stronghold={strongholdMap[result.primary.code]} />

          {/* 次要相关 */}
          {secondary.length > 0 && (
            <div style={{ marginTop: '18px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'rgba(255,255,255,0.55)', fontWeight: 700 }}>{T('也可能有关', 'May also be related')}</h4>
              <div className="sf-pattern-grid sf-pattern-library-grid">
                {secondary.map((d) => <StrongholdCard key={d.code} stronghold={strongholdMap[d.code]} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 牧养免责声明 */}
      <p style={{ marginTop: '24px', fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6', textAlign: 'center' }}>{MODULE_DISCLAIMER}</p>
    </section>
  )
}
