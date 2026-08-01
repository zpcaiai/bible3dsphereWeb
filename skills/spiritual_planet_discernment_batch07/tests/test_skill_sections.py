from pathlib import Path

ROOT = Path(__file__).parents[1]

def test_all_skills_have_required_sections():
    for path in (ROOT / "skills").glob("*/SKILL.md"):
        text = path.read_text(encoding="utf-8")
        assert "# Processing Contract" in text
        assert "# Guardrails" in text
        assert "# Acceptance Tests" in text
