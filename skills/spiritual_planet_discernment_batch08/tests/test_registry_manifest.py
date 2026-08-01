import json
from pathlib import Path

ROOT = Path(__file__).parents[1]

def test_role_pack_count():
    registry = json.loads((ROOT / "role_packs/registry.json").read_text(encoding="utf-8"))
    assert registry["pack_count"] == 8
    assert len(list((ROOT / "role_packs").glob("*/pack.json"))) == 8

def test_manifest_counts():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["role_pack_count"] == 8
    assert manifest["runtime_skill_count"] == 20
    assert len(list((ROOT / "skills").glob("*/SKILL.md"))) == 20
