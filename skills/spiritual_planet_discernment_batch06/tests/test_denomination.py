from discernment_gospel.denomination import DenominationalGovernor
from discernment_gospel.models import DoctrineTier

def test_tier1_passes():
    assert DenominationalGovernor().evaluate(
        DoctrineTier.TIER_1, False, False
    )["decision"] == "pass"

def test_tier2_requires_scope():
    assert DenominationalGovernor().evaluate(
        DoctrineTier.TIER_2, False, False
    )["decision"] == "rewrite"

def test_tier3_cannot_be_salvation_test():
    assert DenominationalGovernor().evaluate(
        DoctrineTier.TIER_3, True, True
    )["decision"] == "blocked"
