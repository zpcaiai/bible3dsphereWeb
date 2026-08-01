from __future__ import annotations

from .models import EvidenceLevel


_LEVELS = {
    EvidenceLevel.P0: 0,
    EvidenceLevel.P1: 1,
    EvidenceLevel.P2: 2,
    EvidenceLevel.P3: 3,
    EvidenceLevel.P4: 4,
}


class EvidencePolicy:
    # Applies evidence caps to high-risk inference classes.

    CAPS = {
        "hidden_motive": EvidenceLevel.P1,
        "platform_internal_algorithm": EvidenceLevel.P1,
        "undisclosed_income": EvidenceLevel.P1,
    }

    BLOCKED = {
        "clinical_personality",
        "salvation_status",
        "demonic_possession",
    }

    @classmethod
    def cap(cls, claim_type: str, proposed: EvidenceLevel) -> EvidenceLevel:
        if claim_type in cls.BLOCKED:
            raise ValueError(f"Blocked claim type: {claim_type}")
        cap = cls.CAPS.get(claim_type)
        if cap is None:
            return proposed
        return cap if _LEVELS[proposed] > _LEVELS[cap] else proposed

    @classmethod
    def can_state_as_fact(cls, level: EvidenceLevel) -> bool:
        return _LEVELS[level] >= _LEVELS[EvidenceLevel.P3]
