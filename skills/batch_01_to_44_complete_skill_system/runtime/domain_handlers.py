#!/usr/bin/env python3
"""Callable Batch 01-44 domain handlers with exact evidence contracts."""

from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from typing import Any, Callable


NAME_RE = re.compile(r"^[a-z][a-z0-9_-]*$")


class DomainHandlerError(ValueError):
    pass


@dataclass(frozen=True)
class DomainPolicy:
    batch: int
    handler: str
    operation: str
    capabilities: tuple[str, ...]
    safety_controls: tuple[str, ...]


POLICY_SPECS: tuple[tuple[int, str, str, tuple[str, ...], tuple[str, ...]], ...] = (
    (1, "competitive_landscape", "assess-competitive-landscape", ("source-research", "capability-baseline"), ("provenance-required", "external-facts-labeled")),
    (2, "application_modernization_assessment", "assess-application-modernization", ("estate-discovery", "risk-assessment"), ("read-only-source", "decision-trace")),
    (3, "canonical_semantic_ir", "build-canonical-semantic-ir", ("typed-semantic-ir", "source-map"), ("no-silent-drop", "versioned-contract")),
    (4, "transformation_recipe_engine", "execute-transformation-recipe", ("recipe-selection", "semantic-transformation"), ("deterministic-rules", "unsupported-explicit")),
    (5, "target_language_lowering", "lower-target-language", ("target-ast", "target-build"), ("exact-toolchain", "no-permissive-fallback")),
    (6, "standard-library-dependency-compatibility", "verify-dependency-compatibility", ("dependency-map", "compatibility-check"), ("version-locked", "license-checked")),
    (7, "framework-contract-recipe-packs", "execute-framework-contract-pack", ("runtime-fingerprint", "framework-contract"), ("exact-version-tuple", "security-preserved")),
    (8, "repository-aware-multi-agent", "execute-repository-work-units", ("work-unit", "merge-reconciliation"), ("bounded-agents", "tenant-isolated")),
    (9, "build-compile-test-repair", "execute-build-repair", ("build-execution", "diagnostic-repair"), ("no-test-weakening", "replayable")),
    (10, "behavioral-equivalence-differential", "verify-behavioral-equivalence", ("source-target-observation", "difference-classification"), ("deterministic-fixture", "unknown-fails-closed")),
    (11, "performance-security-production-semantics", "verify-production-semantics", ("workload-semantics", "security-semantics"), ("bounded-load", "least-privilege")),
    (12, "benchmark-quality-economics", "evaluate-quality-economics", ("benchmark", "unit-economics"), ("exact-cost-inputs", "not-run-on-missing")),
    (13, "evidence-graph-continuous-certification", "compose-continuous-evidence", ("evidence-graph", "continuous-recertification"), ("role-separated", "content-addressed")),
    (14, "formal-verification-proof-carrying", "verify-proof-carrying-result", ("proof-obligation", "solver-result"), ("bounded-claim", "unknown-fails-closed")),
    (15, "counterexample-guided-repair", "repair-counterexample", ("counterexample-replay", "repair-validation"), ("minimized-counterexample", "no-test-weakening")),
    (16, "target-architecture-search", "search-target-architecture", ("candidate-evaluation", "constraint-selection"), ("bounded-search", "decision-trace")),
    (17, "migration-execution-os", "execute-migration-workflow", ("checkpoint-recovery", "compensation"), ("idempotent-steps", "fencing-protected")),
    (18, "complete-project-generation", "generate-complete-project", ("blueprint-lowering", "target-build"), ("source-trace", "no-permissive-stub")),
    (19, "seventy-two-directional-route-packs", "execute-directional-route-pack", ("directed-route", "compiler-validation"), ("direction-isolated", "exact-toolchain")),
    (20, "skill-sdk-runtime-registry", "execute-skill-runtime", ("skill-contract", "runtime-install"), ("least-privilege", "collision-safe")),
    (21, "real-repository-golden-workload", "execute-real-repository-workload", ("repository-fingerprint", "golden-workload"), ("source-immutable", "customer-data-isolated")),
    (22, "semantic-recovery-hardening", "harden-semantic-recovery", ("semantic-recovery", "unknown-obligation"), ("no-silent-drop", "counterexample-replay")),
    (23, "framework-modernization-execution", "execute-framework-modernization", ("runtime-fingerprint", "source-target-runtime"), ("exact-version-tuple", "security-preserved")),
    (24, "real-build-test-artifact-lab", "execute-build-test-lab", ("real-build", "artifact-verification"), ("isolated-workspace", "immutable-artifact")),
    (25, "behavioral-equivalence-gate", "evaluate-behavioral-equivalence", ("behavioral-comparison", "difference-oracle"), ("unknown-fails-closed", "baseline-frozen")),
    (26, "dual-run-shadow-reconciliation", "execute-dual-run-shadow", ("shadow-observation", "detail-reconciliation"), ("read-only-shadow", "rollback-ready")),
    (27, "canonical-database-ir-foundation", "build-canonical-database-ir", ("database-workload-fingerprint", "canonical-database-ir"), ("read-only-source", "precision-preserved")),
    (28, "relational-database-12-routes", "execute-relational-route", ("schema-query-transformation", "engine-validation"), ("direction-isolated", "disposable-data")),
    (29, "multi-language-route-factory", "execute-language-route-factory", ("directed-language-route", "target-compiler"), ("direction-isolated", "unsupported-explicit")),
    (30, "multi-framework-version-factory", "execute-framework-version-factory", ("framework-contract", "target-startup"), ("exact-version-tuple", "security-preserved")),
    (31, "database-data-platform-factory", "execute-database-data-factory", ("database-contract", "schema-data-migration", "reconciliation-rollback"), ("disposable-data", "precision-preserved", "rollback-tested")),
    (32, "client-ui-modernization-factory", "execute-client-ui-factory", ("ui-interaction-ir", "browser-journey"), ("accessibility-preserved", "privacy-minimized")),
    (33, "cloud-iac-platform-factory", "execute-cloud-iac-factory", ("provider-identity", "provider-operation", "cleanup-reconciliation"), ("least-privilege", "isolated-resources", "cleanup-tested")),
    (34, "portfolio-scale-migration-factory", "execute-portfolio-migration", ("bounded-work-units", "checkpoint-recovery"), ("tenant-isolated", "budget-enforced")),
    (35, "advanced-verification-factory", "execute-advanced-verification", ("verification-profile", "counterexample-replay"), ("bounded-campaign", "unknown-fails-closed")),
    (36, "developer-experience-integration", "execute-developer-workflow", ("typed-developer-protocol", "review-workflow"), ("least-privilege", "protected-regions")),
    (37, "extension-marketplace-governance", "execute-extension-governance", ("extension-contract", "publisher-lifecycle"), ("sandboxed", "signature-required")),
    (38, "platform-convergence", "execute-platform-convergence", ("capability-convergence", "dependency-reconciliation"), ("namespace-preserved", "failed-gates-propagate")),
    (39, "durable-workflow-runner-reliability", "verify-durable-workflow", ("lease-fencing", "replay-reconciliation"), ("idempotent-steps", "failure-isolated")),
    (40, "adversarial-security-privacy", "execute-security-privacy-assurance", ("adversarial-control", "privacy-boundary"), ("tenant-isolated", "secret-free")),
    (41, "release-progressive-delivery", "execute-progressive-delivery", ("canary-decision", "automated-rollback"), ("approval-required", "artifact-digest-bound")),
    (42, "production-operations-readiness", "verify-production-readiness", ("slo-incident", "support-readiness"), ("oncall-owned", "evidence-expiring")),
    (43, "legacy-coexistence-retirement", "verify-legacy-retirement", ("coexistence-exit", "data-portability"), ("decommission-approved", "restore-retained")),
    (44, "unified-production-release-gate", "evaluate-unified-release-gate", ("domain-gate-composition", "residual-risk"), ("independent-review", "failed-gates-propagate")),
)


POLICIES = {item[0]: DomainPolicy(*item) for item in POLICY_SPECS}
BY_HANDLER = {policy.handler: policy for policy in POLICIES.values()}
if len(POLICIES) != 44 or sorted(POLICIES) != list(range(1, 45)) or len(BY_HANDLER) != 44:
    raise RuntimeError("Batch 01-44 policies must cover 44 unique handlers")


def canonical_digest(value: Any) -> str:
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return "sha256:" + hashlib.sha256(encoded).hexdigest()


def contract_for_batch(batch: int) -> dict[str, Any]:
    policy = POLICIES[batch]
    return {
        "handler": policy.handler, "contract_version": "1.0", "operation": policy.operation,
        "capabilities": list(policy.capabilities), "safety_controls": list(policy.safety_controls),
    }


def evidence_role(policy: DomainPolicy, capability: str) -> str:
    return f"domain:{policy.handler}:{capability}"


def _validate(policy: DomainPolicy, contract: Any, oracle_id: str, tools: list[dict[str, Any]],
              assertions: list[dict[str, Any]], raw_roles: set[str], decision: str) -> list[dict[str, str]]:
    required = {"handler", "contract_version", "operation", "capabilities", "safety_controls"}
    if not isinstance(contract, dict) or set(contract) != required or contract != contract_for_batch(policy.batch):
        raise DomainHandlerError(f"Batch {policy.batch} domain contract does not match handler {policy.handler}")
    if any(not NAME_RE.fullmatch(item) for item in (policy.handler, *policy.capabilities, *policy.safety_controls)):
        raise DomainHandlerError(f"Batch {policy.batch} policy contains an invalid name")
    tool_roles = {item.get("evidence_role") for item in tools if item.get("exit_code") == 0}
    assertion_by_name: dict[str, dict[str, Any]] = {}
    for item in assertions:
        name = item.get("name")
        if not isinstance(name, str) or not name.startswith(oracle_id + ":") or name in assertion_by_name:
            raise DomainHandlerError(f"Batch {policy.batch} assertions are not uniquely bound to {oracle_id}")
        assertion_by_name[name] = item
    checks: list[dict[str, str]] = [{
        "name": f"domain-handler:{policy.handler}", "outcome": "PASS",
        "detail": f"operation={policy.operation}; contract={canonical_digest(contract)}",
    }]
    operation_name = f"{oracle_id}:operation:{policy.operation}"
    if operation_name not in assertion_by_name:
        raise DomainHandlerError(f"Batch {policy.batch} lacks operation assertion {operation_name}")
    required_names = [operation_name]
    for capability in policy.capabilities:
        role = evidence_role(policy, capability)
        assertion_name = f"{oracle_id}:capability:{capability}"
        if role not in tool_roles or role not in raw_roles:
            raise DomainHandlerError(f"Batch {policy.batch} capability {capability} lacks matching tool and raw evidence role")
        if assertion_name not in assertion_by_name:
            raise DomainHandlerError(f"Batch {policy.batch} lacks capability assertion {assertion_name}")
        required_names.append(assertion_name)
        checks.append({"name": f"domain-capability:{capability}", "outcome": assertion_by_name[assertion_name]["outcome"], "detail": role})
    for control in policy.safety_controls:
        assertion_name = f"{oracle_id}:safety:{control}"
        if assertion_name not in assertion_by_name:
            raise DomainHandlerError(f"Batch {policy.batch} lacks safety assertion {assertion_name}")
        required_names.append(assertion_name)
        checks.append({"name": f"domain-safety:{control}", "outcome": assertion_by_name[assertion_name]["outcome"], "detail": policy.operation})
    if decision == "PASS" and any(assertion_by_name[name].get("outcome") != "PASS" for name in required_names):
        raise DomainHandlerError(f"Batch {policy.batch} PASS contradicts its domain contract assertions")
    return checks


def _make_handler(policy: DomainPolicy) -> Callable[..., list[dict[str, str]]]:
    def handler(contract: Any, oracle_id: str, tools: list[dict[str, Any]], assertions: list[dict[str, Any]],
                raw_roles: set[str], decision: str) -> list[dict[str, str]]:
        return _validate(policy, contract, oracle_id, tools, assertions, raw_roles, decision)
    handler.__name__ = policy.handler.replace("-", "_")
    handler.__qualname__ = handler.__name__
    return handler


HANDLERS = {policy.handler: _make_handler(policy) for policy in POLICIES.values()}


def execute_handler(batch: int, registered_handler: str, contract: Any, oracle_id: str,
                    tools: list[dict[str, Any]], assertions: list[dict[str, Any]],
                    raw_roles: set[str], decision: str) -> list[dict[str, str]]:
    policy = POLICIES.get(batch)
    handler = HANDLERS.get(registered_handler)
    if policy is None or handler is None or policy.handler != registered_handler:
        raise DomainHandlerError(f"Batch {batch} has no callable domain handler")
    return handler(contract, oracle_id, tools, assertions, raw_roles, decision)
