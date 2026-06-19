import { describe, expect, it } from "vitest";
import { buildRepentancePath } from "../lib/repentancePath";
import { strongholdMap } from "../data/strongholds";

const noTokens = (s: string) => !/\{(name|idol|lie|truth|doctrine)\}/.test(s);

describe("buildRepentancePath", () => {
  it("builds a 7-day path with prayer, fruit indicators and filled tokens", () => {
    const plan = buildRepentancePath("achievement_idolatry", "seven_days");
    expect(plan).not.toBeNull();
    if (!plan) return;
    expect(plan.days).toHaveLength(7);
    expect(plan.title.length).toBeGreaterThan(0);
    expect(plan.focus.coreLie.length).toBeGreaterThan(0);
    expect(plan.prayer.text.length).toBeGreaterThan(20);
    expect(plan.fruitIndicators.length).toBeGreaterThan(0);
    // tokens must be fully replaced in every day
    for (const d of plan.days) {
      expect(noTokens(d.action), d.action).toBe(true);
      expect(noTokens(d.reviewQuestion), d.reviewQuestion).toBe(true);
    }
    // day 1 references the stronghold name (runtime lang may be zh or en under jsdom)
    const nm = strongholdMap["achievement_idolatry"].name;
    expect(plan.days[0].action.includes(nm.zh) || plan.days[0].action.includes(nm.en)).toBe(true);
  });

  it("supports 30-day with weekly fruit review and 1-day condensed", () => {
    const thirty = buildRepentancePath("control_idolatry", "thirty_days");
    expect(thirty?.days).toHaveLength(30);
    expect(thirty?.days[6].stage).toBe("fruit_review"); // day 7
    expect(thirty?.days[13].stage).toBe("fruit_review"); // day 14
    const one = buildRepentancePath("control_idolatry", "one_day");
    expect(one?.days).toHaveLength(1);
  });

  it("uses gentle companion-oriented cautions for wounded patterns", () => {
    const plan = buildRepentancePath("suffering_objection", "seven_days");
    expect(plan?.cautions.length).toBeGreaterThan(0);
    expect(plan?.cautions.join(" ")).toMatch(/同伴|陪|companion|alone/);
  });

  it("returns null for unknown stronghold", () => {
    expect(buildRepentancePath("nope", "seven_days")).toBeNull();
  });
});
