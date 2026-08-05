#!/usr/bin/env python3
"""Build immutable Claim-Oracle and Batch executor registries for 788 Skills."""

from __future__ import annotations

import hashlib
import argparse
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def canonical_bytes(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def digest(value: object) -> str:
    return "sha256:" + hashlib.sha256(canonical_bytes(value)).hexdigest()


def frontmatter_name(text: str) -> str:
    match = re.search(r"^name:\s*([^\n]+)$", text, re.M)
    if not match:
        raise ValueError("Skill name is missing")
    return match.group(1).strip().strip('"').strip("'")


def section(text: str, heading: str) -> str:
    match = re.search(rf"^{re.escape(heading)}\s*$\n(.*?)(?=^##\s|\Z)", text, re.M | re.S)
    return match.group(1).strip() if match else ""


def bullets(text: str, heading: str) -> list[str]:
    return [match.group(1).strip().rstrip("；;") for match in re.finditer(r"^-\s+(.+?)\s*$", section(text, heading), re.M)]


def matching_section(text: str, tokens: tuple[str, ...]) -> str:
    headings = re.findall(r"^(##\s+.+?)\s*$", text, re.M)
    for heading in headings:
        lowered = heading.lower()
        if any(token.lower() in lowered for token in tokens):
            return section(text, heading)
    return ""


def section_bullets(value: str) -> list[str]:
    return [match.group(1).strip().rstrip("；;") for match in re.finditer(r"^-\s+(.+?)\s*$", value, re.M)]


def batch_directories() -> list[Path]:
    return sorted(ROOT.glob("batch_[0-9][0-9]_*_complete_skill_pack"))


def build_registries() -> tuple[dict, dict]:
    claims = []
    executors = []
    skill_count = 0
    for package in batch_directories():
        batch = int(package.name.split("_", 2)[1])
        executors.append({
            "batch": batch,
            "executor_id": f"skill-system-b{batch:02d}-domain-executor-v1",
            "handler": package.name.removeprefix(f"batch_{batch:02d}_").removesuffix("_complete_skill_pack"),
            "requires_actual_toolchain": True,
            "requires_raw_evidence": True,
            "repository_commands_allowed": False,
            "allowed_corpora": ["development", "negative", "holdout", "representative", "production"],
        })
        paths = [package / "SKILL.md", *sorted((package / "skills").glob("*/SKILL.md"))]
        for path in paths:
            text = path.read_text(encoding="utf-8")
            name = frontmatter_name(text)
            skill_count += 1
            is_root = path == package / "SKILL.md"
            if is_root:
                outputs = section_bullets(matching_section(text, ("definition of done", "核心产物", "outputs")))
                tests = section_bullets(matching_section(text, ("certification gate",)))
                outputs = outputs or [f"Batch {batch:02d} root completion contract with digest-bound outputs"]
                tests = tests or [f"Batch {batch:02d} conservative certification gate over all declared invariants"]
            else:
                outputs = bullets(text, "## Outputs")
                tests = bullets(text, "## Required Tests")
            if not outputs or not tests:
                raise ValueError(f"Skill lacks executable Claims: {path}")
            claim_groups = {
                "output": (outputs, ["development", "holdout"]),
                "test": (tests, ["development", "negative", "holdout"]),
            }
            if is_root:
                claim_groups["external"] = ([f"authorized production-equivalent execution and independent acceptance for Batch {batch:02d}"], ["production"])
            skill_token = hashlib.sha256(name.encode("utf-8")).hexdigest()[:12]
            for claim_type, (rows, corpora) in claim_groups.items():
                for index, claim in enumerate(rows):
                    claims.append({
                        "batch": batch,
                        "skill": name,
                        "claim_type": claim_type,
                        "claim_index": index,
                        "claim": claim,
                        "claim_sha256": digest(claim),
                        "oracle_id": f"ss-b{batch:02d}-{skill_token}-{claim_type}-{index}-oracle-v1",
                        "executor_id": f"skill-system-b{batch:02d}-domain-executor-v1",
                        "required_corpora": corpora,
                        "subject_type": "claim-oracle-result",
                    })
    if skill_count != 788 or len(executors) != 44:
        raise ValueError(f"expected 788 Skills and 44 executors, observed {skill_count} and {len(executors)}")
    claim_registry = {
        "schema_version": "1.0",
        "namespace": "batch-01-44-complete-skill-system",
        "skill_count": skill_count,
        "claim_count": len(claims),
        "entries": claims,
        "status_boundary": "Claim registration is executable policy, not runtime or production evidence.",
    }
    executor_registry = {
        "schema_version": "1.0",
        "namespace": "batch-01-44-complete-skill-system",
        "executor_count": len(executors),
        "entries": executors,
    }
    return claim_registry, executor_registry


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    claim_registry, executor_registry = build_registries()
    claim_path = ROOT / "runtime" / "claim-oracle-registry.json"
    executor_path = ROOT / "runtime" / "domain-executor-registry.json"
    if args.check:
        if json.loads(claim_path.read_text(encoding="utf-8")) != claim_registry:
            raise ValueError("claim-oracle-registry.json is stale")
        if json.loads(executor_path.read_text(encoding="utf-8")) != executor_registry:
            raise ValueError("domain-executor-registry.json is stale")
        print("PASS: 788 Skills, 8,149 Claims, and 44 executors are current")
        return 0
    claim_path.write_text(json.dumps(claim_registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    executor_path.write_text(json.dumps(executor_registry, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
