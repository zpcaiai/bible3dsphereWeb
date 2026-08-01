from pastoral_collaboration.models import Actor
from pastoral_collaboration.conflict import detect_conflict

def test_detect_conflict():
    actor = Actor(
        actor_id="a1",
        display_name="actor",
        roles=["pastor_elder"],
        tenant_id="t1",
        conflicts=["respondent_supervisor"]
    )
    result = detect_conflict(actor, ["respondent_supervisor","same_small_group"])
    assert result["conflict_present"] is True
    assert result["decision"] == "recuse"

def test_no_conflict():
    actor = Actor(
        actor_id="a2",
        display_name="actor",
        roles=["pastor_elder"],
        tenant_id="t1",
        conflicts=[]
    )
    assert detect_conflict(actor, ["same_small_group"])["decision"] == "proceed"
