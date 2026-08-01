from pathlib import Path
from discernment_gospel.registry import DoctrineRegistry

ROOT = Path(__file__).parents[1]

def test_registry_loads_ten_packs():
    registry = DoctrineRegistry(ROOT / "doctrine_packs").load()
    assert len(registry) == 10
    assert "union_with_christ" in registry.list_ids()
