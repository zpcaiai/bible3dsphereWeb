import json
from pathlib import Path
import jsonschema

ROOT = Path(__file__).parents[1]

def test_case_fixture_against_schema():
    schema = json.loads((ROOT / "schemas/virality_case.schema.json").read_text(encoding="utf-8"))
    instance = json.loads((ROOT / "tests/fixtures/success_influencer.json").read_text(encoding="utf-8"))
    jsonschema.validate(instance=instance, schema=schema)

def test_all_schema_files_are_valid_json():
    for path in (ROOT / "schemas").glob("*.json"):
        json.loads(path.read_text(encoding="utf-8"))
