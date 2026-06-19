// 危机后 → 模式库（spiritual-formation）的桥接。
// 复用 spiritual-formation 自己的 plan 生成 + 持久化，确保 user_id 正确。
// 框架：这是恢复期一个「可改的起点」，绝不暗示危机本身是罪。
import { generateTransformationPlan } from "../../spiritual-formation/lib/planGenerator";
import { createTransformationPlanRemote } from "../../spiritual-formation/lib/apiStorage";
import { saveTransformationPlan } from "../../spiritual-formation/lib/storage";
import { crisisApi } from "./api";

export interface FormationSeed {
  primarySinPattern: string;
  secondarySinPattern?: string | null;
  duration: string;
  intensity: string;
  title?: string;
  note?: string;
  riskTypes?: string[];
}

const FALLBACK: FormationSeed = {
  primarySinPattern: "spiritual_numbness",
  secondarySinPattern: null,
  duration: "30_days",
  intensity: "light",
};

export async function importCrisisToFormation(opts: { userId: string; token?: string; riskTypes?: string[] }) {
  let seed: FormationSeed = FALLBACK;
  try {
    seed = (await crisisApi.formationSeed(opts.riskTypes)) as FormationSeed;
  } catch {
    seed = FALLBACK;
  }
  const plan = generateTransformationPlan({
    userId: opts.userId,
    duration: (seed.duration || "30_days") as any,
    intensity: (seed.intensity || "light") as any,
    primarySinPattern: (seed.primarySinPattern || "spiritual_numbness") as any,
    secondarySinPattern: (seed.secondarySinPattern || undefined) as any,
  });
  try { saveTransformationPlan(plan); } catch { /* local quota */ }
  if (opts.token) {
    try { await createTransformationPlanRemote(plan, opts.token); } catch { /* keep local */ }
  }
  return { plan, seed };
}
