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

ROOT = Path(__file__).resolve().parents[1]
index = yaml.safe_load((ROOT / 'examples/characters.index.yaml').read_text(encoding='utf-8'))
skill = yaml.safe_load((ROOT / 'skill.yaml').read_text(encoding='utf-8'))
EXPECTED = [x['id'] for x in index.get('characters', [])]
DECLARED_COUNT = skill.get('character_pack', {}).get('count')
REQUIRED = [
    'character.yaml',
    'persona.system.md',
    'recommended-questions.yaml',
    'truth-set.yaml',
    'relationships.yaml',
    'avatar-voice.yaml',
    'review-notes.md',
]
errors = []
if DECLARED_COUNT != len(EXPECTED):
    errors.append(f'character count mismatch: skill.yaml={DECLARED_COUNT}, index={len(EXPECTED)}')
if len(EXPECTED) != len(set(EXPECTED)):
    errors.append('duplicate character ids in index')

def validate_truth_set(path: Path, cid: str):
    try:
        data = yaml.safe_load(path.read_text(encoding='utf-8'))
        if not isinstance(data, dict) or data.get('characterId') != cid:
            errors.append(f'{cid}: invalid truth-set characterId')
            return
        cases = data.get('cases')
        if not isinstance(cases, list) or not cases:
            errors.append(f'{cid}: truth set must contain cases')
            return
        ids = set()
        for case in cases:
            case_id = case.get('id')
            if not case_id or case_id in ids:
                errors.append(f'{cid}: invalid/duplicate truth case id: {case_id}')
            ids.add(case_id)
            if not case.get('question'):
                errors.append(f'{cid}: {case_id}: missing question')
            if not isinstance(case.get('expected'), dict):
                errors.append(f'{cid}: {case_id}: missing expected mapping')
    except Exception as exc:
        errors.append(f'{cid}: truth set parse error: {exc}')

for cid in EXPECTED:
    d = ROOT / 'examples' / cid
    for name in REQUIRED:
        if not (d / name).exists():
            errors.append(f'{cid}: missing {name}')

    cpath = d / 'character.yaml'
    if cpath.exists():
        data = yaml.safe_load(cpath.read_text(encoding='utf-8'))
        if data.get('id') != cid:
            errors.append(f'{cid}: character id mismatch')
        if data.get('persona', {}).get('promptPath') != f'examples/{cid}/persona.system.md':
            errors.append(f'{cid}: persona prompt path mismatch')
        if data.get('avatar', {}).get('provider') != 'metaperson':
            errors.append(f'{cid}: avatar provider must be metaperson')

    tpath = d / 'truth-set.yaml'
    if tpath.exists():
        validate_truth_set(tpath, cid)

    avpath = d / 'avatar-voice.yaml'
    if avpath.exists():
        av = yaml.safe_load(avpath.read_text(encoding='utf-8'))
        if not av.get('avatar', {}).get('export', {}).get('visemes'):
            errors.append(f'{cid}: visemes must be enabled')
        if av.get('runtime', {}).get('provider') != 'livespeak':
            errors.append(f'{cid}: runtime provider must be livespeak')

if errors:
    print('CHARACTER VALIDATION FAILED')
    for e in errors:
        print('-', e)
    raise SystemExit(1)

print(f'CHARACTER VALIDATION OK: {len(EXPECTED)} characters: ' + ', '.join(EXPECTED))
