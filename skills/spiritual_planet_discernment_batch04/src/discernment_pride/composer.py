from __future__ import annotations

from itertools import combinations
from typing import Iterable

from .models import HypothesisComposition, PrideHypothesis


KNOWN_COMPOSITIONS = {
    frozenset({"competence_justification", "control_sovereignty"}): (
        "reinforcing",
        "能力价值与结果控制相互强化，形成不可替代者模式。",
    ),
    frozenset({"moral_self_righteousness", "tribal_superiority"}): (
        "reinforcing",
        "群体身份为道德自义提供保护，形成阵营无罪模式。",
    ),
    frozenset({"spiritual_pride", "messianic_self_image"}): (
        "reinforcing",
        "属灵地位与救主角色相互强化，形成属灵救世主模式。",
    ),
    frozenset({"false_humility", "competence_justification"}): (
        "masking",
        "自我贬低可能遮蔽对能力肯定和不可替代价值的持续需求。",
    ),
    frozenset({"victimhood_innocence", "moral_self_righteousness"}): (
        "reinforcing",
        "真实受伤可能被用来维持持续的道德豁免。",
    ),
}


def compose_hypotheses(hypotheses: Iterable[PrideHypothesis]) -> list[HypothesisComposition]:
    items = list(hypotheses)
    results: list[HypothesisComposition] = []
    for left, right in combinations(items, 2):
        key = frozenset({left.pattern_id, right.pattern_id})
        if key not in KNOWN_COMPOSITIONS:
            continue
        interaction, explanation = KNOWN_COMPOSITIONS[key]
        results.append(HypothesisComposition(
            composition_id=f"{left.hypothesis_id}+{right.hypothesis_id}",
            component_hypotheses=[left.hypothesis_id, right.hypothesis_id],
            interaction_type=interaction,
            explanation=explanation,
            limitations=["组合说明是解释模板，不是固定人格类型。"],
        ))
    return results
