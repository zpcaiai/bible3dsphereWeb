import { API_BASE } from '../../../api'
async function request(path,token,options={}){const r=await fetch(`${API_BASE}/v1/mission/organizations${path}`,{credentials:'include',...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})}});const data=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(data.detail||'宣教组织服务不可用');e.status=r.status;throw e}return data}
export const fetchMissionOrganization=(token,id)=>request(`/${encodeURIComponent(id)}`,token)
export const saveMissionOrganizationProfile=(token,id,body)=>request(`/${encodeURIComponent(id)}/profile`,token,{method:'PUT',body:JSON.stringify(body)})
export const proposeMissionOrganizationRelationship=(token,id,body)=>request(`/${encodeURIComponent(id)}/relationships`,token,{method:'POST',body:JSON.stringify(body)})
export const inviteMissionOrganizationMember=(token,id,body)=>request(`/${encodeURIComponent(id)}/invitations`,token,{method:'POST',body:JSON.stringify(body)})
export const acceptMissionOrganizationInvitation=(token,body)=>request('/invitations/accept',token,{method:'POST',body:JSON.stringify(body)})
