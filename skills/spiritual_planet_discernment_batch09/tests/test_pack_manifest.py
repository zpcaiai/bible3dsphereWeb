import json
from pathlib import Path

ROOT = Path(__file__).parents[1]

def test_knowledge_pack_count():
    registry = json.loads(
        (ROOT / "knowledge_packs/registry.json").read_text(encoding="utf-8")
    )
    assert registry["pack_count"] == 12
    assert len(list((ROOT / "knowledge_packs").glob("*/pack.json"))) == 12

def test_manifest_counts():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["knowledge_pack_count"] == 12
    assert manifest["runtime_skill_count"] == 20
    assert len(list((ROOT / "skills").glob("*/SKILL.md"))) == 20
