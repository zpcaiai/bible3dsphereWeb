from theology_knowledge.doctrine import DoctrineGovernor
from theology_knowledge.models import DoctrineTier

def test_d1_passes():
    assert DoctrineGovernor().evaluate(
        DoctrineTier.D1, [], "ecumenical_core", False
    )["decision"] == "pass"

def test_d2_requires_scope():
    assert DoctrineGovernor().evaluate(
        DoctrineTier.D2, [], "tradition_specific", False
    )["decision"] == "rewrite"

def test_d3_not_salvation_test():
    assert DoctrineGovernor().evaluate(
        DoctrineTier.D3, ["tradition"], "open_question", True
    )["decision"] == "blocked"
