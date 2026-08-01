import json
from pathlib import Path
from formation_twin.models import FormationEvent
from formation_twin.orchestrator import FormationTwinOrchestrator

FIXTURES = Path(__file__).parent / "fixtures"

def load(name):
    return FormationEvent.model_validate(
        json.loads((FIXTURES / name).read_text(encoding="utf-8"))
    )

def test_normal_ingest_ready():
    result = FormationTwinOrchestrator().ingest(load("normal_event.json"))
    assert result["review_status"] == "ready"
    assert result["chain"]["trigger"] == "同事遗漏测试"

def test_no_consent_blocked():
    result = FormationTwinOrchestrator().ingest(load("no_consent_event.json"))
    assert result["review_status"] == "blocked"

def test_scrupulosity_hold():
    result = FormationTwinOrchestrator().ingest(load("scrupulosity_event.json"))
    assert result["review_status"] == "safety_hold"
