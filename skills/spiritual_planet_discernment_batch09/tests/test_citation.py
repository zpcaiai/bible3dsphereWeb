import json
from pathlib import Path
from theology_knowledge.models import CitationRecord, SourceDocument
from theology_knowledge.citation import verify_citation

FIXTURES = Path(__file__).parent / "fixtures"

def test_valid_citation():
    source = SourceDocument.model_validate(
        json.loads((FIXTURES / "source_public.json").read_text(encoding="utf-8"))
    )
    citation = CitationRecord.model_validate(
        json.loads((FIXTURES / "citation_valid.json").read_text(encoding="utf-8"))
    )
    result = verify_citation(citation, source)
    assert result["valid"] is True

def test_unverified_citation_fails():
    source = SourceDocument(
        source_id="s",
        title="t",
        source_type="monograph",
        language="en",
        rights_status="public_domain",
        version="1",
        edition="1"
    )
    citation = CitationRecord(
        citation_id="c",
        source_id="s",
        locator="p. 1",
        quote_text="q",
        verification_status="unverified"
    )
    assert verify_citation(citation, source)["valid"] is False
