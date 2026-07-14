// CSRF: Bearer-token auth only — cookies unused, so credentials:'include' removed to reduce CSRF surface.
import { API_BASE } from '../../../api'
const realToken=t=>(t&&t!=='cookie-session'?t:null)
async function request(path,token,options={}){const bearer=realToken(token);const r=await fetch(`${API_BASE}/v1/mission${path}`,{credentials:'same-origin',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(bearer?{Authorization:`Bearer ${bearer}`}:{})}});const data=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(data.detail||'审计服务不可用');e.status=r.status;throw e}return data}
export const fetchMissionAudit=(token)=>request('/audit',token)
export const fetchMissionLineage=(token,type,id)=>request(`/data-lineage/${encodeURIComponent(type)}/${encodeURIComponent(id)}`,token)
export const requestBreakGlass=(token,payload)=>request('/break-glass',token,{method:'POST',body:JSON.stringify(payload)})
