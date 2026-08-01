import json
from pathlib import Path
import jsonschema

ROOT = Path(__file__).parents[1]

def test_manifest_counts():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["formation_pack_count"] == 8
    assert manifest["runtime_skill_count"] == 20
    assert len(list((ROOT / "skills").glob("*/SKILL.md"))) == 20

def test_all_schemas_parse():
    for path in (ROOT / "schemas").glob("*.json"):
        json.loads(path.read_text(encoding="utf-8"))

def test_normal_event_schema():
    schema = json.loads(
        (ROOT / "schemas/formation_event.schema.json").read_text(encoding="utf-8")
    )
    instance = json.loads(
        (ROOT / "tests/fixtures/normal_event.json").read_text(encoding="utf-8")
    )
    jsonschema.validate(instance=instance, schema=schema)
