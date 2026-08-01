from discernment_dialogue.safety import DialogueSafetyGuardian

def test_blocks_coercive_salvation():
    d = DialogueSafetyGuardian().review("你不接受就证明你在抗拒神")
    assert d.status == "blocked"

def test_holds_scrupulosity():
    d = DialogueSafetyGuardian().review("我认罪几个小时，还是怕神不会赦免")
    assert d.status == "safety_hold"

def test_normal_reflection_ready():
    d = DialogueSafetyGuardian().review("我很怕别人觉得我没有能力")
    assert d.status == "ready"
