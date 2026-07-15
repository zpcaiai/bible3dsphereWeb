import { useEffect,useState } from 'react'
import { t } from '../../../i18n/runtime'
import { fetchMissionOrganization,saveMissionOrganizationProfile } from '../api/organizations'
import { missionOptionLabel } from '../../../components/mission-bridge/optionLabels'
const KINDS=['church','mission_agency','receiving_church','team','training_provider','care_provider','professional_partner','funding_partner']
export default function MissionOrganizationConsole({token,organizationId}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[form,setForm]=useState({organizationKind:'church',legalName:'',countryCode:''})
 useEffect(()=>{if(!organizationId){setError(t('请先选择一个组织'));return}fetchMissionOrganization(token,organizationId).then(r=>{setData(r);setForm({organizationKind:r.organization.missionKind||'church',legalName:r.organization.legalName||'',countryCode:r.organization.countryCode||''})}).catch(e=>setError(e.status===403?t('无权限管理此宣教组织'):e.message))},[token,organizationId])
 const save=async e=>{e.preventDefault();setBusy(true);setError('');try{await saveMissionOrganizationProfile(token,organizationId,{...form,countryCode:form.countryCode||null});setData(await fetchMissionOrganization(token,organizationId))}catch(err){setError(err.message)}finally{setBusy(false)}}
 if(error&&!data)return <div role="alert" className="mb-alert error">{error}</div>
 if(!data)return <div className="mb-state">{t('正在加载宣教组织…')}</div>
 return <section aria-label={t('宣教组织管理')}><form className="mb-goal-form" onSubmit={save}><h3>{data.organization.name}</h3><label>{t('组织类型')}<select value={form.organizationKind} onChange={e=>setForm({...form,organizationKind:e.target.value})}>{KINDS.map(x=><option key={x} value={x}>{missionOptionLabel(x)}</option>)}</select></label><label>{t('法定名称')}<input value={form.legalName} onChange={e=>setForm({...form,legalName:e.target.value})}/></label><label>{t('国家代码')}<input maxLength={2} value={form.countryCode} onChange={e=>setForm({...form,countryCode:e.target.value.toUpperCase()})}/></label><button disabled={busy}>{busy?t('保存中…'):t('保存组织画像')}</button></form><div className="mb-training-list">{data.relationships.length===0?<div className="mb-state">{t('尚无跨组织合作关系')}</div>:data.relationships.map(x=><article key={x.id}><div><strong>{x.relationshipType}</strong><span>{x.targetOrganizationId}</span></div><small>{x.status}</small></article>)}</div></section>
}
