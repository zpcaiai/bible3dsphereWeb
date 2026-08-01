from formation_twin.models import IdentityMigration
from formation_twin.identity import evaluate_identity_migration

def test_language_only():
    migration = IdentityMigration(
        migration_id="m1",
        old_identity_basis=["绩效"],
        gospel_identity_truth=["在基督里被接纳"]
    )
    result = evaluate_identity_migration(migration)
    assert result["status"] == "language_only"

def test_multi_context_transfer():
    migration = IdentityMigration(
        migration_id="m2",
        old_identity_basis=["绩效"],
        gospel_identity_truth=["在基督里被接纳"],
        interpretation_shift=["失败不等于无价值"],
        desire_shift=["不再必须不可替代"],
        action_shift=["委派"],
        relationship_shift=["接受反馈"]
    )
    result = evaluate_identity_migration(migration)
    assert result["status"] == "multi_context_transfer"

def test_full_transfer_warning_not_salvation():
    migration = IdentityMigration(
        migration_id="m3",
        old_identity_basis=["绩效"],
        gospel_identity_truth=["在基督里被接纳"],
        interpretation_shift=["a"],
        desire_shift=["b"],
        action_shift=["c"],
        relationship_shift=["d"],
        relapse_response_shift=["e"]
    )
    result = evaluate_identity_migration(migration)
    assert result["status"] == "stable_under_pressure"
    assert "not salvation status" in result["warning"]
