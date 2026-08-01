import { useEffect, useState } from 'react'
import { t as i18nT } from '../../i18n/runtime'
import { chooseAiFormationScenario, fetchAiFormationScenarios, startAiFormationScenario } from './api'

export default function ScenarioRuntime() {
  const [scenarios, setScenarios] = useState([])
  const [contextRequired, setContextRequired] = useState(false)
  const [runtime, setRuntime] = useState(null)
  const [message, setMessage] = useState('')
  useEffect(() => {
    let alive = true
    fetchAiFormationScenarios().then((result) => {
      if (!alive) return
      setScenarios(result.scenarios || []); setContextRequired(Boolean(result.contextRequired))
    }).catch((error) => alive && setMessage(error.message))
    return () => { alive = false }
  }, [])
  const start = async (scenario) => {
    try { setRuntime(await startAiFormationScenario(scenario.id)); setMessage('') } catch (error) { setMessage(error.message) }
  }
  const choose = async (choice) => {
    try {
      const result = await chooseAiFormationScenario(runtime.session.id, choice, runtime.session.revision)
      setRuntime({ ...runtime, session: result.session })
    } catch (error) { setMessage(error.message) }
  }
  return (
    <section className="aif-card aif-scenario-runtime">
      <span className="aif-eyebrow">VERSION-PINNED · NO FREE TEXT</span>
      <h3>{i18nT('安全情境运行时')}</h3>
      {contextRequired && <p>{i18nT('请先保存年龄与同意上下文。')}</p>}
      {!contextRequired && !scenarios.length && <p>{i18nT('没有已完成全部人工审核并适合当前年龄带的情境。')}</p>}
      {!runtime && <div className="aif-scenario-list">{scenarios.map((scenario) => <article key={scenario.id}><h4>{scenario.title}</h4><p>{scenario.trigger}</p><button type="button" onClick={() => start(scenario)}>{i18nT('开始情境')}</button></article>)}</div>}
      {runtime && <article className="aif-scenario-session">
        <h4>{runtime.scenario.title}</h4><p>{runtime.scenario.trigger}</p><p>{runtime.scenario.formationTension}</p>
        <div>{runtime.choices.map((choice) => <button type="button" key={choice.id} onClick={() => choose(choice.id)} disabled={runtime.session.status !== 'active'}>{choice.label}</button>)}</div>
        <small>{i18nT('本会话只保存受限选择 ID，不保存自由文本，也不生成人格或属灵风险画像。')}</small>
      </article>}
      {message && <p className="aif-form-message" role="status">{message}</p>}
    </section>
  )
}
