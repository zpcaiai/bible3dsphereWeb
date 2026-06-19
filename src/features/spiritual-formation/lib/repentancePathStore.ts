// 悔改路径进度（本地优先）/ Repentance path progress (local-first).
// 只存进度（轻量）；完整 plan 由 buildRepentancePath 按需重建。
import type { PathLength } from "./repentancePath";

export const REPENTANCE_PATHS_KEY = "spiritualFormation.repentancePaths";
const DEFAULT_USER_ID = "local-user";

export interface RepentancePathProgress {
  id: string;
  userId: string;
  strongholdCode: string;
  length: PathLength;
  startedAt: string;
  completedDays: number[];
  status: "active" | "completed" | "abandoned";
}

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}
function readAll(): RepentancePathProgress[] {
  if (!hasStorage()) return [];
  try {
    const raw = window.localStorage.getItem(REPENTANCE_PATHS_KEY);
    return raw ? (JSON.parse(raw) as RepentancePathProgress[]) : [];
  } catch {
    return [];
  }
}
function writeAll(items: RepentancePathProgress[]) {
  if (!hasStorage()) return;
  window.localStorage.setItem(REPENTANCE_PATHS_KEY, JSON.stringify(items));
}

export function startPath(userId: string, strongholdCode: string, length: PathLength): RepentancePathProgress {
  // 同一自高之事已有进行中的路径则复用
  const existing = getActivePathFor(userId, strongholdCode);
  if (existing && existing.length === length) return existing;
  const rec: RepentancePathProgress = {
    id: `rp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    strongholdCode,
    length,
    startedAt: new Date().toISOString(),
    completedDays: [],
    status: "active",
  };
  writeAll([rec, ...readAll().filter((p) => !(p.userId === userId && p.strongholdCode === strongholdCode && p.status === "active"))]);
  return rec;
}

export function listPaths(userId: string = DEFAULT_USER_ID): RepentancePathProgress[] {
  return readAll().filter((p) => p.userId === userId);
}

export function getActivePathFor(userId: string, strongholdCode: string): RepentancePathProgress | null {
  return readAll().find((p) => p.userId === userId && p.strongholdCode === strongholdCode && p.status === "active") ?? null;
}

export function getPathById(id: string): RepentancePathProgress | null {
  return readAll().find((p) => p.id === id) ?? null;
}

export function toggleDay(id: string, day: number): RepentancePathProgress | null {
  const all = readAll();
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return null;
  const p = all[idx];
  const done = new Set(p.completedDays);
  if (done.has(day)) done.delete(day); else done.add(day);
  p.completedDays = [...done].sort((a, b) => a - b);
  all[idx] = p;
  writeAll(all);
  return p;
}

export function setStatus(id: string, status: RepentancePathProgress["status"]): void {
  const all = readAll();
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return;
  all[idx].status = status;
  writeAll(all);
}
