#!/usr/bin/env python3
"""Signed, allowlisted native Provider adapter execution with durable receipts.

Adapter definitions are operator-owned Ed25519-signed data. Repository content
cannot select a binary, inject a shell, add environment variables, or weaken an
operation's effect/compensation policy. Unknown side-effect outcomes are never
retried automatically and never count as PASS.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import signal
import sqlite3
import stat
import subprocess
import tempfile
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import skill_runtime
from skill_handlers import contract_for_skill


MAX_CAPTURE_BYTES = 8 * 1024 * 1024
MAX_DESCRIPTOR_BYTES = 8 * 1024 * 1024
IDENTIFIER = re.compile(r"^[a-z][a-z0-9-]{0,62}[a-z0-9]$")
SAFE_ENVIRONMENT = {"PATH", "LANG", "LC_ALL", "TMPDIR", "SSL_CERT_FILE", "SSL_CERT_DIR"}
FINAL_STATES = {"SUCCEEDED", "FAILED", "UNKNOWN", "COMPENSATED"}


class ProviderRuntimeError(ValueError):
    pass


def canonical_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")


def digest_bytes(value: bytes) -> str:
    return "sha256:" + hashlib.sha256(value).hexdigest()


def digest(value: Any) -> str:
    return digest_bytes(canonical_bytes(value))


def now_text() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def read_bounded(path: Path, maximum: int, label: str) -> bytes:
    resolved = path.expanduser().resolve(strict=True)
    flags = os.O_RDONLY | getattr(os, "O_CLOEXEC", 0) | getattr(os, "O_NOFOLLOW", 0)
    descriptor = os.open(resolved, flags)
    try:
        observed = os.fstat(descriptor)
        if not stat.S_ISREG(observed.st_mode) or observed.st_size > maximum:
            raise ProviderRuntimeError(f"{label} must be a bounded regular file")
        data = bytearray()
        while len(data) < observed.st_size:
            chunk = os.read(descriptor, min(65536, observed.st_size - len(data)))
            if not chunk:
                raise ProviderRuntimeError(f"{label} changed while being read")
            data.extend(chunk)
        if os.read(descriptor, 1):
            raise ProviderRuntimeError(f"{label} changed while being read")
        return bytes(data)
    finally:
        os.close(descriptor)


def atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, prefix=f".{path.name}.", delete=False) as handle:
        handle.write(data)
        handle.flush()
        os.fsync(handle.fileno())
        temporary = Path(handle.name)
    os.replace(temporary, path)
    descriptor = os.open(path.parent, os.O_RDONLY)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


@dataclass(frozen=True)
class Operation:
    name: str
    argv: tuple[str, ...]
    parameters: tuple[dict[str, Any], ...]
    timeout_seconds: int
    effect_class: str
    compensation_operation: str | None


@dataclass(frozen=True)
class Adapter:
    adapter_id: str
    capability: str
    executable: Path
    executable_sha256: str
    version: str
    environment_allowlist: tuple[str, ...]
    operations: dict[str, Operation]


@dataclass(frozen=True)
class AdapterRegistry:
    registry_id: str
    registry_sha256: str
    signer: dict[str, Any]
    adapters: dict[str, Adapter]

    @classmethod
    def load(cls, envelope_path: Path, trust: skill_runtime.TrustStore, source_fingerprint: str) -> "AdapterRegistry":
        raw = read_bounded(envelope_path, MAX_DESCRIPTOR_BYTES, "adapter registry envelope")
        try:
            envelope = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise ProviderRuntimeError(f"adapter registry is invalid JSON: {exc}") from exc
        payload = envelope.get("payload") if isinstance(envelope, dict) else None
        if not isinstance(payload, dict):
            raise ProviderRuntimeError("adapter registry signed payload is missing")
        registry_id = payload.get("registry_id")
        adapters_value = payload.get("adapters")
        if (payload.get("schema_version") != "1.0" or not isinstance(registry_id, str) or not IDENTIFIER.fullmatch(registry_id) or
                payload.get("source_fingerprint") != source_fingerprint or not isinstance(adapters_value, list) or not adapters_value):
            raise ProviderRuntimeError("adapter registry identity, source binding, or entries are invalid")
        try:
            signer = trust.verify(envelope, "adapter-admin", {"registry_id": registry_id, "source_fingerprint": source_fingerprint})
        except skill_runtime.RuntimeFailure as exc:
            raise ProviderRuntimeError(str(exc)) from exc
        adapters: dict[str, Adapter] = {}
        for item in adapters_value:
            adapter = parse_adapter(item)
            if adapter.adapter_id in adapters:
                raise ProviderRuntimeError(f"duplicate adapter id: {adapter.adapter_id}")
            adapters[adapter.adapter_id] = adapter
        registry_material = {"registry_id": registry_id, "source_fingerprint": source_fingerprint, "adapters": adapters_value}
        return cls(registry_id, digest(registry_material), signer, adapters)


def parse_adapter(value: Any) -> Adapter:
    required = {"adapter_id", "capability", "executable", "executable_sha256", "version", "environment_allowlist", "operations"}
    if not isinstance(value, dict) or set(value) != required:
        raise ProviderRuntimeError("adapter fields are invalid")
    adapter_id, capability = value.get("adapter_id"), value.get("capability")
    if not isinstance(adapter_id, str) or not IDENTIFIER.fullmatch(adapter_id) or not isinstance(capability, str) or not IDENTIFIER.fullmatch(capability):
        raise ProviderRuntimeError("adapter identity/capability is invalid")
    executable_value = value.get("executable")
    if not isinstance(executable_value, str) or not Path(executable_value).is_absolute():
        raise ProviderRuntimeError(f"adapter {adapter_id} executable must be an absolute path")
    executable = Path(executable_value).resolve(strict=True)
    observed = executable.stat()
    if not stat.S_ISREG(observed.st_mode) or not os.access(executable, os.X_OK) or Path(executable_value).is_symlink():
        raise ProviderRuntimeError(f"adapter {adapter_id} executable must be a non-symlink executable regular file")
    expected = skill_runtime.require_digest(value.get("executable_sha256"), f"adapter {adapter_id} executable_sha256")
    if digest_bytes(read_bounded(executable, 1024 * 1024 * 1024, f"adapter {adapter_id} executable")) != expected:
        raise ProviderRuntimeError(f"adapter {adapter_id} executable digest mismatch")
    version = value.get("version")
    environment = value.get("environment_allowlist")
    operations_value = value.get("operations")
    if (not isinstance(version, str) or not version or not isinstance(environment, list) or
            any(not isinstance(item, str) or not item or item in SAFE_ENVIRONMENT for item in environment) or
            len(environment) != len(set(environment)) or not isinstance(operations_value, list) or not operations_value):
        raise ProviderRuntimeError(f"adapter {adapter_id} version, environment, or operations are invalid")
    operations: dict[str, Operation] = {}
    for operation_value in operations_value:
        operation = parse_operation(adapter_id, operation_value)
        if operation.name in operations:
            raise ProviderRuntimeError(f"adapter {adapter_id} duplicates operation {operation.name}")
        operations[operation.name] = operation
    referenced_compensations = {item.compensation_operation for item in operations.values() if item.compensation_operation}
    for operation in operations.values():
        if (operation.effect_class != "read-only" and operation.compensation_operation not in operations and
                operation.name not in referenced_compensations):
            raise ProviderRuntimeError(f"adapter {adapter_id} mutating operation {operation.name} lacks a registered compensation")
        if operation.compensation_operation and operations[operation.compensation_operation].effect_class == "read-only":
            raise ProviderRuntimeError(f"adapter {adapter_id} compensation {operation.compensation_operation} cannot be read-only")
    return Adapter(adapter_id, capability, executable, expected, version, tuple(environment), operations)


def parse_operation(adapter_id: str, value: Any) -> Operation:
    required = {"name", "argv", "parameters", "timeout_seconds", "effect_class", "compensation_operation"}
    if not isinstance(value, dict) or set(value) != required:
        raise ProviderRuntimeError(f"adapter {adapter_id} operation fields are invalid")
    name, argv, parameters = value.get("name"), value.get("argv"), value.get("parameters")
    timeout, effect, compensation = value.get("timeout_seconds"), value.get("effect_class"), value.get("compensation_operation")
    if (not isinstance(name, str) or not IDENTIFIER.fullmatch(name) or not isinstance(argv, list) or
            any(not isinstance(item, str) or not item for item in argv) or not isinstance(parameters, list) or
            not isinstance(timeout, int) or isinstance(timeout, bool) or not 1 <= timeout <= 86400 or
            effect not in {"read-only", "reversible", "approval-required"} or
            compensation is not None and (not isinstance(compensation, str) or not IDENTIFIER.fullmatch(compensation))):
        raise ProviderRuntimeError(f"adapter {adapter_id} operation {name!r} is invalid")
    names: set[str] = set()
    for parameter in parameters:
        if (not isinstance(parameter, dict) or set(parameter) != {"name", "flag", "type", "required"} or
                not isinstance(parameter.get("name"), str) or not IDENTIFIER.fullmatch(parameter["name"]) or parameter["name"] in names or
                not isinstance(parameter.get("flag"), str) or not parameter["flag"].startswith("-") or
                parameter.get("type") not in {"identifier", "integer", "path", "https-url"} or not isinstance(parameter.get("required"), bool)):
            raise ProviderRuntimeError(f"adapter {adapter_id} operation parameter is invalid")
        names.add(parameter["name"])
    return Operation(name, tuple(argv), tuple(parameters), timeout, effect, compensation)


class ProviderStore:
    def __init__(self, workspace: Path):
        self.root = workspace.expanduser().resolve()
        self.root.mkdir(parents=True, exist_ok=True)
        self.path = self.root / "provider-state.sqlite3"
        with self.connect() as connection:
            connection.executescript("""
                CREATE TABLE IF NOT EXISTS executions(
                    idempotency_key TEXT PRIMARY KEY,
                    request_sha256 TEXT NOT NULL,
                    target_key TEXT NOT NULL,
                    state TEXT NOT NULL CHECK(state IN ('RUNNING','SUCCEEDED','FAILED','UNKNOWN','COMPENSATED')),
                    fencing_token INTEGER NOT NULL CHECK(fencing_token > 0),
                    receipt_json TEXT,
                    updated_at TEXT NOT NULL,
                    UNIQUE(target_key,fencing_token)
                );
                CREATE TABLE IF NOT EXISTS events(
                    sequence INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_type TEXT NOT NULL,
                    request_sha256 TEXT NOT NULL,
                    previous_hash TEXT NOT NULL,
                    event_hash TEXT NOT NULL UNIQUE,
                    created_at TEXT NOT NULL
                );
            """)
            connection.execute("PRAGMA user_version=1")

    def connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=30, isolation_level=None)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA journal_mode=WAL")
        connection.execute("PRAGMA synchronous=FULL")
        connection.execute("PRAGMA busy_timeout=30000")
        return connection

    def _event(self, connection: sqlite3.Connection, event_type: str, request_sha256: str, created_at: str) -> None:
        row = connection.execute("SELECT event_hash FROM events ORDER BY sequence DESC LIMIT 1").fetchone()
        previous = row[0] if row else "GENESIS"
        event_hash = digest({"event_type": event_type, "request_sha256": request_sha256, "previous_hash": previous, "created_at": created_at})
        connection.execute("INSERT INTO events(event_type,request_sha256,previous_hash,event_hash,created_at) VALUES(?,?,?,?,?)",
                           (event_type, request_sha256, previous, event_hash, created_at))

    def begin(self, idempotency_key: str, request_sha256: str, target_key: str,
              fencing_token: int) -> dict[str, Any] | None:
        connection = self.connect()
        try:
            connection.execute("BEGIN IMMEDIATE")
            row = connection.execute("SELECT * FROM executions WHERE idempotency_key=?", (idempotency_key,)).fetchone()
            if row:
                if row["request_sha256"] != request_sha256:
                    raise ProviderRuntimeError("idempotency key is already bound to a different request")
                if row["state"] in FINAL_STATES:
                    connection.commit()
                    return json.loads(row["receipt_json"])
                raise ProviderRuntimeError("matching Provider request is already RUNNING; reconcile it before retry")
            maximum = connection.execute("SELECT MAX(fencing_token) FROM executions WHERE target_key=?", (target_key,)).fetchone()[0]
            if maximum is not None and fencing_token <= int(maximum):
                raise ProviderRuntimeError(f"fencing token must be greater than {maximum} for target")
            created = now_text()
            connection.execute("INSERT INTO executions VALUES(?,?,?,?,?,?,?)",
                               (idempotency_key, request_sha256, target_key, "RUNNING", fencing_token, None, created))
            self._event(connection, "PROVIDER_EXECUTION_STARTED", request_sha256, created)
            connection.commit()
            return None
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def execution(self, request_sha256: str) -> dict[str, Any] | None:
        with self.connect() as connection:
            row = connection.execute("SELECT state,receipt_json FROM executions WHERE request_sha256=?", (request_sha256,)).fetchone()
        if row is None:
            return None
        return {"state": row["state"], "receipt": json.loads(row["receipt_json"]) if row["receipt_json"] else None}

    def finish(self, idempotency_key: str, request_sha256: str, fencing_token: int, receipt: dict[str, Any],
               compensates_request_sha256: str | None = None) -> None:
        connection = self.connect()
        try:
            connection.execute("BEGIN IMMEDIATE")
            cursor = connection.execute(
                "UPDATE executions SET state=?,receipt_json=?,updated_at=? WHERE idempotency_key=? AND request_sha256=? AND fencing_token=? AND state='RUNNING'",
                (receipt["state"], canonical_bytes(receipt).decode("utf-8"), now_text(), idempotency_key, request_sha256, fencing_token),
            )
            if cursor.rowcount != 1:
                raise ProviderRuntimeError("Provider execution fencing/state conflict")
            self._event(connection, "PROVIDER_EXECUTION_" + receipt["state"], request_sha256, receipt["finished_at"])
            if compensates_request_sha256 and receipt["state"] == "SUCCEEDED":
                original = connection.execute(
                    "SELECT state,receipt_json FROM executions WHERE request_sha256=?", (compensates_request_sha256,)
                ).fetchone()
                if original is None or original["state"] != "SUCCEEDED" or not original["receipt_json"]:
                    raise ProviderRuntimeError("compensated Provider execution is missing or not safely compensatable")
                original_receipt = json.loads(original["receipt_json"])
                if original_receipt.get("compensation_operation") != receipt.get("operation"):
                    raise ProviderRuntimeError("compensation operation does not match the original signed contract")
                compensated = {**original_receipt, "state": "COMPENSATED", "decision": "PASS",
                               "compensation_request_sha256": request_sha256,
                               "compensated_at": receipt["finished_at"]}
                connection.execute("UPDATE executions SET state='COMPENSATED',receipt_json=?,updated_at=? WHERE request_sha256=?",
                                   (canonical_bytes(compensated).decode("utf-8"), receipt["finished_at"], compensates_request_sha256))
                self._event(connection, "PROVIDER_EXECUTION_COMPENSATED", compensates_request_sha256, receipt["finished_at"])
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        finally:
            connection.close()

    def verify_event_chain(self) -> list[str]:
        with self.connect() as connection:
            rows = connection.execute("SELECT * FROM events ORDER BY sequence").fetchall()
        previous = "GENESIS"
        findings: list[str] = []
        for row in rows:
            expected = digest({"event_type": row["event_type"], "request_sha256": row["request_sha256"],
                               "previous_hash": previous, "created_at": row["created_at"]})
            if row["previous_hash"] != previous or row["event_hash"] != expected:
                findings.append(f"Provider event sequence {row['sequence']} hash-chain mismatch")
            previous = row["event_hash"]
        return findings


def validate_parameter(value: Any, specification: dict[str, Any], roots: tuple[Path, ...]) -> str:
    kind = specification["type"]
    if kind == "integer":
        if not isinstance(value, int) or isinstance(value, bool):
            raise ProviderRuntimeError(f"parameter {specification['name']} must be an integer")
        return str(value)
    if not isinstance(value, str) or not value or "\x00" in value:
        raise ProviderRuntimeError(f"parameter {specification['name']} must be a non-empty string")
    if kind == "identifier" and not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,1023}", value):
        raise ProviderRuntimeError(f"parameter {specification['name']} is not a safe identifier")
    if kind == "https-url":
        parsed = urlparse(value)
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
            raise ProviderRuntimeError(f"parameter {specification['name']} must be an HTTPS URL without credentials")
    if kind == "path":
        resolved = Path(value).expanduser().resolve(strict=True)
        if not any(resolved == root or root in resolved.parents for root in roots):
            raise ProviderRuntimeError(f"parameter {specification['name']} path escapes approved roots")
        return str(resolved)
    return value


def redact(data: bytes, secrets: tuple[str, ...]) -> bytes:
    text = data[:MAX_CAPTURE_BYTES].decode("utf-8", errors="replace")
    for secret in sorted((item for item in secrets if item), key=len, reverse=True):
        text = text.replace(secret, "[REDACTED]")
    return text.encode("utf-8")


def execute(workspace: Path, request_path: Path, registry_path: Path, trust_store_path: Path,
            approved_roots: tuple[Path, ...]) -> dict[str, Any]:
    request = json.loads(read_bounded(request_path, MAX_DESCRIPTOR_BYTES, "Provider request"))
    required = {"schema_version", "skill", "adapter_id", "operation", "parameters", "idempotency_key", "fencing_token", "source_fingerprint", "approval", "compensates_request_sha256"}
    if not isinstance(request, dict) or set(request) != required or request.get("schema_version") != "1.0":
        raise ProviderRuntimeError("Provider request fields are invalid")
    skill, idempotency_key = request.get("skill"), request.get("idempotency_key")
    fencing_token = request.get("fencing_token")
    if (not isinstance(skill, str) or not skill or not isinstance(idempotency_key, str) or not IDENTIFIER.fullmatch(idempotency_key) or
            not isinstance(fencing_token, int) or isinstance(fencing_token, bool) or fencing_token < 1):
        raise ProviderRuntimeError("Provider request Skill, idempotency key, or fencing token is invalid")
    compensates_request_sha256 = request.get("compensates_request_sha256")
    if compensates_request_sha256 is not None:
        skill_runtime.require_digest(compensates_request_sha256, "compensates_request_sha256")
    source_fingerprint = skill_runtime.require_digest(request.get("source_fingerprint"), "source_fingerprint")
    skill_contract = contract_for_skill(skill)
    trust = skill_runtime.TrustStore.load(trust_store_path)
    registry = AdapterRegistry.load(registry_path, trust, source_fingerprint)
    adapter = registry.adapters.get(request.get("adapter_id"))
    operation = adapter.operations.get(request.get("operation")) if adapter else None
    if adapter is None or operation is None:
        raise ProviderRuntimeError("Provider adapter or operation is not registered")
    parameters = request.get("parameters")
    if not isinstance(parameters, dict):
        raise ProviderRuntimeError("Provider parameters must be an object")
    specifications = {item["name"]: item for item in operation.parameters}
    if set(parameters) - set(specifications) or any(item["required"] and item["name"] not in parameters for item in operation.parameters):
        raise ProviderRuntimeError("Provider parameters do not match the signed operation contract")
    roots = tuple(root.expanduser().resolve(strict=True) for root in approved_roots)
    argv = [str(adapter.executable), *operation.argv]
    for specification in operation.parameters:
        if specification["name"] in parameters:
            argv.extend((specification["flag"], validate_parameter(parameters[specification["name"]], specification, roots)))
    request_identity = {
        "skill": skill, "skill_handler_id": skill_contract["handler_id"], "adapter_id": adapter.adapter_id,
        "adapter_registry_sha256": registry.registry_sha256, "operation": operation.name,
        "parameters_sha256": digest(parameters), "idempotency_key": idempotency_key,
        "fencing_token": fencing_token, "source_fingerprint": source_fingerprint, "effect_class": operation.effect_class,
        "compensates_request_sha256": compensates_request_sha256,
    }
    request_sha256 = digest(request_identity)
    if operation.effect_class == "read-only":
        if request.get("approval") is not None:
            raise ProviderRuntimeError("read-only Provider operations must not carry an unnecessary approval")
        approval = None
    else:
        approval_value = request.get("approval")
        try:
            approval = trust.verify(approval_value, "approver", {
                "request_sha256": request_sha256, "adapter_id": adapter.adapter_id, "operation": operation.name,
                "source_fingerprint": source_fingerprint, "effect_class": operation.effect_class,
            })
        except skill_runtime.RuntimeFailure as exc:
            raise ProviderRuntimeError(str(exc)) from exc
        if approval["actor_id"] == registry.signer["actor_id"]:
            raise ProviderRuntimeError("adapter administrator and operation approver must be separate actors")
    environment = {key: value for key, value in os.environ.items() if key in SAFE_ENVIRONMENT}
    missing_environment = [key for key in adapter.environment_allowlist if key not in os.environ]
    if missing_environment:
        raise ProviderRuntimeError(f"missing required environment references: {missing_environment}")
    for key in adapter.environment_allowlist:
        environment[key] = os.environ[key]
    environment["ELMOS_IDEMPOTENCY_KEY"] = idempotency_key
    store = ProviderStore(workspace)
    if compensates_request_sha256 is not None:
        original = store.execution(compensates_request_sha256)
        if (original is None or original["state"] != "SUCCEEDED" or not isinstance(original["receipt"], dict) or
                original["receipt"].get("compensation_operation") != operation.name):
            raise ProviderRuntimeError("compensation request is not bound to a succeeded compensatable operation")
    target_key = f"{adapter.capability}:{digest(parameters)}"
    prior = store.begin(idempotency_key, request_sha256, target_key, fencing_token)
    if prior is not None:
        return {**prior, "idempotent_replay": True}
    evidence_root = store.root / "provider-evidence" / request_sha256.removeprefix("sha256:")
    evidence_root.mkdir(parents=True, exist_ok=True)
    started = now_text()
    timed_out = False
    ambiguous = False
    try:
        process = subprocess.Popen(argv, cwd=store.root, env=environment, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                   start_new_session=True, shell=False)
        try:
            stdout_raw, stderr_raw = process.communicate(timeout=operation.timeout_seconds)
            exit_code = process.returncode
        except subprocess.TimeoutExpired:
            timed_out = True
            ambiguous = operation.effect_class != "read-only"
            try:
                os.killpg(process.pid, signal.SIGTERM)
                stdout_raw, stderr_raw = process.communicate(timeout=5)
            except (ProcessLookupError, subprocess.TimeoutExpired):
                try:
                    os.killpg(process.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
                stdout_raw, stderr_raw = process.communicate()
            exit_code = None
    except OSError as exc:
        stdout_raw, stderr_raw, exit_code = b"", str(exc).encode("utf-8"), None
    secrets = tuple(os.environ[key] for key in adapter.environment_allowlist)
    stdout, stderr = redact(stdout_raw, secrets), redact(stderr_raw, secrets)
    stdout_path, stderr_path = evidence_root / "stdout.log", evidence_root / "stderr.log"
    atomic_write(stdout_path, stdout)
    atomic_write(stderr_path, stderr)
    state = "UNKNOWN" if ambiguous else ("SUCCEEDED" if exit_code == 0 and not timed_out else "FAILED")
    decision = "PASS" if state == "SUCCEEDED" else ("INCONCLUSIVE" if state == "UNKNOWN" else "FAIL")
    finished = now_text()
    receipt = {
        **request_identity, "request_sha256": request_sha256, "state": state, "decision": decision, "started_at": started, "finished_at": finished,
        "fencing_token": fencing_token, "exit_code": exit_code, "timed_out": timed_out,
        "stdout": {"path": str(stdout_path), "sha256": digest_bytes(stdout), "bytes": len(stdout)},
        "stderr": {"path": str(stderr_path), "sha256": digest_bytes(stderr), "bytes": len(stderr)},
        "approval": approval, "compensation_operation": operation.compensation_operation,
        "limitations": (["side-effect outcome is unknown; reconcile before retry or compensation"] if state == "UNKNOWN" else []),
        "idempotent_replay": False,
    }
    store.finish(idempotency_key, request_sha256, fencing_token, receipt, compensates_request_sha256)
    return receipt


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace", type=Path, required=True)
    parser.add_argument("--request", type=Path, required=True)
    parser.add_argument("--adapter-registry", type=Path, required=True)
    parser.add_argument("--trust-store", type=Path, required=True)
    parser.add_argument("--approved-root", type=Path, action="append", required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = execute(args.workspace, args.request, args.adapter_registry, args.trust_store, tuple(args.approved_root))
    encoded = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        if args.output.exists():
            raise ProviderRuntimeError("refusing to overwrite Provider receipt output")
        atomic_write(args.output, encoded.encode("utf-8"))
    print(encoded, end="")
    return 0 if result["state"] == "SUCCEEDED" else 2


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ProviderRuntimeError, skill_runtime.RuntimeFailure, OSError, json.JSONDecodeError) as exc:
        print(json.dumps({"decision": "BLOCKED", "error": str(exc)}, ensure_ascii=False), file=os.sys.stderr)
        raise SystemExit(2) from exc
