// 自高之事辨识引擎 / Stronghold discernment engine
// (Skills: core-lie-detection + idol-desire-fear + false-gospel + blocked-doctrine, MVP 规则版)
//
// 纯函数、可测试、无 React 依赖。第一版用「加权规则匹配」而非 LLM，
// 以便前端本地、离线可用；后续可在此结果上叠加语义/LLM 打分。
// 输出以「代码 + 证据 + 置信度」为主，文案本地化交给渲染层（localizeStronghold）。

import { strongholds, strongholdMap, type Stronghold, type StrongholdId } from "../data/strongholds";

export interface StrongholdScanInput {
  text: string;
  emotions?: string[]; // 用户勾选的情绪（中文或英文标签皆可）
  desires?: string[]; // 可选：用户勾选「最想抓住」
  fears?: string[]; // 可选：用户勾选「最怕失去」
}

export interface DetectedStronghold {
  code: StrongholdId;
  score: number; // 原始加权分
  confidence: number; // 0..1
  evidence: string[]; // 命中的关键词/短语（取自数据或用户文本）
}

export type SafetyLevel = "none" | "crisis";

export interface StrongholdScanResult {
  safety: { level: SafetyLevel; message: string | null };
  detected: DetectedStronghold[]; // 由高到低，最多 topN
  primary: DetectedStronghold | null;
  // 根因诊断：均为代码，渲染层据此从 strongholdMap 取本地化文案
  rootDiagnosis: {
    primaryStrongholdCode: StrongholdId | null;
    archetypeCode: string | null;
    blockedDoctrineCode: string | null;
    // 跨模式聚合的欲望/恐惧（取英文 canonical，稳定且语言无关，便于测试）
    dominantDesires: string[];
    dominantFears: string[];
  };
  hasSignal: boolean; // 是否检出明显模式
}

// 危机/自伤信号 / crisis & self-harm signals（中英）
const CRISIS_KEYWORDS = [
  "不想活", "活着没意思", "活着没有意义", "想死", "结束生命", "结束这一切", "自杀",
  "伤害自己", "撑不下去", "了结自己", "没有人会在乎我死",
  "suicide", "kill myself", "end my life", "end it all", "don't want to live",
  "want to die", "hurt myself", "harm myself", "can't go on",
];

const ABUSE_KEYWORDS = ["家暴", "被虐待", "被打", "性侵", "abuse", "abused", "beaten", "assaulted"];

const DEFAULT_TOP_N = 3;

function norm(s: string): string {
  return String(s || "").toLowerCase();
}

function includesAny(haystack: string, needles: string[]): string[] {
  const hit: string[] = [];
  for (const n of needles) {
    const k = norm(n);
    if (k && haystack.includes(k)) hit.push(n);
  }
  return hit;
}

// 评分一个自高之事 / score a single stronghold against the input
function scoreStronghold(s: Stronghold, ctx: {
  text: string;
  emotions: string[];
  desires: string[];
  fears: string[];
}): { score: number; evidence: string[] } {
  let score = 0;
  const evidence = new Set<string>();
  const { text } = ctx;

  // 1) 例句短语命中（最强信号）
  for (const lang of ["zh", "en"] as const) {
    for (const phrase of s.exampleUserPhrases[lang]) {
      const p = norm(phrase);
      // 短语整体较长，做「关键片段」近似：命中其中较长的子串即可
      if (p.length >= 4 && text.includes(p)) {
        score += 5;
        evidence.add(phrase);
      }
    }
  }

  // 2) 关键词命中
  const kw = includesAny(text, s.detectionKeywords);
  score += kw.length * 3;
  kw.forEach((k) => evidence.add(k));

  // 3) 根欲望 / 根恐惧 出现在自由文本里
  for (const lang of ["zh", "en"] as const) {
    includesAny(text, s.rootDesires[lang]).forEach((d) => { score += 2; evidence.add(d); });
    includesAny(text, s.rootFears[lang]).forEach((f) => { score += 2; evidence.add(f); });
  }

  // 4) 认知/情绪/行为信号词出现
  for (const lang of ["zh", "en"] as const) {
    includesAny(text, s.cognitiveSignals[lang]).forEach((x) => { score += 1; evidence.add(x); });
    includesAny(text, s.emotionalSignals[lang]).forEach((x) => { score += 1; evidence.add(x); });
    includesAny(text, s.behavioralSignals[lang]).forEach((x) => { score += 1; evidence.add(x); });
  }

  // 5) 勾选的情绪 与 该模式的情绪信号 重叠
  if (ctx.emotions.length) {
    const emo = new Set([...s.emotionalSignals.zh, ...s.emotionalSignals.en].map(norm));
    for (const e of ctx.emotions) {
      if (emo.has(norm(e))) { score += 2; evidence.add(e); }
    }
  }
  // 6) 勾选的欲望 / 恐惧 与该模式重叠
  if (ctx.desires.length) {
    const des = new Set([...s.rootDesires.zh, ...s.rootDesires.en].map(norm));
    for (const d of ctx.desires) if (des.has(norm(d))) { score += 2; evidence.add(d); }
  }
  if (ctx.fears.length) {
    const frs = new Set([...s.rootFears.zh, ...s.rootFears.en].map(norm));
    for (const f of ctx.fears) if (frs.has(norm(f))) { score += 2; evidence.add(f); }
  }

  return { score, evidence: [...evidence] };
}

/**
 * 运行一次自高之事辨识 / Run one stronghold scan.
 * 纯函数，可在前端本地直接调用，也便于单元测试。
 */
export function scanStrongholds(input: StrongholdScanInput, topN = DEFAULT_TOP_N): StrongholdScanResult {
  const text = norm(input.text);
  const emotions = input.emotions ?? [];
  const desires = input.desires ?? [];
  const fears = input.fears ?? [];

  // ── 牧养安全：危机优先 / pastoral safety: crisis first ──
  const crisisHit = includesAny(text, CRISIS_KEYWORDS).length > 0;
  const abuseHit = includesAny(text, ABUSE_KEYWORDS).length > 0;
  if (crisisHit || abuseHit) {
    return {
      safety: {
        level: "crisis",
        message:
          "你现在的安全比继续分析更重要。如果你正想伤害自己或处在危险中，请立刻联系当地紧急服务、一位你信任的家人或朋友，或当地的危机热线，不要独自一人。这个工具不能替代真实的人和专业的帮助。" +
          " / Your safety matters more than any analysis right now. If you may harm yourself or are in danger, please contact local emergency services, a trusted person, or a crisis line now, and do not stay alone.",
      },
      detected: [],
      primary: null,
      rootDiagnosis: {
        primaryStrongholdCode: null,
        archetypeCode: null,
        blockedDoctrineCode: null,
        dominantDesires: [],
        dominantFears: [],
      },
      hasSignal: false,
    };
  }

  const ctx = { text, emotions, desires, fears };
  const scored = strongholds
    .map((s) => {
      const { score, evidence } = scoreStronghold(s, ctx);
      return {
        code: s.code,
        score,
        confidence: Math.min(1, score / 10),
        evidence,
      } as DetectedStronghold;
    })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score);

  const detected = scored.slice(0, topN);
  const primary = detected[0] ?? null;
  const primaryPattern = primary ? strongholdMap[primary.code] : null;

  // 跨 top 模式聚合主导欲望/恐惧（英文 canonical）
  const desireCount = new Map<string, number>();
  const fearCount = new Map<string, number>();
  for (const d of detected) {
    const p = strongholdMap[d.code];
    if (!p) continue;
    p.rootDesires.en.forEach((x) => desireCount.set(x, (desireCount.get(x) ?? 0) + 1));
    p.rootFears.en.forEach((x) => fearCount.set(x, (fearCount.get(x) ?? 0) + 1));
  }
  const topByCount = (m: Map<string, number>, n: number) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);

  return {
    safety: { level: "none", message: null },
    detected,
    primary,
    rootDiagnosis: {
      primaryStrongholdCode: primary?.code ?? null,
      archetypeCode: primaryPattern?.archetypeCode ?? null,
      blockedDoctrineCode: primaryPattern?.blockedDoctrines[0] ?? null,
      dominantDesires: primaryPattern ? topByCount(desireCount, 3) : [],
      dominantFears: primaryPattern ? topByCount(fearCount, 3) : [],
    },
    hasSignal: detected.length > 0,
  };
}
