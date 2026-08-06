#!/usr/bin/env python3
"""Authenticated transactional recovery for the 227 reconstructed B01-B05 files.

Recovery requires an authoritative archive, an exact per-file manifest signed
by a source owner, and an independent apply approval. Verification/staging never
changes the installed package. Apply uses an exclusive lock, backups, fsync and
rollback. The checked-in recovery status is intentionally untouched until a
real source bundle is supplied and the resulting receipt is reviewed.
"""

from __future__ import annotations

import argparse
import fcntl
import hashlib
import json
import os
import shutil
import stat
from pathlib import Path, PurePosixPath
from typing import Any

import skill_runtime


EXPECTED_COUNTS = (35, 46, 45, 46, 55)
MAX_FILE_BYTES = 128 * 1024 * 1024
MAX_ARCHIVE_BYTES = 4 * 1024 * 1024 * 1024


class RecoveryFailure(ValueError):
    pass


def canonical_bytes(value: Any) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode()


def digest_bytes(value: bytes) -> str:
    return "sha256:" + hashlib.sha256(value).hexdigest()


def digest(value: Any) -> str:
    return digest_bytes(canonical_bytes(value))


def safe_relative(value: Any) -> str:
    if not isinstance(value, str) or not value or "\\" in value:
        raise RecoveryFailure("recovery path is invalid")
    path = PurePosixPath(value)
    if path.is_absolute() or ".." in path.parts or "." in path.parts or any(not part for part in path.parts):
        raise RecoveryFailure("recovery path escapes package")
    return path.as_posix()


def read_regular(path: Path, maximum: int, label: str) -> bytes:
    resolved = path.expanduser().resolve(strict=True)
    descriptor = os.open(resolved, os.O_RDONLY | getattr(os, "O_CLOEXEC", 0) | getattr(os, "O_NOFOLLOW", 0))
    try:
        observed = os.fstat(descriptor)
        if not stat.S_ISREG(observed.st_mode) or observed.st_size > maximum:
            raise RecoveryFailure(f"{label} must be a bounded regular file")
        data = bytearray()
        while len(data) < observed.st_size:
            chunk = os.read(descriptor, min(65536, observed.st_size - len(data)))
            if not chunk:
                raise RecoveryFailure(f"{label} changed while being read")
            data.extend(chunk)
        if os.read(descriptor, 1):
            raise RecoveryFailure(f"{label} changed while being read")
        return bytes(data)
    finally:
        os.close(descriptor)


def confined(path: Path, roots: tuple[Path, ...], label: str) -> Path:
    resolved = path.expanduser().resolve(strict=True)
    if not any(resolved == root or root in resolved.parents for root in roots):
        raise RecoveryFailure(f"{label} escapes approved roots")
    return resolved


def confined_child(root: Path, relative: str, label: str) -> Path:
    resolved_root = root.expanduser().resolve(strict=True)
    candidate = (resolved_root / safe_relative(relative)).resolve(strict=True)
    if candidate == resolved_root or resolved_root not in candidate.parents:
        raise RecoveryFailure(f"{label} escapes its authoritative root")
    return candidate


def expected_paths(system_root: Path) -> list[str]:
    root = system_root.expanduser().resolve(strict=True)
    batches = sorted(path for path in root.iterdir()
                     if path.is_dir() and not path.is_symlink() and path.name.startswith("batch_"))[:5]
    if len(batches) != 5:
        raise RecoveryFailure("exactly five legacy Batch directories are required")
    result: list[str] = []
    for index, batch in enumerate(batches):
        files = sorted(batch.glob("skills/*/SKILL.md"))
        for folder in ("schemas", "policies", "examples"):
            files.extend(sorted(path for path in (batch / folder).rglob("*") if path.is_file() and path.suffix != ".tmp"))
        files.extend((batch / "tests" / "SCENARIOS.md", batch / "tools" / "validate_package.py"))
        safe_files = []
        for path in files:
            if not path.is_file():
                continue
            if path.is_symlink():
                raise RecoveryFailure(f"reconstructed inventory contains a symbolic link: {path}")
            resolved = path.resolve(strict=True)
            if root not in resolved.parents:
                raise RecoveryFailure(f"reconstructed inventory escapes package: {path}")
            safe_files.append(path)
        relatives = sorted(path.relative_to(root).as_posix() for path in safe_files)
        if len(relatives) != EXPECTED_COUNTS[index]:
            raise RecoveryFailure(f"Batch {index + 1:02d} reconstructed inventory drifted: {len(relatives)}")
        result.extend(relatives)
    if len(result) != 227 or len(set(result)) != 227:
        raise RecoveryFailure("reconstructed inventory must contain exactly 227 unique files")
    return result


def _write_exclusive(path: Path, data: bytes, mode: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_CLOEXEC", 0), mode)
    try:
        offset = 0
        while offset < len(data):
            offset += os.write(descriptor, data[offset:])
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def _fsync_directory(path: Path) -> None:
    descriptor = os.open(path, os.O_RDONLY | getattr(os, "O_CLOEXEC", 0))
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def _atomic_record(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + ".record.tmp")
    if temporary.exists():
        temporary.unlink()
    _write_exclusive(temporary, canonical_bytes(value), 0o600)
    os.replace(temporary, path)
    _fsync_directory(path.parent)


def _atomic_replace_bytes(target: Path, data: bytes, mode: int, token: str) -> None:
    temporary = target.with_name(target.name + f".{token}.tmp")
    if temporary.exists():
        raise RecoveryFailure(f"temporary recovery path exists: {target}")
    _write_exclusive(temporary, data, mode)
    os.replace(temporary, target)
    _fsync_directory(target.parent)


def verify_and_stage(system_root: Path, bundle_root: Path, manifest_path: Path,
                     source_authorization: dict[str, Any], trust_path: Path,
                     workspace: Path, approved_roots: tuple[Path, ...]) -> dict[str, Any]:
    root = system_root.expanduser().resolve(strict=True)
    bundle = confined(bundle_root, approved_roots, "recovery bundle")
    raw_manifest = read_regular(confined(manifest_path, approved_roots, "recovery manifest"),
                                16 * 1024 * 1024, "recovery manifest")
    try:
        manifest = json.loads(raw_manifest)
    except json.JSONDecodeError as exc:
        raise RecoveryFailure("recovery manifest is invalid JSON") from exc
    required = {"schema_version", "namespace", "recovery_id", "source_archive", "entries"}
    if (not isinstance(manifest, dict) or set(manifest) != required or manifest.get("schema_version") != "1.0" or
            manifest.get("namespace") != "batch-01-05-original-payload"):
        raise RecoveryFailure("recovery manifest identity/fields are invalid")
    recovery_id = safe_relative(manifest.get("recovery_id"))
    if "/" in recovery_id:
        raise RecoveryFailure("recovery_id must be a single path segment")
    expected = expected_paths(root)
    entries = manifest.get("entries")
    if not isinstance(entries, list) or len(entries) != 227:
        raise RecoveryFailure("recovery manifest must contain exactly 227 entries")
    by_path: dict[str, dict[str, Any]] = {}
    for entry in entries:
        fields = {"path", "original_sha256", "original_bytes", "reconstructed_sha256", "provenance"}
        if not isinstance(entry, dict) or set(entry) != fields:
            raise RecoveryFailure("recovery entry fields are invalid")
        relative = safe_relative(entry.get("path"))
        if relative in by_path or entry.get("provenance") != "authoritative-source-owner":
            raise RecoveryFailure("recovery entry is duplicated or lacks authoritative provenance")
        original_sha = skill_runtime.require_digest(entry.get("original_sha256"), "original_sha256")
        reconstructed_sha = skill_runtime.require_digest(entry.get("reconstructed_sha256"), "reconstructed_sha256")
        if (not isinstance(entry.get("original_bytes"), int) or isinstance(entry.get("original_bytes"), bool) or
                entry["original_bytes"] < 0):
            raise RecoveryFailure("original_bytes is invalid")
        target_data = read_regular(confined_child(root, relative, "reconstructed target"), MAX_FILE_BYTES,
                                   "reconstructed target")
        if digest_bytes(target_data) != reconstructed_sha:
            raise RecoveryFailure(f"reconstructed target drifted: {relative}")
        payload_root = confined(bundle / "payloads", (bundle,), "recovery payload root")
        original_data = read_regular(confined_child(payload_root, relative, "original payload"),
                                     MAX_FILE_BYTES, "original payload")
        if digest_bytes(original_data) != original_sha or len(original_data) != entry["original_bytes"]:
            raise RecoveryFailure(f"original payload byte/digest mismatch: {relative}")
        by_path[relative] = entry
    if sorted(by_path) != expected:
        raise RecoveryFailure("recovery manifest paths do not exactly match the 227 reconstructed files")
    archive = manifest.get("source_archive")
    if not isinstance(archive, dict) or set(archive) != {"path", "sha256", "bytes"}:
        raise RecoveryFailure("source archive reference is invalid")
    archive_data = read_regular(confined(Path(archive["path"]), approved_roots, "source archive"),
                                MAX_ARCHIVE_BYTES, "source archive")
    archive_sha = skill_runtime.require_digest(archive.get("sha256"), "source archive sha256")
    if digest_bytes(archive_data) != archive_sha or archive.get("bytes") != len(archive_data):
        raise RecoveryFailure("source archive byte/digest mismatch")
    manifest_sha = digest(manifest)
    entries_root = digest([{key: entry[key] for key in sorted(entry)} for entry in entries])
    authorization = skill_runtime.TrustStore.load(trust_path).verify(source_authorization, "source-owner",
        {"recovery_id": recovery_id, "manifest_sha256": manifest_sha, "entries_root": entries_root,
         "source_archive_sha256": archive_sha, "file_count": 227})
    stage_root = workspace.expanduser().resolve() / "staged" / recovery_id
    if stage_root.exists():
        raise RecoveryFailure("recovery stage already exists")
    try:
        for relative in expected:
            payload_root = confined(bundle / "payloads", (bundle,), "recovery payload root")
            source = confined_child(payload_root, relative, "original payload")
            target = confined_child(root, relative, "reconstructed target")
            mode = stat.S_IMODE(target.stat().st_mode)
            _write_exclusive(stage_root / relative, read_regular(source, MAX_FILE_BYTES, "original payload"), mode)
        stage_manifest = {"schema_version": "1.0", "recovery_id": recovery_id, "manifest_sha256": manifest_sha,
                          "entries_root": entries_root, "source_archive_sha256": archive_sha, "file_count": 227,
                          "status": "VERIFIED_STAGED", "source_authorization": authorization}
        _write_exclusive(stage_root / "STAGE_RECEIPT.json", canonical_bytes(stage_manifest), 0o600)
    except Exception:
        shutil.rmtree(stage_root, ignore_errors=True)
        raise
    return {**stage_manifest, "stage_path": str(stage_root)}


def apply_staged(system_root: Path, stage_path: Path, manifest_path: Path, apply_approval: dict[str, Any],
                 trust_path: Path, workspace: Path, approved_roots: tuple[Path, ...]) -> dict[str, Any]:
    root = system_root.expanduser().resolve(strict=True)
    stage = confined(stage_path, approved_roots, "recovery stage")
    stage_receipt = json.loads(read_regular(stage / "STAGE_RECEIPT.json", 1024 * 1024, "stage receipt"))
    manifest = json.loads(read_regular(confined(manifest_path, approved_roots, "recovery manifest"),
                                      16 * 1024 * 1024, "recovery manifest"))
    manifest_sha = digest(manifest)
    if stage_receipt.get("manifest_sha256") != manifest_sha or stage_receipt.get("status") != "VERIFIED_STAGED":
        raise RecoveryFailure("staged recovery is stale or unverified")
    recovery_id = stage_receipt["recovery_id"]
    approval = skill_runtime.TrustStore.load(trust_path).verify(apply_approval, "recovery-approver",
        {"recovery_id": recovery_id, "manifest_sha256": manifest_sha,
         "entries_root": stage_receipt["entries_root"], "target_root_sha256": digest(expected_paths(root)),
         "file_count": 227})
    if approval["actor_id"] == stage_receipt["source_authorization"]["actor_id"]:
        raise RecoveryFailure("recovery approver must be independent from source owner")
    workspace_root = workspace.expanduser().resolve()
    workspace_root.mkdir(parents=True, exist_ok=True)
    backup_root = workspace_root / "backups" / recovery_id
    if backup_root.exists():
        raise RecoveryFailure("recovery backup already exists")
    entries = {entry["path"]: entry for entry in manifest["entries"]}
    inventory = expected_paths(root)
    lock_path = workspace_root / "recovery.lock"
    journal_path = workspace_root / f"{recovery_id}-RECOVERY_JOURNAL.json"
    lock_descriptor = os.open(lock_path, os.O_RDWR | os.O_CREAT | getattr(os, "O_CLOEXEC", 0), 0o600)
    replaced: list[str] = []
    journal: dict[str, Any] = {}
    receipt: dict[str, Any] = {}
    try:
        fcntl.flock(lock_descriptor, fcntl.LOCK_EX)
        for relative in inventory:
            current = read_regular(confined_child(root, relative, "reconstructed target"),
                                   MAX_FILE_BYTES, "reconstructed target")
            if digest_bytes(current) != entries[relative]["reconstructed_sha256"]:
                raise RecoveryFailure(f"target changed before apply: {relative}")
        for relative in inventory:
            target = confined_child(root, relative, "reconstructed target")
            backup = backup_root / relative
            _write_exclusive(backup, read_regular(target, MAX_FILE_BYTES, "reconstructed target"), stat.S_IMODE(target.stat().st_mode))
        for directory in sorted({(backup_root / relative).parent for relative in inventory}):
            _fsync_directory(directory)
        journal = {"schema_version": "1.0", "recovery_id": recovery_id, "status": "APPLYING",
                   "manifest_sha256": manifest_sha, "entries_root": stage_receipt["entries_root"],
                   "file_count": 227, "target_root": str(root), "backup_root": str(backup_root), "replaced": []}
        _atomic_record(journal_path, journal)
        for relative in inventory:
            target = confined_child(root, relative, "reconstructed target")
            staged = confined_child(stage, relative, "staged original")
            _atomic_replace_bytes(target, read_regular(staged, MAX_FILE_BYTES, "staged original"),
                                  stat.S_IMODE(target.stat().st_mode), recovery_id)
            replaced.append(relative)
            journal = {**journal, "replaced": list(replaced)}
            _atomic_record(journal_path, journal)
        for relative in inventory:
            observed = read_regular(confined_child(root, relative, "recovered original"),
                                    MAX_FILE_BYTES, "recovered original")
            if digest_bytes(observed) != entries[relative]["original_sha256"]:
                raise RecoveryFailure(f"post-apply verification failed: {relative}")
        journal_core = {**journal, "status": "APPLIED_PENDING_VERIFICATION", "replaced": list(replaced)}
        receipt = {"schema_version": "1.0", "recovery_id": recovery_id,
                   "status": "APPLIED_PENDING_VERIFICATION", "original_payload_recovered": False,
                   "file_count": 227, "manifest_sha256": manifest_sha,
                   "entries_root": stage_receipt["entries_root"],
                   "source_archive_sha256": stage_receipt["source_archive_sha256"],
                   "source_authorization": stage_receipt["source_authorization"],
                   "apply_approval": approval, "backup_path": str(backup_root),
                   "journal_sha256": digest(journal_core)}
        journal = {**journal_core, "pending_receipt": receipt}
        _atomic_record(journal_path, journal)
    except Exception:
        for relative in inventory:
            target = confined_child(root, relative, "recovery target")
            temporary = target.with_name(target.name + f".{recovery_id}.tmp")
            if temporary.is_file():
                temporary.unlink()
        for relative in reversed(replaced):
            backup = confined_child(backup_root, relative, "recovery backup")
            if backup.is_file():
                target = confined_child(root, relative, "recovery target")
                _atomic_replace_bytes(target, read_regular(backup, MAX_FILE_BYTES, "recovery backup"),
                                      stat.S_IMODE(target.stat().st_mode), recovery_id + "-rollback")
        if journal and journal_path.exists():
            _atomic_record(journal_path, {**journal, "status": "ROLLED_BACK", "replaced": []})
        raise
    finally:
        fcntl.flock(lock_descriptor, fcntl.LOCK_UN)
        os.close(lock_descriptor)
    receipt_path = workspace_root / f"{recovery_id}-APPLY_RECEIPT.json"
    _write_exclusive(receipt_path, canonical_bytes(receipt), 0o600)
    return receipt


def recover_interrupted(system_root: Path, manifest_path: Path, workspace: Path,
                        approved_roots: tuple[Path, ...]) -> dict[str, Any]:
    """Rollback APPLYING or reconstruct a missing receipt after a durable apply commit."""
    root = system_root.expanduser().resolve(strict=True)
    manifest = json.loads(read_regular(confined(manifest_path, approved_roots, "recovery manifest"),
                                       16 * 1024 * 1024, "recovery manifest"))
    recovery_id = safe_relative(manifest.get("recovery_id"))
    workspace_root = workspace.expanduser().resolve(strict=True)
    journal_path = workspace_root / f"{recovery_id}-RECOVERY_JOURNAL.json"
    journal = json.loads(read_regular(journal_path, 16 * 1024 * 1024, "recovery journal"))
    if journal.get("status") not in {"APPLYING", "APPLIED_PENDING_VERIFICATION"} or \
            journal.get("manifest_sha256") != digest(manifest):
        raise RecoveryFailure("no matching interrupted recovery journal")
    backup_root = Path(journal["backup_root"]).expanduser().resolve(strict=True)
    if workspace_root not in backup_root.parents:
        raise RecoveryFailure("recovery backup escapes workspace")
    entries = {entry["path"]: entry for entry in manifest["entries"]}
    inventory = expected_paths(root)
    lock_descriptor = os.open(workspace_root / "recovery.lock", os.O_RDWR | os.O_CREAT | getattr(os, "O_CLOEXEC", 0), 0o600)
    restored = 0
    try:
        fcntl.flock(lock_descriptor, fcntl.LOCK_EX)
        if journal["status"] == "APPLIED_PENDING_VERIFICATION":
            pending = journal.get("pending_receipt")
            journal_core = {key: value for key, value in journal.items() if key != "pending_receipt"}
            if (not isinstance(pending, dict) or pending.get("status") != "APPLIED_PENDING_VERIFICATION" or
                    pending.get("original_payload_recovered") is not False or
                    pending.get("journal_sha256") != digest(journal_core)):
                raise RecoveryFailure("pending apply receipt is missing or tampered")
            for relative in inventory:
                target = confined_child(root, relative, "recovered original")
                if digest_bytes(read_regular(target, MAX_FILE_BYTES, "recovered original")) != entries[relative]["original_sha256"]:
                    raise RecoveryFailure(f"pending apply target differs from original payload: {relative}")
            receipt_path = workspace_root / f"{recovery_id}-APPLY_RECEIPT.json"
            if receipt_path.exists():
                if json.loads(read_regular(receipt_path, 16 * 1024 * 1024, "apply receipt")) != pending:
                    raise RecoveryFailure("existing apply receipt differs from the journal")
            else:
                _write_exclusive(receipt_path, canonical_bytes(pending), 0o600)
            return {**pending, "receipt_recovered_after_crash": True}
        for relative in inventory:
            target = confined_child(root, relative, "recovery target")
            temporary = target.with_name(target.name + f".{recovery_id}.tmp")
            if temporary.is_file():
                temporary.unlink()
                _fsync_directory(target.parent)
            observed = digest_bytes(read_regular(target, MAX_FILE_BYTES, "recovery target"))
            if observed == entries[relative]["original_sha256"]:
                backup = confined_child(backup_root, relative, "recovery backup")
                _atomic_replace_bytes(target, read_regular(backup, MAX_FILE_BYTES, "recovery backup"),
                                      stat.S_IMODE(target.stat().st_mode), recovery_id + "-crash-rollback")
                restored += 1
            elif observed != entries[relative]["reconstructed_sha256"]:
                raise RecoveryFailure(f"interrupted target has an unknown digest: {relative}")
        for relative in inventory:
            if digest_bytes(read_regular(confined_child(root, relative, "restored target"),
                                         MAX_FILE_BYTES, "restored target")) != entries[relative]["reconstructed_sha256"]:
                raise RecoveryFailure(f"crash rollback verification failed: {relative}")
        final_journal = {**journal, "status": "ROLLED_BACK_AFTER_CRASH", "replaced": []}
        _atomic_record(journal_path, final_journal)
    finally:
        fcntl.flock(lock_descriptor, fcntl.LOCK_UN)
        os.close(lock_descriptor)
    return {"schema_version": "1.0", "recovery_id": recovery_id, "status": "ROLLED_BACK_AFTER_CRASH",
            "original_payload_recovered": False, "restored_files": restored, "file_count": 227,
            "manifest_sha256": digest(manifest)}


def verify_applied(system_root: Path, manifest_path: Path, apply_receipt_path: Path,
                   verification: dict[str, Any], trust_path: Path, workspace: Path,
                   approved_roots: tuple[Path, ...]) -> dict[str, Any]:
    """Independently verify all recovered bytes before declaring original recovery."""
    root = system_root.expanduser().resolve(strict=True)
    manifest = json.loads(read_regular(confined(manifest_path, approved_roots, "recovery manifest"),
                                       16 * 1024 * 1024, "recovery manifest"))
    receipt = json.loads(read_regular(confined(apply_receipt_path, approved_roots, "apply receipt"),
                                      16 * 1024 * 1024, "apply receipt"))
    if (receipt.get("status") != "APPLIED_PENDING_VERIFICATION" or receipt.get("manifest_sha256") != digest(manifest) or
            receipt.get("original_payload_recovered") is not False):
        raise RecoveryFailure("apply receipt is not eligible for independent verification")
    workspace_root = workspace.expanduser().resolve(strict=True)
    journal = json.loads(read_regular(workspace_root / f"{receipt['recovery_id']}-RECOVERY_JOURNAL.json",
                                      16 * 1024 * 1024, "recovery journal"))
    journal_core = {key: value for key, value in journal.items() if key != "pending_receipt"}
    if (journal.get("status") != "APPLIED_PENDING_VERIFICATION" or
            journal.get("pending_receipt") != receipt or digest(journal_core) != receipt.get("journal_sha256")):
        raise RecoveryFailure("apply journal is stale or tampered")
    entries = {entry["path"]: entry for entry in manifest["entries"]}
    inventory = expected_paths(root)
    for relative in inventory:
        if digest_bytes(read_regular(confined_child(root, relative, "recovered original"),
                                     MAX_FILE_BYTES, "recovered original")) != entries[relative]["original_sha256"]:
            raise RecoveryFailure(f"independent recovery verification failed: {relative}")
    receipt_sha = digest(receipt)
    verifier = skill_runtime.TrustStore.load(trust_path).verify(verification, "recovery-verifier",
        {"recovery_id": receipt["recovery_id"], "manifest_sha256": receipt["manifest_sha256"],
         "apply_receipt_sha256": receipt_sha, "entries_root": receipt["entries_root"], "file_count": 227})
    conflicted = {receipt["source_authorization"]["actor_id"], receipt["apply_approval"]["actor_id"]}
    if verifier["actor_id"] in conflicted:
        raise RecoveryFailure("recovery verifier must be independent from source owner and approver")
    final = {**receipt, "status": "RECOVERED_ORIGINAL", "original_payload_recovered": True,
             "apply_receipt_sha256": receipt_sha, "independent_verifier": verifier}
    final_path = workspace_root / f"{receipt['recovery_id']}-VERIFIED_RECOVERY_RECEIPT.json"
    if final_path.exists():
        raise RecoveryFailure("verified recovery receipt already exists")
    _write_exclusive(final_path, canonical_bytes(final), 0o600)
    return final


def json_file(path: Path, label: str) -> dict[str, Any]:
    try:
        value = json.loads(read_regular(path, 16 * 1024 * 1024, label))
    except json.JSONDecodeError as exc:
        raise RecoveryFailure(f"{label} is invalid JSON") from exc
    if not isinstance(value, dict):
        raise RecoveryFailure(f"{label} must be an object")
    return value


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    inventory = sub.add_parser("inventory")
    inventory.add_argument("--system-root", type=Path, required=True)
    stage = sub.add_parser("stage")
    stage.add_argument("--system-root", type=Path, required=True)
    stage.add_argument("--bundle-root", type=Path, required=True)
    stage.add_argument("--manifest", type=Path, required=True)
    stage.add_argument("--source-authorization", type=Path, required=True)
    stage.add_argument("--trust-store", type=Path, required=True)
    stage.add_argument("--workspace", type=Path, required=True)
    stage.add_argument("--approved-root", type=Path, action="append", required=True)
    apply = sub.add_parser("apply")
    apply.add_argument("--system-root", type=Path, required=True)
    apply.add_argument("--stage-path", type=Path, required=True)
    apply.add_argument("--manifest", type=Path, required=True)
    apply.add_argument("--apply-approval", type=Path, required=True)
    apply.add_argument("--trust-store", type=Path, required=True)
    apply.add_argument("--workspace", type=Path, required=True)
    apply.add_argument("--approved-root", type=Path, action="append", required=True)
    recover = sub.add_parser("recover-interrupted")
    recover.add_argument("--system-root", type=Path, required=True)
    recover.add_argument("--manifest", type=Path, required=True)
    recover.add_argument("--workspace", type=Path, required=True)
    recover.add_argument("--approved-root", type=Path, action="append", required=True)
    verify = sub.add_parser("verify-applied")
    verify.add_argument("--system-root", type=Path, required=True)
    verify.add_argument("--manifest", type=Path, required=True)
    verify.add_argument("--apply-receipt", type=Path, required=True)
    verify.add_argument("--verification", type=Path, required=True)
    verify.add_argument("--trust-store", type=Path, required=True)
    verify.add_argument("--workspace", type=Path, required=True)
    verify.add_argument("--approved-root", type=Path, action="append", required=True)
    args = parser.parse_args()
    if args.command == "inventory":
        paths = expected_paths(args.system_root)
        result = {"schema_version": "1.0", "file_count": len(paths), "inventory_sha256": digest(paths), "paths": paths}
    else:
        roots = tuple(path.expanduser().resolve(strict=True) for path in args.approved_root)
        if args.command == "stage":
            result = verify_and_stage(args.system_root, args.bundle_root, args.manifest,
                json_file(args.source_authorization, "source authorization"), args.trust_store, args.workspace, roots)
        elif args.command == "apply":
            result = apply_staged(args.system_root, args.stage_path, args.manifest,
                json_file(args.apply_approval, "apply approval"), args.trust_store, args.workspace, roots)
        elif args.command == "recover-interrupted":
            result = recover_interrupted(args.system_root, args.manifest, args.workspace, roots)
        elif args.command == "verify-applied":
            result = verify_applied(args.system_root, args.manifest, args.apply_receipt,
                json_file(args.verification, "independent recovery verification"), args.trust_store,
                args.workspace, roots)
        else:
            raise AssertionError(args.command)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
