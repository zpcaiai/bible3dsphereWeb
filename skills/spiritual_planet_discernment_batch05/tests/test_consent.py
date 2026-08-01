from discernment_dialogue.consent import GospelConsentGate
from discernment_dialogue.models import GospelConsentResponse

def test_requires_explicit_acceptance():
    gate = GospelConsentGate()
    assert gate.can_explore(True, GospelConsentResponse.ACCEPTED, "ready")
    assert not gate.can_explore(True, GospelConsentResponse.DECLINED, "ready")
    assert not gate.can_explore(False, GospelConsentResponse.ACCEPTED, "ready")
