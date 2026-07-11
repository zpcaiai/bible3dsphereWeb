import { API_BASE } from '../../../api'
async function request(path,token,options={}){const r=await fetch(`${API_BASE}/v1/mission/system/outbox${path}`,{credentials:'include',...options,headers:{...(token?{Authorization:`Bearer ${token}`}:{})}});const data=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(data.detail||'Outbox 服务不可用');e.status=r.status;throw e}return data}
export const fetchMissionOutbox=(token,status='failed')=>request(`?status=${encodeURIComponent(status)}`,token)
export const replayMissionOutboxEvent=(token,id)=>request(`/${encodeURIComponent(id)}/replay`,token,{method:'POST'})
