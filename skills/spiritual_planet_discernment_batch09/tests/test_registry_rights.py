import json
from pathlib import Path
from theology_knowledge.models import SourceDocument, RightsStatus
from theology_knowledge.registry import SourceRegistry
from theology_knowledge.rights import RightsPolicy

FIXTURES = Path(__file__).parent / "fixtures"

def load_source(name):
    return SourceDocument.model_validate(
        json.loads((FIXTURES / name).read_text(encoding="utf-8"))
    )

def test_registry_add():
    r = SourceRegistry()
    r.add(load_source("source_public.json"))
    assert len(r) == 1
    assert r.get("src1").title

def test_rights_policy():
    p = RightsPolicy()
    assert p.can_embed(RightsStatus.PUBLIC_DOMAIN)
    assert not p.can_embed(RightsStatus.QUOTATION_ONLY)
    assert not p.can_generate_from(RightsStatus.PROHIBITED_FOR_GENERATION)
