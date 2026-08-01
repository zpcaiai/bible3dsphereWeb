from __future__ import annotations


def detect_tension(statement_a: str, statement_b: str) -> dict:
    a = statement_a.strip()
    b = statement_b.strip()

    if not a or not b:
        return {
            "detected": False,
            "confidence": 0.0,
            "tension_type": "apparent_only",
            "possible_reconciliation": ["信息不足"],
        }

    # Deterministic skeleton; production version should use structured LLM
    # plus textual entailment and user confirmation.
    opposite_pairs = [
        ("所有", "有时"),
        ("从不", "曾经"),
        ("不在乎", "很怕"),
        ("只看事实", "我感觉"),
        ("别人必须", "我可以"),
    ]
    for left, right in opposite_pairs:
        if (left in a and right in b) or (right in a and left in b):
            return {
                "detected": True,
                "confidence": 0.6,
                "tension_type": "apparent_only",
                "possible_reconciliation": ["语境不同", "时间不同", "表达夸张"],
                "follow_up_question": "这两句话适用的情境有什么不同？",
            }

    return {
        "detected": False,
        "confidence": 0.3,
        "tension_type": "apparent_only",
        "possible_reconciliation": ["可能并不矛盾"],
    }
