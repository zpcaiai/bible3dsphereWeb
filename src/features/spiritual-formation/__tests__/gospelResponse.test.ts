import { describe, expect, it } from "vitest";
import { scanStrongholds } from "../lib/strongholdDiscernment";
import { buildGospelResponse } from "../lib/gospelResponse";
import {
  strongholds,
  strongholdArchetypes,
  strongholdMap,
  DOCTRINE_NAMES,
} from "../data/strongholds";
import {
  PRAYER_BY_ARCHETYPE,
  DOCTRINE_RESPONSE,
  FALSE_GOSPEL_LABEL,
} from "../data/gospelResponse";

describe("gospel-response data coverage", () => {
  it("has a prayer set for every archetype", () => {
    for (const a of strongholdArchetypes) {
      const set = PRAYER_BY_ARCHETYPE[a.code];
      expect(set, a.code).toBeTruthy();
      expect(set.text.zh.length).toBeGreaterThan(20);
      expect(set.text.en.length).toBeGreaterThan(20);
      expect(set.reflectionQuestions.zh.length).toBeGreaterThan(0);
      expect(set.todayAction.zh.length).toBeGreaterThan(0);
      expect(set.weekPractice.zh.length).toBeGreaterThan(0);
    }
  });

  it("has a false-gospel label for every stronghold", () => {
    for (const s of strongholds) {
      expect(FALSE_GOSPEL_LABEL[s.code], s.code).toBeTruthy();
    }
  });

  it("has a teaching response for every doctrine referenced by a stronghold", () => {
    const referenced = new Set<string>();
    strongholds.forEach((s) => s.blockedDoctrines.forEach((d) => referenced.add(d)));
    for (const code of referenced) {
      // @ts-expect-error index by string
      expect(DOCTRINE_RESPONSE[code], code).toBeTruthy();
      // @ts-expect-error index by string
      expect(DOCTRINE_NAMES[code], code).toBeTruthy();
    }
  });
});

describe("buildGospelResponse", () => {
  it("returns null for crisis input", () => {
    const scan = scanStrongholds({ text: "我撑不下去了，活着没有意义，我想结束这一切。" });
    expect(buildGospelResponse(scan)).toBeNull();
  });

  it("returns null when there is no signal", () => {
    const scan = scanStrongholds({ text: "今天天气不错，我去散步了。" });
    expect(buildGospelResponse(scan)).toBeNull();
  });

  it("builds a full plan for control idolatry → surrender prayer", () => {
    const scan = scanStrongholds({ text: "只要事情有一点不确定，我就很焦虑。我必须把每个细节都安排好。" });
    const plan = buildGospelResponse(scan);
    expect(plan).not.toBeNull();
    if (!plan) return;
    expect(plan.primaryStrongholdCode).toBe("control_idolatry");
    expect(plan.prayer.type).toBe("surrender"); // self_sovereignty archetype
    expect(plan.prayer.text.length).toBeGreaterThan(20);
    expect(plan.falseGospel.label.length).toBeGreaterThan(0);
    expect(plan.falseGospel.gospelCorrection.length).toBeGreaterThan(0);
    expect(strongholdMap["control_idolatry"].blockedDoctrines).toContain(plan.blockedDoctrine.code);
    expect(plan.blockedDoctrine.teachingTheme.length).toBeGreaterThan(0);
    expect(plan.scripturePlan.days.length).toBeGreaterThan(0);
    for (const d of plan.scripturePlan.days) {
      expect(d.reference.length).toBeGreaterThan(0);
      expect(d.text.length).toBeGreaterThan(0);
      expect(d.meditationQuestion.length).toBeGreaterThan(0);
      expect(d.prayerPrompt.length).toBeGreaterThan(0);
    }
    expect(plan.reflectionQuestions.length).toBeGreaterThan(0);
    expect(plan.action.today.length).toBeGreaterThan(0);
    expect(plan.action.thisWeek.length).toBeGreaterThan(0);
  });

  it("builds an identity-focused plan for achievement idolatry", () => {
    const scan = scanStrongholds({ text: "如果我不成功，别人根本不会尊重我。我必须证明自己。" });
    const plan = buildGospelResponse(scan);
    expect(plan).not.toBeNull();
    if (!plan) return;
    expect(plan.primaryStrongholdCode).toBe("achievement_idolatry");
    expect(plan.prayer.type).toBe("identity"); // performance_righteousness archetype
    expect(["grace", "justification", "identity_in_christ"]).toContain(plan.blockedDoctrine.code);
  });

  it("builds a lament plan for the suffering objection", () => {
    const scan = scanStrongholds({ text: "如果神真的爱我，为什么允许这些事发生？我太痛苦了。" });
    const plan = buildGospelResponse(scan);
    expect(plan).not.toBeNull();
    if (!plan) return;
    expect(plan.prayer.type).toBe("lament"); // wounded_unbelief archetype
  });

  it("dedupes scripture references and caps the reading plan", () => {
    const scan = scanStrongholds({ text: "我必须成功才有价值，也想掌控一切，还很怕失败。" });
    const plan = buildGospelResponse(scan);
    if (!plan) return;
    const refs = plan.scripturePlan.days.map((d) => d.reference);
    expect(new Set(refs).size).toBe(refs.length);
    expect(refs.length).toBeLessThanOrEqual(5);
  });
});
