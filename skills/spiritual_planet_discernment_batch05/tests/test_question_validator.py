from discernment_dialogue.question_validator import validate_single_question

def test_single_question_valid():
    result = validate_single_question("什么证据会使你改变这个看法？")
    assert result["valid"] is True

def test_multiple_questions_invalid():
    result = validate_single_question("你怕什么？你想得到什么？")
    assert result["valid"] is False

def test_hidden_compound_invalid():
    result = validate_single_question("你害怕失败；如果失败又会说明什么？")
    assert result["valid"] is False
