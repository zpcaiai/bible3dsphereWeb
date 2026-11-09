"""LiveKit agent orchestration session and turn boundary."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Awaitable

from .persona_engine import PersonaEngine
from .schemas import DigitalHumanResponse

engine = PersonaEngine()


async def handle_final_transcript(
    character_id: str, transcript: str, persona_engine: PersonaEngine | None = None
) -> DigitalHumanResponse:
    """Domain boundary called when LiveKit yields a final user turn."""
    active_engine = persona_engine or engine
    return await active_engine.answer(character_id=character_id, question=transcript)


@dataclass
class DigitalHumanAgentSession:
    """Stateful session binding a current character persona to validated turn output."""

    character_id: str
    persona_engine: PersonaEngine = field(default_factory=PersonaEngine)
    published_packets: list[dict[str, Any]] = field(default_factory=list)
    spoken_utterances: list[str] = field(default_factory=list)

    def switch_character(self, new_character_id: str) -> None:
        cleaned = (new_character_id or "").strip().lower()
        if not cleaned:
            raise ValueError("character_id must not be empty")
        self.character_id = cleaned

    async def process_user_turn(
        self,
        transcript: str,
        speak_callback: Callable[[str], Awaitable[None]] | None = None,
    ) -> DigitalHumanResponse:
        response = await handle_final_transcript(
            character_id=self.character_id,
            transcript=transcript,
            persona_engine=self.persona_engine,
        )
        if response.characterId != self.character_id:
            raise RuntimeError(
                f"persona mismatch: expected {self.character_id}, got {response.characterId}"
            )
        payload = response.model_dump()
        self.published_packets.append(payload)
        if speak_callback is not None:
            await speak_callback(response.spokenText)
        self.spoken_utterances.append(response.spokenText)
        return response
