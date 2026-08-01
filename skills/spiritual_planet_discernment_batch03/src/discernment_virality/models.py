from __future__ import annotations

from enum import Enum
from typing import Any, Literal
from pydantic import BaseModel, Field


class EvidenceLevel(str, Enum):
    P0 = "P0"
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"
    P4 = "P4"


class EvidenceRef(BaseModel):
    evidence_id: str
    source_type: str
    locator: str
    quote: str | None = None
    captured_at: str | None = None
    evidence_level: EvidenceLevel
    independence_group: str | None = None
    limitations: list[str] = Field(default_factory=list)


class ConsentScope(BaseModel):
    allow_public_content_analysis: bool
    allow_spiritual_analysis: bool
    allow_gospel_bridge: bool
    allow_longitudinal_monitoring: bool = False


class TimeWindow(BaseModel):
    start: str
    end: str


class Subject(BaseModel):
    subject_type: Literal["person", "event", "content_series", "product", "campaign", "mixed"]
    display_name: str
    public_identifiers: list[str] = Field(default_factory=list)


class ViralityCase(BaseModel):
    case_id: str
    subject: Subject
    analysis_goal: str
    platforms: list[str] = Field(default_factory=list)
    time_window: TimeWindow
    consent_scope: ConsentScope
    source_items: list[dict[str, Any]] = Field(default_factory=list)
    sensitivity: Literal["normal", "reputation_sensitive", "legal_sensitive", "minor_involved", "crisis"] = "normal"


class PersonaItem(BaseModel):
    label: str
    description: str
    evidence_level: EvidenceLevel
    evidence_refs: list[str] = Field(default_factory=list)
    alternative_explanations: list[str] = Field(default_factory=list)


class PersonaProfile(BaseModel):
    verified_identity: list[PersonaItem] = Field(default_factory=list)
    self_claimed_identity: list[PersonaItem] = Field(default_factory=list)
    performed_persona: list[PersonaItem] = Field(default_factory=list)
    audience_symbols: list[PersonaItem] = Field(default_factory=list)
    commercial_brand: list[PersonaItem] = Field(default_factory=list)
    analyst_hypotheses: list[PersonaItem] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)


class AudienceSegment(BaseModel):
    segment_id: str
    label: str
    legitimate_needs: list[str]
    pressures: list[str] = Field(default_factory=list)
    attraction_drivers: list[str]
    identity_aspirations: list[str] = Field(default_factory=list)
    risks: list[str]
    healthy_alternatives: list[str] = Field(default_factory=list)
    evidence_level: EvidenceLevel
    limitations: list[str] = Field(default_factory=list)


class ControversyState(str, Enum):
    LATENT = "LATENT"
    TRIGGERED = "TRIGGERED"
    AMPLIFYING = "AMPLIFYING"
    POLARIZED = "POLARIZED"
    MONETIZED = "MONETIZED"
    FATIGUED = "FATIGUED"
    REFRAMED = "REFRAMED"
    RESOLVED = "RESOLVED"
    REIGNITED = "REIGNITED"


class ControversyEpisode(BaseModel):
    episode_id: str
    state: ControversyState
    trigger: str
    amplifiers: list[str] = Field(default_factory=list)
    beneficiaries: list[str] = Field(default_factory=list)
    harms: list[str] = Field(default_factory=list)
    next_state_hypotheses: list[str] = Field(default_factory=list)
    evidence_level: EvidenceLevel
    limitations: list[str] = Field(default_factory=list)


class AnalysisState(str, Enum):
    RECEIVED = "RECEIVED"
    CONSENT_CHECKED = "CONSENT_CHECKED"
    NORMALIZED = "NORMALIZED"
    EVIDENCE_PROFILED = "EVIDENCE_PROFILED"
    PERSONA_SEPARATED = "PERSONA_SEPARATED"
    CORPUS_CURATED = "CORPUS_CURATED"
    CONTENT_ANALYZED = "CONTENT_ANALYZED"
    WORLDVIEW_LINKED = "WORLDVIEW_LINKED"
    BUSINESS_ANALYZED = "BUSINESS_ANALYZED"
    PLATFORM_ANALYZED = "PLATFORM_ANALYZED"
    AUDIENCE_SEGMENTED = "AUDIENCE_SEGMENTED"
    VIRALITY_DECOMPOSED = "VIRALITY_DECOMPOSED"
    NETWORK_BUILT = "NETWORK_BUILT"
    CONTROVERSY_MODELED = "CONTROVERSY_MODELED"
    TRUST_RISK_ASSESSED = "TRUST_RISK_ASSESSED"
    PARASOCIAL_ANALYZED = "PARASOCIAL_ANALYZED"
    COUNTERFACTUAL_CHECKED = "COUNTERFACTUAL_CHECKED"
    FORMATION_EVALUATED = "FORMATION_EVALUATED"
    QUESTIONS_PLANNED = "QUESTIONS_PLANNED"
    GOSPEL_BRIDGE_BUILT = "GOSPEL_BRIDGE_BUILT"
    REPORT_COMPOSED = "REPORT_COMPOSED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    READY = "READY"
    BLOCKED = "BLOCKED"
