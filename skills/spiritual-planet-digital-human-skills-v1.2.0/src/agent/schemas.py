from typing import Literal
from pydantic import BaseModel, Field

GroundingLevel = Literal[
    "G5_DIRECT_SCRIPTURE",
    "G4_STRONG_SCRIPTURAL_FACT",
    "G3_SCRIPTURAL_INFERENCE",
    "G2_HISTORICAL_RECONSTRUCTION",
    "G1_INTERPRETIVE_POSSIBILITY",
    "G0_UNSUPPORTED",
]

class Evidence(BaseModel):
    sourceType: Literal["SCRIPTURE", "HISTORY", "COMMENTARY", "INTERNAL_REVIEW"]
    locator: str
    claimSupport: Literal["DIRECT", "STRONG", "INFERRED", "CONTEXT_ONLY"]

class DigitalHumanResponse(BaseModel):
    characterId: str
    answerType: Literal["FACT", "EVENT", "THEOLOGY", "DEVOTIONAL", "UNSUPPORTED"]
    spokenText: str
    displayText: str
    references: list[Evidence] = Field(default_factory=list)
    groundingLevel: GroundingLevel
    relatedCharacters: list[str] = Field(default_factory=list)
    relatedEvents: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
