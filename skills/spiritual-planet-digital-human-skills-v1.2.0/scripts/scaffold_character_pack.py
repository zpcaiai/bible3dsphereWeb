#!/usr/bin/env python3
"""Scaffold a new Bible digital-human character pack without changing the runtime."""
from pathlib import Path
import sys
if len(sys.argv)!=3: raise SystemExit("usage: scaffold_character_pack.py character-id 中文名")
root=Path(__file__).resolve().parents[1]; cid=sys.argv[1].strip(); name=sys.argv[2].strip(); d=root/"examples"/cid
if d.exists(): raise SystemExit(f"already exists: {d}")
d.mkdir(parents=True)
(d/"persona.system.md").write_text(f"# Persona — {name}\n\nTODO: scripture-grounded persona.\n",encoding="utf-8")
for n in ["character.yaml","recommended-questions.yaml","truth-set.yaml","relationships.yaml","avatar-voice.yaml"]: (d/n).write_text(f"characterId: {cid}\n# TODO\n",encoding="utf-8")
(d/"review-notes.md").write_text(f"# Review Notes — {name}\n\nTODO: content / avatar / voice / release review.\n",encoding="utf-8")
print(d)
