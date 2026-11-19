#!/usr/bin/env python3
"""Deterministic validator for the 703-case Web -> App migration acceptance suite.

Verifies structural, cryptographic, formula-safety, digital-human roster, baseline Web/App
source-anchor, live Web HEAD continuity, and sibling bible3dsphereApp unmapped-candidate
invariants WITHOUT mutating any file inside the target acceptance directory.
"""

from __future__ import annotations

import argparse
from collections import Counter
import csv
from functools import lru_cache
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
from typing import Any

DEFAULT_BASELINE_WEB_SHA = "b8f361d9589088432a915f191e9a49e32cc012ef"
DEFAULT_BASELINE_APP_SHA = "42a0406388f513ae47e337017726c00e2b0c77e4"
DIGITAL_HUMAN_ROSTER_REL_PATH = "e2e/fixtures/digital-human-all100.json"
EXPECTED_ROSTER_SHA256 = "a207c252d5ed26e84e2aab669f50de7e852c9f61c899e7525b5f0b3b7bed4a83"

EXPECTED_SUITE_FILES = frozenset({"README.md", "cases.csv", "coverage.csv"})
UTF8_BOM = b"\xef\xbb\xbf"
FORMULA_INJECTION_PREFIXES = ("=", "+", "@", "-")
CASE_ID_PATTERN = re.compile(r"^[A-Z0-9-]+$")

EXPECTED_CASES_HEADERS = (
    "Case ID",
    "优先级",
    "执行方式",
    "模块",
    "用例",
    "夹具",
    "步骤",
    "预期",
    "Web 源码",
    "App 候选",
    "迁移范围",
    "状态",
    "平台与版本",
    "实测结果",
    "证据",
    "缺陷",
)

EXPECTED_COVERAGE_HEADERS = (
    "组",
    "源码键",
    "名称",
    "Web 入口",
    "Web 源码",
    "参数/能力",
    "权限/配置",
    "App 候选",
    "映射",
    "逐项用例",
    "关联业务用例",
    "迁移范围",
    "状态",
)

REQUIRED_NONEMPTY_CASE_COLUMNS = (
    "Case ID",
    "优先级",
    "执行方式",
    "模块",
    "用例",
    "夹具",
    "步骤",
    "预期",
    "Web 源码",
    "迁移范围",
    "状态",
)

EMPTY_BASELINE_EXECUTION_COLUMNS = ("平台与版本", "实测结果", "证据", "缺陷")
SYNCHRONIZED_COLUMNS = ("状态", "Web 源码", "App 候选", "迁移范围")

ALLOWED_PRIORITIES = frozenset({"P0", "P1", "P2"})
ALLOWED_EXECUTION_MODES = frozenset({"UI", "E2E", "DEVICE"})
ALLOWED_FIXTURES = frozenset(
    {
        "VISITOR",
        "OWNER",
        "ACCOUNTS",
        "SOCIAL",
        "ROLES",
        "LANG",
        "FAULT",
        "SAFETY",
        "DEVICE",
        "PROVIDER",
        "HUMANS",
    }
)
ALLOWED_MIGRATION_SCOPES = frozenset({"需迁移核对", "待确认旧入口", "平台呈现待核"})

EXPECTED_TOTAL_CASES = 703
EXPECTED_SCENARIO_COUNT = 198
EXPECTED_SOURCE_REGISTRY_COUNT = 505
EXPECTED_GROUP_COUNTS: dict[str, int] = {
    "aif-batch": 12,
    "aif-tab": 4,
    "atlas-layer": 6,
    "attention": 12,
    "care": 10,
    "continent": 44,
    "devotion": 4,
    "devotion-scripture": 3,
    "devotion-today": 2,
    "discernment": 7,
    "evangelism": 4,
    "expansion": 50,
    "formation": 26,
    "home": 22,
    "human": 100,
    "legacy-devotion": 6,
    "link": 18,
    "maps": 14,
    "mirror": 4,
    "mission-entry": 3,
    "mission-workspace": 20,
    "overlay": 51,
    "panel": 38,
    "portal": 13,
    "practice": 6,
    "prayer": 4,
    "scenario": 198,
    "share": 4,
    "soul": 7,
    "twin": 7,
    "worldview": 4,
}

REQUIRED_GUIDE_TOKENS = (
    "NOT_RUN",
    "N/A_APPROVED",
    "VoiceOver",
    "TalkBack",
    "S0–S3",
    "sha-256",
    "回归",
    "清理",
    "候选",
)


class AcceptanceSuiteValidationError(RuntimeError):
    """Raised when strict=True and one or more acceptance suite invariants fail."""

    def __init__(self, receipt: dict[str, Any]) -> None:
        self.receipt = receipt
        count = receipt.get("violation_count", 0)
        first = receipt.get("violations", [{}])[0].get("code", "UNKNOWN")
        super().__init__(f"Acceptance suite validation failed with {count} violation(s); first={first}")


def _run_git(repo: Path, *args: str) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(
        ["git", "-C", str(repo), *args],
        check=False,
        capture_output=True,
    )


@lru_cache(maxsize=64)
def _git_commit_exists_cached(repo_str: str, rev: str) -> bool:
    repo = Path(repo_str)
    if not repo.is_dir():
        return False
    proc = _run_git(repo, "cat-file", "-e", f"{rev}^{{commit}}")
    return proc.returncode == 0


def _git_commit_exists(repo: Path, rev: str) -> bool:
    return _git_commit_exists_cached(str(repo.resolve()), rev)


@lru_cache(maxsize=64)
def _git_rev_parse_cached(repo_str: str, rev: str) -> str | None:
    repo = Path(repo_str)
    if not repo.is_dir():
        return None
    proc = _run_git(repo, "rev-parse", "--verify", rev)
    if proc.returncode != 0:
        return None
    return proc.stdout.decode("utf-8", errors="replace").strip()


def _git_rev_parse(repo: Path, rev: str) -> str | None:
    return _git_rev_parse_cached(str(repo.resolve()), rev)


@lru_cache(maxsize=32)
def _git_ls_tree_paths_cached(repo_str: str, rev: str, prefix: str | None) -> frozenset[str]:
    repo = Path(repo_str)
    args = ["ls-tree", "-r", "--name-only", rev]
    if prefix:
        args.append(prefix)
    proc = _run_git(repo, *args)
    if proc.returncode != 0:
        return frozenset()
    return frozenset(
        line.strip()
        for line in proc.stdout.decode("utf-8", errors="replace").splitlines()
        if line.strip()
    )


def _git_ls_tree_paths(repo: Path, rev: str, prefix: str | None = None) -> set[str]:
    return set(_git_ls_tree_paths_cached(str(repo.resolve()), rev, prefix))


@lru_cache(maxsize=512)
def _git_show_bytes_cached(repo_str: str, rev: str, rel_path: str) -> bytes | None:
    proc = _run_git(Path(repo_str), "show", f"{rev}:{rel_path}")
    if proc.returncode != 0:
        return None
    return proc.stdout


def _git_show_bytes(repo: Path, rev: str, rel_path: str) -> bytes | None:
    return _git_show_bytes_cached(str(repo.resolve()), rev, rel_path)


def _resolve_default_web_repo(suite_dir: Path, baseline_web_sha: str) -> Path:
    probe = suite_dir if suite_dir.is_dir() else suite_dir.parent
    top_proc = _run_git(probe, "rev-parse", "--show-toplevel")
    if top_proc.returncode == 0:
        candidate = Path(top_proc.stdout.decode("utf-8", errors="replace").strip()).resolve()
        if _git_commit_exists(candidate, baseline_web_sha):
            return candidate
    script_repo = Path(__file__).resolve().parents[1]
    return script_repo


def _resolve_default_app_repo(web_repo: Path) -> Path:
    direct_sibling = (web_repo.resolve().parent / "bible3dsphereApp").resolve()
    if direct_sibling.is_dir():
        return direct_sibling
    common_proc = _run_git(web_repo, "rev-parse", "--git-common-dir")
    if common_proc.returncode == 0:
        raw_common = common_proc.stdout.decode("utf-8", errors="replace").strip()
        common_dir = (web_repo / raw_common).resolve() if not Path(raw_common).is_absolute() else Path(raw_common).resolve()
        main_worktree_parent = common_dir.parent.parent
        shared_sibling = (main_worktree_parent / "bible3dsphereApp").resolve()
        if shared_sibling.is_dir():
            return shared_sibling
    return direct_sibling


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _read_strict_bom_csv(
    csv_path: Path,
    *,
    expected_headers: tuple[str, ...],
    violations: list[dict[str, Any]],
) -> list[dict[str, str]]:
    label = csv_path.name
    if not csv_path.is_file():
        violations.append(
            {
                "code": "MISSING_REQUIRED_FILE",
                "file": label,
                "message": f"Required CSV file '{label}' does not exist.",
            }
        )
        return []

    raw_bytes = csv_path.read_bytes()
    if not raw_bytes.startswith(UTF8_BOM):
        violations.append(
            {
                "code": "MISSING_UTF8_BOM",
                "file": label,
                "message": f"CSV file '{label}' must begin with UTF-8 BOM (\\xef\\xbb\\xbf).",
            }
        )

    try:
        text = raw_bytes.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        violations.append(
            {
                "code": "INVALID_UTF8_ENCODING",
                "file": label,
                "message": f"CSV file '{label}' is not valid UTF-8: {exc}",
            }
        )
        return []

    try:
        with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
            reader = csv.DictReader(handle, strict=True)
            fieldnames = tuple(reader.fieldnames or ())
            if fieldnames != expected_headers:
                violations.append(
                    {
                        "code": "CSV_HEADER_MISMATCH",
                        "file": label,
                        "expected": list(expected_headers),
                        "actual": list(fieldnames),
                        "message": f"Header columns in '{label}' do not match exact schema.",
                    }
                )
            rows: list[dict[str, str]] = []
            for row_idx, raw_row in enumerate(reader, start=2):
                if None in raw_row or any(val is None for val in raw_row.values()):
                    violations.append(
                        {
                            "code": "CSV_RAGGED_ROW",
                            "file": label,
                            "line": row_idx,
                            "message": f"Row {row_idx} in '{label}' has missing or extra columns.",
                        }
                    )
                    continue
                clean_row = {str(k): str(v) for k, v in raw_row.items() if k is not None}
                for col_name, cell_value in clean_row.items():
                    stripped = cell_value.lstrip()
                    if stripped and stripped[0] in FORMULA_INJECTION_PREFIXES:
                        violations.append(
                            {
                                "code": "CSV_FORMULA_INJECTION",
                                "file": label,
                                "line": row_idx,
                                "column": col_name,
                                "value_preview": stripped[:32],
                                "message": (
                                    f"Formula-injection prefix '{stripped[0]}' detected in "
                                    f"'{label}' line {row_idx} column '{col_name}'."
                                ),
                            }
                        )
                rows.append(clean_row)
    except csv.Error as exc:
        _ = text
        violations.append(
            {
                "code": "CSV_STRICT_PARSE_ERROR",
                "file": label,
                "message": f"Strict CSV parse failed for '{label}': {exc}",
            }
        )
        return []

    return rows


def _web_path_exists(rel_path: str, has_line_anchor: bool, tree_paths: set[str]) -> bool:
    if rel_path in tree_paths:
        return True
    if not has_line_anchor:
        dir_prefix = rel_path.rstrip("/") + "/"
        return any(p.startswith(dir_prefix) for p in tree_paths)
    return False


def _suggest_dart_candidates_for_unmapped_row(
    coverage_row: dict[str, str],
    case_row: dict[str, str],
    dart_paths: set[str],
    baseline_app_paths: set[str],
) -> dict[str, Any]:
    case_id = coverage_row["逐项用例"]
    group = coverage_row["组"]
    source_key = coverage_row["源码键"]
    web_source = coverage_row["Web 源码"]
    migration_scope = coverage_row["迁移范围"]
    title = case_row.get("用例", "")

    if migration_scope == "待确认旧入口" or group == "legacy-devotion":
        return {
            "case_id": case_id,
            "group": group,
            "source_key": source_key,
            "web_source": web_source,
            "classification": "待确认旧入口",
            "suggested_candidates": [],
            "added_since_app_baseline": [],
            "rationale": "Legacy Web devotion entry not invoked by current App.jsx; requires product retirement/mapping signoff.",
        }

    haystack = " ".join(
        [
            case_id.lower(),
            group.lower(),
            source_key.lower(),
            web_source.lower(),
            title.lower(),
        ]
    )

    domain_rules: tuple[tuple[tuple[str, ...], tuple[str, ...], str], ...] = (
        (
            ("onboarding", "从这里开始", "soc-16"),
            ("onboarding", "home_shell.dart"),
            "Matched onboarding/start-here flow screens in App lib/ tree.",
        ),
        (
            ("caregiver", "care-04"),
            ("caregiver_console", "caregiver_inbox"),
            "Matched crisis-care caregiver console/inbox Dart modules in App lib/ tree.",
        ),
        (
            ("home.snapshot.growth",),
            ("home_emotion_trajectory", "home_activity_footer", "home_shell.dart"),
            "Matched home growth/trajectory summary widgets in App lib/ tree.",
        ),
        (
            ("useglobalaudio", "ui-18"),
            ("morning_dew_audio", "digital_human_media", "media_preferences", "speech_text_service"),
            "Matched audio/media lifecycle and speech service modules in App lib/ tree.",
        ),
        (
            ("ui-13",),
            ("auth_service.dart", "auth_state.dart", "release_policy.dart"),
            "Matched session/auth state & policy modules; storage/log redaction still requires App verification.",
        ),
        (
            ("engineering", "map-07"),
            ("engineering_screen", "engineering_page"),
            "Checked App lib/ tree for dedicated engineering screen.",
        ),
        (
            ("idolatry", "soul-20"),
            ("idolatry",),
            "Checked App lib/ tree for dedicated idolatry-monitor screen.",
        ),
        (
            ("mvfe", "form-31"),
            ("mvfe",),
            "Checked App lib/ tree for dedicated MVFE flow screen.",
        ),
        (
            ("fhl", "faithhopelove", "soul-17"),
            ("faith_hope_love", "fhl"),
            "Checked App lib/ tree for dedicated Faith-Hope-Love galaxy screen.",
        ),
        (
            ("sanitize", "ui-06"),
            ("sanitize",),
            "Checked App lib/ tree for dedicated untrusted-copy sanitizer utility.",
        ),
    )

    matched_files: list[str] = []
    rationale = "No direct Dart screen/module stem found in App lib/ tree; requires App target registration."
    sorted_dart = sorted(dart_paths)

    for triggers, dart_tokens, rule_note in domain_rules:
        if any(tok in haystack for tok in triggers):
            rationale = rule_note
            for path in sorted_dart:
                lower_path = path.lower()
                if any(dtok in lower_path for dtok in dart_tokens):
                    matched_files.append(path)
            break

    deduped = list(dict.fromkeys(matched_files))
    added_after_base = [p for p in deduped if p not in baseline_app_paths]
    classification = "候选待实测建议" if deduped else "待App落点确认"
    return {
        "case_id": case_id,
        "group": group,
        "source_key": source_key,
        "web_source": web_source,
        "classification": classification,
        "suggested_candidates": deduped,
        "added_since_app_baseline": added_after_base,
        "rationale": rationale,
    }


def validate_acceptance_suite(
    suite_dir: str | os.PathLike[str],
    *,
    web_repo: str | os.PathLike[str] | None = None,
    app_repo: str | os.PathLike[str] | None = None,
    baseline_web_sha: str = DEFAULT_BASELINE_WEB_SHA,
    baseline_app_sha: str = DEFAULT_BASELINE_APP_SHA,
    strict: bool = False,
) -> dict[str, Any]:
    """Validate all structural, security, roster, and cross-repo invariants of docs/web-app-acceptance."""
    suite_path = Path(suite_dir).resolve()
    violations: list[dict[str, Any]] = []

    if not suite_path.is_dir():
        violations.append(
            {
                "code": "SUITE_DIR_NOT_FOUND",
                "message": f"Acceptance suite directory does not exist: {suite_path}",
            }
        )
        receipt = {
            "pid": os.getpid(),
            "executed": True,
            "valid": False,
            "suite_dir": str(suite_path),
            "count": 0,
            "violation_count": len(violations),
            "violations": violations,
            "input_sha256": {},
            "head_continuity": {},
            "unmapped_resolution": {"app_repo_available": False},
        }
        if strict:
            raise AcceptanceSuiteValidationError(receipt)
        return receipt

    actual_entries = {entry.name for entry in suite_path.iterdir()}
    if actual_entries != EXPECTED_SUITE_FILES:
        violations.append(
            {
                "code": "DIRECTORY_MEMBERSHIP_MISMATCH",
                "expected": sorted(EXPECTED_SUITE_FILES),
                "actual": sorted(actual_entries),
                "message": (
                    f"Suite directory must contain exact files {sorted(EXPECTED_SUITE_FILES)}, "
                    f"found {sorted(actual_entries)}."
                ),
            }
        )

    input_sha256: dict[str, str] = {}
    for fname in sorted(EXPECTED_SUITE_FILES):
        fpath = suite_path / fname
        if fpath.is_file():
            input_sha256[fname] = _sha256_bytes(fpath.read_bytes())

    cases = _read_strict_bom_csv(
        suite_path / "cases.csv",
        expected_headers=EXPECTED_CASES_HEADERS,
        violations=violations,
    )
    coverage = _read_strict_bom_csv(
        suite_path / "coverage.csv",
        expected_headers=EXPECTED_COVERAGE_HEADERS,
        violations=violations,
    )

    resolved_web_repo = (
        Path(web_repo).resolve()
        if web_repo is not None
        else _resolve_default_web_repo(suite_path, baseline_web_sha)
    )
    app_repo_explicit = app_repo is not None
    resolved_app_repo = (
        Path(app_repo).resolve()
        if app_repo_explicit
        else _resolve_default_app_repo(resolved_web_repo)
    )

    cases_by_id: dict[str, dict[str, str]] = {}
    duplicate_case_ids: list[str] = []
    for idx, row in enumerate(cases, start=2):
        cid = row.get("Case ID", "")
        if not CASE_ID_PATTERN.fullmatch(cid):
            violations.append(
                {
                    "code": "INVALID_CASE_ID_FORMAT",
                    "line": idx,
                    "case_id": cid,
                    "message": f"Invalid Case ID '{cid}' at cases.csv line {idx}; must match [A-Z0-9-]+.",
                }
            )
        if cid in cases_by_id:
            duplicate_case_ids.append(cid)
        else:
            cases_by_id[cid] = row

    if duplicate_case_ids:
        violations.append(
            {
                "code": "DUPLICATE_CASE_IDS",
                "duplicates": sorted(set(duplicate_case_ids)),
                "message": f"Duplicate Case IDs in cases.csv: {sorted(set(duplicate_case_ids))}",
            }
        )

    if len(cases) != EXPECTED_TOTAL_CASES or len(cases_by_id) != EXPECTED_TOTAL_CASES:
        violations.append(
            {
                "code": "UNEXPECTED_CASE_COUNT",
                "expected": EXPECTED_TOTAL_CASES,
                "actual_rows": len(cases),
                "unique_ids": len(cases_by_id),
                "message": f"Expected {EXPECTED_TOTAL_CASES} unique cases, got {len(cases)} rows ({len(cases_by_id)} unique).",
            }
        )

    coverage_by_case: dict[str, dict[str, str]] = {}
    duplicate_coverage_case_ids: list[str] = []
    for idx, row in enumerate(coverage, start=2):
        cid = row.get("逐项用例", "")
        if cid in coverage_by_case:
            duplicate_coverage_case_ids.append(cid)
        else:
            coverage_by_case[cid] = row

    if duplicate_coverage_case_ids:
        violations.append(
            {
                "code": "DUPLICATE_COVERAGE_CASE_IDS",
                "duplicates": sorted(set(duplicate_coverage_case_ids)),
                "message": f"Duplicate 逐项用例 values in coverage.csv: {sorted(set(duplicate_coverage_case_ids))}",
            }
        )

    if len(coverage) != len(cases) or set(coverage_by_case.keys()) != set(cases_by_id.keys()):
        only_in_cases = sorted(set(cases_by_id.keys()) - set(coverage_by_case.keys()))
        only_in_coverage = sorted(set(coverage_by_case.keys()) - set(cases_by_id.keys()))
        violations.append(
            {
                "code": "CASES_COVERAGE_JOIN_MISMATCH",
                "only_in_cases": only_in_cases[:20],
                "only_in_coverage": only_in_coverage[:20],
                "message": (
                    f"1-to-1 join failed between cases.csv ({len(cases)}) and coverage.csv ({len(coverage)}); "
                    f"only_in_cases={len(only_in_cases)}, only_in_coverage={len(only_in_coverage)}."
                ),
            }
        )

    for cid, row in cases_by_id.items():
        for req_col in REQUIRED_NONEMPTY_CASE_COLUMNS:
            if not row.get(req_col, "").strip():
                violations.append(
                    {
                        "code": "EMPTY_REQUIRED_CASE_COLUMN",
                        "case_id": cid,
                        "column": req_col,
                        "message": f"Case '{cid}' has empty required column '{req_col}'.",
                    }
                )
        if row.get("优先级") not in ALLOWED_PRIORITIES:
            violations.append(
                {
                    "code": "INVALID_PRIORITY",
                    "case_id": cid,
                    "value": row.get("优先级"),
                    "message": f"Case '{cid}' has invalid 优先级 '{row.get('优先级')}'.",
                }
            )
        if row.get("执行方式") not in ALLOWED_EXECUTION_MODES:
            violations.append(
                {
                    "code": "INVALID_EXECUTION_MODE",
                    "case_id": cid,
                    "value": row.get("执行方式"),
                    "message": f"Case '{cid}' has invalid 执行方式 '{row.get('执行方式')}'.",
                }
            )
        if row.get("夹具") not in ALLOWED_FIXTURES:
            violations.append(
                {
                    "code": "INVALID_FIXTURE",
                    "case_id": cid,
                    "value": row.get("夹具"),
                    "message": f"Case '{cid}' has invalid 夹具 '{row.get('夹具')}'.",
                }
            )
        if row.get("迁移范围") not in ALLOWED_MIGRATION_SCOPES:
            violations.append(
                {
                    "code": "INVALID_MIGRATION_SCOPE",
                    "case_id": cid,
                    "value": row.get("迁移范围"),
                    "message": f"Case '{cid}' has invalid 迁移范围 '{row.get('迁移范围')}'.",
                }
            )
        if row.get("状态") != "NOT_RUN":
            violations.append(
                {
                    "code": "NON_BASELINE_STATUS",
                    "case_id": cid,
                    "status": row.get("状态"),
                    "message": f"Baseline case '{cid}' must have 状态 == 'NOT_RUN', found '{row.get('状态')}'.",
                }
            )
        non_empty_exec = [col for col in EMPTY_BASELINE_EXECUTION_COLUMNS if row.get(col, "") != ""]
        if non_empty_exec:
            violations.append(
                {
                    "code": "NON_EMPTY_BASELINE_EXECUTION_FIELDS",
                    "case_id": cid,
                    "columns": non_empty_exec,
                    "message": f"Baseline case '{cid}' has non-empty execution columns: {non_empty_exec}.",
                }
            )

    group_counts = Counter(row.get("组", "") for row in coverage)
    if dict(group_counts) != EXPECTED_GROUP_COUNTS:
        violations.append(
            {
                "code": "GROUP_BREAKDOWN_MISMATCH",
                "expected": EXPECTED_GROUP_COUNTS,
                "actual": dict(sorted(group_counts.items())),
                "message": "Group counts in coverage.csv do not match exact 198 scenario + 505 registry breakdown.",
            }
        )

    scenario_ids = {row["逐项用例"] for row in coverage if row.get("组") == "scenario" and "逐项用例" in row}
    source_key_pairs: set[tuple[str, str]] = set()
    for idx, cov_row in enumerate(coverage, start=2):
        cid = cov_row.get("逐项用例", "")
        grp = cov_row.get("组", "")
        skey = cov_row.get("源码键", "")
        if grp != "scenario":
            pair = (grp, skey)
            if pair in source_key_pairs:
                violations.append(
                    {
                        "code": "DUPLICATE_SOURCE_REGISTRY_KEY",
                        "line": idx,
                        "group": grp,
                        "source_key": skey,
                        "message": f"Duplicate (组, 源码键) == {pair} in coverage.csv.",
                    }
                )
            source_key_pairs.add(pair)
            linked = cov_row.get("关联业务用例", "")
            if linked not in scenario_ids or linked == cid:
                violations.append(
                    {
                        "code": "INVALID_LINKED_SCENARIO_CASE",
                        "case_id": cid,
                        "linked_case_id": linked,
                        "message": f"Registry row '{cid}' must link to a valid scenario Case ID, found '{linked}'.",
                    }
                )
            if "#L" not in cov_row.get("Web 源码", ""):
                violations.append(
                    {
                        "code": "MISSING_REGISTRY_LINE_ANCHOR",
                        "case_id": cid,
                        "web_source": cov_row.get("Web 源码", ""),
                        "message": f"Source-registry row '{cid}' must pin a #L<line> Web source anchor.",
                    }
                )
        else:
            if skey != cid:
                violations.append(
                    {
                        "code": "SCENARIO_SOURCE_KEY_MISMATCH",
                        "case_id": cid,
                        "source_key": skey,
                        "message": f"Scenario row '{cid}' must have 源码键 == Case ID, found '{skey}'.",
                    }
                )

        expected_mapping = "候选待实测" if cov_row.get("App 候选", "") else "待定位"
        if cov_row.get("映射") != expected_mapping:
            violations.append(
                {
                    "code": "COVERAGE_MAPPING_LABEL_MISMATCH",
                    "case_id": cid,
                    "expected": expected_mapping,
                    "actual": cov_row.get("映射"),
                    "message": f"Coverage row '{cid}' has 映射='{cov_row.get('映射')}', expected '{expected_mapping}'.",
                }
            )

        case_row = cases_by_id.get(cid)
        if case_row is not None:
            for sync_col in SYNCHRONIZED_COLUMNS:
                if cov_row.get(sync_col) != case_row.get(sync_col):
                    violations.append(
                        {
                            "code": "CASE_COVERAGE_FIELD_DESYNC",
                            "case_id": cid,
                            "column": sync_col,
                            "case_value": case_row.get(sync_col),
                            "coverage_value": cov_row.get(sync_col),
                            "message": f"Field '{sync_col}' differs between cases.csv and coverage.csv for '{cid}'.",
                        }
                    )

    expected_legacy_ids = {
        row["逐项用例"] for row in coverage if row.get("组") == "legacy-devotion"
    } | ({"DEV-03"} if "DEV-03" in cases_by_id else set())
    actual_legacy_ids = {cid for cid, row in cases_by_id.items() if row.get("迁移范围") == "待确认旧入口"}
    if expected_legacy_ids and actual_legacy_ids != expected_legacy_ids:
        violations.append(
            {
                "code": "LEGACY_DEVOTION_SCOPE_MISMATCH",
                "expected": sorted(expected_legacy_ids),
                "actual": sorted(actual_legacy_ids),
                "message": "Cases with 迁移范围 == '待确认旧入口' must equal legacy-devotion rows plus DEV-03.",
            }
        )

    readme_path = suite_path / "README.md"
    if readme_path.is_file():
        guide_text = readme_path.read_text(encoding="utf-8")
        guide_lower = guide_text.lower()
        for token in (baseline_web_sha, baseline_app_sha, *REQUIRED_GUIDE_TOKENS):
            if token.lower() not in guide_lower:
                violations.append(
                    {
                        "code": "README_MISSING_REQUIRED_TOKEN",
                        "token": token,
                        "message": f"README.md is missing required governance/baseline token '{token}'.",
                    }
                )
        for exact_phrase in (
            f"**{EXPECTED_TOTAL_CASES} 条用例**",
            f"**{EXPECTED_SOURCE_REGISTRY_COUNT} 条按源码条目展开的用例**",
            f"**{EXPECTED_SCENARIO_COUNT} 条业务与跨平台场景**",
        ):
            if exact_phrase not in guide_text:
                violations.append(
                    {
                        "code": "README_COUNT_STATEMENT_MISMATCH",
                        "phrase": exact_phrase,
                        "message": f"README.md is missing exact coverage count phrase '{exact_phrase}'.",
                    }
                )
        csv_links = set(re.findall(r"\]\(([a-zA-Z0-9_.-]+\.csv)\)", guide_text))
        if csv_links != {"cases.csv", "coverage.csv"}:
            violations.append(
                {
                    "code": "README_CSV_LINKS_MISMATCH",
                    "links": sorted(csv_links),
                    "message": f"README.md must link to exact CSVs {{'cases.csv', 'coverage.csv'}}, found {sorted(csv_links)}.",
                }
            )

    # 4. Digital human all-100 roster verification
    roster_bytes = _git_show_bytes(resolved_web_repo, baseline_web_sha, DIGITAL_HUMAN_ROSTER_REL_PATH)
    worktree_roster_path = resolved_web_repo / DIGITAL_HUMAN_ROSTER_REL_PATH
    if roster_bytes is None and worktree_roster_path.is_file():
        roster_bytes = worktree_roster_path.read_bytes()

    roster_sha256 = _sha256_bytes(roster_bytes) if roster_bytes is not None else None
    if roster_bytes is None:
        violations.append(
            {
                "code": "ROSTER_FIXTURE_MISSING",
                "path": DIGITAL_HUMAN_ROSTER_REL_PATH,
                "message": f"Could not load {DIGITAL_HUMAN_ROSTER_REL_PATH} from {resolved_web_repo}.",
            }
        )
    else:
        if roster_sha256 != EXPECTED_ROSTER_SHA256:
            violations.append(
                {
                    "code": "ROSTER_SHA256_MISMATCH",
                    "expected": EXPECTED_ROSTER_SHA256,
                    "actual": roster_sha256,
                    "message": "Digital human all100 fixture SHA-256 does not match pinned digest.",
                }
            )
        if worktree_roster_path.is_file():
            wt_sha = _sha256_bytes(worktree_roster_path.read_bytes())
            if wt_sha != EXPECTED_ROSTER_SHA256:
                violations.append(
                    {
                        "code": "WORKTREE_ROSTER_SHA256_DRIFT",
                        "expected": EXPECTED_ROSTER_SHA256,
                        "actual": wt_sha,
                        "message": "Working-tree digital-human-all100.json drifted from pinned SHA-256.",
                    }
                )
        roster_payload = json.loads(roster_bytes.decode("utf-8"))
        characters = roster_payload.get("characters", [])
        char_ids = {item.get("characterId") for item in characters}
        mirror_ids = {item.get("mirrorId") for item in characters}
        expected_human_case_ids = {f"DH-C{idx:03d}" for idx in range(1, 101)}
        actual_human_case_ids = {row["逐项用例"] for row in coverage if row.get("组") == "human"}
        if len(characters) != 100 or len(char_ids) != 100 or len(mirror_ids) != 100:
            violations.append(
                {
                    "code": "ROSTER_IDENTITY_CARDINALITY_ERROR",
                    "characters": len(characters),
                    "unique_character_ids": len(char_ids),
                    "unique_mirror_ids": len(mirror_ids),
                    "message": "digital-human-all100.json must have 100 unique characterIds and 100 unique mirrorIds.",
                }
            )
        if actual_human_case_ids != expected_human_case_ids:
            violations.append(
                {
                    "code": "HUMAN_CASE_ID_SET_MISMATCH",
                    "message": "Coverage 'human' group must equal exact case IDs DH-C001..DH-C100.",
                }
            )
        for person in characters:
            dh_case_id = f"DH-C{int(person['index']):03d}"
            dh_case = cases_by_id.get(dh_case_id)
            if dh_case is None:
                violations.append(
                    {
                        "code": "MISSING_DIGITAL_HUMAN_CASE",
                        "case_id": dh_case_id,
                        "message": f"Missing roster case '{dh_case_id}' in cases.csv.",
                    }
                )
                continue
            steps_text = dh_case.get("步骤", "")
            expected_text = dh_case.get("预期", "")
            for required_step_token in (
                person["characterId"],
                person["canonicalName"],
                person["question"],
                *person.get("followups", []),
            ):
                if required_step_token not in steps_text:
                    violations.append(
                        {
                            "code": "DIGITAL_HUMAN_PROMPT_CONTRACT_MISSING",
                            "case_id": dh_case_id,
                            "missing_token": required_step_token,
                            "message": f"Case '{dh_case_id}' 步骤 is missing roster token '{required_step_token}'.",
                        }
                    )
            for ref in person.get("expectedReferences", []):
                if ref not in expected_text:
                    violations.append(
                        {
                            "code": "DIGITAL_HUMAN_REFERENCE_CONTRACT_MISSING",
                            "case_id": dh_case_id,
                            "missing_reference": ref,
                            "message": f"Case '{dh_case_id}' 预期 is missing expected reference '{ref}'.",
                        }
                    )

    # 5. Baseline Web SHA source verification + live HEAD continuity audit
    head_sha = _git_rev_parse(resolved_web_repo, "HEAD")
    web_origin_main_sha = _git_rev_parse(resolved_web_repo, "refs/remotes/origin/main")
    baseline_web_available = _git_commit_exists(resolved_web_repo, baseline_web_sha)

    head_continuity: dict[str, Any] = {
        "web_repo": str(resolved_web_repo),
        "baseline_web_sha": baseline_web_sha,
        "baseline_commit_available": baseline_web_available,
        "head_sha": head_sha,
        "web_origin_main_sha": web_origin_main_sha,
        "commits_ahead_of_baseline": None,
        "all_referenced_paths_exist_on_head": False,
        "missing_on_head": {},
        "modified_referenced_files": [],
        "head_line_exceeded_warnings": {},
    }

    if not baseline_web_available or head_sha is None:
        violations.append(
            {
                "code": "WEB_REPO_GIT_BASELINE_UNAVAILABLE",
                "web_repo": str(resolved_web_repo),
                "baseline_web_sha": baseline_web_sha,
                "message": f"Web repository '{resolved_web_repo}' does not contain commit '{baseline_web_sha}' or HEAD.",
            }
        )
    else:
        ahead_proc = _run_git(resolved_web_repo, "rev-list", "--count", f"{baseline_web_sha}..{head_sha}")
        if ahead_proc.returncode == 0:
            head_continuity["commits_ahead_of_baseline"] = int(
                ahead_proc.stdout.decode("utf-8", errors="replace").strip()
            )

        baseline_web_paths = _git_ls_tree_paths(resolved_web_repo, baseline_web_sha)
        head_web_paths = _git_ls_tree_paths(resolved_web_repo, head_sha)

        baseline_line_counts: dict[str, int] = {}
        head_line_counts: dict[str, int] = {}
        baseline_file_blobs: dict[str, bytes] = {}
        head_file_blobs: dict[str, bytes] = {}
        referenced_files_to_cases: dict[str, list[str]] = {}
        missing_on_head: dict[str, str] = {}
        head_line_warnings: dict[str, dict[str, Any]] = {}

        for cid, row in cases_by_id.items():
            raw_web_src = row.get("Web 源码", "")
            rel_file, sep, raw_line = raw_web_src.partition("#L")
            has_line = bool(sep)
            referenced_files_to_cases.setdefault(rel_file, []).append(cid)

            if not _web_path_exists(rel_file, has_line, baseline_web_paths):
                violations.append(
                    {
                        "code": "WEB_SOURCE_MISSING_AT_BASELINE",
                        "case_id": cid,
                        "web_source": raw_web_src,
                        "message": f"Case '{cid}' references '{rel_file}' which does not exist at {baseline_web_sha}.",
                    }
                )
                continue

            if not _web_path_exists(rel_file, has_line, head_web_paths):
                missing_on_head[cid] = raw_web_src
                violations.append(
                    {
                        "code": "WEB_SOURCE_MISSING_AT_HEAD",
                        "case_id": cid,
                        "web_source": raw_web_src,
                        "head_sha": head_sha,
                        "message": f"Case '{cid}' references '{rel_file}' which is missing on current HEAD {head_sha}.",
                    }
                )

            if has_line:
                if not raw_line.isdigit():
                    violations.append(
                        {
                            "code": "INVALID_WEB_SOURCE_LINE_NUMBER",
                            "case_id": cid,
                            "web_source": raw_web_src,
                            "message": f"Case '{cid}' has non-numeric #L anchor '{raw_web_src}'.",
                        }
                    )
                    continue
                line_no = int(raw_line)
                if rel_file not in baseline_line_counts:
                    blob = _git_show_bytes(resolved_web_repo, baseline_web_sha, rel_file) or b""
                    baseline_file_blobs[rel_file] = blob
                    baseline_line_counts[rel_file] = len(blob.decode("utf-8", errors="replace").splitlines())
                max_base_line = baseline_line_counts[rel_file]
                if not (1 <= line_no <= max_base_line):
                    violations.append(
                        {
                            "code": "WEB_SOURCE_LINE_OUT_OF_RANGE",
                            "case_id": cid,
                            "web_source": raw_web_src,
                            "line": line_no,
                            "baseline_line_count": max_base_line,
                            "message": (
                                f"Case '{cid}' Web source '{raw_web_src}' is out of bounds "
                                f"(valid 1..{max_base_line} at {baseline_web_sha[:12]})."
                            ),
                        }
                    )
                if rel_file in head_web_paths:
                    if rel_file not in head_line_counts:
                        hblob = _git_show_bytes(resolved_web_repo, head_sha, rel_file) or b""
                        head_file_blobs[rel_file] = hblob
                        head_line_counts[rel_file] = len(hblob.decode("utf-8", errors="replace").splitlines())
                    if line_no > head_line_counts[rel_file]:
                        head_line_warnings[cid] = {
                            "web_source": raw_web_src,
                            "pinned_line": line_no,
                            "head_line_count": head_line_counts[rel_file],
                        }

        modified_referenced_files: list[dict[str, Any]] = []
        for rel_file in sorted(referenced_files_to_cases):
            if rel_file in baseline_web_paths and rel_file in head_web_paths:
                b_blob = baseline_file_blobs.get(rel_file)
                if b_blob is None:
                    b_blob = _git_show_bytes(resolved_web_repo, baseline_web_sha, rel_file) or b""
                h_blob = head_file_blobs.get(rel_file)
                if h_blob is None:
                    h_blob = _git_show_bytes(resolved_web_repo, head_sha, rel_file) or b""
                if b_blob != h_blob:
                    b_lines = len(b_blob.decode("utf-8", errors="replace").splitlines())
                    h_lines = len(h_blob.decode("utf-8", errors="replace").splitlines())
                    modified_referenced_files.append(
                        {
                            "file": rel_file,
                            "baseline_lines": b_lines,
                            "head_lines": h_lines,
                            "line_delta": h_lines - b_lines,
                            "referenced_case_count": len(referenced_files_to_cases[rel_file]),
                            "sample_case_ids": sorted(referenced_files_to_cases[rel_file])[:8],
                        }
                    )

        head_continuity["all_referenced_paths_exist_on_head"] = len(missing_on_head) == 0
        head_continuity["missing_on_head"] = missing_on_head
        head_continuity["modified_referenced_files"] = modified_referenced_files
        head_continuity["head_line_exceeded_warnings"] = head_line_warnings

    # 6. Sibling bible3dsphereApp candidate verification & unmapped resolution audit
    unmapped_rows = [row for row in coverage if row.get("映射") == "待定位"]
    app_available = resolved_app_repo.is_dir() and _git_rev_parse(resolved_app_repo, "HEAD") is not None
    unmapped_resolution: dict[str, Any] = {
        "app_repo": str(resolved_app_repo),
        "app_repo_explicit": app_repo_explicit,
        "app_repo_available": app_available,
        "baseline_app_sha": baseline_app_sha,
        "unmapped_count": len(unmapped_rows),
        "unmapped_case_ids": sorted(row.get("逐项用例", "") for row in unmapped_rows),
        "candidate_missing_at_app_baseline": {},
        "suggestions": [],
        "classification_counts": {},
    }

    if app_available:
        if not _git_commit_exists(resolved_app_repo, baseline_app_sha):
            violations.append(
                {
                    "code": "APP_BASELINE_COMMIT_MISSING",
                    "app_repo": str(resolved_app_repo),
                    "baseline_app_sha": baseline_app_sha,
                    "message": f"App repository '{resolved_app_repo}' does not contain baseline commit '{baseline_app_sha}'.",
                }
            )
        else:
            baseline_app_paths = _git_ls_tree_paths(resolved_app_repo, baseline_app_sha)
            missing_app_candidates: dict[str, str] = {}
            for cid, row in cases_by_id.items():
                app_cand = row.get("App 候选", "")
                if app_cand and app_cand not in baseline_app_paths:
                    missing_app_candidates[cid] = app_cand
                    violations.append(
                        {
                            "code": "APP_CANDIDATE_MISSING_AT_BASELINE",
                            "case_id": cid,
                            "app_candidate": app_cand,
                            "message": (
                                f"Case '{cid}' App 候选 '{app_cand}' does not exist in "
                                f"bible3dsphereApp at {baseline_app_sha}."
                            ),
                        }
                    )
            unmapped_resolution["candidate_missing_at_app_baseline"] = missing_app_candidates

            app_head_sha = _git_rev_parse(resolved_app_repo, "HEAD")
            app_origin_main_sha = _git_rev_parse(resolved_app_repo, "refs/remotes/origin/main")
            inspection_ref = app_origin_main_sha or app_head_sha or baseline_app_sha
            dart_lib_paths = {
                p
                for p in _git_ls_tree_paths(resolved_app_repo, inspection_ref, prefix="lib")
                if p.endswith(".dart")
            }

            suggestions: list[dict[str, Any]] = []
            for cov_row in sorted(unmapped_rows, key=lambda item: item.get("逐项用例", "")):
                cid = cov_row.get("逐项用例", "")
                c_row = cases_by_id.get(cid, {})
                suggestions.append(
                    _suggest_dart_candidates_for_unmapped_row(
                        cov_row,
                        c_row,
                        dart_lib_paths,
                        baseline_app_paths,
                    )
                )
            unmapped_resolution["app_head_sha"] = app_head_sha
            unmapped_resolution["app_origin_main_sha"] = app_origin_main_sha
            unmapped_resolution["inspected_dart_ref"] = inspection_ref
            unmapped_resolution["inspected_dart_file_count"] = len(dart_lib_paths)
            unmapped_resolution["suggestions"] = suggestions
            unmapped_resolution["classification_counts"] = dict(
                sorted(Counter(item["classification"] for item in suggestions).items())
            )
    else:
        # Even without sibling App repo in isolated CI, classify legacy-devotion deterministically.
        offline_suggestions = []
        for cov_row in sorted(unmapped_rows, key=lambda item: item.get("逐项用例", "")):
            is_legacy = cov_row.get("迁移范围") == "待确认旧入口" or cov_row.get("组") == "legacy-devotion"
            offline_suggestions.append(
                {
                    "case_id": cov_row.get("逐项用例", ""),
                    "group": cov_row.get("组", ""),
                    "source_key": cov_row.get("源码键", ""),
                    "web_source": cov_row.get("Web 源码", ""),
                    "classification": "待确认旧入口" if is_legacy else "App仓库未挂载_跳过候选扫描",
                    "suggested_candidates": [],
                    "added_since_app_baseline": [],
                }
            )
        unmapped_resolution["suggestions"] = offline_suggestions
        unmapped_resolution["classification_counts"] = dict(
            sorted(Counter(item["classification"] for item in offline_suggestions).items())
        )

    # Confirm zero mutation of input files during validation.
    post_sha256: dict[str, str] = {}
    for fname in sorted(EXPECTED_SUITE_FILES):
        fpath = suite_path / fname
        if fpath.is_file():
            post_sha256[fname] = _sha256_bytes(fpath.read_bytes())
    if post_sha256 != input_sha256:
        violations.append(
            {
                "code": "SUITE_MUTATED_DURING_VALIDATION",
                "before": input_sha256,
                "after": post_sha256,
                "message": "Acceptance suite files changed during validation.",
            }
        )

    by_priority = dict(sorted(Counter(r.get("优先级", "") for r in cases).items()))
    by_mode = dict(sorted(Counter(r.get("执行方式", "") for r in cases).items()))
    by_fixture = dict(sorted(Counter(r.get("夹具", "") for r in cases).items()))
    by_mapping = dict(sorted(Counter(r.get("映射", "") for r in coverage).items()))

    receipt: dict[str, Any] = {
        "pid": os.getpid(),
        "executed": True,
        "valid": len(violations) == 0,
        "suite_dir": str(suite_path),
        "count": len(cases),
        "scenarios": group_counts.get("scenario", 0),
        "source_registry": len(cases) - group_counts.get("scenario", 0),
        "roster_cases": group_counts.get("human", 0),
        "roster_sha256": roster_sha256,
        "groups": dict(sorted(group_counts.items())),
        "by_priority": by_priority,
        "by_execution_mode": by_mode,
        "by_fixture": by_fixture,
        "by_app_mapping": by_mapping,
        "input_sha256": input_sha256,
        "head_continuity": head_continuity,
        "unmapped_resolution": unmapped_resolution,
        "violation_count": len(violations),
        "violations": violations,
    }
    if strict and violations:
        raise AcceptanceSuiteValidationError(receipt)
    return receipt


def build_arg_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Validate the 703-case Web -> App migration acceptance suite deterministically."
    )
    parser.add_argument(
        "suite_dir",
        help="Path to docs/web-app-acceptance directory containing README.md, cases.csv, coverage.csv.",
    )
    parser.add_argument(
        "--web-repo",
        default=None,
        help="Optional path to bible3dsphereWeb repository (auto-detected by default).",
    )
    parser.add_argument(
        "--app-repo",
        default=None,
        help="Optional path to sibling bible3dsphereApp repository (gracefully skipped if missing).",
    )
    parser.add_argument(
        "--baseline-web-sha",
        default=DEFAULT_BASELINE_WEB_SHA,
        help=f"Pinned Web git commit SHA (default: {DEFAULT_BASELINE_WEB_SHA}).",
    )
    parser.add_argument(
        "--baseline-app-sha",
        default=DEFAULT_BASELINE_APP_SHA,
        help=f"Pinned App git commit SHA (default: {DEFAULT_BASELINE_APP_SHA}).",
    )
    parser.add_argument(
        "--json-out",
        default=None,
        help="Optional file path to write the structured JSON validation receipt.",
    )
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_arg_parser().parse_args(argv)
    receipt = validate_acceptance_suite(
        args.suite_dir,
        web_repo=args.web_repo,
        app_repo=args.app_repo,
        baseline_web_sha=args.baseline_web_sha,
        baseline_app_sha=args.baseline_app_sha,
    )
    rendered = json.dumps(receipt, ensure_ascii=False, indent=2)
    if args.json_out:
        out_path = Path(args.json_out)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(rendered + "\n", encoding="utf-8")
    sys.stdout.write(rendered + "\n")
    return 0 if receipt["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
