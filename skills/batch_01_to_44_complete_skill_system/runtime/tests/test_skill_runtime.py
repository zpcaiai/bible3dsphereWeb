from __future__ import annotations

import base64
import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest import mock


RUNTIME_PATH = Path(__file__).resolve().parents[1] / "skill_runtime.py"
SPEC = importlib.util.spec_from_file_location("batch_skill_runtime", RUNTIME_PATH)
assert SPEC and SPEC.loader
runtime = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = runtime
SPEC.loader.exec_module(runtime)
import domain_handlers
import skill_handlers
import provider_runtime
import production_closure
import original_payload_recovery


class SkillRuntimeTest(unittest.TestCase):
    skill = "batch-05-target-code-generation"

    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.source = self.root / "source"
        self.workspace = self.root / "workspace"
        self.actors = self.root / "actors"
        self.source.mkdir()
        self.actors.mkdir()
        (self.source / "pom.xml").write_text("<project/>\n", encoding="utf-8")
        (self.source / "Main.java").write_text("final class Main {}\n", encoding="utf-8")
        self.private_keys: dict[str, Path] = {}
        roles = {
            "executor-dev": ["executor"], "executor-holdout": ["holdout-executor"],
            "executor-production": ["production-executor"], "oracle-owner": ["oracle-owner"],
            "verifier-dev": ["verifier"], "verifier-holdout": ["holdout-verifier"],
            "verifier-production": ["production-verifier"],
            "adapter-admin": ["adapter-admin"], "approver": ["approver", "production-approver"],
            "data-owner": ["data-owner"], "holdout-custodian": ["holdout-custodian"],
            "operations-owner": ["operations-owner"], "independent-certifier": ["independent-certifier"],
            "transformation-author": ["transformation-author"],
            "external-trust-approver": ["external-trust-approver"],
            "source-owner": ["source-owner"], "recovery-approver": ["recovery-approver"],
            "recovery-verifier": ["recovery-verifier"],
        }
        organizations = {
            "executor-dev": ("development-org", "implementation-provider"),
            "executor-holdout": ("holdout-executor-org", "holdout-lab"),
            "executor-production": ("production-executor-org", "operations"),
            "oracle-owner": ("oracle-org", "oracle-authority"),
            "verifier-dev": ("development-verifier-org", "independent-verifier"),
            "verifier-holdout": ("holdout-verifier-org", "independent-verifier"),
            "verifier-production": ("production-verifier-org", "independent-verifier"),
            "adapter-admin": ("platform-admin-org", "operations"),
            "approver": ("customer-approval-org", "customer"),
            "data-owner": ("customer-data-org", "customer"),
            "holdout-custodian": ("holdout-custodian-org", "customer"),
            "transformation-author": ("implementation-author-org", "implementation-provider"),
            "operations-owner": ("production-operations-org", "operations"),
            "independent-certifier": ("local-assurance-org", "independent-verifier"),
            "external-trust-approver": ("customer-governance-org", "customer"),
            "source-owner": ("source-archive-org", "source-archive"),
            "recovery-approver": ("recovery-approval-org", "customer"),
            "recovery-verifier": ("recovery-verifier-org", "independent-verifier"),
        }
        entries = []
        for actor_id, actor_roles in roles.items():
            private = self.actors / f"{actor_id}.private.pem"
            public = self.actors / f"{actor_id}.public.pem"
            subprocess.run(["openssl", "genpkey", "-algorithm", "ED25519", "-out", str(private)], check=True, capture_output=True)
            subprocess.run(["openssl", "pkey", "-in", str(private), "-pubout", "-out", str(public)], check=True, capture_output=True)
            self.private_keys[actor_id] = private
            entries.append({"actor_id": actor_id, "key_id": f"key-{actor_id}", "roles": actor_roles,
                            "public_key_path": public.name, "not_before": "2020-01-01T00:00:00Z",
                            "not_after": "2099-01-01T00:00:00Z", "revoked": False,
                            "organization_id": organizations[actor_id][0],
                            "authority_class": organizations[actor_id][1]})
        self.trust_store = self.actors / "trust-store.json"
        self.trust_store.write_text(json.dumps({"schema_version": "2.0", "store_id": "workspace-test-actors",
            "purpose": "workspace-actors", "actors": entries, "revoked_record_ids": []}), encoding="utf-8")
        runtime.initialize_workspace(self.workspace, self.source, self.trust_store)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    @staticmethod
    def actors_for(corpus: str) -> tuple[str, str, str]:
        if corpus == "holdout":
            return "executor-holdout", "holdout-executor", "verifier-holdout"
        if corpus == "production":
            return "executor-production", "production-executor", "verifier-production"
        return "executor-dev", "executor", "verifier-dev"

    def sign(self, actor_id: str, bindings: dict, token: str) -> dict:
        payload = {"actor_id": actor_id, "record_id": f"record-{actor_id}-{token}",
                   "issued_at": "2020-01-01T00:00:00Z", "expires_at": "2099-01-01T00:00:00Z", **bindings}
        source = self.root / f"payload-{actor_id}-{token}.json"
        signature = self.root / f"payload-{actor_id}-{token}.sig"
        source.write_bytes(runtime.canonical_bytes(payload))
        subprocess.run(["openssl", "pkeyutl", "-sign", "-inkey", str(self.private_keys[actor_id]), "-rawin",
                        "-in", str(source), "-out", str(signature)], check=True, capture_output=True)
        return {"algorithm": "ed25519", "key_id": f"key-{actor_id}", "payload": payload,
                "signature": base64.urlsafe_b64encode(signature.read_bytes()).decode("ascii").rstrip("=")}

    def external_certification_authority(self, tenant_id: str) -> tuple[Path, Path, dict]:
        directory = self.root / "external-certification-authority"
        directory.mkdir(exist_ok=True)
        actor_id = "external-certifier"
        private = directory / f"{actor_id}.private.pem"
        public = directory / f"{actor_id}.public.pem"
        subprocess.run(["openssl", "genpkey", "-algorithm", "ED25519", "-out", str(private)],
                       check=True, capture_output=True)
        subprocess.run(["openssl", "pkey", "-in", str(private), "-pubout", "-out", str(public)],
                       check=True, capture_output=True)
        self.private_keys[actor_id] = private
        store_path = directory / "trust-store.json"
        store_path.write_text(json.dumps({"schema_version": "2.0", "store_id": "external-ca-fixture",
            "purpose": "external-certification", "actors": [{"actor_id": actor_id,
                "key_id": f"key-{actor_id}", "roles": ["independent-certifier"],
                "public_key_path": public.name, "not_before": "2020-01-01T00:00:00Z",
                "not_after": "2099-01-01T00:00:00Z", "revoked": False,
                "organization_id": "external-certification-org", "authority_class": "certification-body"}],
            "revoked_record_ids": []}), encoding="utf-8")
        store = runtime.TrustStore.load(store_path)
        policy = {"schema_version": "1.0", "policy_id": "external-ca-policy", "tenant_id": tenant_id,
            "external_store_id": store.store_id, "external_store_sha256": store.digest,
            "authority_organization_id": "external-certification-org", "authority_class": "certification-body",
            "purposes": ["independent-certification"], "issued_at": "2020-01-01T00:00:00Z",
            "expires_at": "2099-01-01T00:00:00Z", "revoked": False}
        policy_path = directory / "policy.json"
        policy_path.write_text(json.dumps(policy), encoding="utf-8")
        approval = self.sign("external-trust-approver", {"policy_id": policy["policy_id"],
            "tenant_id": tenant_id, "policy_sha256": runtime.canonical_digest(policy),
            "external_store_sha256": store.digest, "purpose": "independent-certification"},
            "external-ca-policy")
        return store_path, policy_path, approval

    def external_source_authority(self, tenant_id: str) -> tuple[Path, Path, dict]:
        directory = self.root / "external-source-authority"
        directory.mkdir(exist_ok=True)
        actor_id = "external-source-owner"
        private = directory / f"{actor_id}.private.pem"
        public = directory / f"{actor_id}.public.pem"
        subprocess.run(["openssl", "genpkey", "-algorithm", "ED25519", "-out", str(private)],
                       check=True, capture_output=True)
        subprocess.run(["openssl", "pkey", "-in", str(private), "-pubout", "-out", str(public)],
                       check=True, capture_output=True)
        self.private_keys[actor_id] = private
        store_path = directory / "trust-store.json"
        store_path.write_text(json.dumps({"schema_version": "2.0", "store_id": "external-source-fixture",
            "purpose": "source-provenance", "actors": [{"actor_id": actor_id,
                "key_id": f"key-{actor_id}", "roles": ["source-owner"],
                "public_key_path": public.name, "not_before": "2020-01-01T00:00:00Z",
                "not_after": "2099-01-01T00:00:00Z", "revoked": False,
                "organization_id": "source-archive-org", "authority_class": "source-archive"}],
            "revoked_record_ids": []}), encoding="utf-8")
        store = runtime.TrustStore.load(store_path)
        policy = {"schema_version": "1.0", "policy_id": "external-source-policy", "tenant_id": tenant_id,
            "external_store_id": store.store_id, "external_store_sha256": store.digest,
            "authority_organization_id": "source-archive-org", "authority_class": "source-archive",
            "purposes": ["source-provenance"], "issued_at": "2020-01-01T00:00:00Z",
            "expires_at": "2099-01-01T00:00:00Z", "revoked": False}
        policy_path = directory / "policy.json"
        policy_path.write_text(json.dumps(policy), encoding="utf-8")
        approval = self.sign("external-trust-approver", {"policy_id": policy["policy_id"],
            "tenant_id": tenant_id, "policy_sha256": runtime.canonical_digest(policy),
            "external_store_sha256": store.digest, "purpose": "source-provenance"},
            "external-source-policy")
        return store_path, policy_path, approval

    def provider_receipt(self, cutover: dict, target_state: str, operation: str, token: str,
                         *, provider: dict | None = None, effect_state: str = "SUCCEEDED") -> dict:
        native = self.root / f"native-provider-{token}.json"
        native.write_text(json.dumps({"state": effect_state, "operation": operation}), encoding="utf-8")
        native_ref = {"path": str(native), "sha256": production_closure.digest_bytes(native.read_bytes()),
                      "bytes": native.stat().st_size}
        effective_provider = provider or cutover["provider"]
        wrapper = {"schema_version": "2.0" if effective_provider.get("profile_version") == "2.0" else "1.0",
            "receipt_id": f"receipt-{token}",
            "cutover_id": cutover["cutover_id"], "tenant_id": cutover["tenant_id"],
            "target_key": cutover["target_key"], "target_state": target_state,
            "provider": effective_provider, "operation": operation,
            "adapter_receipt": native_ref, "effect_state": effect_state,
            "request_sha256": production_closure.digest_bytes(f"request-{token}".encode()),
            "issued_at": production_closure.now_text()}
        if effective_provider.get("profile_version") == "2.0":
            control_bytes = {"identity": b"fixture-identity-binding", "least_privilege": b"fixture-least-privilege-policy",
                             "state_backend": b"fixture-state-backend", "rollback": b"fixture-rollback-plan"}
            controls = {}
            for name, content in control_bytes.items():
                control_path = self.root / f"provider-control-{name}-{token}.json"
                control_path.write_bytes(content)
                controls[name] = {"path": str(control_path),
                    "sha256": production_closure.digest_bytes(content), "bytes": len(content)}
            wrapper.update({"control_evidence": controls,
                            "control_decisions": {name: "PASS" for name in control_bytes}})
        path = self.root / f"provider-wrapper-{token}.json"
        path.write_text(json.dumps(wrapper), encoding="utf-8")
        return {"path": str(path), "sha256": production_closure.digest_bytes(path.read_bytes()),
                "bytes": path.stat().st_size}

    @staticmethod
    def exact_provider_profile(account: bytes) -> dict:
        return {"profile_version": "2.0", "provider_id": "fixture-cloud", "provider_api_version": "2026-01-01",
            "account_binding_sha256": production_closure.digest_bytes(account), "account_model": "isolated-test-account",
            "region": "test-region-1", "adapter_id": "fixture-provider", "adapter_version": "1.0.0",
            "iac_tool": "fixture-iac", "iac_tool_version": "1.0.0",
            "state_backend_sha256": production_closure.digest_bytes(b"fixture-state-backend"),
            "identity_binding_sha256": production_closure.digest_bytes(b"fixture-identity-binding"),
            "least_privilege_policy_sha256": production_closure.digest_bytes(b"fixture-least-privilege-policy"),
            "rollback_plan_sha256": production_closure.digest_bytes(b"fixture-rollback-plan"),
            "precheck_operation": "inspect", "execute_operation": "apply",
            "verify_operation": "inspect", "rollback_operation": "undo"}

    def domain_result(self, claim: object, corpus: str, *, independent: bool | None = None,
                      tool: str = "fixture-native-tool", corpus_digest: str | None = None) -> Path:
        policy = domain_handlers.POLICIES[claim.batch]
        if independent is None:
            independent = corpus in {"holdout", "representative", "production"}
        toolchain = []
        raw_evidence = []
        for index, capability in enumerate(policy.capabilities):
            role = domain_handlers.evidence_role(policy, capability)
            raw = self.root / f"raw-b{claim.batch:02d}-{claim.claim_type}-{claim.claim_index}-{corpus}-{capability}.log"
            raw.write_text(f"native bytes for {claim.oracle_id} {corpus} {capability}\n", encoding="utf-8")
            raw_bytes = raw.read_bytes()
            toolchain.append({"name": tool if tool != "fixture-native-tool" else f"fixture-native-tool-{index + 1}",
                              "version": "1.0.0", "argv_sha256": runtime.canonical_digest([policy.operation, capability]),
                              "exit_code": 0, "evidence_role": role})
            raw_evidence.append({"path": str(raw), "sha256": runtime.digest_bytes(raw_bytes),
                                 "bytes": len(raw_bytes), "role": role})
        skill_contract = skill_handlers.contract_for_skill(claim.skill)
        skill_role = skill_handlers.evidence_role(claim.skill)
        skill_raw = self.root / f"raw-skill-{skill_contract['handler_id']}-{claim.claim_type}-{claim.claim_index}-{corpus}.log"
        skill_raw.write_text(f"native Skill bytes for {claim.oracle_id} {corpus}\n", encoding="utf-8")
        skill_bytes = skill_raw.read_bytes()
        toolchain.append({"name": tool if tool != "fixture-native-tool" else "fixture-native-skill-tool",
                          "version": "1.0.0", "argv_sha256": runtime.canonical_digest([claim.skill, claim.claim_type, claim.claim_index]),
                          "exit_code": 0, "evidence_role": skill_role})
        raw_evidence.append({"path": str(skill_raw), "sha256": runtime.digest_bytes(skill_bytes),
                             "bytes": len(skill_bytes), "role": skill_role})
        assertions = [{"name": f"{claim.oracle_id}:operation:{policy.operation}", "outcome": "PASS",
                       "detail": "Batch-specific operation completed against byte-bound evidence"}]
        assertions.extend({"name": f"{claim.oracle_id}:capability:{capability}", "outcome": "PASS",
                           "detail": "Capability contract passed"} for capability in policy.capabilities)
        assertions.extend({"name": f"{claim.oracle_id}:safety:{control}", "outcome": "PASS",
                           "detail": "Safety control remained enforced"} for control in policy.safety_controls)
        assertions.extend([
            {"name": f"{claim.oracle_id}:skill-handler:{skill_contract['handler_id']}", "outcome": "PASS", "detail": "exact handler executed"},
            {"name": f"{claim.oracle_id}:skill-source:{skill_contract['source_sha256']}", "outcome": "PASS", "detail": "source digest matched"},
            {"name": f"{claim.oracle_id}:skill-operation:{claim.skill}", "outcome": "PASS", "detail": "Skill operation executed"},
            {"name": f"{claim.oracle_id}:skill-claim:{claim.claim_type}:{claim.claim_index}", "outcome": "PASS", "detail": "Claim executed"},
            {"name": f"{claim.oracle_id}:skill-effect:{skill_contract['effect_class']}", "outcome": "PASS", "detail": "effect policy enforced"},
        ])
        payload = {
            "schema_version": "1.0", "batch": claim.batch, "skill": claim.skill, "executor_id": claim.executor_id,
            "claim": {"type": claim.claim_type, "index": claim.claim_index, "sha256": claim.sha256},
            "corpus": {"role": corpus, "id": f"corpus-{corpus}", "sha256": corpus_digest or runtime.canonical_digest(f"corpus-{corpus}"),
                       "independent": independent},
            "source_fingerprint": runtime.metadata(self.workspace)["source_fingerprint"],
            "environment": {"id": f"environment-{corpus}", "kind": "production" if corpus == "production" else ("holdout" if corpus == "holdout" else "clean"),
                            "digest": runtime.canonical_digest(f"environment-{corpus}")},
            "domain_contract": domain_handlers.contract_for_batch(claim.batch),
            "skill_contract": skill_contract,
            "toolchain": toolchain,
            "assertions": assertions,
            "raw_evidence": raw_evidence,
            "decision": "PASS", "limitations": [],
        }
        path = self.root / f"domain-{claim.claim_type}-{claim.claim_index}-{corpus}.json"
        path.write_text(json.dumps(payload), encoding="utf-8")
        return path

    def envelope(self, claim: object, corpus: str, token: str = "default", corpus_digest: str | None = None) -> Path:
        subject = runtime.materialize_domain_result(self.domain_result(claim, corpus, corpus_digest=corpus_digest), (self.root.resolve(),))
        subject_path = self.root / f"subject-{claim.claim_type}-{claim.claim_index}-{corpus}-{token}.json"
        subject_path.write_bytes(runtime.canonical_bytes(subject))
        subject_bytes = subject_path.read_bytes()
        producer, role, _ = self.actors_for(corpus)
        bindings = {"batch": claim.batch, "skill": claim.skill, "claim_type": claim.claim_type, "claim_index": claim.claim_index,
                    "claim_sha256": claim.sha256, "subject_sha256": runtime.digest_bytes(subject_bytes),
                    "source_fingerprint": runtime.metadata(self.workspace)["source_fingerprint"], "corpus_role": corpus,
                    "outcome": "PASS", "oracle_id": claim.oracle_id}
        payload = {"schema_version": "1.0", "batch": claim.batch, "skill": claim.skill,
                   "claim": {"type": claim.claim_type, "index": claim.claim_index, "sha256": claim.sha256},
                   "corpus_role": corpus, "producer": {"id": producer, "role": role},
                   "environment": {"id": f"environment-{corpus}", "digest": runtime.canonical_digest(f"environment-{corpus}")},
                   "subject": {"type": "claim-oracle-result", "path": str(subject_path),
                               "sha256": runtime.digest_bytes(subject_bytes), "bytes": len(subject_bytes)},
                   "assurance": {"executor_attestation": self.sign(producer, {**bindings, "actor_id": producer}, f"executor-{token}-{claim.claim_type}-{claim.claim_index}-{corpus}"),
                                 "oracle_attestation": self.sign("oracle-owner", bindings, f"oracle-{token}-{claim.claim_type}-{claim.claim_index}-{corpus}")}}
        path = self.root / f"envelope-{claim.claim_type}-{claim.claim_index}-{corpus}-{token}.json"
        path.write_text(json.dumps(payload), encoding="utf-8")
        return path

    def record_and_verify(self, claim: object, corpus: str, token: str = "default", corpus_digest: str | None = None) -> dict:
        evidence = runtime.record_evidence(self.workspace, self.envelope(claim, corpus, token, corpus_digest), (self.root.resolve(),))
        _, _, verifier = self.actors_for(corpus)
        attestation = self.sign(verifier, {"actor_id": verifier, "evidence_id": evidence["evidence_id"],
                                           "evidence_sha256": evidence["record_sha256"], "outcome": "PASS",
                                           "corpus_role": corpus}, f"verifier-{token}-{claim.claim_type}-{claim.claim_index}-{corpus}")
        path = self.root / f"verifier-{claim.claim_type}-{claim.claim_index}-{corpus}-{token}.json"
        path.write_text(json.dumps(attestation), encoding="utf-8")
        runtime.verify_evidence(self.workspace, evidence["evidence_id"], "PASS", path, (self.root.resolve(),))
        return evidence

    def adapter_registry(self) -> Path:
        executable = Path("/bin/echo").resolve(strict=True)
        executable_bytes = provider_runtime.read_bounded(executable, 1024 * 1024 * 1024, "fixture adapter")
        source_fingerprint = runtime.metadata(self.workspace)["source_fingerprint"]
        adapters = [{
            "adapter_id": "fixture-provider", "capability": "provider-probe",
            "executable": str(executable), "executable_sha256": provider_runtime.digest_bytes(executable_bytes),
            "version": "fixture-1.0", "environment_allowlist": [],
            "operations": [{
                "name": "inspect", "argv": ["provider-probe"],
                "parameters": [{"name": "target", "flag": "--target", "type": "identifier", "required": True}],
                "timeout_seconds": 10, "effect_class": "read-only", "compensation_operation": None,
            }, {
                "name": "apply", "argv": ["provider-apply"],
                "parameters": [{"name": "target", "flag": "--target", "type": "identifier", "required": True}],
                "timeout_seconds": 10, "effect_class": "reversible", "compensation_operation": "undo",
            }, {
                "name": "undo", "argv": ["provider-undo"],
                "parameters": [{"name": "target", "flag": "--target", "type": "identifier", "required": True}],
                "timeout_seconds": 10, "effect_class": "approval-required", "compensation_operation": None,
            }],
        }]
        payload = {"actor_id": "adapter-admin", "record_id": "adapter-registry-record",
                   "issued_at": "2020-01-01T00:00:00Z", "expires_at": "2099-01-01T00:00:00Z",
                   "schema_version": "1.0", "registry_id": "fixture-registry",
                   "source_fingerprint": source_fingerprint, "adapters": adapters}
        path = self.root / "adapter-registry.json"
        path.write_text(json.dumps(self.sign("adapter-admin", {
            "schema_version": "1.0", "registry_id": "fixture-registry",
            "source_fingerprint": source_fingerprint, "adapters": adapters,
        }, "adapter-registry")), encoding="utf-8")
        return path

    def test_registry_covers_788_skills_8149_claims_and_44_executors(self) -> None:
        registry = runtime.Registry.load()
        self.assertEqual(788, len(registry.by_skill))
        self.assertEqual(8149, len(registry.by_claim))
        self.assertEqual(list(range(1, 45)), sorted(registry.executors))
        self.assertEqual(44, len({entry["handler"] for entry in registry.executors.values()}))
        self.assertEqual(set(entry["handler"] for entry in registry.executors.values()), set(domain_handlers.HANDLERS))
        self.assertEqual(44, len({id(handler) for handler in domain_handlers.HANDLERS.values()}))
        self.assertEqual(788, len(skill_handlers.policies()))
        self.assertEqual(788, len(skill_handlers.handlers()))
        self.assertEqual(788, len({id(handler) for handler in skill_handlers.handlers().values()}))

    def test_signed_provider_adapter_is_idempotent_and_digest_bound(self) -> None:
        request = {
            "schema_version": "1.0", "skill": self.skill, "adapter_id": "fixture-provider",
            "operation": "inspect", "parameters": {"target": "fixture-target"},
            "idempotency_key": "fixture-idempotency", "fencing_token": 1,
            "source_fingerprint": runtime.metadata(self.workspace)["source_fingerprint"],
            "approval": None, "compensates_request_sha256": None,
        }
        request_path = self.root / "provider-request.json"
        request_path.write_text(json.dumps(request), encoding="utf-8")
        first = provider_runtime.execute(self.workspace, request_path, self.adapter_registry(), self.trust_store, (self.root.resolve(),))
        second = provider_runtime.execute(self.workspace, request_path, self.adapter_registry(), self.trust_store, (self.root.resolve(),))
        self.assertEqual("SUCCEEDED", first["state"])
        self.assertFalse(first["idempotent_replay"])
        self.assertTrue(second["idempotent_replay"])
        self.assertEqual(first["request_sha256"], second["request_sha256"])
        self.assertEqual([], provider_runtime.ProviderStore(self.workspace).verify_event_chain())
        request["parameters"]["target"] = "different-target"
        request_path.write_text(json.dumps(request), encoding="utf-8")
        with self.assertRaisesRegex(provider_runtime.ProviderRuntimeError, "different request"):
            provider_runtime.execute(self.workspace, request_path, self.adapter_registry(), self.trust_store, (self.root.resolve(),))
        request["parameters"]["target"] = "fixture-target"
        request["idempotency_key"] = "new-idempotency"
        request_path.write_text(json.dumps(request), encoding="utf-8")
        with self.assertRaisesRegex(provider_runtime.ProviderRuntimeError, "fencing token must be greater"):
            provider_runtime.execute(self.workspace, request_path, self.adapter_registry(), self.trust_store, (self.root.resolve(),))

    def test_mutating_provider_operation_requires_and_atomically_records_compensation(self) -> None:
        source_fingerprint = runtime.metadata(self.workspace)["source_fingerprint"]
        registry_path = self.adapter_registry()
        trust = provider_runtime.skill_runtime.TrustStore.load(self.trust_store)
        registry = provider_runtime.AdapterRegistry.load(registry_path, trust, source_fingerprint)
        skill_contract = skill_handlers.contract_for_skill(self.skill)

        def signed_request(operation: str, key: str, fencing: int, compensates: str | None) -> dict:
            parameters = {"target": "fixture-target"}
            effect = registry.adapters["fixture-provider"].operations[operation].effect_class
            identity = {
                "skill": self.skill, "skill_handler_id": skill_contract["handler_id"], "adapter_id": "fixture-provider",
                "adapter_registry_sha256": registry.registry_sha256, "operation": operation,
                "parameters_sha256": provider_runtime.digest(parameters), "idempotency_key": key,
                "fencing_token": fencing, "source_fingerprint": source_fingerprint, "effect_class": effect,
                "compensates_request_sha256": compensates,
            }
            request_sha256 = provider_runtime.digest(identity)
            approval = self.sign("approver", {"request_sha256": request_sha256, "adapter_id": "fixture-provider",
                                                "operation": operation, "source_fingerprint": source_fingerprint,
                                                "effect_class": effect}, f"approval-{operation}")
            return {"schema_version": "1.0", "skill": self.skill, "adapter_id": "fixture-provider",
                    "operation": operation, "parameters": parameters, "idempotency_key": key,
                    "fencing_token": fencing, "source_fingerprint": source_fingerprint, "approval": approval,
                    "compensates_request_sha256": compensates}

        request_path = self.root / "mutating-provider-request.json"
        apply_request = signed_request("apply", "apply-idempotency", 1, None)
        request_path.write_text(json.dumps(apply_request), encoding="utf-8")
        applied = provider_runtime.execute(self.workspace, request_path, registry_path, self.trust_store, (self.root.resolve(),))
        self.assertEqual("SUCCEEDED", applied["state"])
        undo_request = signed_request("undo", "undo-idempotency", 2, applied["request_sha256"])
        request_path.write_text(json.dumps(undo_request), encoding="utf-8")
        undone = provider_runtime.execute(self.workspace, request_path, registry_path, self.trust_store, (self.root.resolve(),))
        self.assertEqual("SUCCEEDED", undone["state"])
        original = provider_runtime.ProviderStore(self.workspace).execution(applied["request_sha256"])
        self.assertEqual("COMPENSATED", original["state"])
        self.assertEqual(undone["request_sha256"], original["receipt"]["compensation_request_sha256"])

    def test_all_44_domain_handlers_execute_their_exact_contract(self) -> None:
        registry = runtime.Registry.load()
        claims_by_batch = {claim.batch: claim for claim in registry.by_claim.values()}
        for batch in range(1, 45):
            claim = claims_by_batch[batch]
            subject = runtime.materialize_domain_result(
                self.domain_result(claim, claim.corpora[0]), (self.root.resolve(),)
            )
            self.assertEqual("PASS", subject["decision"])
            self.assertTrue(any(check["name"] == f"domain-handler:{domain_handlers.POLICIES[batch].handler}"
                                for check in subject["checks"]))

    def test_cross_batch_domain_contract_substitution_is_rejected(self) -> None:
        registry = runtime.Registry.load()
        claim = next(item for item in registry.by_claim.values() if item.batch == 31)
        path = self.domain_result(claim, claim.corpora[0])
        payload = json.loads(path.read_text(encoding="utf-8"))
        payload["domain_contract"] = domain_handlers.contract_for_batch(33)
        path.write_text(json.dumps(payload), encoding="utf-8")
        with self.assertRaisesRegex(runtime.RuntimeFailure, "does not match handler"):
            runtime.materialize_domain_result(path, (self.root.resolve(),))

    def test_cross_skill_contract_substitution_is_rejected(self) -> None:
        registry = runtime.Registry.load()
        claim = registry.by_skill[self.skill][0]
        other = next(skill for skill in registry.by_skill if skill != self.skill)
        path = self.domain_result(claim, claim.corpora[0])
        payload = json.loads(path.read_text(encoding="utf-8"))
        payload["skill_contract"] = skill_handlers.contract_for_skill(other)
        path.write_text(json.dumps(payload), encoding="utf-8")
        with self.assertRaisesRegex(runtime.RuntimeFailure, "Skill contract does not match handler"):
            runtime.materialize_domain_result(path, (self.root.resolve(),))

    def test_generic_noop_is_not_a_domain_executor(self) -> None:
        claim = runtime.Registry.load().by_skill[self.skill][0]
        with self.assertRaisesRegex(runtime.RuntimeFailure, "generic/no-op"):
            runtime.materialize_domain_result(self.domain_result(claim, claim.corpora[0], tool="/usr/bin/true"), (self.root.resolve(),))

    def test_holdout_must_be_independently_owned(self) -> None:
        claim = next(item for item in runtime.Registry.load().by_skill[self.skill] if "holdout" in item.corpora)
        with self.assertRaisesRegex(runtime.RuntimeFailure, "independently owned"):
            runtime.materialize_domain_result(self.domain_result(claim, "holdout", independent=False), (self.root.resolve(),))

    def test_holdout_corpus_bytes_cannot_reuse_development_digest(self) -> None:
        claim = next(item for item in runtime.Registry.load().by_skill[self.skill]
                     if {"development", "holdout"}.issubset(item.corpora))
        shared = runtime.canonical_digest("same-corpus-bytes")
        self.record_and_verify(claim, "development", "shared-development", shared)
        self.record_and_verify(claim, "holdout", "shared-holdout", shared)
        result = runtime.gate(self.workspace, self.skill)
        self.assertTrue(any("Holdout corpus digest is reused" in finding for finding in result["findings"]))

    def test_revoked_actor_identity_cannot_be_redeclared_with_an_active_key(self) -> None:
        payload = json.loads(self.trust_store.read_text(encoding="utf-8"))
        duplicate = dict(payload["actors"][0])
        payload["actors"][0]["revoked"] = True
        duplicate["key_id"] = "replacement-key-for-same-actor"
        payload["actors"].append(duplicate)
        path = self.actors / "duplicate-actor-trust-store.json"
        path.write_text(json.dumps(payload), encoding="utf-8")
        with self.assertRaisesRegex(runtime.RuntimeFailure, "identity/roles are invalid"):
            runtime.TrustStore.load(path)

    def test_signed_local_claims_prepare_external_gate_and_production_never_certifies(self) -> None:
        self.assertEqual("NOT_RUN", runtime.gate(self.workspace, self.skill)["decision"])
        claims = runtime.Registry.load().by_skill[self.skill]
        for claim in claims:
            if claim.claim_type != "external":
                for corpus in claim.corpora:
                    self.record_and_verify(claim, corpus)
        self.assertEqual("READY_FOR_EXTERNAL_GATE", runtime.gate(self.workspace, self.skill)["decision"])
        external = next(claim for claim in claims if claim.claim_type == "external")
        self.record_and_verify(external, "production")
        decision = runtime.gate(self.workspace, self.skill)
        self.assertEqual("READY_FOR_HUMAN_DECISION", decision["decision"])
        self.assertFalse(decision["certified"])

    def test_concurrent_duplicate_record_is_idempotent_and_event_chain_is_linear(self) -> None:
        claim = runtime.Registry.load().by_skill[self.skill][0]
        envelope = self.envelope(claim, claim.corpora[0], "concurrent")
        with ThreadPoolExecutor(max_workers=12) as pool:
            records = list(pool.map(lambda _: runtime.record_evidence(self.workspace, envelope, (self.root.resolve(),)), range(32)))
        self.assertEqual(1, len({record["evidence_id"] for record in records}))
        connection = runtime.connect(self.workspace)
        try:
            self.assertEqual(1, connection.execute("SELECT count(*) FROM evidence").fetchone()[0])
        finally:
            connection.close()
        self.assertEqual([], runtime.verify_event_chain(self.workspace))

    def test_transaction_rolls_back_when_event_append_fails(self) -> None:
        claim = runtime.Registry.load().by_skill[self.skill][0]
        envelope = self.envelope(claim, claim.corpora[0], "rollback")
        with mock.patch.object(runtime, "append_event", side_effect=RuntimeError("injected event failure")):
            with self.assertRaisesRegex(RuntimeError, "injected event failure"):
                runtime.record_evidence(self.workspace, envelope, (self.root.resolve(),))
        connection = runtime.connect(self.workspace)
        try:
            self.assertEqual(0, connection.execute("SELECT count(*) FROM evidence").fetchone()[0])
        finally:
            connection.close()
        self.assertEqual([], runtime.verify_event_chain(self.workspace))

    def test_source_drift_blocks_evidence_recording(self) -> None:
        claim = runtime.Registry.load().by_skill[self.skill][0]
        envelope = self.envelope(claim, claim.corpora[0], "drift")
        (self.source / "Main.java").write_text("final class Main { int changed; }\n", encoding="utf-8")
        with self.assertRaisesRegex(runtime.RuntimeFailure, "source changed"):
            runtime.record_evidence(self.workspace, envelope, (self.root.resolve(),))

    def test_customer_provider_cutover_soak_and_external_assessment_close_at_local_ceiling(self) -> None:
        snapshot_data = self.root / "customer-snapshot.bin"
        snapshot_data.write_bytes(b"masked customer fixture")
        snapshot_manifest = {"schema_version": "1.0", "snapshot_id": "snapshot-001", "tenant_id": "tenant-001",
            "environment_class": "test", "classification": "synthetic", "purpose": "migration-validation", "read_only": True,
            "files": [{"path": str(snapshot_data), "sha256": production_closure.digest_bytes(snapshot_data.read_bytes()),
                       "bytes": snapshot_data.stat().st_size}]}
        snapshot_path = self.root / "snapshot.json"
        snapshot_path.write_text(json.dumps(snapshot_manifest), encoding="utf-8")
        snapshot_auth = self.sign("data-owner", {"snapshot_id": "snapshot-001", "tenant_id": "tenant-001",
            "manifest_sha256": production_closure.digest(snapshot_manifest), "environment_class": "test",
            "purpose": "migration-validation"}, "snapshot")
        snapshot = production_closure.register_snapshot(
            self.workspace, snapshot_path, snapshot_auth, self.trust_store, (self.root.resolve(),))
        self.assertEqual("metadata-and-content-digests-only", snapshot["data_minimization"])
        self.assertNotIn(str(snapshot_data), json.dumps(snapshot))

        holdout_data = self.root / "holdout.bin"
        holdout_data.write_bytes(b"sealed untouched holdout")
        holdout_manifest = {"schema_version": "1.0", "holdout_id": "holdout-001", "tenant_id": "tenant-001",
            "environment_class": "test", "corpus": {"path": str(holdout_data),
                "sha256": production_closure.digest_bytes(holdout_data.read_bytes()), "bytes": holdout_data.stat().st_size},
            "development_corpus_sha256": production_closure.digest_bytes(b"development"),
            "transformation_author_ids": ["transformation-author"], "executor_ids": ["executor-holdout"],
            "verifier_ids": ["verifier-holdout"]}
        holdout_path = self.root / "holdout.json"
        holdout_path.write_text(json.dumps(holdout_manifest), encoding="utf-8")
        holdout_auth = self.sign("holdout-custodian", {"holdout_id": "holdout-001", "tenant_id": "tenant-001",
            "manifest_sha256": production_closure.digest(holdout_manifest),
            "corpus_sha256": holdout_manifest["corpus"]["sha256"], "environment_class": "test"}, "holdout")
        holdout = production_closure.register_holdout(
            self.workspace, holdout_path, holdout_auth, self.trust_store, (self.root.resolve(),))
        self.assertTrue(holdout["sealed"])

        execution = self.root / "holdout-execution.json"
        execution.write_text(json.dumps({"state": "SUCCEEDED"}), encoding="utf-8")
        claim = self.root / "holdout-claim.json"
        claim.write_text(json.dumps({"claim": "route-equivalence", "outcome": "PASS"}), encoding="utf-8")
        holdout_result = {"schema_version": "1.0", "result_id": "holdout-result-001",
            "holdout_id": "holdout-001", "tenant_id": "tenant-001",
            "target_release_sha256": production_closure.digest_bytes(b"release"),
            "provider_account_sha256": production_closure.digest_bytes(b"sandbox-account"),
            "execution_receipt": {"path": str(execution),
                "sha256": production_closure.digest_bytes(execution.read_bytes()), "bytes": execution.stat().st_size},
            "decision": "PASS", "claim_results": [{"claim_id": "route-equivalence", "outcome": "PASS",
                "evidence": {"path": str(claim), "sha256": production_closure.digest_bytes(claim.read_bytes()),
                             "bytes": claim.stat().st_size}}],
            "started_at": "2026-01-01T00:00:00Z", "finished_at": "2026-01-01T00:00:01Z"}
        holdout_result_path = self.root / "holdout-result.json"
        holdout_result_path.write_text(json.dumps(holdout_result), encoding="utf-8")
        bad_holdout_path = self.root / "holdout-result-mismatched.json"
        bad_holdout_path.write_text(json.dumps({**holdout_result, "decision": "FAIL"}), encoding="utf-8")
        with self.assertRaisesRegex(production_closure.ClosureFailure, "differs from claim outcomes"):
            production_closure.record_holdout_result(self.workspace, bad_holdout_path, {}, {}, self.trust_store,
                                                     (self.root.resolve(),))
        normalized = [{"claim_id": "route-equivalence", "outcome": "PASS",
            "evidence": {"sha256": holdout_result["claim_results"][0]["evidence"]["sha256"],
                         "bytes": claim.stat().st_size}}]
        holdout_root = production_closure.digest({"holdout_corpus_sha256": holdout["corpus"]["sha256"],
            "execution_receipt_sha256": holdout_result["execution_receipt"]["sha256"],
            "claim_results": normalized})
        result_bindings = {"result_id": "holdout-result-001", "holdout_id": "holdout-001",
            "tenant_id": "tenant-001", "manifest_sha256": production_closure.digest(holdout_result),
            "evidence_root": holdout_root, "target_release_sha256": holdout_result["target_release_sha256"],
            "provider_account_sha256": holdout_result["provider_account_sha256"], "decision": "PASS"}
        executor_auth = self.sign("executor-holdout", result_bindings, "holdout-result-executor")
        verifier_auth = self.sign("verifier-holdout", {**result_bindings, "executor_id": "executor-holdout"},
                                  "holdout-result-verifier")
        recorded = production_closure.record_holdout_result(self.workspace, holdout_result_path,
            executor_auth, verifier_auth, self.trust_store, (self.root.resolve(),))
        self.assertTrue(recorded["independent"])

        plan = {"schema_version": "1.0", "cutover_id": "cutover-001", "tenant_id": "tenant-001",
            "snapshot_id": "snapshot-001", "target_key": "sandbox-target",
            "target_release_sha256": production_closure.digest_bytes(b"release"),
            "rollback_adapter_id": "fixture-provider", "rollback_operation": "undo",
            "preconditions": ["reconciled", "rollback-ready"]}
        plan_path = self.root / "cutover.json"
        plan_path.write_text(json.dumps(plan), encoding="utf-8")
        plan_auth = self.sign("approver", {"cutover_id": "cutover-001", "tenant_id": "tenant-001",
            "plan_sha256": production_closure.digest(plan), "snapshot_id": "snapshot-001",
            "target_key": "sandbox-target"}, "cutover-plan")
        production_closure.plan_cutover(self.workspace, plan_path, plan_auth, self.trust_store, (self.root.resolve(),))
        transitions = (("PLANNED", "PRECHECKED", "operations-owner"), ("PRECHECKED", "APPROVED", "approver"),
                       ("APPROVED", "EXECUTING", "operations-owner"), ("EXECUTING", "VERIFYING", "verifier-production"),
                       ("VERIFYING", "SUCCEEDED", "verifier-production"))
        for fencing, (source_state, target_state, actor) in enumerate(transitions, 1):
            receipt_path = self.root / f"receipt-{target_state}.json"
            receipt_path.write_text(json.dumps({"state": target_state, "fencing": fencing}), encoding="utf-8")
            receipt = {"path": str(receipt_path), "sha256": production_closure.digest_bytes(receipt_path.read_bytes()),
                       "bytes": receipt_path.stat().st_size}
            attestation = self.sign(actor, {"cutover_id": "cutover-001", "tenant_id": "tenant-001",
                "expected_state": source_state, "target_state": target_state, "fencing_token": fencing,
                "receipt_sha256": receipt["sha256"]}, f"cutover-{target_state}")
            cutover = production_closure.transition_cutover(self.workspace, "cutover-001", source_state, target_state,
                fencing, receipt, attestation, self.trust_store, (self.root.resolve(),))
        self.assertEqual("SUCCEEDED", cutover["state"])

        production_closure.start_soak(self.workspace, "cutover-001", "soak-001", "test",
                                      "2026-01-01T00:00:00Z", 60, 40)
        for sequence, observed_at in ((1, "2026-01-01T00:00:30Z"), (2, "2026-01-01T00:01:00Z")):
            metrics = {"requests": 100, "errors": 0, "critical_failures": 0, "availability": 1.0}
            heartbeat = self.sign("operations-owner", {"run_id": "soak-001", "sequence": sequence,
                "observed_at": observed_at, "metrics_sha256": production_closure.digest(metrics)}, f"heartbeat-{sequence}")
            production_closure.observe_soak(self.workspace, "soak-001", sequence, observed_at, metrics,
                                            heartbeat, self.trust_store)
        running = production_closure.Store(self.workspace).get("soak", "soak-001")
        evidence_root = production_closure.soak_evidence_root(running)
        finish = self.sign("verifier-production", {"run_id": "soak-001", "sequence": 3,
            "observed_at": "2026-01-01T00:01:01Z", "target_state": "PASSED", "evidence_root": evidence_root},
            "soak-finish")
        soak = production_closure.finish_soak(self.workspace, "soak-001", 3, "2026-01-01T00:01:01Z",
                                              finish, self.trust_store)
        self.assertEqual("engineering-only", soak["evidence_class"])

        report = {"schema_version": "1.0", "assessment_id": "assessment-001", "tenant_id": "tenant-001",
            "scope": "fixture-only", "decision": "NOT_CERTIFIED", "evidence_root": soak["evidence_root"],
            "limitations": ["synthetic fixture"], "issued_at": "2026-01-01T00:00:00Z",
            "expires_at": "2099-01-01T00:00:00Z"}
        report_path = self.root / "assessment.json"
        report_path.write_text(json.dumps(report), encoding="utf-8")
        unbound = {**report, "assessment_id": "assessment-unbound",
                   "evidence_root": production_closure.digest_bytes(b"unbound-evidence")}
        unbound_path = self.root / "assessment-unbound.json"
        unbound_path.write_text(json.dumps(unbound), encoding="utf-8")
        unbound_auth = self.sign("independent-certifier", {"assessment_id": "assessment-unbound",
            "tenant_id": "tenant-001", "report_sha256": production_closure.digest(unbound),
            "evidence_root": unbound["evidence_root"], "decision": "NOT_CERTIFIED"}, "assessment-unbound")
        with self.assertRaisesRegex(production_closure.ClosureFailure, "not a PASSED tenant soak"):
            production_closure.import_assessment(
                self.workspace, unbound_path, unbound_auth, self.trust_store, (self.root.resolve(),))
        report_auth = self.sign("independent-certifier", {"assessment_id": "assessment-001", "tenant_id": "tenant-001",
            "report_sha256": production_closure.digest(report), "evidence_root": soak["evidence_root"],
            "decision": "NOT_CERTIFIED"}, "assessment")
        imported = production_closure.import_assessment(
            self.workspace, report_path, report_auth, self.trust_store, (self.root.resolve(),))
        self.assertFalse(imported["certified"])
        readiness = production_closure.readiness(self.workspace, "tenant-001")
        self.assertEqual("LOCAL_TOOLKIT_PASS", readiness["decision"])
        self.assertEqual("NOT_CERTIFIED", readiness["production_status"])
        self.assertEqual([], readiness["findings"])
        self.assertEqual("soak-001", readiness["selected_chain"]["run_id"])

        # Keep failed history in the immutable event chain, but select the one
        # coherent current evidence chain instead of aggregating incompatible attempts.
        historical_cutover = {"schema_version": "1.0", "cutover_id": "cutover-historical",
            "tenant_id": "tenant-001", "snapshot_id": "snapshot-001", "target_key": "old-target",
            "target_release_sha256": production_closure.digest_bytes(b"old-release"),
            "state": "CANCELLED", "version": 0, "fencing_token": 1,
            "approval": {"actor_id": "approver"}, "transitions": []}
        store = production_closure.Store(self.workspace)
        store.create("cutover", "cutover-historical", "tenant-001", "test", "CANCELLED",
                     historical_cutover, "CUTOVER_CANCELLED")
        historical_soak = {"schema_version": "1.0", "run_id": "soak-historical",
            "cutover_id": "cutover-historical", "tenant_id": "tenant-001",
            "environment_class": "test", "state": "FAILED", "version": 0,
            "started_at": "2025-01-01T00:00:00Z", "required_seconds": 60, "max_gap_seconds": 40,
            "last_sequence": 0, "last_observed_at": "2025-01-01T00:01:00Z", "observations": [],
            "critical_failures": 1, "clock_mode": "system", "evidence_class": "engineering-only",
            "real_seven_day_elapsed": False}
        store.create("soak", "soak-historical", "tenant-001", "test", "FAILED",
                     historical_soak, "SOAK_FAILED")
        readiness_with_history = production_closure.readiness(self.workspace, "tenant-001")
        self.assertEqual("LOCAL_TOOLKIT_PASS", readiness_with_history["decision"])
        self.assertEqual("soak-001", readiness_with_history["selected_chain"]["run_id"])
        self.assertEqual(2, readiness_with_history["evaluated_chains"])
        self.assertEqual(1, readiness_with_history["ignored_historical_chains"])
        self.assertEqual([], readiness_with_history["findings"])

    def test_production_closure_rejects_holdout_reuse_and_short_production_soak(self) -> None:
        corpus = self.root / "shared.bin"
        corpus.write_bytes(b"shared")
        corpus_sha = production_closure.digest_bytes(corpus.read_bytes())
        value = {"schema_version": "1.0", "holdout_id": "holdout-shared", "tenant_id": "tenant-001",
            "environment_class": "test", "corpus": {"path": str(corpus), "sha256": corpus_sha, "bytes": 6},
            "development_corpus_sha256": corpus_sha, "transformation_author_ids": ["author"],
            "executor_ids": ["executor"], "verifier_ids": ["verifier"]}
        path = self.root / "shared-holdout.json"
        path.write_text(json.dumps(value), encoding="utf-8")
        with self.assertRaisesRegex(production_closure.ClosureFailure, "reuses development"):
            production_closure.register_holdout(self.workspace, path, {}, self.trust_store, (self.root.resolve(),))
        store = production_closure.Store(self.workspace)
        cutover = {"cutover_id": "completed-cutover", "tenant_id": "tenant-001", "state": "SUCCEEDED"}
        store.create("cutover", "completed-cutover", "tenant-001", "production", "SUCCEEDED", cutover, "CUTOVER_SUCCEEDED")
        with self.assertRaisesRegex(production_closure.ClosureFailure, "at least seven days"):
            production_closure.start_soak(self.workspace, "completed-cutover", "short-soak", "production",
                                          "2026-01-01T00:00:00Z", 60, 30)
        soak = {"schema_version": "1.0", "run_id": "stale-soak", "cutover_id": "completed-cutover",
            "tenant_id": "tenant-001", "environment_class": "test", "state": "RUNNING", "version": 0,
            "started_at": "2026-01-01T00:00:00Z", "required_seconds": 60, "max_gap_seconds": 40,
            "last_sequence": 1, "last_observed_at": "2026-01-01T00:00:30Z",
            "observations": [{"metrics_sha256": production_closure.digest({"ok": True})}], "critical_failures": 0}
        store.create("soak", "stale-soak", "tenant-001", "test", "RUNNING", soak, "SOAK_STARTED")
        with self.assertRaisesRegex(production_closure.ClosureFailure, "exceeds gap"):
            production_closure.finish_soak(self.workspace, "stale-soak", 2, "2026-01-01T00:01:20Z", {}, self.trust_store)
        self.assertIn("soak run has not reached PASSED", production_closure.readiness(self.workspace, "tenant-001")["findings"])

    def test_cutover_transition_race_has_one_winner_and_a_valid_event_chain(self) -> None:
        store = production_closure.Store(self.workspace)
        cutover = {"schema_version": "1.0", "cutover_id": "cutover-race", "tenant_id": "tenant-001",
            "state": "PLANNED", "version": 0, "fencing_token": 0, "approval": {"actor_id": "approver"},
            "transitions": []}
        store.create("cutover", "cutover-race", "tenant-001", "test", "PLANNED", cutover, "CUTOVER_PLANNED")
        receipt_path = self.root / "race-receipt.json"
        receipt_path.write_text("{}", encoding="utf-8")
        receipt = {"path": str(receipt_path), "sha256": production_closure.digest_bytes(receipt_path.read_bytes()),
                   "bytes": receipt_path.stat().st_size}
        attestation = self.sign("operations-owner", {"cutover_id": "cutover-race", "tenant_id": "tenant-001",
            "expected_state": "PLANNED", "target_state": "PRECHECKED", "fencing_token": 1,
            "receipt_sha256": receipt["sha256"]}, "cutover-race")

        def transition(_: int) -> str:
            try:
                production_closure.transition_cutover(self.workspace, "cutover-race", "PLANNED", "PRECHECKED", 1,
                    receipt, attestation, self.trust_store, (self.root.resolve(),))
                return "won"
            except production_closure.ClosureFailure:
                return "conflict"

        with ThreadPoolExecutor(max_workers=16) as pool:
            outcomes = list(pool.map(transition, range(32)))
        self.assertEqual(1, outcomes.count("won"))
        self.assertEqual(31, outcomes.count("conflict"))
        self.assertEqual("PRECHECKED", store.get("cutover", "cutover-race")["state"])
        self.assertEqual([], store.chain_findings())

    def test_closure_event_chain_detects_current_record_and_metadata_tampering(self) -> None:
        store = production_closure.Store(self.workspace)
        record = {"schema_version": "1.0", "snapshot_id": "tamper-snapshot",
                  "tenant_id": "tenant-001", "environment_class": "test"}
        store.create("snapshot", "tamper-snapshot", "tenant-001", "test", "REGISTERED",
                     record, "SNAPSHOT_REGISTERED")
        connection = store.connect()
        try:
            changed = {**record, "environment_class": "production"}
            connection.execute("UPDATE records SET record_json=? WHERE kind=? AND record_id=?",
                               (production_closure.canonical_bytes(changed).decode(),
                                "snapshot", "tamper-snapshot"))
        finally:
            connection.close()
        findings = store.chain_findings()
        self.assertTrue(any("current record differs from latest event" in item for item in findings))
        self.assertTrue(any("environment metadata mismatch" in item for item in findings))

    def test_production_holdout_binds_exact_claim_oracle_and_independent_roles(self) -> None:
        corpus = self.root / "production-holdout.bin"
        corpus.write_bytes(b"sealed-production-holdout")
        oracle_registry_sha = production_closure.digest_bytes(b"oracle-registry-v1")
        mapping = [{"claim_id": "claim-route-equivalence", "oracle_id": "oracle-route-v1",
                    "oracle_version": "1.0.0"}]
        manifest = {"schema_version": "2.0", "holdout_id": "production-holdout-v2",
            "tenant_id": "tenant-001", "environment_class": "production",
            "corpus": {"path": str(corpus), "sha256": production_closure.digest_bytes(corpus.read_bytes()),
                       "bytes": corpus.stat().st_size},
            "development_corpus_sha256": production_closure.digest_bytes(b"development-corpus"),
            "transformation_author_ids": ["transformation-author"], "executor_ids": ["executor-holdout"],
            "verifier_ids": ["verifier-holdout"], "oracle_owner_ids": ["oracle-owner"],
            "oracle_registry_sha256": oracle_registry_sha, "claim_oracle_map": mapping,
            "development_partition_id": "development-partition", "holdout_partition_id": "holdout-partition"}
        manifest_path = self.root / "production-holdout-v2.json"
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        custodian = self.sign("holdout-custodian", {"holdout_id": "production-holdout-v2",
            "tenant_id": "tenant-001", "manifest_sha256": production_closure.digest(manifest),
            "corpus_sha256": manifest["corpus"]["sha256"], "environment_class": "production",
            "oracle_registry_sha256": oracle_registry_sha, "claim_oracle_root": production_closure.digest(mapping),
            "development_partition_id": "development-partition", "holdout_partition_id": "holdout-partition"},
            "production-holdout-v2")
        overlapping_payload = json.loads(self.trust_store.read_text(encoding="utf-8"))
        for actor in overlapping_payload["actors"]:
            if actor["actor_id"] == "verifier-holdout":
                actor["organization_id"] = "holdout-executor-org"
        overlapping_trust = self.trust_store.parent / "overlapping-production-trust-store.json"
        overlapping_trust.write_text(json.dumps(overlapping_payload), encoding="utf-8")
        with self.assertRaisesRegex(production_closure.ClosureFailure, "organizations overlap"):
            production_closure.register_holdout(
                self.workspace, manifest_path, custodian, overlapping_trust, (self.root.resolve(),))
        holdout = production_closure.register_holdout(
            self.workspace, manifest_path, custodian, self.trust_store, (self.root.resolve(),))
        execution = self.root / "production-holdout-execution.json"
        evidence = self.root / "production-holdout-claim.json"
        execution.write_text('{"state":"SUCCEEDED"}', encoding="utf-8")
        evidence.write_text('{"outcome":"PASS"}', encoding="utf-8")
        release = production_closure.digest_bytes(b"release-v2")
        account = production_closure.digest_bytes(b"account-v2")
        evidence_ref = {"path": str(evidence), "sha256": production_closure.digest_bytes(evidence.read_bytes()),
                        "bytes": evidence.stat().st_size}
        oracle_bindings = {"result_id": "production-holdout-result-v2", "holdout_id": "production-holdout-v2",
            "tenant_id": "tenant-001", "claim_id": mapping[0]["claim_id"], "oracle_id": mapping[0]["oracle_id"],
            "oracle_version": mapping[0]["oracle_version"], "outcome": "PASS",
            "evidence_sha256": evidence_ref["sha256"], "target_release_sha256": release,
            "provider_account_sha256": account, "oracle_registry_sha256": oracle_registry_sha}
        oracle_attestation = self.sign("oracle-owner", oracle_bindings, "production-holdout-oracle")
        result = {"schema_version": "2.0", "result_id": "production-holdout-result-v2",
            "holdout_id": "production-holdout-v2", "tenant_id": "tenant-001",
            "target_release_sha256": release, "provider_account_sha256": account,
            "execution_receipt": {"path": str(execution),
                "sha256": production_closure.digest_bytes(execution.read_bytes()), "bytes": execution.stat().st_size},
            "decision": "PASS", "claim_results": [{**mapping[0], "outcome": "PASS", "evidence": evidence_ref,
                "oracle_attestation": oracle_attestation}],
            "started_at": "2026-01-01T00:00:00Z", "finished_at": "2026-01-01T00:01:00Z"}
        result_path = self.root / "production-holdout-result-v2.json"
        result_path.write_text(json.dumps(result), encoding="utf-8")
        oracle_actor = production_closure.skill_runtime.TrustStore.load(self.trust_store).verify(
            oracle_attestation, "oracle-owner", oracle_bindings)
        normalized = [{"claim_id": mapping[0]["claim_id"], "outcome": "PASS",
                       "evidence": {"sha256": evidence_ref["sha256"], "bytes": evidence_ref["bytes"]},
                       "oracle_id": mapping[0]["oracle_id"], "oracle_version": mapping[0]["oracle_version"],
                       "oracle": oracle_actor}]
        root = production_closure.digest({"holdout_corpus_sha256": holdout["corpus"]["sha256"],
            "execution_receipt_sha256": result["execution_receipt"]["sha256"], "claim_results": normalized})
        bindings = {"result_id": result["result_id"], "holdout_id": result["holdout_id"],
            "tenant_id": result["tenant_id"], "manifest_sha256": production_closure.digest(result),
            "evidence_root": root, "target_release_sha256": release,
            "provider_account_sha256": account, "decision": "PASS"}
        executor = self.sign("executor-holdout", bindings, "production-holdout-executor")
        verifier = self.sign("verifier-holdout", {**bindings, "executor_id": "executor-holdout"},
                             "production-holdout-verifier")
        recorded = production_closure.record_holdout_result(
            self.workspace, result_path, executor, verifier, self.trust_store, (self.root.resolve(),))
        self.assertTrue(recorded["oracle_bound"])
        self.assertEqual("oracle-owner", recorded["claim_results"][0]["oracle"]["actor_id"])

    def test_provider_receipt_and_seven_day_soak_are_exact_realtime_and_fail_closed(self) -> None:
        start = datetime.now(timezone.utc).replace(microsecond=0)
        profile = self.exact_provider_profile(b"account-a")
        store = production_closure.Store(self.workspace)
        trust = runtime.TrustStore.load(self.trust_store)
        store.create("snapshot", "provider-snapshot", "tenant-001", "production", "REGISTERED",
            {"schema_version": "1.0", "snapshot_id": "provider-snapshot", "tenant_id": "tenant-001",
             "environment_class": "production", "authorization": {"actor_id": "data-owner",
                 "organization_id": "customer-data-org", "trust_store_sha256": trust.digest}},
            "SNAPSHOT_REGISTERED")
        organization_holdout = {"schema_version": "2.0", "holdout_id": "provider-holdout",
            "tenant_id": "tenant-001", "environment_class": "production", "organization_bound": True,
            "actor_trust_store_sha256": trust.digest, "independence_organizations": {
                "transformation_authors": ["implementation-author-org"],
                "custodian": ["holdout-custodian-org"], "executors": ["holdout-executor-org"],
                "verifiers": ["holdout-verifier-org"], "oracle_owners": ["oracle-org"]}}
        store.create("holdout", "provider-holdout", "tenant-001", "production", "SEALED",
                     organization_holdout, "HOLDOUT_SEALED")
        release = production_closure.digest_bytes(b"release")
        store.create("holdout-result", "provider-holdout-result", "tenant-001", "production", "PASS",
            {"schema_version": "2.0", "result_id": "provider-holdout-result", "holdout_id": "provider-holdout",
             "tenant_id": "tenant-001", "decision": "PASS", "target_release_sha256": release,
             "provider_account_sha256": profile["account_binding_sha256"],
             "independent": True, "oracle_bound": True}, "HOLDOUT_RESULT_RECORDED")
        plan = {"schema_version": "2.0", "cutover_id": "exact-cutover", "tenant_id": "tenant-001",
            "snapshot_id": "provider-snapshot", "holdout_result_id": "provider-holdout-result",
            "target_key": "target", "target_release_sha256": release, "rollback_adapter_id": "fixture-provider",
            "rollback_operation": "undo", "preconditions": ["reconciled", "rollback-ready"], "provider": profile}
        plan_path = self.root / "exact-cutover-plan.json"
        plan_path.write_text(json.dumps(plan), encoding="utf-8")
        plan_auth = self.sign("approver", {"cutover_id": "exact-cutover", "tenant_id": "tenant-001",
            "plan_sha256": production_closure.digest(plan), "snapshot_id": "provider-snapshot",
            "target_key": "target"}, "exact-cutover-plan")
        cutover = production_closure.plan_cutover(self.workspace, plan_path, plan_auth, self.trust_store,
                                                  (self.root.resolve(),))
        wrong = self.provider_receipt(cutover, "PRECHECKED", "inspect", "wrong",
                                      provider={**profile, "region": "other-region-1"})
        wrong_auth = self.sign("operations-owner", {"cutover_id": "exact-cutover", "tenant_id": "tenant-001",
            "expected_state": "PLANNED", "target_state": "PRECHECKED", "fencing_token": 1,
            "receipt_sha256": wrong["sha256"]}, "wrong-provider")
        with self.assertRaisesRegex(production_closure.ClosureFailure, "differs from the approved plan"):
            production_closure.transition_cutover(self.workspace, "exact-cutover", "PLANNED", "PRECHECKED", 1,
                wrong, wrong_auth, self.trust_store, (self.root.resolve(),))
        bad_control = self.provider_receipt(cutover, "PRECHECKED", "inspect", "bad-control")
        (self.root / "provider-control-least_privilege-bad-control.json").write_bytes(b"broadened-policy")
        bad_control_auth = self.sign("operations-owner", {"cutover_id": "exact-cutover",
            "tenant_id": "tenant-001", "expected_state": "PLANNED", "target_state": "PRECHECKED",
            "fencing_token": 1, "receipt_sha256": bad_control["sha256"]}, "bad-provider-control")
        with self.assertRaisesRegex(production_closure.ClosureFailure, "byte/digest mismatch"):
            production_closure.transition_cutover(self.workspace, "exact-cutover", "PLANNED", "PRECHECKED", 1,
                bad_control, bad_control_auth, self.trust_store, (self.root.resolve(),))
        correct = self.provider_receipt(cutover, "PRECHECKED", "inspect", "correct")
        correct_auth = self.sign("operations-owner", {"cutover_id": "exact-cutover", "tenant_id": "tenant-001",
            "expected_state": "PLANNED", "target_state": "PRECHECKED", "fencing_token": 1,
            "receipt_sha256": correct["sha256"]}, "correct-provider")
        result = production_closure.transition_cutover(self.workspace, "exact-cutover", "PLANNED", "PRECHECKED", 1,
            correct, correct_auth, self.trust_store, (self.root.resolve(),))
        self.assertEqual("test-region-1", result["transitions"][0]["receipt"]["provider"]["region"])

        soak_cutover = {**cutover, "cutover_id": "soak-cutover", "state": "SUCCEEDED", "version": 5,
            "fencing_token": 5, "holdout_result_id": "production-holdout-result",
            "transitions": [{"to": "SUCCEEDED",
                "recorded_at": start.isoformat().replace("+00:00", "Z")} ]}
        store.create("holdout-result", "production-holdout-result", "tenant-001", "production", "PASS",
            {"schema_version": "2.0", "result_id": "production-holdout-result",
             "holdout_id": "provider-holdout", "tenant_id": "tenant-001", "decision": "PASS",
             "target_release_sha256": soak_cutover["target_release_sha256"],
             "provider_account_sha256": profile["account_binding_sha256"],
             "independent": True, "oracle_bound": True}, "HOLDOUT_RESULT_RECORDED")
        store.create("cutover", "soak-cutover", "tenant-001", "production", "SUCCEEDED",
                     soak_cutover, "CUTOVER_SUCCEEDED")
        clock = production_closure.ControlledTestClock(start + timedelta(seconds=1))
        with self.assertRaisesRegex(production_closure.ClosureFailure, "conservative telemetry policy"):
            production_closure.start_soak(self.workspace, "soak-cutover", "weak-soak", "production",
                (start + timedelta(seconds=1)).isoformat(), production_closure.PRODUCTION_SOAK_SECONDS,
                production_closure.PRODUCTION_SOAK_SECONDS, 0.99, 0.01, 1, clock=clock)
        telemetry_profile = {"schema_version": "1.0", "monitor_id": "fixture-monitor",
            "provider_account_sha256": profile["account_binding_sha256"],
            "metrics_source_sha256": production_closure.digest_bytes(b"fixture-metrics-source"),
            "collection_interval_seconds": production_closure.PRODUCTION_MAX_GAP_SECONDS,
            "raw_evidence_required": True}
        production_closure.start_soak(self.workspace, "soak-cutover", "production-soak", "production",
            (start + timedelta(seconds=1)).isoformat(), production_closure.PRODUCTION_SOAK_SECONDS,
            production_closure.PRODUCTION_MAX_GAP_SECONDS, 0.999, 0.001, 28, clock=clock,
            telemetry_profile=telemetry_profile)
        for sequence in range(1, 29):
            observed = start + timedelta(seconds=1 + sequence * production_closure.PRODUCTION_MAX_GAP_SECONDS)
            observed_text = observed.isoformat().replace("+00:00", "Z")
            metrics = {"requests": 10_000, "errors": 1, "critical_failures": 0, "availability": 0.9999}
            telemetry = {"schema_version": "1.0", "monitor_id": "fixture-monitor",
                "run_id": "production-soak", "sequence": sequence, "observed_at": observed_text,
                "provider_account_sha256": profile["account_binding_sha256"],
                "metrics_source_sha256": telemetry_profile["metrics_source_sha256"],
                "source_event_id": f"fixture-event-{sequence}", "metrics": metrics}
            telemetry_path = self.root / f"telemetry-production-soak-{sequence}.json"
            telemetry_path.write_text(json.dumps(telemetry), encoding="utf-8")
            telemetry_ref = {"path": str(telemetry_path),
                "sha256": production_closure.digest_bytes(telemetry_path.read_bytes()),
                "bytes": telemetry_path.stat().st_size}
            metrics_sha = production_closure.digest({"metrics": metrics,
                "telemetry_receipt_sha256": telemetry_ref["sha256"],
                "telemetry_profile_sha256": production_closure.digest(telemetry_profile)})
            heartbeat = self.sign("operations-owner", {"run_id": "production-soak", "sequence": sequence,
                "observed_at": observed_text, "metrics_sha256": metrics_sha},
                f"production-soak-{sequence}")
            clock.set(observed)
            if sequence == 1:
                with self.assertRaisesRegex(production_closure.ClosureFailure, "raw telemetry receipt"):
                    production_closure.observe_soak(self.workspace, "production-soak", sequence, observed_text,
                                                    metrics, heartbeat, self.trust_store, clock=clock)
            production_closure.observe_soak(self.workspace, "production-soak", sequence, observed_text,
                                            metrics, heartbeat, self.trust_store, clock=clock,
                                            telemetry_receipt=telemetry_ref, roots=(self.root.resolve(),))
        running = store.get("soak", "production-soak")
        evidence_root = production_closure.soak_evidence_root(running)
        finished = start + timedelta(seconds=2 + production_closure.PRODUCTION_SOAK_SECONDS)
        finished_text = finished.isoformat().replace("+00:00", "Z")
        final = self.sign("verifier-production", {"run_id": "production-soak", "sequence": 29,
            "observed_at": finished_text, "target_state": "PASSED", "evidence_root": evidence_root},
            "production-soak-final")
        clock.set(finished)
        soak = production_closure.finish_soak(self.workspace, "production-soak", 29, finished_text,
                                              final, self.trust_store, clock=clock)
        self.assertEqual("PASSED", soak["state"])
        self.assertEqual("engineering-only", soak["evidence_class"])
        self.assertTrue(soak["production_protocol_simulated"])
        self.assertFalse(soak["real_seven_day_elapsed"])
        legacy = {"schema_version": "1.0", "assessment_id": "legacy-production-assessment",
            "tenant_id": "tenant-001", "scope": "synthetic-production-protocol-test", "decision": "CERTIFIED",
            "evidence_root": soak["evidence_root"], "limitations": ["local synthetic clock"],
            "issued_at": start.isoformat().replace("+00:00", "Z"), "expires_at": "2099-01-01T00:00:00Z"}
        legacy_path = self.root / "legacy-production-assessment.json"
        legacy_path.write_text(json.dumps(legacy), encoding="utf-8")
        legacy_auth = self.sign("independent-certifier", {"assessment_id": "legacy-production-assessment",
            "tenant_id": "tenant-001", "report_sha256": production_closure.digest(legacy),
            "evidence_root": soak["evidence_root"], "decision": "CERTIFIED"}, "legacy-production-assessment")
        with self.assertRaisesRegex(production_closure.ClosureFailure, "exact run, release, and provider account"):
            production_closure.import_assessment(self.workspace, legacy_path, legacy_auth, self.trust_store,
                                                 (self.root.resolve(),))
        exact = {**legacy, "schema_version": "2.0", "assessment_id": "exact-production-assessment",
            "run_id": "production-soak", "cutover_id": "soak-cutover",
            "target_release_sha256": soak_cutover["target_release_sha256"],
            "provider_account_sha256": profile["account_binding_sha256"]}
        exact_path = self.root / "exact-production-assessment.json"
        exact_path.write_text(json.dumps(exact), encoding="utf-8")
        external_store, authority_policy, authority_approval = self.external_certification_authority("tenant-001")
        exact_auth = self.sign("external-certifier", {"assessment_id": "exact-production-assessment",
            "tenant_id": "tenant-001", "report_sha256": production_closure.digest(exact),
            "evidence_root": soak["evidence_root"], "decision": "CERTIFIED"}, "exact-production-assessment")
        revoked_policy = json.loads(authority_policy.read_text(encoding="utf-8"))
        revoked_policy["revoked"] = True
        revoked_policy_path = authority_policy.parent / "revoked-policy.json"
        revoked_policy_path.write_text(json.dumps(revoked_policy), encoding="utf-8")
        with self.assertRaisesRegex(production_closure.ClosureFailure, "revocation state"):
            production_closure.import_assessment(self.workspace, exact_path, exact_auth, external_store,
                (self.root.resolve(),), authority_policy_path=revoked_policy_path,
                authority_approval=authority_approval, internal_trust_path=self.trust_store)
        imported = production_closure.import_assessment(self.workspace, exact_path, exact_auth, external_store,
            (self.root.resolve(),), authority_policy_path=authority_policy,
            authority_approval=authority_approval, internal_trust_path=self.trust_store)
        self.assertFalse(imported["certified"])
        self.assertTrue(imported["external_authority_authorized"])
        readiness = production_closure.readiness(self.workspace, "tenant-001")
        self.assertFalse(readiness["certified"])
        self.assertEqual("NOT_RUN", readiness["external_runtime_status"])

        expired_started = finished + timedelta(seconds=1)
        expired_started_text = expired_started.isoformat().replace("+00:00", "Z")
        clock.set(expired_started)
        production_closure.start_soak(self.workspace, "soak-cutover", "expired-production-soak", "production",
            expired_started_text, production_closure.PRODUCTION_SOAK_SECONDS,
            production_closure.PRODUCTION_MAX_GAP_SECONDS, 0.999, 0.001, 28, clock=clock,
            telemetry_profile=telemetry_profile)
        expired_at = expired_started + timedelta(seconds=production_closure.PRODUCTION_MAX_GAP_SECONDS + 1)
        expired_at_text = expired_at.isoformat().replace("+00:00", "Z")
        clock.set(expired_at)
        watchdog = production_closure.soak_status(self.workspace, "expired-production-soak", clock)
        self.assertTrue(watchdog["heartbeat_overdue"])
        timeout_payload = {"run_id": "expired-production-soak", "sequence": 1,
            "observed_at": expired_at_text, "target_state": "FAILED",
            "evidence_root": production_closure.soak_evidence_root(store.get("soak", "expired-production-soak")),
            "heartbeat_deadline": watchdog["heartbeat_deadline"], "reason": "HEARTBEAT_TIMEOUT"}
        timeout_attestation = self.sign("verifier-production", timeout_payload, "expired-soak")
        expired = production_closure.expire_soak(self.workspace, "expired-production-soak", expired_at_text,
                                                  timeout_attestation, self.trust_store, clock=clock)
        self.assertEqual("FAILED", expired["state"])
        self.assertEqual("HEARTBEAT_TIMEOUT", expired["terminal_reason"])
        revival_at = expired_at + timedelta(seconds=1)
        revival_text = revival_at.isoformat().replace("+00:00", "Z")
        clock.set(revival_at)
        revival = self.sign("verifier-production", {"run_id": "expired-production-soak", "sequence": 2,
            "observed_at": revival_text, "target_state": "FAILED",
            "evidence_root": production_closure.soak_evidence_root(expired)}, "expired-soak-revival")
        with self.assertRaisesRegex(production_closure.ClosureFailure, "state/version conflict"):
            production_closure.finish_soak(self.workspace, "expired-production-soak", 2, revival_text,
                                           revival, self.trust_store, clock=clock)
        self.assertEqual("NOT_RUN", readiness["external_runtime_status"])

    def test_original_payload_recovery_requires_exact_signed_227_file_bundle_and_applies_atomically(self) -> None:
        canonical_root = Path(__file__).resolve().parents[2]
        expected = original_payload_recovery.expected_paths(canonical_root)
        fake_system, bundle = self.root / "fake-system", self.root / "recovery-bundle"
        entries = []
        for relative in expected:
            reconstructed = f"reconstructed:{relative}\n".encode()
            original = f"authoritative-original:{relative}\n".encode()
            target, payload = fake_system / relative, bundle / "payloads" / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            payload.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(reconstructed)
            payload.write_bytes(original)
            entries.append({"path": relative, "original_sha256": original_payload_recovery.digest_bytes(original),
                "original_bytes": len(original), "reconstructed_sha256": original_payload_recovery.digest_bytes(reconstructed),
                "provenance": "authoritative-source-owner"})
        archive = bundle / "authoritative-source.zip"
        archive.write_bytes(b"signed source archive fixture")
        source_store, source_policy, source_policy_approval = self.external_source_authority("tenant-001")
        source_trust = runtime.TrustStore.load(source_store)
        source_identity = {"repository_id": "authoritative-batch-01-05",
            "source_revision_sha256": original_payload_recovery.digest_bytes(b"authoritative-source-revision"),
            "owner_organization_id": "source-archive-org", "acquired_at": "2020-01-02T00:00:00Z"}
        custody = {"schema_version": "1.0", "custody_id": "custody-recovery-001",
            "recovery_id": "recovery-001", "source_archive_sha256":
                original_payload_recovery.digest_bytes(archive.read_bytes()),
            "source_revision_sha256": source_identity["source_revision_sha256"],
            "transferred_by_organization_id": "source-archive-org",
            "received_by_organization_id": "customer-governance-org",
            "transferred_at": "2020-01-03T00:00:00Z"}
        custody_path = bundle / "custody.json"
        custody_path.write_text(json.dumps(custody), encoding="utf-8")
        manifest = {"schema_version": "2.0", "namespace": "batch-01-05-original-payload",
            "tenant_id": "tenant-001", "source_identity": source_identity,
            "custody_evidence": {"path": str(custody_path),
                "sha256": original_payload_recovery.digest_bytes(custody_path.read_bytes()),
                "bytes": custody_path.stat().st_size},
            "recovery_id": "recovery-001", "source_archive": {"path": str(archive),
                "sha256": original_payload_recovery.digest_bytes(archive.read_bytes()), "bytes": archive.stat().st_size},
            "entries": entries}
        manifest_path = bundle / "manifest.json"
        manifest_path.write_text(json.dumps(manifest), encoding="utf-8")
        entries_root = original_payload_recovery.digest([{key: item[key] for key in sorted(item)} for item in entries])
        source_auth = self.sign("external-source-owner", {"recovery_id": "recovery-001",
            "manifest_sha256": original_payload_recovery.digest(manifest), "entries_root": entries_root,
            "source_archive_sha256": manifest["source_archive"]["sha256"], "file_count": 227,
            "source_identity_sha256": original_payload_recovery.digest(source_identity),
            "custody_evidence_sha256": manifest["custody_evidence"]["sha256"],
            "external_store_sha256": source_trust.digest}, "source-recovery")

        first_payload = bundle / "payloads" / expected[0]
        original_first = first_payload.read_bytes()
        first_payload.write_bytes(b"tampered")
        with self.assertRaisesRegex(original_payload_recovery.RecoveryFailure, "byte/digest mismatch"):
            original_payload_recovery.verify_and_stage(fake_system, bundle, manifest_path, source_auth,
                source_store, self.root / "recovery-workspace-bad", (self.root.resolve(),),
                authority_policy_path=source_policy, authority_approval=source_policy_approval,
                internal_trust_path=self.trust_store)
        first_payload.write_bytes(original_first)
        escaped_payload = self.root / "escaped-original-payload.bin"
        escaped_payload.write_bytes(original_first)
        first_payload.unlink()
        first_payload.symlink_to(escaped_payload)
        with self.assertRaisesRegex(original_payload_recovery.RecoveryFailure, "escapes its authoritative root"):
            original_payload_recovery.verify_and_stage(fake_system, bundle, manifest_path, source_auth,
                source_store, self.root / "recovery-workspace-symlink", (self.root.resolve(),),
                authority_policy_path=source_policy, authority_approval=source_policy_approval,
                internal_trust_path=self.trust_store)
        first_payload.unlink()
        first_payload.write_bytes(original_first)

        recovery_workspace = self.root / "recovery-workspace"
        with self.assertRaisesRegex(original_payload_recovery.RecoveryFailure, "external provenance authority"):
            original_payload_recovery.verify_and_stage(fake_system, bundle, manifest_path, source_auth,
                source_store, self.root / "recovery-workspace-no-authority", (self.root.resolve(),))
        staged = original_payload_recovery.verify_and_stage(fake_system, bundle, manifest_path, source_auth,
            source_store, recovery_workspace, (self.root.resolve(),), authority_policy_path=source_policy,
            authority_approval=source_policy_approval, internal_trust_path=self.trust_store)
        self.assertEqual("VERIFIED_STAGED", staged["status"])
        self.assertTrue(staged["external_source_authorized"])
        approval = self.sign("recovery-approver", {"recovery_id": "recovery-001",
            "manifest_sha256": original_payload_recovery.digest(manifest), "entries_root": entries_root,
            "target_root_sha256": original_payload_recovery.digest(original_payload_recovery.expected_paths(fake_system)),
            "file_count": 227}, "apply-recovery")
        real_replace = original_payload_recovery.os.replace
        replacement_count = 0
        injected = False

        def fail_third_target_replace(source: str | Path, destination: str | Path) -> None:
            nonlocal replacement_count, injected
            if str(source).endswith(".recovery-001.tmp"):
                replacement_count += 1
                if replacement_count == 3 and not injected:
                    injected = True
                    raise OSError("injected atomic replacement failure")
            real_replace(source, destination)

        with mock.patch.object(original_payload_recovery.os, "replace", side_effect=fail_third_target_replace):
            with self.assertRaisesRegex(OSError, "injected atomic replacement failure"):
                original_payload_recovery.apply_staged(fake_system, Path(staged["stage_path"]), manifest_path,
                    approval, self.trust_store, recovery_workspace, (self.root.resolve(),))
        for entry in entries:
            self.assertEqual(entry["reconstructed_sha256"],
                             original_payload_recovery.digest_bytes((fake_system / entry["path"]).read_bytes()))
        shutil.rmtree(recovery_workspace / "backups" / "recovery-001")

        replacement_count = 0
        def crash_third_target_replace(source: str | Path, destination: str | Path) -> None:
            nonlocal replacement_count
            if str(source).endswith(".recovery-001.tmp"):
                replacement_count += 1
                if replacement_count == 3:
                    raise KeyboardInterrupt("simulated process termination")
            real_replace(source, destination)

        with mock.patch.object(original_payload_recovery.os, "replace", side_effect=crash_third_target_replace):
            with self.assertRaisesRegex(KeyboardInterrupt, "simulated process termination"):
                original_payload_recovery.apply_staged(fake_system, Path(staged["stage_path"]), manifest_path,
                    approval, self.trust_store, recovery_workspace, (self.root.resolve(),))
        recovered = original_payload_recovery.recover_interrupted(
            fake_system, manifest_path, recovery_workspace, (self.root.resolve(),))
        self.assertEqual("ROLLED_BACK_AFTER_CRASH", recovered["status"])
        self.assertFalse(recovered["original_payload_recovered"])
        for entry in entries:
            self.assertEqual(entry["reconstructed_sha256"],
                             original_payload_recovery.digest_bytes((fake_system / entry["path"]).read_bytes()))
        shutil.rmtree(recovery_workspace / "backups" / "recovery-001")

        receipt = original_payload_recovery.apply_staged(fake_system, Path(staged["stage_path"]), manifest_path,
            approval, self.trust_store, recovery_workspace, (self.root.resolve(),))
        self.assertEqual("APPLIED_PENDING_VERIFICATION", receipt["status"])
        self.assertFalse(receipt["original_payload_recovered"])
        self.assertEqual(227, receipt["file_count"])
        for entry in entries:
            self.assertEqual(entry["original_sha256"],
                             original_payload_recovery.digest_bytes((fake_system / entry["path"]).read_bytes()))
        receipt_path = recovery_workspace / "recovery-001-APPLY_RECEIPT.json"
        receipt_path.unlink()
        recovered_receipt = original_payload_recovery.recover_interrupted(
            fake_system, manifest_path, recovery_workspace, (self.root.resolve(),))
        self.assertTrue(recovered_receipt["receipt_recovered_after_crash"])
        self.assertFalse(recovered_receipt["original_payload_recovered"])
        self.assertEqual(receipt, json.loads(receipt_path.read_text(encoding="utf-8")))
        verification = self.sign("recovery-verifier", {"recovery_id": "recovery-001",
            "manifest_sha256": original_payload_recovery.digest(manifest),
            "apply_receipt_sha256": original_payload_recovery.digest(receipt), "entries_root": entries_root,
            "file_count": 227}, "verify-recovery")
        verified = original_payload_recovery.verify_applied(fake_system, manifest_path, receipt_path,
            verification, self.trust_store, recovery_workspace, (self.root.resolve(),))
        self.assertEqual("RECOVERED_ORIGINAL", verified["status"])
        self.assertTrue(verified["original_payload_recovered"])


if __name__ == "__main__":
    unittest.main()
