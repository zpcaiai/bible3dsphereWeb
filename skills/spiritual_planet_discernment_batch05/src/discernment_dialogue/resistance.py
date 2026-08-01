from __future__ import annotations

import re
from .models import ResistanceType


PATTERNS = [
    (ResistanceType.BOUNDARY_SETTING, re.compile(r"(不想回答|跳过|停止|到这里|不要再问|不讨论这个)")),
    (ResistanceType.SCRUPULOSITY, re.compile(r"(反复认罪|认罪几个小时|神不会赦免|任何.*都是罪)")),
    (ResistanceType.TRAUMA_ACTIVATION, re.compile(r"(创伤|家暴|性侵|虐待|闪回|被控制)")),
    (ResistanceType.SHAME_FLOODING, re.compile(r"(我一无是处|我太恶心|我不配活|全都是我的错)")),
    (ResistanceType.FATIGUE, re.compile(r"(累了|不想继续|问太多了|以后再说)")),
    (ResistanceType.CONFUSION, re.compile(r"(没听懂|不明白|什么意思|能具体一点吗)")),
    (ResistanceType.DISAGREEMENT, re.compile(r"(我不同意|这个前提不成立|不是这样)")),
    (ResistanceType.HOSTILITY, re.compile(r"(闭嘴|少来这一套|你没资格|滚)")),
]


def classify_resistance(text: str) -> dict:
    for resistance_type, pattern in PATTERNS:
        if pattern.search(text):
            return {
                "type": resistance_type,
                "confidence": 0.8,
                "recommended_response": recommended_response(resistance_type),
            }
    return {
        "type": ResistanceType.NONE,
        "confidence": 0.4,
        "recommended_response": "continue",
    }


def recommended_response(resistance_type: ResistanceType) -> str:
    mapping = {
        ResistanceType.BOUNDARY_SETTING: "respect_pause_or_exit",
        ResistanceType.SCRUPULOSITY: "safety_hold_and_grace",
        ResistanceType.TRAUMA_ACTIVATION: "trauma_informed_pause",
        ResistanceType.SHAME_FLOODING: "reduce_shame_and_ground",
        ResistanceType.FATIGUE: "offer_pause",
        ResistanceType.CONFUSION: "rephrase_concretely",
        ResistanceType.DISAGREEMENT: "invite_reason_without_pathologizing",
        ResistanceType.HOSTILITY: "deescalate_or_exit",
    }
    return mapping.get(resistance_type, "continue")
