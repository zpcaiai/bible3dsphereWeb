from __future__ import annotations
from pydantic import BaseModel, Field

class Worldview(BaseModel):
    human_problem: str
    functional_savior: str
    promised_telos: str
    distortion: str

class Detection(BaseModel):
    positive_signals: list[str]
    counter_evidence: list[str]
    exclusions: list[str]
    minimum_evidence_level: str

class DomainPack(BaseModel):
    id: str
    name: str
    version: str
    batch: int = 2
    cluster: str
    aliases: list[str]
    fair_definition: str
    scope: dict[str, list[str]]
    common_grace: list[str]
    worldview: Worldview
    pride_hypotheses: list[str]
    desire_fears: list[str]
    biblical_lenses: list[str]
    gospel_summary: str
    detection: Detection
    safety: dict[str, object]
    resources: dict[str, str]

class MatchResult(BaseModel):
    pack_id: str
    score: float = Field(ge=0, le=1)
    matched_evidence: list[str] = []
    counter_evidence: list[str] = []
    classification: str
    explanation: str
