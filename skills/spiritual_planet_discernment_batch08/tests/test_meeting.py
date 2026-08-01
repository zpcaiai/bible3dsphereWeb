import pytest
from pastoral_collaboration.meeting import build_meeting_prep

def test_meeting_prep_one_question():
    prep = build_meeting_prep(
        "c1",
        "review",
        ["focus"],
        [],
        [],
        ["uncertain"],
        "如果别人也能做好，你首先感到释放还是失落？",
        "你是管家，不是救主。",
        "委派一个任务。",
        ["你就是控制狂"],
    )
    assert prep["priority_question"].count("？") == 1

def test_meeting_prep_rejects_two_questions():
    with pytest.raises(ValueError):
        build_meeting_prep(
            "c1","review",[],[],[],[],
            "你怕什么？你想得到什么？",
            "truth","action",[]
        )
