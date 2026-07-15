import { useEffect, useState } from 'react'
import { fetchMissionBridgeAgentCatalog, fetchMissionBridgeAgentHistory, runMissionBridgeAgent } from '../../missionBridgeApi'
import { t } from '../../i18n/runtime'
import './agentWorkbench.css'
import GuidedInput from './GuidedInput'
import { missionOptionLabel } from './optionLabels'

const GOAL_OPTIONS = ['整理下一步行动', '预备一次关怀对话', '复盘当前困难', '寻找可信资源', '形成供真人审核的草案']
const CONTENT_OPTIONS = ['请帮我整理事实、感受和需要', '请列出需要真人确认的问题', '请提供几个安全且可选择的下一步', '请标明风险边界和转介建议']

export default function AgentWorkbench({ token, aiConsented, onOpenPrivacy }) {
  const [agents, setAgents] = useState([]); const [history, setHistory] = useState([]); const [agentKey, setAgentKey] = useState('intake'); const [message, setMessage] = useState(''); const [goal, setGoal] = useState(''); const [result, setResult] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const load = async () => { try { const [catalog, runs] = await Promise.all([fetchMissionBridgeAgentCatalog(token), fetchMissionBridgeAgentHistory(token)]); setAgents(catalog.agents || []); setHistory(runs.items || []) } catch (err) { setError(err.message) } }
  useEffect(() => { if (aiConsented) load() }, [token, aiConsented]) // eslint-disable-line react-hooks/exhaustive-deps
  const submit = async (event) => { event.preventDefault(); setBusy(true); setError(''); try { const value = await runMissionBridgeAgent(token, { agentKey, message, goal: goal || null, currentRisk: 'L0' }); setResult(value); await load() } catch (err) { setError(err.message) } finally { setBusy(false) } }
  if (!aiConsented) return <div className="mb-agent-consent"><strong>{t('AI 辅助默认关闭')}</strong><p>{t('只有在你明确同意后，系统才会使用最少必要文字运行 AI 辅助。你可以随时撤回。')}</p><button type="button" onClick={onOpenPrivacy}>{t('前往隐私与同意')}</button></div>
  return <section className="mb-agent-workbench">{error && <div className="mb-alert error" role="alert">{error}</div>}<div className="mb-agent-boundary"><strong>{t('AI 只提供草案')}</strong><span>{t('不诊断、不自动报名、不自动发消息；L2/L3 必须由真人接管。')}</span></div><form onSubmit={submit}><label>{t('辅助类型')}<select value={agentKey} onChange={(e) => setAgentKey(e.target.value)}>{agents.map((agent) => <option key={agent.key} value={agent.key}>{missionOptionLabel(agent.key, agent.label)}</option>)}</select></label><div><label>{t('你的明确目标')}</label><GuidedInput options={GOAL_OPTIONS} value={goal} onChange={setGoal} maxLength={1000} placeholder={t('可选：希望获得什么帮助')} aria-label={t('可选：希望获得什么帮助')}/></div><div><label>{t('需要整理的内容')}</label><GuidedInput multiline options={CONTENT_OPTIONS} required minLength={2} maxLength={8000} value={message} onChange={setMessage} aria-label={t('需要整理的内容')}/></div><button disabled={busy}>{busy ? t('正在生成安全草案…') : t('生成辅助草案')}</button></form>{result && <article className={`mb-agent-result risk-${result.result.riskLevel}`}><header><strong>{t('结构化草案')}</strong><span>{result.result.riskLevel} · {result.status}</span></header><p>{result.result.summary}</p>{result.result.recommendations?.map((item, index) => <div key={index}>{typeof item === 'string' ? item : `${item.title || item.name} · ${item.disclaimer || ''}`}</div>)}<small>{result.result.boundaries?.join(' · ')}</small>{result.result.requiresHumanReview && <b>{t('此结果必须由授权同工人工复核')}</b>}</article>}<div className="mb-agent-history"><h3>{t('最近运行')}</h3>{history.map((run) => <div key={run.id}><span>{run.agentKey}</span><strong>{run.riskLevel} · {run.status}</strong></div>)}</div></section>
}
