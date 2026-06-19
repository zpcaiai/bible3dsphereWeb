// Crisis Care static content — comfort scriptures, conviction-vs-condemnation,
// safety-plan template suggestions, post-crisis tasks, PFA scripts, forbidden
// phrases. Mirrors backend crisis_engine constants for offline/degraded mode.

import type { SafetyPlan, SpiritualAnchor } from "../types/crisis";

export const MODULE_DISCLAIMER =
  "危机守护不是诊断工具，也不是心理治疗或急救的替代。它只做四件事：尽快帮助你回到安全、" +
  "连接真实的人、找到专业资源、并给你不带控告的属灵陪伴。如果你此刻有立即危险，请直接拨打当地紧急电话。";

export const CONVICTION_VS_CONDEMNATION = [
  { dimension: "指向", conviction: "指向基督与恩典", condemnation: "指向绝望与自毁" },
  { dimension: "结果", conviction: "带来回转与盼望", condemnation: "带来羞耻与逃避" },
  { dimension: "范围", conviction: "具体的某件事", condemnation: "模糊地全盘否定你这个人" },
  { dimension: "方向", conviction: "使你靠近神", condemnation: "使你逃离神" },
];

export const COMFORT_SCRIPTURES = [
  { ref: "诗篇 34:18", text: "耶和华靠近伤心的人，拯救灵性痛悔的人。", theme: "神亲近伤心人" },
  { ref: "以赛亚书 42:3", text: "压伤的芦苇，他不折断；将残的灯火，他不吹灭。", theme: "神不压伤软弱者" },
  { ref: "罗马书 8:34", text: "有基督耶稣……现今在神的右边，也替我们祈求。", theme: "基督为软弱者代求" },
  { ref: "罗马书 8:26", text: "圣灵亲自用说不出来的叹息替我们祷告。", theme: "无法祷告时圣灵帮助" },
  { ref: "诗篇 130:1", text: "耶和华啊，我从深处向你求告。", theme: "黑暗中仍可呼求" },
  { ref: "马太福音 11:28", text: "凡劳苦担重担的人，可以到我这里来，我就使你们得安息。", theme: "不必独自承受重担" },
];

// 危机中禁止的话术（用于过滤/提醒）
export const FORBIDDEN_PHRASES = [
  "你就是信心不够", "你悔改就好了", "真正的基督徒不会这样", "这是神在惩罚你",
  "不要想太多", "多读经就好了", "你想想家人", "自杀是罪", "你不够属灵", "你要顺服权柄",
];

export const GROUNDING_54321 =
  "我们现在只做一个很小的动作，把自己带回此刻：\n" +
  "看见你周围的 5 个东西。\n摸到 4 个东西。\n听见 3 个声音。\n闻到 2 个气味。\n" +
  "感受 1 个身体的感觉。\n不用做得完美，只要慢慢来。";

export const EMERGENCY_COPY_TEXT =
  "我现在状态很危险，可能会伤害自己。我不想一个人待着。请你现在联系我，或者马上来陪我。" +
  "如果我没有回复，请帮我联系紧急服务。";

export const SPIRITUAL_ANCHORS_DEFAULT: SpiritualAnchor[] = [
  { type: "scripture", ref: "诗篇 34:18", text: "耶和华靠近伤心的人，拯救灵性痛悔的人。" },
  { type: "truth", text: "神没有要求你独自撑过去。此刻先活下来，比解释一切更重要。" },
  { type: "prayer", text: "主啊，我现在很痛，求你抓住我，差人来陪我。" },
];

export function buildSafetyPlanTemplate(regionCode = "TW"): SafetyPlan {
  return {
    warningSigns: ["连续失眠", "想消失 / 想一个人关机", "不想祷告也不想说话", "强烈的羞耻感", "想删掉所有社交账号", "开始安排后事或托付东西"],
    internalCopingStrategies: ["离开可能伤害自己的物品或地点", "坐到有人的公共空间", "喝一杯水、打开灯", "跟随 60 秒呼吸引导", "听一首熟悉的诗歌", "给一个人发一句话"],
    safePeople: [],
    safePlaces: ["客厅 / 有人的房间", "楼下便利店或 24h 场所", "教会 / 小组的人那里"],
    professionalResources: [],
    meansRestrictionSteps: ["把药物交给信任的人保管或放到拿不到的地方", "把刀具、绳索等危险物品移走或请人帮忙收起", "今晚不独处，必要时去有人的地方过夜"],
    spiritualAnchors: SPIRITUAL_ANCHORS_DEFAULT,
    emergencyMessageTemplate: EMERGENCY_COPY_TEXT,
    regionCode,
  };
}

export const POST_CRISIS_TASKS: Record<string, string[]> = {
  "24h": ["确认安全、移走危险物品", "睡眠 / 喝水 / 吃东西", "尽量不独处", "联系一位守护人", "取消今天的高压任务"],
  "72h": ["完成一次真人谈话", "写下这次危机的触发点", "更新安全计划", "预约咨询 / 牧养约谈", "降低属灵任务强度"],
  "7d": ["识别情绪与触发的模式", "建立属于自己的预警信号", "做轻量的灵修（不强求）", "恢复身体节律：作息、饮食、运动", "联系小组 / 教会的支持"],
  "30d": ["开始处理更深的创伤 / 信念 / 习惯", "建立成瘾复发预防机制", "属灵身份的重建（你是谁，神怎么看你）", "进入长期的陪伴 / 门训路径"],
};

export const POST_CRISIS_PHASE_LABELS: Record<string, string> = {
  "24h": "24 小时", "72h": "72 小时", "7d": "7 天", "30d": "30 天",
};

export const HALT_ITEMS = [
  { key: "H", label: "Hungry 饥饿" },
  { key: "A", label: "Angry 愤怒" },
  { key: "L", label: "Lonely 孤独" },
  { key: "T", label: "Tired 疲惫" },
];

export const ADDICTION_DELAY_STEPS = [
  "离开当前的房间。",
  "把触发的设备 / 物品放远。",
  "给一位守护人发一句：「我现在有复发冲动，请陪我 10 分钟。」",
];

export const TRAUMA_GROUNDING =
  "你现在可能被过去的痛苦拉回去了。但你此刻在这里，不在那里。\n" +
  "看一眼今天的日期。\n双脚用力踩一踩地面，感受它的支撑。\n" +
  "摸一下身边一个真实的物体，说出它的颜色和触感。\n慢慢告诉自己：「这是现在，不是那时。我是安全的。」";

export const GUARDIAN_ROLES: Array<{ value: string; label: string }> = [
  { value: "family", label: "家人" },
  { value: "friend", label: "朋友" },
  { value: "pastor", label: "牧者" },
  { value: "small_group_leader", label: "小组长" },
  { value: "counselor", label: "咨询师" },
  { value: "doctor", label: "医生" },
  { value: "peer_companion", label: "同伴" },
];
