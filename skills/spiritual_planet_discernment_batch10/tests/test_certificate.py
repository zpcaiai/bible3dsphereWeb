from production_gate.certificate import issue_certificate, revoke_certificate
from production_gate.models import ReleaseStatus

def test_issue_certificate_has_hash():
    cert = issue_certificate(
        certificate_id="cert1",
        release_id="r1",
        status=ReleaseStatus.APPROVED_FOR_PRODUCTION,
        expires_at="2026-12-31T00:00:00+00:00",
        scope={"target":"production"},
        domain_results=[],
        open_findings=[],
        accepted_risks=[],
        feature_restrictions=[],
        rollback_target="r0",
        recertification_triggers=["model_change"],
        signatories=[{"role":"security","actor":"a1"}],
    )
    assert len(cert.signature_hash) == 64
    assert cert.status == ReleaseStatus.APPROVED_FOR_PRODUCTION

def test_revoke_certificate():
    rev = revoke_certificate("cert1", ["C4_incident"], ["disable_feature"])
    assert rev["certificate_id"] == "cert1"
    assert "disable_feature" in rev["actions"]
