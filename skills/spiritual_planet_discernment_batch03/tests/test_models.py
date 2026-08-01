import json
from pathlib import Path
from discernment_virality.models import ViralityCase

FIXTURES = Path(__file__).parent / "fixtures"

def test_case_fixture_parses():
    data = json.loads((FIXTURES / "success_influencer.json").read_text(encoding="utf-8"))
    case = ViralityCase.model_validate(data)
    assert case.case_id == "viral-success-001"
    assert case.consent_scope.allow_spiritual_analysis is True
