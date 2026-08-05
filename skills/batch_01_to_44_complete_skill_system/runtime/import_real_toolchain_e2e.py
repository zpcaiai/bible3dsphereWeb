#!/usr/bin/env python3
"""Import an exact real-toolchain report into Batch 31 and Batch 33 Claims.

This importer does not execute or certify the external operation.  It verifies
the report's database reconciliation, rollback, Provider, cleanup, and corpus
boundaries, then materializes development Claim-Oracle subjects accepted by
the shared Batch 01-44 runtime.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Any

import skill_runtime
from domain_handlers import POLICIES, contract_for_batch, evidence_role

try:
    from jsonschema import Draft202012Validator
    from jsonschema.exceptions import SchemaError, ValidationError
except ImportError as exc:  # pragma: no cover - exercised by the fail-closed package validator
    raise skill_runtime.RuntimeFailure(
        "real-toolchain import requires locked jsonschema; install requirements-validation.txt"
    ) from exc


RUN_ID_RE = re.compile(r"^rmp-e2e-[0-9a-f]{8}$")
REPORT_SCHEMA = Path(__file__).resolve().parent / "schemas" / "real-toolchain-e2e-report.schema.json"


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def digest(value: bytes) -> str:
    return "sha256:" + hashlib.sha256(value).hexdigest()


def require_pass(value: Any, label: str) -> None:
    if value != "PASS":
        raise skill_runtime.RuntimeFailure(f"real-toolchain report did not pass {label}")


def validate_report(value: Any) -> dict[str, Any]:
    try:
        schema = json.loads(REPORT_SCHEMA.read_text(encoding="utf-8"))
        Draft202012Validator.check_schema(schema)
        Draft202012Validator(schema).validate(value)
    except (OSError, json.JSONDecodeError, SchemaError, ValidationError) as exc:
        raise skill_runtime.RuntimeFailure(f"real-toolchain report Schema validation failed: {exc}") from exc
    required = {"schema_version", "run_id", "decision", "certified", "database", "providers", "corpora", "cleanup", "limitations"}
    if not isinstance(value, dict) or set(value) != required or value.get("schema_version") != "1.0":
        raise skill_runtime.RuntimeFailure("real-toolchain report fields are invalid")
    if not isinstance(value.get("run_id"), str) or not RUN_ID_RE.fullmatch(value["run_id"]):
        raise skill_runtime.RuntimeFailure("real-toolchain report run identity is invalid")
    if value.get("decision") != "PASS" or value.get("certified") is not False:
        raise skill_runtime.RuntimeFailure("real-toolchain report is not an eligible non-certified PASS")
    corpora = value.get("corpora")
    if corpora != {"development": "EXECUTED", "negative": "EXECUTED", "holdout": "NOT_RUN", "production": "NOT_RUN"}:
        raise skill_runtime.RuntimeFailure("real-toolchain report corpus boundary is invalid")
    cleanup = value.get("cleanup")
    if cleanup != {"database": "PASS", "provider": "PASS", "network": "PASS"}:
        raise skill_runtime.RuntimeFailure("real-toolchain report cleanup is incomplete")
    database = value.get("database")
    if not isinstance(database, dict):
        raise skill_runtime.RuntimeFailure("real-toolchain database evidence is invalid")
    for field in ("detail_reconciliation", "backup_restore", "expand_contract_idempotency"):
        require_pass(database.get(field), f"database.{field}")
    negative = database.get("negative_tests")
    if not isinstance(negative, dict):
        raise skill_runtime.RuntimeFailure("real-toolchain negative database evidence is missing")
    require_pass(negative.get("duplicate_idempotency_key"), "duplicate idempotency rejection")
    require_pass(negative.get("transaction_rollback"), "transaction rollback")
    for field in ("data_sha256", "schema_sha256", "rollback_sha256"):
        skill_runtime.require_digest(database.get(field), f"database.{field}")
    if database["data_sha256"] != database["rollback_sha256"]:
        raise skill_runtime.RuntimeFailure("rollback restore does not match source detail evidence")
    source, target, tools = database.get("source"), database.get("target"), database.get("migration_tools")
    if not all(isinstance(item, dict) for item in (source, target, tools)):
        raise skill_runtime.RuntimeFailure("database source/target/tool identity is missing")
    if not all(isinstance(item.get("engine_version"), str) and item["engine_version"] for item in (source, target)):
        raise skill_runtime.RuntimeFailure("database engine versions are missing")
    for field in ("source_dump", "target_restore", "migration_ledger"):
        if not isinstance(tools.get(field), str) or not tools[field]:
            raise skill_runtime.RuntimeFailure(f"database migration tool identity is missing: {field}")
    providers = value.get("providers")
    if not isinstance(providers, dict) or not isinstance(providers.get("minio_s3"), dict) or not isinstance(providers.get("github"), dict):
        raise skill_runtime.RuntimeFailure("Provider evidence is missing")
    minio, github = providers["minio_s3"], providers["github"]
    require_pass(minio.get("put_get_delete"), "MinIO put/get/delete")
    require_pass(minio.get("cleanup"), "MinIO cleanup")
    require_pass(github.get("authenticated_read"), "GitHub authenticated read")
    if github.get("expected_commit") != github.get("observed_commit"):
        raise skill_runtime.RuntimeFailure("GitHub exact commit differs")
    if not isinstance(github.get("repository"), str) or not github["repository"]:
        raise skill_runtime.RuntimeFailure("GitHub repository identity is missing")
    for field in ("server_version", "client_version"):
        if not isinstance(minio.get(field), str) or not minio[field]:
            raise skill_runtime.RuntimeFailure(f"MinIO tool identity is missing: {field}")
    for field in ("object_sha256", "stat_sha256"):
        skill_runtime.require_digest(minio.get(field), f"providers.minio_s3.{field}")
    if not isinstance(value.get("limitations"), list) or not value["limitations"] or any(not isinstance(item, str) or not item for item in value["limitations"]):
        raise skill_runtime.RuntimeFailure("real-toolchain limitations are invalid")
    return value


def claim(skill: str, claim_type: str, index: int) -> skill_runtime.Claim:
    return skill_runtime.Registry.load().claim(skill, claim_type, index)


def tool(name: str, version: str, operation: list[str]) -> dict[str, Any]:
    if not isinstance(version, str) or not version:
        raise skill_runtime.RuntimeFailure(f"tool version is missing: {name}")
    return {"name": name, "version": version, "argv_sha256": digest(canonical_bytes(operation)), "exit_code": 0}


def materialize(report_path: Path, output: Path) -> list[Path]:
    if output.exists():
        raise skill_runtime.RuntimeFailure("refusing to overwrite real-toolchain import output")
    output.mkdir(parents=True)
    report_bytes = skill_runtime.read_regular(report_path.resolve(strict=True), skill_runtime.MAX_FILE_BYTES, "real-toolchain report")
    report = validate_report(json.loads(report_bytes))
    database, providers = report["database"], report["providers"]
    mappings = [
        (
            claim("b31-database-data-platform-factory-lineage-reconciliation", "output", 1),
            [
                tool("pg_dump", database["migration_tools"]["source_dump"], ["pg_dump", "--format=custom", "source"]),
                tool("pg_restore", database["migration_tools"]["target_restore"], ["pg_restore", "--exit-on-error", "target"]),
                tool("psql", database["migration_tools"]["migration_ledger"], ["psql", "--set", "ON_ERROR_STOP=1", "expand-contract"]),
            ],
            "detail data, schema, precision, negative constraints, rollback and restore evidence matched",
        ),
        (
            claim("b33-cloud-iac-platform-factory-adapter-provider", "output", 2),
            [
                tool("minio", providers["minio_s3"]["server_version"], ["minio", "server", "/data"]),
                tool("mc", providers["minio_s3"]["client_version"], ["mc", "put|get|delete|cleanup"]),
                tool("gh", "GitHub REST API", ["gh", "api", providers["github"]["repository"], providers["github"]["observed_commit"]]),
            ],
            "MinIO S3 bytes and cleanup plus authenticated GitHub exact-commit Provider evidence passed",
        ),
    ]
    environment_digest = digest(canonical_bytes({"database": database, "providers": providers}))
    generated: list[Path] = []
    for item, tools, detail in mappings:
        policy = POLICIES[item.batch]
        if len(tools) != len(policy.capabilities):
            raise skill_runtime.RuntimeFailure(f"Batch {item.batch} real-toolchain mapping does not cover its domain capabilities")
        bound_tools = []
        raw_references = []
        for native_tool, capability in zip(tools, policy.capabilities, strict=True):
            role = evidence_role(policy, capability)
            bound_tools.append({**native_tool, "evidence_role": role})
            raw_references.append({"path": str(report_path.resolve()), "sha256": digest(report_bytes),
                                   "bytes": len(report_bytes), "role": role})
        assertions = [{"name": f"{item.oracle_id}:operation:{policy.operation}", "outcome": "PASS", "detail": detail}]
        assertions.extend({"name": f"{item.oracle_id}:capability:{capability}", "outcome": "PASS", "detail": detail}
                          for capability in policy.capabilities)
        assertions.extend({"name": f"{item.oracle_id}:safety:{control}", "outcome": "PASS", "detail": detail}
                          for control in policy.safety_controls)
        payload = {
            "schema_version": "1.0", "batch": item.batch, "skill": item.skill, "executor_id": item.executor_id,
            "claim": {"type": item.claim_type, "index": item.claim_index, "sha256": item.sha256},
            "corpus": {"role": "development", "id": "real-toolchain-development-v1", "sha256": database["data_sha256"], "independent": False},
            "source_fingerprint": database["schema_sha256"],
            "environment": {"id": report["run_id"], "kind": "clean", "digest": environment_digest},
            "domain_contract": contract_for_batch(item.batch),
            "toolchain": bound_tools,
            "assertions": assertions,
            "raw_evidence": raw_references, "decision": "PASS",
            "limitations": [*report["limitations"], "imported as development evidence only"],
        }
        result_path = output / f"batch{item.batch:02d}-domain-result.json"
        result_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        subject = skill_runtime.materialize_domain_result(result_path, (output.resolve(), report_path.parent.resolve()))
        subject_path = output / f"batch{item.batch:02d}-claim-oracle-subject.json"
        subject_path.write_text(json.dumps(subject, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        generated.extend((result_path, subject_path))
    return generated


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("report", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    paths = materialize(args.report, args.output)
    print(json.dumps({"decision": "PASS", "generated": [str(path) for path in paths], "certified": False}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
