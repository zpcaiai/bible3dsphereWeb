from pathlib import Path
from production_gate.registry import CertificationRegistry

ROOT = Path(__file__).parents[1]

def test_registry_loads_domains_and_controls():
    registry = CertificationRegistry(ROOT / "certification_packs").load()
    assert len(registry) == 58
    assert registry.get("TGQ-001").severity.value == "C4"
    assert len(registry.by_domain("theology_gospel_quality")) == 5
