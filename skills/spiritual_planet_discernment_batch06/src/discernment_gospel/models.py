from __future__ import annotations

from enum import Enum
from pydantic import BaseModel, Field


class DoctrineTier(str, Enum):
    TIER_1 = "TIER_1"
    TIER_2 = "TIER_2"
    TIER_3 = "TIER_3"


class FaithContext(str, Enum):
    CHRISTIAN = "christian"
    SEEKER = "seeker"
    UNKNOWN = "unknown"
    OTHER = "other"


class PreferredDepth(str, Enum):
    BRIEF = "brief"
    STANDARD = "standard"
    DEEP = "deep"


class GospelPathContext(BaseModel):
    case_id: str
    faith_context: FaithContext
    consent_scope: dict
    presenting_issue: str
    created_good: list[str] = Field(default_factory=list)
    distorted_desire: list[str] = Field(default_factory=list)
    functional_savior: list[str] = Field(default_factory=list)
    pride_hypotheses: list[str] = Field(default_factory=list)
    suffering_and_structural_factors: list[str] = Field(default_factory=list)
    law_risk: str = "low"
    shame_risk: str = "low"
    scrupulosity_risk: str = "low"
    doctrine_familiarity: str = "basic"
    church_context: str = ""
    preferred_depth: PreferredDepth = PreferredDepth.STANDARD


class GospelPathSegment(BaseModel):
    segment_id: str
    doctrine_pack_id: str
    purpose: str
    personalized_explanation: str
    socratic_question: str | None = None
    scripture_refs: list[str] = Field(default_factory=list)
    misconception_guards: list[str] = Field(default_factory=list)
    transition: str
    requires_consent: bool = True
    evidence_or_source_status: str = "pack_validated"


class GospelPathPlan(BaseModel):
    plan_id: str
    case_id: str
    segments: list[GospelPathSegment]
    entry_point: str
    law_gospel_balance: dict
    omitted_segments: list[dict] = Field(default_factory=list)
    denominational_notes: list[dict] = Field(default_factory=list)
    safety_actions: list[str] = Field(default_factory=list)
    review_status: str = "ready"
