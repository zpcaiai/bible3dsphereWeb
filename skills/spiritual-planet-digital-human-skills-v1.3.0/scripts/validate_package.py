#!/usr/bin/env python3
from pathlib import Path
import json
import os
import sys
try:
    import yaml
except ModuleNotFoundError:
    for _cand in ("/Users/stephen/Documents/Projects/DoctorPro/bible3dsphere/.venv/bin/python", "/usr/bin/python3"):
        if os.path.exists(_cand) and os.path.realpath(_cand) != os.path.realpath(sys.executable):
            os.execv(_cand, [_cand, "-B", *sys.argv])
    raise

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = [
    'SKILL.md', 'AGENTS.md', 'README.md', 'skill.yaml',
    'schemas/bible-character.schema.json',
    'schemas/digital-human-response.schema.json',
    'schemas/grounding-evidence.schema.json',
    'examples/moses/character.yaml', 'examples/moses/truth-set.yaml',
    'examples/david/character.yaml', 'examples/david/truth-set.yaml',
    'examples/peter/character.yaml', 'examples/peter/truth-set.yaml',
    'examples/paul/character.yaml', 'examples/paul/truth-set.yaml',
    'examples/characters.index.yaml',
    'tests/quality-gates.yaml',
]

errors = []
for rel in REQUIRED:
    if not (ROOT / rel).exists():
        errors.append(f'missing: {rel}')

for p in ROOT.rglob('*.json'):
    try:
        json.loads(p.read_text(encoding='utf-8'))
    except Exception as exc:
        errors.append(f'invalid json {p.relative_to(ROOT)}: {exc}')

for p in ROOT.rglob('*.yaml'):
    try:
        yaml.safe_load(p.read_text(encoding='utf-8'))
    except Exception as exc:
        errors.append(f'invalid yaml {p.relative_to(ROOT)}: {exc}')

if errors:
    print('VALIDATION FAILED')
    for e in errors:
        print('-', e)
    sys.exit(1)

print('VALIDATION OK')
print(f'root={ROOT}')
print(f'files={sum(1 for p in ROOT.rglob("*") if p.is_file())}')
