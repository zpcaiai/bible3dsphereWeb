from __future__ import annotations

import re


QUESTION_WORDS = [
    "什么", "怎样", "如何", "是否", "哪", "谁", "为什么",
    "what", "how", "which", "who", "why", "whether"
]


def validate_single_question(text: str) -> dict:
    stripped = text.strip()
    question_marks = stripped.count("?") + stripped.count("？")

    # Semicolon and conjunction heuristics catch hidden multi-question prompts.
    hidden_split = bool(re.search(r"[；;].*(什么|怎样|如何|是否|哪|谁|为什么)", stripped))
    repeated_stems = sum(stripped.lower().count(w.lower()) for w in QUESTION_WORDS)

    valid = question_marks <= 1 and not hidden_split
    reason = "ok"
    if question_marks > 1:
        reason = "multiple_question_marks"
    elif hidden_split:
        reason = "hidden_compound_question"
    elif repeated_stems >= 3 and len(stripped) > 45:
        valid = False
        reason = "likely_multiple_dimensions"

    return {
        "valid": valid,
        "reason": reason,
        "question_marks": question_marks,
    }
