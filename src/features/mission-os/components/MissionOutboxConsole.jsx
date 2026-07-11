import { useEffect,useState } from 'react'
import { t } from '../../../i18n/runtime'
import { fetchMissionOutbox,replayMissionOutboxEvent } from '../api/outbox'
export default function MissionOutboxConsole({token}){
 const [items,setItems]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState('')
 const load=()=>fetchMissionOutbox(token).then(r=>setItems(r.items)).catch(e=>setError(e.status===403?t('无权限查看 Outbox'):e.message))
 useEffect(()=>{load()},[token]) // eslint-disable-line react-hooks/exhaustive-deps
 const replay=async id=>{setBusy(id);setError('');try{await replayMissionOutboxEvent(token,id);await load()}catch(e){setError(e.message)}finally{setBusy('')}}
 if(error&&!items)return <div role="alert" className="mb-alert error">{error}</div>
 if(!items)return <div className="mb-state">{t('正在加载 Outbox…')}</div>
 return <section className="mb-shell" aria-label={t('Mission OS Outbox')}><header className="mb-hero"><div><h2>{t('事件投递')}</h2><p>{t('失败事件可以重试，但 Payload 不允许编辑。')}</p></div></header>{error&&<div role="alert" className="mb-alert error">{error}</div>}{items.length===0?<div className="mb-state">{t('没有失败事件')}</div>:<div className="mb-program-grid">{items.map(x=><article className="mb-program" key={x.id}><div className="mb-program-top"><strong>{x.eventType}</strong><small>{x.deadLetter?'Dead Letter':`${x.attempts} attempts`}</small></div><p>{x.error||t('等待投递')}</p><button disabled={busy===x.id} onClick={()=>replay(x.id)}>{t('审计后重试')}</button></article>)}</div>}</section>
}
