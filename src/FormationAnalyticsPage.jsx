import { t as i18nT } from './i18n/runtime'
/** FormationAnalyticsPage — 成长分析 (B11)。恩典优先、不排名。入口：今日心镜。 */
import { useEffect, useState } from 'react'
import BackButton from './BackButton'
import { analyticsApi } from './api'
import { getToken } from './auth'

const card = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 12 }
const btn = { cursor: 'pointer', borderRadius: 10, padding: '8px 12px', border: 'none', color: '#fff', fontWeight: 700, background: 'linear-gradient(135deg, rgba(125,211,252,0.85), rgba(139,92,246,0.6))' }

export default function FormationAnalyticsPage({ user, onBack }) {
  const [sum, setSum] = useState(null)
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { const t = getToken(); if (t) analyticsApi.summary('monthly', t).then(setSum).catch(e => setError(e.message)) }, [])
  async function genReport() { const t = getToken(); try { setReport(await analyticsApi.generateReport('monthly', t)) } catch (e) { setError(e.message) } }

  const wrap = { maxWidth: 640, margin: '0 auto', padding: 16, color: '#fff' }
  const m = sum && sum.metrics ? sum.metrics : null
  return (
    <div style={wrap}>
      <BackButton onClick={onBack} />
      <h2 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px' }}>{i18nT('📊 成长分析')}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>{i18nT('反思镜子,不是属灵成绩 · 恩典在前')}</div>
      {error && <div style={{ ...card, color: '#ffb4b4' }}>{error}</div>}

      {sum && (
        <>
          <div style={{ ...card, background: 'rgba(52,199,89,0.08)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{i18nT('🌱 恩典证据')}</div>
            {(sum.grace_evidence || []).map((g, i) => <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 5 }}>· {g}</div>)}
          </div>

          {m && m.practice && m.community && (
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{i18nT('近 30 天的迹象')}</div>
              <div style={{ fontSize: 13, lineHeight: 1.9, color: 'rgba(255,255,255,0.8)' }}>
                <div>{i18nT('省察')} {m.practice.examen} {i18nT('· 祷告')} {m.practice.prayer_sessions} {i18nT('· 读经')} {m.practice.lectio} {i18nT('· 诗篇')} {m.practice.psalm_prayer}</div>
                <div>{i18nT('代祷')} {m.practice.intercession_prayed} {i18nT('· 同在操练')} {m.practice.presence_checkins} {i18nT('· 试探得胜')} {m.practice.temptation_resisted}</div>
                <div>{i18nT('群体打卡')} {m.community.group_checkins} {i18nT('· 导师会面')} {m.community.mentor_sessions} {i18nT('· 门徒步骤')} {m.community.discipleship_steps}</div>
                {m.fruit_latest_avg != null && <div>{i18nT('最近果子自评均值')} {m.fruit_latest_avg}/10</div>}
              </div>
            </div>
          )}

          {sum.cautions && sum.cautions.length > 0 && (
            <div style={{ ...card, borderColor: 'rgba(245,196,81,0.3)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#f5c451' }}>{i18nT('需要留意')}</div>
              {sum.cautions.map((c, i) => <div key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 5 }}>· {c}</div>)}
            </div>
          )}
        </>
      )}

      <div style={card}>
        <button style={btn} onClick={genReport}>{i18nT('生成月度成长报告')}</button>
        {report && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{report.title}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', margin: '6px 0 10px' }}>{report.summary}</div>
            {(report.sections || []).map((s, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#8be9c0' }}>{s.title}</div>
                {(s.items || []).map((it, k) => <div key={k} style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)' }}>· {it}</div>)}
              </div>
            ))}
            {(report.recommendations || []).map((r, i) => (
              <div key={i} style={{ fontSize: 13, marginTop: 6 }}><b>{r.title}</b>：{r.description}</div>
            ))}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>{report.disclaimer}</div>
          </div>
        )}
      </div>
    </div>
  )
}
