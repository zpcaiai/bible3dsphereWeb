from __future__ import annotations

from .models import DoctrineTier


class DenominationalGovernor:
    def evaluate(self, tier: DoctrineTier, scope_labeled: bool, used_as_salvation_test: bool) -> dict:
        if tier == DoctrineTier.TIER_1:
            return {"decision": "pass", "reason": "common_core"}

        if not scope_labeled:
            return {"decision": "rewrite", "reason": "tradition_scope_missing"}

        if tier == DoctrineTier.TIER_3 and used_as_salvation_test:
            return {"decision": "blocked", "reason": "secondary_view_used_as_salvation_test"}

        return {"decision": "pass", "reason": "scope_labeled"}
