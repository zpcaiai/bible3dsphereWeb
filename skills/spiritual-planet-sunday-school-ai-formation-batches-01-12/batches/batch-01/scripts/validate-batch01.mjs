#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "README.md",
  "AGENTS.md.snippet",
  "references/module-blueprint.md",
  "references/theological-baseline.md",
  "references/pastoral-safety-policy.md",
  "schemas/module-contract.schema.json",
  "schemas/learner-context.schema.json",
  "schemas/content-block.schema.json",
  "schemas/safety-decision.schema.json",
  "assets/module-manifest.example.yaml",
  "evals/batch01.skill-prompts.csv"
];

const skills = [
  "spiritual-planet-ai-formation-orchestrator",
  "christian-formation-theological-guardrails",
  "christian-formation-domain-model",
  "christian-formation-context-intake",
  "christian-formation-pastoral-safety",
  "sunday-school-tab-module-integrator"
];

const failures = [];

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) failures.push(`Missing ${rel}`);
}

for (const skill of skills) {
  const file = path.join(root, ".agents", "skills", skill, "SKILL.md");
  if (!fs.existsSync(file)) {
    failures.push(`Missing ${file}`);
    continue;
  }

  const text = fs.readFileSync(file, "utf8");
  if (!text.startsWith("---\n")) failures.push(`${skill}: missing YAML front matter`);
  if (!new RegExp(`\\nname:\\s*${skill}\\n`).test(text)) failures.push(`${skill}: incorrect name`);
  if (!/\ndescription:\s*\S+/.test(text)) failures.push(`${skill}: missing description`);
  if (text.length < 800) failures.push(`${skill}: instructions unexpectedly short`);

  const openaiYaml = path.join(root, ".agents", "skills", skill, "agents", "openai.yaml");
  if (!fs.existsSync(openaiYaml)) failures.push(`${skill}: missing optional UI metadata`);
}

for (const rel of required.filter((p) => p.endsWith(".json"))) {
  try {
    JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
  } catch (error) {
    failures.push(`${rel}: invalid JSON: ${error.message}`);
  }
}

const evalPath = path.join(root, "evals", "batch01.skill-prompts.csv");
if (fs.existsSync(evalPath)) {
  const lines = fs.readFileSync(evalPath, "utf8").trim().split(/\r?\n/);
  if (lines.length < 21) failures.push("Expected at least 20 eval rows");
}

if (failures.length) {
  console.error("Batch 01 validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Batch 01 static validation passed.");
console.log(`Validated ${skills.length} skills, ${required.length} shared resources, and starter evals.`);
