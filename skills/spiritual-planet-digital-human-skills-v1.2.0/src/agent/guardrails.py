from .schemas import DigitalHumanResponse

FORBIDDEN_REVELATION_MARKERS = (
    "神现在告诉你",
    "神要我告诉你",
    "我奉神告诉你",
)


def validate_response(response: DigitalHumanResponse) -> DigitalHumanResponse:
    text = f"{response.spokenText}\n{response.displayText}"

    if any(marker in text for marker in FORBIDDEN_REVELATION_MARKERS):
        raise ValueError("fabricated divine-revelation pattern detected")

    if response.groundingLevel == "G0_UNSUPPORTED" and response.answerType == "FACT":
        raise ValueError("unsupported content cannot be emitted as FACT")

    if response.groundingLevel in {"G5_DIRECT_SCRIPTURE", "G4_STRONG_SCRIPTURAL_FACT"}:
        if not any(r.sourceType == "SCRIPTURE" for r in response.references):
            raise ValueError("high scripture grounding requires scripture evidence")

    return response
