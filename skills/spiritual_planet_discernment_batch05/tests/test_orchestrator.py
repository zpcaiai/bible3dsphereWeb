from discernment_dialogue.orchestrator import DialogueOrchestrator
from discernment_dialogue.models import SessionStatus, GospelConsentResponse

def test_normal_receive():
    o = DialogueOrchestrator()
    s = o.initialize("s1", "c1", True, "christian")
    s = o.receive_user_turn(s, "我总觉得只有我能把项目做好。")
    assert s.status == SessionStatus.ANSWER_RECEIVED

def test_boundary_pauses():
    o = DialogueOrchestrator()
    s = o.initialize("s2", "c2", True)
    s = o.receive_user_turn(s, "我不想回答，先到这里。")
    assert s.status == SessionStatus.PAUSED_BY_USER

def test_bad_question_requires_repair():
    o = DialogueOrchestrator()
    s = o.initialize("s3", "c3", True)
    s = o.ask(s, "你怕什么？你想得到什么？")
    assert s.status == SessionStatus.REPAIR_REQUIRED

def test_gospel_gate():
    o = DialogueOrchestrator()
    s = o.initialize("s4", "c4", True)
    s.gospel_consent = GospelConsentResponse.ACCEPTED
    assert o.can_enter_gospel(s)
