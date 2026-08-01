import json
from pathlib import Path
from formation_twin.models import FormationEvent
from formation_twin.windows import review_window

FIXTURES = Path(__file__).parent / "fixtures"

def load_event():
    return FormationEvent.model_validate(
        json.loads((FIXTURES / "normal_event.json").read_text(encoding="utf-8"))
    )

def test_14_day_review():
    result = review_window("u1", [load_event()], 14)
    assert result["window_days"] == 14
    assert result["findings"]["gospel_recall_count"] == 1

def test_30_day_sparse_has_limitations():
    result = review_window("u1", [load_event()], 30)
    assert "Sparse event evidence." in result["limitations"]
    assert "Insufficient cross-context transfer evidence." in result["limitations"]

def test_invalid_window():
    try:
        review_window("u1", [load_event()], 7)
        assert False
    except ValueError:
        assert True
