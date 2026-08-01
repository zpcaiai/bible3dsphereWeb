from theology_knowledge.evidence_graph import build_evidence_graph

def test_graph_trace():
    graph = build_evidence_graph(
        query_id="q1",
        sources=[{"source_id":"s1","title":"Source"}],
        passages=[{"passage_id":"p1","source_id":"s1","text":"text"}],
        claims=[{"claim_id":"c1","text":"claim","supporting_passage_ids":["p1"]}],
        generated_statements=[{"statement_id":"g1","text":"answer","claim_ids":["c1"]}],
    )
    assert any(e["type"] == "SUPPORTS" for e in graph.edges)
    assert any(e["type"] == "GENERATED_FROM" for e in graph.edges)
    assert graph.quality_gates[1]["passed"] is True

def test_graph_flags_untraced_statement():
    graph = build_evidence_graph(
        query_id="q2",
        sources=[],
        passages=[],
        claims=[],
        generated_statements=[{"statement_id":"g1","text":"unsupported","claim_ids":[]}],
    )
    assert graph.quality_gates[1]["passed"] is False
