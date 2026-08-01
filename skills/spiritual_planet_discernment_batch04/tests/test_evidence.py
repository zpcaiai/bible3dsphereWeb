from discernment_pride.evidence import EvidencePolicy
from discernment_pride.models import EvidenceLevel

def test_single_event_capped_h1():
    assert EvidencePolicy.cap(EvidenceLevel.H4, single_event=True) == EvidenceLevel.H1

def test_without_longitudinal_capped_h2():
    assert EvidencePolicy.cap(EvidenceLevel.H4, longitudinal=False) == EvidenceLevel.H2

def test_stable_language_requires_h3():
    assert not EvidencePolicy.stable_character_language_allowed(EvidenceLevel.H2)
    assert EvidencePolicy.stable_character_language_allowed(EvidenceLevel.H3)
