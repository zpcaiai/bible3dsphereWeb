import json
from pathlib import Path

ROOT = Path(__file__).parents[1]

def test_manifest_count_matches_skill_directories():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    skill_files = list((ROOT / "skills").glob("*/SKILL.md"))
    assert manifest["skill_count"] == len(skill_files) == 20

def test_every_skill_has_guardrails_and_tests():
    for path in (ROOT / "skills").glob("*/SKILL.md"):
        text = path.read_text(encoding="utf-8")
        assert "# Guardrails" in text
        assert "# Acceptance Tests" in text
        assert "# Evidence and Uncertainty" in text
