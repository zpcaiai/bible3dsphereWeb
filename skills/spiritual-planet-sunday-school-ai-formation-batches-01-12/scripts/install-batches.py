#!/usr/bin/env python3
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
