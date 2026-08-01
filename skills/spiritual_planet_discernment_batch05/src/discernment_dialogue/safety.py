from __future__ import annotations

import re
from dataclasses import dataclass, field


@dataclass
class SafetyDecision:
    status: str
    reasons: list[str] = field(default_factory=list)
    next_action: str = "continue"


class DialogueSafetyGuardian:
    BLOCK = {
        "coercive_salvation": re.compile(r"(你不接受就|不回答就证明|拒绝福音说明你)"),
        "demonic_claim": re.compile(r"(被鬼附|邪灵控制|魔鬼化身)"),
        "salvation_judgment": re.compile(r"(一定没得救|神已经弃绝|必定下地狱)"),
    }

    HOLD = {
        "scrupulosity": re.compile(r"(反复认罪|认罪几个小时|神不会赦免|任何自信都.*罪)"),
        "trauma": re.compile(r"(家暴|性侵|虐待|创伤|闪回)"),
        "crisis": re.compile(r"(不想活|想死|伤害自己|杀了他)"),
        "shame_overload": re.compile(r"(我一无是处|我不配活|全都是我的错)"),
    }

    def review(self, text: str) -> SafetyDecision:
        blocked = [k for k,p in self.BLOCK.items() if p.search(text)]
        if blocked:
            return SafetyDecision("blocked", blocked, "rewrite_or_human_review")

        holds = [k for k,p in self.HOLD.items() if p.search(text)]
        if holds:
            return SafetyDecision("safety_hold", holds, "stop_normal_questioning")

        return SafetyDecision("ready")
