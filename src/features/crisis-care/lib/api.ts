// Crisis Care API client — talks to backend /api/crisis. Every call degrades
// gracefully: callers should catch and fall back to local data / client triage
// so the crisis flow keeps working when the backend is unreachable.

import { API_BASE } from "../../../api";
import { getToken } from "../../../auth";
import type {
  ComfortResult, Followup, GuardianContact, ResourceBlock, SafetyCheckStep,
  SafetyPlan, TriageResult,
} from "../types/crisis";

async function call(path: string, init: RequestInit = {}, auth = false): Promise<any> {
  const token = auth ? getToken() : null;
  const res = await fetch(`${API_BASE}/crisis${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await res.json() : null;
  if (!res.ok) throw new Error(data?.detail || data?.error || `crisis API ${res.status}`);
  return data;
}

export const crisisApi = {
  triage(message: string, locale?: string, useLLM = true): Promise<TriageResult> {
    return call("/triage", { method: "POST", body: JSON.stringify({ message, locale, useLLM }) });
  },
  safetyCheck(state: string, answerYes: boolean | null): Promise<SafetyCheckStep> {
    return call("/safety-check", { method: "POST", body: JSON.stringify({ state, answerYes }) });
  },
  resources(locale?: string): Promise<ResourceBlock> {
    return call(`/resources${locale ? `?locale=${encodeURIComponent(locale)}` : ""}`);
  },
  pfa(type?: string, cycles = 5): Promise<any> {
    const q = new URLSearchParams();
    if (type) q.set("type", type);
    q.set("cycles", String(cycles));
    return call(`/pfa?${q.toString()}`);
  },
  comfort(type?: string, message?: string): Promise<ComfortResult> {
    const q = new URLSearchParams();
    if (type) q.set("type", type);
    if (message) q.set("message", message);
    return call(`/comfort?${q.toString()}`);
  },
  addiction(domain?: string): Promise<any> {
    return call(`/addiction${domain ? `?domain=${encodeURIComponent(domain)}` : ""}`);
  },
  trauma(): Promise<any> {
    return call("/trauma");
  },
  postCrisis(phase?: string): Promise<any> {
    return call(`/post-crisis${phase ? `?phase=${encodeURIComponent(phase)}` : ""}`);
  },
  escalate(level: string, locale?: string, notifyGuardians = false, eventId?: string): Promise<any> {
    return call("/escalate", {
      method: "POST",
      body: JSON.stringify({ level, locale, notifyGuardians, eventId }),
    }, true);
  },
  meta(): Promise<any> {
    return call("/meta");
  },
  formationSeed(riskTypes?: string[]): Promise<any> {
    return call("/bridge/formation-seed", { method: "POST", body: JSON.stringify({ riskTypes: riskTypes || null }) });
  },

  // ── authenticated, persisted ──────────────────────────────────────────────
  getSafetyPlan(): Promise<{ plan: SafetyPlan | null }> {
    return call("/safety-plan", {}, true);
  },
  safetyPlanTemplate(locale?: string): Promise<SafetyPlan> {
    return call(`/safety-plan/template${locale ? `?locale=${encodeURIComponent(locale)}` : ""}`);
  },
  saveSafetyPlan(plan: SafetyPlan): Promise<{ plan: SafetyPlan }> {
    return call("/safety-plan", { method: "POST", body: JSON.stringify(plan) }, true);
  },
  listGuardians(): Promise<{ items: GuardianContact[] }> {
    return call("/guardians", {}, true);
  },
  addGuardian(g: GuardianContact): Promise<{ guardian: GuardianContact }> {
    return call("/guardians", { method: "POST", body: JSON.stringify(g) }, true);
  },
  updateGuardian(id: string, g: GuardianContact): Promise<{ guardian: GuardianContact }> {
    return call(`/guardians/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(g) }, true);
  },
  deleteGuardian(id: string): Promise<{ ok: boolean }> {
    return call(`/guardians/${encodeURIComponent(id)}`, { method: "DELETE" }, true);
  },
  listFollowups(): Promise<{ items: Followup[] }> {
    return call("/followups", {}, true);
  },
  createFollowup(phase: string, eventId?: string): Promise<{ followup: Followup }> {
    return call("/followups", { method: "POST", body: JSON.stringify({ phase, eventId }) }, true);
  },
  updateFollowup(id: string, completedTaskIds?: string[], status?: string): Promise<{ followup: Followup }> {
    return call(`/followups/${encodeURIComponent(id)}`, {
      method: "PUT", body: JSON.stringify({ completedTaskIds, status }),
    }, true);
  },
  listEvents(): Promise<{ items: any[] }> {
    return call("/events", {}, true);
  },

  // ── caregiver collaboration ───────────────────────────────────────────────
  listShares(): Promise<{ items: any[] }> {
    return call("/shares", {}, true);
  },
  createShare(s: { caregiverEmail: string; caregiverName?: string; caregiverRole?: string; contactPhone?: string; expiresInDays?: number | null; scope?: string[] }): Promise<{ share: any }> {
    return call("/shares", { method: "POST", body: JSON.stringify(s) }, true);
  },
  revokeShare(id: string): Promise<{ ok: boolean }> {
    return call(`/shares/${encodeURIComponent(id)}`, { method: "DELETE" }, true);
  },
  listShareViews(id: string): Promise<{ items: any[] }> {
    return call(`/shares/${encodeURIComponent(id)}/views`, {}, true);
  },
  caregiverIncoming(): Promise<{ items: any[] }> {
    return call("/caregiver/shares", {}, true);
  },
  caregiverView(id: string): Promise<any> {
    return call(`/caregiver/shares/${encodeURIComponent(id)}`, {}, true);
  },
};
