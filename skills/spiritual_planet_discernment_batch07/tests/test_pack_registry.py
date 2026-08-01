import json
from pathlib import Path

ROOT = Path(__file__).parents[1]

def test_eight_formation_packs():
    registry = json.loads(
        (ROOT / "formation_packs/registry.json").read_text(encoding="utf-8")
    )
    assert registry["pack_count"] == 8
    assert len(list((ROOT / "formation_packs").glob("*/pack.json"))) == 8

def test_pack_support_files():
    for folder in (ROOT / "formation_packs").iterdir():
        if folder.is_dir():
            assert (folder / "pack.json").exists()
            assert (folder / "SKILL.md").exists()
