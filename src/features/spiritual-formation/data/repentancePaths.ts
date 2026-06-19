// 悔改路径模板 / Repentance path templates (Skill: repentance-path-builder)
// 福音中心、非羞耻：看见谎言 → 命名偶像 → 承认不信 → 转向基督 → 弃绝旧回应 → 建立新顺服 → 回顾果子。
// 7 天阶段骨架对所有自高之事通用，逐日文案用本体（coreLie/idol/真理/被拦阻真理）填充；
// 各原型只提供「圣灵果子指标」与「牧养提醒」。全部内联双语。

import type { BiText, BiList, StrongholdArchetypeCode } from "./strongholds";

export type RepentanceStage =
  | "awareness" | "naming" | "confession" | "turning"
  | "renunciation" | "replacement" | "fruit_review";

export interface StageDay {
  stage: RepentanceStage;
  focus: BiText;
  scriptureTheme: BiText;
  action: BiText;      // 可含占位符 {name} {idol} {lie} {truth} {doctrine}
  reviewQuestion: BiText;
}

// 通用 7 天阶段骨架（福音弧）/ Generic 7-day gospel arc
export const STAGE_TEMPLATE: StageDay[] = [
  {
    stage: "awareness",
    focus: { zh: "看见核心谎言", en: "See the core lie" },
    scriptureTheme: { zh: "在基督里的身份", en: "Identity in Christ" },
    action: { zh: "写下最近三件让「{name}」浮现的事，并指出背后的谎言：{lie}", en: "Write three recent moments when “{name}” surfaced, and name the lie behind it: {lie}" },
    reviewQuestion: { zh: "我是否把这句谎言当成了事实？", en: "Have I been treating this lie as fact?" },
  },
  {
    stage: "naming",
    focus: { zh: "命名偶像", en: "Name the idol" },
    scriptureTheme: { zh: "不可有别的神", en: "No other gods" },
    action: { zh: "写下「{idol}」给你的三个假应许。", en: "Write the three false promises that “{idol}” makes to you." },
    reviewQuestion: { zh: "我最怕失去哪一种「{idol}」？", en: "Which form of “{idol}” do I most fear losing?" },
  },
  {
    stage: "confession",
    focus: { zh: "承认不信", en: "Confess the unbelief" },
    scriptureTheme: { zh: "恩典与认罪", en: "Grace and confession" },
    action: { zh: "向神承认：在哪些地方我用「{idol}」取代了祂。", en: "Confess to God where you have replaced him with “{idol}.”" },
    reviewQuestion: { zh: "我在哪些具体处境最难信靠神？", en: "In which concrete situations is it hardest to trust God?" },
  },
  {
    stage: "turning",
    focus: { zh: "转向基督", en: "Turn to Christ" },
    scriptureTheme: { zh: "基督成为我们的义", en: "Christ our righteousness" },
    action: { zh: "默想今天的真理：{truth}", en: "Meditate on today’s truth: {truth}" },
    reviewQuestion: { zh: "如果这真理是真的，今天我可以放下什么？", en: "If this truth is real, what can I lay down today?" },
  },
  {
    stage: "renunciation",
    focus: { zh: "弃绝旧回应", en: "Renounce the old response" },
    scriptureTheme: { zh: "脱去旧人", en: "Put off the old self" },
    action: { zh: "今天拒绝一次「{name}」惯常的旧反应（如反复证明、控制、逃避或论断）。", en: "Today refuse one habitual old response of “{name}” (proving, controlling, escaping, or judging)." },
    reviewQuestion: { zh: "我常用什么旧方式保护自己？", en: "What old strategy do I use to protect myself?" },
  },
  {
    stage: "replacement",
    focus: { zh: "建立新顺服", en: "Put on a new obedience" },
    scriptureTheme: { zh: "穿上新人", en: "Put on the new self" },
    action: { zh: "用一个具体的新顺服行动代替旧模式，哪怕很小。", en: "Replace the old pattern with one concrete act of new obedience, however small." },
    reviewQuestion: { zh: "在这件事上，顺服神具体是什么样子？", en: "What does obeying God concretely look like here?" },
  },
  {
    stage: "fruit_review",
    focus: { zh: "回顾果子", en: "Review the fruit" },
    scriptureTheme: { zh: "圣灵的果子", en: "The fruit of the Spirit" },
    action: { zh: "复盘这一周：焦虑、比较、恐惧或逃避是否减少？记下一处你看见的恩典。", en: "Review the week: has anxiety, comparison, fear, or escape eased? Note one grace you saw." },
    reviewQuestion: { zh: "我在哪一处更自由、更能安息？", en: "Where am I freer, more able to rest?" },
  },
];

interface ArchetypePath {
  fruitIndicators: BiList;
  cautions: BiList;
}

const STANDARD_CAUTION: BiText = {
  zh: "不要把悔改变成新的表现主义——它的终点是恩典，不是自我定罪。若反复出现或具破坏性，请邀请一位成熟可信的属灵同伴同行。",
  en: "Don’t let repentance become a new performance treadmill — its end is grace, not self-condemnation. If it recurs or is destructive, invite a mature, trusted companion to walk with you.",
};
const WOUNDED_CAUTION: BiText = {
  zh: "这条路涉及真实的痛苦或伤害，先安全、被聆听、被陪伴最重要。请不要独自走，找一位成熟可信的牧者或辅导者；属灵操练不替代必要的保护与专业帮助。",
  en: "This path touches real pain or harm — safety, being heard, and companionship come first. Please don’t walk it alone; find a mature pastor or counselor. Spiritual practice does not replace needed protection or professional help.",
};

export const ARCHETYPE_PATH: Record<StrongholdArchetypeCode, ArchetypePath> = {
  performance_righteousness: {
    fruitIndicators: { zh: ["比较减少", "更能为别人感恩", "无人看见时仍愿忠心", "失败后羞耻感下降", "更愿意安息"], en: ["less comparison", "more thankful for others", "faithful when unseen", "less shame after failure", "more willing to rest"] },
    cautions: { zh: [STANDARD_CAUTION.zh], en: [STANDARD_CAUTION.en] },
  },
  self_sovereignty: {
    fruitIndicators: { zh: ["更能交托结果", "焦虑下降", "更愿求助", "更能安息", "操控他人减少"], en: ["more able to entrust outcomes", "less anxiety", "more willing to ask for help", "more able to rest", "less managing others"] },
    cautions: { zh: [STANDARD_CAUTION.zh], en: [STANDARD_CAUTION.en] },
  },
  rational_pride: {
    fruitIndicators: { zh: ["更谦卑受教", "对奥秘更开放", "争辩压人减少", "更敬畏神"], en: ["more humble and teachable", "more open to mystery", "less arguing to win", "more reverence for God"] },
    cautions: { zh: [STANDARD_CAUTION.zh], en: [STANDARD_CAUTION.en] },
  },
  desire_absolutism: {
    fruitIndicators: { zh: ["更能节制", "空虚时转向神", "更知足", "隐秘模式减少"], en: ["more self-control", "turning to God in emptiness", "more contentment", "fewer secret patterns"] },
    cautions: { zh: [WOUNDED_CAUTION.zh], en: [WOUNDED_CAUTION.en] },
  },
  techno_salvation: {
    fruitIndicators: { zh: ["更能承认有限", "对死亡与罪更诚实", "把救恩交给基督", "更少优化焦虑"], en: ["more able to own limits", "more honest about death and sin", "salvation entrusted to Christ", "less optimization anxiety"] },
    cautions: { zh: [STANDARD_CAUTION.zh], en: [STANDARD_CAUTION.en] },
  },
  political_idolatry: {
    fruitIndicators: { zh: ["恐惧与义怒下降", "更能爱政见不同的人", "盼望转向神国", "更少把对手当敌人"], en: ["less fear and outrage", "more love across difference", "hope reset on the kingdom", "fewer enemies made of opponents"] },
    cautions: { zh: [STANDARD_CAUTION.zh], en: [STANDARD_CAUTION.en] },
  },
  wounded_unbelief: {
    fruitIndicators: { zh: ["更能向神说真话", "在十字架看见神的同在", "苦中仍有一点盼望", "不再独自承受"], en: ["more honest with God", "seeing God’s presence at the cross", "a thread of hope in pain", "no longer carrying it alone"] },
    cautions: { zh: [WOUNDED_CAUTION.zh], en: [WOUNDED_CAUTION.en] },
  },
  religious_self_righteousness: {
    fruitIndicators: { zh: ["更能认自己的罪", "论断他人减少", "以蒙恩罪人之心来到神前", "更多真实的喜乐"], en: ["more able to confess own sin", "less judging others", "coming as a sinner under grace", "more genuine joy"] },
    cautions: { zh: [STANDARD_CAUTION.zh], en: [STANDARD_CAUTION.en] },
  },
};
