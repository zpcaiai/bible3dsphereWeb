// CSRF: Bearer-token auth only — cookies unused, so credentials:'include' removed to reduce CSRF surface.
import { API_BASE } from '../../../api'
const realToken=t=>(t&&t!=='cookie-session'?t:null)
async function request(path,token,options={}){const bearer=realToken(token);const r=await fetch(`${API_BASE}/v1/mission/organizations${path}`,{credentials:'same-origin',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(bearer?{Authorization:`Bearer ${bearer}`}:{})}});const data=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(data.detail||'宣教组织服务不可用');e.status=r.status;throw e}return data}
export const fetchMissionOrganization=(token,id)=>request(`/${encodeURIComponent(id)}`,token)
export const saveMissionOrganizationProfile=(token,id,body)=>request(`/${encodeURIComponent(id)}/profile`,token,{method:'PUT',body:JSON.stringify(body)})
export const proposeMissionOrganizationRelationship=(token,id,body)=>request(`/${encodeURIComponent(id)}/relationships`,token,{method:'POST',body:JSON.stringify(body)})
export const inviteMissionOrganizationMember=(token,id,body)=>request(`/${encodeURIComponent(id)}/invitations`,token,{method:'POST',body:JSON.stringify(body)})
export const acceptMissionOrganizationInvitation=(token,body)=>request('/invitations/accept',token,{method:'POST',body:JSON.stringify(body)})

// ---- 我的组织（productization /orgs）：供工作台选择/创建组织上下文 ----
async function orgsRequest(path,token,options={}){const bearer=realToken(token);const r=await fetch(`${API_BASE}/productization/orgs${path}`,{credentials:'same-origin',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(bearer?{Authorization:`Bearer ${bearer}`}:{})}});const data=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(data.detail||'组织服务不可用');e.status=r.status;throw e}return data}
export const listMyOrganizations=(token)=>orgsRequest('',token)
export const createOrganization=(token,body)=>orgsRequest('',token,{method:'POST',body:JSON.stringify(body)})
