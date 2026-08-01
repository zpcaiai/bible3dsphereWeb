from pathlib import Path
import json

def test_quality_gates():
    root=Path(__file__).resolve().parents[1]
    failures=[]
    for path in root.glob("packs/*/pack.json"):
        p=json.loads(path.read_text(encoding="utf-8"))
        if len(p["common_grace"]) < 2: failures.append((p["id"],"common_grace"))
        if len(p["pride_hypotheses"]) < 2: failures.append((p["id"],"pride"))
        if not p["detection"]["counter_evidence"]: failures.append((p["id"],"counter"))
        if not p["scope"]["excludes"]: failures.append((p["id"],"excludes"))
        if not p["safety"]["no_mind_reading"]: failures.append((p["id"],"mind_reading"))
    assert failures == []

def test_single_question_mode():
    root=Path(__file__).resolve().parents[1]
    for path in root.glob("packs/*/socratic_tree.json"):
        tree=json.loads(path.read_text(encoding="utf-8"))
        assert tree["mode"] == "adaptive_single_question"
        assert len(tree["stages"]) >= 10
