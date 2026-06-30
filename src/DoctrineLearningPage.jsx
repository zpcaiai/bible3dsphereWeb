/** DoctrineLearningPage — 教义学习路径 (B9)。入口：知识智能 / 今日心镜。 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { communityApi } from './api'
import { getToken } from './auth'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { cursor: 'pointer', borderRadius: 10, padding: '8px 12px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(139,92,246,0.85), rgba(52,199,89,0.6))' }
const fld = { width: '100%', padding: 10, borderRadius: 10, marginBottom: 10, background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }

export default function DoctrineLearningPage({ user, onBack }) {
  const [topics, setTopics] = useState([])
  const [goal, setGoal] = useState('')
  const [rec, setRec] = useState(null)
  const [open, setOpen] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { const t = getToken(); if (t) communityApi.doctrineTopics(t).then(r => setTopics(r.topics || [])).catch(e => setError(e.message)) }, [])

  async function recommend() { const t = getToken(); try { setRec(await communityApi.doctrineRecommend({ goal }, t)) } catch (e) { setError(e.message) } }
  async function markDone(key) { const t = getToken(); try { await communityApi.doctrineProgress({ topic_key: key, status: 'completed' }, t) } catch (e) { setError(e.message) } }

  const Topic = ({ tp }) => (
    <div style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div onClick={() => setOpen(open === tp.topic_key ? null : tp.topic_key)} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
        {tp.display_name} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>· {tp.difficulty}</span>
      </div>
      {open === tp.topic_key && (
        <div style={{ marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>
          <div>{tp.summary}</div>
          {tp.scripture_refs && tp.scripture_refs.length > 0 && <div style={{ marginTop: 4, color: '#8be9c0' }}>📖 {tp.scripture_refs.join('、')}</div>}
          {tp.formation_relevance && <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>与成长：{tp.formation_relevance}</div>}
          <button style={{ ...btn, marginTop: 8, padding: '5px 10px', fontSize: 12 }} onClick={() => markDone(tp.topic_key)}>标记学过</button>
        </div>
      )}
    </div>
  )

  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }
  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>📚 教义学习</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>区分经文/教义/传统/应用 · 连接到成长操练</div>
      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}

      <div style={card}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="想学什么 / 在挣扎什么（如：羞耻、苦难、初信、领袖）" style={{ ...fld, marginBottom: 0, flex: 1 }} />
          <button style={btn} onClick={recommend}>推荐路径</button>
        </div>
        {rec && rec.recommended_path && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#8be9c0' }}>{rec.recommended_path.title}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>{rec.recommended_path.description}</div>
            {(rec.topics || []).map(tp => <Topic key={tp.topic_key} tp={tp} />)}
          </div>
        )}
      </div>

      <div style={card}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>全部主题（{topics.length}）</div>
        {topics.map(tp => <Topic key={tp.topic_key} tp={tp} />)}
      </div>
    </div>
  )
}
