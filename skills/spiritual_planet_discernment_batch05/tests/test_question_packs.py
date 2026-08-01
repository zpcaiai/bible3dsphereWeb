import json
from pathlib import Path

ROOT = Path(__file__).parents[1]

def test_question_pack_count():
    registry = json.loads((ROOT / "question_packs/registry.json").read_text(encoding="utf-8"))
    assert registry["pack_count"] == 8

def test_every_question_single_dimension():
    for path in (ROOT / "question_packs").glob("*.json"):
        if path.name == "registry.json":
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        for q in data["questions"]:
            assert q["text"].count("？") <= 1
            assert q["text"].count("?") <= 1
