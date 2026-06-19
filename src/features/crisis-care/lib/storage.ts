// Local-first storage for Crisis Care (safety plan + guardian contacts).
// Mirrors the spiritual-formation storage pattern: localStorage is the offline
// source of truth; CrisisCarePage syncs with the backend when a token exists.

import type { GuardianContact, SafetyPlan } from "../types/crisis";

const KEYS = {
  safetyPlan: "crisisCare.safetyPlan",
  guardians: "crisisCare.guardians",
};

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function read<T>(key: string, fallback: T): T {
  if (!hasStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadSafetyPlanLocal(): SafetyPlan | null {
  return read<SafetyPlan | null>(KEYS.safetyPlan, null);
}

export function saveSafetyPlanLocal(plan: SafetyPlan): void {
  write(KEYS.safetyPlan, { ...plan, updatedAt: new Date().toISOString() });
}

export function loadGuardiansLocal(): GuardianContact[] {
  return read<GuardianContact[]>(KEYS.guardians, []);
}

export function saveGuardiansLocal(items: GuardianContact[]): void {
  write(KEYS.guardians, items);
}

export function upsertGuardianLocal(item: GuardianContact): GuardianContact[] {
  const items = loadGuardiansLocal();
  const id = item.id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const next = item.id && items.some((g) => g.id === item.id)
    ? items.map((g) => (g.id === item.id ? { ...item } : g))
    : [{ ...item, id }, ...items];
  saveGuardiansLocal(next);
  return next;
}

export function deleteGuardianLocal(id: string): GuardianContact[] {
  const next = loadGuardiansLocal().filter((g) => g.id !== id);
  saveGuardiansLocal(next);
  return next;
}
