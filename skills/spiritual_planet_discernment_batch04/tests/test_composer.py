from discernment_pride.composer import compose_hypotheses
from discernment_pride.models import EvidenceLevel, PrideHypothesis

def make(hid, pid):
    return PrideHypothesis(
        hypothesis_id=hid,
        pattern_id=pid,
        scope="self",
        observation_ids=["o1"],
        evidence_level=EvidenceLevel.H2,
        confidence=0.6,
        alternative_explanations=["压力"],
        counter_evidence_needed=["能稳定委派"],
    )

def test_compose_indispensable_controller():
    comps = compose_hypotheses([
        make("h1", "competence_justification"),
        make("h2", "control_sovereignty"),
    ])
    assert len(comps) == 1
    assert comps[0].interaction_type == "reinforcing"

def test_unknown_pair_not_forced():
    comps = compose_hypotheses([
        make("h1", "epistemic_pride"),
        make("h2", "false_humility"),
    ])
    assert comps == []
