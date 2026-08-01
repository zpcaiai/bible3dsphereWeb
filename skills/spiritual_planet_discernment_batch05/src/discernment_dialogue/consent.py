from __future__ import annotations

from .models import GospelConsentResponse


class GospelConsentGate:
    def can_explore(
        self,
        allow_spiritual_analysis: bool,
        response: GospelConsentResponse,
        safety_status: str,
    ) -> bool:
        return (
            allow_spiritual_analysis
            and response == GospelConsentResponse.ACCEPTED
            and safety_status == "ready"
        )

    def invitation(self) -> str:
        return "你愿意看看基督如何回应这个困境吗？"
