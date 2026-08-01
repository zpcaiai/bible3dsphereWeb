from discernment_gospel.balance import LawGospelBalanceController

def test_full_gospel_passes():
    result = LawGospelBalanceController().evaluate(
        law_commands=1,
        gospel_facts={"christ","cross","resurrection","grace","faith"},
        behavior_as_basis=False,
        repentance_absent=False,
    )
    assert result["decision"] == "pass"

def test_moralism_rewrites():
    result = LawGospelBalanceController().evaluate(
        law_commands=5,
        gospel_facts={"christ"},
        behavior_as_basis=True,
        repentance_absent=False,
    )
    assert result["decision"] == "rewrite"
    assert result["moralism_risk"] == "high"

def test_cheap_grace_rewrites():
    result = LawGospelBalanceController().evaluate(
        law_commands=0,
        gospel_facts={"christ","cross","resurrection","grace","faith"},
        behavior_as_basis=False,
        repentance_absent=True,
    )
    assert result["cheap_grace_risk"] == "high"
