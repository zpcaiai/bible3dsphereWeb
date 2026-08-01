#!/usr/bin/env python3
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
