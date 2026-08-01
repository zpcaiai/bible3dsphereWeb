from pastoral_collaboration.minimization import build_disclosure

def test_disclosure_selects_minimum_fields():
    d = build_disclosure(
        disclosure_id="d1",
        case_id="c1",
        recipient_actor_id="a1",
        purpose="meeting",
        requested_fields=["summary","priority_question","trauma_history","third_party_name"],
        allowed_fields={"summary","priority_question","trauma_history"},
        prohibited_fields={"trauma_history","third_party_name"},
        expires_at="2026-08-10",
        basis="user_consent",
        audit_id="audit-1",
    )
    assert d.selected_fields == ["summary","priority_question"]
    assert "trauma_history" in d.redacted_fields
    assert d.reshare_policy == "forbidden"
