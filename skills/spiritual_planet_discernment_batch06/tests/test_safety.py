from discernment_gospel.safety import GospelSafetyGuardian

def test_blocks_coercion():
    d = GospelSafetyGuardian().review("你不接受就证明你在抗拒神")
    assert d.status == "blocked"

def test_blocks_prosperity_promise():
    d = GospelSafetyGuardian().review("接受耶稣就不会生病")
    assert d.status == "blocked"

def test_holds_scrupulosity():
    d = GospelSafetyGuardian().review("我反复认罪几个小时，还是怕神不会赦免")
    assert d.status == "safety_hold"

def test_normal_issue_ready():
    d = GospelSafetyGuardian().review("我把工作表现当成自己的价值")
    assert d.status == "ready"
