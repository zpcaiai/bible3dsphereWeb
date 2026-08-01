from discernment_pride.safety import PrideSafetyGuardian

def test_blocks_disagreement_as_proof():
    d = PrideSafetyGuardian().review("他不同意就说明他骄傲")
    assert d.status == "blocked"

def test_holds_scrupulosity():
    d = PrideSafetyGuardian().review("我反复认罪几个小时，还是担心神不会赦免")
    assert d.status == "pastoral_safety_hold"

def test_allows_qualified_hypothesis():
    d = PrideSafetyGuardian().review("当前材料可能呈现能力称义，需要观察其面对失败和委派时的反应。")
    assert d.status == "ready"
