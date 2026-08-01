from __future__ import annotations

from .models import EvidenceLevel


_ORDER = {
    EvidenceLevel.H0: 0,
    EvidenceLevel.H1: 1,
    EvidenceLevel.H2: 2,
    EvidenceLevel.H3: 3,
    EvidenceLevel.H4: 4,
}


class EvidencePolicy:
    @classmethod
    def cap(
        cls,
        proposed: EvidenceLevel,
        *,
        single_event: bool = False,
        public_person_hidden_motive: bool = False,
        llm_only: bool = False,
        longitudinal: bool = False,
    ) -> EvidenceLevel:
        caps = []
        if single_event:
            caps.append(EvidenceLevel.H1)
        if public_person_hidden_motive:
            caps.append(EvidenceLevel.H1)
        if llm_only:
            caps.append(EvidenceLevel.H1)
        if not longitudinal:
            caps.append(EvidenceLevel.H2)

        result = proposed
        for cap in caps:
            if _ORDER[result] > _ORDER[cap]:
                result = cap
        return result

    @classmethod
    def stable_character_language_allowed(cls, level: EvidenceLevel) -> bool:
        return _ORDER[level] >= _ORDER[EvidenceLevel.H3]
