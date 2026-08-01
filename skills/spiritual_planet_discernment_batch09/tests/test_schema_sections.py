import json
from pathlib import Path
import jsonschema

ROOT = Path(__file__).parents[1]

def test_all_schemas_parse():
    for path in (ROOT / "schemas").glob("*.json"):
        json.loads(path.read_text(encoding="utf-8"))

def test_source_schema():
    schema = json.loads(
        (ROOT / "schemas/source_document.schema.json").read_text(encoding="utf-8")
    )
    instance = json.loads(
        (ROOT / "tests/fixtures/source_public.json").read_text(encoding="utf-8")
    )
    jsonschema.validate(instance=instance, schema=schema)

def test_skills_sections():
    for path in (ROOT / "skills").glob("*/SKILL.md"):
        text = path.read_text(encoding="utf-8")
        assert "# Processing Contract" in text
        assert "# Guardrails" in text
        assert "# Acceptance Tests" in text
