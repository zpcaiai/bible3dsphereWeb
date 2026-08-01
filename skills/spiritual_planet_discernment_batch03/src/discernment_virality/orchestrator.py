from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .models import AnalysisState, ViralityCase
from .safety import PublicFigureSafetyGuardian


@dataclass
class WorkflowTrace:
    case_id: str
    state: AnalysisState = AnalysisState.RECEIVED
    events: list[dict[str, Any]] = field(default_factory=list)

    def advance(self, state: AnalysisState, payload: dict[str, Any] | None = None) -> None:
        self.state = state
        self.events.append({"state": state.value, "payload": payload or {}})


class ViralityOrchestrator:
    # Minimal deterministic workflow skeleton for Codex implementation.

    def __init__(self) -> None:
        self.guardian = PublicFigureSafetyGuardian()

    def start(self, case: ViralityCase) -> WorkflowTrace:
        trace = WorkflowTrace(case_id=case.case_id)
        if not case.consent_scope.allow_public_content_analysis:
            trace.advance(AnalysisState.BLOCKED, {"reason": "public content analysis not permitted"})
            return trace

        trace.advance(AnalysisState.CONSENT_CHECKED)
        if case.sensitivity in {"legal_sensitive", "minor_involved", "crisis"}:
            trace.advance(AnalysisState.REVIEW_REQUIRED, {"reason": case.sensitivity})
            return trace

        trace.advance(AnalysisState.NORMALIZED)
        return trace
