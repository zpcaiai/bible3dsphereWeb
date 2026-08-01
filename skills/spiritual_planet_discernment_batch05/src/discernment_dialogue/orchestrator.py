from __future__ import annotations

from .consent import GospelConsentGate
from .difficulty import DifficultyController
from .models import (
    DialogueSession,
    DialogueStage,
    Difficulty,
    GospelConsentResponse,
    SessionStatus,
)
from .question_validator import validate_single_question
from .resistance import classify_resistance
from .safety import DialogueSafetyGuardian


class DialogueOrchestrator:
    def __init__(self) -> None:
        self.guardian = DialogueSafetyGuardian()
        self.difficulty = DifficultyController()
        self.gospel_gate = GospelConsentGate()

    def initialize(
        self,
        session_id: str,
        case_id: str,
        allow_spiritual_analysis: bool,
        faith_context: str = "unknown",
    ) -> DialogueSession:
        return DialogueSession(
            session_id=session_id,
            case_id=case_id,
            allow_spiritual_analysis=allow_spiritual_analysis,
            faith_context=faith_context,
            status=SessionStatus.ACTIVE,
        )

    def receive_user_turn(self, session: DialogueSession, text: str) -> DialogueSession:
        safety = self.guardian.review(text)
        if safety.status == "blocked":
            session.status = SessionStatus.BLOCKED
            return session
        if safety.status == "safety_hold":
            session.status = SessionStatus.SAFETY_HOLD
            return session

        resistance = classify_resistance(text)
        if resistance["type"].value == "boundary_setting":
            session.status = SessionStatus.PAUSED_BY_USER
            return session

        session.status = SessionStatus.ANSWER_RECEIVED
        session.turns.append({"speaker": "user", "content": text})
        return session

    def ask(self, session: DialogueSession, question_text: str) -> DialogueSession:
        check = validate_single_question(question_text)
        if not check["valid"]:
            session.status = SessionStatus.REPAIR_REQUIRED
            return session

        session.turns.append({
            "speaker": "assistant",
            "content": question_text,
            "stage": session.stage.value,
            "difficulty": session.difficulty.value,
        })
        session.status = SessionStatus.QUESTION_ASKED
        return session

    def can_enter_gospel(self, session: DialogueSession) -> bool:
        return self.gospel_gate.can_explore(
            session.allow_spiritual_analysis,
            session.gospel_consent,
            "ready",
        )
