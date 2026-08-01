from __future__ import annotations

import re
from dataclasses import dataclass, field


@dataclass
class SafetyDecision:
    risk_level: str
    blocked_patterns: list[str] = field(default_factory=list)
    required_rewrites: list[str] = field(default_factory=list)
    human_review_required: bool = False
    blocked: bool = False


class PublicFigureSafetyGuardian:
    BLOCK_PATTERNS = {
        "doxxing": re.compile(r"(开盒|人肉|住址|身份证|私人电话|跟踪他)"),
        "harassment": re.compile(r"(网暴|举报轰炸|冲烂|围攻|骚扰)"),
        "salvation_judgment": re.compile(r"(一定没得救|神已经弃绝|必定下地狱)"),
        "demonic_claim": re.compile(r"(被鬼附|邪灵控制他|魔鬼化身)"),
        "clinical_diagnosis": re.compile(r"(他就是精神病|人格障碍|自恋型人格障碍)"),
    }

    RISKY_ASSERTIONS = {
        "unsupported_criminal": re.compile(r"(他就是骗子|诈骗犯|犯罪分子)"),
        "hidden_motive": re.compile(r"(他内心就是|他真正目的就是|他肯定是为了)"),
        "algorithm_certainty": re.compile(r"(算法一定|平台就是故意把他推爆)"),
        "income_certainty": re.compile(r"(他肯定赚了|他实际收入就是)"),
    }

    def review(self, text: str, evidence_level: str = "P0") -> SafetyDecision:
        blocked = []
        rewrites = []

        for name, pattern in self.BLOCK_PATTERNS.items():
            if pattern.search(text):
                blocked.append(name)

        for name, pattern in self.RISKY_ASSERTIONS.items():
            if pattern.search(text) and evidence_level not in {"P3", "P4"}:
                rewrites.append(name)

        if blocked:
            return SafetyDecision(
                risk_level="high",
                blocked_patterns=blocked,
                required_rewrites=rewrites,
                human_review_required=True,
                blocked=True,
            )

        if rewrites:
            return SafetyDecision(
                risk_level="medium",
                required_rewrites=rewrites,
                human_review_required=True,
            )

        return SafetyDecision(risk_level="low")
