from __future__ import annotations

import json
from pathlib import Path
from typing import Any


class HypothesisPackRegistry:
    def __init__(self, root: str | Path):
        self.root = Path(root)
        self._packs: dict[str, dict[str, Any]] = {}

    def load(self) -> "HypothesisPackRegistry":
        for path in self.root.glob("*/pack.json"):
            pack = json.loads(path.read_text(encoding="utf-8"))
            pack_id = pack["id"]
            if pack_id in self._packs:
                raise ValueError(f"Duplicate hypothesis pack: {pack_id}")
            self._packs[pack_id] = pack
        return self

    def get(self, pack_id: str) -> dict[str, Any]:
        return self._packs[pack_id]

    def list_ids(self) -> list[str]:
        return sorted(self._packs)

    def __len__(self) -> int:
        return len(self._packs)
