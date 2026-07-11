import { useEffect, useState } from 'react'
import { t } from '../../../i18n/runtime'
import { fetchMissionFeatures, setMissionFeatureOverride } from '../api/features'

export default function MissionFeatureSettings({ token }) {
  const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState('')
  const load=()=>fetchMissionFeatures(token).then(setData).catch((e)=>setError(e.status===403?t('无权限查看 Mission OS 功能设置'):e.message))
  useEffect(()=>{load()},[token]) // eslint-disable-line react-hooks/exhaustive-deps
  const change=async(flag,value)=>{
    const reason=window.prompt(t('请输入变更原因（至少 4 个字）'))
    if(!reason||reason.trim().length<4)return
    setBusy(flag.key);setError('')
    try{await setMissionFeatureOverride(token,flag.key,{scopeType:'global',scopeId:'global',value,reason:reason.trim()});await load()}
    catch(e){setError(e.message)}finally{setBusy('')}
  }
  if(error&&!data)return <div role="alert" className="mb-alert error">{error}</div>
  if(!data)return <div className="mb-state">{t('正在加载功能设置…')}</div>
  return <section aria-label={t('Mission OS 功能设置')} className="mb-shell">
    <header className="mb-hero"><div><h2>{t('Mission OS 功能设置')}</h2><p>{t('高风险功能默认关闭；每次启用都必须记录原因。')}</p></div></header>
    {error&&<div role="alert" className="mb-alert error">{error}</div>}
    <div className="mb-program-grid">{data.flags.map(flag=><article className="mb-program" key={flag.key}>
      <div className="mb-program-top"><strong>{flag.key}</strong><small>{flag.riskLevel}</small></div><p>{flag.description}</p>
      <button type="button" disabled={busy===flag.key} onClick={()=>change(flag,!flag.defaultValue)}>{flag.defaultValue?t('紧急关闭'):t('创建启用覆盖')}</button>
    </article>)}</div>
  </section>
}
