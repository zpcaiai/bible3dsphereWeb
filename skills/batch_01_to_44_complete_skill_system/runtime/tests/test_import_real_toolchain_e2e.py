from __future__ import annotations

import copy
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path


RUNTIME_ROOT = Path(__file__).resolve().parents[1]


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


runtime = load_module("skill_runtime", RUNTIME_ROOT / "skill_runtime.py")
importer = load_module("batch_real_toolchain_importer", RUNTIME_ROOT / "import_real_toolchain_e2e.py")


class RealToolchainImporterTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.report_path = self.root / "real-toolchain-e2e-report.json"

    def tearDown(self) -> None:
        self.temporary.cleanup()

    @staticmethod
    def report() -> dict:
        data_digest = "sha256:" + "1" * 64
        return {
            "schema_version": "1.0",
            "run_id": "rmp-e2e-deadbeef",
            "decision": "PASS",
            "certified": False,
            "database": {
                "route": "PostgreSQL 16 source to PostgreSQL 17 target",
                "source": {
                    "engine_version": "PostgreSQL 16.9",
                    "image": "postgres@sha256:" + "5" * 64,
                    "image_digest": "postgres@sha256:" + "5" * 64,
                },
                "target": {
                    "engine_version": "PostgreSQL 17.5",
                    "image": "postgres@sha256:" + "6" * 64,
                    "image_digest": "postgres@sha256:" + "6" * 64,
                },
                "migration_tools": {
                    "source_dump": "pg_dump 16.9",
                    "target_restore": "pg_restore 17.5",
                    "migration_checksum": "sha256:" + "7" * 64,
                    "migration_ledger": "migration-002:sha256:abc",
                },
                "row_counts": {"accounts": 2, "ledger_entries": 3},
                "data_sha256": data_digest,
                "schema_sha256": "sha256:" + "2" * 64,
                "rollback_sha256": data_digest,
                "detail_reconciliation": "PASS",
                "backup_restore": "PASS",
                "expand_contract_idempotency": "PASS",
                "negative_tests": {
                    "duplicate_idempotency_key": "PASS",
                    "transaction_rollback": "PASS",
                },
            },
            "providers": {
                "minio_s3": {
                    "endpoint_kind": "isolated-local-integration",
                    "server_image": "minio/minio@sha256:" + "8" * 64,
                    "server_image_digest": "minio/minio@sha256:" + "8" * 64,
                    "client_image": "minio/mc@sha256:" + "9" * 64,
                    "client_image_digest": "minio/mc@sha256:" + "9" * 64,
                    "put_get_delete": "PASS",
                    "cleanup": "PASS",
                    "object_sha256": "sha256:" + "3" * 64,
                    "stat_sha256": "sha256:" + "4" * 64,
                    "server_version": "MinIO RELEASE.2025-04-22",
                    "client_version": "mc RELEASE.2025-04-16",
                },
                "github": {
                    "endpoint": "api.github.com",
                    "authenticated_read": "PASS",
                    "expected_commit": "a" * 40,
                    "observed_commit": "a" * 40,
                    "repository": "zpcaiai/elmos",
                    "visibility": "public",
                    "default_branch": "main",
                },
            },
            "corpora": {
                "development": "EXECUTED",
                "negative": "EXECUTED",
                "holdout": "NOT_RUN",
                "production": "NOT_RUN",
            },
            "cleanup": {"database": "PASS", "provider": "PASS", "network": "PASS"},
            "limitations": ["Independent Holdout and production remain NOT_RUN."],
        }

    def write_report(self, value: dict) -> None:
        self.report_path.write_text(json.dumps(value), encoding="utf-8")

    def test_materializes_exact_batch31_and_batch33_development_subjects(self) -> None:
        self.write_report(self.report())
        paths = importer.materialize(self.report_path, self.root / "imported")
        self.assertEqual(4, len(paths))
        subjects = [json.loads(path.read_text(encoding="utf-8")) for path in paths if "subject" in path.name]
        self.assertEqual({31, 33}, {subject["batch"] for subject in subjects})
        self.assertEqual({"development"}, {subject["corpus"]["role"] for subject in subjects})
        self.assertTrue(all(subject["decision"] == "PASS" for subject in subjects))

    def test_rejects_restore_detail_mismatch(self) -> None:
        value = self.report()
        value["database"]["rollback_sha256"] = "sha256:" + "9" * 64
        self.write_report(value)
        with self.assertRaisesRegex(runtime.RuntimeFailure, "rollback restore"):
            importer.materialize(self.report_path, self.root / "imported")

    def test_rejects_incomplete_cleanup(self) -> None:
        value = self.report()
        value["cleanup"]["provider"] = "FAIL"
        self.write_report(value)
        with self.assertRaisesRegex(runtime.RuntimeFailure, "Schema validation failed"):
            importer.materialize(self.report_path, self.root / "imported")

    def test_rejects_holdout_or_production_claim_injection(self) -> None:
        for field in ("holdout", "production"):
            value = copy.deepcopy(self.report())
            value["corpora"][field] = "EXECUTED"
            self.write_report(value)
            with self.assertRaisesRegex(runtime.RuntimeFailure, "Schema validation failed"):
                importer.materialize(self.report_path, self.root / f"imported-{field}")


if __name__ == "__main__":
    unittest.main()
