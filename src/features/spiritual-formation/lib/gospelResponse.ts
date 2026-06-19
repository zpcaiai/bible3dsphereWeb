// 福音回应层装配器 / Gospel-response assembler
// 把一次自高之事辨识结果（scanStrongholds 输出）装配成「完整福音回应」：
// 假福音 → 福音更正、被遮蔽真理 + 教导、经文阅读计划、祷告、反思问题、行动回应。
// 纯函数；复用本体（strongholds.ts）+ 回应数据（gospelResponse.ts），不依赖后端/LLM。

import { strongholdMap, DOCTRINE_NAMES } from "../data/strongholds";
import type { DoctrineCode } from "../data/strongholds";
import { PRAYER_BY_ARCHETYPE, DOCTRINE_RESPONSE, FALSE_GOSPEL_LABEL, type PrayerType } from "../data/gospelResponse";
import { mapScriptureThemes, type MappedTheme } from "./scriptureThemeMapper";
// @ts-ignore localize.js 为 JS 模块
import { localizeStronghold, pickVal } from "./localize";
import type { StrongholdScanResult } from "./strongholdDiscernment";

const tx = (b?: { zh: string; en: string }) => (b ? pickVal(b.zh, b.en) : "");
const tl = (b?: { zh: string[]; en: string[] }) => (b ? (pickVal(b.zh, b.en) || []) : []);

export interface GospelResponsePlan {
  primaryStrongholdCode: string;
  primaryStrongholdName: string;

  falseGospel: {
    label: string;
    falsePromise: string;
    gospelCorrection: string;
  };

  blockedDoctrine: {
    code: DoctrineCode;
    name: string;
    teachingTheme: string;
    healingTruth: string;
    reflectionQuestion: string;
    alsoBlocked: { code: string; name: string }[];
  };

  scriptureThemes: MappedTheme[];
  scripturePlan: {
    title: string;
    days: {
      day: number;
      themeCode?: string;
      reference: string;
      text: string;
      meditationQuestion: string;
      prayerPrompt: string;
    }[];
  };

  prayer: {
    type: PrayerType;
    title: string;
    text: string;
  };

  reflectionQuestions: string[];

  action: {
    today: string;
    thisWeek: string;
  };
}


/**
 * 从辨识结果装配福音回应。无明显信号或处于危机时返回 null（由 UI 决定如何呈现）。
 */
export function buildGospelResponse(scan: StrongholdScanResult): GospelResponsePlan | null {
  if (!scan || scan.safety.level === "crisis" || !scan.hasSignal || !scan.primary) return null;

  const primaryRaw = strongholdMap[scan.primary.code];
  if (!primaryRaw) return null;
  const primary = localizeStronghold(primaryRaw);
  const archetypeCode = primaryRaw.archetypeCode;

  // 祷告 / 反思 / 行动（按原型）
  const prayerSet = PRAYER_BY_ARCHETYPE[archetypeCode];

  // 假福音
  const falseGospel = {
    label: tx(FALSE_GOSPEL_LABEL[primaryRaw.code]),
    falsePromise: primary.falseGospel,
    gospelCorrection: primary.biblicalCounterTruth,
  };

  // 被遮蔽真理（主 + 其余）
  const blockedCode = (scan.rootDiagnosis.blockedDoctrineCode || primaryRaw.blockedDoctrines[0]) as DoctrineCode;
  const dResp = DOCTRINE_RESPONSE[blockedCode];
  const blockedDoctrine = {
    code: blockedCode,
    name: tx(DOCTRINE_NAMES[blockedCode]),
    teachingTheme: tx(dResp?.teachingTheme),
    healingTruth: primary.biblicalCounterTruth,
    reflectionQuestion: tx(dResp?.reflectionQuestion),
    alsoBlocked: (primary.blockedDoctrines || [])
      .filter((d: { code: string }) => d.code !== blockedCode)
      .map((d: { code: string; name: string }) => ({ code: d.code, name: d.name })),
  };

  // 经文主题映射 → doctrine-aware 读经计划
  const needType =
    archetypeCode === "wounded_unbelief" ? "comfort"
      : archetypeCode === "religious_self_righteousness" ? "repentance"
        : undefined;
  const themeResult = mapScriptureThemes({
    strongholdCodes: scan.detected.map((d) => d.code),
    doctrineCodes: (primary.blockedDoctrines || []).map((d: { code: string }) => d.code),
    needType,
  });

  // 反思问题：教义反思 + 原型反思（去重，最多 4 条）
  const reflectionRaw = [tx(dResp?.reflectionQuestion), ...tl(prayerSet?.reflectionQuestions)].filter(Boolean);
  const reflectionQuestions = [...new Set(reflectionRaw)].slice(0, 4);

  return {
    primaryStrongholdCode: primaryRaw.code,
    primaryStrongholdName: primary.name,
    falseGospel,
    blockedDoctrine,
    scriptureThemes: themeResult.themes,
    scripturePlan: themeResult.readingPlan,
    prayer: {
      type: prayerSet?.type ?? "confession",
      title: tx(prayerSet?.title),
      text: tx(prayerSet?.text),
    },
    reflectionQuestions,
    action: {
      today: tx(prayerSet?.todayAction),
      thisWeek: tx(prayerSet?.weekPractice),
    },
  };
}
