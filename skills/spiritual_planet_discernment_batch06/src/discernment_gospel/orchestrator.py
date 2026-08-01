from __future__ import annotations

from .models import GospelPathContext
from .planner import GospelPathPlanner
from .safety import GospelSafetyGuardian


class GospelPathOrchestrator:
    def __init__(self) -> None:
        self.planner = GospelPathPlanner()
        self.guardian = GospelSafetyGuardian()

    def run(self, context: GospelPathContext) -> dict:
        allow = bool(context.consent_scope.get("allow_gospel_bridge", False))
        if not allow:
            return {
                "review_status": "blocked",
                "reason": "gospel_consent_required",
            }

        safety = self.guardian.review(context.presenting_issue)
        if safety.status != "ready":
            return {
                "review_status": safety.status,
                "reasons": safety.reasons,
                "actions": safety.actions,
            }

        return self.planner.build(context).model_dump()
