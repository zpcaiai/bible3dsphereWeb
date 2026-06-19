import { describe, expect, it } from "vitest";
import {
  strongholds,
  strongholdArchetypes,
  strongholdMap,
  strongholdArchetypeMap,
  DOCTRINE_NAMES,
} from "../data/strongholds";
import { scanStrongholds } from "../lib/strongholdDiscernment";

describe("stronghold ontology integrity", () => {
  it("contains exactly 8 archetypes and 18 patterns", () => {
    expect(strongholdArchetypes).toHaveLength(8);
    expect(strongholds).toHaveLength(18);
  });

  it("has unique codes for every pattern", () => {
    const codes = strongholds.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("maps every pattern to a real archetype and covers all 8", () => {
    const used = new Set<string>();
    for (const s of strongholds) {
      expect(strongholdArchetypeMap[s.archetypeCode]).toBeTruthy();
      used.add(s.archetypeCode);
    }
    expect(used.size).toBe(8);
  });

  it("requires coreLie, falseGospel, rootDesires, rootFears, blockedDoctrines, gospelReframe on each pattern", () => {
    for (const s of strongholds) {
      expect(s.coreLie.zh.length).toBeGreaterThan(0);
      expect(s.coreLie.en.length).toBeGreaterThan(0);
      expect(s.falseGospel.zh.length).toBeGreaterThan(0);
      expect(s.rootDesires.zh.length).toBeGreaterThan(0);
      expect(s.rootFears.zh.length).toBeGreaterThan(0);
      expect(s.blockedDoctrines.length).toBeGreaterThan(0);
      expect(s.gospelReframe.zh.length).toBeGreaterThan(20);
      // every blocked doctrine code must resolve to a known doctrine name
      for (const d of s.blockedDoctrines) expect(DOCTRINE_NAMES[d]).toBeTruthy();
      // bilingual lists stay index-parallel
      expect(s.rootDesires.zh.length).toBe(s.rootDesires.en.length);
    }
  });
});

describe("scanStrongholds — pattern detection", () => {
  it("detects control idolatry from uncertainty + over-planning", () => {
    const r = scanStrongholds({
      text: "只要事情有一点不确定，我就很焦虑。我必须把每个细节都安排好。",
    });
    expect(r.safety.level).toBe("none");
    expect(r.primary?.code).toBe("control_idolatry");
    expect(r.primary?.evidence.length).toBeGreaterThan(0);
  });

  it("detects achievement idolatry from proving worth through success", () => {
    const r = scanStrongholds({
      text: "如果我不成功，别人根本不会尊重我。我必须证明自己。",
    });
    expect(r.primary?.code).toBe("achievement_idolatry");
  });

  it("detects the suffering objection without forcing repentance", () => {
    const r = scanStrongholds({
      text: "如果神真的爱我，为什么允许这些事发生？我太痛苦了。",
    });
    expect(r.detected.map((d) => d.code)).toContain("suffering_objection");
  });

  it("works on English input too", () => {
    const r = scanStrongholds({ text: "I must succeed or no one will respect me; I have to prove myself." });
    expect(r.primary?.code).toBe("achievement_idolatry");
  });

  it("distinguishes success from control", () => {
    const r = scanStrongholds({ text: "我必须成功才有价值。" });
    expect(r.primary?.code).toBe("achievement_idolatry");
    expect(r.primary?.code).not.toBe("control_idolatry");
  });

  it("returns no signal for vague neutral input", () => {
    const r = scanStrongholds({ text: "今天天气不错，我去散步了。" });
    expect(r.hasSignal).toBe(false);
    expect(r.primary).toBeNull();
  });
});

describe("scanStrongholds — pastoral safety", () => {
  it("short-circuits to a crisis response on self-harm language and skips analysis", () => {
    const r = scanStrongholds({
      text: "我真的撑不下去了，活着没有意义，我想结束这一切。",
    });
    expect(r.safety.level).toBe("crisis");
    expect(r.safety.message).toBeTruthy();
    expect(r.detected).toHaveLength(0);
    expect(r.primary).toBeNull();
  });

  it("does not over-trigger crisis on ordinary struggle", () => {
    const r = scanStrongholds({ text: "我最近压力很大，很想掌控一切。" });
    expect(r.safety.level).toBe("none");
  });
});

describe("scanStrongholds — root diagnosis", () => {
  it("surfaces the blocked doctrine and archetype of the primary pattern", () => {
    const r = scanStrongholds({ text: "我必须把每件事都掌控好，否则就会失控崩掉。" });
    expect(r.rootDiagnosis.primaryStrongholdCode).toBe("control_idolatry");
    expect(r.rootDiagnosis.archetypeCode).toBe(strongholdMap["control_idolatry"].archetypeCode);
    expect(r.rootDiagnosis.blockedDoctrineCode).toBeTruthy();
  });
});
