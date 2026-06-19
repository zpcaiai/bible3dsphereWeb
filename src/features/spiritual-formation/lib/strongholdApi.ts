// 自高之事云端同步客户端 / Stronghold cloud-sync client.
// 与 apiStorage.ts 同款：API_BASE + Bearer token；后端 routers/strongholds.py。
import { API_BASE } from "../../../api";
import type { StrongholdScanRecord } from "./strongholdHistory";

async function req(path: string, token?: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}/strongholds${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : null;
  if (!res.ok) throw new Error(data?.detail || data?.error || "Stronghold API request failed");
  return data;
}

// 上传一条辨识记录（云端以登录邮箱为 user_id；body.userId 会被忽略）
export async function pushScanRemote(record: StrongholdScanRecord, token?: string): Promise<StrongholdScanRecord | null> {
  if (!token) throw new Error("No auth token");
  return (await req("/scans", token, { method: "POST", body: JSON.stringify(record) })).record;
}

// 拉取最近 rangeDays 天的记录
export async function listScansRemote(rangeDays = 365, token?: string, limit = 500): Promise<StrongholdScanRecord[]> {
  if (!token) throw new Error("No auth token");
  const data = await req(`/scans?range=${rangeDays}d&limit=${limit}`, token);
  return (data.items || []) as StrongholdScanRecord[];
}

// 清空云端记录
export async function clearScansRemote(token?: string): Promise<number> {
  if (!token) throw new Error("No auth token");
  return (await req("/scans", token, { method: "DELETE" })).deleted ?? 0;
}

// 删除单条
export async function deleteScanRemote(id: string, token?: string): Promise<number> {
  if (!token) throw new Error("No auth token");
  return (await req(`/scans/${encodeURIComponent(id)}`, token, { method: "DELETE" })).deleted ?? 0;
}

// 云端聚合（可选；前端通常用本地聚合保持一致）
export async function loadSummaryRemote(rangeDays = 30, token?: string) {
  if (!token) throw new Error("No auth token");
  return await req(`/summary?range=${rangeDays}d`, token);
}

// P2 属灵画像（合并自高之事 + 罪模式日省）/ spiritual profile
export async function loadProfileRemote(rangeDays = 90, token?: string) {
  if (!token) throw new Error("No auth token");
  return (await req(`/profile?range=${rangeDays}d`, token)).profile;
}

// P2 生命塑造进展 / formation progress
export async function loadProgressRemote(rangeDays = 30, token?: string) {
  if (!token) throw new Error("No auth token");
  return (await req(`/progress?range=${rangeDays}d`, token)).progress;
}
