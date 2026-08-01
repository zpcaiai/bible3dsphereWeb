import pytest
from production_gate.recertification import required_domains_for_trigger

def test_model_change_domains():
    domains = required_domains_for_trigger("model_change")
    assert "model_prompt_rag_governance" in domains
    assert "theology_gospel_quality" in domains

def test_incident_all():
    assert required_domains_for_trigger("incident") == ["ALL"]

def test_unknown_trigger():
    with pytest.raises(ValueError):
        required_domains_for_trigger("unknown")
