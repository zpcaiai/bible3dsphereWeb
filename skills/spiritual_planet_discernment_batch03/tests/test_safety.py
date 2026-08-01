from discernment_virality.safety import PublicFigureSafetyGuardian

def test_blocks_demonic_claim():
    decision = PublicFigureSafetyGuardian().review("这个网红就是被鬼附")
    assert decision.blocked is True
    assert "demonic_claim" in decision.blocked_patterns

def test_requires_rewrite_for_hidden_motive():
    decision = PublicFigureSafetyGuardian().review("他真正目的就是骗取关注", evidence_level="P1")
    assert decision.blocked is False
    assert decision.human_review_required is True
    assert "hidden_motive" in decision.required_rewrites

def test_allows_qualified_public_critique():
    decision = PublicFigureSafetyGuardian().review(
        "公开材料中反复出现保证结果的营销表达，值得评估其误导风险。",
        evidence_level="P2"
    )
    assert decision.risk_level == "low"
