from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .safety import PrideSafetyGuardian


@dataclass
class PrideWorkflow:
    case_id: str
    state: str = "RECEIVED"
    trace: list[dict[str, Any]] = field(default_factory=list)

    def advance(self, state: str, payload: dict[str, Any] | None = None) -> None:
        self.state = state
        self.trace.append({"state": state, "payload": payload or {}})


class PrideHypothesisOrchestrator:
    def __init__(self) -> None:
        self.guardian = PrideSafetyGuardian()

    def start(self, case_id: str, text: str, allow_spiritual_analysis: bool) -> PrideWorkflow:
        flow = PrideWorkflow(case_id=case_id)
        if not allow_spiritual_analysis:
            flow.advance("BLOCKED", {"reason": "spiritual analysis not consented"})
            return flow

        decision = self.guardian.review(text)
        if decision.status != "ready":
            flow.advance(decision.status.upper(), {
                "reasons": decision.reasons,
                "required_actions": decision.required_actions,
            })
            return flow

        flow.advance("OBSERVATION_NORMALIZED")
        flow.advance("HYPOTHESIS_PROPOSED")
        return flow
