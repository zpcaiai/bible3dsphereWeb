// 自高之事成长追踪（本地优先）/ Stronghold growth tracking (local-first)
// 把每次「自我辨识」结果存入 localStorage，并提供纯函数聚合成 7/30/90 天趋势与触发模式。
// I/O 与聚合分离：聚合函数是纯函数（输入记录数组），便于单元测试。

import { strongholdMap } from "../data/strongholds";
import type { StrongholdScanResult } from "./strongholdDiscernment";

export const STRONGHOLD_HISTORY_KEY = "spiritualFormation.strongholdScans";
const DEFAULT_USER_ID = "local-user";

export type TriggerType =
  | "criticism" | "failure" | "uncertainty" | "comparison" | "rejection"
  | "loneliness" | "fatigue" | "conflict" | "temptation" | "success"
  | "financial_pressure" | "family_pressure" | "church_hurt"
  | "suffering_event" | "spiritual_dryness";

export interface StrongholdScanRecord {
  id: string;
  userId: string;
  date: string; // ISO
  text: string;
  emotions: string[];
  primaryCode: string | null;
  detectedCodes: string[];
  archetypeCode: string | null;
  blockedDoctrineCode: string | null;
  triggerType: TriggerType | null;
  confidence: number;
}

// ── 触发器标签 + 介入（双语）/ Trigger labels + intervention ──
export const TRIGGER_LABEL: Record<TriggerType, { zh: string; en: string }> = {
  criticism: { zh: "被批评", en: "Criticism" },
  failure: { zh: "失败", en: "Failure" },
  uncertainty: { zh: "不确定", en: "Uncertainty" },
  comparison: { zh: "比较", en: "Comparison" },
  rejection: { zh: "被拒绝", en: "Rejection" },
  loneliness: { zh: "孤独", en: "Loneliness" },
  fatigue: { zh: "疲惫", en: "Fatigue" },
  conflict: { zh: "冲突", en: "Conflict" },
  temptation: { zh: "试探", en: "Temptation" },
  success: { zh: "成功后", en: "After success" },
  financial_pressure: { zh: "财务压力", en: "Financial pressure" },
  family_pressure: { zh: "家庭压力", en: "Family pressure" },
  church_hurt: { zh: "教会伤害", en: "Church hurt" },
  suffering_event: { zh: "苦难事件", en: "Suffering" },
  spiritual_dryness: { zh: "灵性枯干", en: "Spiritual dryness" },
};

export const TRIGGER_INTERVENTION: Record<string, { microPrayer: { zh: string; en: string } }> = {
  uncertainty: { microPrayer: { zh: "主啊，我愿意尽责，也愿意承认我不是掌管万有的主。", en: "Lord, I will do my part, and admit I am not the Lord of all." } },
  criticism: { microPrayer: { zh: "主啊，帮助我先回到你给我的身份，而不是立刻自我保护。", en: "Lord, help me return to the identity you give me before I defend myself." } },
  comparison: { microPrayer: { zh: "主啊，释放我脱离比较，让我能为别人的恩赐感恩。", en: "Lord, free me from comparison; let me give thanks for others' gifts." } },
  failure: { microPrayer: { zh: "主啊，我的价值不在于成败，而在于你的接纳。", en: "Lord, my worth is not in success or failure but in your acceptance." } },
  loneliness: { microPrayer: { zh: "主啊，我现在感到孤独，求你帮助我转向你和真实关系，而非麻醉。", en: "Lord, I feel alone; help me turn to you and real relationships, not numbing." } },
  suffering_event: { microPrayer: { zh: "主啊，我把真实的痛苦带到你面前，求你在十字架上与我同在。", en: "Lord, I bring my honest pain to you; meet me at the cross." } },
  church_hurt: { microPrayer: { zh: "主啊，你不站在伤害我的人那一边，求你保守也医治我。", en: "Lord, you are not on the side of those who hurt me; keep and heal me." } },
};

const TRIGGER_RULES: { type: TriggerType; keywords: string[] }[] = [
  { type: "criticism", keywords: ["被批评", "被指责", "否定我", "挑毛病", "说我不行", "criticiz", "blamed", "put me down"] },
  { type: "comparison", keywords: ["别人比我", "比我强", "同事", "同学", "比较", "羡慕", "嫉妒", "compar", "envy", "jealous"] },
  { type: "failure", keywords: ["失败", "没做好", "搞砸", "输了", "不如预期", "fail", "messed up", "lost"] },
  { type: "uncertainty", keywords: ["不确定", "不知道会怎样", "失控", "没把握", "风险", "uncertain", "out of control", "risk"] },
  { type: "rejection", keywords: ["被拒绝", "被抛弃", "不被需要", "被排斥", "reject", "abandon", "left out"] },
  { type: "loneliness", keywords: ["孤独", "没人理解", "没人陪", "寂寞", "lonely", "no one", "alone"] },
  { type: "church_hurt", keywords: ["教会伤害", "牧者", "弟兄姐妹", "被论断", "教会让我", "church hurt", "pastor", "judged"] },
  { type: "suffering_event", keywords: ["受苦", "为什么", "失去", "病", "去世", "苦难", "suffer", "why me", "loss", "grief"] },
  { type: "temptation", keywords: ["试探", "忍不住", "上瘾", "色情", "tempt", "can't resist", "porn", "addict"] },
  { type: "conflict", keywords: ["吵架", "冲突", "对立", "矛盾", "conflict", "argument", "fight"] },
  { type: "fatigue", keywords: ["疲惫", "累", "倦怠", "撑不住", "exhausted", "burned out", "tired"] },
  { type: "financial_pressure", keywords: ["钱", "财务", "收入", "债", "money", "financial", "debt"] },
  { type: "family_pressure", keywords: ["父母", "家里", "家人", "婚姻", "孩子", "family", "parents", "marriage"] },
  { type: "success", keywords: ["升职", "成功了", "做成了", "得奖", "promoted", "achieved", "won"] },
  { type: "spiritual_dryness", keywords: ["枯干", "不想祷告", "读不下去", "冷淡", "dry", "don't want to pray", "distant from god"] },
];

export function inferTriggerType(text: string): TriggerType | null {
  const t = String(text || "").toLowerCase();
  for (const rule of TRIGGER_RULES) {
    if (rule.keywords.some((k) => t.includes(k.toLowerCase()))) return rule.type;
  }
  return null;
}

// 从一次辨识结果构造记录 / Build a record from a scan result.
export function recordFromScan(
  userId: string,
  text: string,
  emotions: string[],
  scan: StrongholdScanResult,
  date: Date = new Date(),
): StrongholdScanRecord {
  const primaryCode = scan.primary?.code ?? null;
  const archetypeCode = primaryCode ? (strongholdMap[primaryCode]?.archetypeCode ?? null) : null;
  return {
    id: `${userId}-${date.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    date: date.toISOString(),
    text,
    emotions: emotions ?? [],
    primaryCode,
    detectedCodes: scan.detected.map((d) => d.code),
    archetypeCode,
    blockedDoctrineCode: scan.rootDiagnosis.blockedDoctrineCode ?? null,
    triggerType: inferTriggerType(text),
    confidence: scan.primary?.confidence ?? 0,
  };
}

// ── localStorage I/O ──
function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}
function readAll(): StrongholdScanRecord[] {
  if (!hasStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STRONGHOLD_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as StrongholdScanRecord[]) : [];
  } catch {
    return [];
  }
}
function writeAll(items: StrongholdScanRecord[]) {
  if (!hasStorage()) return;
  window.localStorage.setItem(STRONGHOLD_HISTORY_KEY, JSON.stringify(items));
}
export function saveScanRecord(record: StrongholdScanRecord): void {
  // 仅保存有信号的记录（避免噪音）
  if (!record.primaryCode) return;
  writeAll([record, ...readAll()].slice(0, 500));
}
export function listScanRecords(userId: string = DEFAULT_USER_ID): StrongholdScanRecord[] {
  return readAll().filter((r) => r.userId === userId);
}
export function clearScanRecords(userId: string = DEFAULT_USER_ID): void {
  writeAll(readAll().filter((r) => r.userId !== userId));
}

// ── 纯聚合 / Pure aggregation ──
export interface StrongholdHistorySummary {
  rangeDays: number;
  totalScans: number;
  topStrongholds: { code: string; count: number; trend: "rising" | "falling" | "stable" }[];
  archetypeDistribution: { code: string; count: number }[];
  topTriggers: { type: TriggerType; count: number; linkedStrongholds: string[] }[];
  topEmotions: { emotion: string; count: number }[];
  recent: StrongholdScanRecord[];
}

function sortedCounts<T extends string>(m: Map<T, number>): { key: T; count: number }[] {
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, count }));
}

export function summarizeStrongholdHistory(
  records: StrongholdScanRecord[],
  rangeDays = 30,
  now: number = Date.now(),
): StrongholdHistorySummary {
  const cutoff = now - rangeDays * 24 * 60 * 60 * 1000;
  const inRange = records
    .filter((r) => Date.parse(r.date) >= cutoff)
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  const mid = cutoff + (now - cutoff) / 2;

  const strongholdCount = new Map<string, number>();
  const earlyCount = new Map<string, number>();
  const lateCount = new Map<string, number>();
  const archetypeCount = new Map<string, number>();
  const triggerCount = new Map<TriggerType, number>();
  const triggerLinks = new Map<TriggerType, Set<string>>();
  const emotionCount = new Map<string, number>();

  for (const r of inRange) {
    if (r.primaryCode) {
      strongholdCount.set(r.primaryCode, (strongholdCount.get(r.primaryCode) ?? 0) + 1);
      const half = Date.parse(r.date) < mid ? earlyCount : lateCount;
      half.set(r.primaryCode, (half.get(r.primaryCode) ?? 0) + 1);
    }
    if (r.archetypeCode) archetypeCount.set(r.archetypeCode, (archetypeCount.get(r.archetypeCode) ?? 0) + 1);
    if (r.triggerType) {
      triggerCount.set(r.triggerType, (triggerCount.get(r.triggerType) ?? 0) + 1);
      if (!triggerLinks.has(r.triggerType)) triggerLinks.set(r.triggerType, new Set());
      if (r.primaryCode) triggerLinks.get(r.triggerType)!.add(r.primaryCode);
    }
    for (const e of r.emotions) emotionCount.set(e, (emotionCount.get(e) ?? 0) + 1);
  }

  const topStrongholds = sortedCounts(strongholdCount).map(({ key, count }) => {
    const early = earlyCount.get(key) ?? 0;
    const late = lateCount.get(key) ?? 0;
    let trend: "rising" | "falling" | "stable" = "stable";
    if (count >= 2) {
      if (late > early) trend = "rising";
      else if (early > late) trend = "falling";
    }
    return { code: key, count, trend };
  });

  return {
    rangeDays,
    totalScans: inRange.length,
    topStrongholds,
    archetypeDistribution: sortedCounts(archetypeCount).map(({ key, count }) => ({ code: key, count })),
    topTriggers: sortedCounts(triggerCount).map(({ key, count }) => ({
      type: key,
      count,
      linkedStrongholds: [...(triggerLinks.get(key) ?? [])],
    })),
    topEmotions: sortedCounts(emotionCount).map(({ key, count }) => ({ emotion: key, count })),
    recent: [...inRange].reverse().slice(0, 10),
  };
}

// ── 本周关注点 / Gentle weekly growth insight（纯函数，返回代码与枚举，文案交给渲染层）──
export interface GrowthInsight {
  hasData: boolean;
  focus?: {
    strongholdCode: string;
    trend: "rising" | "falling" | "stable";
    topTrigger: TriggerType | null;
    count: number;
  };
  growthSignals: { strongholdCode: string }[]; // 近期出现减少的模式（成长信号）
  watchPoints: { strongholdCode: string; trigger: TriggerType | null }[]; // 仍较常出现，值得留意
}

export function buildGrowthInsight(summary: StrongholdHistorySummary): GrowthInsight {
  if (!summary || summary.totalScans < 2 || summary.topStrongholds.length === 0) {
    return { hasData: false, growthSignals: [], watchPoints: [] };
  }

  // 该模式最相关的触发：在 topTriggers 中找 linkedStrongholds 含此 code、次数最多者
  const triggerFor = (code: string): TriggerType | null => {
    let best: { type: TriggerType; count: number } | null = null;
    for (const t of summary.topTriggers) {
      if (t.linkedStrongholds.includes(code) && (!best || t.count > best.count)) best = { type: t.type, count: t.count };
    }
    return best?.type ?? summary.topTriggers[0]?.type ?? null;
  };

  const top = summary.topStrongholds[0];
  const focus = {
    strongholdCode: top.code,
    trend: top.trend,
    topTrigger: triggerFor(top.code),
    count: top.count,
  };

  const growthSignals = summary.topStrongholds
    .filter((s) => s.trend === "falling")
    .map((s) => ({ strongholdCode: s.code }));

  const watchPoints = summary.topStrongholds
    .filter((s) => s.trend !== "falling")
    .slice(0, 2)
    .map((s) => ({ strongholdCode: s.code, trigger: triggerFor(s.code) }));

  return { hasData: true, focus, growthSignals, watchPoints };
}
