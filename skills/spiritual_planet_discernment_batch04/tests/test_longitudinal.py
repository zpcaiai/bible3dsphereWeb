from discernment_pride.longitudinal import review_longitudinal
from discernment_pride.models import EvidenceLevel

def test_upgrade_with_cross_context_evidence():
    result = review_longitudinal(EvidenceLevel.H2, 4, 0, True, 30)
    assert result["new_level"] == "H3"
    assert result["decision"] == "upgrade"

def test_falsify_without_support():
    result = review_longitudinal(EvidenceLevel.H1, 0, 2, False, 14)
    assert result["new_level"] == "H0"
    assert result["decision"] == "falsify"
