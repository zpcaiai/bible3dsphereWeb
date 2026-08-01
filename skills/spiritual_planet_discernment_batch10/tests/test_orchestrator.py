import json
from pathlib import Path
from production_gate.models import DomainResult, Finding, ReleaseCandidate, Severity
from production_gate.orchestrator import ProductionReleaseGate

FIXTURES = Path(__file__).parent / "fixtures"

def load_candidate(name):
    return ReleaseCandidate.model_validate(
        json.loads((FIXTURES / name).read_text(encoding="utf-8"))
    )

def domain():
    return DomainResult(
        result_id="d",
        domain_id="all",
        control_results=[],
        decision="pass",
    )

def test_production_gate_pass():
    result = ProductionReleaseGate().evaluate(
        load_candidate("candidate_production.json"),
        [domain()],
        [],
        True,
        True,
        True,
    )
    assert result["status"] == "APPROVED_FOR_PRODUCTION"
    assert result["build_hash"] == "abc123"

def test_critical_finding_blocks():
    finding = Finding(
        finding_id="f",
        control_id="c",
        severity=Severity.C4,
        title="coercive_gospel",
        status="open",
    )
    result = ProductionReleaseGate().evaluate(
        load_candidate("candidate_pilot.json"),
        [domain()],
        [finding],
        True,
        True,
        True,
    )
    assert result["status"] == "BLOCKED"
