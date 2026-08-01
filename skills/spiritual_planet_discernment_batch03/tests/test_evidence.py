import pytest
from discernment_virality.evidence import EvidencePolicy
from discernment_virality.models import EvidenceLevel

def test_hidden_motive_is_capped():
    assert EvidencePolicy.cap("hidden_motive", EvidenceLevel.P4) == EvidenceLevel.P1

def test_blocked_claim_type():
    with pytest.raises(ValueError):
        EvidencePolicy.cap("salvation_status", EvidenceLevel.P1)

def test_fact_threshold():
    assert EvidencePolicy.can_state_as_fact(EvidenceLevel.P3)
    assert not EvidencePolicy.can_state_as_fact(EvidenceLevel.P2)
