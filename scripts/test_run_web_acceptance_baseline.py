#!/usr/bin/env python3
"""End-to-end unit tests for scripts/run_web_acceptance_baseline.py."""

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


def _load_runner_module():
    module_path = SCRIPT_DIR / "run_web_acceptance_baseline.py"
    spec = importlib.util.spec_from_file_location("run_web_acceptance_baseline", module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load runner spec from {module_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


_RUNNER = _load_runner_module()
FORMULA_INJECTION_PREFIXES = _RUNNER.FORMULA_INJECTION_PREFIXES
UTF8_BOM = _RUNNER.UTF8_BOM
run_web_acceptance_precheck = _RUNNER.run_web_acceptance_precheck

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


def _find_shared_node_modules(repo_root: Path) -> Path | None:
    local_nm = repo_root / "node_modules"
    if (local_nm / ".bin" / "vitest").exists():
        return local_nm
    proc = subprocess.run(
        ["git", "-C", str(repo_root), "rev-parse", "--git-common-dir"],
        check=False,
        capture_output=True,
        text=True,
    )
    if proc.returncode == 0:
        raw_common = proc.stdout.strip()
        common_dir = (repo_root / raw_common).resolve() if not Path(raw_common).is_absolute() else Path(raw_common).resolve()
        candidate_nm = common_dir.parent / "node_modules"
        if (candidate_nm / ".bin" / "vitest").exists():
            return candidate_nm
    return None


class RunWebAcceptanceBaselineTests(unittest.TestCase):
    """Verifies real Vitest execution, baseline SHA-256 immutability, and non-overclaim rules."""

    _created_nm_symlink: bool = False

    @classmethod
    def setUpClass(cls) -> None:
        local_nm = REPO_ROOT / "node_modules"
        if not local_nm.exists() and not local_nm.is_symlink():
            shared_nm = _find_shared_node_modules(REPO_ROOT)
            if shared_nm is not None and shared_nm.resolve() != local_nm.resolve():
                local_nm.symlink_to(shared_nm)
                cls._created_nm_symlink = True

    @classmethod
    def tearDownClass(cls) -> None:
        local_nm = REPO_ROOT / "node_modules"
        if cls._created_nm_symlink and local_nm.is_symlink():
            local_nm.unlink()
            cls._created_nm_symlink = False

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

    def test_01_real_vitest_precheck_execution_and_strict_non_overclaim(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            web_repo = REPO_ROOT
            out_dir = tmp_path / "web-run-01"
            targets = [
                "src/features/spiritual-planet/__tests__/digitalHumanContracts.test.js",
                "src/features/ai-formation/__tests__/AiFormationPage.test.jsx",
                "src/test/sanitize.test.js",
            ]

            summary = run_web_acceptance_precheck(
                suite_dir=self.reference_suite,
                output_dir=out_dir,
                web_repo=web_repo,
                vitest_targets=targets,
                record_known_web_blockers=False,
            )

            self.assertTrue(summary["executed"])
            self.assertTrue(summary["baseline_immutability_verified"])
            self.assertEqual(summary["baseline_suite_sha256_before"], self.pre_hashes)
            self.assertEqual(summary["baseline_suite_sha256_after"], self.pre_hashes)

            vp = summary["vitest_process"]
            self.assertGreater(vp["pid"], 0)
            self.assertEqual(vp["returncode"], 0)
            self.assertEqual(vp["num_passed_suites"], 3)
            self.assertEqual(vp["num_failed_suites"], 0)
            self.assertGreater(vp["num_passed_tests"], 20)

            report_path = Path(vp["vitest_report_path"])
            self.assertTrue(report_path.is_file())
            self.assertEqual(
                hashlib.sha256(report_path.read_bytes()).hexdigest(),
                vp["vitest_report_sha256"],
            )

            # Zero false claims of cross-platform PASS:
            self.assertEqual(summary["cross_platform_acceptance_pass"], 0)
            self.assertEqual(summary["certification_state"], "NOT_CERTIFIED")
            self.assertEqual(summary["status_counts"], {"NOT_RUN": 703})
            self.assertEqual(summary["web_local_vitest_verified_cases"], 4)

            worksheet_path = Path(summary["worksheet_path"])
            self.assertTrue(worksheet_path.read_bytes().startswith(UTF8_BOM))
            with worksheet_path.open("r", encoding="utf-8-sig", newline="") as handle:
                rows = list(csv.DictReader(handle, strict=True))
            self.assertEqual(len(rows), 703)
            rows_by_id = {r["Case ID"]: r for r in rows}

            # Every DEVICE and PROVIDER case remains strictly NOT_RUN without fake evidence:
            for row in rows:
                self.assertNotEqual(row["状态"], "PASS")
                if row["执行方式"] == "DEVICE" or row["夹具"] in {"DEVICE", "PROVIDER"}:
                    self.assertEqual(row["状态"], "NOT_RUN")
                    self.assertEqual(row["实测结果"], "")
                    self.assertEqual(row["证据"], "")

            # UI cases backed by AiFormationPage.test.jsx carry honest precheck evidence:
            for verified_id in (
                "REG-AIF-TAB-OVERVIEW",
                "REG-AIF-TAB-CONTEXT",
                "REG-AIF-TAB-BATCHES",
                "REG-AIF-TAB-GOVERNANCE",
            ):
                vrow = rows_by_id[verified_id]
                self.assertEqual(vrow["状态"], "NOT_RUN")
                self.assertIn("Vitest jsdom precheck", vrow["平台与版本"])
                self.assertIn("跨端真机与实网对照待执行", vrow["实测结果"])
                self.assertIn(f"pid={vp['pid']}", vrow["证据"])
                self.assertIn(vp["vitest_report_sha256"][:12], vrow["证据"])

            # UI-06 has 执行方式 == 'E2E' and 夹具 == 'FAULT', so even though sanitize.test.js ran
            # and passed, the runner must NOT claim it under UI/eligible-fixture precheck:
            self.assertEqual(rows_by_id["UI-06"]["状态"], "NOT_RUN")
            self.assertEqual(rows_by_id["UI-06"]["证据"], "")

            # MirrorPage.jsx maps to BOTH MirrorPageDigitalHuman.test.jsx and digitalHumanContracts.test.js;
            # because only digitalHumanContracts.test.js ran, MirrorPage UI cases must NOT be claimed!
            self.assertEqual(rows_by_id["MAP-05"]["证据"], "")

            evidence = json.loads(Path(summary["evidence_path"]).read_text(encoding="utf-8"))
            self.assertEqual(evidence["verified_case_count"], 4)
            self.assertEqual(evidence["vitest_pid"], vp["pid"])

    def test_02_cli_record_known_web_blockers_and_formula_safety(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            web_repo = REPO_ROOT
            out_root = tmp_path / "cli-runs"

            cli_proc = subprocess.run(
                [
                    sys.executable,
                    str(SCRIPT_DIR / "run_web_acceptance_baseline.py"),
                    "--suite-dir",
                    str(self.reference_suite),
                    "--output-dir",
                    str(out_root),
                    "--timestamp-subdir",
                    "--web-repo",
                    str(web_repo),
                    "--vitest-targets",
                    "src/features/spiritual-planet/__tests__/digitalHumanContracts.test.js",
                    "--record-known-web-blockers",
                ],
                check=False,
                capture_output=True,
                text=True,
            )
            self.assertEqual(cli_proc.returncode, 0, msg=cli_proc.stderr)
            summary = json.loads(cli_proc.stdout)
            self.assertGreater(summary["vitest_process"]["pid"], 0)
            self.assertEqual(summary["cross_platform_acceptance_pass"], 0)
            self.assertEqual(
                summary["known_external_blockers_recorded"],
                ["DH-05", "DH-06", "DH-07", "DH-08"],
            )
            self.assertEqual(summary["status_counts"], {"BLOCKED": 4, "NOT_RUN": 699})

            worksheet_path = Path(summary["worksheet_path"])
            with worksheet_path.open("r", encoding="utf-8-sig", newline="") as handle:
                rows = list(csv.DictReader(handle, strict=True))
            by_id = {r["Case ID"]: r for r in rows}
            for dh_id in ("DH-05", "DH-06", "DH-07", "DH-08"):
                self.assertEqual(by_id[dh_id]["状态"], "BLOCKED")
                self.assertIn("负责方=", by_id[dh_id]["实测结果"])
                self.assertIn("解锁条件=", by_id[dh_id]["实测结果"])

            for row in rows:
                for col, val in row.items():
                    stripped = val.lstrip()
                    if stripped:
                        self.assertNotIn(
                            stripped[0],
                            FORMULA_INJECTION_PREFIXES,
                            msg=f"Formula prefix in {row['Case ID']} col {col}: {val}",
                        )

    def test_03_refuses_output_inside_suite_dir_and_rejects_tampered_baseline(self) -> None:
        with self.assertRaises(ValueError):
            run_web_acceptance_precheck(
                suite_dir=self.reference_suite,
                output_dir=self.reference_suite / "nested-illegal-out",
                web_repo=REPO_ROOT,
                vitest_targets=["src/test/sanitize.test.js"],
            )

        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            tampered_suite = tmp_path / "tampered-suite"
            shutil.copytree(self.reference_suite, tampered_suite)
            (tampered_suite / "unexpected.txt").write_text("corrupt", encoding="utf-8")

            with self.assertRaises(RuntimeError):
                run_web_acceptance_precheck(
                    suite_dir=tampered_suite,
                    output_dir=tmp_path / "out",
                    web_repo=REPO_ROOT,
                    vitest_targets=["src/test/sanitize.test.js"],
                )


if __name__ == "__main__":
    unittest.main()
