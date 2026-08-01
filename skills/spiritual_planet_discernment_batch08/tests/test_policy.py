import json
from pathlib import Path
from pastoral_collaboration.models import Actor, ConsentGrant, DataLevel, PastoralCase
from pastoral_collaboration.policy import AccessPolicyEvaluator

FIXTURES = Path(__file__).parent / "fixtures"

def load_actor(name):
    return Actor.model_validate(json.loads((FIXTURES / name).read_text(encoding="utf-8")))

def load_case(name):
    return PastoralCase.model_validate(json.loads((FIXTURES / name).read_text(encoding="utf-8")))

def load_consent(name):
    return ConsentGrant.model_validate(json.loads((FIXTURES / name).read_text(encoding="utf-8")))

def test_mentor_can_access_consented_l1():
    result = AccessPolicyEvaluator().evaluate(
        load_actor("actor_mentor.json"),
        load_case("case_l1.json"),
        load_consent("consent_mentor.json"),
        "mentor formation review",
        DataLevel.L1,
        False,
    )
    assert result["decision"] == "allowed"

def test_group_leader_cannot_access_l1():
    result = AccessPolicyEvaluator().evaluate(
        load_actor("actor_group_leader.json"),
        load_case("case_l1.json"),
        None,
        "mentor formation review",
        DataLevel.L1,
        False,
    )
    assert result["decision"] == "denied"
    assert result["reason"] == "role_not_permitted"

def test_conflict_denies():
    result = AccessPolicyEvaluator().evaluate(
        load_actor("actor_mentor.json"),
        load_case("case_l1.json"),
        load_consent("consent_mentor.json"),
        "mentor formation review",
        DataLevel.L1,
        True,
    )
    assert result["reason"] == "conflict_of_interest"
