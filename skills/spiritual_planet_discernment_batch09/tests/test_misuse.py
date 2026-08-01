from theology_knowledge.misuse import detect_misuse

def test_word_study_fallacy():
    result = detect_misuse("Strong编号这样，所以这个词包含所有意思")
    assert "word_study_fallacy" in result["risk_types"]

def test_abusive_authority_high():
    result = detect_misuse("顺服牧者所以不能质疑，也不可调查神的受膏者")
    assert result["severity"] == "high"
    assert result["human_review_required"] is True

def test_normal_no_risk():
    result = detect_misuse("需要结合段落、文体与全书背景解释")
    assert result["severity"] == "none"
