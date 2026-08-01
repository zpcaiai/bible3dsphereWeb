import json
from pathlib import Path
import jsonschema

ROOT = Path(__file__).parents[1]

def test_all_pack_json_against_schema():
    schema = json.loads((ROOT / "schemas/hypothesis_pack.schema.json").read_text(encoding="utf-8"))
    for path in (ROOT / "hypothesis_packs").glob("*/pack.json"):
        instance = json.loads(path.read_text(encoding="utf-8"))
        jsonschema.validate(instance=instance, schema=schema)

def test_all_pack_support_files_exist():
    for folder in (ROOT / "hypothesis_packs").iterdir():
        if folder.is_dir():
            for name in ["pack.json", "SKILL.md", "question_tree.json", "gospel_bridge.json", "tests.json"]:
                assert (folder / name).exists()
