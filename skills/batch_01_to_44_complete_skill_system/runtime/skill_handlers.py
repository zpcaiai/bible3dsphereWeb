#!/usr/bin/env python3
"""Digest-bound callable handlers for every one of the 788 Skills.

The registry is generated from each Skill's own source contract.  A native
executor result is accepted only when its per-Skill contract, evidence role,
Claim Oracle assertions, and effect policy all match that immutable registry.
Repository content cannot select or define executable commands here.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Callable


ROOT = Path(__file__).resolve().parent
REGISTRY_PATH = ROOT / "skill-executor-registry.json"
DIGEST_PREFIX = "sha256:"


class SkillHandlerError(ValueError):
    pass


def canonical_digest(value: Any) -> str:
    data = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return DIGEST_PREFIX + hashlib.sha256(data).hexdigest()


def require_digest(value: Any, label: str) -> str:
    if not isinstance(value, str) or len(value) != 71 or not value.startswith(DIGEST_PREFIX):
        raise SkillHandlerError(f"{label} must be sha256:<64 lowercase hex>")
    try:
        int(value[7:], 16)
    except ValueError as exc:
        raise SkillHandlerError(f"{label} must be sha256:<64 lowercase hex>") from exc
    if value != value.lower():
        raise SkillHandlerError(f"{label} must be lowercase")
    return value


@dataclass(frozen=True)
class SkillPolicy:
    batch: int
    skill: str
    handler_id: str
    contract: dict[str, Any]

    @property
    def evidence_role(self) -> str:
        return str(self.contract["required_evidence_role"])


@lru_cache(maxsize=1)
def policies() -> dict[str, SkillPolicy]:
    try:
        payload = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SkillHandlerError(f"cannot load per-Skill executor registry: {exc}") from exc
    entries = payload.get("entries") if isinstance(payload, dict) else None
    if (payload.get("schema_version") != "1.0" or
            payload.get("namespace") != "batch-01-44-complete-skill-system" or
            payload.get("skill_executor_count") != 788 or not isinstance(entries, list) or len(entries) != 788):
        raise SkillHandlerError("per-Skill executor registry identity/count is invalid")
    result: dict[str, SkillPolicy] = {}
    handler_ids: set[str] = set()
    contract_fields = {
        "contract_version", "handler_id", "operation", "source_path", "source_sha256", "objective_sha256",
        "input_sha256", "output_sha256", "workflow_sha256", "test_sha256", "stop_sha256", "risk",
        "effect_class", "required_evidence_role",
    }
    for entry in entries:
        if not isinstance(entry, dict):
            raise SkillHandlerError("per-Skill executor entry is not an object")
        batch, skill, handler_id, contract = entry.get("batch"), entry.get("skill"), entry.get("handler_id"), entry.get("contract")
        if (not isinstance(batch, int) or not 1 <= batch <= 44 or not isinstance(skill, str) or not skill or skill in result or
                not isinstance(handler_id, str) or not handler_id or handler_id in handler_ids or not isinstance(contract, dict) or
                set(contract) != contract_fields or contract.get("handler_id") != handler_id or contract.get("operation") != skill or
                contract.get("contract_version") != "1.0"):
            raise SkillHandlerError("per-Skill executor identity or contract is invalid")
        if entry.get("repository_commands_allowed") is not False or entry.get("requires_actual_toolchain") is not True or entry.get("requires_raw_evidence") is not True:
            raise SkillHandlerError("per-Skill executor safety policy was weakened")
        for field in ("source_sha256", "objective_sha256"):
            require_digest(contract.get(field), f"{skill}.{field}")
        for field in ("input_sha256", "output_sha256", "workflow_sha256", "test_sha256", "stop_sha256"):
            values = contract.get(field)
            if not isinstance(values, list) or not values:
                raise SkillHandlerError(f"{skill}.{field} must be non-empty")
            for index, value in enumerate(values):
                require_digest(value, f"{skill}.{field}[{index}]")
        if contract.get("effect_class") not in {"read-only", "reversible", "approval-required"}:
            raise SkillHandlerError(f"{skill}.effect_class is invalid")
        expected_role = f"skill:{handler_id}:execution"
        if contract.get("required_evidence_role") != expected_role:
            raise SkillHandlerError(f"{skill} evidence role is not handler-bound")
        handler_ids.add(handler_id)
        result[skill] = SkillPolicy(batch, skill, handler_id, contract)
    if len(result) != 788 or len(handler_ids) != 788:
        raise SkillHandlerError("per-Skill handler coverage is incomplete")
    return result


def contract_for_skill(skill: str) -> dict[str, Any]:
    try:
        return dict(policies()[skill].contract)
    except KeyError as exc:
        raise SkillHandlerError(f"Skill has no callable handler: {skill}") from exc


def evidence_role(skill: str) -> str:
    try:
        return policies()[skill].evidence_role
    except KeyError as exc:
        raise SkillHandlerError(f"Skill has no evidence role: {skill}") from exc


def _validate(policy: SkillPolicy, contract: Any, oracle_id: str, claim_type: str, claim_index: int,
              tools: list[dict[str, Any]], assertions: list[dict[str, Any]], raw_roles: set[str],
              decision: str) -> list[dict[str, str]]:
    if contract != policy.contract:
        raise SkillHandlerError(f"Skill contract does not match handler {policy.handler_id}")
    successful_roles = {tool.get("evidence_role") for tool in tools if tool.get("exit_code") == 0}
    if policy.evidence_role not in successful_roles or policy.evidence_role not in raw_roles:
        raise SkillHandlerError(f"Skill {policy.skill} lacks matching native-tool and raw evidence")
    by_name: dict[str, dict[str, Any]] = {}
    for assertion in assertions:
        name = assertion.get("name")
        if not isinstance(name, str) or name in by_name:
            raise SkillHandlerError(f"Skill {policy.skill} assertions are duplicated or invalid")
        by_name[name] = assertion
    expected = {
        f"{oracle_id}:skill-handler:{policy.handler_id}": policy.handler_id,
        f"{oracle_id}:skill-source:{policy.contract['source_sha256']}": policy.contract["source_path"],
        f"{oracle_id}:skill-operation:{policy.skill}": policy.contract["effect_class"],
        f"{oracle_id}:skill-claim:{claim_type}:{claim_index}": canonical_digest({"type": claim_type, "index": claim_index}),
        f"{oracle_id}:skill-effect:{policy.contract['effect_class']}": policy.evidence_role,
    }
    missing = sorted(set(expected) - set(by_name))
    if missing:
        raise SkillHandlerError(f"Skill {policy.skill} lacks Claim-bound assertions: {missing}")
    if decision == "PASS" and any(by_name[name].get("outcome") != "PASS" for name in expected):
        raise SkillHandlerError(f"Skill {policy.skill} PASS contradicts its handler assertions")
    checks = [{"name": f"skill-handler:{policy.handler_id}", "outcome": "PASS",
               "detail": f"contract={canonical_digest(policy.contract)}"}]
    checks.extend({"name": name.removeprefix(oracle_id + ":"), "outcome": by_name[name]["outcome"],
                   "detail": str(expected[name])} for name in expected)
    return checks


def _make_handler(policy: SkillPolicy) -> Callable[..., list[dict[str, str]]]:
    def handler(contract: Any, oracle_id: str, claim_type: str, claim_index: int,
                tools: list[dict[str, Any]], assertions: list[dict[str, Any]], raw_roles: set[str],
                decision: str) -> list[dict[str, str]]:
        return _validate(policy, contract, oracle_id, claim_type, claim_index, tools, assertions, raw_roles, decision)
    handler.__name__ = "skill_" + policy.handler_id.replace("-", "_")
    handler.__qualname__ = handler.__name__
    return handler


@lru_cache(maxsize=1)
def handlers() -> dict[str, Callable[..., list[dict[str, str]]]]:
    return {skill: _make_handler(policy) for skill, policy in policies().items()}


def execute_skill_handler(skill: str, batch: int, contract: Any, oracle_id: str, claim_type: str,
                          claim_index: int, tools: list[dict[str, Any]], assertions: list[dict[str, Any]],
                          raw_roles: set[str], decision: str) -> list[dict[str, str]]:
    policy = policies().get(skill)
    handler = handlers().get(skill)
    if policy is None or handler is None or policy.batch != batch:
        raise SkillHandlerError(f"Skill {skill} has no callable Batch {batch} handler")
    return handler(contract, oracle_id, claim_type, claim_index, tools, assertions, raw_roles, decision)
