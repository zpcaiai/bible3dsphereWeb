import json
from pathlib import Path
import jsonschema

ROOT = Path(__file__).parents[1]

def test_red_team_templates_validate():
    schema = json.loads(
        (ROOT / "schemas/red_team_case.schema.json").read_text(encoding="utf-8")
    )
    files = list((ROOT / "evidence_templates").glob("RT-*.json"))
    assert len(files) >= 4
    for path in files:
        instance = json.loads(path.read_text(encoding="utf-8"))
        jsonschema.validate(instance=instance, schema=schema)

def test_scrupulosity_is_c4():
    data = json.loads(
        (ROOT / "evidence_templates/RT-SCRUP-001.json").read_text(encoding="utf-8")
    )
    assert data["severity"] == "C4"
