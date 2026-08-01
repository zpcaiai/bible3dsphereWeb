import json
from pathlib import Path
import jsonschema

ROOT = Path(__file__).parents[1]

def test_manifest_counts():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["skill_count"] == 20
    assert manifest["question_pack_count"] == 8
    assert len(list((ROOT / "skills").glob("*/SKILL.md"))) == 20

def test_all_schemas_parse():
    for path in (ROOT / "schemas").glob("*.json"):
        json.loads(path.read_text(encoding="utf-8"))

def test_question_schema():
    schema = json.loads((ROOT / "schemas/socratic_question.schema.json").read_text(encoding="utf-8"))
    instance = {
        "question_id":"q1",
        "stage":"CLARIFY",
        "difficulty":"D0",
        "text":"最近一次发生这种情况时，具体发生了什么？",
        "purpose":"获取事实",
        "allow_skip":True
    }
    jsonschema.validate(instance=instance, schema=schema)
