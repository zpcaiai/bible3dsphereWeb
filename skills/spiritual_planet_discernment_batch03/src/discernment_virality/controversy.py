from __future__ import annotations

from .models import ControversyState


_TRANSITIONS = {
    ControversyState.LATENT: {ControversyState.TRIGGERED},
    ControversyState.TRIGGERED: {ControversyState.AMPLIFYING, ControversyState.RESOLVED},
    ControversyState.AMPLIFYING: {ControversyState.POLARIZED, ControversyState.FATIGUED, ControversyState.RESOLVED},
    ControversyState.POLARIZED: {ControversyState.MONETIZED, ControversyState.FATIGUED, ControversyState.REFRAMED},
    ControversyState.MONETIZED: {ControversyState.FATIGUED, ControversyState.REFRAMED, ControversyState.REIGNITED},
    ControversyState.FATIGUED: {ControversyState.REFRAMED, ControversyState.RESOLVED, ControversyState.REIGNITED},
    ControversyState.REFRAMED: {ControversyState.RESOLVED, ControversyState.REIGNITED, ControversyState.AMPLIFYING},
    ControversyState.RESOLVED: {ControversyState.REIGNITED},
    ControversyState.REIGNITED: {ControversyState.AMPLIFYING, ControversyState.POLARIZED},
}


class ControversyStateMachine:
    def can_transition(self, current: ControversyState, target: ControversyState) -> bool:
        return target in _TRANSITIONS[current]

    def transition(self, current: ControversyState, target: ControversyState) -> ControversyState:
        if not self.can_transition(current, target):
            raise ValueError(f"Invalid controversy transition: {current} -> {target}")
        return target
