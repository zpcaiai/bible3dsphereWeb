from formation_twin.safety import FormationSafetyGuardian

def test_blocks_salvation_score():
    d = FormationSafetyGuardian().review("给我一个得救概率和属灵成熟度总分")
    assert d.status == "blocked"

def test_blocks_forced_reconciliation():
    d = FormationSafetyGuardian().review("必须马上和施虐者和好才算饶恕")
    assert d.status == "blocked"

def test_holds_scrupulosity():
    d = FormationSafetyGuardian().review("我反复认罪几个小时，还是怕神不会赦免")
    assert d.status == "safety_hold"

def test_normal_ready():
    d = FormationSafetyGuardian().review("我想记录团队冲突后的恢复过程")
    assert d.status == "ready"
