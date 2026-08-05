#!/usr/bin/env python3
"""Transactional runtime for the Batch 01-44 complete Skill system.

The runtime binds all 8,149 Claims to immutable Oracles and 44 allowlisted
domain-result handlers.  Repository content cannot choose an executable.
Unsigned, self-verified, generic-command, stale, incomplete-corpus and
unreconciled production records never satisfy a Claim.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import sqlite3
import stat
import subprocess
import sys
import tempfile
import time
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any, Iterator


RUNTIME_ROOT = Path(__file__).resolve().parent
SYSTEM_ROOT = RUNTIME_ROOT.parent
if str(RUNTIME_ROOT) not in sys.path:
    sys.path.insert(0, str(RUNTIME_ROOT))

from domain_handlers import DomainHandlerError, execute_handler


CLAIM_REGISTRY_PATH = RUNTIME_ROOT / "claim-oracle-registry.json"
EXECUTOR_REGISTRY_PATH = RUNTIME_ROOT / "domain-executor-registry.json"
MAX_FILE_BYTES = 512 * 1024 * 1024
MAX_SOURCE_FILES = 100_000
OUTCOMES = {"PASS", "FAIL", "INCONCLUSIVE", "BLOCKED", "NOT_RUN"}
CORPORA = {"development", "negative", "holdout", "representative", "production"}


class RuntimeFailure(ValueError):
    pass


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")


def digest_bytes(value: bytes) -> str:
    return "sha256:" + hashlib.sha256(value).hexdigest()


def canonical_digest(value: Any) -> str:
    return digest_bytes(canonical_bytes(value))


def require_digest(value: Any, label: str) -> str:
    if not isinstance(value, str) or len(value) != 71 or not value.startswith("sha256:"):
        raise RuntimeFailure(f"{label} must be sha256:<64 lowercase hex>")
    try:
        int(value[7:], 16)
    except ValueError as exc:
        raise RuntimeFailure(f"{label} must be sha256:<64 lowercase hex>") from exc
    if value != value.lower():
        raise RuntimeFailure(f"{label} must be lowercase")
    return value


def now_text() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def parse_time(value: Any, label: str) -> datetime:
    if not isinstance(value, str) or not value:
        raise RuntimeFailure(f"{label} is required")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise RuntimeFailure(f"{label} must be ISO-8601") from exc
    if parsed.tzinfo is None:
        raise RuntimeFailure(f"{label} must include a timezone")
    return parsed.astimezone(timezone.utc)


def read_regular(path: Path, maximum: int, label: str) -> bytes:
    flags = os.O_RDONLY | getattr(os, "O_CLOEXEC", 0) | getattr(os, "O_NOFOLLOW", 0)
    descriptor = os.open(path, flags)
    try:
        observed = os.fstat(descriptor)
        if not stat.S_ISREG(observed.st_mode) or observed.st_size > maximum:
            raise RuntimeFailure(f"{label} must be a bounded regular file")
        chunks: list[bytes] = []
        remaining = observed.st_size
        while remaining:
            chunk = os.read(descriptor, min(65536, remaining))
            if not chunk:
                raise RuntimeFailure(f"{label} changed while being read")
            chunks.append(chunk)
            remaining -= len(chunk)
        if os.read(descriptor, 1):
            raise RuntimeFailure(f"{label} changed while being read")
        return b"".join(chunks)
    finally:
        os.close(descriptor)


def confined(path: Path, roots: tuple[Path, ...]) -> Path:
    resolved = path.expanduser().resolve(strict=True)
    if not any(resolved == root or root in resolved.parents for root in roots):
        raise RuntimeFailure("evidence path escapes approved roots")
    return resolved


@dataclass(frozen=True)
class Claim:
    batch: int
    skill: str
    claim_type: str
    claim_index: int
    text: str
    sha256: str
    oracle_id: str
    executor_id: str
    corpora: tuple[str, ...]


@dataclass(frozen=True)
class Registry:
    payload: dict[str, Any]
    digest: str
    by_claim: dict[tuple[str, str, int], Claim]
    by_skill: dict[str, tuple[Claim, ...]]
    executors: dict[int, dict[str, Any]]

    @classmethod
    @lru_cache(maxsize=1)
    def load(cls) -> "Registry":
        payload = json.loads(CLAIM_REGISTRY_PATH.read_text(encoding="utf-8"))
        executors_payload = json.loads(EXECUTOR_REGISTRY_PATH.read_text(encoding="utf-8"))
        entries = payload.get("entries")
        if (payload.get("schema_version") != "1.0" or payload.get("namespace") != "batch-01-44-complete-skill-system" or
                payload.get("skill_count") != 788 or not isinstance(entries, list) or payload.get("claim_count") != len(entries)):
            raise RuntimeFailure("Claim-Oracle registry identity/count is invalid")
        by_claim: dict[tuple[str, str, int], Claim] = {}
        grouped: dict[str, list[Claim]] = {}
        for entry in entries:
            key = (entry.get("skill"), entry.get("claim_type"), entry.get("claim_index")) if isinstance(entry, dict) else None
            if (not isinstance(key, tuple) or not isinstance(key[0], str) or key[1] not in {"output", "test", "external"} or
                    not isinstance(key[2], int) or key in by_claim):
                raise RuntimeFailure("Claim-Oracle identity is invalid or duplicated")
            text = entry.get("claim")
            corpora = entry.get("required_corpora")
            if (not isinstance(text, str) or not text or entry.get("claim_sha256") != canonical_digest(text) or
                    not isinstance(corpora, list) or not corpora or any(item not in CORPORA for item in corpora)):
                raise RuntimeFailure("Claim-Oracle content/corpus binding is invalid")
            claim = Claim(
                batch=entry["batch"], skill=key[0], claim_type=key[1], claim_index=key[2], text=text,
                sha256=entry["claim_sha256"], oracle_id=entry["oracle_id"], executor_id=entry["executor_id"],
                corpora=tuple(corpora),
            )
            by_claim[key] = claim
            grouped.setdefault(claim.skill, []).append(claim)
        if len(grouped) != 788:
            raise RuntimeFailure("Claim-Oracle registry does not cover exactly 788 Skills")
        executor_entries = executors_payload.get("entries")
        if (executors_payload.get("namespace") != payload["namespace"] or executors_payload.get("executor_count") != 44 or
                not isinstance(executor_entries, list) or len(executor_entries) != 44):
            raise RuntimeFailure("domain-executor registry identity/count is invalid")
        executors = {entry["batch"]: entry for entry in executor_entries}
        if sorted(executors) != list(range(1, 45)) or len({item["handler"] for item in executors.values()}) != 44:
            raise RuntimeFailure("44 Batch domain executors are not uniquely registered")
        if any(item.get("repository_commands_allowed") is not False or item.get("requires_actual_toolchain") is not True for item in executors.values()):
            raise RuntimeFailure("domain-executor policy was weakened")
        return cls(payload, canonical_digest(payload), by_claim, {key: tuple(value) for key, value in grouped.items()}, executors)

    def claim(self, skill: str, claim_type: str, claim_index: int) -> Claim:
        try:
            return self.by_claim[(skill, claim_type, claim_index)]
        except KeyError as exc:
            raise RuntimeFailure("Claim is not registered") from exc


@dataclass(frozen=True)
class Actor:
    actor_id: str
    key_id: str
    roles: frozenset[str]
    public_key: bytes
    not_before: datetime
    not_after: datetime


@dataclass(frozen=True)
class TrustStore:
    path: Path
    digest: str
    actors: dict[str, Actor]
    revoked_records: frozenset[str]

    @classmethod
    def load(cls, path: Path) -> "TrustStore":
        resolved = path.expanduser().resolve(strict=True)
        raw = read_regular(resolved, 1024 * 1024, "actor trust store")
        payload = json.loads(raw.decode("utf-8"))
        entries = payload.get("actors")
        if payload.get("schema_version") != "1.0" or not isinstance(entries, list):
            raise RuntimeFailure("actor trust store identity is invalid")
        actors: dict[str, Actor] = {}
        actor_ids: set[str] = set()
        key_ids: set[str] = set()
        key_digests: dict[str, str] = {}
        for index, entry in enumerate(entries):
            if not isinstance(entry, dict):
                raise RuntimeFailure(f"actors[{index}] is invalid")
            actor_id, key_id, roles, relative = (entry.get("actor_id"), entry.get("key_id"), entry.get("roles"), entry.get("public_key_path"))
            if (not isinstance(actor_id, str) or not actor_id or actor_id in actor_ids or not isinstance(key_id, str) or not key_id or
                    key_id in key_ids or not isinstance(roles, list) or not roles or any(not isinstance(role, str) or not role for role in roles) or
                    not isinstance(relative, str) or not relative):
                raise RuntimeFailure(f"actors[{index}] identity/roles are invalid")
            key_path = (resolved.parent / relative).resolve(strict=True)
            if resolved.parent not in key_path.parents:
                raise RuntimeFailure(f"actors[{index}] public key escapes trust-store directory")
            public_key = read_regular(key_path, 65536, f"public key {key_id}")
            key_digests[key_id] = digest_bytes(public_key)
            actor_ids.add(actor_id)
            key_ids.add(key_id)
            if entry.get("revoked") is True:
                continue
            actors[actor_id] = Actor(actor_id, key_id, frozenset(roles), public_key,
                                     parse_time(entry.get("not_before"), "not_before"), parse_time(entry.get("not_after"), "not_after"))
        revoked = payload.get("revoked_record_ids", [])
        if not isinstance(revoked, list) or any(not isinstance(item, str) or not item for item in revoked):
            raise RuntimeFailure("revoked_record_ids is invalid")
        return cls(resolved, canonical_digest({"store": hashlib.sha256(raw).hexdigest(), "keys": key_digests}), actors, frozenset(revoked))

    def verify(self, envelope: Any, role: str, bindings: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(envelope, dict) or set(envelope) != {"algorithm", "key_id", "payload", "signature"}:
            raise RuntimeFailure("signed actor envelope fields are invalid")
        payload = envelope.get("payload")
        if envelope.get("algorithm") != "ed25519" or not isinstance(payload, dict):
            raise RuntimeFailure("signed actor envelope must use Ed25519")
        actor = self.actors.get(payload.get("actor_id"))
        if actor is None or actor.key_id != envelope.get("key_id") or role not in actor.roles:
            raise RuntimeFailure(f"signed actor is unknown, revoked, key-mismatched, or lacks role {role}")
        observed = datetime.now(timezone.utc)
        issued, expires = parse_time(payload.get("issued_at"), "issued_at"), parse_time(payload.get("expires_at"), "expires_at")
        record_id = payload.get("record_id")
        if (not actor.not_before <= observed < actor.not_after or not issued <= observed < expires or expires <= issued or
                not isinstance(record_id, str) or not record_id or record_id in self.revoked_records):
            raise RuntimeFailure("actor key or signed record is expired, invalid, or revoked")
        for field, expected in bindings.items():
            if payload.get(field) != expected:
                raise RuntimeFailure(f"signed actor binding mismatch: {field}")
        try:
            encoded = envelope.get("signature")
            if not isinstance(encoded, str) or not encoded:
                raise ValueError("missing")
            signature = base64.b64decode(encoded.replace("-", "+").replace("_", "/") + "=" * (-len(encoded) % 4), validate=True)
        except (TypeError, ValueError) as exc:
            raise RuntimeFailure("signed actor signature is invalid base64") from exc
        with tempfile.TemporaryDirectory(prefix="skill-system-signature-") as directory:
            base = Path(directory)
            (base / "payload.json").write_bytes(canonical_bytes(payload))
            (base / "signature.bin").write_bytes(signature)
            (base / "public.pem").write_bytes(actor.public_key)
            completed = subprocess.run(
                ["openssl", "pkeyutl", "-verify", "-pubin", "-inkey", str(base / "public.pem"), "-rawin",
                 "-in", str(base / "payload.json"), "-sigfile", str(base / "signature.bin")],
                check=False, capture_output=True, timeout=10,
            )
        if completed.returncode:
            raise RuntimeFailure("signed actor signature verification failed")
        return {"actor_id": actor.actor_id, "key_id": actor.key_id, "role": role, "record_id": record_id,
                "payload_sha256": canonical_digest(payload), "trust_store_sha256": self.digest}


def source_fingerprint(source: Path, excluded: Path | None = None) -> str:
    source = source.resolve(strict=True)
    rows = []
    for path in sorted(source.rglob("*")):
        if path.is_symlink() or not path.is_file() or ".git" in path.parts:
            continue
        resolved = path.resolve()
        if excluded is not None and (resolved == excluded or excluded in resolved.parents):
            continue
        if len(rows) >= MAX_SOURCE_FILES:
            raise RuntimeFailure("source exceeds the bounded file inventory")
        data = read_regular(resolved, MAX_FILE_BYTES, "source file")
        rows.append({"path": resolved.relative_to(source).as_posix(), "sha256": digest_bytes(data), "bytes": len(data)})
    return canonical_digest(rows)


def workspace_paths(workspace: Path) -> dict[str, Path]:
    root = workspace.expanduser().resolve()
    return {"root": root, "database": root / "state.sqlite3", "objects": root / "objects" / "sha256",
            "evidence": root / "evidence", "verifications": root / "verifications"}


def connect(workspace: Path) -> sqlite3.Connection:
    path = workspace_paths(workspace)["database"]
    connection = sqlite3.connect(path, timeout=30, isolation_level=None)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute("PRAGMA synchronous=FULL")
    connection.execute("PRAGMA foreign_keys=ON")
    connection.execute("PRAGMA busy_timeout=30000")
    return connection


@contextmanager
def transaction(connection: sqlite3.Connection) -> Iterator[sqlite3.Connection]:
    connection.execute("BEGIN IMMEDIATE")
    try:
        yield connection
    except Exception:
        connection.rollback()
        raise
    else:
        connection.commit()


def append_event(connection: sqlite3.Connection, event_type: str, record_digest: str) -> None:
    previous = connection.execute("SELECT event_hash FROM events ORDER BY sequence DESC LIMIT 1").fetchone()
    previous_hash = previous[0] if previous else "GENESIS"
    created = now_text()
    event_hash = canonical_digest({"event_type": event_type, "record_sha256": record_digest, "previous_hash": previous_hash, "created_at": created})
    connection.execute("INSERT INTO events(event_type,record_sha256,previous_hash,event_hash,created_at) VALUES(?,?,?,?,?)",
                       (event_type, record_digest, previous_hash, event_hash, created))


def initialize_workspace(workspace: Path, source: Path, trust_store: Path) -> dict[str, Any]:
    paths = workspace_paths(workspace)
    for key in ("root", "objects", "evidence", "verifications"):
        paths[key].mkdir(parents=True, exist_ok=True)
    registry, trust = Registry.load(), TrustStore.load(trust_store)
    metadata = {
        "schema_version": "1.0", "created_at": now_text(), "source_root": str(source.resolve(strict=True)),
        "source_fingerprint": source_fingerprint(source, paths["root"]), "claim_registry_sha256": registry.digest,
        "trust_store_path": str(trust.path), "trust_store_sha256": trust.digest,
        "runtime_status": "INITIALIZED", "production_status": "NOT_CERTIFIED",
    }
    connection = connect(workspace)
    try:
        connection.executescript("""
        CREATE TABLE IF NOT EXISTS metadata(singleton INTEGER PRIMARY KEY CHECK(singleton=1), payload TEXT NOT NULL, sha256 TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS evidence(evidence_id TEXT PRIMARY KEY, skill TEXT NOT NULL, claim_type TEXT NOT NULL, claim_index INTEGER NOT NULL, corpus_role TEXT NOT NULL, record_json TEXT NOT NULL, record_sha256 TEXT NOT NULL, identity_sha256 TEXT NOT NULL UNIQUE);
        CREATE TABLE IF NOT EXISTS verifications(verification_id TEXT PRIMARY KEY, evidence_id TEXT NOT NULL REFERENCES evidence(evidence_id), record_json TEXT NOT NULL, record_sha256 TEXT NOT NULL, identity_sha256 TEXT NOT NULL UNIQUE);
        CREATE TABLE IF NOT EXISTS events(sequence INTEGER PRIMARY KEY AUTOINCREMENT, event_type TEXT NOT NULL, record_sha256 TEXT NOT NULL, previous_hash TEXT NOT NULL, event_hash TEXT NOT NULL, created_at TEXT NOT NULL);
        """)
        with transaction(connection):
            existing = connection.execute("SELECT payload FROM metadata WHERE singleton=1").fetchone()
            if existing:
                observed = json.loads(existing[0])
                for field in ("source_root", "source_fingerprint", "claim_registry_sha256", "trust_store_sha256"):
                    if observed.get(field) != metadata[field]:
                        raise RuntimeFailure(f"workspace immutable binding changed: {field}")
                return observed
            encoded = canonical_bytes(metadata).decode("utf-8")
            connection.execute("INSERT INTO metadata VALUES(1,?,?)", (encoded, canonical_digest(metadata)))
            append_event(connection, "workspace.initialized", canonical_digest(metadata))
    finally:
        connection.close()
    return metadata


def metadata(workspace: Path) -> dict[str, Any]:
    connection = connect(workspace)
    try:
        row = connection.execute("SELECT payload,sha256 FROM metadata WHERE singleton=1").fetchone()
    finally:
        connection.close()
    if row is None:
        raise RuntimeFailure("workspace is not initialized")
    value = json.loads(row[0])
    if canonical_digest(value) != row[1]:
        raise RuntimeFailure("workspace metadata digest is invalid")
    return value


def workspace_trust(workspace: Path) -> TrustStore:
    value = metadata(workspace)
    trust = TrustStore.load(Path(value["trust_store_path"]))
    if trust.digest != value["trust_store_sha256"]:
        raise RuntimeFailure("workspace trust store changed after initialization")
    return trust


def store_object(workspace: Path, data: bytes) -> dict[str, Any]:
    paths = workspace_paths(workspace)
    sha256 = digest_bytes(data)
    path = paths["objects"] / sha256[7:]
    if path.exists():
        if read_regular(path, MAX_FILE_BYTES, "content object") != data:
            raise RuntimeFailure("content-addressed object collision")
    else:
        temporary = path.with_suffix(f".tmp-{os.getpid()}-{time.time_ns()}")
        temporary.write_bytes(data)
        temporary.chmod(0o444)
        try:
            os.replace(temporary, path)
        finally:
            if temporary.exists():
                temporary.unlink()
    return {"sha256": sha256, "bytes": len(data), "object_path": str(path.relative_to(paths["root"]))}


def verify_claim_subject(subject: Any, claim: Claim, corpus_role: str, outcome: str) -> None:
    required = {"schema_version", "oracle_id", "executor_id", "batch", "skill", "claim", "corpus_role", "decision", "checks", "limitations"}
    if not isinstance(subject, dict) or set(subject) != required:
        raise RuntimeFailure("Claim-Oracle result fields are invalid")
    if outcome not in OUTCOMES:
        raise RuntimeFailure("Claim-Oracle result outcome is invalid")
    if (subject.get("schema_version") != "1.0" or subject.get("oracle_id") != claim.oracle_id or
            subject.get("executor_id") != claim.executor_id or subject.get("batch") != claim.batch or subject.get("skill") != claim.skill or
            subject.get("claim") != {"type": claim.claim_type, "index": claim.claim_index, "sha256": claim.sha256} or
            subject.get("corpus_role") != corpus_role or corpus_role not in claim.corpora or subject.get("decision") != outcome):
        raise RuntimeFailure("Claim-Oracle result binding is invalid")
    checks = subject.get("checks")
    if not isinstance(checks, list) or not checks or any(not isinstance(item, dict) or set(item) != {"name", "outcome", "detail"} for item in checks):
        raise RuntimeFailure("Claim-Oracle result checks are invalid")
    if outcome == "PASS" and any(item.get("outcome") != "PASS" for item in checks):
        raise RuntimeFailure("Claim-Oracle PASS contains a non-PASS check")
    if not isinstance(subject.get("limitations"), list) or any(not isinstance(item, str) for item in subject["limitations"]):
        raise RuntimeFailure("Claim-Oracle limitations are invalid")


def materialize_domain_result(result_file: Path, evidence_roots: tuple[Path, ...]) -> dict[str, Any]:
    payload = json.loads(read_regular(confined(result_file, evidence_roots), 8 * 1024 * 1024, "domain result").decode("utf-8"))
    required = {"schema_version", "batch", "skill", "executor_id", "claim", "corpus", "source_fingerprint", "environment", "domain_contract", "toolchain", "assertions", "raw_evidence", "decision", "limitations"}
    if not isinstance(payload, dict) or set(payload) != required or payload.get("schema_version") != "1.0":
        raise RuntimeFailure("domain result fields are invalid")
    registry = Registry.load()
    claim_value = payload.get("claim")
    if not isinstance(claim_value, dict) or set(claim_value) != {"type", "index", "sha256"}:
        raise RuntimeFailure("domain result Claim is invalid")
    claim = registry.claim(payload.get("skill"), claim_value.get("type"), claim_value.get("index"))
    executor = registry.executors.get(claim.batch)
    if (payload.get("batch") != claim.batch or payload.get("executor_id") != claim.executor_id or claim_value.get("sha256") != claim.sha256 or
            executor is None or executor["executor_id"] != claim.executor_id):
        raise RuntimeFailure("domain result Claim/executor binding is invalid")
    corpus = payload.get("corpus")
    if not isinstance(corpus, dict) or set(corpus) != {"role", "id", "sha256", "independent"}:
        raise RuntimeFailure("domain result corpus is invalid")
    corpus_role = corpus.get("role")
    require_digest(corpus.get("sha256"), "corpus.sha256")
    if corpus_role not in claim.corpora or not isinstance(corpus.get("id"), str) or not corpus["id"]:
        raise RuntimeFailure("domain result corpus is not eligible")
    if corpus_role in {"holdout", "representative", "production"} and corpus.get("independent") is not True:
        raise RuntimeFailure(f"{corpus_role} corpus must be independently owned")
    require_digest(payload.get("source_fingerprint"), "source_fingerprint")
    environment = payload.get("environment")
    if not isinstance(environment, dict) or set(environment) != {"id", "kind", "digest"} or not isinstance(environment.get("id"), str) or not environment["id"]:
        raise RuntimeFailure("domain result environment is invalid")
    require_digest(environment.get("digest"), "environment.digest")
    if environment.get("kind") not in {"local", "clean", "holdout", "representative", "sandbox", "production"}:
        raise RuntimeFailure("domain result environment kind is invalid")
    if corpus_role == "production" and environment.get("kind") not in {"sandbox", "production"}:
        raise RuntimeFailure("production corpus requires sandbox or production environment")
    tools = payload.get("toolchain")
    if not isinstance(tools, list) or not tools:
        raise RuntimeFailure("domain result requires a real toolchain execution")
    checks = []
    roles = set()
    for index, tool in enumerate(tools):
        if not isinstance(tool, dict) or set(tool) != {"name", "version", "argv_sha256", "exit_code", "evidence_role"}:
            raise RuntimeFailure(f"toolchain[{index}] is invalid")
        if not all(isinstance(tool.get(field), str) and tool[field] for field in ("name", "version", "evidence_role")):
            raise RuntimeFailure(f"toolchain[{index}] identity is invalid")
        if Path(tool["name"]).name.lower() in {"true", "false", "echo", "printf", "noop"}:
            raise RuntimeFailure(f"toolchain[{index}] is a generic/no-op command, not a domain executor")
        if not isinstance(tool.get("exit_code"), int) or isinstance(tool.get("exit_code"), bool):
            raise RuntimeFailure(f"toolchain[{index}].exit_code must be an integer")
        require_digest(tool.get("argv_sha256"), f"toolchain[{index}].argv_sha256")
        roles.add(tool["evidence_role"])
        checks.append({"name": f"toolchain:{tool['name']}@{tool['version']}", "outcome": "PASS" if tool.get("exit_code") == 0 else "FAIL", "detail": f"exit_code={tool.get('exit_code')}"})
    assertions = payload.get("assertions")
    if not isinstance(assertions, list) or not assertions:
        raise RuntimeFailure("domain result requires Claim-specific assertions")
    for assertion in assertions:
        if (not isinstance(assertion, dict) or set(assertion) != {"name", "outcome", "detail"} or assertion.get("outcome") not in OUTCOMES or
                not isinstance(assertion.get("name"), str) or not assertion["name"] or not isinstance(assertion.get("detail"), str) or not assertion["detail"]):
            raise RuntimeFailure("domain assertion is invalid")
        if not assertion["name"].startswith(claim.oracle_id + ":"):
            raise RuntimeFailure("domain assertion is not bound to the Claim-specific Oracle")
        checks.append(assertion)
    raw = payload.get("raw_evidence")
    if not isinstance(raw, list) or not raw:
        raise RuntimeFailure("domain result requires raw evidence")
    observed_roles = set()
    for index, reference in enumerate(raw):
        if not isinstance(reference, dict) or set(reference) != {"path", "sha256", "bytes", "role"}:
            raise RuntimeFailure(f"raw_evidence[{index}] is invalid")
        data = read_regular(confined(Path(reference["path"]), evidence_roots), MAX_FILE_BYTES, f"raw_evidence[{index}]")
        if reference.get("sha256") != digest_bytes(data) or reference.get("bytes") != len(data):
            raise RuntimeFailure(f"raw_evidence[{index}] byte/digest mismatch")
        observed_roles.add(reference.get("role"))
        checks.append({"name": f"raw-evidence:{reference.get('role')}", "outcome": "PASS", "detail": f"{reference['sha256']} bytes={len(data)}"})
    if not roles.issubset(observed_roles):
        raise RuntimeFailure(f"raw evidence lacks roles: {sorted(roles - observed_roles)}")
    decision = payload.get("decision")
    try:
        checks.extend(execute_handler(claim.batch, executor["handler"], payload.get("domain_contract"), claim.oracle_id,
                                      tools, assertions, observed_roles, decision))
    except DomainHandlerError as exc:
        raise RuntimeFailure(str(exc)) from exc
    if decision not in OUTCOMES or decision == "PASS" and any(item["outcome"] != "PASS" for item in checks):
        raise RuntimeFailure("domain result decision contradicts its checks")
    limitations = payload.get("limitations")
    if not isinstance(limitations, list) or any(not isinstance(item, str) for item in limitations):
        raise RuntimeFailure("domain result limitations are invalid")
    return {"schema_version": "1.0", "oracle_id": claim.oracle_id, "executor_id": claim.executor_id, "batch": claim.batch,
            "skill": claim.skill, "claim": claim_value, "corpus_role": corpus_role, "decision": decision,
            "checks": checks, "limitations": limitations}


def record_evidence(workspace: Path, envelope_file: Path, evidence_roots: tuple[Path, ...]) -> dict[str, Any]:
    value = metadata(workspace)
    if source_fingerprint(Path(value["source_root"]), workspace_paths(workspace)["root"]) != value["source_fingerprint"]:
        raise RuntimeFailure("source changed after workspace initialization")
    envelope = json.loads(read_regular(confined(envelope_file, evidence_roots), 8 * 1024 * 1024, "evidence envelope").decode("utf-8"))
    required = {"schema_version", "batch", "skill", "claim", "corpus_role", "producer", "environment", "subject", "assurance"}
    if not isinstance(envelope, dict) or set(envelope) != required or envelope.get("schema_version") != "1.0":
        raise RuntimeFailure("evidence envelope fields are invalid")
    claim_value = envelope.get("claim")
    if not isinstance(claim_value, dict) or set(claim_value) != {"type", "index", "sha256"}:
        raise RuntimeFailure("evidence Claim identity is invalid")
    claim = Registry.load().claim(envelope.get("skill"), claim_value.get("type"), claim_value.get("index"))
    if envelope.get("batch") != claim.batch or claim_value.get("sha256") != claim.sha256:
        raise RuntimeFailure("evidence is bound to another Claim")
    corpus_role = envelope.get("corpus_role")
    if corpus_role not in claim.corpora:
        raise RuntimeFailure("evidence corpus is not eligible")
    producer = envelope.get("producer")
    role = "holdout-executor" if corpus_role == "holdout" else ("production-executor" if corpus_role == "production" else "executor")
    if not isinstance(producer, dict) or producer.get("role") != role or not isinstance(producer.get("id"), str) or not producer["id"]:
        raise RuntimeFailure("evidence producer identity/role is invalid")
    environment = envelope.get("environment")
    if not isinstance(environment, dict) or set(environment) != {"id", "digest"} or not isinstance(environment.get("id"), str) or not environment["id"]:
        raise RuntimeFailure("evidence environment is invalid")
    require_digest(environment.get("digest"), "environment.digest")
    subject_ref = envelope.get("subject")
    if not isinstance(subject_ref, dict) or set(subject_ref) != {"type", "path", "sha256", "bytes"} or subject_ref.get("type") != "claim-oracle-result":
        raise RuntimeFailure("evidence subject reference is invalid")
    subject_bytes = read_regular(confined(Path(subject_ref["path"]), evidence_roots), MAX_FILE_BYTES, "Claim-Oracle subject")
    if subject_ref.get("sha256") != digest_bytes(subject_bytes) or subject_ref.get("bytes") != len(subject_bytes):
        raise RuntimeFailure("Claim-Oracle subject byte/digest mismatch")
    subject = json.loads(subject_bytes.decode("utf-8"))
    if not isinstance(subject, dict):
        raise RuntimeFailure("Claim-Oracle subject root is invalid")
    verify_claim_subject(subject, claim, corpus_role, subject.get("decision"))
    outcome = subject["decision"]
    assurance = envelope.get("assurance")
    if not isinstance(assurance, dict) or set(assurance) != {"executor_attestation", "oracle_attestation"}:
        raise RuntimeFailure("evidence assurance is invalid")
    bindings = {"batch": claim.batch, "skill": claim.skill, "claim_type": claim.claim_type, "claim_index": claim.claim_index,
                "claim_sha256": claim.sha256, "subject_sha256": subject_ref["sha256"], "source_fingerprint": value["source_fingerprint"],
                "corpus_role": corpus_role, "outcome": outcome, "oracle_id": claim.oracle_id}
    trust = workspace_trust(workspace)
    executor = trust.verify(assurance["executor_attestation"], role, {**bindings, "actor_id": producer["id"]})
    oracle_owner = trust.verify(assurance["oracle_attestation"], "oracle-owner", bindings)
    if executor["actor_id"] == oracle_owner["actor_id"]:
        raise RuntimeFailure("executor cannot own its Claim Oracle")
    subject_object = store_object(workspace, subject_bytes)
    record = {"schema_version": "1.0", "recorded_at": now_text(), "batch": claim.batch, "skill": claim.skill,
              "claim_type": claim.claim_type, "claim_index": claim.claim_index, "claim_sha256": claim.sha256,
              "corpus_role": corpus_role, "producer_id": producer["id"], "producer_role": role, "environment": environment,
              "outcome": outcome, "subject": subject_object, "oracle_id": claim.oracle_id, "executor": executor,
              "oracle_owner": oracle_owner, "claim_registry_sha256": Registry.load().digest}
    identity = canonical_digest({key: value for key, value in record.items() if key != "recorded_at"})
    evidence_id = "evidence-" + identity[7:31]
    record["evidence_id"] = evidence_id
    record_sha = canonical_digest(record)
    record["record_sha256"] = record_sha
    connection = connect(workspace)
    try:
        with transaction(connection):
            existing = connection.execute("SELECT record_json FROM evidence WHERE identity_sha256=?", (identity,)).fetchone()
            if existing:
                return json.loads(existing[0])
            encoded = canonical_bytes(record).decode("utf-8")
            connection.execute("INSERT INTO evidence VALUES(?,?,?,?,?,?,?,?)",
                               (evidence_id, claim.skill, claim.claim_type, claim.claim_index, corpus_role, encoded, record_sha, identity))
            append_event(connection, "evidence.recorded", record_sha)
    finally:
        connection.close()
    (workspace_paths(workspace)["evidence"] / f"{evidence_id}.json").write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return record


def evidence_record(workspace: Path, evidence_id: str) -> dict[str, Any]:
    connection = connect(workspace)
    try:
        row = connection.execute("SELECT record_json FROM evidence WHERE evidence_id=?", (evidence_id,)).fetchone()
    finally:
        connection.close()
    if row is None:
        raise RuntimeFailure("evidence does not exist")
    value = json.loads(row[0])
    observed = canonical_digest({key: item for key, item in value.items() if key != "record_sha256"})
    if value.get("record_sha256") != observed:
        raise RuntimeFailure("evidence record digest is invalid")
    return value


def verify_evidence(workspace: Path, evidence_id: str, outcome: str, attestation_file: Path, evidence_roots: tuple[Path, ...]) -> dict[str, Any]:
    if outcome not in {"PASS", "FAIL", "INCONCLUSIVE"}:
        raise RuntimeFailure("verification outcome is invalid")
    evidence = evidence_record(workspace, evidence_id)
    attestation = json.loads(read_regular(confined(attestation_file, evidence_roots), 1024 * 1024, "Verifier attestation").decode("utf-8"))
    corpus_role = evidence["corpus_role"]
    role = "holdout-verifier" if corpus_role == "holdout" else ("production-verifier" if corpus_role == "production" else "verifier")
    payload = attestation.get("payload") if isinstance(attestation, dict) else None
    verifier_id = payload.get("actor_id") if isinstance(payload, dict) else None
    authentication = workspace_trust(workspace).verify(attestation, role, {
        "actor_id": verifier_id, "evidence_id": evidence_id, "evidence_sha256": evidence["record_sha256"],
        "outcome": outcome, "corpus_role": corpus_role,
    })
    if authentication["actor_id"] in {evidence["producer_id"], evidence["oracle_owner"]["actor_id"]}:
        raise RuntimeFailure("Verifier conflicts with executor or Oracle owner")
    identity = canonical_digest({"evidence_id": evidence_id, "evidence_sha256": evidence["record_sha256"],
                                 "verifier_id": authentication["actor_id"], "outcome": outcome})
    verification_id = "verification-" + identity[7:31]
    record = {"schema_version": "1.0", "verification_id": verification_id, "verified_at": now_text(),
              "evidence_id": evidence_id, "evidence_sha256": evidence["record_sha256"], "outcome": outcome,
              "verifier_id": authentication["actor_id"], "authentication": authentication}
    record_sha = canonical_digest(record)
    record["record_sha256"] = record_sha
    connection = connect(workspace)
    try:
        with transaction(connection):
            existing = connection.execute("SELECT record_json FROM verifications WHERE identity_sha256=?", (identity,)).fetchone()
            if existing:
                return json.loads(existing[0])
            connection.execute("INSERT INTO verifications VALUES(?,?,?,?,?)",
                               (verification_id, evidence_id, canonical_bytes(record).decode("utf-8"), record_sha, identity))
            append_event(connection, "evidence.verified", record_sha)
    finally:
        connection.close()
    (workspace_paths(workspace)["verifications"] / f"{verification_id}.json").write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return record


def gate(workspace: Path, skill: str) -> dict[str, Any]:
    registry, value, trust = Registry.load(), metadata(workspace), workspace_trust(workspace)
    if value["claim_registry_sha256"] != registry.digest:
        raise RuntimeFailure("workspace Claim registry is stale")
    claims = registry.by_skill.get(skill)
    if claims is None:
        raise RuntimeFailure("Skill is not registered")
    connection = connect(workspace)
    try:
        evidence_rows = connection.execute("SELECT record_json FROM evidence WHERE skill=?", (skill,)).fetchall()
        verification_rows = connection.execute("SELECT record_json FROM verifications").fetchall()
    finally:
        connection.close()
    evidences = [json.loads(row[0]) for row in evidence_rows]
    verifications = [json.loads(row[0]) for row in verification_rows]
    by_evidence: dict[str, list[dict[str, Any]]] = {}
    for verification in verifications:
        by_evidence.setdefault(verification["evidence_id"], []).append(verification)
    corpora: dict[tuple[str, int], set[str]] = {}
    findings = verify_event_chain(workspace)
    if source_fingerprint(Path(value["source_root"]), workspace_paths(workspace)["root"]) != value["source_fingerprint"]:
        findings.append("source changed after workspace initialization")
    for evidence in evidences:
        try:
            if evidence.get("record_sha256") != canonical_digest({key: item for key, item in evidence.items() if key != "record_sha256"}):
                raise RuntimeFailure("evidence digest mismatch")
            claim = registry.claim(skill, evidence["claim_type"], evidence["claim_index"])
            executor_role = "holdout-executor" if evidence["corpus_role"] == "holdout" else ("production-executor" if evidence["corpus_role"] == "production" else "executor")
            if (evidence.get("claim_sha256") != claim.sha256 or evidence.get("oracle_id") != claim.oracle_id or
                    evidence.get("claim_registry_sha256") != registry.digest or evidence["executor"].get("trust_store_sha256") != trust.digest or
                    evidence["oracle_owner"].get("trust_store_sha256") != trust.digest or
                    evidence["executor"].get("actor_id") != evidence.get("producer_id") or evidence["executor"].get("role") != executor_role or
                    evidence["oracle_owner"].get("role") != "oracle-owner" or
                    evidence["oracle_owner"].get("actor_id") == evidence["executor"].get("actor_id")):
                raise RuntimeFailure("evidence assurance binding is stale or invalid")
            object_path = workspace_paths(workspace)["root"] / evidence["subject"]["object_path"]
            subject_bytes = read_regular(object_path, MAX_FILE_BYTES, "Claim subject object")
            if digest_bytes(subject_bytes) != evidence["subject"]["sha256"] or len(subject_bytes) != evidence["subject"]["bytes"]:
                raise RuntimeFailure("Claim subject object byte/digest mismatch")
            verify_claim_subject(json.loads(subject_bytes), claim, evidence["corpus_role"], evidence["outcome"])
            decisions = []
            verifier_role = "holdout-verifier" if evidence["corpus_role"] == "holdout" else ("production-verifier" if evidence["corpus_role"] == "production" else "verifier")
            for decision in by_evidence.get(evidence["evidence_id"], []):
                authentication = decision.get("authentication")
                if (decision.get("record_sha256") != canonical_digest({key: item for key, item in decision.items() if key != "record_sha256"}) or
                        decision.get("evidence_sha256") != evidence["record_sha256"] or not isinstance(authentication, dict) or
                        authentication.get("trust_store_sha256") != trust.digest or authentication.get("actor_id") != decision.get("verifier_id") or
                        authentication.get("role") != verifier_role or authentication.get("actor_id") in {evidence["producer_id"], evidence["oracle_owner"]["actor_id"]}):
                    findings.append(f"{decision.get('verification_id')}: verification assurance binding is invalid")
                    continue
                decisions.append(decision)
            passes = [item for item in decisions if item.get("outcome") == "PASS"]
            adverse = [item for item in decisions if item.get("outcome") in {"FAIL", "INCONCLUSIVE"}]
            if evidence["outcome"] == "PASS" and passes and not adverse:
                corpora.setdefault((claim.claim_type, claim.claim_index), set()).add(evidence["corpus_role"])
            elif evidence["outcome"] == "PASS":
                findings.append(f"{evidence['evidence_id']}: PASS lacks authenticated independent verification")
        except (KeyError, RuntimeFailure, json.JSONDecodeError) as exc:
            findings.append(f"{evidence.get('evidence_id')}: integrity failure: {exc}")
    missing = []
    for claim in claims:
        observed = corpora.get((claim.claim_type, claim.claim_index), set())
        absent = sorted(set(claim.corpora) - observed)
        if absent:
            missing.append({"claim_type": claim.claim_type, "claim_index": claim.claim_index, "missing_corpora": absent})
    external_claims = [claim for claim in claims if claim.claim_type == "external"]
    non_external_missing = [item for item in missing if item["claim_type"] != "external"]
    if not evidences:
        decision = "NOT_RUN"
    elif findings or non_external_missing:
        decision = "BLOCKED"
    elif external_claims and any(item["claim_type"] == "external" for item in missing):
        decision = "READY_FOR_EXTERNAL_GATE"
    elif external_claims:
        decision = "READY_FOR_HUMAN_DECISION"
    else:
        decision = "LOCAL_TOOLKIT_PASS"
    return {"schema_version": "1.0", "skill": skill, "decision": decision, "certified": False,
            "missing_claims": missing, "findings": findings, "evidence_count": len(evidences),
            "runtime_boundary": "Local and imported evidence evaluation only; certification remains disabled."}


def verify_event_chain(workspace: Path) -> list[str]:
    connection = connect(workspace)
    try:
        rows = connection.execute("SELECT * FROM events ORDER BY sequence").fetchall()
    finally:
        connection.close()
    findings = []
    previous = "GENESIS"
    for row in rows:
        expected = canonical_digest({"event_type": row["event_type"], "record_sha256": row["record_sha256"],
                                     "previous_hash": previous, "created_at": row["created_at"]})
        if row["previous_hash"] != previous or row["event_hash"] != expected:
            findings.append(f"event sequence {row['sequence']} hash-chain mismatch")
        previous = row["event_hash"]
    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("catalog")
    initialize = sub.add_parser("init")
    initialize.add_argument("--workspace", type=Path, required=True)
    initialize.add_argument("--source", type=Path, required=True)
    initialize.add_argument("--trust-store", type=Path, required=True)
    domain = sub.add_parser("domain-result")
    domain.add_argument("result", type=Path)
    domain.add_argument("--evidence-root", type=Path, action="append", required=True)
    domain.add_argument("--output", type=Path)
    record = sub.add_parser("record")
    record.add_argument("--workspace", type=Path, required=True)
    record.add_argument("--envelope", type=Path, required=True)
    record.add_argument("--evidence-root", type=Path, action="append", required=True)
    verify = sub.add_parser("verify")
    verify.add_argument("--workspace", type=Path, required=True)
    verify.add_argument("--evidence-id", required=True)
    verify.add_argument("--outcome", choices=["PASS", "FAIL", "INCONCLUSIVE"], required=True)
    verify.add_argument("--attestation", type=Path, required=True)
    verify.add_argument("--evidence-root", type=Path, action="append", required=True)
    gate_parser = sub.add_parser("gate")
    gate_parser.add_argument("--workspace", type=Path, required=True)
    gate_parser.add_argument("--skill", required=True)
    args = parser.parse_args()
    if args.command == "catalog":
        registry = Registry.load()
        result = {"namespace": registry.payload["namespace"], "skill_count": len(registry.by_skill),
                  "claim_count": len(registry.by_claim), "executor_count": len(registry.executors), "certification_enabled": False}
    elif args.command == "init":
        result = initialize_workspace(args.workspace, args.source, args.trust_store)
    elif args.command == "domain-result":
        result = materialize_domain_result(args.result, tuple(path.resolve(strict=True) for path in args.evidence_root))
        if args.output:
            if args.output.exists():
                raise RuntimeFailure("refusing to overwrite domain-result output")
            args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            return 0
    elif args.command == "record":
        result = record_evidence(args.workspace, args.envelope, tuple(path.resolve(strict=True) for path in args.evidence_root))
    elif args.command == "verify":
        result = verify_evidence(args.workspace, args.evidence_id, args.outcome, args.attestation,
                                 tuple(path.resolve(strict=True) for path in args.evidence_root))
    elif args.command == "gate":
        result = gate(args.workspace, args.skill)
    else:
        raise AssertionError(args.command)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
