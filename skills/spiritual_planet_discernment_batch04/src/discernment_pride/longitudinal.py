from __future__ import annotations

from .models import EvidenceLevel


_ORDER = ["H0", "H1", "H2", "H3", "H4"]


def review_longitudinal(
    current: EvidenceLevel,
    supporting_events: int,
    contradicting_events: int,
    cross_context: bool,
    window_days: int,
) -> dict:
    if window_days not in {14, 30, 90}:
        raise ValueError("window_days must be 14, 30, or 90")

    idx = _ORDER.index(current.value)
    decision = "retain"

    if contradicting_events >= max(2, supporting_events):
        idx = max(0, idx - 1)
        decision = "downgrade"
    elif supporting_events >= 3 and cross_context and window_days >= 30:
        idx = min(4, idx + 1)
        decision = "upgrade"

    if supporting_events == 0 and contradicting_events >= 2:
        idx = 0
        decision = "falsify"

    return {
        "new_level": _ORDER[idx],
        "decision": decision,
        "supporting_events": supporting_events,
        "contradicting_events": contradicting_events,
        "window_days": window_days,
    }
