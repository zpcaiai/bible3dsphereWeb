import json
from pathlib import Path
from discernment_gospel.models import GospelPathContext
from discernment_gospel.planner import GospelPathPlanner

FIXTURES = Path(__file__).parent / "fixtures"

def load(name):
    return GospelPathContext.model_validate(
        json.loads((FIXTURES / name).read_text(encoding="utf-8"))
    )

def test_standard_has_ten_segments():
    plan = GospelPathPlanner().build(load("normal_context.json"))
    assert len(plan.segments) == 10
    assert plan.segments[0].doctrine_pack_id == "creation_order"
    assert plan.segments[-1].doctrine_pack_id == "eschatological_hope"

def test_brief_retains_core():
    segments = GospelPathPlanner().select_segments(load("seeker_no_consent.json"))
    assert "christ_and_atonement" in segments
    assert "justification_by_faith" in segments
    assert "union_with_christ" in segments
    assert "eschatological_hope" in segments
