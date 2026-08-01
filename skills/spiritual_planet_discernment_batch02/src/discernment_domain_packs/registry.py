from __future__ import annotations
from pathlib import Path
from .loader import discover_pack_files, load_pack
from .models import DomainPack

class DomainPackRegistry:
    def __init__(self, packs_root: Path):
        self.packs_root = packs_root
        self._packs: dict[str, DomainPack] = {}

    def load_all(self) -> "DomainPackRegistry":
        loaded = [load_pack(p) for p in discover_pack_files(self.packs_root)]
        duplicates = {p.id for p in loaded if sum(x.id == p.id for x in loaded) > 1}
        if duplicates:
            raise ValueError(f"Duplicate pack ids: {sorted(duplicates)}")
        self._packs = {p.id: p for p in loaded}
        return self

    def get(self, pack_id: str) -> DomainPack:
        try:
            return self._packs[pack_id]
        except KeyError as exc:
            raise KeyError(f"Unknown domain pack: {pack_id}") from exc

    def list(self, cluster: str | None = None) -> list[DomainPack]:
        values = list(self._packs.values())
        if cluster is not None:
            values = [p for p in values if p.cluster == cluster]
        return sorted(values, key=lambda p: (p.cluster, p.name))
