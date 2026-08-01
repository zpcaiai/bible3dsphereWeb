import json
from pathlib import Path

ROOT = Path(__file__).parents[1]

def test_prohibited_generation_config():
    policy = json.loads(
        (ROOT / "config/rights_policy.json").read_text(encoding="utf-8")
    )
    assert policy["prohibited_for_generation"]["retrieve"] is False
    assert policy["prohibited_for_generation"]["quote"] is False

def test_doctrine_tiers_config():
    tiers = json.loads(
        (ROOT / "config/doctrine_tiers.json").read_text(encoding="utf-8")
    )
    assert tiers["D3"]["must_not_be_salvation_test"] is True
