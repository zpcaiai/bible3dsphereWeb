#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const required = [
  "README.md",
  "CODEX_IMPLEMENTATION_PROMPT.md",
  "IMPLEMENTATION_CHECKLIST.md",
  "BATCH01_COMPATIBILITY.md",
  "SKILL_INDEX.md",
  "RELEASE_NOTES.md",
  "SOURCES.md",
  "AGENTS.md.snippet",
  "references/batch02-blueprint.md",
  "references/api-persistence-blueprint.md",
  "references/attention-assessment-policy.md",
  "references/digital-rule-of-life-policy.md",
  "references/body-rhythm-and-fasting-policy.md",
  "references/formation-plan-policy.md",
  "references/progress-and-privacy-policy.md",
  "references/online-speech-and-pause-policy.md",
  "references/scripture-and-theology-notes.md",
  "schemas/attention-assessment.schema.json",
  "schemas/formation-signal.schema.json",
  "schemas/practice-definition.schema.json",
  "schemas/formation-plan.schema.json",
  "schemas/practice-checkin.schema.json",
  "schemas/formation-review.schema.json",
  "schemas/digital-rule-of-life.schema.json",
  "schemas/digital-sabbath-plan.schema.json",
  "schemas/body-rhythm-plan.schema.json",
  "schemas/pause-protocol.schema.json",
  "schemas/online-speech-reflection.schema.json",
  "assets/practice-catalog.seed.yaml",
  "assets/adult-self-governance-curriculum.seed.yaml",
  "assets/formation-plan-templates.seed.yaml",
  "assets/analytics-events.example.yaml",
  "evals/batch02.skill-prompts.csv",
  "evals/batch02.behavior-rubric.md",
  "evals/batch02.behavior-cases.json"
];

const skills = [
  "spiritual-planet-self-governance-orchestrator",
  "christian-attention-governance-assessment",
  "christian-digital-rule-of-life",
  "christian-digital-sabbath-planner",
  "christian-body-rhythm-discipline",
  "christian-delay-gratification-practices",
  "christian-emotional-pause-protocol",
  "christian-online-speech-discipline",
  "christian-comfort-responsibility-discernment",
  "christian-formation-plan-engine",
  "adult-self-governance-course-integrator"
];

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) failures.push(`Missing ${rel}`);
}

const skillsRoot = path.join(root, ".agents", "skills");
if (!fs.existsSync(skillsRoot)) {
  failures.push("Missing .agents/skills");
} else {
  const actualSkills = fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const expectedSkills = [...skills].sort();
  if (JSON.stringify(actualSkills) !== JSON.stringify(expectedSkills)) {
    failures.push(`Skill directory set differs. Expected ${expectedSkills.join(", ")}; found ${actualSkills.join(", ")}`);
  }
}

for (const skill of skills) {
  const dir = path.join(skillsRoot, skill);
  const file = path.join(dir, "SKILL.md");
  const agent = path.join(dir, "agents", "openai.yaml");
  if (!fs.existsSync(file)) {
    failures.push(`${skill}: missing SKILL.md`);
    continue;
  }

  const text = fs.readFileSync(file, "utf8");
  if (!text.startsWith("---\n")) failures.push(`${skill}: missing YAML front matter`);
  if (!new RegExp(`\\nname:\\s*${skill}\\n`).test(text)) failures.push(`${skill}: incorrect name`);

  const desc = text.match(/\ndescription:\s*(.+)\n/);
  if (!desc) {
    failures.push(`${skill}: missing description`);
  } else {
    try {
      const parsedDescription = JSON.parse(desc[1]);
      if (typeof parsedDescription !== "string" || !parsedDescription.trim()) failures.push(`${skill}: invalid description`);
      if (parsedDescription.length > 1024) failures.push(`${skill}: description exceeds 1024 characters`);
    } catch {
      failures.push(`${skill}: description must be a quoted YAML/JSON string`);
    }
  }

  if (text.length < 1400) failures.push(`${skill}: instructions unexpectedly short`);

  const requiredResourcesMatch = text.match(/# Required resources\s+([\s\S]*?)(?=\n# )/);
  if (requiredResourcesMatch) {
    const resourcePaths = [...requiredResourcesMatch[1].matchAll(/`([^`]+)`/g)].map((match) => match[1]);
    for (const rel of resourcePaths) {
      if (rel.startsWith("$")) continue;
      const resolved = path.resolve(dir, rel);
      if (!fs.existsSync(resolved)) failures.push(`${skill}: missing declared resource ${rel}`);
    }
  }

  if (!fs.existsSync(agent)) {
    failures.push(`${skill}: missing agents/openai.yaml`);
  } else {
    const yaml = fs.readFileSync(agent, "utf8");
    for (const key of ["interface:", "display_name:", "short_description:", "default_prompt:", "policy:", "products:", "- CODEX", "allow_implicit_invocation:"]) {
      if (!yaml.includes(key)) failures.push(`${skill}: openai.yaml missing ${key}`);
    }
    if (!yaml.includes(`$${skill}`)) failures.push(`${skill}: default_prompt does not explicitly invoke the skill`);
  }
}

const schemaIds = new Set();
for (const rel of required.filter((item) => item.startsWith("schemas/") && item.endsWith(".json"))) {
  try {
    const obj = JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
    if (obj.type !== "object") failures.push(`${rel}: root type must be object`);
    if (obj.additionalProperties !== false) failures.push(`${rel}: root must reject unknown properties`);
    if (!obj.$id) failures.push(`${rel}: missing $id`);
    if (schemaIds.has(obj.$id)) failures.push(`${rel}: duplicate $id ${obj.$id}`);
    schemaIds.add(obj.$id);
    const serialized = JSON.stringify(obj);
    if (serialized.includes('"overallScore"')) failures.push(`${rel}: must not define overallScore`);
  } catch (error) {
    failures.push(`${rel}: invalid JSON: ${error.message}`);
  }
}

const catalogPath = path.join(root, "assets", "practice-catalog.seed.yaml");
let practiceCount = 0;
if (fs.existsSync(catalogPath)) {
  const catalog = fs.readFileSync(catalogPath, "utf8");
  practiceCount = (catalog.match(/^  - id:/gm) || []).length;
  if (practiceCount !== 35) failures.push(`Expected 35 practice seeds, found ${practiceCount}`);
  for (const expected of [
    "grace.identity-before-performance",
    "digital.sabbath-two-hours",
    "fasting.food-one-meal-adult-cleared",
    "speech.verify-before-share",
    "comfort.inconvenient-service"
  ]) {
    if (!catalog.includes(expected)) failures.push(`Practice catalog missing ${expected}`);
  }
  if (/review_status:\s*approved/.test(catalog)) failures.push("Practice seeds must not ship pre-approved");
}

const practiceIds = new Set();
if (fs.existsSync(catalogPath)) {
  const catalog = fs.readFileSync(catalogPath, "utf8");
  for (const match of catalog.matchAll(/^  - id:\s*([^\s]+)\s*$/gm)) {
    if (practiceIds.has(match[1])) failures.push(`Duplicate practice ID ${match[1]}`);
    practiceIds.add(match[1]);
  }
}

const curriculumPath = path.join(root, "assets", "adult-self-governance-curriculum.seed.yaml");
let unitCount = 0;
let lessonCount = 0;
if (fs.existsSync(curriculumPath)) {
  const curriculum = fs.readFileSync(curriculumPath, "utf8");
  unitCount = (curriculum.match(/^  - id: adult\.sg\./gm) || []).length;
  lessonCount = (curriculum.match(/^      - id: adult\.sg\./gm) || []).length;
  if (unitCount !== 10) failures.push(`Expected 10 curriculum units, found ${unitCount}`);
  if (lessonCount !== 21) failures.push(`Expected 21 curriculum lessons, found ${lessonCount}`);
  if (!/^review_status:\s*theology_review/m.test(curriculum)) failures.push("Curriculum seed must start in theology_review");
  for (const match of curriculum.matchAll(/practice_ids:\s*\[([^\]]*)\]/g)) {
    for (const raw of match[1].split(",")) {
      const practiceId = raw.trim();
      if (practiceId && !practiceIds.has(practiceId)) failures.push(`Curriculum references unknown practice ${practiceId}`);
    }
  }
}

const templateText = fs.readFileSync(path.join(root, "assets", "formation-plan-templates.seed.yaml"), "utf8");
const horizons = [...templateText.matchAll(/^    horizon_days:\s*(\d+)\s*$/gm)].map((match) => Number(match[1]));
if (JSON.stringify(horizons) !== JSON.stringify([7, 14, 30, 90])) failures.push(`Plan templates must contain 7/14/30/90 horizons; found ${horizons.join(",")}`);

const analyticsText = fs.readFileSync(path.join(root, "assets", "analytics-events.example.yaml"), "utf8");
for (const forbidden of ["assessment_answer", "draft_text", "private_reflection", "browsing_history", "medical_detail", "exact_message_content"]) {
  if (!analyticsText.includes(`  - ${forbidden}`)) failures.push(`Analytics denylist missing ${forbidden}`);
}

const evalPath = path.join(root, "evals", "batch02.skill-prompts.csv");
let evalCount = 0;
if (fs.existsSync(evalPath)) {
  const lines = fs.readFileSync(evalPath, "utf8").trim().split(/\r?\n/);
  evalCount = lines.length - 1;
  if (evalCount !== 48) failures.push(`Expected 48 eval rows, found ${evalCount}`);
  for (const skill of skills) {
    if (!lines.some((line) => line.includes(`,${skill},`))) failures.push(`No eval row for ${skill}`);
  }
}

const behaviorCases = JSON.parse(fs.readFileSync(path.join(root, "evals", "batch02.behavior-cases.json"), "utf8"));
if (!Array.isArray(behaviorCases) || behaviorCases.length !== 18) failures.push(`Expected 18 behavior cases, found ${Array.isArray(behaviorCases) ? behaviorCases.length : "non-array"}`);
for (const item of behaviorCases) {
  if (!item.id || !item.skill || !item.scenario || !Array.isArray(item.must) || !Array.isArray(item.mustNot)) failures.push(`Invalid behavior case ${item.id ?? "unknown"}`);
  if (!skills.includes(item.skill)) failures.push(`Behavior case ${item.id} references unknown skill ${item.skill}`);
}

const plan = JSON.parse(fs.readFileSync(path.join(root, "schemas", "formation-plan.schema.json"), "utf8"));
if (plan.properties?.priorityDomains?.maxItems !== 3) failures.push("Formation plan must cap priorityDomains at 3");
if (plan.properties?.phases?.items?.properties?.practiceAssignments?.maxItems !== 3) failures.push("Formation plan must cap practiceAssignments at 3 per phase");
if (JSON.stringify(plan.properties?.horizonDays?.enum) !== JSON.stringify([7, 14, 30, 90])) failures.push("Formation plan horizons must be 7/14/30/90");

const rule = JSON.parse(fs.readFileSync(path.join(root, "schemas", "digital-rule-of-life.schema.json"), "utf8"));
if (rule.properties?.rules?.items?.properties?.isDivineCommand?.const !== false) failures.push("Digital rules must set isDivineCommand=false");

const speech = JSON.parse(fs.readFileSync(path.join(root, "schemas", "online-speech-reflection.schema.json"), "utf8"));
if (speech.properties?.serverDraftPersisted?.const !== false) failures.push("Online speech draft must not be persisted");
if (speech.properties?.analyticsContentIncluded?.const !== false) failures.push("Online speech content must not enter analytics");

const body = JSON.parse(fs.readFileSync(path.join(root, "schemas", "body-rhythm-plan.schema.json"), "utf8"));
if (body.properties?.sensitiveHealthDetailsStored?.const !== false) failures.push("Body plan must not store sensitive health details");

const assessment = JSON.parse(fs.readFileSync(path.join(root, "schemas", "attention-assessment.schema.json"), "utf8"));
if (assessment.properties?.result?.properties?.diagnosisGenerated?.const !== false) failures.push("Assessment must not generate diagnosis");
if (assessment.properties?.result?.properties?.salvationInferenceGenerated?.const !== false) failures.push("Assessment must not infer salvation");

const review = JSON.parse(fs.readFileSync(path.join(root, "schemas", "formation-review.schema.json"), "utf8"));
if (review.properties?.spiritualMaturityJudgment?.const !== "not_generated") failures.push("Review must not generate spiritual maturity judgment");

if (failures.length) {
  console.error("Batch 02 validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Batch 02 static validation passed.");
console.log(`Validated ${skills.length} skills, ${required.length} shared resources, ${schemaIds.size} schemas, ${practiceCount} practices, ${unitCount} units / ${lessonCount} lessons, and ${evalCount} routing eval rows plus ${behaviorCases.length} behavior cases.`);
