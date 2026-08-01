from __future__ import annotations

from typing import Any


FACTOR_KEYS = (
    "creator_capability",
    "persona_legibility",
    "narrative_fit",
    "emotional_activation",
    "format_fit",
    "platform_affordance",
    "network_seeding",
    "controversy_lift",
    "audience_need_fit",
    "external_event_timing",
    "paid_distribution",
    "randomness",
)


def decompose_virality(observations: dict[str, Any]) -> dict[str, Any]:
    # Produces a qualitative factor decomposition.
    # It intentionally avoids pretending to estimate exact causal percentages.
    factors = []
    for key in FACTOR_KEYS:
        raw = observations.get(key)
        if raw is None:
            factors.append({
                "factor": key,
                "direction": "unknown",
                "evidence_level": "P0",
                "support": [],
                "alternative_explanations": [],
            })
        else:
            factors.append({
                "factor": key,
                "direction": raw.get("direction", "unknown"),
                "evidence_level": raw.get("evidence_level", "P1"),
                "support": list(raw.get("support", [])),
                "alternative_explanations": list(raw.get("alternative_explanations", [])),
            })

    return {
        "factors": factors,
        "precision_warning": "This is a qualitative causal-hypothesis decomposition, not a causal contribution estimate.",
        "unknown_residual": True,
    }
