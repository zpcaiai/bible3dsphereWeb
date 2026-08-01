from discernment_pride.orchestrator import PrideHypothesisOrchestrator

def test_normal_flow():
    flow = PrideHypothesisOrchestrator().start(
        "case-1",
        "我总觉得只有我能把工作做好。",
        True,
    )
    assert flow.state == "HYPOTHESIS_PROPOSED"

def test_no_consent_blocks():
    flow = PrideHypothesisOrchestrator().start("case-2", "text", False)
    assert flow.state == "BLOCKED"
