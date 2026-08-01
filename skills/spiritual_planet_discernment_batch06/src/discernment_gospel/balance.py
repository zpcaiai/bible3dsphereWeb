from __future__ import annotations


class LawGospelBalanceController:
    REQUIRED_GOSPEL_FACTS = {
        "christ",
        "cross",
        "resurrection",
        "grace",
        "faith",
    }

    def evaluate(
        self,
        *,
        law_commands: int,
        gospel_facts: set[str],
        behavior_as_basis: bool,
        repentance_absent: bool,
    ) -> dict:
        missing = sorted(self.REQUIRED_GOSPEL_FACTS - gospel_facts)
        moralism_risk = "high" if behavior_as_basis or (law_commands >= 3 and missing) else "low"
        cheap_grace_risk = "high" if repentance_absent else "low"
        confusion = behavior_as_basis

        decision = "pass"
        if moralism_risk == "high" or cheap_grace_risk == "high" or missing:
            decision = "rewrite"

        return {
            "law_functions_present": [],
            "gospel_facts_present": sorted(gospel_facts),
            "missing_gospel_facts": missing,
            "moralism_risk": moralism_risk,
            "cheap_grace_risk": cheap_grace_risk,
            "justification_sanctification_confusion": confusion,
            "decision": decision,
        }
