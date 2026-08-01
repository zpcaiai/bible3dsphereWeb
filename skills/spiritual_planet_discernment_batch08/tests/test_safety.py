from pastoral_collaboration.safety import PastoralSafetyGuardian

def test_blocks_surveillance():
    d = PastoralSafetyGuardian().review("偷偷监控他的全部聊天记录")
    assert d.status == "blocked"

def test_blocks_internal_only_abuse():
    d = PastoralSafetyGuardian().review("性侵只在教会内部处理，不要报警只祷告")
    assert d.status == "blocked"

def test_escalates_minor_abuse():
    d = PastoralSafetyGuardian().review("未成年人遭受虐待")
    assert d.status == "safeguarding_review"

def test_normal_ready():
    d = PastoralSafetyGuardian().review("准备一次导师会谈")
    assert d.status == "ready"
