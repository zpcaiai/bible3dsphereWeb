export type HolySpiritFruit =
  | "love"
  | "joy"
  | "peace"
  | "patience"
  | "kindness"
  | "goodness"
  | "faithfulness"
  | "gentleness"
  | "self_control";

export type NewLifeVirtue =
  | "holiness"
  | "righteousness"
  | "mercy"
  | "compassion"
  | "obedience"
  | "humility"
  | "truthfulness"
  | "generosity"
  | "purity"
  | "worship"
  | "justice"
  | "faith"
  | "reverence"
  | "contentment"
  | "forgiveness";

export type SinPatternId =
  | "self_centeredness"
  | "idolatry"
  | "greed_consumerism"
  | "sexual_disorder"
  | "pride"
  | "lies_falsehood"
  | "hatred_division"
  | "injustice_oppression"
  | "religious_hypocrisy"
  | "coldness_lack_of_love"
  | "entertainment_escapism"
  | "babel_pride"
  | "spiritual_numbness";

export type Scripture = {
  reference: string;
  text: string;
  theme?: string;
};

export type PracticeCategory =
  | "scripture"
  | "prayer"
  | "confession"
  | "repentance"
  | "fasting"
  | "silence"
  | "service"
  | "generosity"
  | "reconciliation"
  | "digital_boundary"
  | "accountability"
  | "worship"
  | "gratitude"
  | "truth_telling"
  | "body_stewardship"
  | "justice_mercy";

export type PracticeFrequency = "once" | "daily" | "weekly" | "monthly" | "as_needed";

export type Practice = {
  id: string;
  name: string;
  category: PracticeCategory;
  description: string;
  frequency: PracticeFrequency;
  estimatedMinutes: number;
  instructions: string[];
  relatedFruits: HolySpiritFruit[];
  relatedVirtues: NewLifeVirtue[];
};

export type SinPattern = {
  id: SinPatternId;
  name: string;
  shortName: string;
  description: string;
  biblicalDiagnosis: string;
  coreLie: string;
  commonSymptoms: string[];
  emotionalTriggers: SpiritualEmotion[];
  behavioralTriggers: string[];
  deepIdols: string[];
  scriptures: Scripture[];
  repentancePrayer: string;
  gospelTruth: string;
  oppositeVirtues: NewLifeVirtue[];
  targetHolySpiritFruits: HolySpiritFruit[];
  putOffActions: string[];
  putOnActions: string[];
  dailyPractices: Practice[];
  emergencyPractices: Practice[];
  weeklyPractices: Practice[];
};

export type SpiritualEmotion =
  | "anxiety"
  | "anger"
  | "envy"
  | "lust"
  | "emptiness"
  | "shame"
  | "prideful_confidence"
  | "fear"
  | "numbness"
  | "bitterness"
  | "restlessness"
  | "gratitude"
  | "peace"
  | "joy"
  | "sadness"
  | "loneliness";

export type TriggerCategory =
  | "pressure"
  | "loneliness"
  | "comparison"
  | "success"
  | "failure"
  | "rejection"
  | "offense"
  | "financial_insecurity"
  | "sexual_temptation"
  | "boredom"
  | "fatigue"
  | "conflict"
  | "social_media"
  | "power_opportunity"
  | "religious_performance";

export type DailyExamen = {
  id: string;
  userId: string;
  date: string;
  strongestEmotion: SpiritualEmotion;
  triggers: TriggerCategory[];
  behaviorDescription: string;
  detectedSinPatterns: SinPatternId[];
  selectedPrimarySinPattern?: SinPatternId;
  coreLie: string;
  gospelTruth: string;
  confession: string;
  repentanceAction: string;
  obedienceAction: string;
  fruitPracticed: HolySpiritFruit[];
  virtuesPracticed: NewLifeVirtue[];
  prayer: string;
  graceRecoveryNeeded: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ThoughtCaptiveEntry = {
  id: string;
  userId: string;
  date: string;
  catchThought: string;
  namedSinPattern: SinPatternId;
  exposedLie: string;
  replacementTruth: string;
  obedienceAction: string;
  scripture?: Scripture;
  createdAt: string;
};

export type GraceRecoveryEntry = {
  id: string;
  userId: string;
  date: string;
  sinPattern?: SinPatternId;
  whatHappened: string;
  confession: string;
  receivedGraceStatement: string;
  repairAction?: string;
  boundaryAction?: string;
  accountabilityAction?: string;
  nextObedienceStep: string;
  createdAt: string;
};

export type SpiritualIntensity = "light" | "normal" | "deep" | "battle";

export type TransformationPlanDuration = "7_days" | "30_days" | "90_days" | "1_year";

export type TransformationPlan = {
  id: string;
  userId: string;
  title: string;
  duration: TransformationPlanDuration;
  intensity: SpiritualIntensity;
  primarySinPattern: SinPatternId;
  secondarySinPattern?: SinPatternId;
  targetFruits: HolySpiritFruit[];
  targetVirtues: NewLifeVirtue[];
  dailyPractices: Practice[];
  weeklyPractices: Practice[];
  reviewQuestions: string[];
  progressSummary: string;
  recommendedNextStep: string;
  startDate: string;
  endDate: string;
  status: "active" | "completed" | "paused";
  executionSummary?: {
    currentCompleted: number;
    currentTotal: number;
    totalCheckins: number;
    updatedAt: string;
  };
  /** @deprecated Kept only for migration from the former one-time checkbox model. */
  completedPracticeIds?: string[];
  createdAt: string;
  updatedAt: string;
};

export type WeeklyReview = {
  id: string;
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  mostFrequentSinPatterns: Array<{ sinPatternId: SinPatternId; count: number }>;
  topTriggers: Array<{ trigger: TriggerCategory; count: number }>;
  recurringCoreLies: string[];
  fruitsPracticed: Array<{ fruit: HolySpiritFruit; count: number }>;
  virtuesPracticed: Array<{ virtue: NewLifeVirtue; count: number }>;
  obedienceActionsCompleted: string[];
  graceRecoveryCount: number;
  pastoralEncouragement: string;
  recommendedNextPractices: Practice[];
  createdAt: string;
};

export type RecommendationInput = {
  emotion?: SpiritualEmotion;
  triggers?: TriggerCategory[];
  behaviorText?: string;
  selectedSinPattern?: SinPatternId;
};

export type RecommendationResult = {
  likelySinPatterns: SinPatternId[];
  possibleCoreLies: string[];
  suggestedGospelTruths: string[];
  suggestedFruits: HolySpiritFruit[];
  suggestedVirtues: NewLifeVirtue[];
  suggestedPractices: Practice[];
  pastoralNote: string;
};

export type HolyLifeSkillId =
  | "morning_consecration"
  | "purpose_reset"
  | "presence_of_god"
  | "thought_examination"
  | "intention_inspector"
  | "holy_speech"
  | "ordinary_life_worship"
  | "self_denial_trainer"
  | "humility_detector"
  | "charity_practice"
  | "evening_examen"
  | "eternal_perspective";

export type HolyLifeSkillEntry = {
  skillId: HolyLifeSkillId;
  score: number;
  reflection: string;
  completed: boolean;
  updatedAt: string;
};

export type HolyLifePresenceLog = {
  id: string;
  createdAt: string;
  reflection: string;
};

export type HolyLifeRuleOfLife = {
  theme: string;
  morningPrayer: string;
  dailyPractice: string;
  decisionGuardrail: string;
  eveningExamen: string;
  generatedAt: string;
};

export type HolyLifePurposeReview = {
  callingStatement: string;
  stewardshipFocus: string;
  misalignment: string;
  nextFaithfulAction: string;
};

export type HolyLifeDecisionLog = {
  id: string;
  createdAt: string;
  decision: string;
  motive: string;
  desireToSurrender: string;
  scriptureAnchor: string;
  obedienceStep: string;
};

export type HolyLifeDayLog = {
  id: string;
  userId: string;
  date: string;
  intention: string;
  entries: HolyLifeSkillEntry[];
  presenceLogs: HolyLifePresenceLog[];
  ruleOfLife?: HolyLifeRuleOfLife;
  purposeReview?: HolyLifePurposeReview;
  decisionSanctificationLogs?: HolyLifeDecisionLog[];
  dailyReport: string;
  tomorrowFormation: string;
  createdAt: string;
  updatedAt: string;
};

export type HorariumPrayerEntry = {
  hourId: string;
  completed: boolean;
  reflection: string;
  completedAt?: string;
};

export type HorariumDayLog = {
  id: string;
  userId: string;
  date: string;
  entries: HorariumPrayerEntry[];
  note: string;
  createdAt: string;
  updatedAt: string;
};

export const HOLY_SPIRIT_FRUITS: HolySpiritFruit[] = [
  "love",
  "joy",
  "peace",
  "patience",
  "kindness",
  "goodness",
  "faithfulness",
  "gentleness",
  "self_control",
];

export const NEW_LIFE_VIRTUES: NewLifeVirtue[] = [
  "holiness",
  "righteousness",
  "mercy",
  "compassion",
  "obedience",
  "humility",
  "truthfulness",
  "generosity",
  "purity",
  "worship",
  "justice",
  "faith",
  "reverence",
  "contentment",
  "forgiveness",
];

export const SIN_PATTERN_IDS: SinPatternId[] = [
  "self_centeredness",
  "idolatry",
  "greed_consumerism",
  "sexual_disorder",
  "pride",
  "lies_falsehood",
  "hatred_division",
  "injustice_oppression",
  "religious_hypocrisy",
  "coldness_lack_of_love",
  "entertainment_escapism",
  "babel_pride",
  "spiritual_numbness",
];
