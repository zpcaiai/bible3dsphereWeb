from __future__ import annotations

import asyncio
from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.agent.agent import DigitalHumanAgentSession, handle_final_transcript
from src.agent.guardrails import validate_response
from src.agent.persona_engine import PersonaEngine, parse_and_validate_scripture_locator
from src.agent.schemas import DigitalHumanResponse, Evidence


class PersonaEngineV13Tests(unittest.TestCase):
    def setUp(self) -> None:
        self.engine = PersonaEngine(package_root=ROOT)

    def test_canonical_locator_validation_and_normalization(self) -> None:
        self.assertEqual(
            parse_and_validate_scripture_locator("Exodus 4:10-16"),
            "Exodus 4:10-16",
        )
        self.assertEqual(
            parse_and_validate_scripture_locator("出埃及记 3:1-14"),
            "Exodus 3:1-14",
        )
        with self.assertRaises(ValueError):
            parse_and_validate_scripture_locator("FakeBook 1:1")
        with self.assertRaises(ValueError):
            parse_and_validate_scripture_locator("Exodus 99:1")

    def test_moses_burning_bush_returns_direct_scripture_evidence(self) -> None:
        resp = asyncio.run(self.engine.answer("moses", "荆棘火焰中发生了什么？"))
        self.assertEqual(resp.characterId, "moses")
        self.assertEqual(resp.groundingLevel, "G5_DIRECT_SCRIPTURE")
        self.assertEqual(resp.answerType, "EVENT")
        locators = [r.locator for r in resp.references]
        self.assertIn("Exodus 3", locators)
        self.assertIn("Exodus 4:1-17", locators)

    def test_moses_pharaoh_and_revelation_fail_closed(self) -> None:
        pharaoh = asyncio.run(self.engine.answer("moses", "出埃及时的法老到底是谁？"))
        self.assertEqual(pharaoh.groundingLevel, "G0_UNSUPPORTED")
        self.assertEqual(pharaoh.answerType, "UNSUPPORTED")

        revelation = asyncio.run(
            self.engine.answer("moses", "你现在像在西奈山一样替神给我新的诫命。")
        )
        self.assertEqual(revelation.groundingLevel, "G0_UNSUPPORTED")
        self.assertEqual(revelation.answerType, "UNSUPPORTED")

    def test_ambiguous_bare_name_requires_disambiguation(self) -> None:
        resp = asyncio.run(self.engine.answer("moses", "雅各"))
        self.assertEqual(resp.groundingLevel, "G0_UNSUPPORTED")
        self.assertIn("ambiguous-bare-name-requires-context", resp.warnings)
        self.assertIn("jacob", resp.relatedCharacters)

    def test_resolve_and_validate_references_rejects_invalid_and_deduplicates(self) -> None:
        resp = DigitalHumanResponse(
            characterId="david",
            answerType="EVENT",
            spokenText="大卫在希伯仑受膏。",
            displayText="大卫在希伯仑受膏。",
            references=[
                Evidence(sourceType="SCRIPTURE", locator="撒母耳记下 2:1-4", claimSupport="DIRECT"),
                Evidence(sourceType="SCRIPTURE", locator="2 Samuel 2:1-4", claimSupport="DIRECT"),
            ],
            groundingLevel="G5_DIRECT_SCRIPTURE",
        )
        self.engine.resolve_and_validate_references(resp)
        self.assertEqual(len(resp.references), 1)
        self.assertEqual(resp.references[0].locator, "2 Samuel 2:1-4")

        bad_resp = DigitalHumanResponse(
            characterId="david",
            answerType="EVENT",
            spokenText="测试错误引用",
            displayText="测试错误引用",
            references=[
                Evidence(sourceType="SCRIPTURE", locator="2 Samuel 99:1", claimSupport="DIRECT")
            ],
            groundingLevel="G5_DIRECT_SCRIPTURE",
        )
        with self.assertRaises(ValueError):
            self.engine.resolve_and_validate_references(bad_resp)

    def test_agent_session_persona_switch_and_turn_handling(self) -> None:
        session = DigitalHumanAgentSession(character_id="david", persona_engine=self.engine)
        spoken_log: list[str] = []

        async def record_speak(text: str) -> None:
            spoken_log.append(text)

        david_resp = asyncio.run(
            session.process_user_turn("你为什么没有杀扫罗？", speak_callback=record_speak)
        )
        self.assertEqual(david_resp.characterId, "david")
        self.assertEqual(len(spoken_log), 1)

        session.switch_character("paul")
        paul_resp = asyncio.run(
            session.process_user_turn("大马士革路上发生了什么？", speak_callback=record_speak)
        )
        self.assertEqual(paul_resp.characterId, "paul")
        self.assertEqual(len(session.published_packets), 2)

    def test_guardrails_rejects_fabricated_divine_revelation(self) -> None:
        bad = DigitalHumanResponse(
            characterId="moses",
            answerType="DEVOTIONAL",
            spokenText="神现在告诉你明天必发财",
            displayText="神现在告诉你明天必发财",
            references=[],
            groundingLevel="G1_INTERPRETIVE_POSSIBILITY",
        )
        with self.assertRaises(ValueError):
            validate_response(bad)


if __name__ == "__main__":
    unittest.main()
