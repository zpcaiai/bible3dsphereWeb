// CSRF: Bearer-token auth only — cookies unused, so credentials:'include' removed to reduce CSRF surface.
import { API_BASE } from '../../../api'
async function request(path,token,options={}){const r=await fetch(`${API_BASE}/v1/mission/incidents${path}`,{...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})}});const data=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(data.detail||'安全事件服务不可用');e.status=r.status;throw e}return data}
export const fetchMissionIncidents=token=>request('',token)
export const fetchMissionIncident=(token,id)=>request(`/${id}`,token)
export const transitionMissionIncident=(token,id,action,payload)=>request(`/${id}/${action}`,token,{method:'POST',body:JSON.stringify(payload)})
