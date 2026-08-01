import pytest
from formation_twin.relapse import RelapseStateMachine
from formation_twin.models import RelapseState

def test_valid_relapse_transition():
    sm = RelapseStateMachine()
    assert sm.transition(
        RelapseState.TRIGGERED,
        RelapseState.OLD_PATTERN_ACTIVE
    ) == RelapseState.OLD_PATTERN_ACTIVE

def test_invalid_relapse_transition():
    sm = RelapseStateMachine()
    with pytest.raises(ValueError):
        sm.transition(RelapseState.STABLE, RelapseState.REPAIR)
