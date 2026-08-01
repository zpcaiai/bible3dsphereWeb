import json
from pathlib import Path
from discernment_gospel.models import GospelPathContext
from discernment_gospel.orchestrator import GospelPathOrchestrator

FIXTURES = Path(__file__).parent / "fixtures"

def load(name):
    return GospelPathContext.model_validate(
        json.loads((FIXTURES / name).read_text(encoding="utf-8"))
    )

def test_normal_path_ready():
    result = GospelPathOrchestrator().run(load("normal_context.json"))
    assert result["review_status"] == "ready"
    assert len(result["segments"]) == 10

def test_no_consent_blocked():
    result = GospelPathOrchestrator().run(load("seeker_no_consent.json"))
    assert result["review_status"] == "blocked"
    assert result["reason"] == "gospel_consent_required"

def test_scrupulosity_hold():
    result = GospelPathOrchestrator().run(load("scrupulosity_context.json"))
    assert result["review_status"] == "safety_hold"
