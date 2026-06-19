// 经文主题映射器 / Scripture theme mapper — 纯函数，按诊断给经文主题打分并排名。
import { scriptureThemes, type ScriptureTheme, type ScriptureUseCase } from "../data/scriptureThemes";
// @ts-ignore localize.js 为 JS 模块
import { pickVal } from "./localize";

export type NeedType = "comfort" | "correction" | "teaching" | "repentance" | "hope" | undefined;

export interface ScriptureThemeInput {
  strongholdCodes?: string[];
  doctrineCodes?: string[];
  needType?: NeedType;
  count?: number;
  planDays?: number;
}

export interface MappedPassage {
  reference: string;
  text: string;
  themeReason: string;
  useCase: ScriptureUseCase;
}

export interface MappedTheme {
  code: string;
  name: string;
  reason: string;
  relevanceScore: number;
  primaryPassages: MappedPassage[];
  meditationQuestions: string[];
  prayerPrompt: string;
  practiceSuggestion: string;
}

export interface ScriptureReadingPlanDay {
  day: number;
  themeCode: string;
  reference: string;
  text: string;
  meditationQuestion: string;
  prayerPrompt: string;
}

export interface ScriptureThemeResult {
  themes: MappedTheme[];
  readingPlan: { title: string; days: ScriptureReadingPlanDay[] };
}

const tx = (b?: { zh: string; en: string }) => (b ? pickVal(b.zh, b.en) : "");
const tl = (b?: { zh: string[]; en: string[] }) => (b ? (pickVal(b.zh, b.en) || []) : []);
const overlap = (a: string[] = [], b: string[] = []) => {
  const setB = new Set(b);
  return a.reduce((n, x) => n + (setB.has(x) ? 1 : 0), 0);
};

const NEED_USECASES: Record<string, ScriptureUseCase[]> = {
  comfort: ["comfort", "lament"],
  repentance: ["repentance", "correction"],
  hope: ["hope"],
  teaching: ["teaching"],
  correction: ["correction"],
};

function scoreTheme(theme: ScriptureTheme, input: ScriptureThemeInput): number {
  let score = 0;
  score += overlap(theme.strongholdCodes, input.strongholdCodes) * 5;
  score += overlap(theme.doctrineCodes, input.doctrineCodes) * 5;
  score += theme.priority;
  const needCases = input.needType ? NEED_USECASES[input.needType] : undefined;
  if (needCases && theme.passages.some((p) => needCases.includes(p.useCase))) {
    score += input.needType === "teaching" ? 1 : 3;
  }
  return score;
}

function localizeTheme(theme: ScriptureTheme, score: number): MappedTheme {
  return {
    code: theme.code,
    name: tx(theme.name),
    reason: tx(theme.summary),
    relevanceScore: score,
    primaryPassages: theme.passages.map((p) => ({
      reference: p.reference,
      text: tx(p.text),
      themeReason: tx(p.themeReason),
      useCase: p.useCase,
    })),
    meditationQuestions: tl(theme.meditationQuestions),
    prayerPrompt: tl(theme.prayerPrompts)[0] || "",
    practiceSuggestion: tl(theme.practiceSuggestions)[0] || "",
  };
}

/** 把诊断映射到经文主题与一个简短读经计划。纯函数。 */
export function mapScriptureThemes(input: ScriptureThemeInput): ScriptureThemeResult {
  const count = input.count ?? 3;
  const planDays = input.planDays ?? 5;

  const ranked = scriptureThemes
    .map((theme) => ({ theme, score: scoreTheme(theme, input) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((x) => localizeTheme(x.theme, x.score));

  // 读经计划：跨主题取段落（按 reference 去重），最多 planDays 天
  const seen = new Set<string>();
  const days: ScriptureReadingPlanDay[] = [];
  let passIdx = 0;
  while (days.length < planDays && passIdx < 3) {
    for (const t of ranked) {
      const p = t.primaryPassages[passIdx];
      if (!p || seen.has(p.reference) || days.length >= planDays) continue;
      seen.add(p.reference);
      days.push({
        day: days.length + 1,
        themeCode: t.code,
        reference: p.reference,
        text: p.text,
        meditationQuestion: t.meditationQuestions[0] || p.themeReason,
        prayerPrompt: t.prayerPrompt,
      });
    }
    passIdx += 1;
  }

  const title = pickVal(
    `${days.length} 天经文默想计划`,
    `${days.length}-day Scripture meditation plan`,
  );

  return { themes: ranked, readingPlan: { title, days } };
}
