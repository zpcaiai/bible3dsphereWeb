import { API_BASE } from "../../../api";
import type { DailyExamen, GraceRecoveryEntry, HolyLifeDayLog, HorariumDayLog, ThoughtCaptiveEntry, TransformationPlan } from "../types/spiritualFormation";

async function requestJson(path: string, token?: string, init: RequestInit = {}) {
  const res = await fetch(`${API_BASE}/spiritual-formation${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : null;
  if (!res.ok) throw new Error(data?.detail || data?.error || "Spiritual formation API request failed");
  return data;
}

export async function loadSpiritualFormationData(token?: string) {
  if (!token) throw new Error("No auth token");
  const [daily, thoughts, recoveries, plans, activePlan, holyLife, holyLifeSummary, horarium] = await Promise.all([
    requestJson("/daily-examens?limit=365", token),
    requestJson("/thought-captive?limit=365", token),
    requestJson("/grace-recovery?limit=365", token),
    requestJson("/plans?limit=200", token),
    requestJson("/plans/active", token),
    requestJson("/holy-life/day-logs?limit=365", token),
    requestJson("/holy-life/summary?days=30", token).catch(() => null),
    requestJson("/holy-life/horarium/day-logs?limit=365", token).catch(() => null),
  ]);
  return {
    dailyExamens: daily.items || [],
    thoughtEntries: thoughts.items || [],
    graceRecoveryEntries: recoveries.items || [],
    plans: plans.items || [],
    activePlan: activePlan.plan || null,
    holyLifeDayLogs: holyLife.items || [],
    holyLifeSummary: holyLifeSummary || null,
    horariumDayLogs: horarium?.items || [],
  };
}

export async function createDailyExamenRemote(entry: DailyExamen, token?: string) {
  if (!token) throw new Error("No auth token");
  return (await requestJson("/daily-examens", token, { method: "POST", body: JSON.stringify(entry) })).entry;
}

export async function createThoughtCaptiveRemote(entry: ThoughtCaptiveEntry, token?: string) {
  if (!token) throw new Error("No auth token");
  return (await requestJson("/thought-captive", token, { method: "POST", body: JSON.stringify(entry) })).entry;
}

export async function createGraceRecoveryRemote(entry: GraceRecoveryEntry, token?: string) {
  if (!token) throw new Error("No auth token");
  return (await requestJson("/grace-recovery", token, { method: "POST", body: JSON.stringify(entry) })).entry;
}

export async function createTransformationPlanRemote(plan: TransformationPlan, token?: string) {
  if (!token) throw new Error("No auth token");
  return (await requestJson("/plans", token, { method: "POST", body: JSON.stringify(plan) })).plan;
}

export async function updateTransformationPlanRemote(plan: TransformationPlan, token?: string) {
  if (!token) throw new Error("No auth token");
  return (await requestJson(`/plans/${encodeURIComponent(plan.id)}`, token, {
    method: "PUT",
    body: JSON.stringify({
      status: plan.status,
      completedPracticeIds: plan.completedPracticeIds || [],
    }),
  })).plan;
}

export async function createHolyLifeDayLogRemote(dayLog: HolyLifeDayLog, token?: string) {
  if (!token) throw new Error("No auth token");
  return (await requestJson("/holy-life/day-logs", token, { method: "POST", body: JSON.stringify(dayLog) })).dayLog;
}

export async function createHorariumDayLogRemote(dayLog: HorariumDayLog, token?: string) {
  if (!token) throw new Error("No auth token");
  return (await requestJson("/holy-life/horarium/day-logs", token, { method: "POST", body: JSON.stringify(dayLog) })).dayLog;
}

export async function generateRuleOfLifeRemote(
  payload: { intention?: string; focusSkillId?: string; entries?: { skillId: string; score: number }[] },
  token?: string,
) {
  if (!token) throw new Error("No auth token");
  return (await requestJson("/holy-life/rule-of-life", token, { method: "POST", body: JSON.stringify(payload) })).ruleOfLife;
}
