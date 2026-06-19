// Client-side triage fallback — a compact mirror of backend crisis_engine.triage.
// SAFETY: this exists so the "我现在撑不住了" flow still classifies risk and shows
// resources when the backend is unreachable. It is intentionally CONSERVATIVE:
// it never returns "no risk" silently and always rounds UP on ambiguity.

import type { CrisisRiskType, RiskLevel, TriageResult } from "../types/crisis";

const RANK: Record<RiskLevel, number> = { green: 0, yellow: 1, orange: 2, red: 3 };

const RED_STRONG: RegExp[] = [
  /写好了?遗书/, /买好了?(药|绳|刀|炭)/, /囤(了|好)药/, /吞(了|下).{0,5}药/, /服(药)?过量/,
  /站在(天台|楼顶|窗台|桥上|楼边)/, /绳子(已经|都)?(系|挂|准备)好/,
  /现在就(要|去)死/, /马上就(要|去)(死|结束|跳|上吊)/,
  /今(晚|天)(就)?(结束(这一切|生命|自己)?|了结(自己|这一切)|去死|跳楼|上吊|不在了)/,
  /正在(割|流血|跳|上吊)/, /再见了?，?这个世界/, /这是我最后/, /安排好了?(后事|一切)/,
];
const RED_CONTEXTUAL: RegExp[] = [
  /已经?(准备|安排|计划)好/, /都准备好了/, /刀(就)?(在|放在)?(手边|手里|旁边)/,
];

const TYPE_RULES: Array<{ type: CrisisRiskType; level: RiskLevel; patterns: RegExp[] }> = [
  { type: "suicidal_ideation", level: "orange", patterns: [
    /不想活/, /活不下去/, /想死/, /去死算了/, /结束(自己的?)?生命/, /了结(自己|这一切)/,
    /自杀/, /消失算了/, /撑不下去了?/, /活着没(有)?(意义|意思)/, /生不如死/,
    /不配活(着)?/, /不值得活/, /不该活(着)?/, /没资格活(着)?/,
  ] },
  { type: "self_harm", level: "orange", patterns: [/自残/, /自伤/, /割腕/, /割(自己|手)/, /想(撞|捶)墙/, /想让自己(痛|流血)/, /伤害自己/] },
  { type: "harm_to_others", level: "orange", patterns: [/想杀(了)?(他|她|他们|你)/, /想(伤害|弄死|打死|捅)(他|她|别人|人)/, /让(他|她|他们)付出代价/, /控制不住想(打|伤害)人/] },
  { type: "domestic_violence", level: "orange", patterns: [/(他|她|家人|老公|老婆|男友|女友|父母).{0,6}(打我|施暴|家暴|动手)/, /正在被(打|家暴|虐待|性侵|侵犯)/, /被性侵/, /被.{0,4}(跟踪|控制|囚禁)/] },
  { type: "medical_emergency", level: "orange", patterns: [/吞(了|下).{0,5}药/, /服(了|药)?过量/, /大量(出血|流血)/, /胸口剧痛/, /昏(过去|倒)/, /失去意识/] },
  { type: "panic_attack", level: "yellow", patterns: [/喘不过气/, /呼吸困难/, /心跳(很|好)快/, /快(要)?疯了/, /惊恐/, /胸口(发闷|很紧)/] },
  { type: "dissociation", level: "orange", patterns: [/身体(僵|动不了|麻木|不是我的)/, /灵魂出窍/, /不真实(感)?/, /感觉自己不(在现实|存在)/, /解离/] },
  { type: "trauma_trigger", level: "yellow", patterns: [/又回到(那件事|那个场景|那时候)/, /闪回/, /那个画面(又|一直)(出现|闪)/] },
  { type: "addiction_relapse", level: "yellow", patterns: [/快(要)?(控制不住|忍不住)/, /复发/, /又想(看|喝|赌|嗑|吸)/, /想看(色情|黄|片)/, /忍不住想(喝酒|喝|赌|抽|吸|嗑药)/, /戒不掉/, /破戒/] },
  { type: "spiritual_despair", level: "yellow", patterns: [/神(一定)?(不要|抛弃|离弃|放弃)(我|了)/, /我不配(被爱|被赦免)/, /永远(不会|无法)被(赦免|原谅)/, /祷告(没用|无用)/, /神在(惩罚|报应)我/] },
  { type: "toxic_shame", level: "yellow", patterns: [/我(就是个?)(废物|垃圾|烂人|没用的人)/, /我配不上/, /我永远(好不了|改不了)/] },
];

const DIRECT_SAFETY = new Set(["suicidal_ideation", "self_harm", "harm_to_others", "domestic_violence", "medical_emergency"]);
const HUMAN_ESCALATION = new Set(["suicidal_ideation", "self_harm", "harm_to_others", "domestic_violence", "medical_emergency", "psychosis_like_symptom"]);
const WORKFLOW: Record<RiskLevel, TriageResult["recommendedWorkflow"]> = {
  green: "normal_care", yellow: "yellow_support", orange: "orange_safety_plan", red: "red_emergency",
};

function matchAny(patterns: RegExp[], text: string): string | null {
  for (const p of patterns) {
    const m = p.exec(text);
    if (m) return m[0];
  }
  return null;
}

export function triageClient(text: string): TriageResult {
  text = text || "";
  const riskTypes: CrisisRiskType[] = [];
  const evidence: string[] = [];
  let level: RiskLevel = "green";

  for (const rule of TYPE_RULES) {
    const hit = matchAny(rule.patterns, text);
    if (hit && !riskTypes.includes(rule.type)) {
      riskTypes.push(rule.type);
      evidence.push(`${rule.type}: ${hit}`);
      if (RANK[rule.level] > RANK[level]) level = rule.level;
    }
  }

  const lifeRisk = riskTypes.some((t) => t === "suicidal_ideation" || t === "self_harm" || t === "harm_to_others");
  const strong = matchAny(RED_STRONG, text);
  const contextual = matchAny(RED_CONTEXTUAL, text);
  if (strong) {
    level = "red";
    if (!riskTypes.includes("suicidal_ideation") && !riskTypes.includes("self_harm")) riskTypes.push("suicidal_ideation");
    evidence.push(`red_strong: ${strong}`);
  } else if (contextual && (lifeRisk || riskTypes.includes("medical_emergency"))) {
    level = "red";
    evidence.push(`red_contextual: ${contextual}`);
  } else if (contextual && riskTypes.length === 0) {
    level = "red";
    riskTypes.push("suicidal_ideation");
    evidence.push(`red_contextual: ${contextual}`);
  }

  const requiresDirect = level === "orange" || level === "red" || riskTypes.some((t) => DIRECT_SAFETY.has(t));
  const requiresHuman = level === "red" || (level === "orange" && riskTypes.some((t) => HUMAN_ESCALATION.has(t)));

  return {
    riskLevel: level,
    riskTypes,
    evidence,
    confidence: strong ? 0.97 : Math.min(0.95, 0.55 + 0.1 * riskTypes.length),
    recommendedWorkflow: WORKFLOW[level],
    requiresDirectSafetyQuestion: requiresDirect,
    requiresHumanEscalation: requiresHuman,
  };
}
