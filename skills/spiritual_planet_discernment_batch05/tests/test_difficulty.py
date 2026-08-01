from discernment_dialogue.difficulty import DifficultyController
from discernment_dialogue.models import Difficulty, ResistanceType

def test_lower_on_confusion():
    c = DifficultyController()
    assert c.adjust(Difficulty.D3, ResistanceType.CONFUSION, "partial", "medium") == Difficulty.D2

def test_raise_on_reflective_answer():
    c = DifficultyController()
    assert c.adjust(Difficulty.D1, ResistanceType.NONE, "reflective", "low") == Difficulty.D2

def test_never_raise_on_boundary():
    c = DifficultyController()
    assert c.adjust(Difficulty.D2, ResistanceType.BOUNDARY_SETTING, "reflective", "low") == Difficulty.D2
