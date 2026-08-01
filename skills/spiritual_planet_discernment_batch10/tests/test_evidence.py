import json
from datetime import datetime, timezone
from pathlib import Path
from production_gate.models import CertificationControl, EvidenceItem
from production_gate.evidence import validate_evidence

FIXTURES = Path(__file__).parent / "fixtures"

def load(model, name):
    return model.model_validate(
        json.loads((FIXTURES / name).read_text(encoding="utf-8"))
    )

def test_valid_evidence_set():
    result = validate_evidence(
        load(CertificationControl, "control_c4.json"),
        [
            load(EvidenceItem, "evidence_valid_auto.json"),
            load(EvidenceItem, "evidence_valid_manual.json"),
        ],
        datetime(2026, 8, 1, tzinfo=timezone.utc),
    )
    assert result["valid"] is True
    assert result["missing_types"] == []

def test_missing_manual_review_fails():
    result = validate_evidence(
        load(CertificationControl, "control_c4.json"),
        [load(EvidenceItem, "evidence_valid_auto.json")],
        datetime(2026, 8, 1, tzinfo=timezone.utc),
    )
    assert result["valid"] is False
    assert "manual_review" in result["missing_types"]
