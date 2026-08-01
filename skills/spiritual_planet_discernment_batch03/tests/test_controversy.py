import pytest
from discernment_virality.controversy import ControversyStateMachine
from discernment_virality.models import ControversyState

def test_valid_transition():
    sm = ControversyStateMachine()
    assert sm.transition(ControversyState.TRIGGERED, ControversyState.AMPLIFYING) == ControversyState.AMPLIFYING

def test_invalid_transition():
    sm = ControversyStateMachine()
    with pytest.raises(ValueError):
        sm.transition(ControversyState.LATENT, ControversyState.MONETIZED)
