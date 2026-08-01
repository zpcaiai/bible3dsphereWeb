#!/usr/bin/env python3
from __future__ import annotations
import csv, json, re, sys
from pathlib import Path
import yaml
from jsonschema import Draft202012Validator

ROOT=Path(__file__).resolve().parents[1]
SPEC=json.loads((ROOT/'PACKAGE_SPEC.json').read_text(encoding='utf-8'))
fail=[]

def get_path(obj, expr):
    cur=obj
    for p in expr.split('.'):
        cur=cur[int(p)] if isinstance(cur,list) else cur[p]
    return cur

for rel in SPEC['required_root_files']:
    if not (ROOT/rel).exists(): fail.append(f'missing required file: {rel}')

skills_root=ROOT/'.agents'/'skills'
actual=sorted([p.name for p in skills_root.iterdir() if p.is_dir()]) if skills_root.exists() else []
if actual!=sorted(SPEC['skills']): fail.append(f'skill set mismatch: {actual}')
for name in SPEC['skills']:
    d=skills_root/name; md=d/'SKILL.md'; agent=d/'agents'/'openai.yaml'
    if not md.exists(): fail.append(f'{name}: missing SKILL.md'); continue
    t=md.read_text(encoding='utf-8')
    if not t.startswith('---\n'): fail.append(f'{name}: front matter missing')
    if f'\nname: {name}\n' not in t: fail.append(f'{name}: name mismatch')
    m=re.search(r'\ndescription:\s*(.+)\n',t)
    if not m: fail.append(f'{name}: description missing')
    else:
        try:
            desc=json.loads(m.group(1))
            if not isinstance(desc,str) or not desc.strip(): fail.append(f'{name}: invalid description')
            if len(desc)>1024: fail.append(f'{name}: description too long')
        except Exception: fail.append(f'{name}: description must be JSON quoted')
    if len(t)<1800: fail.append(f'{name}: instructions unexpectedly short ({len(t)})')
    sec=re.search(r'# Required resources\s+([\s\S]*?)(?=\n# )',t)
    if sec:
        for rel in re.findall(r'`([^`]+)`',sec.group(1)):
            if rel.startswith('$'): continue
            if not (d/rel).resolve().exists(): fail.append(f'{name}: missing resource {rel}')
    if not agent.exists(): fail.append(f'{name}: missing agents/openai.yaml')
    else:
        try:
            y=yaml.safe_load(agent.read_text(encoding='utf-8'))
            if y['policy']['products']!=['CODEX']: fail.append(f'{name}: products must be CODEX')
            if f'${name}' not in y['interface']['default_prompt']: fail.append(f'{name}: default prompt missing explicit skill')
        except Exception as e: fail.append(f'{name}: invalid openai.yaml: {e}')

ids=set()
for p in sorted((ROOT/'schemas').glob('*.json')):
    try:
        o=json.loads(p.read_text(encoding='utf-8')); Draft202012Validator.check_schema(o)
        if o.get('type')!='object': fail.append(f'{p.name}: root type not object')
        if o.get('additionalProperties') is not False: fail.append(f'{p.name}: additionalProperties must be false')
        if not o.get('$id'): fail.append(f'{p.name}: missing $id')
        if o.get('$id') in ids: fail.append(f'{p.name}: duplicate $id')
        ids.add(o.get('$id'))
        raw=json.dumps(o,ensure_ascii=False)
        for bad in SPEC['forbidden_schema_keys']:
            if f'"{bad}"' in raw: fail.append(f'{p.name}: forbidden key {bad}')
    except Exception as e: fail.append(f'{p.name}: invalid schema: {e}')
if len(ids)!=SPEC['counts']['schemas']: fail.append(f"expected {SPEC['counts']['schemas']} schemas, found {len(ids)}")

for inv in SPEC['schema_invariants']:
    try:
        o=json.loads((ROOT/'schemas'/inv['schema']).read_text(encoding='utf-8'))
        got=get_path(o,inv['path'])
        if got!=inv['expected']: fail.append(f"{inv['schema']} {inv['path']} expected {inv['expected']!r}, got {got!r}")
    except Exception as e: fail.append(f"invariant read failed {inv}: {e}")

pr=yaml.safe_load((ROOT/SPEC['practice_asset']).read_text(encoding='utf-8'))
practices=pr.get('practices') or pr.get('controls') or []
if len(practices)!=SPEC['counts']['practices']: fail.append(f"expected {SPEC['counts']['practices']} practices/controls, found {len(practices)}")
pids=[x.get('id') for x in practices]
if len(pids)!=len(set(pids)): fail.append('duplicate practice/control IDs')
if any(x.get('review_status')=='approved' for x in practices): fail.append('practice/control seeds must not ship approved')

cu=yaml.safe_load((ROOT/SPEC['curriculum_asset']).read_text(encoding='utf-8'))
units=cu.get('units',[]); lessons=[l for u in units for l in u.get('lessons',[])]
if len(units)!=SPEC['counts']['units']: fail.append(f"expected {SPEC['counts']['units']} units, found {len(units)}")
if len(lessons)!=SPEC['counts']['lessons']: fail.append(f"expected {SPEC['counts']['lessons']} lessons, found {len(lessons)}")
if any(u.get('review_status')=='approved' for u in units) or any(l.get('review_status')=='approved' for l in lessons): fail.append('curriculum must not ship approved')
for l in lessons:
    for pid in l.get('practice_ids',[]):
        if pid not in pids: fail.append(f"lesson {l.get('id')} references unknown practice {pid}")

sc=yaml.safe_load((ROOT/SPEC['scenario_asset']).read_text(encoding='utf-8'))
scenarios=sc.get('scenarios') or sc.get('red_team_cases') or []
if len(scenarios)!=SPEC['counts']['scenarios']: fail.append(f"expected {SPEC['counts']['scenarios']} scenarios, found {len(scenarios)}")

an=yaml.safe_load((ROOT/SPEC['analytics_asset']).read_text(encoding='utf-8'))
deny=set(an.get('denylisted_fields',[]))
for f in ['raw_prompt','private_reflection','confession','pastoral_narrative','minor_identity','sexual_history','explicit_content']:
    if f not in deny: fail.append(f'analytics denylist missing {f}')

with (ROOT/f"evals/batch{SPEC['batch']:02d}.skill-prompts.csv").open(encoding='utf-8',newline='') as f:
    rows=list(csv.DictReader(f))
if len(rows)<len(SPEC['skills'])*4: fail.append(f'not enough routing evals: {len(rows)}')
for s in SPEC['skills']:
    sr=[r for r in rows if r['expected_skill']==s]
    if not any(r['should_activate']=='true' for r in sr): fail.append(f'{s}: no positive eval')
    if not any(r['should_activate']=='false' for r in sr): fail.append(f'{s}: no negative eval')

beh=json.loads((ROOT/f"evals/batch{SPEC['batch']:02d}.behavior-cases.json").read_text(encoding='utf-8'))
if len(beh)<len(SPEC['skills'])*2: fail.append(f'not enough behavior cases: {len(beh)}')
for c in beh:
    if c.get('skill') not in SPEC['skills']: fail.append(f"unknown behavior skill {c.get('skill')}")
    if not isinstance(c.get('must'),list) or not isinstance(c.get('mustNot'),list): fail.append(f"bad behavior case {c.get('id')}")

if fail:
    print(f"Batch {SPEC['batch']:02d} validation failed:",file=sys.stderr)
    for x in fail: print(f'- {x}',file=sys.stderr)
    sys.exit(1)
print(f"Batch {SPEC['batch']:02d} static validation passed.")
print(f"Validated {len(SPEC['skills'])} skills, {len(ids)} schemas, {len(practices)} practices/controls, {len(units)} units / {len(lessons)} lessons, {len(scenarios)} scenarios, {len(rows)} routing evals and {len(beh)} behavior cases.")
