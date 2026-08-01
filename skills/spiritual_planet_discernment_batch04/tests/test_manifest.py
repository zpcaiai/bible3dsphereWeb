import json
from pathlib import Path

ROOT = Path(__file__).parents[1]

def test_manifest_counts():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["hypothesis_pack_count"] == 9
    assert manifest["runtime_skill_count"] == 20
    assert len(list((ROOT / "skills").glob("*/SKILL.md"))) == 20
