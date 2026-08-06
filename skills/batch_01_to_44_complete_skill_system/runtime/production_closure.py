#!/usr/bin/env python3
"""Production-closure control plane for the 788-Skill runtime.

It binds customer snapshots, sealed Holdout, cutover receipts, soak telemetry,
and independent assessments without storing customer payloads or enabling local
certification. Provider side effects remain in provider_runtime.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sqlite3
import stat
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import skill_runtime


MAX_BYTES = 1024 * 1024 * 1024
PRODUCTION_SOAK_SECONDS = 7 * 24 * 60 * 60
PRODUCTION_MAX_GAP_SECONDS = 6 * 60 * 60
PRODUCTION_OBSERVATION_SKEW_SECONDS = 15 * 60
MAX_CLOCK_SKEW_SECONDS = 5 * 60
MAX_SOAK_OBSERVATIONS = 100_000
TRANSITIONS = {
    "PLANNED": {"PRECHECKED", "CANCELLED"}, "PRECHECKED": {"APPROVED", "CANCELLED"},
    "APPROVED": {"EXECUTING", "CANCELLED"}, "EXECUTING": {"VERIFYING", "ROLLING_BACK", "UNKNOWN"},
    "VERIFYING": {"SUCCEEDED", "ROLLING_BACK", "UNKNOWN"}, "UNKNOWN": {"VERIFYING", "ROLLING_BACK"},
    "ROLLING_BACK": {"ROLLED_BACK", "UNKNOWN"},
}
ROLES = {"PRECHECKED": "operations-owner", "APPROVED": "production-approver",
         "EXECUTING": "operations-owner", "VERIFYING": "production-verifier",
         "SUCCEEDED": "production-verifier", "ROLLING_BACK": "operations-owner",
         "ROLLED_BACK": "production-verifier", "UNKNOWN": "operations-owner",
         "CANCELLED": "production-approver"}


class ClosureFailure(ValueError):
    pass


def canonical_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode()


def digest_bytes(value: bytes) -> str:
    return "sha256:" + hashlib.sha256(value).hexdigest()


def digest(value: Any) -> str:
    return digest_bytes(canonical_bytes(value))


def now_text() -> str:
    return utc_now().isoformat().replace("+00:00", "Z")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def ident(value: Any, name: str) -> str:
    if not isinstance(value, str) or not value or len(value) > 256 or any(character.isspace() for character in value):
        raise ClosureFailure(f"{name} is invalid")
    return value


def parse_time(value: Any, name: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00")) if isinstance(value, str) else None
    except ValueError as exc:
        raise ClosureFailure(f"{name} must be ISO-8601") from exc
    if parsed is None or parsed.tzinfo is None:
        raise ClosureFailure(f"{name} must include timezone")
    return parsed.astimezone(timezone.utc)


def confined(path: Path, roots: tuple[Path, ...]) -> Path:
    resolved = path.expanduser().resolve(strict=True)
    if not any(resolved == root or root in resolved.parents for root in roots):
        raise ClosureFailure("artifact escapes approved roots")
    return resolved


def read_file(path: Path, roots: tuple[Path, ...], maximum: int = MAX_BYTES) -> bytes:
    resolved = confined(path, roots)
    descriptor = os.open(resolved, os.O_RDONLY | getattr(os, "O_CLOEXEC", 0) | getattr(os, "O_NOFOLLOW", 0))
    try:
        observed = os.fstat(descriptor)
        if not stat.S_ISREG(observed.st_mode) or observed.st_size > maximum:
            raise ClosureFailure("artifact must be a bounded regular file")
        result = bytearray()
        while len(result) < observed.st_size:
            chunk = os.read(descriptor, min(65536, observed.st_size - len(result)))
            if not chunk:
                raise ClosureFailure("artifact changed while being read")
            result.extend(chunk)
        if os.read(descriptor, 1):
            raise ClosureFailure("artifact changed while being read")
        return bytes(result)
    finally:
        os.close(descriptor)


def reference(value: Any, roots: tuple[Path, ...]) -> dict[str, Any]:
    if not isinstance(value, dict) or set(value) != {"path", "sha256", "bytes"}:
        raise ClosureFailure("artifact reference fields are invalid")
    data = read_file(Path(value["path"]), roots)
    skill_runtime.require_digest(value.get("sha256"), "artifact.sha256")
    if digest_bytes(data) != value["sha256"] or value.get("bytes") != len(data):
        raise ClosureFailure("artifact byte/digest mismatch")
    return {"sha256": value["sha256"], "bytes": len(data)}


def manifest(path: Path, roots: tuple[Path, ...]) -> tuple[dict[str, Any], str]:
    try:
        value = json.loads(read_file(path, roots, 16 * 1024 * 1024))
    except json.JSONDecodeError as exc:
        raise ClosureFailure("manifest is invalid JSON") from exc
    if not isinstance(value, dict):
        raise ClosureFailure("manifest must be an object")
    return value, digest(value)


def provider_profile(value: Any) -> dict[str, str]:
    fields = {"provider_id", "account_binding_sha256", "region", "adapter_id",
              "precheck_operation", "execute_operation", "verify_operation", "rollback_operation"}
    if not isinstance(value, dict) or set(value) != fields:
        raise ClosureFailure("cutover provider profile fields are invalid")
    result = {field: ident(value.get(field), f"provider.{field}") for field in fields if field != "account_binding_sha256"}
    result["account_binding_sha256"] = skill_runtime.require_digest(
        value.get("account_binding_sha256"), "provider.account_binding_sha256")
    return result


def provider_transition_receipt(value: Any, roots: tuple[Path, ...], cutover: dict[str, Any],
                                target_state: str) -> dict[str, Any]:
    outer = reference(value, roots)
    try:
        payload = json.loads(read_file(Path(value["path"]), roots, 16 * 1024 * 1024))
    except json.JSONDecodeError as exc:
        raise ClosureFailure("provider transition receipt is invalid JSON") from exc
    required = {"schema_version", "receipt_id", "cutover_id", "tenant_id", "target_key",
                "target_state", "provider", "operation", "adapter_receipt", "effect_state",
                "request_sha256", "issued_at"}
    if not isinstance(payload, dict) or set(payload) != required or payload.get("schema_version") != "1.0":
        raise ClosureFailure("provider transition receipt fields are invalid")
    if (ident(payload.get("receipt_id"), "receipt_id") == cutover.get("cutover_id") or
            payload.get("cutover_id") != cutover.get("cutover_id") or
            payload.get("tenant_id") != cutover.get("tenant_id") or
            payload.get("target_key") != cutover.get("target_key") or payload.get("target_state") != target_state):
        raise ClosureFailure("provider transition receipt binding is invalid")
    profile = provider_profile(payload.get("provider"))
    if profile != cutover.get("provider"):
        raise ClosureFailure("provider transition receipt tuple differs from the approved plan")
    operation_by_state = {"PRECHECKED": "precheck_operation", "EXECUTING": "execute_operation",
                          "VERIFYING": "verify_operation", "SUCCEEDED": "verify_operation",
                          "ROLLING_BACK": "rollback_operation", "ROLLED_BACK": "rollback_operation"}
    operation_field = operation_by_state.get(target_state)
    if operation_field and profile[operation_field] != payload.get("operation"):
        raise ClosureFailure("provider operation differs from the approved plan")
    if target_state == "UNKNOWN" and payload.get("operation") not in {
            profile["execute_operation"], profile["verify_operation"], profile["rollback_operation"]}:
        raise ClosureFailure("unknown provider outcome is not bound to an approved mutating operation")
    expected_effect = "UNKNOWN" if target_state == "UNKNOWN" else "SUCCEEDED"
    if payload.get("effect_state") != expected_effect:
        raise ClosureFailure(f"provider receipt effect_state must be {expected_effect}")
    request_sha = skill_runtime.require_digest(payload.get("request_sha256"), "provider receipt request_sha256")
    issued = parse_time(payload.get("issued_at"), "provider receipt issued_at")
    if issued > utc_now() + timedelta(seconds=MAX_CLOCK_SKEW_SECONDS):
        raise ClosureFailure("provider receipt is future-dated")
    native = reference(payload.get("adapter_receipt"), roots)
    return {**outer, "receipt_id": payload["receipt_id"], "provider": profile,
            "operation": payload.get("operation"), "effect_state": expected_effect,
            "request_sha256": request_sha, "adapter_receipt": native, "issued_at": payload["issued_at"]}


class Store:
    def __init__(self, workspace: Path):
        self.path = workspace.expanduser().resolve() / "production-closure.sqlite3"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        connection = self.connect()
        try:
            connection.executescript("""
                CREATE TABLE IF NOT EXISTS records(
                    kind TEXT NOT NULL, record_id TEXT NOT NULL, tenant_id TEXT NOT NULL,
                    environment_class TEXT, state TEXT NOT NULL, version INTEGER NOT NULL,
                    record_json TEXT NOT NULL, PRIMARY KEY(kind,record_id));
                CREATE TABLE IF NOT EXISTS events(
                    sequence INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, record_id TEXT NOT NULL,
                    event_type TEXT NOT NULL, record_sha256 TEXT NOT NULL, previous_hash TEXT NOT NULL,
                    event_hash TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL);
            """)
            connection.execute("PRAGMA user_version=1")
        finally:
            connection.close()

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=30, isolation_level=None)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute("PRAGMA synchronous=FULL")
        connection.execute("PRAGMA busy_timeout=30000")
        return connection

    @staticmethod
    def event(connection: sqlite3.Connection, kind: str, record_id: str, event_type: str, encoded: str) -> None:
        row = connection.execute("SELECT event_hash FROM events ORDER BY sequence DESC LIMIT 1").fetchone()
        previous, created = (row[0] if row else "GENESIS"), now_text()
        record_sha = digest_bytes(encoded.encode())
        event_hash = digest({"kind": kind, "record_id": record_id, "event_type": event_type,
                             "record_sha256": record_sha, "previous_hash": previous, "created_at": created})
        connection.execute("INSERT INTO events(kind,record_id,event_type,record_sha256,previous_hash,event_hash,created_at) VALUES(?,?,?,?,?,?,?)",
                           (kind, record_id, event_type, record_sha, previous, event_hash, created))

    def create(self, kind: str, record_id: str, tenant_id: str, environment: str | None,
               state: str, record: dict[str, Any], event: str) -> dict[str, Any]:
        encoded = canonical_bytes(record).decode()
        connection = self.connect()
        try:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute("SELECT record_json FROM records WHERE kind=? AND record_id=?", (kind, record_id)).fetchone()
            if row:
                existing = json.loads(row[0])
                if existing != record:
                    raise ClosureFailure(f"{kind} id already binds another record")
                connection.commit()
                return existing
            connection.execute("INSERT INTO records VALUES(?,?,?,?,?,?,?)",
                               (kind, record_id, tenant_id, environment, state, 0, encoded))
            self.event(connection, kind, record_id, event, encoded)
            connection.commit()
            return record
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def get(self, kind: str, record_id: str) -> dict[str, Any]:
        connection = self.connect()
        try:
            row = connection.execute("SELECT record_json FROM records WHERE kind=? AND record_id=?", (kind, record_id)).fetchone()
        finally:
            connection.close()
        if row is None:
            raise ClosureFailure(f"{kind} does not exist")
        return json.loads(row[0])

    def update(self, kind: str, record_id: str, expected_state: str, expected_version: int,
               state: str, record: dict[str, Any], event: str) -> dict[str, Any]:
        encoded = canonical_bytes(record).decode()
        connection = self.connect()
        try:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute("SELECT state,version FROM records WHERE kind=? AND record_id=?", (kind, record_id)).fetchone()
            if row is None or row["state"] != expected_state or int(row["version"]) != expected_version:
                raise ClosureFailure(f"{kind} state/version conflict")
            connection.execute("UPDATE records SET state=?,version=?,record_json=? WHERE kind=? AND record_id=?",
                               (state, expected_version + 1, encoded, kind, record_id))
            self.event(connection, kind, record_id, event, encoded)
            connection.commit()
            return record
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def chain_findings(self) -> list[str]:
        connection = self.connect()
        try:
            rows = connection.execute("SELECT * FROM events ORDER BY sequence").fetchall()
        finally:
            connection.close()
        findings, previous = [], "GENESIS"
        for row in rows:
            expected = digest({"kind": row["kind"], "record_id": row["record_id"], "event_type": row["event_type"],
                               "record_sha256": row["record_sha256"], "previous_hash": previous,
                               "created_at": row["created_at"]})
            if row["previous_hash"] != previous or row["event_hash"] != expected:
                findings.append(f"event {row['sequence']} hash-chain mismatch")
            previous = row["event_hash"]
        return findings


def register_snapshot(workspace: Path, path: Path, authorization: dict[str, Any], trust_path: Path,
                      roots: tuple[Path, ...]) -> dict[str, Any]:
    value, manifest_sha = manifest(path, roots)
    required = {"schema_version", "snapshot_id", "tenant_id", "environment_class", "classification", "purpose", "read_only", "files"}
    if set(value) != required or value.get("schema_version") != "1.0" or value.get("read_only") is not True:
        raise ClosureFailure("snapshot manifest is invalid or not read-only")
    snapshot_id, tenant_id = ident(value.get("snapshot_id"), "snapshot_id"), ident(value.get("tenant_id"), "tenant_id")
    environment = value.get("environment_class")
    if (environment not in {"test", "sandbox", "production"} or
            not isinstance(value.get("classification"), str) or not value["classification"] or
            not isinstance(value.get("purpose"), str) or not value["purpose"] or
            not isinstance(value.get("files"), list) or not value["files"] or len(value["files"]) > 100_000):
        raise ClosureFailure("snapshot environment/files are invalid")
    refs = [reference(item, roots) for item in value["files"]]
    if len({item["sha256"] for item in refs}) != len(refs):
        raise ClosureFailure("snapshot contains duplicate content")
    actor = skill_runtime.TrustStore.load(trust_path).verify(authorization, "data-owner",
        {"snapshot_id": snapshot_id, "tenant_id": tenant_id, "manifest_sha256": manifest_sha,
         "environment_class": environment, "purpose": value["purpose"]})
    record = {"schema_version": "1.0", "snapshot_id": snapshot_id, "tenant_id": tenant_id,
              "environment_class": environment, "classification": value["classification"], "purpose": value["purpose"],
              "manifest_sha256": manifest_sha, "content_root": digest(sorted(item["sha256"] for item in refs)),
              "file_count": len(refs), "total_bytes": sum(item["bytes"] for item in refs), "read_only": True,
              "data_minimization": "metadata-and-content-digests-only", "authorization": actor}
    return Store(workspace).create("snapshot", snapshot_id, tenant_id, environment, "REGISTERED", record, "SNAPSHOT_REGISTERED")


def register_holdout(workspace: Path, path: Path, authorization: dict[str, Any], trust_path: Path,
                     roots: tuple[Path, ...]) -> dict[str, Any]:
    value, manifest_sha = manifest(path, roots)
    required = {"schema_version", "holdout_id", "tenant_id", "environment_class", "corpus",
                "development_corpus_sha256", "transformation_author_ids", "executor_ids", "verifier_ids"}
    if set(value) != required or value.get("schema_version") != "1.0":
        raise ClosureFailure("Holdout manifest fields are invalid")
    holdout_id, tenant_id = ident(value.get("holdout_id"), "holdout_id"), ident(value.get("tenant_id"), "tenant_id")
    environment = value.get("environment_class")
    if environment not in {"test", "sandbox", "production"}:
        raise ClosureFailure("Holdout environment is invalid")
    corpus = reference(value["corpus"], roots)
    if corpus["sha256"] == skill_runtime.require_digest(value.get("development_corpus_sha256"), "development corpus"):
        raise ClosureFailure("Holdout corpus reuses development content")
    sets = []
    for field in ("transformation_author_ids", "executor_ids", "verifier_ids"):
        items = value.get(field)
        if (not isinstance(items, list) or not items or len(items) != len(set(items)) or
                any(not isinstance(item, str) or not item for item in items)):
            raise ClosureFailure(f"{field} is invalid")
        sets.append(set(items))
    if sets[0] & (sets[1] | sets[2]) or sets[1] & sets[2]:
        raise ClosureFailure("Holdout authors/executors/verifiers overlap")
    payload = authorization.get("payload") if isinstance(authorization, dict) else None
    custodian = payload.get("actor_id") if isinstance(payload, dict) else None
    if custodian in set().union(*sets):
        raise ClosureFailure("Holdout custodian conflicts with evaluation actors")
    actor = skill_runtime.TrustStore.load(trust_path).verify(authorization, "holdout-custodian",
        {"holdout_id": holdout_id, "tenant_id": tenant_id, "manifest_sha256": manifest_sha,
         "corpus_sha256": corpus["sha256"], "environment_class": environment})
    record = {"schema_version": "1.0", "holdout_id": holdout_id, "tenant_id": tenant_id,
              "environment_class": environment, "manifest_sha256": manifest_sha, "corpus": corpus, "sealed": True,
              "custodian": actor, "transformation_author_ids": value["transformation_author_ids"],
              "executor_ids": value["executor_ids"], "verifier_ids": value["verifier_ids"]}
    return Store(workspace).create("holdout", holdout_id, tenant_id, environment, "SEALED", record, "HOLDOUT_SEALED")


def record_holdout_result(workspace: Path, path: Path, executor_attestation: dict[str, Any],
                          verifier_attestation: dict[str, Any], trust_path: Path,
                          roots: tuple[Path, ...]) -> dict[str, Any]:
    value, manifest_sha = manifest(path, roots)
    required = {"schema_version", "result_id", "holdout_id", "tenant_id", "target_release_sha256",
                "provider_account_sha256", "execution_receipt", "decision", "claim_results",
                "started_at", "finished_at"}
    if not isinstance(value, dict) or set(value) != required or value.get("schema_version") != "1.0":
        raise ClosureFailure("holdout result fields are invalid")
    result_id, holdout_id = ident(value.get("result_id"), "result_id"), ident(value.get("holdout_id"), "holdout_id")
    tenant_id = ident(value.get("tenant_id"), "tenant_id")
    holdout = Store(workspace).get("holdout", holdout_id)
    if holdout["tenant_id"] != tenant_id:
        raise ClosureFailure("holdout result crosses tenant boundary")
    target_release = skill_runtime.require_digest(value.get("target_release_sha256"), "target_release_sha256")
    provider_account = skill_runtime.require_digest(value.get("provider_account_sha256"), "provider_account_sha256")
    execution_receipt = reference(value.get("execution_receipt"), roots)
    started, finished = parse_time(value.get("started_at"), "started_at"), parse_time(value.get("finished_at"), "finished_at")
    if finished <= started or finished > utc_now() + timedelta(seconds=MAX_CLOCK_SKEW_SECONDS):
        raise ClosureFailure("holdout execution time window is invalid")
    claim_results = value.get("claim_results")
    if not isinstance(claim_results, list) or not claim_results or len(claim_results) > 100_000:
        raise ClosureFailure("holdout claim results are invalid")
    normalized, claim_ids, outcomes = [], set(), []
    for item in claim_results:
        if not isinstance(item, dict) or set(item) != {"claim_id", "outcome", "evidence"}:
            raise ClosureFailure("holdout claim result fields are invalid")
        claim_id = ident(item.get("claim_id"), "claim_id")
        if claim_id in claim_ids or item.get("outcome") not in {"PASS", "FAIL", "INCONCLUSIVE"}:
            raise ClosureFailure("holdout claim identity/outcome is invalid")
        evidence = reference(item.get("evidence"), roots)
        claim_ids.add(claim_id)
        outcomes.append(item["outcome"])
        normalized.append({"claim_id": claim_id, "outcome": item["outcome"], "evidence": evidence})
    derived = "FAIL" if "FAIL" in outcomes else ("INCONCLUSIVE" if "INCONCLUSIVE" in outcomes else "PASS")
    if value.get("decision") != derived:
        raise ClosureFailure("holdout decision differs from claim outcomes")
    evidence_root = digest({"holdout_corpus_sha256": holdout["corpus"]["sha256"],
        "execution_receipt_sha256": execution_receipt["sha256"], "claim_results": normalized})
    bindings = {"result_id": result_id, "holdout_id": holdout_id, "tenant_id": tenant_id,
        "manifest_sha256": manifest_sha, "evidence_root": evidence_root,
        "target_release_sha256": target_release, "provider_account_sha256": provider_account,
        "decision": derived}
    trust = skill_runtime.TrustStore.load(trust_path)
    executor = trust.verify(executor_attestation, "holdout-executor", bindings)
    verifier = trust.verify(verifier_attestation, "holdout-verifier", {**bindings, "executor_id": executor["actor_id"]})
    if (executor["actor_id"] not in holdout["executor_ids"] or verifier["actor_id"] not in holdout["verifier_ids"] or
            executor["actor_id"] == verifier["actor_id"] or
            {executor["actor_id"], verifier["actor_id"]} &
            ({holdout["custodian"]["actor_id"]} | set(holdout["transformation_author_ids"]))):
        raise ClosureFailure("holdout execution actors violate the sealed custody roles")
    record = {**value, "corpus_sha256": holdout["corpus"]["sha256"], "manifest_sha256": manifest_sha,
        "execution_receipt": execution_receipt, "claim_results": normalized, "evidence_root": evidence_root,
        "executor": executor, "verifier": verifier, "independent": True, "sealed_holdout_consumed": True}
    return Store(workspace).create("holdout-result", result_id, tenant_id, holdout["environment_class"],
                                   derived, record, "HOLDOUT_RESULT_RECORDED")


def plan_cutover(workspace: Path, path: Path, approval: dict[str, Any], trust_path: Path,
                 roots: tuple[Path, ...]) -> dict[str, Any]:
    value, plan_sha = manifest(path, roots)
    base = {"schema_version", "cutover_id", "tenant_id", "snapshot_id", "target_key", "target_release_sha256",
            "rollback_adapter_id", "rollback_operation", "preconditions"}
    schema_version = value.get("schema_version")
    required = base | ({"provider", "holdout_result_id"} if schema_version == "2.0" else set())
    if (set(value) != required or schema_version not in {"1.0", "2.0"} or
            not isinstance(value.get("preconditions"), list) or not value["preconditions"] or
            len(value["preconditions"]) != len(set(value["preconditions"])) or
            any(not isinstance(item, str) or not item for item in value["preconditions"])):
        raise ClosureFailure("cutover plan is invalid")
    cutover_id, tenant_id = ident(value["cutover_id"], "cutover_id"), ident(value["tenant_id"], "tenant_id")
    ident(value["target_key"], "target_key")
    ident(value["rollback_adapter_id"], "rollback_adapter_id")
    ident(value["rollback_operation"], "rollback_operation")
    snapshot = Store(workspace).get("snapshot", value["snapshot_id"])
    if snapshot["tenant_id"] != tenant_id:
        raise ClosureFailure("cutover snapshot crosses tenant boundary")
    skill_runtime.require_digest(value["target_release_sha256"], "target_release_sha256")
    provider = provider_profile(value.get("provider")) if schema_version == "2.0" else None
    if snapshot["environment_class"] == "production" and provider is None:
        raise ClosureFailure("production cutover requires an exact provider/account profile")
    if provider and (provider["adapter_id"] != value["rollback_adapter_id"] or
                     provider["rollback_operation"] != value["rollback_operation"]):
        raise ClosureFailure("cutover rollback does not match the provider profile")
    if provider:
        holdout_result = Store(workspace).get("holdout-result", ident(value.get("holdout_result_id"), "holdout_result_id"))
        if (holdout_result["tenant_id"] != tenant_id or holdout_result["decision"] != "PASS" or
                holdout_result["target_release_sha256"] != value["target_release_sha256"] or
                holdout_result["provider_account_sha256"] != provider["account_binding_sha256"]):
            raise ClosureFailure("production cutover is not bound to a passing exact Holdout result")
    actor = skill_runtime.TrustStore.load(trust_path).verify(approval, "production-approver",
        {"cutover_id": cutover_id, "tenant_id": tenant_id, "plan_sha256": plan_sha,
         "snapshot_id": value["snapshot_id"], "target_key": value["target_key"]})
    record = {**value, "plan_sha256": plan_sha, "environment_class": snapshot["environment_class"],
              "state": "PLANNED", "version": 0, "fencing_token": 0,
              "approval": actor, "transitions": []}
    return Store(workspace).create("cutover", cutover_id, tenant_id, snapshot["environment_class"], "PLANNED", record, "CUTOVER_PLANNED")


def transition_cutover(workspace: Path, cutover_id: str, source: str, target: str, fencing: int,
                       receipt: dict[str, Any], attestation: dict[str, Any], trust_path: Path,
                       roots: tuple[Path, ...]) -> dict[str, Any]:
    store, current = Store(workspace), Store(workspace).get("cutover", cutover_id)
    if current["state"] != source or target not in TRANSITIONS.get(source, set()):
        raise ClosureFailure("cutover transition is not allowed")
    if not isinstance(fencing, int) or isinstance(fencing, bool) or fencing <= current["fencing_token"]:
        raise ClosureFailure("cutover fencing token must increase")
    provider_states = {"PRECHECKED", "EXECUTING", "VERIFYING", "SUCCEEDED",
                       "ROLLING_BACK", "ROLLED_BACK", "UNKNOWN"}
    receipt_ref = (provider_transition_receipt(receipt, roots, current, target)
                   if target in provider_states and current.get("provider") else reference(receipt, roots))
    if current.get("provider") and target in provider_states:
        used_receipt_ids = {item.get("receipt", {}).get("receipt_id") for item in current.get("transitions", [])}
        used_requests = {item.get("receipt", {}).get("request_sha256") for item in current.get("transitions", [])}
        if receipt_ref.get("receipt_id") in used_receipt_ids or receipt_ref.get("request_sha256") in used_requests:
            raise ClosureFailure("provider receipt/request is already bound to another cutover transition")
    actor = skill_runtime.TrustStore.load(trust_path).verify(attestation, ROLES[target],
        {"cutover_id": cutover_id, "tenant_id": current["tenant_id"], "expected_state": source,
         "target_state": target, "fencing_token": fencing, "receipt_sha256": receipt_ref["sha256"]})
    if target in {"SUCCEEDED", "ROLLED_BACK"} and actor["actor_id"] == current["approval"]["actor_id"]:
        raise ClosureFailure("final verifier conflicts with cutover approver")
    transition = {"from": source, "to": target, "fencing_token": fencing, "receipt": receipt_ref,
                  "actor": actor, "recorded_at": now_text()}
    record = {**current, "state": target, "version": current["version"] + 1, "fencing_token": fencing,
              "transitions": [*current["transitions"], transition]}
    return store.update("cutover", cutover_id, source, current["version"], target, record, f"CUTOVER_{target}")


def start_soak(workspace: Path, cutover_id: str, run_id: str, environment: str, started_at: str,
               required_seconds: int, max_gap_seconds: int, minimum_availability: float = 0.0,
               maximum_error_rate: float = 1.0, minimum_observations: int = 1) -> dict[str, Any]:
    cutover = Store(workspace).get("cutover", cutover_id)
    if cutover["state"] != "SUCCEEDED" or environment not in {"test", "sandbox", "production"}:
        raise ClosureFailure("soak requires successful cutover and valid environment")
    started = parse_time(started_at, "started_at")
    if started > utc_now() + timedelta(seconds=MAX_CLOCK_SKEW_SECONDS):
        raise ClosureFailure("soak start is future-dated")
    if cutover.get("environment_class", environment) != environment:
        raise ClosureFailure("soak environment differs from the cutover snapshot")
    if (not isinstance(required_seconds, int) or isinstance(required_seconds, bool) or required_seconds <= 0 or
            not isinstance(max_gap_seconds, int) or isinstance(max_gap_seconds, bool) or
            max_gap_seconds <= 0 or max_gap_seconds > required_seconds):
        raise ClosureFailure("soak duration/gap is invalid")
    if (not isinstance(minimum_availability, (int, float)) or isinstance(minimum_availability, bool) or
            not 0 <= minimum_availability <= 1 or
            not isinstance(maximum_error_rate, (int, float)) or isinstance(maximum_error_rate, bool) or
            not 0 <= maximum_error_rate <= 1 or
            not isinstance(minimum_observations, int) or isinstance(minimum_observations, bool) or
            minimum_observations < 1 or minimum_observations > MAX_SOAK_OBSERVATIONS):
        raise ClosureFailure("soak acceptance profile is invalid")
    if environment == "production" and required_seconds < PRODUCTION_SOAK_SECONDS:
        raise ClosureFailure("production soak must run at least seven days")
    if environment == "production":
        required_observations = (required_seconds + max_gap_seconds - 1) // max_gap_seconds
        try:
            holdout_result = Store(workspace).get(
                "holdout-result", ident(cutover.get("holdout_result_id"), "holdout_result_id"))
        except ClosureFailure as exc:
            raise ClosureFailure("production soak requires an exact passing Holdout result") from exc
        provider = cutover.get("provider")
        if (not isinstance(provider, dict) or holdout_result.get("decision") != "PASS" or
                holdout_result.get("tenant_id") != cutover["tenant_id"] or
                holdout_result.get("target_release_sha256") != cutover.get("target_release_sha256") or
                holdout_result.get("provider_account_sha256") != provider.get("account_binding_sha256")):
            raise ClosureFailure("production soak Holdout result differs from the cutover tuple")
        if (max_gap_seconds > PRODUCTION_MAX_GAP_SECONDS or
                minimum_observations < required_observations or minimum_availability < 0.99 or
                maximum_error_rate > 0.01):
            raise ClosureFailure("production soak requires exact provider binding and conservative telemetry policy")
        last_transition = cutover.get("transitions", [])[-1] if cutover.get("transitions") else None
        if (not isinstance(last_transition, dict) or last_transition.get("to") != "SUCCEEDED" or
                started < parse_time(last_transition.get("recorded_at"), "cutover succeeded_at") or
                (utc_now() - started).total_seconds() > PRODUCTION_OBSERVATION_SKEW_SECONDS):
            raise ClosureFailure("production soak must start after cutover and near real time")
    record = {"schema_version": "1.0", "run_id": ident(run_id, "run_id"), "cutover_id": cutover_id,
              "tenant_id": cutover["tenant_id"], "environment_class": environment, "state": "RUNNING",
              "version": 0, "started_at": started_at, "required_seconds": required_seconds,
              "max_gap_seconds": max_gap_seconds, "minimum_availability": float(minimum_availability),
              "maximum_error_rate": float(maximum_error_rate), "minimum_observations": minimum_observations,
              "last_sequence": 0, "last_observed_at": None, "observations": [], "critical_failures": 0,
              "total_requests": 0, "total_errors": 0, "minimum_observed_availability": 1.0,
              "observer_ids": []}
    return Store(workspace).create("soak", run_id, cutover["tenant_id"], environment, "RUNNING", record, "SOAK_STARTED")


def observe_soak(workspace: Path, run_id: str, sequence: int, observed_at: str, metrics: dict[str, Any],
                 attestation: dict[str, Any], trust_path: Path) -> dict[str, Any]:
    store, current = Store(workspace), Store(workspace).get("soak", run_id)
    if len(current.get("observations", [])) >= MAX_SOAK_OBSERVATIONS:
        raise ClosureFailure("soak observation budget is exhausted")
    if sequence != current["last_sequence"] + 1 or set(metrics) != {"requests", "errors", "critical_failures", "availability"}:
        raise ClosureFailure("soak sequence/metrics are invalid")
    requests, errors, critical, availability = (metrics[key] for key in ("requests", "errors", "critical_failures", "availability"))
    if (not all(isinstance(item, int) and not isinstance(item, bool) and item >= 0 for item in (requests, errors, critical))
            or errors > requests or not isinstance(availability, (int, float)) or isinstance(availability, bool) or
            not 0 <= availability <= 1):
        raise ClosureFailure("soak metric values are invalid")
    observed, previous = parse_time(observed_at, "observed_at"), parse_time(current["last_observed_at"] or current["started_at"], "previous")
    if observed <= previous or (observed - previous).total_seconds() > current["max_gap_seconds"]:
        raise ClosureFailure("soak time is non-monotonic or exceeds gap")
    now = utc_now()
    if observed > now + timedelta(seconds=MAX_CLOCK_SKEW_SECONDS):
        raise ClosureFailure("soak observation is future-dated")
    if (current["environment_class"] == "production" and
            abs((now - observed).total_seconds()) > PRODUCTION_OBSERVATION_SKEW_SECONDS):
        raise ClosureFailure("production soak observations must be recorded near real time")
    metrics_sha = digest(metrics)
    actor = skill_runtime.TrustStore.load(trust_path).verify(attestation, "operations-owner",
        {"run_id": run_id, "sequence": sequence, "observed_at": observed_at, "metrics_sha256": metrics_sha})
    observation = {"sequence": sequence, "observed_at": observed_at, "metrics": metrics,
                   "metrics_sha256": metrics_sha, "actor": actor}
    observer_ids = list(current.get("observer_ids", []))
    if actor["actor_id"] not in observer_ids:
        observer_ids.append(actor["actor_id"])
    record = {**current, "version": current["version"] + 1, "last_sequence": sequence,
              "last_observed_at": observed_at, "observations": [*current["observations"], observation],
              "critical_failures": current["critical_failures"] + critical,
              "total_requests": current.get("total_requests", 0) + requests,
              "total_errors": current.get("total_errors", 0) + errors,
              "minimum_observed_availability": min(current.get("minimum_observed_availability", 1.0),
                                                   float(availability)), "observer_ids": observer_ids}
    return store.update("soak", run_id, "RUNNING", current["version"], "RUNNING", record, "SOAK_OBSERVED")


def soak_evidence_root(record: dict[str, Any]) -> str:
    observations = [{"sequence": item["sequence"], "observed_at": item["observed_at"],
                     "metrics_sha256": item["metrics_sha256"],
                     "actor_sha256": item["actor"]["payload_sha256"]}
                    for item in record["observations"]]
    return digest({"run_id": record["run_id"], "cutover_id": record["cutover_id"],
        "started_at": record["started_at"], "required_seconds": record["required_seconds"],
        "max_gap_seconds": record["max_gap_seconds"],
        "minimum_availability": record.get("minimum_availability", 0.0),
        "maximum_error_rate": record.get("maximum_error_rate", 1.0),
        "minimum_observations": record.get("minimum_observations", 1), "observations": observations})


def finish_soak(workspace: Path, run_id: str, sequence: int, observed_at: str,
                attestation: dict[str, Any], trust_path: Path) -> dict[str, Any]:
    store, current = Store(workspace), Store(workspace).get("soak", run_id)
    if sequence != current["last_sequence"] + 1:
        raise ClosureFailure("soak final sequence is invalid")
    observed = parse_time(observed_at, "observed_at")
    if current["last_observed_at"] is None:
        raise ClosureFailure("soak run has no observations")
    last_observed = parse_time(current["last_observed_at"], "last_observed_at")
    if observed <= last_observed or (observed - last_observed).total_seconds() > current["max_gap_seconds"]:
        raise ClosureFailure("final soak observation is non-monotonic or exceeds gap")
    now = utc_now()
    if observed > now + timedelta(seconds=MAX_CLOCK_SKEW_SECONDS):
        raise ClosureFailure("final soak observation is future-dated")
    if (current["environment_class"] == "production" and
            abs((now - observed).total_seconds()) > PRODUCTION_OBSERVATION_SKEW_SECONDS):
        raise ClosureFailure("production soak must finish near real time")
    duration = (observed - parse_time(current["started_at"], "started_at")).total_seconds()
    total_requests = current.get("total_requests", 0)
    error_rate = current.get("total_errors", 0) / total_requests if total_requests else 1.0
    passed = (duration >= current["required_seconds"] and current["critical_failures"] == 0 and
              len(current["observations"]) >= current.get("minimum_observations", 1) and
              current.get("minimum_observed_availability", 0.0) >= current.get("minimum_availability", 0.0) and
              error_rate <= current.get("maximum_error_rate", 1.0))
    target = "PASSED" if passed else "FAILED"
    root = soak_evidence_root(current)
    actor = skill_runtime.TrustStore.load(trust_path).verify(attestation, "production-verifier",
        {"run_id": run_id, "sequence": sequence, "observed_at": observed_at, "target_state": target,
         "evidence_root": root})
    cutover = store.get("cutover", current["cutover_id"])
    if actor["actor_id"] in set(current.get("observer_ids", [])) | {cutover["approval"]["actor_id"]}:
        raise ClosureFailure("final soak verifier must be independent from observers and cutover approver")
    record = {**current, "version": current["version"] + 1, "state": target, "last_sequence": sequence,
              "last_observed_at": observed_at, "duration_seconds": duration, "error_rate": error_rate,
              "evidence_root": root,
              "final_verifier": actor, "evidence_class": "production" if current["environment_class"] == "production" else "engineering-only"}
    return store.update("soak", run_id, "RUNNING", current["version"], target, record, f"SOAK_{target}")


def import_assessment(workspace: Path, path: Path, attestation: dict[str, Any], trust_path: Path,
                      roots: tuple[Path, ...]) -> dict[str, Any]:
    value, report_sha = manifest(path, roots)
    base = {"schema_version", "assessment_id", "tenant_id", "scope", "decision", "evidence_root",
            "limitations", "issued_at", "expires_at"}
    schema_version = value.get("schema_version")
    required = base | ({"run_id", "cutover_id", "target_release_sha256", "provider_account_sha256"}
                       if schema_version == "2.0" else set())
    if (set(value) != required or schema_version not in {"1.0", "2.0"} or
            value.get("decision") not in {"NOT_CERTIFIED", "INCONCLUSIVE", "CERTIFIED"}):
        raise ClosureFailure("assessment fields/decision are invalid")
    assessment_id, tenant_id = ident(value["assessment_id"], "assessment_id"), ident(value["tenant_id"], "tenant_id")
    skill_runtime.require_digest(value["evidence_root"], "evidence_root")
    issued, expires, observed = parse_time(value["issued_at"], "issued_at"), parse_time(value["expires_at"], "expires_at"), utc_now()
    if not issued <= observed < expires:
        raise ClosureFailure("assessment validity is invalid")
    if (not isinstance(value.get("scope"), str) or not value["scope"] or
            not isinstance(value.get("limitations"), list) or
            any(not isinstance(item, str) for item in value["limitations"])):
        raise ClosureFailure("assessment scope/limitations are invalid")
    payload = attestation.get("payload") if isinstance(attestation, dict) else None
    certifier_id = payload.get("actor_id") if isinstance(payload, dict) else None
    connection = Store(workspace).connect()
    try:
        records = [json.loads(row[0]) for row in connection.execute("SELECT record_json FROM records").fetchall()]
    finally:
        connection.close()
    tenant_records = [record for record in records if record.get("tenant_id") == tenant_id]
    actors = {item.get("actor_id") for record in tenant_records for item in
              (record.get("authorization"), record.get("custodian"), record.get("approval"),
               record.get("final_verifier"), record.get("executor"), record.get("verifier"))
              if isinstance(item, dict)}
    for record in tenant_records:
        actors.update(record.get("executor_ids", []))
        actors.update(record.get("verifier_ids", []))
        actors.update(record.get("observer_ids", []))
        actors.update(item.get("actor", {}).get("actor_id") for item in record.get("transitions", []))
    eligible_soaks = {record.get("evidence_root"): record for record in tenant_records
                      if record.get("state") == "PASSED" and "run_id" in record}
    matched_soak = eligible_soaks.get(value["evidence_root"])
    if matched_soak is None:
        raise ClosureFailure("assessment evidence_root is not a PASSED tenant soak run")
    if matched_soak.get("environment_class") == "production":
        cutover = Store(workspace).get("cutover", matched_soak["cutover_id"])
        provider = cutover.get("provider")
        if (schema_version != "2.0" or value.get("run_id") != matched_soak["run_id"] or
                value.get("cutover_id") != cutover["cutover_id"] or
                value.get("target_release_sha256") != cutover["target_release_sha256"] or
                not isinstance(provider, dict) or
                value.get("provider_account_sha256") != provider.get("account_binding_sha256")):
            raise ClosureFailure("production assessment is not bound to the exact run, release, and provider account")
        skill_runtime.require_digest(value.get("target_release_sha256"), "target_release_sha256")
        skill_runtime.require_digest(value.get("provider_account_sha256"), "provider_account_sha256")
    if certifier_id in actors:
        raise ClosureFailure("independent certifier conflicts with execution roles")
    actor = skill_runtime.TrustStore.load(trust_path).verify(attestation, "independent-certifier",
        {"assessment_id": assessment_id, "tenant_id": tenant_id, "report_sha256": report_sha,
         "evidence_root": value["evidence_root"], "decision": value["decision"]})
    record = {**value, "report_sha256": report_sha, "certifier": actor, "certified": False,
              "local_effect": "EXTERNAL_EVIDENCE_IMPORTED",
              "boundary": "Imported assessment cannot enable repository certification."}
    return Store(workspace).create("assessment", assessment_id, tenant_id, None, "IMPORTED", record, "ASSESSMENT_IMPORTED")


def readiness(workspace: Path, tenant_id: str) -> dict[str, Any]:
    store = Store(workspace)
    connection = store.connect()
    try:
        rows = connection.execute("SELECT kind,environment_class,state,record_json FROM records WHERE tenant_id=?", (tenant_id,)).fetchall()
    finally:
        connection.close()
    counts = {kind: 0 for kind in ("snapshot", "holdout", "holdout-result", "cutover", "soak", "assessment")}
    production = True
    state_findings: list[str] = []
    for row in rows:
        counts[row["kind"]] += 1
        if row["kind"] in {"snapshot", "holdout", "holdout-result", "soak"}:
            production = production and row["environment_class"] == "production"
        record = json.loads(row["record_json"])
        if row["kind"] == "cutover" and row["state"] != "SUCCEEDED":
            state_findings.append("cutover has not reached SUCCEEDED")
        if row["kind"] == "holdout-result" and row["state"] != "PASS":
            state_findings.append("independent Holdout result has not passed")
        if row["kind"] == "soak" and row["state"] != "PASSED":
            state_findings.append("soak run has not reached PASSED")
        if row["kind"] == "assessment" and record.get("decision") == "INCONCLUSIVE":
            state_findings.append("independent assessment is INCONCLUSIVE")
        if row["kind"] == "assessment" and parse_time(record.get("expires_at"), "assessment expires_at") <= utc_now():
            state_findings.append("independent assessment has expired")
    findings = [*store.chain_findings(), *state_findings]
    if production:
        assessments = [json.loads(row["record_json"]) for row in rows if row["kind"] == "assessment"]
        soaks = [json.loads(row["record_json"]) for row in rows if row["kind"] == "soak"]
        required_roots = {record.get("evidence_root") for record in soaks
                          if record.get("environment_class") == "production" and record.get("state") == "PASSED"}
        positive_roots = {record.get("evidence_root") for record in assessments
                          if record.get("decision") == "CERTIFIED" and
                          parse_time(record.get("expires_at"), "assessment expires_at") > utc_now()}
        if not required_roots or not required_roots.issubset(positive_roots):
            findings.append("production soak evidence lacks exact positive independent assessment coverage")
    if not rows:
        decision = "NOT_RUN"
    elif findings or any(value == 0 for value in counts.values()):
        decision = "BLOCKED"
    else:
        decision = "READY_FOR_EXTERNAL_GATE" if production else "LOCAL_TOOLKIT_PASS"
    return {"schema_version": "1.0", "tenant_id": tenant_id, "decision": decision, "certified": False,
            "counts": counts, "findings": findings, "production_status": "NOT_CERTIFIED",
            "external_runtime_status": "EVIDENCE_IMPORTED" if decision == "READY_FOR_EXTERNAL_GATE" else "NOT_RUN"}


def json_file(path: Path, label: str) -> dict[str, Any]:
    resolved = path.expanduser().resolve(strict=True)
    try:
        value = json.loads(read_file(resolved, (resolved.parent,), 16 * 1024 * 1024))
    except json.JSONDecodeError as exc:
        raise ClosureFailure(f"{label} is invalid JSON") from exc
    if not isinstance(value, dict):
        raise ClosureFailure(f"{label} must be an object")
    return value


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)

    def evidence_command(name: str) -> argparse.ArgumentParser:
        command = sub.add_parser(name)
        command.add_argument("--workspace", type=Path, required=True)
        command.add_argument("--trust-store", type=Path, required=True)
        command.add_argument("--evidence-root", type=Path, action="append", required=True)
        return command

    snapshot = evidence_command("register-snapshot")
    snapshot.add_argument("--manifest", type=Path, required=True)
    snapshot.add_argument("--authorization", type=Path, required=True)
    holdout = evidence_command("register-holdout")
    holdout.add_argument("--manifest", type=Path, required=True)
    holdout.add_argument("--authorization", type=Path, required=True)
    holdout_result = evidence_command("record-holdout-result")
    holdout_result.add_argument("--manifest", type=Path, required=True)
    holdout_result.add_argument("--executor-attestation", type=Path, required=True)
    holdout_result.add_argument("--verifier-attestation", type=Path, required=True)
    cutover = evidence_command("plan-cutover")
    cutover.add_argument("--plan", type=Path, required=True)
    cutover.add_argument("--approval", type=Path, required=True)
    transition = evidence_command("transition-cutover")
    transition.add_argument("--cutover-id", required=True)
    transition.add_argument("--expected-state", required=True)
    transition.add_argument("--target-state", required=True)
    transition.add_argument("--fencing-token", type=int, required=True)
    transition.add_argument("--receipt", type=Path, required=True)
    transition.add_argument("--attestation", type=Path, required=True)
    start = sub.add_parser("start-soak")
    start.add_argument("--workspace", type=Path, required=True)
    start.add_argument("--cutover-id", required=True)
    start.add_argument("--run-id", required=True)
    start.add_argument("--environment-class", choices=("test", "sandbox", "production"), required=True)
    start.add_argument("--started-at", required=True)
    start.add_argument("--required-seconds", type=int, required=True)
    start.add_argument("--max-gap-seconds", type=int, required=True)
    start.add_argument("--minimum-availability", type=float, default=0.0)
    start.add_argument("--maximum-error-rate", type=float, default=1.0)
    start.add_argument("--minimum-observations", type=int, default=1)
    observe = sub.add_parser("observe-soak")
    observe.add_argument("--workspace", type=Path, required=True)
    observe.add_argument("--run-id", required=True)
    observe.add_argument("--sequence", type=int, required=True)
    observe.add_argument("--observed-at", required=True)
    observe.add_argument("--metrics", type=Path, required=True)
    observe.add_argument("--attestation", type=Path, required=True)
    observe.add_argument("--trust-store", type=Path, required=True)
    finish = sub.add_parser("finish-soak")
    finish.add_argument("--workspace", type=Path, required=True)
    finish.add_argument("--run-id", required=True)
    finish.add_argument("--sequence", type=int, required=True)
    finish.add_argument("--observed-at", required=True)
    finish.add_argument("--attestation", type=Path, required=True)
    finish.add_argument("--trust-store", type=Path, required=True)
    assessment = evidence_command("import-assessment")
    assessment.add_argument("--report", type=Path, required=True)
    assessment.add_argument("--attestation", type=Path, required=True)
    status = sub.add_parser("readiness")
    status.add_argument("--workspace", type=Path, required=True)
    status.add_argument("--tenant-id", required=True)
    args = parser.parse_args()
    if args.command in {"register-snapshot", "register-holdout", "record-holdout-result", "plan-cutover",
                        "transition-cutover", "import-assessment"}:
        roots = tuple(path.expanduser().resolve(strict=True) for path in args.evidence_root)
    if args.command == "register-snapshot":
        result = register_snapshot(args.workspace, args.manifest, json_file(args.authorization, "authorization"), args.trust_store, roots)
    elif args.command == "register-holdout":
        result = register_holdout(args.workspace, args.manifest, json_file(args.authorization, "authorization"), args.trust_store, roots)
    elif args.command == "record-holdout-result":
        result = record_holdout_result(args.workspace, args.manifest,
            json_file(args.executor_attestation, "executor attestation"),
            json_file(args.verifier_attestation, "verifier attestation"), args.trust_store, roots)
    elif args.command == "plan-cutover":
        result = plan_cutover(args.workspace, args.plan, json_file(args.approval, "approval"), args.trust_store, roots)
    elif args.command == "transition-cutover":
        result = transition_cutover(args.workspace, args.cutover_id, args.expected_state, args.target_state,
            args.fencing_token, json_file(args.receipt, "receipt reference"), json_file(args.attestation, "attestation"),
            args.trust_store, roots)
    elif args.command == "start-soak":
        result = start_soak(args.workspace, args.cutover_id, args.run_id, args.environment_class,
                            args.started_at, args.required_seconds, args.max_gap_seconds,
                            args.minimum_availability, args.maximum_error_rate, args.minimum_observations)
    elif args.command == "observe-soak":
        result = observe_soak(args.workspace, args.run_id, args.sequence, args.observed_at,
            json_file(args.metrics, "metrics"), json_file(args.attestation, "attestation"), args.trust_store)
    elif args.command == "finish-soak":
        result = finish_soak(args.workspace, args.run_id, args.sequence, args.observed_at,
                             json_file(args.attestation, "attestation"), args.trust_store)
    elif args.command == "import-assessment":
        result = import_assessment(args.workspace, args.report, json_file(args.attestation, "attestation"),
                                   args.trust_store, roots)
    elif args.command == "readiness":
        result = readiness(args.workspace, args.tenant_id)
    else:
        raise AssertionError(args.command)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
