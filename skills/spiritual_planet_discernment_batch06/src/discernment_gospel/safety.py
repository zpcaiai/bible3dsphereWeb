from __future__ import annotations

import re
from dataclasses import dataclass, field


@dataclass
class SafetyDecision:
    status: str
    reasons: list[str] = field(default_factory=list)
    actions: list[str] = field(default_factory=list)


class GospelSafetyGuardian:
    BLOCK = {
        "coercion": re.compile(r"(不接受就证明|拒绝福音说明|必须现在决志否则)"),
        "salvation_verdict": re.compile(r"(你一定没得救|神已经弃绝你|你必定下地狱)"),
        "prosperity_promise": re.compile(r"(信了就一定发财|接受耶稣就不会生病|保证事业成功)"),
    }

    HOLD = {
        "scrupulosity": re.compile(r"(反复认罪|认罪几个小时|神不会赦免|每天检查是否得救)"),
        "abuse": re.compile(r"(家暴|性侵|虐待|被牧师控制|被教会威胁)"),
        "crisis": re.compile(r"(想死|不想活|伤害自己|杀了他)"),
    }

    def review(self, text: str) -> SafetyDecision:
        blocked = [k for k,p in self.BLOCK.items() if p.search(text)]
        if blocked:
            return SafetyDecision("blocked", blocked, ["rewrite_or_human_review"])

        holds = [k for k,p in self.HOLD.items() if p.search(text)]
        if holds:
            return SafetyDecision(
                "safety_hold",
                holds,
                ["stop_normal_path", "prioritize_safety_and_grace"],
            )

        return SafetyDecision("ready")
