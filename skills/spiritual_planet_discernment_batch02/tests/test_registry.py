from pathlib import Path
from discernment_domain_packs.registry import DomainPackRegistry

def test_load_all_packs():
    root=Path(__file__).resolve().parents[1]
    registry=DomainPackRegistry(root / "packs").load_all()
    assert len(registry.list()) == 32
    assert registry.get("consumerism").name == "消费主义"

def test_no_duplicate_ids():
    root=Path(__file__).resolve().parents[1]
    registry=DomainPackRegistry(root / "packs").load_all()
    ids=[p.id for p in registry.list()]
    assert len(ids) == len(set(ids))
