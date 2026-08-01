from pathlib import Path
from discernment_pride.loader import HypothesisPackRegistry

ROOT = Path(__file__).parents[1]

def test_registry_loads_nine_packs():
    registry = HypothesisPackRegistry(ROOT / "hypothesis_packs").load()
    assert len(registry) == 9
    assert "spiritual_pride" in registry.list_ids()
