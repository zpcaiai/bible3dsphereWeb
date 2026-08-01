from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from .models import EvidenceLevel, PersonaItem, PersonaProfile


_ALLOWED = {
    "verified_identity",
    "self_claimed_identity",
    "performed_persona",
    "audience_symbols",
    "commercial_brand",
    "analyst_hypotheses",
}


def separate_persona_layers(items: Iterable[dict[str, Any]]) -> PersonaProfile:
    profile = PersonaProfile()
    for raw in items:
        layer = raw.get("layer")
        if layer not in _ALLOWED:
            profile.limitations.append(f"Unclassified item: {raw.get('label', 'unknown')}")
            continue

        proposed = EvidenceLevel(raw.get("evidence_level", "P1"))
        if layer == "analyst_hypotheses" and proposed in {EvidenceLevel.P3, EvidenceLevel.P4}:
            proposed = EvidenceLevel.P2

        item = PersonaItem(
            label=str(raw.get("label", "")),
            description=str(raw.get("description", "")),
            evidence_level=proposed,
            evidence_refs=list(raw.get("evidence_refs", [])),
            alternative_explanations=list(raw.get("alternative_explanations", [])),
        )
        getattr(profile, layer).append(item)

    if not profile.verified_identity:
        profile.limitations.append("No verified identity evidence supplied.")
    return profile
