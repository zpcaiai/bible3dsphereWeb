import json
from pathlib import Path

ROOT = Path(__file__).parents[1]

def test_path_order_contains_all_ten():
    data = json.loads((ROOT / "config/path_order.json").read_text(encoding="utf-8"))
    assert len(data["canonical_order"]) == 10
    assert data["canonical_order"][3] == "christ_and_atonement"

def test_christ_pack_requires_resurrection():
    pack = json.loads(
        (ROOT / "doctrine_packs/christ_and_atonement/pack.json").read_text(encoding="utf-8")
    )
    joined = " ".join(pack["core_claims"])
    assert "复活" in joined
    assert pack["safety"]["resurrection_required"] is True

def test_justification_pack_distinguishes_sanctification():
    pack = json.loads(
        (ROOT / "doctrine_packs/justification_by_faith/pack.json").read_text(encoding="utf-8")
    )
    assert any("成圣" in x for x in pack["core_claims"])
