import json
from pathlib import Path
from formation_twin.models import FormationEvent
from formation_twin.chain import build_chain

FIXTURES = Path(__file__).parent / "fixtures"

def load(name):
    return FormationEvent.model_validate(
        json.loads((FIXTURES / name).read_text(encoding="utf-8"))
    )

def test_build_chain():
    chain = build_chain(load("normal_event.json"))
    assert chain.trigger == "同事遗漏测试"
    assert "团队依赖" in chain.long_cost
    assert chain.gospel_alternative["truth_recalled"]
