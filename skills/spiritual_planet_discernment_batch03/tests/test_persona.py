from discernment_virality.persona import separate_persona_layers
from discernment_virality.models import EvidenceLevel

def test_analyst_hypothesis_capped_at_p2():
    profile = separate_persona_layers([
        {
            "layer": "verified_identity",
            "label": "职业",
            "description": "公开公司页面列为讲师",
            "evidence_level": "P3"
        },
        {
            "layer": "analyst_hypotheses",
            "label": "救主型人设",
            "description": "内容可能呈现单一答案提供者",
            "evidence_level": "P4",
            "alternative_explanations": ["短视频压缩表达"]
        }
    ])
    assert profile.verified_identity[0].evidence_level == EvidenceLevel.P3
    assert profile.analyst_hypotheses[0].evidence_level == EvidenceLevel.P2
