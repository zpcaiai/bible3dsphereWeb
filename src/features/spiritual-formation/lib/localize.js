// 属灵塑造模块的「中英双语」本地化层 / Bilingual localization layer.
// 引擎仍以英文输出（保证既有单元测试稳定）；界面在渲染层本地化。
// 取值统一走 pickVal：EN 优先英文，ZH 优先中文，缺失优雅回退。
import { pickVal } from "../../../i18n/pickLang";
import { getRuntimeLang } from "../../../i18n/runtime";
import { sinPatternMap } from "../data/sinPatterns";
import { PATTERN_ZH, PRACTICE_NAME_ZH, PHRASE_ZH } from "./localizeData";

export { pickVal, getRuntimeLang };

// 操练名称（英文键 → 中文）/ Practice name lookup, falls back to English.
export const practiceName = (name) => pickVal(PRACTICE_NAME_ZH[name], name);

// 引擎产出的有限文案（核心谎言、福音真理、牧养鼓励、回顾问题…）反查中文。
export const localizePhrase = (en) => pickVal(PHRASE_ZH[en], en);

// 操练对象本地化 / Localize a Practice object's display name.
export function localizePractice(practice) {
  if (!practice) return practice;
  return { ...practice, name: practiceName(practice.name) };
}

// 界面文案双语取值 / Pick UI copy between Chinese and English.
export const T = (zh, en) => pickVal(zh, en);

const FRUIT_ZH = {
  love: "仁爱", joy: "喜乐", peace: "和平", patience: "忍耐", kindness: "恩慈",
  goodness: "良善", faithfulness: "信实", gentleness: "温柔", self_control: "节制",
};
const VIRTUE_ZH = {
  holiness: "圣洁", righteousness: "公义", mercy: "怜悯", compassion: "慈悲",
  obedience: "顺服", humility: "谦卑", truthfulness: "诚实", generosity: "慷慨",
  purity: "纯洁", worship: "敬拜", justice: "公正", faith: "信心",
  reverence: "敬畏", contentment: "知足", forgiveness: "饶恕",
};
const EMOTION_ZH = {
  anxiety: "焦虑", anger: "愤怒", envy: "嫉妒", lust: "情欲", emptiness: "空虚",
  shame: "羞愧", prideful_confidence: "骄傲自负", fear: "恐惧", numbness: "麻木",
  bitterness: "苦毒", restlessness: "烦躁不安", gratitude: "感恩", peace: "平安",
  joy: "喜乐", sadness: "忧伤", loneliness: "孤独",
};
const TRIGGER_ZH = {
  pressure: "压力", loneliness: "孤独", comparison: "比较", success: "成功",
  failure: "失败", rejection: "被拒绝", offense: "被冒犯", financial_insecurity: "财务不安",
  sexual_temptation: "性试探", boredom: "无聊", fatigue: "疲惫", conflict: "冲突",
  social_media: "社交媒体", power_opportunity: "权力机会", religious_performance: "宗教表现",
};
const CATEGORY_ZH = {
  scripture: "读经", prayer: "祷告", confession: "认罪", repentance: "悔改",
  fasting: "禁食", silence: "静默", service: "服事", generosity: "施予",
  reconciliation: "和好", digital_boundary: "数字界限", accountability: "问责同行",
  worship: "敬拜", gratitude: "感恩", truth_telling: "说诚实话",
  body_stewardship: "身体管理", justice_mercy: "公义与怜悯",
};
const INTENSITY_ZH = { light: "轻度", normal: "常规", deep: "深度", battle: "争战" };
const DURATION_ZH = { "7_days": "7天觉察", "30_days": "30天治死", "90_days": "90天塑造", "1_year": "1年新造地图" };
const STATUS_ZH = { active: "进行中", completed: "已完成", paused: "已暂停" };
const FRUIT_STATUS_ZH = {
  newly_practiced: "初步操练", growing: "逐渐成长", needs_attention: "需要留意", ask_for_grace: "祈求恩典",
};
const FREQUENCY_ZH = { once: "一次", daily: "每日", weekly: "每周", monthly: "每月", as_needed: "按需" };

const titleCase = (id) => String(id || "").replaceAll("_", " ");

export const fruitName = (id) => pickVal(FRUIT_ZH[id], titleCase(id));
export const virtueName = (id) => pickVal(VIRTUE_ZH[id], titleCase(id));
export const emotionName = (id) => pickVal(EMOTION_ZH[id], titleCase(id));
export const triggerName = (id) => pickVal(TRIGGER_ZH[id], titleCase(id));
export const categoryName = (id) => pickVal(CATEGORY_ZH[id], titleCase(id));
export const intensityName = (id) => pickVal(INTENSITY_ZH[id], titleCase(id));
export const durationName = (id) => pickVal(DURATION_ZH[id], titleCase(id));
export const statusName = (id) => pickVal(STATUS_ZH[id], titleCase(id));
export const fruitStatusName = (id) => pickVal(FRUIT_STATUS_ZH[id], titleCase(id));
export const frequencyName = (id) => pickVal(FREQUENCY_ZH[id], titleCase(id));

const INTENSITY_DESC_ZH = {
  light: { title: "轻度", dailyMinutes: "每日约10分钟", description: "适合初信、属灵软弱，或正从倦怠中恢复的人。" },
  normal: { title: "常规", dailyMinutes: "每日约25-40分钟", description: "适合稳定的信徒，建立可持续的每日节奏。" },
  deep: { title: "深度", dailyMinutes: "每日约60-90分钟", description: "适合成熟门徒、领袖，或愿意认真追求属灵塑造的人。" },
  battle: { title: "争战", dailyMinutes: "早晨+正午+晚间多次省察", description: "适合急性的试探或反复的捆绑，需配以界限与问责。" },
};
export function intensityDescription(id, fallback) {
  const zh = INTENSITY_DESC_ZH[id];
  if (!zh) return fallback || { title: titleCase(id), dailyMinutes: "", description: "" };
  return {
    title: pickVal(zh.title, fallback?.title || titleCase(id)),
    dailyMinutes: pickVal(zh.dailyMinutes, fallback?.dailyMinutes || ""),
    description: pickVal(zh.description, fallback?.description || ""),
  };
}

const BOOK_ZH = {
  Matthew: "马太福音", Mark: "马可福音", Luke: "路加福音", John: "约翰福音",
  Romans: "罗马书", Galatians: "加拉太书", Ephesians: "以弗所书", Philippians: "腓立比书",
  Colossians: "歌罗西书", Exodus: "出埃及记", Genesis: "创世记", Psalm: "诗篇",
  Proverbs: "箴言", Isaiah: "以赛亚书", Micah: "弥迦书", Amos: "阿摩司书",
  James: "雅各书", Hebrews: "希伯来书", Revelation: "启示录",
  "1 John": "约翰一书", "1 Timothy": "提摩太前书", "1 Corinthians": "哥林多前书",
  "1 Thessalonians": "帖撒罗尼迦前书",
};
export function referenceName(reference) {
  if (getRuntimeLang() !== "zh") return reference;
  const match = String(reference || "").match(/^(.+?)\s+(\d+.*)$/);
  if (!match) return reference;
  const book = BOOK_ZH[match[1]];
  return book ? `${book} ${match[2]}` : reference;
}

// 罪的模式本地化：返回与 SinPattern 同形、但显示字段已按语言挑选的对象。
const PATTERN_TEXT_FIELDS = ["name", "shortName", "description", "biblicalDiagnosis", "coreLie", "gospelTruth", "repentancePrayer"];
const PATTERN_LIST_FIELDS = ["commonSymptoms", "deepIdols", "putOffActions", "putOnActions"];
export function localizePattern(pattern) {
  if (!pattern) return pattern;
  const zh = PATTERN_ZH[pattern.id];
  if (!zh) return pattern;
  const out = { ...pattern };
  for (const f of PATTERN_TEXT_FIELDS) out[f] = pickVal(zh[f], pattern[f]);
  for (const f of PATTERN_LIST_FIELDS) {
    const list = pattern[f] || [];
    out[f] = list.map((item, i) => pickVal(zh[f]?.[i], item));
  }
  return out;
}

// 按 id 取罪模式的显示名（双语）/ Pattern display name by id.
export function patternNameById(id) {
  return pickVal(PATTERN_ZH[id]?.name, sinPatternMap[id]?.name || titleCase(id));
}

// 转化计划标题（中文重建，英文回退原文）/ Localized plan title.
export function localizePlanTitle(plan) {
  if (!plan) return "";
  if (getRuntimeLang() !== "zh") return plan.title;
  const p = patternNameById(plan.primarySinPattern);
  const v = plan.targetVirtues?.[0] ? virtueName(plan.targetVirtues[0]) : "顺服";
  switch (plan.duration) {
    case "7_days": return `7天觉察：看见${p}`;
    case "30_days": return `30天治死：脱去${p}，穿上${v}`;
    case "90_days": return `90天塑造：从${p}走向像基督的${v}`;
    case "1_year": return "1年新造地图：在圣洁、爱与顺服中成长";
    default: return plan.title;
  }
}

// 转化计划进程摘要（中文重建，英文回退原文）/ Localized progress summary.
export function localizeProgressSummary(plan) {
  if (!plan) return "";
  if (getRuntimeLang() !== "zh") return plan.progressSummary;
  const label = DURATION_ZH[plan.duration] || plan.duration;
  const accountability = plan.intensity === "battle"
    ? "这条道路不该独自争战。若这模式反复出现或具破坏性，请邀请一位成熟信徒、牧者、辅导员或可信的问责同行者进入这个过程。"
    : "";
  return `${label}遵循这样的进程：指认、带到光中、认罪、悔改、脱去、穿上、操练、结出果子、并回顾。${accountability}`;
}
