#!/usr/bin/env python3
"""Unit and integration tests for scripts/validate_web_app_acceptance.py."""

from __future__ import annotations

import csv
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent


def _load_validator_module():
    module_path = SCRIPT_DIR / "validate_web_app_acceptance.py"
    spec = importlib.util.spec_from_file_location("validate_web_app_acceptance", module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load validator spec from {module_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


_VALIDATOR = _load_validator_module()
AcceptanceSuiteValidationError = _VALIDATOR.AcceptanceSuiteValidationError
UTF8_BOM = _VALIDATOR.UTF8_BOM
validate_acceptance_suite = _VALIDATOR.validate_acceptance_suite

PARENT_SUITE_DIR = Path("/Users/stephen/Documents/Projects/DoctorPro/bible3dsphereWeb/docs/web-app-acceptance")
LOCAL_SUITE_DIR = REPO_ROOT / "docs" / "web-app-acceptance"


def _resolve_reference_suite_dir() -> Path:
    if PARENT_SUITE_DIR.is_dir():
        return PARENT_SUITE_DIR
    return LOCAL_SUITE_DIR


def _snapshot_suite_hashes(suite_dir: Path) -> dict[str, str]:
    return {
        name: hashlib.sha256((suite_dir / name).read_bytes()).hexdigest()
        for name in ("README.md", "cases.csv", "coverage.csv")
    }


def _copy_suite_to_temp(src_dir: Path, dst_dir: Path) -> Path:
    target = dst_dir / "web-app-acceptance"
    shutil.copytree(src_dir, target)
    return target


def _rewrite_bom_csv(path: Path, fieldnames: list[str], rows: list[dict[str, str]]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


class ValidateWebAppAcceptanceTests(unittest.TestCase):
    """Verifies all structural, security, and cross-repo invariants of the 703-case validator."""

    def setUp(self) -> None:
        self.reference_suite = _resolve_reference_suite_dir()
        self.assertTrue(
            self.reference_suite.is_dir(),
            f"Expected reference acceptance suite at {self.reference_suite}",
        )
        self.pre_hashes = _snapshot_suite_hashes(self.reference_suite)

    def tearDown(self) -> None:
        post_hashes = _snapshot_suite_hashes(self.reference_suite)
        self.assertEqual(
            self.pre_hashes,
            post_hashes,
            "Reference docs/web-app-acceptance files MUST remain 100% byte-for-byte immutable!",
        )

    def test_01_real_703_suite_passes_and_preserves_sha256(self) -> None:
        receipt = validate_acceptance_suite(self.reference_suite, web_repo=REPO_ROOT)
        self.assertTrue(receipt["executed"])
        self.assertGreater(receipt["pid"], 0)
        self.assertTrue(receipt["valid"], msg=json.dumps(receipt["violations"], ensure_ascii=False, indent=2))
        self.assertEqual(receipt["violation_count"], 0)
        self.assertEqual(receipt["count"], 703)
        self.assertEqual(receipt["scenarios"], 198)
        self.assertEqual(receipt["source_registry"], 505)
        self.assertEqual(receipt["roster_cases"], 100)
        self.assertEqual(receipt["input_sha256"], self.pre_hashes)

        continuity = receipt["head_continuity"]
        self.assertTrue(continuity["all_referenced_paths_exist_on_head"])
        self.assertEqual(continuity["missing_on_head"], {})
        self.assertIsInstance(continuity["modified_referenced_files"], list)

        unmapped = receipt["unmapped_resolution"]
        self.assertEqual(unmapped["unmapped_count"], 27)
        if unmapped["app_repo_available"]:
            self.assertEqual(unmapped["candidate_missing_at_app_baseline"], {})
            counts = unmapped["classification_counts"]
            self.assertEqual(counts.get("待确认旧入口"), 7)
            self.assertGreater(counts.get("候选待实测建议", 0), 0)

    def test_02_rejects_missing_utf8_bom_and_extra_files(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            copied = _copy_suite_to_temp(self.reference_suite, Path(tmp))
            cases_path = copied / "cases.csv"
            raw = cases_path.read_bytes()
            self.assertTrue(raw.startswith(UTF8_BOM))
            cases_path.write_bytes(raw[len(UTF8_BOM) :])
            (copied / "stray.txt").write_text("unexpected", encoding="utf-8")

            receipt = validate_acceptance_suite(copied, web_repo=REPO_ROOT)
            self.assertFalse(receipt["valid"])
            codes = {v["code"] for v in receipt["violations"]}
            self.assertIn("MISSING_UTF8_BOM", codes)
            self.assertIn("DIRECTORY_MEMBERSHIP_MISMATCH", codes)

    def test_03_rejects_csv_formula_injection(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            copied = _copy_suite_to_temp(self.reference_suite, Path(tmp))
            cases_path = copied / "cases.csv"
            with cases_path.open("r", encoding="utf-8-sig", newline="") as handle:
                reader = csv.DictReader(handle, strict=True)
                headers = list(reader.fieldnames or [])
                rows = list(reader)
            rows[0]["用例"] = "=CMD|' /C calc'!A0"
            _rewrite_bom_csv(cases_path, headers, rows)

            receipt = validate_acceptance_suite(copied, web_repo=REPO_ROOT)
            self.assertFalse(receipt["valid"])
            codes = {v["code"] for v in receipt["violations"]}
            self.assertIn("CSV_FORMULA_INJECTION", codes)

    def test_04_rejects_duplicate_case_ids_and_non_not_run_baseline_mutation(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            copied = _copy_suite_to_temp(self.reference_suite, Path(tmp))
            cases_path = copied / "cases.csv"
            with cases_path.open("r", encoding="utf-8-sig", newline="") as handle:
                reader = csv.DictReader(handle, strict=True)
                headers = list(reader.fieldnames or [])
                rows = list(reader)
            rows[1]["Case ID"] = rows[0]["Case ID"]
            rows[2]["状态"] = "PASS"
            rows[2]["实测结果"] = "Premature baseline mutation"
            _rewrite_bom_csv(cases_path, headers, rows)

            receipt = validate_acceptance_suite(copied, web_repo=REPO_ROOT)
            self.assertFalse(receipt["valid"])
            codes = {v["code"] for v in receipt["violations"]}
            self.assertIn("DUPLICATE_CASE_IDS", codes)
            self.assertIn("CASES_COVERAGE_JOIN_MISMATCH", codes)
            self.assertIn("NON_BASELINE_STATUS", codes)
            self.assertIn("NON_EMPTY_BASELINE_EXECUTION_FIELDS", codes)

            with self.assertRaises(AcceptanceSuiteValidationError):
                validate_acceptance_suite(copied, web_repo=REPO_ROOT, strict=True)

    def test_05_rejects_out_of_bounds_web_source_line_reference(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            copied = _copy_suite_to_temp(self.reference_suite, Path(tmp))
            cases_path = copied / "cases.csv"
            coverage_path = copied / "coverage.csv"
            with cases_path.open("r", encoding="utf-8-sig", newline="") as handle:
                c_reader = csv.DictReader(handle, strict=True)
                c_headers = list(c_reader.fieldnames or [])
                c_rows = list(c_reader)
            with coverage_path.open("r", encoding="utf-8-sig", newline="") as handle:
                cov_reader = csv.DictReader(handle, strict=True)
                cov_headers = list(cov_reader.fieldnames or [])
                cov_rows = list(cov_reader)

            target_id = c_rows[0]["Case ID"]
            bad_ref = "src/App.jsx#L999999"
            c_rows[0]["Web 源码"] = bad_ref
            for r in cov_rows:
                if r["逐项用例"] == target_id:
                    r["Web 源码"] = bad_ref
            _rewrite_bom_csv(cases_path, c_headers, c_rows)
            _rewrite_bom_csv(coverage_path, cov_headers, cov_rows)

            receipt = validate_acceptance_suite(copied, web_repo=REPO_ROOT)
            self.assertFalse(receipt["valid"])
            codes = {v["code"] for v in receipt["violations"]}
            self.assertIn("WEB_SOURCE_LINE_OUT_OF_RANGE", codes)

    def test_06_graceful_ci_portability_when_app_repo_missing_and_cli_exit_codes(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            missing_app = Path(tmp) / "nonexistent-bible3dsphereApp"
            receipt = validate_acceptance_suite(
                self.reference_suite,
                web_repo=REPO_ROOT,
                app_repo=missing_app,
            )
            self.assertTrue(receipt["valid"], msg=json.dumps(receipt["violations"], ensure_ascii=False))
            self.assertFalse(receipt["unmapped_resolution"]["app_repo_available"])
            self.assertEqual(
                receipt["unmapped_resolution"]["classification_counts"].get("待确认旧入口"),
                7,
            )

            json_out = Path(tmp) / "receipt.json"
            cli_pass = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT_DIR / "validate_web_app_acceptance.py"),
                    str(self.reference_suite),
                    "--web-repo",
                    str(REPO_ROOT),
                    "--app-repo",
                    str(missing_app),
                    "--json-out",
                    str(json_out),
                ],
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(cli_pass.returncode, 0, msg=cli_pass.stderr)
            written = json.loads(json_out.read_text(encoding="utf-8"))
            self.assertTrue(written["valid"])
            self.assertEqual(written["count"], 703)

            tampered = _copy_suite_to_temp(self.reference_suite, Path(tmp))
            (tampered / "extra.tmp").write_text("bad", encoding="utf-8")
            cli_fail = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT_DIR / "validate_web_app_acceptance.py"),
                    str(tampered),
                    "--web-repo",
                    str(REPO_ROOT),
                ],
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(cli_fail.returncode, 1)


if __name__ == "__main__":
    unittest.main()
