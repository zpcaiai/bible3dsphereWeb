from __future__ import annotations

from enum import Enum
from pydantic import BaseModel, Field


class DialogueStage(str, Enum):
    ORIENT = "ORIENT"
    CLARIFY = "CLARIFY"
    STEELMAN = "STEELMAN"
    EVIDENCE = "EVIDENCE"
    ASSUMPTION = "ASSUMPTION"
    COUNTEREXAMPLE = "COUNTEREXAMPLE"
    CONSEQUENCE = "CONSEQUENCE"
    SELF_MIRROR = "SELF_MIRROR"
    HEART = "HEART"
    WORSHIP = "WORSHIP"
    LAW = "LAW"
    GOSPEL_INVITATION = "GOSPEL_INVITATION"
    GOSPEL_EXPLORATION = "GOSPEL_EXPLORATION"
    RESPONSE = "RESPONSE"
    REVIEW = "REVIEW"


class Difficulty(str, Enum):
    D0 = "D0"
    D1 = "D1"
    D2 = "D2"
    D3 = "D3"
    D4 = "D4"
    D5 = "D5"


class SessionStatus(str, Enum):
    CREATED = "CREATED"
    CONSENT_ROUTED = "CONSENT_ROUTED"
    ACTIVE = "ACTIVE"
    QUESTION_ASKED = "QUESTION_ASKED"
    ANSWER_RECEIVED = "ANSWER_RECEIVED"
    ANSWER_EVALUATED = "ANSWER_EVALUATED"
    HYPOTHESIS_UPDATED = "HYPOTHESIS_UPDATED"
    NEXT_STAGE_SELECTED = "NEXT_STAGE_SELECTED"
    COMPLETED = "COMPLETED"
    PAUSED_BY_USER = "PAUSED_BY_USER"
    REPAIR_REQUIRED = "REPAIR_REQUIRED"
    SAFETY_HOLD = "SAFETY_HOLD"
    HUMAN_REVIEW_REQUIRED = "HUMAN_REVIEW_REQUIRED"
    EXITED_BY_USER = "EXITED_BY_USER"
    BLOCKED = "BLOCKED"


class ResistanceType(str, Enum):
    NONE = "none"
    CONFUSION = "confusion"
    DISAGREEMENT = "disagreement"
    FATIGUE = "fatigue"
    FEAR = "fear"
    SHAME_FLOODING = "shame_flooding"
    TRAUMA_ACTIVATION = "trauma_activation"
    SCRUPULOSITY = "scrupulosity"
    STRATEGIC_EVASION = "strategic_evasion"
    HOSTILITY = "hostility"
    BOUNDARY_SETTING = "boundary_setting"


class GospelConsentResponse(str, Enum):
    NOT_ASKED = "not_asked"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    LATER = "later"
    UNCLEAR = "unclear"


class SocraticQuestion(BaseModel):
    question_id: str
    stage: DialogueStage
    difficulty: Difficulty
    text: str
    purpose: str
    discriminates_between: list[str] = Field(default_factory=list)
    requires_consent: bool = False
    allow_skip: bool = True
    safety_notes: list[str] = Field(default_factory=list)


class AnswerEvaluation(BaseModel):
    answer_quality: str
    directness: str
    evidence_value: str
    supporting_hypotheses: list[str] = Field(default_factory=list)
    contradicting_hypotheses: list[str] = Field(default_factory=list)
    resistance_type: ResistanceType = ResistanceType.NONE
    emotional_load: str = "low"
    next_action: str = "continue"
    limitations: list[str] = Field(default_factory=list)


class DialogueSession(BaseModel):
    session_id: str
    case_id: str
    stage: DialogueStage = DialogueStage.ORIENT
    difficulty: Difficulty = Difficulty.D0
    faith_context: str = "unknown"
    status: SessionStatus = SessionStatus.CREATED
    allow_spiritual_analysis: bool = False
    gospel_consent: GospelConsentResponse = GospelConsentResponse.NOT_ASKED
    active_hypothesis_ids: list[str] = Field(default_factory=list)
    turns: list[dict] = Field(default_factory=list)
