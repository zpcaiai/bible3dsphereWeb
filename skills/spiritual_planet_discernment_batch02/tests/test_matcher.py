from pathlib import Path
from discernment_domain_packs.registry import DomainPackRegistry
from discernment_domain_packs.matcher import baseline_match

def test_baseline_match_is_non_authoritative():
    root=Path(__file__).resolve().parents[1]
    p=DomainPackRegistry(root / "packs").load_all().get("consumerism")
    result=baseline_match("买到最新款我才算成功，旧款让我没有价值", p)
    assert 0 <= result.score <= 1
    assert "not sufficient" in result.explanation
