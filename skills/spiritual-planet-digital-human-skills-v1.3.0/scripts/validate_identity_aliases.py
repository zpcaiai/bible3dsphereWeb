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
ROOT=Path(__file__).resolve().parents[1]
idx=yaml.safe_load((ROOT/'examples/characters.index.yaml').read_text(encoding='utf-8'))
ids={x['id'] for x in idx['characters']}
data=yaml.safe_load((ROOT/'examples/identity-aliases.yaml').read_text(encoding='utf-8'))
errors=[]
for item in data.get('ambiguous',[]):
    c=item.get('candidates',[])
    if len(c)<2: errors.append(f"{item.get('surface')}: needs >=2 candidates")
    for cid in c:
        if cid not in ids: errors.append(f"{item.get('surface')}: unknown candidate {cid}")
for cid in data.get('stableLabels',{}):
    if cid not in ids: errors.append(f"stableLabels: unknown id {cid}")
if errors:
    print('IDENTITY ALIAS VALIDATION FAILED')
    for e in errors: print('-',e)
    raise SystemExit(1)
print(f"IDENTITY ALIAS VALIDATION OK: {len(data.get('ambiguous',[]))} ambiguous surfaces")
