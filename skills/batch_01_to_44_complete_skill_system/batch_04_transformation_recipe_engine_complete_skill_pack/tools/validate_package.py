#!/usr/bin/env python3
from pathlib import Path
import hashlib, json, re, sys

root = Path(__file__).resolve().parents[1]
errors = []
required = ['README.md', 'CODEX_IMPLEMENTATION_PROMPT.md', 'IMPLEMENTATION_CHECKLIST.md', 'SKILL.md', 'SKILL_INDEX.md', 'VALIDATION_REPORT.md', 'PACKAGE_MANIFEST.json']
sections = ['## Objective', '## Inputs', '## Outputs', '## Workflow', '## Required Tests', '## Verification', '## Stop and Escalate', '## Definition of Done']
for name in required:
    if not (root / name).is_file():
        errors.append("missing " + name)
skills = sorted((root / "skills").glob("*/SKILL.md"))
index_text = (root / "SKILL_INDEX.md").read_text(encoding="utf-8") if (root / "SKILL_INDEX.md").is_file() else ""
if len(skills) != 25:
    errors.append(f"expected 25 skills, got {len(skills)}")
names = []
for path in skills:
    text = path.read_text(encoding="utf-8")
    frontmatter = re.match(r"^---\n(.*?)\n---\n", text, re.DOTALL)
    if not frontmatter:
        errors.append("missing frontmatter " + str(path))
        continue
    fields = re.findall(r"^([a-zA-Z0-9_-]+):\s*(.*)$", frontmatter.group(1), re.MULTILINE)
    keys = [key for key, _ in fields]
    if set(keys) != {"name", "description"}:
        errors.append(f"{path}: frontmatter keys must be name/description, got {keys}")
    values = dict(fields)
    name = values.get("name", "").strip().strip('"')
    names.append(name)
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", name) or len(name) > 64:
        errors.append(f"{path}: invalid name {name!r}")
    if name != path.parent.name:
        errors.append(f"{path}: folder/name mismatch")
    if name not in index_text:
        errors.append(f"{path}: name missing from SKILL_INDEX.md")
    description = values.get("description", "").strip()
    if not description:
        errors.append(f"{path}: missing description")
    elif "use when" not in description.lower():
        errors.append(f"{path}: description lacks trigger guidance")
    for section in sections:
        if section not in text:
            errors.append(f"{path}: missing {section}")
    interface = path.parent / "agents/openai.yaml"
    if not interface.is_file():
        errors.append(f"{path}: missing agents/openai.yaml")
    else:
        interface_text = interface.read_text(encoding="utf-8")
        if f"${name}" not in interface_text:
            errors.append(f"{interface}: default_prompt does not reference ${name}")
if len(names) != len(set(names)):
    errors.append("duplicate skill name")
for path in (root / "schemas").glob("*.json"):
    try:
        json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"invalid JSON {path}: {exc}")
manifest_path = root / "PACKAGE_MANIFEST.json"
if manifest_path.is_file():
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if manifest.get("skill_count") != 25:
        errors.append("manifest skill_count mismatch")
    for row in manifest.get("files", []):
        path = root / row["path"]
        if not path.is_file():
            errors.append("manifest missing " + row["path"])
            continue
        data = path.read_bytes()
        if len(data) != row.get("size"):
            errors.append("manifest size mismatch " + row["path"])
        if hashlib.sha256(data).hexdigest() != row.get("sha256"):
            errors.append("manifest digest mismatch " + row["path"])
if errors:
    print("FAIL")
    print("\n".join(errors))
    sys.exit(1)
print("PASS: static package integrity; runtime NOT_RUN; production NOT_CERTIFIED")
