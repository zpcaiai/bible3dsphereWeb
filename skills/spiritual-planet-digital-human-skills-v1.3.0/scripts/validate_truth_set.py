#!/usr/bin/env python3
from pathlib import Path
import os
import sys
try:
    import yaml
except ModuleNotFoundError:
    for _cand in ("/Users/stephen/Documents/Projects/DoctorPro/bible3dsphere/.venv/bin/python", "/usr/bin/python3"):
        if os.path.exists(_cand) and os.path.realpath(_cand) != os.path.realpath(sys.executable):
            os.execv(_cand, [_cand, "-B", *sys.argv])
    raise

if len(sys.argv) != 2:
    raise SystemExit('usage: validate_truth_set.py PATH')

p = Path(sys.argv[1])
data = yaml.safe_load(p.read_text(encoding='utf-8'))

assert isinstance(data, dict), 'truth set must be a mapping'
assert data.get('characterId'), 'missing characterId'
cases = data.get('cases')
assert isinstance(cases, list) and cases, 'cases must be a non-empty list'

ids = set()
for c in cases:
    cid = c.get('id')
    assert cid and cid not in ids, f'invalid/duplicate case id: {cid}'
    ids.add(cid)
    assert c.get('question'), f'{cid}: missing question'
    assert isinstance(c.get('expected'), dict), f'{cid}: missing expected mapping'

print(f'TRUTH SET OK: {data["characterId"]} ({len(cases)} cases)')
