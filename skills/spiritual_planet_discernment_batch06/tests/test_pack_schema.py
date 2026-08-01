import json
from pathlib import Path
import jsonschema

ROOT = Path(__file__).parents[1]

def test_all_packs_validate():
    schema = json.loads((ROOT / "schemas/doctrine_pack.schema.json").read_text(encoding="utf-8"))
    for path in (ROOT / "doctrine_packs").glob("*/pack.json"):
        instance = json.loads(path.read_text(encoding="utf-8"))
        jsonschema.validate(instance=instance, schema=schema)

def test_all_pack_support_files_exist():
    for folder in (ROOT / "doctrine_packs").iterdir():
        if folder.is_dir():
            assert (folder / "pack.json").exists()
            assert (folder / "SKILL.md").exists()
            assert (folder / "tests.json").exists()
