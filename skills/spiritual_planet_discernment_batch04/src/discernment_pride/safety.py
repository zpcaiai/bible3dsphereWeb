from __future__ import annotations

import re
from dataclasses import dataclass, field


@dataclass
class SafetyDecision:
    status: str
    reasons: list[str] = field(default_factory=list)
    required_actions: list[str] = field(default_factory=list)


class PrideSafetyGuardian:
    BLOCK = {
        "clinical_diagnosis": re.compile(r"(人格障碍|自恋型人格|精神病|心理疾病就是)"),
        "salvation_judgment": re.compile(r"(一定没得救|神已经弃绝|必定下地狱)"),
        "demonic_claim": re.compile(r"(被鬼附|邪灵控制|魔鬼化身)"),
        "disagreement_as_proof": re.compile(r"(他不同意.*说明他骄傲|拒绝承认就是有罪的证据)"),
    }

    HOLD = {
        "scrupulosity": re.compile(r"(反复认罪|认罪几个小时|任何自信都觉得是罪|神不会赦免)"),
        "trauma_risk": re.compile(r"(家暴|性侵|虐待|创伤|被控制)"),
        "public_person_verdict": re.compile(r"(这个网红本质上就是|这个牧师内心就是)"),
    }

    def review(self, text: str) -> SafetyDecision:
        blocked = [name for name, pattern in self.BLOCK.items() if pattern.search(text)]
        if blocked:
            return SafetyDecision(
                status="blocked",
                reasons=blocked,
                required_actions=["删除越权判断", "改为可观察事实或转人工复核"],
            )

        holds = [name for name, pattern in self.HOLD.items() if pattern.search(text)]
        if holds:
            return SafetyDecision(
                status="pastoral_safety_hold",
                reasons=holds,
                required_actions=["停止加深定罪", "优先安全、恩典与合格人工支持"],
            )

        return SafetyDecision(status="ready")
