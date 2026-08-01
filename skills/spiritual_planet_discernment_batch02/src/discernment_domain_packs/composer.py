from __future__ import annotations
from .models import MatchResult

def compose_candidates(results: list[MatchResult], limit: int = 5) -> list[MatchResult]:
    eligible = [r for r in results if r.classification != "none"]
    return sorted(eligible, key=lambda r: r.score, reverse=True)[:limit]

def require_clarification(results: list[MatchResult]) -> bool:
    return not results or max(r.score for r in results) < .58
