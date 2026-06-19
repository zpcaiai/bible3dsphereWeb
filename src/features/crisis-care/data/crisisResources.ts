// Multi-region crisis resources — offline fallback that mirrors the backend
// crisis_engine.CRISIS_RESOURCES. Numbers verified against official sources
// (2025/2026). The backend /api/crisis/resources is authoritative; this is the
// degraded-mode copy so the "我现在撑不住了" flow still works when offline.

import type { ResourceBlock } from "../types/crisis";

export const CRISIS_RESOURCES: Record<string, ResourceBlock> = {
  TW: {
    region: "台湾",
    regionCode: "TW",
    emergencyNumber: "119",
    resources: [
      { name: "1925 安心專線（依舊愛我）", contact: "1925", availability: "24/7", type: "suicide_prevention", note: "卫生福利部免费专线，自杀危机即时介入与转介" },
      { name: "1995 生命線協談專線", contact: "1995", availability: "24/7", type: "emotional_support", note: "民间团体，各类心理困扰协助" },
      { name: "1980 張老師專線", contact: "1980", availability: "一至六 09:00-21:00 / 日 09:00-17:00", type: "emotional_support", note: "情绪困扰、生活适应" },
      { name: "紧急救护／消防", contact: "119", availability: "24/7", type: "emergency", note: "医疗急症" },
      { name: "警察", contact: "110", availability: "24/7", type: "emergency", note: "人身安全/家暴/跟踪" },
    ],
  },
  CN: {
    region: "中国大陆",
    regionCode: "CN",
    emergencyNumber: "120",
    resources: [
      { name: "12356 全国统一心理援助热线", contact: "12356", availability: "24/7", type: "mental_health", note: "国家卫健委统一心理援助热线，全国各省已开通" },
      { name: "北京心理危机研究与干预中心", contact: "010-82951332", availability: "24/7", type: "suicide_prevention", note: "固话可拨 800-810-1117" },
      { name: "医疗急救", contact: "120", availability: "24/7", type: "emergency", note: "吞药/出血/昏迷等医疗急症" },
      { name: "警察", contact: "110", availability: "24/7", type: "emergency", note: "人身安全/家暴/正在发生的危险" },
    ],
  },
  HK: {
    region: "香港",
    regionCode: "HK",
    emergencyNumber: "999",
    resources: [
      { name: "撒瑪利亞防止自殺會 24 小時熱線", contact: "2389 2222", availability: "24/7", type: "suicide_prevention", note: "粤语情绪支援与自杀防治" },
      { name: "Samaritan Befrienders（English）", contact: "2389 2223", availability: "24/7", type: "emotional_support", note: "English emotional support" },
      { name: "緊急服務", contact: "999", availability: "24/7", type: "emergency", note: "立即危险/医疗/警务" },
    ],
  },
  US: {
    region: "United States",
    regionCode: "US",
    emergencyNumber: "911",
    resources: [
      { name: "988 Suicide & Crisis Lifeline", contact: "988", availability: "24/7", type: "suicide_prevention", note: "Call or text 988; chat at 988lifeline.org" },
      { name: "Crisis Text Line", contact: "741741", availability: "24/7", type: "text", note: "Text HOME to 741741" },
      { name: "Emergency", contact: "911", availability: "24/7", type: "emergency", note: "Immediate danger" },
    ],
  },
  INTL: {
    region: "International",
    regionCode: "INTL",
    emergencyNumber: null,
    resources: [
      { name: "当地紧急电话 / Local emergency number", contact: "—", availability: "24/7", type: "emergency", note: "请拨打你所在国家/地区的紧急电话" },
      { name: "Find a Helpline", contact: "findahelpline.com", availability: "24/7", type: "emotional_support", note: "按所在地查询当地心理危机热线" },
    ],
  },
};

export const REGION_OPTIONS: Array<{ code: string; label: string }> = [
  { code: "TW", label: "台湾" },
  { code: "CN", label: "中国大陆" },
  { code: "HK", label: "香港 / 澳门" },
  { code: "US", label: "United States" },
  { code: "INTL", label: "其他地区 / International" },
];

export function resolveRegion(locale?: string | null): string {
  if (!locale) return "TW";
  const low = String(locale).toLowerCase();
  if (/tw|taiwan|台湾|臺灣/.test(low)) return "TW";
  if (/hk|hong\s*kong|香港|mo|macau|澳门|澳門/.test(low)) return "HK";
  if (/cn|china|大陆|大陸|中国|中國/.test(low)) return "CN";
  if (/^en|us|usa|united\s*states|america/.test(low)) return "US";
  if (low.startsWith("zh")) return "TW";
  return "INTL";
}

export function getResources(regionOrLocale?: string | null): ResourceBlock {
  const code = CRISIS_RESOURCES[regionOrLocale as string]
    ? (regionOrLocale as string)
    : resolveRegion(regionOrLocale);
  return CRISIS_RESOURCES[code] || CRISIS_RESOURCES.TW;
}
