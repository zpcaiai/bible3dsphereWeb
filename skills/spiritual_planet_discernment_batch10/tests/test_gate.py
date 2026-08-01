from production_gate.gate import evaluate_release
from production_gate.models import DomainResult, Finding, ReleaseStatus, Severity

def domain(decision="pass"):
    return DomainResult(
        result_id="d1",
        domain_id="domain",
        control_results=[],
        decision=decision,
    )

def finding(severity):
    return Finding(
        finding_id="f1",
        control_id="c1",
        severity=severity,
        title="finding",
        status="open",
    )

def test_production_approved():
    result = evaluate_release(
        [domain()],
        [],
        "production",
        True,
        True,
        True,
    )
    assert result["status"] == ReleaseStatus.APPROVED_FOR_PRODUCTION

def test_c2_blocks_production():
    result = evaluate_release(
        [domain()],
        [finding(Severity.C2)],
        "production",
        True,
        True,
        True,
    )
    assert result["status"] == ReleaseStatus.BLOCKED

def test_c2_conditionally_allows_pilot():
    result = evaluate_release(
        [domain()],
        [finding(Severity.C2)],
        "pilot",
        False,
        True,
        True,
    )
    assert result["status"] == ReleaseStatus.CONDITIONAL_APPROVAL

def test_missing_rollback_blocks_production():
    result = evaluate_release(
        [domain()],
        [],
        "production",
        True,
        False,
        True,
    )
    assert result["status"] == ReleaseStatus.BLOCKED
