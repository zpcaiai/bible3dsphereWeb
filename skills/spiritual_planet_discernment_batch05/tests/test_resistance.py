from discernment_dialogue.resistance import classify_resistance
from discernment_dialogue.models import ResistanceType

def test_disagreement_not_evasion():
    result = classify_resistance("我不同意这个前提")
    assert result["type"] == ResistanceType.DISAGREEMENT

def test_boundary_setting():
    result = classify_resistance("我不想回答，先到这里")
    assert result["type"] == ResistanceType.BOUNDARY_SETTING

def test_scrupulosity():
    result = classify_resistance("我反复认罪几个小时，还是怕神不会赦免")
    assert result["type"] == ResistanceType.SCRUPULOSITY
