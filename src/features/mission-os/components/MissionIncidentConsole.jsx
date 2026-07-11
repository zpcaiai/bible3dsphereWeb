import { useEffect,useState } from 'react'
import { t } from '../../../i18n/runtime'
import { fetchMissionIncidents } from '../api/incidents'
export default function MissionIncidentConsole({token}){
 const [items,setItems]=useState(null),[error,setError]=useState('')
 useEffect(()=>{fetchMissionIncidents(token).then(r=>setItems(r.items)).catch(e=>setError(e.status===403?t('无权限查看安全事件'):e.message))},[token])
 if(error)return <div role="alert" className="mb-alert error">{error}</div>
 if(!items)return <div className="mb-state">{t('正在加载安全事件…')}</div>
 return <section className="mb-shell" aria-label={t('Mission OS 安全事件')}><header className="mb-hero"><div><h2>{t('安全事件处理台')}</h2><p>{t('L2/L3 由真人安全团队处理；紧急危险请先联系当地紧急服务。')}</p></div><span className="mb-safety">🛡 {t('人工负责')}</span></header>{items.length===0?<div className="mb-state">{t('暂无安全事件')}</div>:<div className="mb-program-grid">{items.map(x=><article className="mb-program" key={x.id}><div className="mb-program-top"><strong>{x.riskLevel} · {x.category}</strong><small>{x.status}</small></div><p>{t('负责人')}：{x.assignedTo||t('待分派')}</p>{x.riskLevel==='L3'&&<div className="mb-alert warning">{t('L3 关闭需要两名独立复核人批准')}</div>}</article>)}</div>}</section>
}
