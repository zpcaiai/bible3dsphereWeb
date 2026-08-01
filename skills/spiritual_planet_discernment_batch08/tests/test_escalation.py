import pytest
from pastoral_collaboration.escalation import EscalationStateMachine
from pastoral_collaboration.models import EscalationState

def test_valid_transition():
    sm = EscalationStateMachine()
    assert sm.transition(
        EscalationState.REVIEW_NEEDED,
        EscalationState.SAFEGUARDING_REVIEW
    ) == EscalationState.SAFEGUARDING_REVIEW

def test_invalid_transition():
    sm = EscalationStateMachine()
    with pytest.raises(ValueError):
        sm.transition(EscalationState.ROUTINE, EscalationState.EMERGENCY_ACTION)
