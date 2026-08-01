import json
from pathlib import Path

ROOT = Path(__file__).parents[1]

def test_certification_pack_registry():
    registry = json.loads(
        (ROOT / "certification_packs/registry.json").read_text(encoding="utf-8")
    )
    assert registry["pack_count"] == 12
    assert registry["control_count"] == 58

def test_manifest_counts():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["certification_pack_count"] == 12
    assert manifest["runtime_skill_count"] == 24
    assert manifest["control_count"] == 58
    assert len(list((ROOT / "skills").glob("*/SKILL.md"))) == 24
