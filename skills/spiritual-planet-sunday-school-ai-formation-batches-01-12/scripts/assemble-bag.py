from __future__ import annotations

import csv
import hashlib
import json
import os
import re
import shutil
import stat
import textwrap
import zipfile
from pathlib import Path

try:
    import yaml
except Exception as exc:  # pragma: no cover
    raise SystemExit(f"PyYAML is required to assemble the package: {exc}")

BASE = Path('/mnt/data')
OUT_NAME = 'spiritual-planet-sunday-school-ai-formation-batches-01-12'
OUT = BASE / OUT_NAME
ZIP_PATH = BASE / f'{OUT_NAME}.zip'
SHA_PATH = BASE / f'{OUT_NAME}.zip.sha256'

if OUT.exists():
    shutil.rmtree(OUT)
if ZIP_PATH.exists():
    ZIP_PATH.unlink()
if SHA_PATH.exists():
    SHA_PATH.unlink()

(OUT / '.agents' / 'skills').mkdir(parents=True)
(OUT / 'batches').mkdir()
(OUT / 'packages').mkdir()
(OUT / 'scripts').mkdir()

# Correct, validated source roots. Batch 04–12 roots were extracted from the
# validated "complete" package rather than an overwritten stale copy.
sources: dict[int, Path] = {
    1: BASE / 'spiritual-planet-sunday-school-ai-formation-batch-01',
    2: BASE / 'spiritual-planet-sunday-school-ai-formation-batch-02',
    3: BASE / 'spiritual-planet-sunday-school-ai-formation-batch-03',
}
for b in range(4, 13):
    sources[b] = BASE / '_verify_complete_batches' / f'{b:02d}' / f'spiritual-planet-sunday-school-ai-formation-batch-{b:02d}'

package_sources: dict[int, Path] = {
    1: BASE / 'spiritual-planet-sunday-school-ai-formation-batch-01.zip',
    2: BASE / 'spiritual-planet-sunday-school-ai-formation-batch-02.zip',
    3: BASE / 'spiritual-planet-sunday-school-ai-formation-batch-03.zip',
}
for b in range(4, 13):
    package_sources[b] = BASE / 'spiritual-planet-sunday-school-ai-formation-batches-04-12-complete' / 'packages' / f'spiritual-planet-sunday-school-ai-formation-batch-{b:02d}.zip'

for b, p in sources.items():
    if not p.is_dir():
        raise SystemExit(f'Missing validated source for Batch {b:02d}: {p}')
for b, p in package_sources.items():
    if not p.is_file():
        raise SystemExit(f'Missing package for Batch {b:02d}: {p}')

b04_12_index = json.loads((BASE / 'spiritual-planet-sunday-school-ai-formation-batches-04-12-merged' / 'BATCH_INDEX.json').read_text(encoding='utf-8'))
meta_04_12 = {int(x['batch']): x for x in b04_12_index['batches']}

base_meta: dict[int, dict] = {
    1: {
        'title': '模块基础、神学护栏、领域模型与牧养安全契约',
        'orchestrator': 'spiritual-planet-ai-formation-orchestrator',
        'module_key': 'sunday_school.ai_formation',
        'schemas': 4, 'practices_controls': 0, 'units': 0, 'lessons': 0,
        'scenarios': 0, 'routing_evals': 20, 'behavior_cases': 0,
    },
    2: {
        'title': '攻克己身、注意力治理与数字属灵操练系统',
        'orchestrator': 'spiritual-planet-self-governance-orchestrator',
        'module_key': 'sunday_school.ai_formation.adult',
        'schemas': 11, 'practices_controls': 35, 'units': 10, 'lessons': 21,
        'scenarios': 0, 'routing_evals': 48, 'behavior_cases': 18,
    },
    3: {
        'title': 'AI认知外包、算法世界观与属灵分辨系统',
        'orchestrator': 'spiritual-planet-ai-discernment-orchestrator',
        'module_key': 'sunday_school.ai_formation.discernment',
        'schemas': 13, 'practices_controls': 44, 'units': 10, 'lessons': 24,
        'scenarios': 12, 'routing_evals': 60, 'behavior_cases': 24,
    },
}
for b in range(4, 13):
    x = meta_04_12[b]
    base_meta[b] = {
        'title': x['title'],
        'orchestrator': x['orchestrator'],
        'module_key': x['module_key'],
        'schemas': x['schemas'],
        'practices_controls': x['practices'],
        'units': x['units'],
        'lessons': x['lessons'],
        'scenarios': x['scenarios'],
        'routing_evals': x['routing_evals'],
        'behavior_cases': x['behavior_cases'],
    }


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def copy_non_skills(src: Path, dst: Path) -> None:
    dst.mkdir(parents=True, exist_ok=True)
    for child in src.iterdir():
        if child.name == '.agents':
            continue
        target = dst / child.name
        if child.is_dir():
            shutil.copytree(child, target)
        else:
            shutil.copy2(child, target)


def parse_frontmatter(skill_md: Path) -> tuple[str, str]:
    text = skill_md.read_text(encoding='utf-8')
    if not text.startswith('---\n'):
        raise ValueError(f'Missing frontmatter: {skill_md}')
    end = text.find('\n---\n', 4)
    if end < 0:
        raise ValueError(f'Unclosed frontmatter: {skill_md}')
    fm = yaml.safe_load(text[4:end])
    return str(fm['name']), str(fm['description'])

batch_entries = []
all_skill_owner: dict[str, int] = {}
all_skill_descriptions: dict[str, str] = {}

for b in range(1, 13):
    src = sources[b]
    skill_root = src / '.agents' / 'skills'
    skill_names = sorted(p.name for p in skill_root.iterdir() if p.is_dir())
    if not skill_names:
        raise SystemExit(f'No skills found for Batch {b:02d}')

    for name in skill_names:
        if name in all_skill_owner:
            raise SystemExit(f'Duplicate skill {name}: Batches {all_skill_owner[name]:02d} and {b:02d}')
        source_skill = skill_root / name
        fm_name, fm_desc = parse_frontmatter(source_skill / 'SKILL.md')
        if fm_name != name:
            raise SystemExit(f'Skill directory/frontmatter mismatch: {name} != {fm_name}')
        shutil.copytree(source_skill, OUT / '.agents' / 'skills' / name)
        all_skill_owner[name] = b
        all_skill_descriptions[name] = fm_desc

    copy_non_skills(src, OUT / 'batches' / f'batch-{b:02d}')

    package_dst = OUT / 'packages' / package_sources[b].name
    shutil.copy2(package_sources[b], package_dst)

    m = dict(base_meta[b])
    m.update({
        'batch': b,
        'skills': skill_names,
        'skill_count': len(skill_names),
        'package': f'packages/{package_dst.name}',
        'package_bytes': package_dst.stat().st_size,
        'package_sha256': sha256(package_dst),
    })
    batch_entries.append(m)

# Preserve the validated Batch 04–12 range orchestrator from the earlier delivery.
range_master_name = 'spiritual-planet-ai-formation-program-orchestrator'
range_master_source = BASE / 'spiritual-planet-sunday-school-ai-formation-batches-04-12-merged' / '.agents' / 'skills' / range_master_name
if not range_master_source.is_dir():
    raise SystemExit(f'Missing validated Batch 04–12 program orchestrator: {range_master_source}')
shutil.copytree(range_master_source, OUT / '.agents' / 'skills' / range_master_name)
range_fm_name, range_fm_desc = parse_frontmatter(range_master_source / 'SKILL.md')
if range_fm_name != range_master_name:
    raise SystemExit('Batch 04–12 range orchestrator frontmatter mismatch')
all_skill_owner[range_master_name] = -1
all_skill_descriptions[range_master_name] = range_fm_desc

# Complete-program master skill.
master_name = 'spiritual-planet-ai-formation-complete-program-orchestrator'
master_dir = OUT / '.agents' / 'skills' / master_name
(master_dir / 'references').mkdir(parents=True)
(master_dir / 'assets').mkdir()
(master_dir / 'agents').mkdir()

orchestrators = [base_meta[b]['orchestrator'] for b in range(1, 13)]
master_skill = f'''---
name: {master_name}
description: "Implement, integrate, verify, and release the complete Spiritual Planet Sunday School AI-era formation program across Batches 01–12. Use for end-to-end repository work spanning module foundations, self-governance, AI discernment, sexuality and virtual intimacy, parent and family formation, child and youth curricula, teacher tooling, scenario runtime, Formation Twin, and production certification."
---

# Mission

Implement the complete `sunday_school.ai_formation` program inside the existing Spiritual Planet repository. This Skill coordinates Batches 01–12; it is not a devotional-answer Skill and must not create a parallel application.

# Required resources

Read these files relative to this Skill directory:

- `references/program-blueprint.md`
- `references/batch-dependency-map.md`
- `references/safety-and-governance-contract.md`
- `references/implementation-and-release.md`
- `assets/batch-index.yaml`

# Required batch orchestrators

Load and execute these in dependency order:

{chr(10).join(f'{i}. `${o}`' for i, o in enumerate(orchestrators, 1))}

# Workflow

## 1. Discover the real repository

Before editing, locate and report the existing application boundaries, Sunday School navigation, routes, auth/RBAC, tenant model, learner/household identities, design system, ORM and migrations, APIs, content workflow, S0–S3 safety router, Bible/source providers, analytics, i18n, accessibility, tests, CI/CD, deployment and rollback mechanisms.

## 2. Build a dependency-aware implementation map

Map every Batch to concrete repository paths, canonical IDs, migrations, feature flags, review gates, permissions, retention rules, test suites and release evidence. Reuse existing abstractions. Do not create duplicate identity graphs, safety routers, curriculum engines, analytics pipelines or release systems.

## 3. Implement sequentially with exit gates

Implement Batch 01 through Batch 12 in order. A later Batch may begin only after the earlier Batch contracts it depends on exist and its blocking tests pass. Keep migrations forward- and rollback-testable. Record exact commands, exit codes and limitations.

## 4. Keep authority and responsibility human

AI may assist drafting, comparison, classification and evidence preparation, but may not become divine revelation, conscience, pastor, covenant partner, child’s secret companion, clinical diagnostician, final theological reviewer or final release authority.

## 5. Preserve dignity, privacy and safeguarding

Never produce salvation, holiness, maturity, purity, addiction, orientation, parental-fitness, calling or hidden-sin scores. Never use covert monitoring. Do not place raw confessions, explicit content, child narratives, private chats, health details or third-party identities in analytics or model logs. S3 and child-protection blockers interrupt ordinary flows.

## 6. Require content review

Generated theological, pastoral, sexual-formation, child/youth and curriculum material remains in review states until authorized people approve it. Deterministic code enforces age gates, owner/tenant access, publication gates, deletion/retention and release blockers.

## 7. Verify the whole program

Run repository-native lint, typecheck, unit, integration, migration forward/rollback, E2E, accessibility, privacy, security, child-safety red-team, content-review, build, deploy-smoke and rollback-drill tests. Static Skill validation is not production certification.

# Non-negotiable release blockers

- tenant or owner isolation failure;
- S3 or child-safety interruption failure;
- unauthorized sensitive-data access or logging;
- unreviewed theological or age-sensitive content reaching production;
- covert monitoring or secret AI-companion behavior;
- fabricated Scripture or source evidence;
- irreversible migration without a reviewed recovery path;
- critical accessibility or security failure;
- missing human release decision and rollback ownership.

# Final report

Return repository discoveries, architecture decisions, files and migrations, canonical contracts, routes and UI, permissions, data flows and retention, safety decisions, content-review state, exact tests and results, artifact hashes, release gates, rollout and rollback, unresolved blockers and named human-owned next actions.
'''
(master_dir / 'SKILL.md').write_text(master_skill, encoding='utf-8')
(master_dir / 'agents' / 'openai.yaml').write_text(textwrap.dedent(f'''\
interface:
  display_name: "属灵星球 AI时代心意更新完整项目编排"
  short_description: "编排并验收主日学 AI Formation Batch 01–12"
  default_prompt: "Use ${master_name} to inspect the existing Spiritual Planet repository and implement Batches 01–12 in dependency order with theology, safety, privacy, testing and release evidence."
policy:
  products:
    - CODEX
'''), encoding='utf-8')

program_blueprint = '''# Complete Program Blueprint

The complete program is one bounded Sunday School module, `sunday_school.ai_formation`, not twelve disconnected products.

## Product tracks

1. Foundations, theology, learner context and pastoral safety.
2. Adult attention and embodied self-governance.
3. AI authority, cognitive outsourcing and algorithmic worldview discernment.
4. Gospel identity, desire, sexuality, pornography recovery, AI companions and virtual intimacy.
5. Parent formation before child control.
6. Family attention ecology and family AI covenant.
7. Early-childhood and elementary formation.
8. Adolescent identity, doubt, sexual/media boundaries, learning integrity and autonomy transfer.
9. Curriculum and teacher engine.
10. Executable scenario and Socratic formation runtime.
11. Consent-bound Formation Twin and longitudinal review.
12. Production governance, evidence and release certification.

## Shared architecture

Reuse canonical learner, household, church/tenant, content, review, safety, consent, data-rights, analytics and audit abstractions. Each Batch extends these contracts rather than replacing them.
'''
(master_dir / 'references' / 'program-blueprint.md').write_text(program_blueprint, encoding='utf-8')

batch_dep = '# Batch Dependency Map\n\n' + '\n'.join(
    f'- **Batch {b:02d}** — `{base_meta[b]["orchestrator"]}` — {base_meta[b]["title"]}'
    for b in range(1, 13)
) + '''

## Dependency rule

The default order is strict 01 → 12. Parallel work is permitted only when canonical schemas, migrations, policy decisions and integration ownership remain centrally coordinated and no later Batch assumes an unimplemented earlier contract.
'''
(master_dir / 'references' / 'batch-dependency-map.md').write_text(batch_dep, encoding='utf-8')

safety_contract = '''# Safety and Governance Contract

- Grace precedes practice; product defaults are not divine commands.
- Scripture quotations and factual claims require traceable verification.
- AI does not replace prayer, repentance, conscience, embodied care, church office, clinical care or emergency help.
- No salvation, holiness, purity, maturity, addiction, orientation, calling, parental-fitness or hidden-sin scoring.
- No covert monitoring, spyware, raw device-history ingestion or secret guardian/pastor access.
- Sensitive learner data is owner-scoped, tenant-isolated, minimized, redacted, exportable and deletable.
- Child and youth experiences are age-gated, dignity-preserving and interruptible by safeguarding policy.
- Sexual-formation and recovery flows do not store explicit media or unnecessary detailed histories.
- Generated theological, pastoral and age-sensitive content requires human review before publication.
- Production release requires immutable evidence, human authorization and a tested rollback path.
'''
(master_dir / 'references' / 'safety-and-governance-contract.md').write_text(safety_contract, encoding='utf-8')

impl_release = '''# Implementation and Release

1. Install only the Batch Skills currently being implemented, or install all when the repository team intentionally accepts a large routing surface.
2. Merge `AGENTS.md.snippet` manually into the appropriate repository scope.
3. Inspect before editing and create an ExecPlan for multi-Batch work.
4. Implement contracts and migrations before rich UI or generated content.
5. Run each Batch package validator plus repository-native tests.
6. Keep feature flags off until content, privacy, safety, accessibility and operational evidence are approved.
7. Batch 12 may certify only evidence produced by the real repository and deployment environment.
8. Record rollback owners, incident routes, data deletion behavior and residual risks.
'''
(master_dir / 'references' / 'implementation-and-release.md').write_text(impl_release, encoding='utf-8')

batch_index_yaml = {
    'program': 'spiritual-planet-sunday-school-ai-formation',
    'range': '01-12',
    'module': 'sunday_school.ai_formation',
    'master_skill': master_name,
    'batches': [
        {
            'batch': f'{b:02d}',
            'title': base_meta[b]['title'],
            'orchestrator': base_meta[b]['orchestrator'],
            'module_key': base_meta[b]['module_key'],
        }
        for b in range(1, 13)
    ],
}
(master_dir / 'assets' / 'batch-index.yaml').write_text(yaml.safe_dump(batch_index_yaml, allow_unicode=True, sort_keys=False), encoding='utf-8')

all_skill_owner[master_name] = 0
all_skill_descriptions[master_name] = parse_frontmatter(master_dir / 'SKILL.md')[1]

# Root index.
totals = {
    'batches': 12,
    'individual_batch_skills': sum(x['skill_count'] for x in batch_entries),
    'included_range_program_orchestrators': 1,
    'skills_before_complete_master': sum(x['skill_count'] for x in batch_entries) + 1,
    'skills_with_complete_master': sum(x['skill_count'] for x in batch_entries) + 2,
    'schemas': sum(x['schemas'] for x in batch_entries),
    'practices_controls': sum(x['practices_controls'] for x in batch_entries),
    'units': sum(x['units'] for x in batch_entries),
    'lessons': sum(x['lessons'] for x in batch_entries),
    'scenarios': sum(x['scenarios'] for x in batch_entries),
    'routing_evals': sum(x['routing_evals'] for x in batch_entries),
    'behavior_cases': sum(x['behavior_cases'] for x in batch_entries),
}
index = {
    'program': 'spiritual-planet-sunday-school-ai-formation',
    'range': '01-12',
    'version': '1.0.0',
    'module_key': 'sunday_school.ai_formation',
    'range_04_12_master_skill': range_master_name,
    'complete_master_skill': master_name,
    'batches': batch_entries,
    'totals': totals,
}
(OUT / 'BATCH_INDEX.json').write_text(json.dumps(index, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Root documentation.
readme = f'''# 属灵星球主日学：AI时代心意更新与家庭门训
## Complete Codex Skills Bag — Batch 01–12

这是 Batch 01–12 的统一、可安装、可分批实施的 Codex Skills 总包。

## 包含内容

- **12 个 Batch**；
- **{totals['individual_batch_skills']} 个逐批 Skills**；
- **1 个 Batch 04–12 跨批次编排 Skill**；
- **1 个 Batch 01–12 总编排 Skill**；
- **共 {totals['skills_with_complete_master']} 个 Skills**；
- **{totals['schemas']} 个 JSON Schemas**；
- **{totals['practices_controls']} 个 Practices / Controls**；
- **{totals['units']} 个课程单元、{totals['lessons']} 节课**；
- **{totals['scenarios']} 个情境或红队场景**；
- **{totals['routing_evals']} 条 Skill 路由评测**；
- **{totals['behavior_cases']} 条行为、安全与隐私案例**；
- 每个 Batch 的独立 ZIP；
- 合并安装脚本、完整索引、实施顺序、兼容矩阵和验证器。

## 推荐用法

### 方式一：分批安装（推荐）

```bash
python scripts/install-batches.py /absolute/path/to/spiritual-planet 01
python scripts/install-batches.py /absolute/path/to/spiritual-planet 02
# 依次继续至 12
```

### 方式二：一次安装全部 Skills

```bash
python scripts/install-batches.py /absolute/path/to/spiritual-planet all
```

安装器不会删除未关联 Skills；覆盖同名 Skill 前会创建备份。

把根目录 `AGENTS.md.snippet` 的规则人工合并到属灵星球仓库合适作用域，然后在 Codex 中显式调用：

```text
${master_name}
```

进行单个 Batch 时，优先调用对应 Batch orchestrator，详见 `BATCH_INDEX.json` 和 `ALL_SKILLS_INDEX.md`。

## 目录

```text
.agents/skills/      全部可安装 Skills
batches/batch-XX/    各 Batch 文档、Schema、资产、Evals 与验证脚本
packages/            12 个独立、已验证的 Batch ZIP
scripts/             安装与总体验证工具
```

## 重要边界

本包是实现规范和 Codex Skills，不等于真实产品已经通过生产认证。安装到真实仓库后，仍必须执行仓库原生编译、迁移、权限、多租户、E2E、无障碍、安全、隐私、儿童保护、内容审核、部署和回滚验证。
'''
(OUT / 'README.md').write_text(readme, encoding='utf-8')

quick = f'''# Quick Start

## 1. 验证总包

```bash
python scripts/validate-all.py
```

## 2. 安装 Batch 01

```bash
python scripts/install-batches.py /absolute/path/to/spiritual-planet 01
```

## 3. 合并仓库规则

人工把 `AGENTS.md.snippet` 合并到目标仓库根目录或主日学模块目录的 `AGENTS.md`。

## 4. 在 Codex 中实施

```text
$spiritual-planet-ai-formation-orchestrator
```

每完成一个 Batch，运行该 Batch 自带验证器和真实仓库测试，再安装下一批。

## 5. 全项目编排

全部 Skills 已安装后调用：

```text
${master_name}
```
'''
(OUT / 'QUICK_START.md').write_text(quick, encoding='utf-8')

impl_order = '# Implementation Order\n\n' + '\n'.join(
    f'{b}. **Batch {b:02d} — {base_meta[b]["title"]}**  \n   Orchestrator: `${base_meta[b]["orchestrator"]}`'
    for b in range(1, 13)
) + '''

## Exit-gate rule

Do not treat file generation as completion. Before advancing, verify the Batch against the real repository: schemas and migrations, tenant/owner access, review state, privacy and logging, feature flags, accessibility, unit/integration/E2E tests, deployment smoke and rollback impact.
'''
(OUT / 'IMPLEMENTATION_ORDER.md').write_text(impl_order, encoding='utf-8')

compat = '''# Compatibility Matrix

| Range | Depends on | Supplies |
|---|---|---|
| Batch 01 | Existing Spiritual Planet repository | Module registry, theology authority labels, learner context, S0–S3 safety, Sunday School integration |
| Batch 02 | Batch 01 | Adult practices, assessments, plans, check-ins, reviews, Digital Rule of Life |
| Batch 03 | Batch 01–02 | AI role boundaries, verification, Scripture checks, algorithm/media discernment, learning integrity |
| Batch 04 | Batch 01–03 | Identity/desire/sexuality, pornography recovery, AI-companion and virtual-intimacy boundaries |
| Batch 05 | Batch 01–04 | Parent self-formation, authority, anxiety, success idols, confession and repair |
| Batch 06 | Batch 01–05 | Family attention ecology, device rules, digital Sabbath and family AI covenant |
| Batch 07 | Batch 01–06 | 0–6 and 7–12 formation, child media/AI literacy and safeguarding |
| Batch 08 | Batch 01–07 | Youth identity, doubt, sexuality/media boundaries, AI integrity and autonomy transfer |
| Batch 09 | Batch 01–08 | Curriculum, lesson, teacher material, review and publishing engine |
| Batch 10 | Batch 01–09 | Executable scenario graph, Socratic debrief, grace/repair and transfer runtime |
| Batch 11 | Batch 01–10 | Consent-bound longitudinal Formation Twin and learner-owned review |
| Batch 12 | Batch 01–11 plus real environment evidence | Governance, red-team, effectiveness, Skill Evals and production release evidence |

Canonical contracts must be extended rather than duplicated. Batch 12 cannot certify static package artifacts as proof that the real application is production-ready.
'''
(OUT / 'COMPATIBILITY_MATRIX.md').write_text(compat, encoding='utf-8')

agents = '''# Spiritual Planet Sunday School AI Formation — Repository Rules

- Reuse the existing product, navigation, identity, tenant, permissions, design system, content review, analytics, safety and deployment architecture. Do not create a parallel app.
- Implement Batch 01–12 in dependency order. Read the applicable Batch orchestrator and focused Skills before editing.
- Treat Scripture-explicit teaching, theological inference, pastoral wisdom and product defaults as distinct authority levels.
- Generated theological, pastoral, sexual-formation, child/youth and curriculum content stays in review until authorized humans approve it.
- AI is an assistant, not revelation, conscience, pastor, covenant partner, secret child companion, clinical diagnostician or final release authority.
- Do not create salvation, holiness, maturity, purity, addiction, orientation, calling, parental-fitness or hidden-sin scores.
- Do not implement covert monitoring, spyware, raw browsing-history ingestion or secret parent/pastor/teacher access.
- Minimize sensitive data. Keep raw confessions, explicit content, private chats, child narratives, health details and third-party identities out of analytics and model logs.
- Enforce age, consent, owner, tenant, review, S0–S3, child-protection, retention/deletion and release gates deterministically.
- Every implementation report must state actual files, migrations, commands, exit codes, limitations, content-review state, rollback path and unresolved blockers.
'''
(OUT / 'AGENTS.md.snippet').write_text(agents, encoding='utf-8')

master_prompt = f'''# Codex Master Implementation Prompt — Batch 01–12

Use `${master_name}` and the matching Batch orchestrators to implement the complete “AI时代心意更新与家庭门训” module inside the existing Spiritual Planet repository.

First inspect the real repository and report its frontend/backend stack, routes, Sunday School registry, design system, auth/RBAC, tenant and learner/household identity, ORM/migrations, APIs, content review, S0–S3 safety, Bible/source providers, analytics, i18n, accessibility, tests, CI/CD, deployment and rollback.

Create a dependency-aware ExecPlan for Batch 01–12. Implement one Batch at a time. For each Batch:

1. map requirements to existing repository paths;
2. implement versioned schemas, validators, migrations and services before rich UI;
3. reuse canonical identity, safety, review, permissions, analytics and data-rights systems;
4. implement routes, UI states, accessibility, localization and feature flags;
5. seed content only in review states;
6. enforce privacy, tenant/owner access, age gates, S0–S3 and child protection deterministically;
7. run the Batch validator plus repository-native lint, typecheck, unit, integration, migration, E2E and accessibility tests;
8. report actual commands, exit codes, changed files, migrations, content-review state, unresolved risks and rollback impact before proceeding.

Never create a parallel application, automatic divine-revelation claims, spiritual/salvation/purity scoring, covert monitoring, secret AI companions for minors, unreviewed theological publication, fabricated Scripture/sources or model-controlled production release.

Batch 12 must build a release evidence package from the real repository and deployment environment, require human authorization, rehearse rollback and refuse certification when critical child-safety, S3, privacy, tenant, logging, security, accessibility or review gates fail.
'''
(OUT / 'MASTER_CODEX_IMPLEMENTATION_PROMPT.md').write_text(master_prompt, encoding='utf-8')

# All skill index.
lines = ['# All Skills Index', '', f'Total: **{totals["skills_with_complete_master"]} Skills**.', '']
lines += ['## Complete-program orchestrator', '', f'- `${master_name}` — {all_skill_descriptions[master_name]}', '']
lines += ['## Preserved Batch 04–12 program orchestrator', '', f'- `${range_master_name}` — {all_skill_descriptions[range_master_name]}', '']
for b in range(1, 13):
    lines += [f'## Batch {b:02d}: {base_meta[b]["title"]}', '']
    for name in batch_entries[b-1]['skills']:
        lines.append(f'- `${name}` — {all_skill_descriptions[name]}')
    lines.append('')
(OUT / 'ALL_SKILLS_INDEX.md').write_text('\n'.join(lines), encoding='utf-8')

# Package notes.
(OUT / 'packages' / 'README.md').write_text('''# Independent Batch Packages

Each ZIP is a standalone Batch package with its own `.agents/skills`, documentation, Schemas, assets, Evals and validator. Install and validate in order from Batch 01 to Batch 12. The root all-in-one tree is more convenient for selected Skill installation; these ZIPs preserve independent delivery units.
''', encoding='utf-8')

# Installer.
installer = r'''#!/usr/bin/env python3
from __future__ import annotations
import argparse, datetime, json, shutil, sys
from pathlib import Path

BAG = Path(__file__).resolve().parents[1]
INDEX = json.loads((BAG / 'BATCH_INDEX.json').read_text(encoding='utf-8'))
MASTER = INDEX['complete_master_skill']
RANGE_MASTER = INDEX.get('range_04_12_master_skill')
BY_BATCH = {f"{int(x['batch']):02d}": x for x in INDEX['batches']}

parser = argparse.ArgumentParser(description='Install selected Spiritual Planet AI Formation Codex Skills.')
parser.add_argument('target_repo', type=Path)
parser.add_argument('batches', nargs='+', help='01 02 ... 12, or all')
parser.add_argument('--no-master', action='store_true', help='Do not install the complete-program master Skill.')
parser.add_argument('--no-backup', action='store_true', help='Overwrite same-name Skills without creating a backup copy.')
parser.add_argument('--dry-run', action='store_true')
args = parser.parse_args()

requested = [f'{n:02d}' for n in range(1,13)] if 'all' in [x.lower() for x in args.batches] else []
if not requested:
    for raw in args.batches:
        try: key=f'{int(raw):02d}'
        except ValueError: parser.error(f'Invalid Batch: {raw}')
        if key not in BY_BATCH: parser.error(f'Batch out of range: {raw}')
        if key not in requested: requested.append(key)

source_root = BAG / '.agents' / 'skills'
target_root = args.target_repo.resolve() / '.agents' / 'skills'
skills=[]
for key in requested: skills.extend(BY_BATCH[key]['skills'])
if not args.no_master:
    if RANGE_MASTER and any(int(key) >= 4 for key in requested): skills.append(RANGE_MASTER)
    skills.append(MASTER)
skills=list(dict.fromkeys(skills))

stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
backup_root=args.target_repo.resolve()/'.ai-formation-skill-backups'/stamp
print('Target:', target_root)
print('Batches:', ', '.join(requested))
print('Skills:', len(skills))
if args.dry_run:
    for s in skills: print('DRY-RUN', s)
    raise SystemExit(0)

target_root.mkdir(parents=True, exist_ok=True)
for name in skills:
    src=source_root/name; dst=target_root/name
    if not src.is_dir(): raise SystemExit(f'Missing source Skill: {src}')
    if dst.exists() and not args.no_backup:
        bd=backup_root/name; bd.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(dst, bd)
    shutil.copytree(src, dst, dirs_exist_ok=True)
    print('Installed', name)
print('\nDone. Merge AGENTS.md.snippet manually into the appropriate repository scope.')
if backup_root.exists(): print('Backups:', backup_root)
'''
installer_path = OUT / 'scripts' / 'install-batches.py'
installer_path.write_text(installer, encoding='utf-8')
installer_path.chmod(installer_path.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)

wrapper = '''#!/usr/bin/env sh
set -eu
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec python3 "$SCRIPT_DIR/install-batches.py" "$@"
'''
wrapper_path = OUT / 'scripts' / 'install-batches.sh'
wrapper_path.write_text(wrapper, encoding='utf-8')
wrapper_path.chmod(wrapper_path.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)

# Unified validator.
validator = r'''#!/usr/bin/env python3
from __future__ import annotations
import hashlib, json, re, sys, zipfile
from pathlib import Path
try:
    import yaml
except Exception as exc:
    print(f'PyYAML unavailable: {exc}', file=sys.stderr); raise SystemExit(2)
try:
    from jsonschema import Draft202012Validator
except Exception:
    Draft202012Validator=None

ROOT=Path(__file__).resolve().parents[1]
INDEX=json.loads((ROOT/'BATCH_INDEX.json').read_text(encoding='utf-8'))
fail=[]

def sha256(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for c in iter(lambda:f.read(1024*1024),b''): h.update(c)
    return h.hexdigest()

expected=[]
for b in INDEX['batches']: expected.extend(b['skills'])
if INDEX.get('range_04_12_master_skill'): expected.append(INDEX['range_04_12_master_skill'])
expected.append(INDEX['complete_master_skill'])
if len(expected)!=len(set(expected)): fail.append('Duplicate names in BATCH_INDEX.json')
actual=sorted(p.name for p in (ROOT/'.agents'/'skills').iterdir() if p.is_dir())
if actual!=sorted(expected): fail.append(f'Skill set mismatch: expected {len(expected)}, found {len(actual)}')

resource_pat=re.compile(r'`((?:references|schemas|assets)/[^`]+)`')
for name in expected:
    d=ROOT/'.agents'/'skills'/name; md=d/'SKILL.md'
    if not md.is_file(): fail.append(f'{name}: missing SKILL.md'); continue
    t=md.read_text(encoding='utf-8')
    if not t.startswith('---\n'): fail.append(f'{name}: missing frontmatter'); continue
    end=t.find('\n---\n',4)
    if end<0: fail.append(f'{name}: unclosed frontmatter'); continue
    try: fm=yaml.safe_load(t[4:end])
    except Exception as e: fail.append(f'{name}: invalid frontmatter: {e}'); continue
    if fm.get('name')!=name: fail.append(f'{name}: frontmatter name mismatch')
    if not str(fm.get('description','')).strip(): fail.append(f'{name}: missing description')
    agent=d/'agents'/'openai.yaml'
    if not agent.is_file(): fail.append(f'{name}: missing agents/openai.yaml')
    else:
        try:
            y=yaml.safe_load(agent.read_text(encoding='utf-8'))
            products=y.get('policy',{}).get('products')
            if products is not None and 'CODEX' not in products: fail.append(f'{name}: CODEX policy excludes CODEX')
        except Exception as e: fail.append(f'{name}: invalid openai.yaml: {e}')
    for rel in resource_pat.findall(t):
        if not (d/rel).exists(): fail.append(f'{name}: missing declared resource {rel}')

# Validate all JSON and YAML inside Skill directories and Batch materials.
for p in list((ROOT/'.agents'/'skills').rglob('*.json')) + list((ROOT/'batches').rglob('*.json')):
    try:
        o=json.loads(p.read_text(encoding='utf-8'))
        if Draft202012Validator and p.name.endswith('.schema.json'): Draft202012Validator.check_schema(o)
    except Exception as e: fail.append(f'Invalid JSON {p.relative_to(ROOT)}: {e}')
for p in list((ROOT/'.agents'/'skills').rglob('*.yaml')) + list((ROOT/'batches').rglob('*.yaml')):
    try: yaml.safe_load(p.read_text(encoding='utf-8'))
    except Exception as e: fail.append(f'Invalid YAML {p.relative_to(ROOT)}: {e}')

for b in INDEX['batches']:
    p=ROOT/b['package']
    if not p.is_file(): fail.append(f"Batch {int(b['batch']):02d}: missing package {b['package']}"); continue
    if p.stat().st_size!=b['package_bytes']: fail.append(f"Batch {int(b['batch']):02d}: package size mismatch")
    if sha256(p)!=b['package_sha256']: fail.append(f"Batch {int(b['batch']):02d}: package checksum mismatch")
    try:
        with zipfile.ZipFile(p) as z:
            bad=z.testzip()
            if bad: fail.append(f"Batch {int(b['batch']):02d}: corrupt member {bad}")
    except Exception as e: fail.append(f"Batch {int(b['batch']):02d}: ZIP error {e}")

if fail:
    print('Complete Batch 01–12 validation failed:', file=sys.stderr)
    for x in fail: print('-',x,file=sys.stderr)
    raise SystemExit(1)
print('Complete Batch 01–12 static validation passed.')
print(f"Validated {len(INDEX['batches'])} batches and {len(expected)} Skills.")
print(f"Validated {INDEX['totals']['schemas']} Batch Schemas, {INDEX['totals']['practices_controls']} practices/controls, {INDEX['totals']['units']} units, {INDEX['totals']['lessons']} lessons, {INDEX['totals']['scenarios']} scenarios, {INDEX['totals']['routing_evals']} routing evals and {INDEX['totals']['behavior_cases']} behavior cases by package metadata and package checksums.")
'''
validator_path = OUT / 'scripts' / 'validate-all.py'
validator_path.write_text(validator, encoding='utf-8')
validator_path.chmod(validator_path.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)

# Reproducible assembler copy.
shutil.copy2(Path(__file__), OUT / 'scripts' / 'assemble-bag.py')

# Generate manifest before validation report.
files = sorted(p for p in OUT.rglob('*') if p.is_file())
(OUT / 'PACKAGE_MANIFEST.txt').write_text('\n'.join(str(p.relative_to(OUT)) for p in files) + '\n', encoding='utf-8')

# Validation will be run outside this assembler; write preliminary report.
report = f'''# Validation Report

The package was assembled from the validated Batch 01–03 directories and the independently validated Batch 04–12 packages from the verified complete distribution.

Expected totals:

- Batches: {totals['batches']}
- Individual Batch Skills: {totals['individual_batch_skills']}
- Preserved Batch 04–12 program orchestrator: {totals['included_range_program_orchestrators']}
- Skills including complete-program orchestrator: {totals['skills_with_complete_master']}
- Schemas: {totals['schemas']}
- Practices/controls: {totals['practices_controls']}
- Units / lessons: {totals['units']} / {totals['lessons']}
- Scenarios: {totals['scenarios']}
- Routing evals: {totals['routing_evals']}
- Behavior cases: {totals['behavior_cases']}

Run:

```bash
python scripts/validate-all.py
```

This static validation does not certify a real Spiritual Planet deployment.
'''
(OUT / 'VALIDATION_REPORT.md').write_text(report, encoding='utf-8')

# Rebuild manifest to include validation report.
files = sorted(p for p in OUT.rglob('*') if p.is_file())
(OUT / 'PACKAGE_MANIFEST.txt').write_text('\n'.join(str(p.relative_to(OUT)) for p in files) + '\n', encoding='utf-8')

# ZIP with stable relative paths.
with zipfile.ZipFile(ZIP_PATH, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for p in sorted(OUT.rglob('*')):
        if p.is_file():
            z.write(p, f'{OUT.name}/{p.relative_to(OUT)}')

zip_hash = sha256(ZIP_PATH)
SHA_PATH.write_text(f'{zip_hash}  {ZIP_PATH.name}\n', encoding='utf-8')

print(json.dumps({
    'output_dir': str(OUT),
    'zip': str(ZIP_PATH),
    'sha256': zip_hash,
    'skills': totals['skills_with_complete_master'],
    'files': len([p for p in OUT.rglob('*') if p.is_file()]),
    'zip_bytes': ZIP_PATH.stat().st_size,
}, ensure_ascii=False, indent=2))
