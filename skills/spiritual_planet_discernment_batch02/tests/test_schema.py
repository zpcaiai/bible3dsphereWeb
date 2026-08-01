from pathlib import Path
from discernment_domain_packs.validator import validate_json

def test_all_pack_schemas():
    root=Path(__file__).resolve().parents[1]
    schema=root / "schemas/domain_pack.schema.json"
    failures={}
    for pack in root.glob("packs/*/pack.json"):
        errors=validate_json(pack, schema)
        if errors: failures[str(pack)]=errors
    assert failures == {}

def test_all_question_trees():
    root=Path(__file__).resolve().parents[1]
    schema=root / "schemas/socratic_question_tree.schema.json"
    failures={}
    for item in root.glob("packs/*/socratic_tree.json"):
        errors=validate_json(item, schema)
        if errors: failures[str(item)]=errors
    assert failures == {}

def test_all_gospel_bridges():
    root=Path(__file__).resolve().parents[1]
    schema=root / "schemas/gospel_bridge.schema.json"
    failures={}
    for item in root.glob("packs/*/gospel_bridges.json"):
        errors=validate_json(item, schema)
        if errors: failures[str(item)]=errors
    assert failures == {}
