import json
from pathlib import Path
from theology_knowledge.models import RagQuery, SourceDocument
from theology_knowledge.orchestrator import TheologyKnowledgeOrchestrator

FIXTURES = Path(__file__).parent / "fixtures"

def load(model, name):
    return model.model_validate(
        json.loads((FIXTURES / name).read_text(encoding="utf-8"))
    )

def test_filters_rights():
    o = TheologyKnowledgeOrchestrator()
    result = o.filter_sources(
        load(RagQuery, "rag_query.json"),
        [
            load(SourceDocument, "source_public.json"),
            load(SourceDocument, "source_prohibited.json"),
        ],
    )
    assert len(result["allowed"]) == 1
    assert len(result["blocked"]) == 1

def test_misuse_wrapper():
    result = TheologyKnowledgeOrchestrator().check_misuse("奉献就一定发财")
    assert "prosperity_gospel_use" in result["risk_types"]
