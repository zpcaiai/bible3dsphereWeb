import { describe, expect, it } from "vitest";
import { mapScriptureThemes } from "../lib/scriptureThemeMapper";

const codes = (r: ReturnType<typeof mapScriptureThemes>) => r.themes.map((t) => t.code);

describe("mapScriptureThemes", () => {
  it("maps achievement idolatry to identity / justification / grace", () => {
    const r = mapScriptureThemes({
      strongholdCodes: ["achievement_idolatry"],
      doctrineCodes: ["grace", "justification", "identity_in_christ"],
    });
    expect(codes(r)).toContain("identity_in_christ");
    expect(codes(r).some((c) => ["justification_by_faith", "grace"].includes(c))).toBe(true);
  });

  it("maps the suffering objection to lament / cross / hope (comfort need)", () => {
    const r = mapScriptureThemes({
      strongholdCodes: ["suffering_objection"],
      doctrineCodes: ["god_love", "cross"],
      needType: "comfort",
    });
    expect(codes(r)).toContain("suffering_and_lament");
    expect(codes(r).some((c) => ["cross_and_atonement", "resurrection_hope"].includes(c))).toBe(true);
  });

  it("maps control idolatry to sovereignty / rest", () => {
    const r = mapScriptureThemes({
      strongholdCodes: ["control_idolatry"],
      doctrineCodes: ["god_sovereignty"],
    });
    expect(codes(r)).toContain("god_sovereignty");
  });

  it("produces a deduped, capped reading plan with full day fields", () => {
    const r = mapScriptureThemes({
      strongholdCodes: ["achievement_idolatry", "control_idolatry"],
      doctrineCodes: ["grace", "god_sovereignty"],
      planDays: 5,
    });
    const refs = r.readingPlan.days.map((d) => d.reference);
    expect(refs.length).toBeGreaterThan(0);
    expect(refs.length).toBeLessThanOrEqual(5);
    expect(new Set(refs).size).toBe(refs.length);
    for (const d of r.readingPlan.days) {
      expect(d.reference.length).toBeGreaterThan(0);
      expect(d.text.length).toBeGreaterThan(0);
      expect(d.meditationQuestion.length).toBeGreaterThan(0);
      expect(d.prayerPrompt.length).toBeGreaterThan(0);
      expect(d.themeCode.length).toBeGreaterThan(0);
    }
  });

  it("each theme carries reason, passages and meditation questions", () => {
    const r = mapScriptureThemes({ strongholdCodes: ["consumerism"], doctrineCodes: ["grace"] });
    expect(r.themes.length).toBeGreaterThan(0);
    for (const t of r.themes) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.reason.length).toBeGreaterThan(0);
      expect(t.primaryPassages.length).toBeGreaterThan(0);
      expect(t.meditationQuestions.length).toBeGreaterThan(0);
    }
  });
});
