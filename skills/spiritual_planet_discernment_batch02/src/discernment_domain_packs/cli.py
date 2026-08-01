from __future__ import annotations
import argparse
from pathlib import Path
from .registry import DomainPackRegistry

def main() -> None:
    parser=argparse.ArgumentParser()
    parser.add_argument("--packs-root", type=Path, default=Path("packs"))
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--cluster")
    args=parser.parse_args()
    registry=DomainPackRegistry(args.packs_root).load_all()
    if args.list:
        for p in registry.list(args.cluster):
            print(f"{p.id}	{p.cluster}	{p.name}	{p.version}")
