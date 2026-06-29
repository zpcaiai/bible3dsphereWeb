import type { HorariumDayLog, HorariumPrayerEntry } from "../types/spiritualFormation";
import { horariumHours } from "../data/horariumHours";

export function horariumTodayKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createHorariumDayLog(userId: string, date: string = horariumTodayKey()): HorariumDayLog {
  const now = new Date().toISOString();
  return {
    id: `horarium_${userId}_${date}`,
    userId,
    date,
    entries: horariumHours.map((hour) => ({
      hourId: hour.id,
      completed: false,
      reflection: "",
      completedAt: "",
    })),
    note: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function ensureHorariumEntries(log: HorariumDayLog): HorariumDayLog {
  const existing = new Map((log.entries || []).map((entry) => [entry.hourId, entry]));
  return {
    ...log,
    entries: horariumHours.map(
      (hour) =>
        existing.get(hour.id) || { hourId: hour.id, completed: false, reflection: "", completedAt: "" },
    ),
    note: log.note || "",
  };
}

function dayKey(value: Date): string {
  return horariumTodayKey(value);
}

export type HorariumStreak = { current: number; longest: number; total: number };

// Mirrors backend spiritual_formation_engine.compute_streak.
export function computeHorariumStreak(logs: HorariumDayLog[], today: Date = new Date()): HorariumStreak {
  const active = new Set(
    (logs || [])
      .filter((log) => (log.entries || []).some((entry) => entry.completed))
      .map((log) => log.date),
  );
  const total = active.size;
  if (!total) return { current: 0, longest: 0, total: 0 };

  const sorted = [...active].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00`);
    const cur = new Date(`${sorted[i]}T00:00:00`);
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    run = diff === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  const anchorBase = new Date(today);
  anchorBase.setHours(0, 0, 0, 0);
  let anchor = active.has(dayKey(anchorBase))
    ? anchorBase
    : new Date(anchorBase.getTime() - 86400000);
  let current = 0;
  while (active.has(dayKey(anchor))) {
    current += 1;
    anchor = new Date(anchor.getTime() - 86400000);
  }

  return { current, longest, total };
}

export function horariumCompletedCount(log: HorariumDayLog): number {
  return (log.entries || []).filter((entry: HorariumPrayerEntry) => entry.completed).length;
}
