import { useEffect,useState } from 'react'
import { t } from '../../../i18n/runtime'
import { fetchMissionAudit } from '../api/audit'
export default function MissionAuditConsole({token}){
 const [items,setItems]=useState(null),[error,setError]=useState('')
 useEffect(()=>{fetchMissionAudit(token).then(r=>setItems(r.items)).catch(e=>setError(e.status===403?t('无权限查看审计记录'):e.message))},[token])
 if(error)return <div role="alert" className="mb-alert error">{error}</div>
 if(!items)return <div className="mb-state">{t('正在加载审计记录…')}</div>
 return <section className="mb-shell" aria-label={t('Mission OS 审计')}><header className="mb-hero"><div><h2>{t('审计与数据血缘')}</h2><p>{t('只显示操作元数据，不显示敏感原文。')}</p></div></header>{items.length===0?<div className="mb-state">{t('暂无审计记录')}</div>:<div className="mb-program-grid">{items.map(x=><article className="mb-program" key={x.id}><div className="mb-program-top"><strong>{x.action}</strong><small>{x.result}</small></div><p>{x.resourceType} · {x.resourceId}</p><div className="mb-guardrail">{t('变更字段')}：{(x.changedFields||[]).join(', ')||t('无')}</div></article>)}</div>}</section>
}
