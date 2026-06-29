import {
  HOLY_SPIRIT_FRUITS,
  NEW_LIFE_VIRTUES,
  SIN_PATTERN_IDS,
  type DailyExamen,
  type GraceRecoveryEntry,
  type HolySpiritFruit,
  type HolyLifeDayLog,
  type HolyLifeSkillId,
  type NewLifeVirtue,
  type SinPatternId,
  type ThoughtCaptiveEntry,
  type TransformationPlan,
} from "./spiritualFormation";

type ParseResult<T> = { success: true; data: T } | { success: false; error: Error };

type Schema<T> = {
  parse(value: unknown): T;
  safeParse(value: unknown): ParseResult<T>;
};

function makeSchema<T>(validator: (value: unknown) => string[]): Schema<T> {
  return {
    parse(value: unknown) {
      const errors = validator(value);
      if (errors.length) throw new Error(errors.join("; "));
      return value as T;
    },
    safeParse(value: unknown) {
      const errors = validator(value);
      if (errors.length) return { success: false, error: new Error(errors.join("; ")) };
      return { success: true, data: value as T };
    },
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isNonEmptyString = (value: unknown) => typeof value === "string" && value.trim().length > 0;
const isStringArray = (value: unknown) => Array.isArray(value) && value.every((item) => typeof item === "string");
const isFruitArray = (value: unknown): value is HolySpiritFruit[] =>
  Array.isArray(value) && value.every((item) => HOLY_SPIRIT_FRUITS.includes(item));
const isVirtueArray = (value: unknown): value is NewLifeVirtue[] =>
  Array.isArray(value) && value.every((item) => NEW_LIFE_VIRTUES.includes(item));
const isPatternArray = (value: unknown): value is SinPatternId[] =>
  Array.isArray(value) && value.every((item) => SIN_PATTERN_IDS.includes(item));
const isPracticeArray = (value: unknown) =>
  Array.isArray(value) && value.every((item) => isRecord(item) && isNonEmptyString(item.id) && isNonEmptyString(item.name));
const HOLY_LIFE_SKILL_IDS: HolyLifeSkillId[] = [
  "morning_consecration",
  "purpose_reset",
  "presence_of_god",
  "thought_examination",
  "intention_inspector",
  "holy_speech",
  "ordinary_life_worship",
  "self_denial_trainer",
  "humility_detector",
  "charity_practice",
  "evening_examen",
  "eternal_perspective",
];
const isHolyLifeEntryArray = (value: unknown) =>
  Array.isArray(value) && value.every((item) =>
    isRecord(item) &&
    HOLY_LIFE_SKILL_IDS.includes(item.skillId as HolyLifeSkillId) &&
    typeof item.score === "number" &&
    item.score >= 0 &&
    item.score <= 100 &&
    typeof item.reflection === "string" &&
    typeof item.completed === "boolean" &&
    isNonEmptyString(item.updatedAt)
  );
const isPresenceLogArray = (value: unknown) =>
  Array.isArray(value) && value.every((item) =>
    isRecord(item) &&
    isNonEmptyString(item.id) &&
    isNonEmptyString(item.createdAt) &&
    typeof item.reflection === "string"
  );
const isRuleOfLife = (value: unknown) =>
  isRecord(value) &&
  typeof value.theme === "string" &&
  typeof value.morningPrayer === "string" &&
  typeof value.dailyPractice === "string" &&
  typeof value.decisionGuardrail === "string" &&
  typeof value.eveningExamen === "string" &&
  typeof value.generatedAt === "string";
const isPurposeReview = (value: unknown) =>
  isRecord(value) &&
  typeof value.callingStatement === "string" &&
  typeof value.stewardshipFocus === "string" &&
  typeof value.misalignment === "string" &&
  typeof value.nextFaithfulAction === "string";
const isDecisionLogArray = (value: unknown) =>
  Array.isArray(value) && value.every((item) =>
    isRecord(item) &&
    isNonEmptyString(item.id) &&
    isNonEmptyString(item.createdAt) &&
    typeof item.decision === "string" &&
    typeof item.motive === "string" &&
    typeof item.desireToSurrender === "string" &&
    typeof item.scriptureAnchor === "string" &&
    typeof item.obedienceStep === "string"
  );

function requireFields(obj: Record<string, unknown>, fields: string[]) {
  return fields.filter((field) => !isNonEmptyString(obj[field])).map((field) => `${field} is required`);
}

export const DailyExamenSchema = makeSchema<DailyExamen>((value) => {
  if (!isRecord(value)) return ["DailyExamen must be an object"];
  const errors = requireFields(value, [
    "id",
    "userId",
    "date",
    "strongestEmotion",
    "behaviorDescription",
    "coreLie",
    "gospelTruth",
    "confession",
    "repentanceAction",
    "obedienceAction",
    "prayer",
    "createdAt",
    "updatedAt",
  ]);
  if (!isStringArray(value.triggers)) errors.push("triggers must be an array");
  if (!isPatternArray(value.detectedSinPatterns)) errors.push("detectedSinPatterns must contain known sin pattern ids");
  if (value.selectedPrimarySinPattern && !SIN_PATTERN_IDS.includes(value.selectedPrimarySinPattern as SinPatternId)) {
    errors.push("selectedPrimarySinPattern must be a known sin pattern id");
  }
  if (!isFruitArray(value.fruitPracticed)) errors.push("fruitPracticed must contain known fruits");
  if (!isVirtueArray(value.virtuesPracticed)) errors.push("virtuesPracticed must contain known virtues");
  if (typeof value.graceRecoveryNeeded !== "boolean") errors.push("graceRecoveryNeeded must be boolean");
  return errors;
});

export const ThoughtCaptiveEntrySchema = makeSchema<ThoughtCaptiveEntry>((value) => {
  if (!isRecord(value)) return ["ThoughtCaptiveEntry must be an object"];
  const errors = requireFields(value, [
    "id",
    "userId",
    "date",
    "catchThought",
    "namedSinPattern",
    "exposedLie",
    "replacementTruth",
    "obedienceAction",
    "createdAt",
  ]);
  if (!SIN_PATTERN_IDS.includes(value.namedSinPattern as SinPatternId)) errors.push("namedSinPattern must be known");
  return errors;
});

export const GraceRecoveryEntrySchema = makeSchema<GraceRecoveryEntry>((value) => {
  if (!isRecord(value)) return ["GraceRecoveryEntry must be an object"];
  const errors = requireFields(value, [
    "id",
    "userId",
    "date",
    "whatHappened",
    "confession",
    "receivedGraceStatement",
    "nextObedienceStep",
    "createdAt",
  ]);
  if (value.sinPattern && !SIN_PATTERN_IDS.includes(value.sinPattern as SinPatternId)) errors.push("sinPattern must be known");
  return errors;
});

export const TransformationPlanSchema = makeSchema<TransformationPlan>((value) => {
  if (!isRecord(value)) return ["TransformationPlan must be an object"];
  const errors = requireFields(value, [
    "id",
    "userId",
    "title",
    "duration",
    "intensity",
    "primarySinPattern",
    "startDate",
    "endDate",
    "status",
    "progressSummary",
    "recommendedNextStep",
    "createdAt",
    "updatedAt",
  ]);
  if (!SIN_PATTERN_IDS.includes(value.primarySinPattern as SinPatternId)) errors.push("primarySinPattern must be known");
  if (value.secondarySinPattern && !SIN_PATTERN_IDS.includes(value.secondarySinPattern as SinPatternId)) errors.push("secondarySinPattern must be known");
  if (!isFruitArray(value.targetFruits)) errors.push("targetFruits must contain known fruits");
  if (!isVirtueArray(value.targetVirtues)) errors.push("targetVirtues must contain known virtues");
  if (!isPracticeArray(value.dailyPractices)) errors.push("dailyPractices must contain practice objects");
  if (!isPracticeArray(value.weeklyPractices)) errors.push("weeklyPractices must contain practice objects");
  if (!isStringArray(value.reviewQuestions)) errors.push("reviewQuestions must be an array of strings");
  return errors;
});

export const HolyLifeDayLogSchema = makeSchema<HolyLifeDayLog>((value) => {
  if (!isRecord(value)) return ["HolyLifeDayLog must be an object"];
  const errors = requireFields(value, [
    "id",
    "userId",
    "date",
    "createdAt",
    "updatedAt",
  ]);
  if (typeof value.intention !== "string") errors.push("intention must be a string");
  if (!isHolyLifeEntryArray(value.entries)) errors.push("entries must contain known holy life skill entries");
  if (!isPresenceLogArray(value.presenceLogs)) errors.push("presenceLogs must contain presence log objects");
  if (value.ruleOfLife !== undefined && !isRuleOfLife(value.ruleOfLife)) errors.push("ruleOfLife must contain daily rule fields");
  if (value.purposeReview !== undefined && !isPurposeReview(value.purposeReview)) errors.push("purposeReview must contain purpose review fields");
  if (value.decisionSanctificationLogs !== undefined && !isDecisionLogArray(value.decisionSanctificationLogs)) errors.push("decisionSanctificationLogs must contain decision log objects");
  if (typeof value.dailyReport !== "string") errors.push("dailyReport must be a string");
  if (typeof value.tomorrowFormation !== "string") errors.push("tomorrowFormation must be a string");
  return errors;
});
