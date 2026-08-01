from __future__ import annotations
import re
from .models import DomainPack, MatchResult

def _tokens(text: str) -> set[str]:
    # Baseline matcher only. Production should use multilingual embeddings + structured claim rules.
    return {x for x in re.split(r"[^\w\u4e00-\u9fff]+", text.lower()) if x}

def baseline_match(text: str, pack: DomainPack) -> MatchResult:
    haystack = _tokens(text)
    positive_phrases = pack.aliases + pack.detection.positive_signals
    counter_phrases = pack.detection.counter_evidence
    positive = [p for p in positive_phrases if _tokens(p) & haystack]
    counter = [p for p in counter_phrases if _tokens(p) & haystack]
    raw = min(1.0, len(positive) * 0.14) - min(0.5, len(counter) * 0.12)
    score = max(0.0, min(1.0, raw))
    classification = "high" if score >= .78 else "mixed" if score >= .58 else "clarify" if score >= .40 else "none"
    return MatchResult(pack_id=pack.id, score=score, matched_evidence=positive, counter_evidence=counter, classification=classification, explanation="Baseline lexical result; not sufficient for pastoral inference.")
