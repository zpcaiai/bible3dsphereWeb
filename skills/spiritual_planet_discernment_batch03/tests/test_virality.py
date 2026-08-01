from discernment_virality.virality import decompose_virality

def test_decomposition_has_unknown_residual_and_no_percentages():
    result = decompose_virality({
        "narrative_fit": {
            "direction": "positive",
            "evidence_level": "P2",
            "support": ["多个高互动内容重复同一叙事"],
            "alternative_explanations": ["样本选择偏差"]
        }
    })
    assert result["unknown_residual"] is True
    assert "not a causal contribution estimate" in result["precision_warning"]
    assert len(result["factors"]) == 12
