import json
from pathlib import Path

ROOT = Path(__file__).parents[1]

def test_manifest_counts():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["doctrine_pack_count"] == 10
    assert manifest["runtime_skill_count"] == 20
    assert len(list((ROOT / "skills").glob("*/SKILL.md"))) == 20

def test_skills_have_required_sections():
    for path in (ROOT / "skills").glob("*/SKILL.md"):
        text = path.read_text(encoding="utf-8")
        assert "# Guardrails" in text
        assert "# Acceptance Tests" in text
        assert "# Processing Contract" in text
