#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const required = [
  "README.md","CODEX_IMPLEMENTATION_PROMPT.md","IMPLEMENTATION_CHECKLIST.md","BATCH01_02_COMPATIBILITY.md","SKILL_INDEX.md","RELEASE_NOTES.md","SOURCES.md","AGENTS.md.snippet",
  "references/batch03-blueprint.md","references/ai-authority-and-idolatry-policy.md","references/non-outsourcable-capabilities-policy.md","references/verification-and-provenance-policy.md","references/scripture-citation-validation-policy.md","references/spiritual-content-boundaries-policy.md","references/algorithmic-worldview-policy.md","references/media-desire-liturgy-policy.md","references/socratic-discernment-policy.md","references/learning-integrity-policy.md","references/journal-privacy-safety-analytics-policy.md","references/api-persistence-blueprint.md",
  "schemas/ai-use-intent.schema.json","schemas/ai-authority-boundary-decision.schema.json","schemas/non-outsourcable-capability.schema.json","schemas/evidence-claim.schema.json","schemas/ai-answer-verification-session.schema.json","schemas/scripture-citation-check.schema.json","schemas/spiritual-content-boundary-decision.schema.json","schemas/algorithmic-worldview-analysis.schema.json","schemas/media-desire-analysis.schema.json","schemas/socratic-discernment-session.schema.json","schemas/ai-learning-integrity-record.schema.json","schemas/discernment-journal-entry.schema.json","schemas/discernment-review.schema.json",
  "assets/ai-discernment-practice-catalog.seed.yaml","assets/ai-discernment-curriculum.seed.yaml","assets/algorithm-worldview-scenarios.seed.yaml","assets/ai-use-boundary-matrix.seed.yaml","assets/source-quality-rubric.seed.yaml","assets/analytics-events.example.yaml","assets/teacher-facilitation-cards.seed.yaml",
  "evals/batch03.skill-prompts.csv","evals/batch03.behavior-rubric.md","evals/batch03.behavior-cases.json"
];
const skills = [
  "spiritual-planet-ai-discernment-orchestrator","christian-ai-role-authority-discernment","christian-non-outsourcable-capabilities","christian-ai-answer-verification","christian-scripture-citation-guard","christian-ai-spiritual-content-boundaries","christian-algorithmic-worldview-analyzer","christian-media-desire-liturgy-discernment","christian-socratic-media-discernment","christian-ai-learning-integrity","christian-discernment-journal-review","ai-discernment-course-integrator"
];
for (const rel of required) if (!fs.existsSync(path.join(root, rel))) failures.push(`Missing ${rel}`);
const skillsRoot = path.join(root, ".agents", "skills");
if (!fs.existsSync(skillsRoot)) failures.push("Missing .agents/skills");
else {
  const actual = fs.readdirSync(skillsRoot,{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>e.name).sort();
  if (JSON.stringify(actual)!==JSON.stringify([...skills].sort())) failures.push(`Skill directory set differs. Found ${actual.join(", ")}`);
}
for (const skill of skills) {
  const dir=path.join(skillsRoot,skill), file=path.join(dir,"SKILL.md"), agent=path.join(dir,"agents","openai.yaml");
  if (!fs.existsSync(file)) { failures.push(`${skill}: missing SKILL.md`); continue; }
  const text=fs.readFileSync(file,"utf8");
  if (!text.startsWith("---\n")) failures.push(`${skill}: missing front matter`);
  if (!new RegExp(`\\nname:\\s*${skill}\\n`).test(text)) failures.push(`${skill}: incorrect name`);
  const desc=text.match(/\ndescription:\s*(.+)\n/);
  if (!desc) failures.push(`${skill}: missing description`);
  else { try { const d=JSON.parse(desc[1]); if(typeof d!=="string"||!d.trim()) failures.push(`${skill}: invalid description`); if(d.length>1024) failures.push(`${skill}: description too long`); } catch { failures.push(`${skill}: description must be JSON-quoted`); } }
  if (text.length<1400) failures.push(`${skill}: instructions unexpectedly short`);
  const section=text.match(/# Required resources\s+([\s\S]*?)(?=\n# )/);
  if (section) for (const m of section[1].matchAll(/`([^`]+)`/g)) {
    const rel=m[1]; if(rel.startsWith("$")) continue;
    const resolved=path.resolve(dir,rel); if(!fs.existsSync(resolved)) failures.push(`${skill}: missing declared resource ${rel}`);
  }
  if (!fs.existsSync(agent)) failures.push(`${skill}: missing agents/openai.yaml`);
  else { const y=fs.readFileSync(agent,"utf8"); for(const k of ["interface:","display_name:","short_description:","default_prompt:","policy:","products:","- CODEX","allow_implicit_invocation:"]) if(!y.includes(k)) failures.push(`${skill}: openai.yaml missing ${k}`); if(!y.includes(`$${skill}`)) failures.push(`${skill}: default_prompt missing explicit skill`); }
}
const schemaFiles=required.filter(x=>x.startsWith("schemas/")&&x.endsWith(".json"));
const ids=new Set();
for(const rel of schemaFiles){ try{ const o=JSON.parse(fs.readFileSync(path.join(root,rel),"utf8")); if(o.type!=="object") failures.push(`${rel}: root type must be object`); if(o.additionalProperties!==false) failures.push(`${rel}: unknown root fields must be rejected`); if(!o.$id) failures.push(`${rel}: missing $id`); if(ids.has(o.$id)) failures.push(`${rel}: duplicate $id`); ids.add(o.$id); const s=JSON.stringify(o); for(const bad of ["spiritualScore","salvationProbability","addictionScore","divineMessage","hiddenSinScore"]) if(s.includes(`\"${bad}\"`)) failures.push(`${rel}: banned property ${bad}`); } catch(e){ failures.push(`${rel}: invalid JSON ${e.message}`); } }
const practices=fs.readFileSync(path.join(root,"assets/ai-discernment-practice-catalog.seed.yaml"),"utf8");
const practiceIds=[...practices.matchAll(/^  - id:\s*([^\s]+)\s*$/gm)].map(m=>m[1]);
if(practiceIds.length!==44) failures.push(`Expected 44 practices, found ${practiceIds.length}`);
if(new Set(practiceIds).size!==practiceIds.length) failures.push("Duplicate practice IDs");
if(/review_status:\s*approved/.test(practices)) failures.push("Practice seeds must not ship approved");
for(const id of ["ai.role.tool-not-authority","nonoutsource.pray-personally","verify.claim-splitting","scripture.context-window","spiritual.no-divine-revelation-claim","algorithm.feedback-loop","media.fruit-audit","learning.disclose-ai-use","review.keep-change-stop"]) if(!practiceIds.includes(id)) failures.push(`Missing practice ${id}`);
const curriculum=fs.readFileSync(path.join(root,"assets/ai-discernment-curriculum.seed.yaml"),"utf8");
const units=(curriculum.match(/^  - id:\s*discernment\.\d+/gm)||[]).length;
const lessons=(curriculum.match(/^      - id:\s*discernment\.\d+\.\d+/gm)||[]).length;
if(units!==10) failures.push(`Expected 10 units, found ${units}`); if(lessons!==24) failures.push(`Expected 24 lessons, found ${lessons}`);
if(/review_status:\s*approved/.test(curriculum)) failures.push("Curriculum must not ship approved");
for(const m of curriculum.matchAll(/practice_ids:\s*\[([^\]]*)\]/g)) for(const raw of m[1].split(",")){ const id=raw.trim(); if(id&&!practiceIds.includes(id)) failures.push(`Curriculum references unknown practice ${id}`); }
const scenarios=fs.readFileSync(path.join(root,"assets/algorithm-worldview-scenarios.seed.yaml"),"utf8");
if((scenarios.match(/^  - id:\s*scenario\./gm)||[]).length!==12) failures.push("Expected 12 scenarios");
const matrix=fs.readFileSync(path.join(root,"assets/ai-use-boundary-matrix.seed.yaml"),"utf8");
if((matrix.match(/^  - task:/gm)||[]).length!==16) failures.push("Expected 16 boundary matrix entries");
for(const t of ["moral_final_decision","pastoral_diagnosis","minor_private_companion","prophecy_or_divine_message"]) if(!matrix.includes(`task: ${t}`)) failures.push(`Boundary matrix missing ${t}`);
const rubric=fs.readFileSync(path.join(root,"assets/source-quality-rubric.seed.yaml"),"utf8");
if((rubric.match(/^  - id:\s*(P0|P1|S1|S2|U1|X)$/gm)||[]).length!==6) failures.push("Expected 6 source tiers");
const cards=fs.readFileSync(path.join(root,"assets/teacher-facilitation-cards.seed.yaml"),"utf8");
if((cards.match(/^  - id:\s*teacher\.card\./gm)||[]).length!==6) failures.push("Expected 6 teacher cards");
const analytics=fs.readFileSync(path.join(root,"assets/analytics-events.example.yaml"),"utf8");
for(const f of ["raw_prompt","raw_ai_answer","claim_statement","source_excerpt","scripture_quote","journal_reflection","media_content","browsing_history","confession","pastoral_narrative","minor_identity","health_detail","exact_message_content"]) if(!analytics.includes(`  - ${f}`)) failures.push(`Analytics denylist missing ${f}`);
const evalLines=fs.readFileSync(path.join(root,"evals/batch03.skill-prompts.csv"),"utf8").trim().split(/\r?\n/);
if(evalLines.length-1!==60) failures.push(`Expected 60 route eval rows, found ${evalLines.length-1}`);
for(const skill of skills) if(!evalLines.some(l=>l.includes(`,${skill},`))) failures.push(`No eval for ${skill}`);
const behavior=JSON.parse(fs.readFileSync(path.join(root,"evals/batch03.behavior-cases.json"),"utf8"));
if(!Array.isArray(behavior)||behavior.length!==24) failures.push(`Expected 24 behavior cases, found ${Array.isArray(behavior)?behavior.length:"non-array"}`);
for(const c of behavior){ if(!c.id||!c.skill||!c.scenario||!Array.isArray(c.must)||!Array.isArray(c.mustNot)) failures.push(`Invalid behavior case ${c.id??"unknown"}`); if(!skills.includes(c.skill)) failures.push(`Unknown behavior skill ${c.skill}`); }
const load=rel=>JSON.parse(fs.readFileSync(path.join(root,rel),"utf8"));
if(load("schemas/ai-use-intent.schema.json").properties?.rawPromptStored?.const!==false) failures.push("AiUseIntent rawPromptStored must be false");
const authority=load("schemas/ai-authority-boundary-decision.schema.json").properties;
if(authority?.aiIsUltimateAuthority?.const!==false||authority?.claimsDivineRevelationAllowed?.const!==false) failures.push("Authority schema invariants missing");
if(load("schemas/non-outsourcable-capability.schema.json").properties?.aiMayPerformHumanAct?.const!==false) failures.push("Non-outsourcable AI human act must be false");
if(load("schemas/ai-answer-verification-session.schema.json").properties?.finalDecisionOwner?.const!=="human") failures.push("Verification final decision owner must be human");
if(load("schemas/scripture-citation-check.schema.json").properties?.longQuoteStored?.const!==false) failures.push("Scripture long quote storage must be false");
const spiritual=load("schemas/spiritual-content-boundary-decision.schema.json").properties;
for(const k of ["claimsDivineRevelation","autoPublishAllowed","aiMayReplacePrayer","aiMayReplaceChurch"]) if(spiritual?.[k]?.const!==false) failures.push(`Spiritual boundary ${k} must be false`);
const worldview=load("schemas/algorithmic-worldview-analysis.schema.json").properties;
if(worldview?.automaticCondemnationGenerated?.const!==false||worldview?.diagnosisGenerated?.const!==false) failures.push("Worldview no-condemnation/no-diagnosis invariants missing");
const media=load("schemas/media-desire-analysis.schema.json").properties;
if(media?.diagnosisGenerated?.const!==false||media?.analyticsContainsPrivateReflection?.const!==false||media?.rawContentStored?.const!==false) failures.push("Media privacy/diagnosis invariants missing");
const soc=load("schemas/socratic-discernment-session.schema.json").properties;
if(soc?.userCanSkip?.const!==true||soc?.coerciveLeadingAllowed?.const!==false||soc?.predeterminedVerdictRequired?.const!==false||soc?.privateConfessionSolicited?.const!==false) failures.push("Socratic anti-coercion invariants missing");
const learn=load("schemas/ai-learning-integrity-record.schema.json").properties;
if(learn?.finalAuthorshipResponsibility?.const!=="learner"||learn?.rawPromptStored?.const!==false||learn?.rawGeneratedAnswerStored?.const!==false) failures.push("Learning integrity invariants missing");
const journal=load("schemas/discernment-journal-entry.schema.json").properties;
if(journal?.analyticsContainsPrivateReflection?.const!==false||journal?.rawAiContentStored?.const!==false) failures.push("Journal privacy invariants missing");
const review=load("schemas/discernment-review.schema.json").properties;
if(review?.spiritualMaturityScoreGenerated?.const!==false||review?.salvationInferenceGenerated?.const!==false||review?.crossUserComparisonGenerated?.const!==false) failures.push("Review no-score invariants missing");
if(failures.length){ console.error("Batch 03 validation failed:"); for(const f of failures) console.error(`- ${f}`); process.exit(1); }
console.log("Batch 03 static validation passed.");
console.log(`Validated ${skills.length} skills, ${required.length} shared resources, ${ids.size} schemas, ${practiceIds.length} practices, ${units} units / ${lessons} lessons, 12 scenarios, 16 boundary entries, ${evalLines.length-1} routing evals and ${behavior.length} behavior cases.`);
