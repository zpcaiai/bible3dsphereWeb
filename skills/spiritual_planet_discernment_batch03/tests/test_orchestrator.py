import json
from pathlib import Path
from discernment_virality.models import AnalysisState, ViralityCase
from discernment_virality.orchestrator import ViralityOrchestrator

FIXTURES = Path(__file__).parent / "fixtures"

def load(name):
    return ViralityCase.model_validate(
        json.loads((FIXTURES / name).read_text(encoding="utf-8"))
    )

def test_normal_case_reaches_normalized():
    trace = ViralityOrchestrator().start(load("controversy_product.json"))
    assert trace.state == AnalysisState.NORMALIZED

def test_minor_case_requires_review():
    trace = ViralityOrchestrator().start(load("minor_safety.json"))
    assert trace.state == AnalysisState.REVIEW_REQUIRED
