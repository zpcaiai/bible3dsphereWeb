import json
from pathlib import Path
from pastoral_collaboration.models import Actor, ConsentGrant, DataLevel, PastoralCase
from pastoral_collaboration.orchestrator import PastoralCollaborationOrchestrator

FIXTURES = Path(__file__).parent / "fixtures"

def load(model, name):
    return model.model_validate(json.loads((FIXTURES / name).read_text(encoding="utf-8")))

def test_normal_access():
    result = PastoralCollaborationOrchestrator().request_access(
        load(Actor, "actor_mentor.json"),
        load(PastoralCase, "case_l1.json"),
        load(ConsentGrant, "consent_mentor.json"),
        "mentor formation review",
        DataLevel.L1,
    )
    assert result["decision"] == "allowed"

def test_abuse_case_escalates():
    result = PastoralCollaborationOrchestrator().request_access(
        load(Actor, "actor_mentor.json"),
        load(PastoralCase, "case_l2_abuse.json"),
        None,
        "review",
        DataLevel.L1,
    )
    assert result["decision"] == "escalate"
