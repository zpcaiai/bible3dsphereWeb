#!/usr/bin/env python3
"""Deterministic Web precheck runner for the 703-case Web -> App migration suite.

Follows docs/web-app-acceptance/README.md ("每个平台和构建各复制一份执行表，保留原表作为回归基线"):
1. Validates the sealed baseline suite via validate_acceptance_suite (pre-run & post-run SHA-256).
2. Spawns a real child OS process (subprocess.Popen, pid > 0) running Vitest with JSON output.
3. Writes an isolated UTF-8 BOM worksheet copy (<output-dir>/cases.web-local.csv) plus
   vitest-report.json, web-precheck-evidence.json, and summary.json WITHOUT ever mutating
   docs/web-app-acceptance/ or overclaiming cross-platform/device/provider acceptance.
"""

from __future__ import annotations

import argparse
from collections import Counter
import csv
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
from typing import Any

SCRIPT_DIR = Path(__file__).resolve().parent


def _load_validator_module():
    module_path = SCRIPT_DIR / "validate_web_app_acceptance.py"
    spec = importlib.util.spec_from_file_location("validate_web_app_acceptance", module_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Unable to load validator module at {module_path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


_VALIDATOR = _load_validator_module()
EXPECTED_CASES_HEADERS: tuple[str, ...] = _VALIDATOR.EXPECTED_CASES_HEADERS
EXPECTED_SUITE_FILES: frozenset[str] = _VALIDATOR.EXPECTED_SUITE_FILES
FORMULA_INJECTION_PREFIXES: tuple[str, ...] = _VALIDATOR.FORMULA_INJECTION_PREFIXES
UTF8_BOM: bytes = _VALIDATOR.UTF8_BOM
validate_acceptance_suite = _VALIDATOR.validate_acceptance_suite

ELIGIBLE_LOCAL_UI_FIXTURES = frozenset({"VISITOR", "OWNER", "LANG", "ROLES", "SAFETY"})

DEFAULT_VITEST_TARGETS: tuple[str, ...] = (
    "src/features/spiritual-planet/__tests__/digitalHumanContracts.test.js",
    "src/features/spiritual-planet/__tests__/DigitalHumanWorkspace.test.jsx",
    "src/features/spiritual-planet/__tests__/SpiritualPlanetPlatformPage.test.jsx",
    "src/features/spiritual-planet/__tests__/DiscernmentWorkspace.test.jsx",
    "src/features/ai-formation/__tests__/AiFormationPage.test.jsx",
    "src/features/ai-formation/__tests__/program.test.js",
    "src/features/formation-twin/__tests__/FormationTwinWorkspace.test.jsx",
    "src/features/spiritual-formation/__tests__/PlatformIntegrationDashboard.test.jsx",
    "src/features/spiritual-formation/__tests__/PracticeHubSpiritualFormation.test.jsx",
    "src/features/crisis-care/__tests__/crisisCarePage.smoke.test.jsx",
    "src/features/crisis-care/__tests__/soulTabsCrisis.test.jsx",
    "src/test/AttentionPage.test.jsx",
    "src/test/AttentionFocusA4.test.jsx",
    "src/test/attentionIntegration.test.ts",
    "src/__tests__/MirrorPageDigitalHuman.test.jsx",
    "src/test/PlanetHome.test.jsx",
    "src/test/DevotionTabContainer.test.jsx",
    "src/test/MissionBridgePanel.test.jsx",
    "src/test/SharedPrayerApiSlice.test.jsx",
    "src/test/ShareWallSundaySchool.test.jsx",
    "src/test/BibleAtlasGraphSlice.test.tsx",
    "src/test/soulTabsHabitsLibrary.test.jsx",
    "src/test/expansionEndpoints.contract.test.js",
    "src/test/ExpansionResult.render.test.jsx",
    "src/test/DatingPriorityStandaloneRoute.test.jsx",
    "src/test/Stage1BugfixesSlice.test.jsx",
    "src/test/WebCoreAcceptanceSuites.test.jsx",
    "src/test/sanitize.test.js",
)

# Deterministic mapping from Web source files referenced in cases.csv to real Vitest suites.
# Every mapped suite is AST/source-verified to genuinely import its mapped Web source module.
WEB_SOURCE_TO_VITEST_SUITES: dict[str, tuple[str, ...]] = {
    "src/App.jsx": ("src/test/DatingPriorityStandaloneRoute.test.jsx",),
    "src/PlanetHome.jsx": ("src/test/PlanetHome.test.jsx",),
    "src/MirrorPage.jsx": ("src/__tests__/MirrorPageDigitalHuman.test.jsx",),
    "src/PrayerWallPage.jsx": ("src/test/WebCoreAcceptanceSuites.test.jsx",),
    "src/ShareWallPage.jsx": ("src/test/ShareWallSundaySchool.test.jsx",),
    "src/BibleMapsPage.jsx": ("src/test/WebCoreAcceptanceSuites.test.jsx",),
    "src/features/bible-map/domain/constants.ts": ("src/test/WebCoreAcceptanceSuites.test.jsx",),
    "src/components/SoulDashboard.jsx": (
        "src/test/WebCoreAcceptanceSuites.test.jsx",
        "src/test/Stage1BugfixesSlice.test.jsx",
    ),
    "src/components/SoulTabs.jsx": (
        "src/test/soulTabsHabitsLibrary.test.jsx",
        "src/features/crisis-care/__tests__/soulTabsCrisis.test.jsx",
    ),
    "src/PracticeHubPage.jsx": (
        "src/features/spiritual-formation/__tests__/PracticeHubSpiritualFormation.test.jsx",
    ),
    "src/components/DevotionTabContainer.jsx": ("src/test/DevotionTabContainer.test.jsx",),
    "src/components/mission-bridge/MissionBridgePanel.jsx": ("src/test/MissionBridgePanel.test.jsx",),
    "src/expansion/planetEntries.js": ("src/test/WebCoreAcceptanceSuites.test.jsx",),
    "src/expansion/ExpansionHub.jsx": ("src/test/ExpansionResult.render.test.jsx",),
    "src/features/spiritual-planet/SpiritualPlanetPlatformPage.jsx": (
        "src/features/spiritual-planet/__tests__/SpiritualPlanetPlatformPage.test.jsx",
    ),
    "src/features/spiritual-planet/DiscernmentWorkspace.jsx": (
        "src/features/spiritual-planet/__tests__/DiscernmentWorkspace.test.jsx",
    ),
    "src/features/spiritual-planet/digital-human/DigitalHumanWorkspace.jsx": (
        "src/features/spiritual-planet/__tests__/DigitalHumanWorkspace.test.jsx",
    ),
    "src/features/ai-formation/AiFormationPage.jsx": (
        "src/features/ai-formation/__tests__/AiFormationPage.test.jsx",
    ),
    "src/features/ai-formation/program.js": (
        "src/features/ai-formation/__tests__/program.test.js",
    ),
    "src/features/formation-twin/FormationTwinWorkspace.jsx": (
        "src/features/formation-twin/__tests__/FormationTwinWorkspace.test.jsx",
    ),
    "src/features/spiritual-formation/app/SpiritualFormationPage.jsx": (
        "src/test/WebCoreAcceptanceSuites.test.jsx",
    ),
    "src/features/crisis-care/app/CrisisCarePage.jsx": (
        "src/features/crisis-care/__tests__/crisisCarePage.smoke.test.jsx",
    ),
    "src/features/attention/app/AttentionPage.jsx": (
        "src/test/AttentionPage.test.jsx",
        "src/test/AttentionFocusA4.test.jsx",
    ),
    "src/features/attention/lib/integration/route-registry.ts": (
        "src/test/attentionIntegration.test.ts",
    ),
    "src/sanitize.js": ("src/test/sanitize.test.js",),
}

_COMMENT_STRIP_RE = re.compile(r"//[^\n]*|/\*[\s\S]*?\*/")
_STATIC_FROM_SPECIFIER_RE = re.compile(
    r"""\b(?:import|export)\s+(?:type\s+)?[^;'"]*?\bfrom\s*["']([^"']+)["']"""
)
_SIDE_EFFECT_IMPORT_RE = re.compile(r"""\bimport\s*["']([^"']+)["']""")
_DYNAMIC_IMPORT_SPECIFIER_RE = re.compile(r"""(?<!\.)\bimport\s*\(\s*["']([^"']+)["']\s*\)""")
_VI_MOCK_CALL_RE = re.compile(
    r"""\bvi\.(?:doMock|mock)\s*\(\s*["']([^"']+)["']([\s\S]{0,240})"""
)
_RESOLVE_EXTENSIONS: tuple[str, ...] = (
    "",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    "/index.js",
    "/index.jsx",
    "/index.ts",
    "/index.tsx",
)

KNOWN_WEB_EXTERNAL_BLOCKERS: dict[str, dict[str, str]] = {
    "DH-05": {
        "blocker_code": "LIVESPEAK=MISSING / THEOLOGY_REVIEW",
        "owner": "platform-ops & 5-role-human-reviewers",
        "unlock_condition": (
            "Provision HTTPS LiveSpeak + Azure TTS FacialExpression, approved per-character GLB/voice "
            "manifest, and 5-role Ed25519 release certificate; verify on physical iOS/Android."
        ),
    },
    "DH-06": {
        "blocker_code": "STT_WORKER=MISSING",
        "owner": "platform-ops",
        "unlock_condition": (
            "Deploy LiveKit spiritual-planet-digital-human STT worker with LIVEKIT_URL/API_KEY/API_SECRET "
            "and verify real microphone duplex transcription on physical devices."
        ),
    },
    "DH-07": {
        "blocker_code": "LIVESPEAK=MISSING / THEOLOGY_REVIEW",
        "owner": "platform-ops & rights/theology-reviewers",
        "unlock_condition": (
            "Configure DIGITAL_HUMAN_LIVESPEAK_EMBED_URL + METAPERSON secrets + approved voice/viseme "
            "assets and verify viseme sync on physical devices including iPhone Safari."
        ),
    },
    "DH-08": {
        "blocker_code": "STT_WORKER=MISSING / LIVESPEAK=MISSING / THEOLOGY_REVIEW",
        "owner": "platform-ops & release_reviewer",
        "unlock_condition": (
            "Connect real provider health endpoints, 5-role signed release certificate, and controlled "
            "staging admin environment."
        ),
    },
}


def _sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _snapshot_suite_sha256(suite_dir: Path) -> dict[str, str]:
    return {
        name: _sha256_file(suite_dir / name)
        for name in sorted(EXPECTED_SUITE_FILES)
    }


def _sanitize_csv_cell(value: str) -> str:
    stripped = value.lstrip()
    if stripped and stripped[0] in FORMULA_INJECTION_PREFIXES:
        return f"'{value}"
    return value


def _resolve_git_head(web_repo: Path) -> str:
    proc = subprocess.run(
        ["git", "-C", str(web_repo), "rev-parse", "HEAD"],
        check=False,
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        return "unknown"
    return proc.stdout.strip()


def _normalize_rel_suite_path(raw_name: str, web_repo: Path) -> str:
    candidate = Path(raw_name)
    try:
        return candidate.resolve().relative_to(web_repo.resolve()).as_posix()
    except ValueError:
        return candidate.as_posix()


def _resolve_relative_module(specifier: str, importer_file: Path, web_repo: Path) -> str | None:
    if not specifier.startswith("."):
        return None
    base_candidate = importer_file.parent / specifier
    repo_resolved = web_repo.resolve()
    for ext in _RESOLVE_EXTENSIONS:
        candidate = Path(f"{base_candidate}{ext}")
        if candidate.is_file():
            try:
                return candidate.resolve().relative_to(repo_resolved).as_posix()
            except ValueError:
                return None
    return None


def extract_suite_genuine_imports(suite_file: Path, web_repo: Path) -> set[str]:
    """Return repo-relative Web source paths genuinely imported (and not mocked out) by suite_file."""
    raw_source = suite_file.read_text(encoding="utf-8")
    stripped = _COMMENT_STRIP_RE.sub("", raw_source)

    fully_mocked: set[str] = set()
    for match in _VI_MOCK_CALL_RE.finditer(stripped):
        specifier, tail = match.group(1), match.group(2)
        if "importOriginal" not in tail and "importActual" not in tail:
            resolved_mock = _resolve_relative_module(specifier, suite_file, web_repo)
            if resolved_mock:
                fully_mocked.add(resolved_mock)

    imported: set[str] = set()
    for pattern in (_STATIC_FROM_SPECIFIER_RE, _SIDE_EFFECT_IMPORT_RE, _DYNAMIC_IMPORT_SPECIFIER_RE):
        for match in pattern.finditer(stripped):
            resolved = _resolve_relative_module(match.group(1), suite_file, web_repo)
            if resolved and resolved not in fully_mocked:
                imported.add(resolved)
    return imported


def verify_web_source_suite_mappings(
    web_repo: Path,
    mappings: dict[str, tuple[str, ...]] | None = None,
) -> dict[str, list[str]]:
    """Fail closed if any WEB_SOURCE_TO_VITEST_SUITES entry maps to a suite that does not import it."""
    active_mappings = WEB_SOURCE_TO_VITEST_SUITES if mappings is None else mappings
    repo_root = web_repo.resolve()
    verified: dict[str, list[str]] = {}
    violations: list[str] = []

    for web_source, suite_list in active_mappings.items():
        source_path = repo_root / web_source
        if not source_path.is_file():
            violations.append(f"Mapped Web source does not exist: {web_source}")
            continue
        if not suite_list:
            violations.append(f"Mapped Web source has empty Vitest suite tuple: {web_source}")
            continue
        for suite_rel in suite_list:
            suite_path = repo_root / suite_rel
            if not suite_path.is_file():
                violations.append(f"Mapped Vitest suite does not exist for {web_source}: {suite_rel}")
                continue
            genuine_imports = extract_suite_genuine_imports(suite_path, repo_root)
            if web_source not in genuine_imports:
                violations.append(
                    f"Vitest suite '{suite_rel}' does not genuinely import mapped source '{web_source}' "
                    f"(resolved imports: {sorted(genuine_imports)})"
                )
        verified[web_source] = list(suite_list)

    if violations:
        raise ValueError(
            "WEB_SOURCE_TO_VITEST_SUITES import-verification failed:\n- " + "\n- ".join(violations)
        )
    return verified


def run_web_acceptance_precheck(
    *,
    suite_dir: str | os.PathLike[str],
    output_dir: str | os.PathLike[str],
    web_repo: str | os.PathLike[str] = ".",
    app_repo: str | os.PathLike[str] | None = None,
    vitest_targets: list[str] | tuple[str, ...] | None = None,
    record_known_web_blockers: bool = False,
) -> dict[str, Any]:
    """Execute real Vitest component/contract suites and emit an isolated Web precheck worksheet."""
    suite_path = Path(suite_dir).resolve()
    web_repo_path = Path(web_repo).resolve()
    out_path = Path(output_dir).resolve()

    if out_path == suite_path or suite_path in out_path.parents:
        raise ValueError(
            f"Refusing output_dir '{out_path}' inside sealed baseline suite_dir '{suite_path}'."
        )

    verified_mappings = verify_web_source_suite_mappings(web_repo_path)

    pre_hashes = _snapshot_suite_sha256(suite_path)
    validation_receipt = validate_acceptance_suite(
        suite_path,
        web_repo=web_repo_path,
        app_repo=app_repo,
    )
    if not validation_receipt.get("valid", False):
        raise RuntimeError(
            f"Baseline acceptance suite validation failed ({validation_receipt.get('violation_count')} violations)."
        )

    targets = list(vitest_targets) if vitest_targets else list(DEFAULT_VITEST_TARGETS)
    if not targets:
        raise ValueError("At least one Vitest target file is required.")
    for rel_target in targets:
        if not (web_repo_path / rel_target).is_file():
            raise FileNotFoundError(f"Vitest target does not exist under {web_repo_path}: {rel_target}")

    vitest_bin = web_repo_path / "node_modules" / ".bin" / "vitest"
    if not vitest_bin.exists():
        raise FileNotFoundError(
            f"Vitest binary not found at {vitest_bin}. Install or symlink node_modules before running."
        )

    node_bin = shutil.which("node") or next(
        (
            candidate
            for candidate in (
                "/opt/homebrew/bin/node",
                "/usr/local/bin/node",
            )
            if Path(candidate).is_file() and os.access(candidate, os.X_OK)
        ),
        None,
    )
    if node_bin is None:
        raise FileNotFoundError("Node.js runtime binary ('node') not found on PATH or standard install locations.")

    child_env = dict(os.environ)
    node_dir = str(Path(node_bin).resolve().parent)
    existing_path = child_env.get("PATH", "")
    path_parts = [p for p in existing_path.split(os.pathsep) if p]
    if node_dir not in path_parts:
        child_env["PATH"] = os.pathsep.join([node_dir, *path_parts])

    out_path.mkdir(parents=True, exist_ok=True)
    vitest_report_path = out_path / "vitest-report.json"
    stdout_log_path = out_path / "vitest.stdout.log"
    stderr_log_path = out_path / "vitest.stderr.log"

    cmd = [
        node_bin,
        str(vitest_bin),
        "run",
        "--reporter=json",
        f"--outputFile={vitest_report_path}",
        *targets,
    ]
    started_monotonic = time.monotonic()
    started_utc = datetime.now(timezone.utc).isoformat()
    proc = subprocess.Popen(
        cmd,
        cwd=str(web_repo_path),
        env=child_env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    stdout_text, stderr_text = proc.communicate()
    duration_seconds = round(time.monotonic() - started_monotonic, 4)
    vitest_pid = int(proc.pid)
    vitest_rc = int(proc.returncode)

    stdout_log_path.write_text(stdout_text or "", encoding="utf-8")
    stderr_log_path.write_text(stderr_text or "", encoding="utf-8")

    if vitest_pid <= 0:
        raise RuntimeError(f"Invalid child process PID recorded: {vitest_pid}")
    if not vitest_report_path.is_file():
        raise RuntimeError(
            f"Vitest process (pid={vitest_pid}, rc={vitest_rc}) did not produce {vitest_report_path}."
        )

    vitest_report_sha256 = _sha256_file(vitest_report_path)
    vitest_payload = json.loads(vitest_report_path.read_text(encoding="utf-8"))

    passed_suites: dict[str, dict[str, Any]] = {}
    failed_suites: dict[str, dict[str, Any]] = {}
    for suite_entry in vitest_payload.get("testResults", []):
        rel_suite = _normalize_rel_suite_path(str(suite_entry.get("name", "")), web_repo_path)
        assertions = suite_entry.get("assertionResults", [])
        passing_asserts = int(suite_entry.get("numPassingAsserts", 0)) or sum(
            1 for item in assertions if item.get("status") == "passed"
        )
        failing_asserts = sum(1 for item in assertions if item.get("status") == "failed")
        record = {
            "test_file": rel_suite,
            "status": suite_entry.get("status"),
            "passing_assertions": passing_asserts,
            "failing_assertions": failing_asserts,
        }
        if suite_entry.get("status") == "passed" and passing_asserts > 0 and failing_asserts == 0:
            passed_suites[rel_suite] = record
        else:
            failed_suites[rel_suite] = record

    head_sha = _resolve_git_head(web_repo_path)
    platform_tag = _sanitize_csv_cell(f"Web {head_sha[:12]} (Vitest jsdom precheck)")

    with (suite_path / "cases.csv").open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle, strict=True)
        baseline_rows = list(reader)

    output_rows: list[dict[str, str]] = []
    verified_cases_evidence: dict[str, dict[str, Any]] = {}
    blocked_cases_recorded: dict[str, dict[str, str]] = {}

    for raw_row in baseline_rows:
        row = dict(raw_row)
        cid = row["Case ID"]
        mode = row["执行方式"]
        fixture = row["夹具"]
        web_source_file = row["Web 源码"].split("#L", 1)[0]

        # Guard 1: DEVICE mode or DEVICE fixture NEVER becomes PASS.
        if mode == "DEVICE" or fixture == "DEVICE":
            if record_known_web_blockers and cid in KNOWN_WEB_EXTERNAL_BLOCKERS:
                info = KNOWN_WEB_EXTERNAL_BLOCKERS[cid]
                row["状态"] = "BLOCKED"
                row["平台与版本"] = platform_tag
                row["实测结果"] = _sanitize_csv_cell(
                    f"外部供应商与真机条件未就绪 ({info['blocker_code']}); "
                    f"负责方={info['owner']}; 解锁条件={info['unlock_condition']}"
                )
                row["证据"] = _sanitize_csv_cell(
                    f"docs/DIGITAL_HUMAN_EXTERNAL_REQUIREMENTS.md; vitest_pid={vitest_pid}"
                )
                row["缺陷"] = _sanitize_csv_cell(info["blocker_code"])
                blocked_cases_recorded[cid] = info
            else:
                row["状态"] = "NOT_RUN"
            output_rows.append(row)
            continue

        # Guard 2: PROVIDER fixture or DH-05..DH-08 live/admin provider cases NEVER become PASS.
        if fixture == "PROVIDER" or cid in KNOWN_WEB_EXTERNAL_BLOCKERS:
            if record_known_web_blockers and cid in KNOWN_WEB_EXTERNAL_BLOCKERS:
                info = KNOWN_WEB_EXTERNAL_BLOCKERS[cid]
                row["状态"] = "BLOCKED"
                row["平台与版本"] = platform_tag
                row["实测结果"] = _sanitize_csv_cell(
                    f"外部供应商与人工审核门禁未解锁 ({info['blocker_code']}); "
                    f"负责方={info['owner']}; 解锁条件={info['unlock_condition']}"
                )
                row["证据"] = _sanitize_csv_cell(
                    f"docs/DIGITAL_HUMAN_EXTERNAL_REQUIREMENTS.md; vitest_pid={vitest_pid}"
                )
                row["缺陷"] = _sanitize_csv_cell(info["blocker_code"])
                blocked_cases_recorded[cid] = info
            else:
                row["状态"] = "NOT_RUN"
            output_rows.append(row)
            continue

        # Guard 3: Local Web UI precheck evidence ONLY when mode == 'UI', eligible fixture,
        # and all mapped Vitest suites for this Web source file actually ran and passed (>0 asserts).
        mapped_suites = WEB_SOURCE_TO_VITEST_SUITES.get(web_source_file, ())
        executed_passing = [passed_suites[s] for s in mapped_suites if s in passed_suites]
        has_any_failed_mapped = any(s in failed_suites for s in mapped_suites)

        if (
            vitest_rc == 0
            and mode == "UI"
            and fixture in ELIGIBLE_LOCAL_UI_FIXTURES
            and bool(mapped_suites)
            and len(executed_passing) == len(mapped_suites)
            and not has_any_failed_mapped
        ):
            total_asserts = sum(item["passing_assertions"] for item in executed_passing)
            suite_names = [item["test_file"] for item in executed_passing]
            # Keep cross-platform migration 状态 == 'NOT_RUN' (zero overclaim of full Web+App visual signoff).
            row["状态"] = "NOT_RUN"
            row["平台与版本"] = platform_tag
            row["实测结果"] = _sanitize_csv_cell(
                "Web 组件与契约自动预检通过；跨端真机与实网对照待执行"
            )
            row["证据"] = _sanitize_csv_cell(
                f"vitest-report.json#{vitest_report_sha256[:12]} pid={vitest_pid} "
                f"suites={','.join(suite_names)} asserts={total_asserts}"
            )
            verified_cases_evidence[cid] = {
                "case_id": cid,
                "web_source": row["Web 源码"],
                "execution_mode": mode,
                "fixture": fixture,
                "cross_platform_status": "NOT_RUN",
                "web_component_precheck": "PASSED",
                "test_files": suite_names,
                "passing_assertions": total_asserts,
                "pid": vitest_pid,
                "vitest_json_sha256": vitest_report_sha256,
            }
        else:
            row["状态"] = "NOT_RUN"

        output_rows.append(row)

    worksheet_path = out_path / "cases.web-local.csv"
    with worksheet_path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(EXPECTED_CASES_HEADERS))
        writer.writeheader()
        writer.writerows(output_rows)

    if not worksheet_path.read_bytes().startswith(UTF8_BOM):
        raise RuntimeError(f"Generated worksheet {worksheet_path} is missing UTF-8 BOM.")

    evidence_path = out_path / "web-precheck-evidence.json"
    evidence_payload = {
        "schema": "bible3dsphere-web-precheck-evidence/v1",
        "generated_at_utc": started_utc,
        "web_head_sha": head_sha,
        "vitest_pid": vitest_pid,
        "vitest_returncode": vitest_rc,
        "vitest_report_sha256": vitest_report_sha256,
        "cross_platform_certification_state": "NOT_CERTIFIED",
        "verified_case_count": len(verified_cases_evidence),
        "cases": verified_cases_evidence,
    }
    evidence_path.write_text(
        json.dumps(evidence_payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    # Post-run baseline immutability check: docs/web-app-acceptance MUST remain untouched!
    post_hashes = _snapshot_suite_sha256(suite_path)
    if post_hashes != pre_hashes:
        raise RuntimeError(
            f"CRITICAL: Baseline suite {suite_path} mutated during run! before={pre_hashes} after={post_hashes}"
        )

    status_counts = dict(sorted(Counter(r["状态"] for r in output_rows).items()))
    summary: dict[str, Any] = {
        "runner_pid": os.getpid(),
        "executed": True,
        "generated_at_utc": started_utc,
        "suite_dir": str(suite_path),
        "output_dir": str(out_path),
        "web_repo": str(web_repo_path),
        "web_head_sha": head_sha,
        "baseline_suite_sha256_before": pre_hashes,
        "baseline_suite_sha256_after": post_hashes,
        "baseline_immutability_verified": pre_hashes == post_hashes,
        "suite_import_integrity_verified": bool(verified_mappings),
        "verified_source_mapping_count": len(verified_mappings),
        "vitest_process": {
            "pid": vitest_pid,
            "returncode": vitest_rc,
            "duration_seconds": duration_seconds,
            "targets_requested": targets,
            "num_total_suites": int(vitest_payload.get("numTotalTestSuites", 0)),
            "num_passed_suites": len(passed_suites),
            "num_failed_suites": len(failed_suites),
            "num_total_tests": int(vitest_payload.get("numTotalTests", 0)),
            "num_passed_tests": int(vitest_payload.get("numPassedTests", 0)),
            "num_failed_tests": int(vitest_payload.get("numFailedTests", 0)),
            "vitest_report_path": str(vitest_report_path),
            "vitest_report_sha256": vitest_report_sha256,
        },
        "worksheet_path": str(worksheet_path),
        "worksheet_sha256": _sha256_file(worksheet_path),
        "evidence_path": str(evidence_path),
        "evidence_sha256": _sha256_file(evidence_path),
        "total_cases": len(output_rows),
        "status_counts": status_counts,
        "cross_platform_acceptance_pass": status_counts.get("PASS", 0),
        "certification_state": "NOT_CERTIFIED",
        "web_local_vitest_verified_cases": len(verified_cases_evidence),
        "known_external_blockers_recorded": sorted(blocked_cases_recorded.keys()),
    }

    summary_path = out_path / "summary.json"
    summary_path.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return summary


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description=(
            "Run real Web Vitest component/contract prechecks and write an isolated UTF-8 BOM "
            "worksheet copy without mutating docs/web-app-acceptance/."
        )
    )
    parser.add_argument(
        "--suite-dir",
        default="docs/web-app-acceptance",
        help="Path to the sealed baseline docs/web-app-acceptance directory.",
    )
    parser.add_argument(
        "--output-dir",
        required=True,
        help="Target directory for cases.web-local.csv, vitest-report.json, and summary.json.",
    )
    parser.add_argument(
        "--timestamp-subdir",
        action="store_true",
        help="Create a UTC timestamped run subdirectory under --output-dir.",
    )
    parser.add_argument(
        "--web-repo",
        default=".",
        help="Path to bible3dsphereWeb repository containing node_modules and src/.",
    )
    parser.add_argument(
        "--app-repo",
        default=None,
        help="Optional path to sibling bible3dsphereApp repository for baseline validation.",
    )
    parser.add_argument(
        "--vitest-targets",
        nargs="*",
        default=None,
        help="Optional explicit list of Vitest test files relative to --web-repo.",
    )
    parser.add_argument(
        "--record-known-web-blockers",
        action="store_true",
        help=(
            "Mark DH-05..DH-08 external live audiovisual/theology-signoff cases as BLOCKED "
            "with explicit blocker code, owner, and unlock condition."
        ),
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_arg_parser().parse_args(argv)
    target_out = Path(args.output_dir)
    if args.timestamp_subdir:
        stamp = datetime.now(timezone.utc).strftime("run-%Y%m%dT%H%M%SZ")
        target_out = target_out / stamp

    summary = run_web_acceptance_precheck(
        suite_dir=args.suite_dir,
        output_dir=target_out,
        web_repo=args.web_repo,
        app_repo=args.app_repo,
        vitest_targets=args.vitest_targets,
        record_known_web_blockers=args.record_known_web_blockers,
    )
    sys.stdout.write(json.dumps(summary, ensure_ascii=False, indent=2) + "\n")
    return 0 if summary["vitest_process"]["returncode"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
