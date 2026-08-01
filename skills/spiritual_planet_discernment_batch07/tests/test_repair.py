from formation_twin.models import RelationshipRepair
from formation_twin.repair import verify_repair

def test_apology_only_not_verified():
    repair = RelationshipRepair(
        repair_id="r1",
        relationship_id="rel1",
        harm_named=True,
        responsibility_taken=True,
        excuse_free=True,
        behavior_change=False,
        boundary_respected=True,
        status="apology_only"
    )
    result = verify_repair(repair)
    assert result["apology_only"] is True
    assert result["decision"] != "verified_change"

def test_full_repair_verified():
    repair = RelationshipRepair(
        repair_id="r2",
        relationship_id="rel1",
        harm_named=True,
        responsibility_taken=True,
        excuse_free=True,
        behavior_change=True,
        boundary_respected=True,
        status="verified_change"
    )
    assert verify_repair(repair)["decision"] == "verified_change"
