import type { DailyExamen, GraceRecoveryEntry, HolyLifeDayLog, HorariumDayLog, ThoughtCaptiveEntry, TransformationPlan } from "../types/spiritualFormation";
import { DailyExamenSchema, GraceRecoveryEntrySchema, HolyLifeDayLogSchema, ThoughtCaptiveEntrySchema, TransformationPlanSchema } from "../types/spiritualFormationSchemas";

export const DEFAULT_USER_ID = "local-user";

export const STORAGE_KEYS = {
  dailyExamens: "spiritualFormation.dailyExamens",
  thoughtCaptiveEntries: "spiritualFormation.thoughtCaptiveEntries",
  graceRecoveryEntries: "spiritualFormation.graceRecoveryEntries",
  transformationPlans: "spiritualFormation.transformationPlans",
  holyLifeDayLogs: "spiritualFormation.holyLifeDayLogs",
  horariumDayLogs: "spiritualFormation.horariumDayLogs",
} as const;

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readList<T>(key: string): T[] {
  if (!hasStorage()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, items: T[]) {
  if (!hasStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(items));
}

function upsert<T extends { id: string }>(key: string, entry: T) {
  const items = readList<T>(key);
  const next = items.some((item) => item.id === entry.id)
    ? items.map((item) => item.id === entry.id ? entry : item)
    : [entry, ...items];
  writeList(key, next);
}

function validateOrThrow<T>(schema: { parse(value: unknown): T }, value: unknown): T {
  try {
    return schema.parse(value);
  } catch (error) {
    if (import.meta.env?.DEV && import.meta.env?.MODE !== "test") console.error("[spiritual-formation] validation failed", error, value);
    throw new Error("We could not save this entry. Please try again.");
  }
}

export function saveDailyExamen(entry: DailyExamen): void {
  upsert(STORAGE_KEYS.dailyExamens, validateOrThrow(DailyExamenSchema, entry));
}

export function listDailyExamens(userId: string): DailyExamen[] {
  return readList<DailyExamen>(STORAGE_KEYS.dailyExamens).filter((entry) => entry.userId === userId);
}

export function getDailyExamen(id: string): DailyExamen | null {
  return readList<DailyExamen>(STORAGE_KEYS.dailyExamens).find((entry) => entry.id === id) ?? null;
}

export function deleteDailyExamen(id: string): void {
  writeList(STORAGE_KEYS.dailyExamens, readList<DailyExamen>(STORAGE_KEYS.dailyExamens).filter((entry) => entry.id !== id));
}

export function saveThoughtCaptiveEntry(entry: ThoughtCaptiveEntry): void {
  upsert(STORAGE_KEYS.thoughtCaptiveEntries, validateOrThrow(ThoughtCaptiveEntrySchema, entry));
}

export function listThoughtCaptiveEntries(userId: string): ThoughtCaptiveEntry[] {
  return readList<ThoughtCaptiveEntry>(STORAGE_KEYS.thoughtCaptiveEntries).filter((entry) => entry.userId === userId);
}

export function saveGraceRecoveryEntry(entry: GraceRecoveryEntry): void {
  upsert(STORAGE_KEYS.graceRecoveryEntries, validateOrThrow(GraceRecoveryEntrySchema, entry));
}

export function listGraceRecoveryEntries(userId: string): GraceRecoveryEntry[] {
  return readList<GraceRecoveryEntry>(STORAGE_KEYS.graceRecoveryEntries).filter((entry) => entry.userId === userId);
}

export function saveTransformationPlan(plan: TransformationPlan): void {
  const validated = validateOrThrow(TransformationPlanSchema, plan);
  const plans = readList<TransformationPlan>(STORAGE_KEYS.transformationPlans);
  const next = plans.map((item) =>
    item.userId === validated.userId && item.status === "active" && item.id !== validated.id
      ? { ...item, status: "paused" as const, updatedAt: new Date().toISOString() }
      : item,
  );
  writeList(STORAGE_KEYS.transformationPlans, next);
  upsert(STORAGE_KEYS.transformationPlans, validated);
}

export function listTransformationPlans(userId: string): TransformationPlan[] {
  return readList<TransformationPlan>(STORAGE_KEYS.transformationPlans).filter((entry) => entry.userId === userId);
}

export function getActiveTransformationPlan(userId: string): TransformationPlan | null {
  return listTransformationPlans(userId).find((plan) => plan.status === "active") ?? null;
}

export function updateTransformationPlan(plan: TransformationPlan): void {
  upsert(STORAGE_KEYS.transformationPlans, validateOrThrow(TransformationPlanSchema, plan));
}

export function saveHolyLifeDayLog(log: HolyLifeDayLog): void {
  upsert(STORAGE_KEYS.holyLifeDayLogs, validateOrThrow(HolyLifeDayLogSchema, log));
}

export function listHolyLifeDayLogs(userId: string): HolyLifeDayLog[] {
  return readList<HolyLifeDayLog>(STORAGE_KEYS.holyLifeDayLogs)
    .filter((entry) => entry.userId === userId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getHolyLifeDayLog(userId: string, date: string): HolyLifeDayLog | null {
  return listHolyLifeDayLogs(userId).find((entry) => entry.date === date) ?? null;
}

export function saveHorariumDayLog(log: HorariumDayLog): void {
  upsert(STORAGE_KEYS.horariumDayLogs, log);
}

export function listHorariumDayLogs(userId: string): HorariumDayLog[] {
  return readList<HorariumDayLog>(STORAGE_KEYS.horariumDayLogs)
    .filter((entry) => entry.userId === userId)
    .sort((a, b) => b.date.localeCompare(a.date));
}
