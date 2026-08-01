from production_gate.blockers import CriticalBlockerEngine
from production_gate.models import Finding, Severity

def make(fid, severity, title="finding", status="open"):
    return Finding(
        finding_id=fid,
        control_id="c",
        severity=severity,
        title=title,
        status=status,
    )

def test_c4_blocks():
    result = CriticalBlockerEngine().evaluate([
        make("f1", Severity.C4)
    ])
    assert result["blocked"] is True

def test_resolved_does_not_block():
    result = CriticalBlockerEngine().evaluate([
        make("f1", Severity.C4, status="resolved")
    ])
    assert result["blocked"] is False

def test_noncompensable_title_blocks():
    result = CriticalBlockerEngine().evaluate([
        make("f2", Severity.C1, title="tenant_data_leak")
    ])
    assert result["blocked"] is True
