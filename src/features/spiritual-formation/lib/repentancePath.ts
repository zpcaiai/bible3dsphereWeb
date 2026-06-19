// 悔改路径生成器 / Repentance path builder — 纯函数，复用本体 + 模板。
import { strongholdMap } from "../data/strongholds";
import { STAGE_TEMPLATE, ARCHETYPE_PATH, type RepentanceStage } from "../data/repentancePaths";
import { PRAYER_BY_ARCHETYPE } from "../data/gospelResponse";
// @ts-ignore localize.js 为 JS 模块
import { localizeStronghold, pickVal } from "./localize";

export type PathLength = "one_day" | "seven_days" | "thirty_days";

export interface RepentancePathDay {
  day: number;
  stage: RepentanceStage;
  focus: string;
  scriptureTheme: string;
  prayer: string;
  action: string;
  reviewQuestion: string;
}

export interface RepentancePathResult {
  strongholdCode: string;
  title: string;
  length: PathLength;
  focus: { strongholdCode: string; coreLie: string; idol: string; blockedDoctrine: string };
  prayer: { title: string; text: string };
  days: RepentancePathDay[];
  fruitIndicators: string[];
  cautions: string[];
}

const tx = (b?: { zh: string; en: string }) => (b ? pickVal(b.zh, b.en) : "");
const tl = (b?: { zh: string[]; en: string[] }) => (b ? (pickVal(b.zh, b.en) || []) : []);

function fill(text: string, t: Record<string, string>): string {
  return text
    .replace(/\{name\}/g, t.name)
    .replace(/\{idol\}/g, t.idol)
    .replace(/\{lie\}/g, t.lie)
    .replace(/\{truth\}/g, t.truth)
    .replace(/\{doctrine\}/g, t.doctrine);
}

const LENGTH_DAYS: Record<PathLength, number> = { one_day: 1, seven_days: 7, thirty_days: 30 };

export function buildRepentancePath(strongholdCode: string, length: PathLength = "seven_days"): RepentancePathResult | null {
  const raw = strongholdMap[strongholdCode];
  if (!raw) return null;
  const s = localizeStronghold(raw);
  const arch = raw.archetypeCode;

  const tokens = {
    name: s.name,
    idol: (s.rootDesires && s.rootDesires[0]) || s.name,
    lie: s.coreLie,
    truth: s.biblicalCounterTruth,
    doctrine: (s.blockedDoctrines && s.blockedDoctrines[0]?.name) || "",
  };

  const prayerSet = PRAYER_BY_ARCHETYPE[arch];
  const archPath = ARCHETYPE_PATH[arch];
  const totalDays = LENGTH_DAYS[length];

  const dayFromTemplate = (dayNum: number, tmpl: typeof STAGE_TEMPLATE[number]): RepentancePathDay => {
    const focus = tx(tmpl.focus);
    return {
      day: dayNum,
      stage: tmpl.stage,
      focus,
      scriptureTheme: tx(tmpl.scriptureTheme),
      prayer: pickVal(`主啊，求你在「${focus}」上以恩典带领我。`, `Lord, lead me by grace in “${focus}” today.`),
      action: fill(tx(tmpl.action), tokens),
      reviewQuestion: fill(tx(tmpl.reviewQuestion), tokens),
    };
  };

  let days: RepentancePathDay[];
  if (length === "one_day") {
    const focus = pickVal("看见并转向基督", "See it and turn to Christ");
    days = [{
      day: 1,
      stage: "turning",
      focus,
      scriptureTheme: pickVal("基督成为我们的义", "Christ our righteousness"),
      prayer: tx(prayerSet?.title) || pickVal("回到恩典", "Return to grace"),
      action: fill(pickVal(
        "写下一件让「{name}」浮现的事和背后的谎言「{lie}」；默想真理：{truth}；再做一个小小的新顺服。",
        "Write one moment when “{name}” surfaced and the lie “{lie}”; meditate on the truth: {truth}; then do one small act of new obedience.",
      ), tokens),
      reviewQuestion: pickVal("如果这真理是真的，今天我可以放下什么？", "If this truth is real, what can I lay down today?"),
    }];
  } else if (length === "thirty_days") {
    days = [];
    for (let d = 1; d <= 30; d++) {
      const tmpl = d % 7 === 0 ? STAGE_TEMPLATE[6] : STAGE_TEMPLATE[(d - 1) % 7];
      days.push(dayFromTemplate(d, tmpl));
    }
  } else {
    days = STAGE_TEMPLATE.map((tmpl, i) => dayFromTemplate(i + 1, tmpl));
  }

  const title = pickVal(
    `从「${s.name}」回到恩典的 ${totalDays} 天悔改路径`,
    `${totalDays}-day repentance path: from “${s.name}” back to grace`,
  );

  return {
    strongholdCode,
    title,
    length,
    focus: { strongholdCode, coreLie: s.coreLie, idol: tokens.idol, blockedDoctrine: tokens.doctrine },
    prayer: { title: tx(prayerSet?.title), text: tx(prayerSet?.text) },
    days,
    fruitIndicators: tl(archPath?.fruitIndicators),
    cautions: tl(archPath?.cautions),
  };
}
