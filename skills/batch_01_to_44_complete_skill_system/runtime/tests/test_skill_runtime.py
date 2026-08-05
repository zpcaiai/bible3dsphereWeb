from __future__ import annotations

import base64
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
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
            "adapter-admin": ["adapter-admin"], "approver": ["approver"],
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
                            "not_after": "2099-01-01T00:00:00Z", "revoked": False})
        self.trust_store = self.actors / "trust-store.json"
        self.trust_store.write_text(json.dumps({"schema_version": "1.0", "actors": entries, "revoked_record_ids": []}), encoding="utf-8")
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


if __name__ == "__main__":
    unittest.main()
