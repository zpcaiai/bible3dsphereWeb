from __future__ import annotations

from enum import Enum
from pydantic import BaseModel, Field


class EvidenceLevel(str, Enum):
    H0 = "H0"
    H1 = "H1"
    H2 = "H2"
    H3 = "H3"
    H4 = "H4"


class HypothesisStatus(str, Enum):
    PROPOSED = "PROPOSED"
    CLARIFYING = "CLARIFYING"
    TESTING = "TESTING"
    SUPPORTED = "SUPPORTED"
    WEAKENED = "WEAKENED"
    FALSIFIED = "FALSIFIED"
    FORMATION_PLAN = "FORMATION_PLAN"
    REVIEWED = "REVIEWED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    PASTORAL_SAFETY_HOLD = "PASTORAL_SAFETY_HOLD"
    HUMAN_REVIEW_REQUIRED = "HUMAN_REVIEW_REQUIRED"


class Observation(BaseModel):
    observation_id: str
    scope: str
    description: str
    source_type: str
    evidence_level: EvidenceLevel
    context: dict = Field(default_factory=dict)
    evidence_refs: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)


class PrideHypothesis(BaseModel):
    hypothesis_id: str
    pattern_id: str
    scope: str
    observation_ids: list[str]
    evidence_level: EvidenceLevel
    confidence: float = Field(ge=0, le=1)
    interpretation: str = ""
    alternative_explanations: list[str]
    counter_evidence_needed: list[str]
    triggering_conditions: list[str] = Field(default_factory=list)
    reinforcing_rewards: list[str] = Field(default_factory=list)
    relational_costs: list[str] = Field(default_factory=list)
    status: HypothesisStatus = HypothesisStatus.PROPOSED


class HypothesisComposition(BaseModel):
    composition_id: str
    component_hypotheses: list[str] = Field(min_length=2)
    interaction_type: str
    explanation: str
    shared_rewards: list[str] = Field(default_factory=list)
    shared_costs: list[str] = Field(default_factory=list)
    disconfirming_evidence: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)


class FormationChain(BaseModel):
    trigger: str
    interpretation: str
    desire: str
    response: str
    short_reward: str
    long_cost: str
    gospel_alternative: str = ""
