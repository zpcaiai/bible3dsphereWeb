from __future__ import annotations
import json
from pathlib import Path
from .models import DomainPack

def load_pack(path: Path) -> DomainPack:
    data = json.loads(path.read_text(encoding="utf-8"))
    return DomainPack.model_validate(data)

def discover_pack_files(root: Path) -> list[Path]:
    return sorted(root.glob("*/pack.json"))
