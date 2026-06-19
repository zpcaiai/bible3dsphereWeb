import { describe, expect, it } from "vitest";
import { triageClient } from "../lib/triage";

const rank = { green: 0, yellow: 1, orange: 2, red: 3 } as const;

describe("triageClient (offline fallback)", () => {
  it("passive suicidal ideation is orange", () => {
    const r = triageClient("我不想活了。");
    expect(r.riskLevel).toBe("orange");
    expect(r.riskTypes).toContain("suicidal_ideation");
    expect(r.requiresDirectSafetyQuestion).toBe(true);
  });

  it("explicit plan/means is red", () => {
    expect(triageClient("我今晚已经准备好药了。").riskLevel).toBe("red");
    expect(triageClient("站在天台上，现在就要结束。").riskLevel).toBe("red");
    expect(triageClient("我吞了一整瓶安眠药。").riskLevel).toBe("red");
  });

  it("death-adjacent shame is at least orange", () => {
    const r = triageClient("我犯罪太多，神不会赦免我，我不配活。");
    expect(rank[r.riskLevel]).toBeGreaterThanOrEqual(rank.orange);
  });

  it("addiction relapse detected, at least yellow", () => {
    const r = triageClient("我现在快要控制不住去看色情内容了。");
    expect(r.riskTypes).toContain("addiction_relapse");
    expect(rank[r.riskLevel]).toBeGreaterThanOrEqual(rank.yellow);
  });

  it("dissociation / trauma detected", () => {
    const r = triageClient("我感觉自己又回到那件事里了，身体动不了。");
    expect(r.riskTypes.some((t) => t === "dissociation" || t === "trauma_trigger")).toBe(true);
  });

  it("mild distress is not red", () => {
    const r = triageClient("我今天压力很大，想哭。");
    expect(r.riskLevel).not.toBe("red");
  });

  it("harm to others detected", () => {
    const r = triageClient("我想杀了他，让他付出代价。");
    expect(r.riskTypes).toContain("harm_to_others");
  });

  it("always returns a valid level and never throws on empty", () => {
    for (const t of ["", "你好", "今天天气不错", "我想死"]) {
      const r = triageClient(t);
      expect(["green", "yellow", "orange", "red"]).toContain(r.riskLevel);
    }
  });
});
