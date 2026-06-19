import { beforeEach, describe, expect, it } from "vitest";
import { scanStrongholds } from "../lib/strongholdDiscernment";
import {
  inferTriggerType,
  recordFromScan,
  summarizeStrongholdHistory,
  saveScanRecord,
  listScanRecords,
  clearScanRecords,
  buildGrowthInsight,
  type StrongholdScanRecord,
} from "../lib/strongholdHistory";

const NOW = Date.parse("2026-06-19T00:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString();

function rec(p: Partial<StrongholdScanRecord>): StrongholdScanRecord {
  return {
    id: Math.random().toString(36).slice(2),
    userId: "u1",
    date: daysAgo(1),
    text: "",
    emotions: [],
    primaryCode: "control_idolatry",
    detectedCodes: ["control_idolatry"],
    archetypeCode: "self_sovereignty",
    blockedDoctrineCode: "god_sovereignty",
    triggerType: null,
    confidence: 0.6,
    ...p,
  };
}

describe("inferTriggerType", () => {
  it("classifies common triggers", () => {
    expect(inferTriggerType("我今天被批评了，很难受")).toBe("criticism");
    expect(inferTriggerType("别人比我强，我很嫉妒")).toBe("comparison");
    expect(inferTriggerType("只要不确定我就很焦虑")).toBe("uncertainty");
    expect(inferTriggerType("I keep comparing myself to my coworker")).toBe("comparison");
  });
  it("returns null when nothing matches", () => {
    expect(inferTriggerType("今天天气不错，我去散步了")).toBeNull();
  });
});

describe("recordFromScan", () => {
  it("captures primary, archetype, blocked doctrine and trigger", () => {
    const scan = scanStrongholds({ text: "只要事情有一点不确定，我就很焦虑，必须把每个细节都安排好。" });
    const r = recordFromScan("u1", "只要事情有一点不确定，我就很焦虑，必须把每个细节都安排好。", ["焦虑"], scan, new Date(NOW));
    expect(r.primaryCode).toBe("control_idolatry");
    expect(r.archetypeCode).toBe("self_sovereignty");
    expect(r.blockedDoctrineCode).toBeTruthy();
    expect(r.triggerType).toBe("uncertainty");
    expect(r.detectedCodes.length).toBeGreaterThan(0);
  });
});

describe("summarizeStrongholdHistory", () => {
  const records: StrongholdScanRecord[] = [
    rec({ primaryCode: "control_idolatry", archetypeCode: "self_sovereignty", triggerType: "uncertainty", date: daysAgo(20) }),
    rec({ primaryCode: "control_idolatry", archetypeCode: "self_sovereignty", triggerType: "uncertainty", date: daysAgo(5) }),
    rec({ primaryCode: "control_idolatry", archetypeCode: "self_sovereignty", triggerType: "criticism", date: daysAgo(3) }),
    rec({ primaryCode: "achievement_idolatry", archetypeCode: "performance_righteousness", triggerType: "comparison", date: daysAgo(22) }),
    rec({ primaryCode: "achievement_idolatry", archetypeCode: "performance_righteousness", triggerType: "comparison", date: daysAgo(21) }),
    rec({ primaryCode: "nihilism", archetypeCode: "wounded_unbelief", triggerType: null, date: daysAgo(40) }), // outside 30d
  ];

  it("filters by range", () => {
    const s30 = summarizeStrongholdHistory(records, 30, NOW);
    expect(s30.totalScans).toBe(5); // excludes the 40d-old record
    const s90 = summarizeStrongholdHistory(records, 90, NOW);
    expect(s90.totalScans).toBe(6);
  });

  it("ranks top strongholds and computes trend", () => {
    const s = summarizeStrongholdHistory(records, 30, NOW);
    expect(s.topStrongholds[0].code).toBe("control_idolatry");
    expect(s.topStrongholds[0].count).toBe(3);
    expect(s.topStrongholds[0].trend).toBe("rising"); // more in later half
    const ach = s.topStrongholds.find((x) => x.code === "achievement_idolatry");
    expect(ach?.trend).toBe("falling"); // both early
  });

  it("groups triggers with linked strongholds", () => {
    const s = summarizeStrongholdHistory(records, 30, NOW);
    const uncertainty = s.topTriggers.find((t) => t.type === "uncertainty");
    expect(uncertainty?.count).toBe(2);
    expect(uncertainty?.linkedStrongholds).toContain("control_idolatry");
    const comparison = s.topTriggers.find((t) => t.type === "comparison");
    expect(comparison?.linkedStrongholds).toContain("achievement_idolatry");
  });

  it("distributes archetypes", () => {
    const s = summarizeStrongholdHistory(records, 30, NOW);
    const sov = s.archetypeDistribution.find((a) => a.code === "self_sovereignty");
    expect(sov?.count).toBe(3);
  });
});

describe("localStorage persistence", () => {
  beforeEach(() => { window.localStorage.clear(); });

  it("saves and lists records per user, and ignores no-signal records", () => {
    saveScanRecord(rec({ userId: "u1", primaryCode: "control_idolatry" }));
    saveScanRecord(rec({ userId: "u2", primaryCode: "achievement_idolatry" }));
    saveScanRecord(rec({ userId: "u1", primaryCode: null })); // ignored
    expect(listScanRecords("u1")).toHaveLength(1);
    expect(listScanRecords("u2")).toHaveLength(1);
  });

  it("clears records for a user only", () => {
    saveScanRecord(rec({ userId: "u1" }));
    saveScanRecord(rec({ userId: "u2" }));
    clearScanRecords("u1");
    expect(listScanRecords("u1")).toHaveLength(0);
    expect(listScanRecords("u2")).toHaveLength(1);
  });
});

describe("buildGrowthInsight", () => {
  const records: StrongholdScanRecord[] = [
    rec({ primaryCode: "control_idolatry", archetypeCode: "self_sovereignty", triggerType: "uncertainty", date: daysAgo(20) }),
    rec({ primaryCode: "control_idolatry", archetypeCode: "self_sovereignty", triggerType: "uncertainty", date: daysAgo(5) }),
    rec({ primaryCode: "control_idolatry", archetypeCode: "self_sovereignty", triggerType: "uncertainty", date: daysAgo(3) }),
    rec({ primaryCode: "achievement_idolatry", archetypeCode: "performance_righteousness", triggerType: "comparison", date: daysAgo(24) }),
    rec({ primaryCode: "achievement_idolatry", archetypeCode: "performance_righteousness", triggerType: "comparison", date: daysAgo(22) }),
  ];

  it("needs at least 2 scans", () => {
    const one = summarizeStrongholdHistory([records[0]], 30, NOW);
    expect(buildGrowthInsight(one).hasData).toBe(false);
  });

  it("surfaces a focus stronghold with its dominant trigger", () => {
    const summary = summarizeStrongholdHistory(records, 30, NOW);
    const insight = buildGrowthInsight(summary);
    expect(insight.hasData).toBe(true);
    expect(insight.focus?.strongholdCode).toBe("control_idolatry");
    expect(insight.focus?.topTrigger).toBe("uncertainty");
  });

  it("reports easing patterns as growth signals", () => {
    const summary = summarizeStrongholdHistory(records, 30, NOW);
    const insight = buildGrowthInsight(summary);
    expect(insight.growthSignals.map((g) => g.strongholdCode)).toContain("achievement_idolatry");
    expect(insight.watchPoints.map((w) => w.strongholdCode)).toContain("control_idolatry");
  });
});
