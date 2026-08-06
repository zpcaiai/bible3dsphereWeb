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
import external_authority


MAX_BYTES = 1024 * 1024 * 1024
PRODUCTION_SOAK_SECONDS = 7 * 24 * 60 * 60
PRODUCTION_MAX_GAP_SECONDS = 6 * 60 * 60
PRODUCTION_OBSERVATION_SKEW_SECONDS = 15 * 60
MAX_CLOCK_SKEW_SECONDS = 5 * 60
MAX_SOAK_OBSERVATIONS = 100_000
LEGACY_PROVIDER_FIELDS = {
    "provider_id", "account_binding_sha256", "region", "adapter_id",
    "precheck_operation", "execute_operation", "verify_operation", "rollback_operation",
}
EXACT_PROVIDER_FIELDS = LEGACY_PROVIDER_FIELDS | {
    "profile_version", "provider_api_version", "account_model", "adapter_version",
    "iac_tool", "iac_tool_version", "state_backend_sha256", "identity_binding_sha256",
    "least_privilege_policy_sha256", "rollback_plan_sha256",
}
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


class SystemEvidenceClock:
    mode = "system"

    @staticmethod
    def now() -> datetime:
        return datetime.now(timezone.utc)


class ControlledTestClock:
    """Explicit engineering clock whose output is never production evidence."""

    mode = "controlled-test"

    def __init__(self, current: datetime):
        self.set(current)

    def set(self, current: datetime) -> None:
        if not isinstance(current, datetime) or current.tzinfo is None:
            raise ClosureFailure("controlled test clock must be timezone-aware")
        self._current = current.astimezone(timezone.utc)

    def now(self) -> datetime:
        return self._current


SYSTEM_EVIDENCE_CLOCK = SystemEvidenceClock()


def evidence_clock(clock: SystemEvidenceClock | ControlledTestClock | None = None) -> SystemEvidenceClock | ControlledTestClock:
    if clock is None or clock is SYSTEM_EVIDENCE_CLOCK:
        return SYSTEM_EVIDENCE_CLOCK
    if isinstance(clock, ControlledTestClock):
        return clock
    raise ClosureFailure("unsupported evidence clock")


def canonical_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode()


def digest_bytes(value: bytes) -> str:
    return "sha256:" + hashlib.sha256(value).hexdigest()


def digest(value: Any) -> str:
    return digest_bytes(canonical_bytes(value))


def now_text() -> str:
    return utc_now().isoformat().replace("+00:00", "Z")


def utc_now() -> datetime:
    return SYSTEM_EVIDENCE_CLOCK.now()


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


def provider_profile(value: Any, *, require_exact: bool = False) -> dict[str, str]:
    if not isinstance(value, dict) or frozenset(value) not in {
            frozenset(LEGACY_PROVIDER_FIELDS), frozenset(EXACT_PROVIDER_FIELDS)}:
        raise ClosureFailure("cutover provider profile fields are invalid")
    exact = set(value) == EXACT_PROVIDER_FIELDS
    if require_exact and not exact:
        raise ClosureFailure("production cutover requires an exact versioned Provider/IaC profile")
    if exact and value.get("profile_version") != "2.0":
        raise ClosureFailure("exact provider profile_version must be 2.0")
    digest_fields = {"account_binding_sha256"}
    if exact:
        digest_fields |= {"state_backend_sha256", "identity_binding_sha256",
                          "least_privilege_policy_sha256", "rollback_plan_sha256"}
    result: dict[str, str] = {}
    for field in value:
        result[field] = (skill_runtime.require_digest(value.get(field), f"provider.{field}")
                         if field in digest_fields else ident(value.get(field), f"provider.{field}"))
    return result


def production_actor_groups(trust: skill_runtime.TrustStore,
                            groups: dict[str, list[str]]) -> dict[str, list[str]]:
    if trust.schema_version != "2.0" or trust.purpose != "workspace-actors":
        raise ClosureFailure("production evidence requires a version 2 workspace Actor Trust Store")
    role_by_group = {
        "data_owner": "data-owner", "transformation_authors": "transformation-author",
        "custodian": "holdout-custodian", "executors": "holdout-executor",
        "verifiers": "holdout-verifier", "oracle_owners": "oracle-owner",
    }
    organizations: dict[str, list[str]] = {}
    for group, actor_ids in groups.items():
        observed: set[str] = set()
        for actor_id in actor_ids:
            actor = trust.actors.get(actor_id)
            if (actor is None or role_by_group[group] not in actor.roles or not actor.organization_id or
                    not actor.authority_class):
                raise ClosureFailure(f"production actor group {group} is not organization/role bound")
            observed.add(actor.organization_id)
        if not observed:
            raise ClosureFailure(f"production actor group {group} is empty")
        organizations[group] = sorted(observed)
    items = list(organizations.items())
    for left, (left_name, left_orgs) in enumerate(items):
        for right_name, right_orgs in items[left + 1:]:
            if set(left_orgs) & set(right_orgs):
                raise ClosureFailure(f"production organizations overlap: {left_name}/{right_name}")
    return organizations


def provider_transition_receipt(value: Any, roots: tuple[Path, ...], cutover: dict[str, Any],
                                target_state: str) -> dict[str, Any]:
    outer = reference(value, roots)
    try:
        payload = json.loads(read_file(Path(value["path"]), roots, 16 * 1024 * 1024))
    except json.JSONDecodeError as exc:
        raise ClosureFailure("provider transition receipt is invalid JSON") from exc
    base = {"schema_version", "receipt_id", "cutover_id", "tenant_id", "target_key",
            "target_state", "provider", "operation", "adapter_receipt", "effect_state",
            "request_sha256", "issued_at"}
    exact_profile = isinstance(payload, dict) and isinstance(payload.get("provider"), dict) and \
        payload["provider"].get("profile_version") == "2.0"
    required = base | ({"control_evidence", "control_decisions"} if exact_profile else set())
    expected_schema = "2.0" if exact_profile else "1.0"
    if not isinstance(payload, dict) or set(payload) != required or payload.get("schema_version") != expected_schema:
        raise ClosureFailure("provider transition receipt fields are invalid")
    if (ident(payload.get("receipt_id"), "receipt_id") == cutover.get("cutover_id") or
            payload.get("cutover_id") != cutover.get("cutover_id") or
            payload.get("tenant_id") != cutover.get("tenant_id") or
            payload.get("target_key") != cutover.get("target_key") or payload.get("target_state") != target_state):
        raise ClosureFailure("provider transition receipt binding is invalid")
    profile = provider_profile(payload.get("provider"), require_exact=cutover.get("environment_class") == "production")
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
    controls: dict[str, Any] | None = None
    if exact_profile:
        decisions, evidence = payload.get("control_decisions"), payload.get("control_evidence")
        control_keys = {"identity", "least_privilege", "state_backend", "rollback"}
        if (not isinstance(decisions, dict) or set(decisions) != control_keys or
                any(decisions[key] != "PASS" for key in control_keys) or
                not isinstance(evidence, dict) or set(evidence) != control_keys):
            raise ClosureFailure("provider control decisions/evidence are incomplete or non-passing")
        refs = {key: reference(evidence[key], roots) for key in control_keys}
        expected_digests = {"identity": profile["identity_binding_sha256"],
                            "least_privilege": profile["least_privilege_policy_sha256"],
                            "state_backend": profile["state_backend_sha256"],
                            "rollback": profile["rollback_plan_sha256"]}
        if any(refs[key]["sha256"] != expected_digests[key] for key in control_keys):
            raise ClosureFailure("provider control evidence differs from the approved exact profile")
        controls = {"decisions": decisions, "evidence": refs}
    return {**outer, "receipt_id": payload["receipt_id"], "provider": profile,
            "operation": payload.get("operation"), "effect_state": expected_effect,
            "request_sha256": request_sha, "adapter_receipt": native, "issued_at": payload["issued_at"],
            **({"controls": controls} if controls is not None else {})}


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
            records = connection.execute(
                "SELECT kind,record_id,tenant_id,environment_class,state,version,record_json FROM records"
            ).fetchall()
        finally:
            connection.close()
        findings, previous, latest = [], "GENESIS", {}
        for row in rows:
            expected = digest({"kind": row["kind"], "record_id": row["record_id"], "event_type": row["event_type"],
                               "record_sha256": row["record_sha256"], "previous_hash": previous,
                               "created_at": row["created_at"]})
            if row["previous_hash"] != previous or row["event_hash"] != expected:
                findings.append(f"event {row['sequence']} hash-chain mismatch")
            latest[(row["kind"], row["record_id"])] = row["record_sha256"]
            previous = row["event_hash"]
        for row in records:
            key = (row["kind"], row["record_id"])
            try:
                record = json.loads(row["record_json"])
            except json.JSONDecodeError:
                findings.append(f"{row['kind']}:{row['record_id']} record JSON is invalid")
                continue
            if latest.get(key) != digest_bytes(canonical_bytes(record)):
                findings.append(f"{row['kind']}:{row['record_id']} current record differs from latest event")
            if record.get("tenant_id") != row["tenant_id"]:
                findings.append(f"{row['kind']}:{row['record_id']} tenant metadata mismatch")
            if record.get("environment_class", row["environment_class"]) != row["environment_class"]:
                findings.append(f"{row['kind']}:{row['record_id']} environment metadata mismatch")
            if "state" in record and record["state"] != row["state"]:
                findings.append(f"{row['kind']}:{row['record_id']} state metadata mismatch")
            if "version" in record and record["version"] != row["version"]:
                findings.append(f"{row['kind']}:{row['record_id']} version metadata mismatch")
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
    trust = skill_runtime.TrustStore.load(trust_path)
    actor = trust.verify(authorization, "data-owner",
        {"snapshot_id": snapshot_id, "tenant_id": tenant_id, "manifest_sha256": manifest_sha,
         "environment_class": environment, "purpose": value["purpose"]})
    if environment == "production":
        production_actor_groups(trust, {"data_owner": [actor["actor_id"]]})
    record = {"schema_version": "1.0", "snapshot_id": snapshot_id, "tenant_id": tenant_id,
              "environment_class": environment, "classification": value["classification"], "purpose": value["purpose"],
              "manifest_sha256": manifest_sha, "content_root": digest(sorted(item["sha256"] for item in refs)),
              "file_count": len(refs), "total_bytes": sum(item["bytes"] for item in refs), "read_only": True,
              "data_minimization": "metadata-and-content-digests-only", "authorization": actor}
    return Store(workspace).create("snapshot", snapshot_id, tenant_id, environment, "REGISTERED", record, "SNAPSHOT_REGISTERED")


def register_holdout(workspace: Path, path: Path, authorization: dict[str, Any], trust_path: Path,
                     roots: tuple[Path, ...]) -> dict[str, Any]:
    value, manifest_sha = manifest(path, roots)
    base = {"schema_version", "holdout_id", "tenant_id", "environment_class", "corpus",
            "development_corpus_sha256", "transformation_author_ids", "executor_ids", "verifier_ids"}
    version = value.get("schema_version")
    required = base | ({"oracle_owner_ids", "oracle_registry_sha256", "claim_oracle_map",
                        "development_partition_id", "holdout_partition_id"} if version == "2.0" else set())
    if set(value) != required or version not in {"1.0", "2.0"}:
        raise ClosureFailure("Holdout manifest fields are invalid")
    holdout_id, tenant_id = ident(value.get("holdout_id"), "holdout_id"), ident(value.get("tenant_id"), "tenant_id")
    environment = value.get("environment_class")
    if environment not in {"test", "sandbox", "production"}:
        raise ClosureFailure("Holdout environment is invalid")
    if environment == "production" and version != "2.0":
        raise ClosureFailure("production Holdout requires Claim-specific Oracle and partition bindings")
    corpus = reference(value["corpus"], roots)
    if corpus["sha256"] == skill_runtime.require_digest(value.get("development_corpus_sha256"), "development corpus"):
        raise ClosureFailure("Holdout corpus reuses development content")
    sets = []
    actor_fields = ["transformation_author_ids", "executor_ids", "verifier_ids"]
    if version == "2.0":
        actor_fields.append("oracle_owner_ids")
    for field in actor_fields:
        items = value.get(field)
        if (not isinstance(items, list) or not items or len(items) != len(set(items)) or
                any(not isinstance(item, str) or not item for item in items)):
            raise ClosureFailure(f"{field} is invalid")
        sets.append(set(items))
    if any(sets[left] & sets[right] for left in range(len(sets)) for right in range(left + 1, len(sets))):
        raise ClosureFailure("Holdout authors/executors/verifiers/Oracle owners overlap")
    oracle_registry_sha = None
    claim_oracle_map: list[dict[str, str]] = []
    claim_oracle_root = None
    if version == "2.0":
        development_partition = ident(value.get("development_partition_id"), "development_partition_id")
        holdout_partition = ident(value.get("holdout_partition_id"), "holdout_partition_id")
        if development_partition == holdout_partition:
            raise ClosureFailure("Holdout and development partitions must be physically distinct")
        oracle_registry_sha = skill_runtime.require_digest(value.get("oracle_registry_sha256"), "oracle_registry_sha256")
        mappings = value.get("claim_oracle_map")
        if not isinstance(mappings, list) or not mappings or len(mappings) > 100_000:
            raise ClosureFailure("claim_oracle_map is invalid")
        seen_claims = set()
        for index, mapping in enumerate(mappings):
            if not isinstance(mapping, dict) or set(mapping) != {"claim_id", "oracle_id", "oracle_version"}:
                raise ClosureFailure("claim_oracle_map fields are invalid")
            normalized_mapping = {key: ident(mapping.get(key), f"claim_oracle_map[{index}].{key}")
                                  for key in ("claim_id", "oracle_id", "oracle_version")}
            if normalized_mapping["claim_id"] in seen_claims:
                raise ClosureFailure("claim_oracle_map contains duplicate claims")
            seen_claims.add(normalized_mapping["claim_id"])
            claim_oracle_map.append(normalized_mapping)
        claim_oracle_root = digest(claim_oracle_map)
    payload = authorization.get("payload") if isinstance(authorization, dict) else None
    custodian = payload.get("actor_id") if isinstance(payload, dict) else None
    if custodian in set().union(*sets):
        raise ClosureFailure("Holdout custodian conflicts with evaluation actors")
    bindings = {"holdout_id": holdout_id, "tenant_id": tenant_id, "manifest_sha256": manifest_sha,
                "corpus_sha256": corpus["sha256"], "environment_class": environment}
    if version == "2.0":
        bindings.update({"oracle_registry_sha256": oracle_registry_sha, "claim_oracle_root": claim_oracle_root,
                         "development_partition_id": value["development_partition_id"],
                         "holdout_partition_id": value["holdout_partition_id"]})
    trust = skill_runtime.TrustStore.load(trust_path)
    actor = trust.verify(authorization, "holdout-custodian", bindings)
    organizations = None
    if environment == "production":
        organizations = production_actor_groups(trust, {
            "transformation_authors": value["transformation_author_ids"],
            "custodian": [actor["actor_id"]], "executors": value["executor_ids"],
            "verifiers": value["verifier_ids"], "oracle_owners": value["oracle_owner_ids"],
        })
    record = {"schema_version": version, "holdout_id": holdout_id, "tenant_id": tenant_id,
              "environment_class": environment, "manifest_sha256": manifest_sha, "corpus": corpus, "sealed": True,
              "custodian": actor, "transformation_author_ids": value["transformation_author_ids"],
              "executor_ids": value["executor_ids"], "verifier_ids": value["verifier_ids"],
              **({"oracle_owner_ids": value["oracle_owner_ids"], "oracle_registry_sha256": oracle_registry_sha,
                  "claim_oracle_map": claim_oracle_map, "claim_oracle_root": claim_oracle_root,
                  "development_partition_id": value["development_partition_id"],
                  "holdout_partition_id": value["holdout_partition_id"]} if version == "2.0" else {}),
              **({"organization_bound": True, "independence_organizations": organizations,
                  "actor_trust_store_sha256": trust.digest} if organizations is not None else {})}
    return Store(workspace).create("holdout", holdout_id, tenant_id, environment, "SEALED", record, "HOLDOUT_SEALED")


def record_holdout_result(workspace: Path, path: Path, executor_attestation: dict[str, Any],
                          verifier_attestation: dict[str, Any], trust_path: Path,
                          roots: tuple[Path, ...]) -> dict[str, Any]:
    value, manifest_sha = manifest(path, roots)
    required = {"schema_version", "result_id", "holdout_id", "tenant_id", "target_release_sha256",
                "provider_account_sha256", "execution_receipt", "decision", "claim_results",
                "started_at", "finished_at"}
    if not isinstance(value, dict) or set(value) != required or value.get("schema_version") not in {"1.0", "2.0"}:
        raise ClosureFailure("holdout result fields are invalid")
    result_id, holdout_id = ident(value.get("result_id"), "result_id"), ident(value.get("holdout_id"), "holdout_id")
    tenant_id = ident(value.get("tenant_id"), "tenant_id")
    holdout = Store(workspace).get("holdout", holdout_id)
    if holdout["tenant_id"] != tenant_id:
        raise ClosureFailure("holdout result crosses tenant boundary")
    if value["schema_version"] != holdout.get("schema_version"):
        raise ClosureFailure("holdout result schema does not match the sealed Holdout contract")
    target_release = skill_runtime.require_digest(value.get("target_release_sha256"), "target_release_sha256")
    provider_account = skill_runtime.require_digest(value.get("provider_account_sha256"), "provider_account_sha256")
    execution_receipt = reference(value.get("execution_receipt"), roots)
    started, finished = parse_time(value.get("started_at"), "started_at"), parse_time(value.get("finished_at"), "finished_at")
    if finished <= started or finished > utc_now() + timedelta(seconds=MAX_CLOCK_SKEW_SECONDS):
        raise ClosureFailure("holdout execution time window is invalid")
    claim_results = value.get("claim_results")
    if not isinstance(claim_results, list) or not claim_results or len(claim_results) > 100_000:
        raise ClosureFailure("holdout claim results are invalid")
    normalized, claim_ids, outcomes, oracle_actor_ids = [], set(), [], set()
    expected_oracles = {item["claim_id"]: item for item in holdout.get("claim_oracle_map", [])}
    trust = skill_runtime.TrustStore.load(trust_path)
    if holdout.get("environment_class") == "production" and (
            trust.schema_version != "2.0" or trust.digest != holdout.get("actor_trust_store_sha256")):
        raise ClosureFailure("production Holdout result must use the exact sealed organization Trust Store")
    for index, item in enumerate(claim_results):
        expected_fields = ({"claim_id", "outcome", "evidence", "oracle_id", "oracle_version", "oracle_attestation"}
                           if value["schema_version"] == "2.0" else {"claim_id", "outcome", "evidence"})
        if not isinstance(item, dict) or set(item) != expected_fields:
            raise ClosureFailure("holdout claim result fields are invalid")
        claim_id = ident(item.get("claim_id"), "claim_id")
        if claim_id in claim_ids or item.get("outcome") not in {"PASS", "FAIL", "INCONCLUSIVE"}:
            raise ClosureFailure("holdout claim identity/outcome is invalid")
        evidence = reference(item.get("evidence"), roots)
        claim_ids.add(claim_id)
        outcomes.append(item["outcome"])
        normalized_item: dict[str, Any] = {"claim_id": claim_id, "outcome": item["outcome"], "evidence": evidence}
        if value["schema_version"] == "2.0":
            mapping = expected_oracles.get(claim_id)
            oracle_id = ident(item.get("oracle_id"), f"claim_results[{index}].oracle_id")
            oracle_version = ident(item.get("oracle_version"), f"claim_results[{index}].oracle_version")
            if mapping is None or oracle_id != mapping["oracle_id"] or oracle_version != mapping["oracle_version"]:
                raise ClosureFailure("holdout Claim differs from the sealed Claim-specific Oracle map")
            oracle_bindings = {"result_id": result_id, "holdout_id": holdout_id, "tenant_id": tenant_id,
                "claim_id": claim_id, "oracle_id": oracle_id, "oracle_version": oracle_version,
                "outcome": item["outcome"], "evidence_sha256": evidence["sha256"],
                "target_release_sha256": target_release, "provider_account_sha256": provider_account,
                "oracle_registry_sha256": holdout["oracle_registry_sha256"]}
            oracle_actor = trust.verify(item.get("oracle_attestation"), "oracle-owner", oracle_bindings)
            if oracle_actor["actor_id"] not in holdout["oracle_owner_ids"]:
                raise ClosureFailure("Claim Oracle attestation is not owned by the sealed Holdout Oracle set")
            oracle_actor_ids.add(oracle_actor["actor_id"])
            normalized_item.update({"oracle_id": oracle_id, "oracle_version": oracle_version,
                                    "oracle": oracle_actor})
        normalized.append(normalized_item)
    if value["schema_version"] == "2.0" and claim_ids != set(expected_oracles):
        raise ClosureFailure("holdout result does not cover the exact sealed Claim set")
    derived = "FAIL" if "FAIL" in outcomes else ("INCONCLUSIVE" if "INCONCLUSIVE" in outcomes else "PASS")
    if value.get("decision") != derived:
        raise ClosureFailure("holdout decision differs from claim outcomes")
    evidence_root = digest({"holdout_corpus_sha256": holdout["corpus"]["sha256"],
        "execution_receipt_sha256": execution_receipt["sha256"], "claim_results": normalized})
    bindings = {"result_id": result_id, "holdout_id": holdout_id, "tenant_id": tenant_id,
        "manifest_sha256": manifest_sha, "evidence_root": evidence_root,
        "target_release_sha256": target_release, "provider_account_sha256": provider_account,
        "decision": derived}
    executor = trust.verify(executor_attestation, "holdout-executor", bindings)
    verifier = trust.verify(verifier_attestation, "holdout-verifier", {**bindings, "executor_id": executor["actor_id"]})
    if (executor["actor_id"] not in holdout["executor_ids"] or verifier["actor_id"] not in holdout["verifier_ids"] or
            executor["actor_id"] == verifier["actor_id"] or
            {executor["actor_id"], verifier["actor_id"]} &
            ({holdout["custodian"]["actor_id"]} | set(holdout["transformation_author_ids"]) |
             set(holdout.get("oracle_owner_ids", []))) or
            oracle_actor_ids & {executor["actor_id"], verifier["actor_id"]}):
        raise ClosureFailure("holdout execution actors violate the sealed custody roles")
    if holdout.get("environment_class") == "production":
        expected_orgs = holdout.get("independence_organizations", {})
        oracle_orgs = {trust.actors[item].organization_id for item in oracle_actor_ids}
        if (executor.get("organization_id") not in expected_orgs.get("executors", []) or
                verifier.get("organization_id") not in expected_orgs.get("verifiers", []) or
                executor.get("organization_id") == verifier.get("organization_id") or
                not oracle_orgs.issubset(set(expected_orgs.get("oracle_owners", [])))):
            raise ClosureFailure("production Holdout result violates organization-level independence")
    record = {**value, "corpus_sha256": holdout["corpus"]["sha256"], "manifest_sha256": manifest_sha,
        "execution_receipt": execution_receipt, "claim_results": normalized, "evidence_root": evidence_root,
        "executor": executor, "verifier": verifier, "independent": True, "sealed_holdout_consumed": True,
        "oracle_bound": value["schema_version"] == "2.0"}
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
    provider = provider_profile(value.get("provider"), require_exact=snapshot["environment_class"] == "production") if schema_version == "2.0" else None
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
        if (snapshot["environment_class"] == "production" and
                (holdout_result.get("schema_version") != "2.0" or
                 holdout_result.get("independent") is not True or holdout_result.get("oracle_bound") is not True)):
            raise ClosureFailure("production cutover requires independently verified Claim-specific Oracle Holdout evidence")
    trust = skill_runtime.TrustStore.load(trust_path)
    actor = trust.verify(approval, "production-approver",
        {"cutover_id": cutover_id, "tenant_id": tenant_id, "plan_sha256": plan_sha,
         "snapshot_id": value["snapshot_id"], "target_key": value["target_key"]})
    if snapshot["environment_class"] == "production":
        holdout = Store(workspace).get("holdout", holdout_result["holdout_id"])
        if (trust.schema_version != "2.0" or trust.digest != snapshot["authorization"].get("trust_store_sha256") or
                trust.digest != holdout.get("actor_trust_store_sha256") or not actor.get("organization_id")):
            raise ClosureFailure("production cutover approval must use the exact organization-bound Trust Store")
        forbidden = set().union(*(holdout["independence_organizations"][name]
                                  for name in ("transformation_authors", "executors", "verifiers", "oracle_owners")))
        if actor["organization_id"] in forbidden:
            raise ClosureFailure("production approver organization conflicts with Holdout execution or Oracle roles")
    record = {**value, "provider": provider, "plan_sha256": plan_sha, "environment_class": snapshot["environment_class"],
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
    trust = skill_runtime.TrustStore.load(trust_path)
    actor = trust.verify(attestation, ROLES[target],
        {"cutover_id": cutover_id, "tenant_id": current["tenant_id"], "expected_state": source,
         "target_state": target, "fencing_token": fencing, "receipt_sha256": receipt_ref["sha256"]})
    if target in {"SUCCEEDED", "ROLLED_BACK"} and actor["actor_id"] == current["approval"]["actor_id"]:
        raise ClosureFailure("final verifier conflicts with cutover approver")
    if current.get("environment_class") == "production":
        if (trust.schema_version != "2.0" or trust.digest != current["approval"].get("trust_store_sha256") or
                not actor.get("organization_id")):
            raise ClosureFailure("production transition must use the approved organization Trust Store")
        if target in {"SUCCEEDED", "ROLLED_BACK"}:
            conflicted_orgs = {current["approval"].get("organization_id")}
            conflicted_orgs.update(item.get("actor", {}).get("organization_id")
                                   for item in current.get("transitions", [])
                                   if item.get("to") in {"PRECHECKED", "EXECUTING", "ROLLING_BACK", "UNKNOWN"})
            if actor["organization_id"] in conflicted_orgs:
                raise ClosureFailure("cutover final verifier organization conflicts with approval or execution")
    transition = {"from": source, "to": target, "fencing_token": fencing, "receipt": receipt_ref,
                  "actor": actor, "recorded_at": now_text()}
    record = {**current, "state": target, "version": current["version"] + 1, "fencing_token": fencing,
              "transitions": [*current["transitions"], transition]}
    return store.update("cutover", cutover_id, source, current["version"], target, record, f"CUTOVER_{target}")


def production_telemetry_profile(value: Any, cutover: dict[str, Any], max_gap_seconds: int) -> dict[str, Any]:
    required = {"schema_version", "monitor_id", "provider_account_sha256", "metrics_source_sha256",
                "collection_interval_seconds", "raw_evidence_required"}
    provider = cutover.get("provider")
    if (not isinstance(value, dict) or set(value) != required or value.get("schema_version") != "1.0" or
            value.get("raw_evidence_required") is not True or not isinstance(provider, dict)):
        raise ClosureFailure("production telemetry profile is invalid")
    monitor_id = ident(value.get("monitor_id"), "telemetry monitor_id")
    account = skill_runtime.require_digest(value.get("provider_account_sha256"), "telemetry provider_account_sha256")
    source = skill_runtime.require_digest(value.get("metrics_source_sha256"), "telemetry metrics_source_sha256")
    interval = value.get("collection_interval_seconds")
    if (account != provider.get("account_binding_sha256") or not isinstance(interval, int) or
            isinstance(interval, bool) or interval <= 0 or interval > max_gap_seconds):
        raise ClosureFailure("production telemetry profile differs from Provider account or gap policy")
    return {"schema_version": "1.0", "monitor_id": monitor_id, "provider_account_sha256": account,
            "metrics_source_sha256": source, "collection_interval_seconds": interval,
            "raw_evidence_required": True}


def telemetry_observation_receipt(value: Any, roots: tuple[Path, ...], current: dict[str, Any],
                                  sequence: int, observed_at: str, metrics: dict[str, Any]) -> dict[str, Any]:
    outer = reference(value, roots)
    try:
        payload = json.loads(read_file(Path(value["path"]), roots, 16 * 1024 * 1024))
    except json.JSONDecodeError as exc:
        raise ClosureFailure("telemetry receipt is invalid JSON") from exc
    required = {"schema_version", "monitor_id", "run_id", "sequence", "observed_at",
                "provider_account_sha256", "metrics_source_sha256", "source_event_id", "metrics"}
    profile = current.get("telemetry_profile")
    if (not isinstance(payload, dict) or set(payload) != required or payload.get("schema_version") != "1.0" or
            not isinstance(profile, dict) or payload.get("monitor_id") != profile.get("monitor_id") or
            payload.get("run_id") != current.get("run_id") or payload.get("sequence") != sequence or
            payload.get("observed_at") != observed_at or
            payload.get("provider_account_sha256") != profile.get("provider_account_sha256") or
            payload.get("metrics_source_sha256") != profile.get("metrics_source_sha256") or
            payload.get("metrics") != metrics):
        raise ClosureFailure("telemetry receipt differs from the exact soak observation tuple")
    source_event_id = ident(payload.get("source_event_id"), "telemetry source_event_id")
    return {**outer, "monitor_id": profile["monitor_id"], "source_event_id": source_event_id,
            "provider_account_sha256": profile["provider_account_sha256"],
            "metrics_source_sha256": profile["metrics_source_sha256"]}


def start_soak(workspace: Path, cutover_id: str, run_id: str, environment: str, started_at: str,
               required_seconds: int, max_gap_seconds: int, minimum_availability: float = 0.0,
               maximum_error_rate: float = 1.0, minimum_observations: int = 1,
               clock: SystemEvidenceClock | ControlledTestClock | None = None,
               telemetry_profile: dict[str, Any] | None = None) -> dict[str, Any]:
    selected_clock = evidence_clock(clock)
    cutover = Store(workspace).get("cutover", cutover_id)
    if cutover["state"] != "SUCCEEDED" or environment not in {"test", "sandbox", "production"}:
        raise ClosureFailure("soak requires successful cutover and valid environment")
    started = parse_time(started_at, "started_at")
    if started > selected_clock.now() + timedelta(seconds=MAX_CLOCK_SKEW_SECONDS):
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
        provider_profile(provider, require_exact=True)
        if (holdout_result.get("schema_version") != "2.0" or holdout_result.get("independent") is not True or
                holdout_result.get("oracle_bound") is not True):
            raise ClosureFailure("production soak requires independent Claim-specific Oracle Holdout evidence")
        holdout = Store(workspace).get("holdout", holdout_result["holdout_id"])
        if holdout.get("organization_bound") is not True:
            raise ClosureFailure("production soak requires organization-independent Holdout evidence")
        if (max_gap_seconds > PRODUCTION_MAX_GAP_SECONDS or
                minimum_observations < required_observations or minimum_availability < 0.99 or
                maximum_error_rate > 0.01):
            raise ClosureFailure("production soak requires exact provider binding and conservative telemetry policy")
        last_transition = cutover.get("transitions", [])[-1] if cutover.get("transitions") else None
        if (not isinstance(last_transition, dict) or last_transition.get("to") != "SUCCEEDED" or
                started < parse_time(last_transition.get("recorded_at"), "cutover succeeded_at") or
                (selected_clock.now() - started).total_seconds() > PRODUCTION_OBSERVATION_SKEW_SECONDS):
            raise ClosureFailure("production soak must start after cutover and near real time")
        normalized_telemetry = production_telemetry_profile(telemetry_profile, cutover, max_gap_seconds)
    else:
        if telemetry_profile is not None:
            raise ClosureFailure("production telemetry profile cannot be attached to a non-production soak")
        normalized_telemetry = None
    clock_mode = selected_clock.mode
    evidence_class = ("production-pending" if environment == "production" and clock_mode == "system"
                      else "engineering-only")
    record = {"schema_version": "1.0", "run_id": ident(run_id, "run_id"), "cutover_id": cutover_id,
              "tenant_id": cutover["tenant_id"], "environment_class": environment, "state": "RUNNING",
              "version": 0, "started_at": started_at, "required_seconds": required_seconds,
              "max_gap_seconds": max_gap_seconds, "minimum_availability": float(minimum_availability),
              "maximum_error_rate": float(maximum_error_rate), "minimum_observations": minimum_observations,
              "last_sequence": 0, "last_observed_at": None, "observations": [], "critical_failures": 0,
              "total_requests": 0, "total_errors": 0, "minimum_observed_availability": 1.0,
              "observer_ids": [], "clock_mode": clock_mode, "evidence_class": evidence_class,
              "production_protocol_simulated": environment == "production" and clock_mode != "system",
              "real_seven_day_elapsed": False,
              **({"telemetry_profile": normalized_telemetry,
                  "telemetry_profile_sha256": digest(normalized_telemetry)}
                 if normalized_telemetry is not None else {})}
    return Store(workspace).create("soak", run_id, cutover["tenant_id"], environment, "RUNNING", record, "SOAK_STARTED")


def observe_soak(workspace: Path, run_id: str, sequence: int, observed_at: str, metrics: dict[str, Any],
                 attestation: dict[str, Any], trust_path: Path,
                 clock: SystemEvidenceClock | ControlledTestClock | None = None,
                 telemetry_receipt: dict[str, Any] | None = None,
                 roots: tuple[Path, ...] = ()) -> dict[str, Any]:
    selected_clock = evidence_clock(clock)
    store, current = Store(workspace), Store(workspace).get("soak", run_id)
    if current.get("clock_mode", "system") != selected_clock.mode:
        raise ClosureFailure("soak evidence clock mode cannot change during a run")
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
    now = selected_clock.now()
    if observed > now + timedelta(seconds=MAX_CLOCK_SKEW_SECONDS):
        raise ClosureFailure("soak observation is future-dated")
    if (current["environment_class"] == "production" and
            abs((now - observed).total_seconds()) > PRODUCTION_OBSERVATION_SKEW_SECONDS):
        raise ClosureFailure("production soak observations must be recorded near real time")
    receipt = None
    if current["environment_class"] == "production":
        if telemetry_receipt is None or not roots:
            raise ClosureFailure("production soak observation requires a raw telemetry receipt")
        receipt = telemetry_observation_receipt(telemetry_receipt, roots, current, sequence, observed_at, metrics)
        metrics_sha = digest({"metrics": metrics, "telemetry_receipt_sha256": receipt["sha256"],
                              "telemetry_profile_sha256": current["telemetry_profile_sha256"]})
    else:
        if telemetry_receipt is not None:
            raise ClosureFailure("non-production soak cannot import production telemetry evidence")
        metrics_sha = digest(metrics)
    trust = skill_runtime.TrustStore.load(trust_path)
    actor = trust.verify(attestation, "operations-owner",
        {"run_id": run_id, "sequence": sequence, "observed_at": observed_at, "metrics_sha256": metrics_sha})
    if current["environment_class"] == "production":
        cutover = store.get("cutover", current["cutover_id"])
        if (trust.schema_version != "2.0" or trust.digest != cutover["approval"].get("trust_store_sha256") or
                not actor.get("organization_id")):
            raise ClosureFailure("production soak observation must use the approved organization Trust Store")
    observation = {"sequence": sequence, "observed_at": observed_at, "metrics": metrics,
                   "metrics_sha256": metrics_sha, "actor": actor,
                   **({"telemetry_receipt": receipt} if receipt is not None else {})}
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
        "minimum_observations": record.get("minimum_observations", 1),
        "clock_mode": record.get("clock_mode", "system"),
        "production_protocol_simulated": record.get("production_protocol_simulated", False),
        "telemetry_profile_sha256": record.get("telemetry_profile_sha256"),
        "observations": observations})


def soak_status(workspace: Path, run_id: str,
                clock: SystemEvidenceClock | ControlledTestClock | None = None) -> dict[str, Any]:
    selected_clock = evidence_clock(clock)
    current = Store(workspace).get("soak", ident(run_id, "run_id"))
    if current.get("clock_mode", "system") != selected_clock.mode:
        raise ClosureFailure("soak evidence clock mode cannot change during a run")
    now = selected_clock.now()
    started = parse_time(current["started_at"], "started_at")
    heartbeat = parse_time(current.get("last_observed_at") or current["started_at"], "heartbeat base")
    deadline = heartbeat + timedelta(seconds=current["max_gap_seconds"])
    running = current.get("state") == "RUNNING"
    return {"schema_version": "1.0", "run_id": current["run_id"], "state": current["state"],
            "clock_mode": selected_clock.mode, "checked_at": now.isoformat().replace("+00:00", "Z"),
            "next_sequence": current["last_sequence"] + 1 if running else None,
            "heartbeat_deadline": deadline.isoformat().replace("+00:00", "Z"),
            "heartbeat_overdue": bool(running and now > deadline),
            "elapsed_seconds": max(0, int((now - started).total_seconds())),
            "remaining_required_seconds": max(0, int(current["required_seconds"] - (now - started).total_seconds())),
            "evidence_class": current.get("evidence_class", "engineering-only"),
            "real_seven_day_elapsed": current.get("real_seven_day_elapsed", False)}


def expire_soak(workspace: Path, run_id: str, observed_at: str,
                attestation: dict[str, Any], trust_path: Path,
                clock: SystemEvidenceClock | ControlledTestClock | None = None) -> dict[str, Any]:
    selected_clock = evidence_clock(clock)
    store, current = Store(workspace), Store(workspace).get("soak", ident(run_id, "run_id"))
    status = soak_status(workspace, run_id, selected_clock)
    if current.get("state") != "RUNNING" or status["heartbeat_overdue"] is not True:
        raise ClosureFailure("soak heartbeat is not overdue")
    observed, now = parse_time(observed_at, "observed_at"), selected_clock.now()
    deadline = parse_time(status["heartbeat_deadline"], "heartbeat_deadline")
    if observed <= deadline or observed > now + timedelta(seconds=MAX_CLOCK_SKEW_SECONDS):
        raise ClosureFailure("soak expiration time does not prove a missed heartbeat")
    if (current["environment_class"] == "production" and
            abs((now - observed).total_seconds()) > PRODUCTION_OBSERVATION_SKEW_SECONDS):
        raise ClosureFailure("production soak expiration must be recorded near real time")
    sequence, evidence_root = current["last_sequence"] + 1, soak_evidence_root(current)
    payload = {"run_id": run_id, "sequence": sequence, "observed_at": observed_at,
               "target_state": "FAILED", "evidence_root": evidence_root,
               "heartbeat_deadline": status["heartbeat_deadline"], "reason": "HEARTBEAT_TIMEOUT"}
    trust = skill_runtime.TrustStore.load(trust_path)
    actor = trust.verify(attestation, "production-verifier", payload)
    cutover = store.get("cutover", current["cutover_id"])
    if actor["actor_id"] in set(current.get("observer_ids", [])) | {cutover["approval"]["actor_id"]}:
        raise ClosureFailure("soak timeout verifier must be independent from observers and cutover approver")
    if current["environment_class"] == "production":
        observer_orgs = {item.get("actor", {}).get("organization_id") for item in current["observations"]}
        if (trust.schema_version != "2.0" or trust.digest != cutover["approval"].get("trust_store_sha256") or
                not actor.get("organization_id") or
                actor["organization_id"] in observer_orgs | {cutover["approval"].get("organization_id")}):
            raise ClosureFailure("soak timeout verifier organization conflicts with observers or approver")
    record = {**current, "state": "FAILED", "version": current["version"] + 1,
              "last_sequence": sequence, "last_observed_at": observed_at,
              "duration_seconds": max(0, (observed - parse_time(current["started_at"], "started_at")).total_seconds()),
              "evidence_root": evidence_root, "final_verifier": actor,
              "terminal_reason": "HEARTBEAT_TIMEOUT", "heartbeat_deadline": status["heartbeat_deadline"],
              "real_seven_day_elapsed": False,
              "evidence_class": ("production" if current["environment_class"] == "production" and
                                   selected_clock.mode == "system" else "engineering-only")}
    return store.update("soak", run_id, "RUNNING", current["version"], "FAILED", record, "SOAK_FAILED")


def finish_soak(workspace: Path, run_id: str, sequence: int, observed_at: str,
                attestation: dict[str, Any], trust_path: Path,
                clock: SystemEvidenceClock | ControlledTestClock | None = None) -> dict[str, Any]:
    selected_clock = evidence_clock(clock)
    store, current = Store(workspace), Store(workspace).get("soak", run_id)
    if current.get("clock_mode", "system") != selected_clock.mode:
        raise ClosureFailure("soak evidence clock mode cannot change during a run")
    if sequence != current["last_sequence"] + 1:
        raise ClosureFailure("soak final sequence is invalid")
    observed = parse_time(observed_at, "observed_at")
    if current["last_observed_at"] is None:
        raise ClosureFailure("soak run has no observations")
    last_observed = parse_time(current["last_observed_at"], "last_observed_at")
    if observed <= last_observed or (observed - last_observed).total_seconds() > current["max_gap_seconds"]:
        raise ClosureFailure("final soak observation is non-monotonic or exceeds gap")
    now = selected_clock.now()
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
    trust = skill_runtime.TrustStore.load(trust_path)
    actor = trust.verify(attestation, "production-verifier",
        {"run_id": run_id, "sequence": sequence, "observed_at": observed_at, "target_state": target,
         "evidence_root": root})
    cutover = store.get("cutover", current["cutover_id"])
    if actor["actor_id"] in set(current.get("observer_ids", [])) | {cutover["approval"]["actor_id"]}:
        raise ClosureFailure("final soak verifier must be independent from observers and cutover approver")
    if current["environment_class"] == "production":
        observer_orgs = {item.get("actor", {}).get("organization_id") for item in current["observations"]}
        if (trust.schema_version != "2.0" or trust.digest != cutover["approval"].get("trust_store_sha256") or
                not actor.get("organization_id") or
                actor["organization_id"] in observer_orgs | {cutover["approval"].get("organization_id")}):
            raise ClosureFailure("final soak verifier organization conflicts with observers or approver")
    record = {**current, "version": current["version"] + 1, "state": target, "last_sequence": sequence,
              "last_observed_at": observed_at, "duration_seconds": duration, "error_rate": error_rate,
              "evidence_root": root, "final_verifier": actor,
              "real_seven_day_elapsed": bool(current["environment_class"] == "production" and
                                               selected_clock.mode == "system" and
                                               duration >= PRODUCTION_SOAK_SECONDS),
              "evidence_class": ("production" if current["environment_class"] == "production" and
                                  selected_clock.mode == "system" else "engineering-only")}
    return store.update("soak", run_id, "RUNNING", current["version"], target, record, f"SOAK_{target}")


def import_assessment(workspace: Path, path: Path, attestation: dict[str, Any], trust_path: Path,
                      roots: tuple[Path, ...], *, authority_policy_path: Path | None = None,
                      authority_approval: dict[str, Any] | None = None,
                      internal_trust_path: Path | None = None) -> dict[str, Any]:
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
        actors.update(record.get("oracle_owner_ids", []))
        actors.update(record.get("observer_ids", []))
        actors.update(item.get("actor", {}).get("actor_id") for item in record.get("transitions", []))
    conflict_organizations = {item.get("organization_id") for record in tenant_records for item in
        (record.get("authorization"), record.get("custodian"), record.get("approval"),
         record.get("final_verifier"), record.get("executor"), record.get("verifier")) if isinstance(item, dict)}
    for record in tenant_records:
        conflict_organizations.update(item.get("actor", {}).get("organization_id")
                                      for item in record.get("transitions", []))
        conflict_organizations.update(item.get("actor", {}).get("organization_id")
                                      for item in record.get("observations", []))
    eligible_soaks = {record.get("evidence_root"): record for record in tenant_records
                      if record.get("state") == "PASSED" and "run_id" in record}
    matched_soak = eligible_soaks.get(value["evidence_root"])
    if matched_soak is None:
        raise ClosureFailure("assessment evidence_root is not a PASSED tenant soak run")
    external_authority_record = None
    assessment_trust = skill_runtime.TrustStore.load(trust_path)
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
        if authority_policy_path is None or authority_approval is None or internal_trust_path is None:
            raise ClosureFailure("production assessment requires a digest-pinned external certification authority")
        try:
            assessment_trust, external_authority_record = external_authority.authorize(
                authority_policy_path, authority_approval, internal_trust_path, trust_path,
                tenant_id, "independent-certification", roots)
        except external_authority.ExternalAuthorityError as exc:
            raise ClosureFailure(str(exc)) from exc
    if certifier_id in actors:
        raise ClosureFailure("independent certifier conflicts with execution roles")
    actor = assessment_trust.verify(attestation, "independent-certifier",
        {"assessment_id": assessment_id, "tenant_id": tenant_id, "report_sha256": report_sha,
         "evidence_root": value["evidence_root"], "decision": value["decision"]})
    if (matched_soak.get("environment_class") == "production" and
            (actor.get("authority_class") != "certification-body" or
             actor.get("organization_id") in conflict_organizations)):
        raise ClosureFailure("production certifier organization is not independent from execution")
    record = {**value, "report_sha256": report_sha, "certifier": actor, "certified": False,
              "local_effect": "EXTERNAL_EVIDENCE_IMPORTED",
              "external_authority_authorized": external_authority_record is not None,
              **({"external_authority": external_authority_record}
                 if external_authority_record is not None else {}),
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
    records = {kind: [] for kind in counts}
    for row in rows:
        counts[row["kind"]] += 1
        record = json.loads(row["record_json"])
        record["_stored_environment_class"] = row["environment_class"]
        records[row["kind"]].append(record)
    if not rows:
        return {"schema_version": "1.0", "tenant_id": tenant_id, "decision": "NOT_RUN", "certified": False,
                "counts": counts, "findings": store.chain_findings(), "selected_chain": None,
                "evaluated_chains": 0, "ignored_historical_chains": 0,
                "production_status": "NOT_CERTIFIED", "external_runtime_status": "NOT_RUN"}

    snapshots = {record.get("snapshot_id"): record for record in records["snapshot"]}
    holdouts = {record.get("holdout_id"): record for record in records["holdout"]}
    results = {record.get("result_id"): record for record in records["holdout-result"]}
    cutovers = {record.get("cutover_id"): record for record in records["cutover"]}

    def evaluate(soak: dict[str, Any]) -> dict[str, Any]:
        chain_findings: list[str] = []
        cutover = cutovers.get(soak.get("cutover_id"))
        if cutover is None or cutover.get("tenant_id") != tenant_id:
            chain_findings.append("soak does not resolve to a same-tenant cutover")
        elif cutover.get("state") != "SUCCEEDED":
            chain_findings.append("cutover has not reached SUCCEEDED")

        snapshot = snapshots.get(cutover.get("snapshot_id")) if cutover else None
        if snapshot is None or snapshot.get("tenant_id") != tenant_id:
            chain_findings.append("cutover does not resolve to a same-tenant snapshot")

        result = results.get(cutover.get("holdout_result_id")) if cutover else None
        if cutover and result is None and cutover.get("schema_version") == "1.0":
            legacy = [record for record in records["holdout-result"]
                      if record.get("target_release_sha256") == cutover.get("target_release_sha256")]
            if len(legacy) == 1:
                result = legacy[0]
            else:
                chain_findings.append("legacy cutover does not resolve exactly one Holdout result")
        if result is None or result.get("tenant_id") != tenant_id:
            chain_findings.append("cutover does not resolve to a same-tenant Holdout result")
        elif result.get("decision") != "PASS" or result.get("independent") is not True:
            chain_findings.append("independent Holdout result has not passed")

        holdout = holdouts.get(result.get("holdout_id")) if result else None
        if holdout is None or holdout.get("tenant_id") != tenant_id:
            chain_findings.append("Holdout result does not resolve to a same-tenant sealed Holdout")

        if soak.get("state") != "PASSED":
            chain_findings.append("soak run has not reached PASSED")
        matching_assessments = [record for record in records["assessment"]
                                if record.get("evidence_root") == soak.get("evidence_root")]
        valid_assessments = []
        for assessment in matching_assessments:
            try:
                unexpired = parse_time(assessment.get("expires_at"), "assessment expires_at") > utc_now()
            except ClosureFailure:
                unexpired = False
            if unexpired and assessment.get("decision") != "INCONCLUSIVE":
                valid_assessments.append(assessment)
        if not valid_assessments:
            chain_findings.append("soak evidence lacks a current conclusive independent assessment")

        production = bool(snapshot and holdout and result and cutover and
            snapshot.get("environment_class") == "production" and
            holdout.get("environment_class") == "production" and
            cutover.get("environment_class") == "production" and
            soak.get("environment_class") == "production" and soak.get("clock_mode") == "system" and
            soak.get("real_seven_day_elapsed") is True and soak.get("evidence_class") == "production")
        if production:
            provider = cutover.get("provider")
            if (cutover.get("schema_version") != "2.0" or result.get("schema_version") != "2.0" or
                    result.get("oracle_bound") is not True or not isinstance(provider, dict) or
                    result.get("target_release_sha256") != cutover.get("target_release_sha256") or
                    result.get("provider_account_sha256") != provider.get("account_binding_sha256")):
                chain_findings.append("production chain lacks exact release, Provider, and Claim-Oracle bindings")
            positive = [record for record in valid_assessments if record.get("decision") == "CERTIFIED" and
                        record.get("external_authority_authorized") is True and
                        record.get("schema_version") == "2.0" and record.get("run_id") == soak.get("run_id") and
                        record.get("cutover_id") == cutover.get("cutover_id") and
                        record.get("target_release_sha256") == cutover.get("target_release_sha256") and
                        isinstance(provider, dict) and
                        record.get("provider_account_sha256") == provider.get("account_binding_sha256")]
            if not positive:
                chain_findings.append("production soak evidence lacks exact positive independent assessment coverage")

        return {"run_id": soak.get("run_id"), "production": production, "findings": chain_findings,
                "chain": {"snapshot_id": snapshot.get("snapshot_id") if snapshot else None,
                          "holdout_id": holdout.get("holdout_id") if holdout else None,
                          "result_id": result.get("result_id") if result else None,
                          "cutover_id": cutover.get("cutover_id") if cutover else None,
                          "run_id": soak.get("run_id"),
                          "assessment_ids": sorted(record["assessment_id"] for record in valid_assessments)}}

    evaluations = [evaluate(soak) for soak in records["soak"]]
    eligible = [item for item in evaluations if not item["findings"]]
    eligible.sort(key=lambda item: (item["production"], item["run_id"] or ""), reverse=True)
    selected = eligible[0] if eligible else (min(evaluations, key=lambda item: len(item["findings"]))
                                             if evaluations else None)
    integrity_findings = store.chain_findings()
    findings = [*integrity_findings, *(selected["findings"] if selected and not eligible else [])]
    if not evaluations:
        findings.append("tenant has no soak evidence chain")
    if integrity_findings or not eligible:
        decision = "BLOCKED"
    else:
        decision = "READY_FOR_EXTERNAL_GATE" if selected["production"] else "LOCAL_TOOLKIT_PASS"
    return {"schema_version": "1.0", "tenant_id": tenant_id, "decision": decision, "certified": False,
            "counts": counts, "findings": findings, "selected_chain": selected["chain"] if selected else None,
            "evaluated_chains": len(evaluations),
            "ignored_historical_chains": max(0, len(evaluations) - (1 if selected else 0)),
            "production_status": "NOT_CERTIFIED",
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
    start.add_argument("--telemetry-profile", type=Path)
    observe = sub.add_parser("observe-soak")
    observe.add_argument("--workspace", type=Path, required=True)
    observe.add_argument("--run-id", required=True)
    observe.add_argument("--sequence", type=int, required=True)
    observe.add_argument("--observed-at", required=True)
    observe.add_argument("--metrics", type=Path, required=True)
    observe.add_argument("--attestation", type=Path, required=True)
    observe.add_argument("--trust-store", type=Path, required=True)
    observe.add_argument("--telemetry-receipt", type=Path)
    observe.add_argument("--evidence-root", type=Path, action="append")
    finish = sub.add_parser("finish-soak")
    finish.add_argument("--workspace", type=Path, required=True)
    finish.add_argument("--run-id", required=True)
    finish.add_argument("--sequence", type=int, required=True)
    finish.add_argument("--observed-at", required=True)
    finish.add_argument("--attestation", type=Path, required=True)
    finish.add_argument("--trust-store", type=Path, required=True)
    watchdog = sub.add_parser("soak-status")
    watchdog.add_argument("--workspace", type=Path, required=True)
    watchdog.add_argument("--run-id", required=True)
    expire = sub.add_parser("expire-soak")
    expire.add_argument("--workspace", type=Path, required=True)
    expire.add_argument("--run-id", required=True)
    expire.add_argument("--observed-at", required=True)
    expire.add_argument("--attestation", type=Path, required=True)
    expire.add_argument("--trust-store", type=Path, required=True)
    assessment = evidence_command("import-assessment")
    assessment.add_argument("--report", type=Path, required=True)
    assessment.add_argument("--attestation", type=Path, required=True)
    assessment.add_argument("--external-authority-policy", type=Path)
    assessment.add_argument("--authority-approval", type=Path)
    assessment.add_argument("--internal-trust-store", type=Path)
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
                            args.minimum_availability, args.maximum_error_rate, args.minimum_observations,
                            telemetry_profile=(json_file(args.telemetry_profile, "telemetry profile")
                                               if args.telemetry_profile else None))
    elif args.command == "observe-soak":
        observe_roots = tuple(path.expanduser().resolve(strict=True) for path in (args.evidence_root or []))
        result = observe_soak(args.workspace, args.run_id, args.sequence, args.observed_at,
            json_file(args.metrics, "metrics"), json_file(args.attestation, "attestation"), args.trust_store,
            telemetry_receipt=(json_file(args.telemetry_receipt, "telemetry receipt reference")
                               if args.telemetry_receipt else None), roots=observe_roots)
    elif args.command == "finish-soak":
        result = finish_soak(args.workspace, args.run_id, args.sequence, args.observed_at,
                             json_file(args.attestation, "attestation"), args.trust_store)
    elif args.command == "soak-status":
        result = soak_status(args.workspace, args.run_id)
    elif args.command == "expire-soak":
        result = expire_soak(args.workspace, args.run_id, args.observed_at,
                             json_file(args.attestation, "attestation"), args.trust_store)
    elif args.command == "import-assessment":
        result = import_assessment(args.workspace, args.report, json_file(args.attestation, "attestation"),
                                   args.trust_store, roots,
                                   authority_policy_path=args.external_authority_policy,
                                   authority_approval=(json_file(args.authority_approval, "authority approval")
                                                       if args.authority_approval else None),
                                   internal_trust_path=args.internal_trust_store)
    elif args.command == "readiness":
        result = readiness(args.workspace, args.tenant_id)
    else:
        raise AssertionError(args.command)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
