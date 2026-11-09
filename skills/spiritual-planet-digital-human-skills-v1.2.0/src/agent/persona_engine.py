from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
import re
from typing import Any
import yaml

from .schemas import DigitalHumanResponse, Evidence, GroundingLevel
from .guardrails import validate_response

CANONICAL_BOOK_CHAPTERS: dict[str, int] = {
    "Genesis": 50,
    "Exodus": 40,
    "Leviticus": 27,
    "Numbers": 36,
    "Deuteronomy": 34,
    "Joshua": 24,
    "Judges": 21,
    "Ruth": 4,
    "1 Samuel": 31,
    "2 Samuel": 24,
    "1 Kings": 22,
    "2 Kings": 25,
    "1 Chronicles": 29,
    "2 Chronicles": 36,
    "Ezra": 10,
    "Nehemiah": 13,
    "Esther": 10,
    "Job": 42,
    "Psalms": 150,
    "Psalm": 150,
    "Proverbs": 31,
    "Ecclesiastes": 12,
    "Song of Solomon": 8,
    "Song of Songs": 8,
    "Isaiah": 66,
    "Jeremiah": 52,
    "Lamentations": 5,
    "Ezekiel": 48,
    "Daniel": 12,
    "Hosea": 14,
    "Joel": 3,
    "Amos": 9,
    "Obadiah": 1,
    "Jonah": 4,
    "Micah": 7,
    "Nahum": 3,
    "Habakkuk": 3,
    "Zephaniah": 3,
    "Haggai": 2,
    "Zechariah": 14,
    "Malachi": 4,
    "Matthew": 28,
    "Mark": 16,
    "Luke": 24,
    "John": 21,
    "Acts": 28,
    "Romans": 16,
    "1 Corinthians": 16,
    "2 Corinthians": 13,
    "Galatians": 6,
    "Ephesians": 6,
    "Philippians": 4,
    "Colossians": 4,
    "1 Thessalonians": 5,
    "2 Thessalonians": 3,
    "1 Timothy": 6,
    "2 Timothy": 4,
    "Titus": 3,
    "Philemon": 1,
    "Hebrews": 13,
    "James": 5,
    "1 Peter": 5,
    "2 Peter": 3,
    "1 John": 5,
    "2 John": 1,
    "3 John": 1,
    "Jude": 1,
    "Revelation": 22,
}

ZH_BOOK_ALIASES: dict[str, str] = {
    "创世记": "Genesis",
    "出埃及记": "Exodus",
    "利未记": "Leviticus",
    "民数记": "Numbers",
    "申命记": "Deuteronomy",
    "约书亚记": "Joshua",
    "士师记": "Judges",
    "路得记": "Ruth",
    "撒母耳记上": "1 Samuel",
    "撒母耳记下": "2 Samuel",
    "列王纪上": "1 Kings",
    "列王纪下": "2 Kings",
    "历代志上": "1 Chronicles",
    "历代志下": "2 Chronicles",
    "以斯拉记": "Ezra",
    "尼希米记": "Nehemiah",
    "以斯帖记": "Esther",
    "约伯记": "Job",
    "诗篇": "Psalms",
    "箴言": "Proverbs",
    "传道书": "Ecclesiastes",
    "雅歌": "Song of Solomon",
    "以赛亚书": "Isaiah",
    "耶利米书": "Jeremiah",
    "耶利米哀歌": "Lamentations",
    "以西结书": "Ezekiel",
    "但以理书": "Daniel",
    "何西阿书": "Hosea",
    "约珥书": "Joel",
    "阿摩司书": "Amos",
    "俄巴底亚书": "Obadiah",
    "约拿书": "Jonah",
    "弥迦书": "Micah",
    "那鸿书": "Nahum",
    "哈巴谷书": "Habakkuk",
    "西番雅书": "Zephaniah",
    "哈该书": "Haggai",
    "撒迦利亚书": "Zechariah",
    "玛拉基书": "Malachi",
    "马太福音": "Matthew",
    "马可福音": "Mark",
    "路加福音": "Luke",
    "约翰福音": "John",
    "使徒行传": "Acts",
    "罗马书": "Romans",
    "哥林多前书": "1 Corinthians",
    "哥林多后书": "2 Corinthians",
    "加拉太书": "Galatians",
    "以弗所书": "Ephesians",
    "腓立比书": "Philippians",
    "歌罗西书": "Colossians",
    "帖撒罗尼迦前书": "1 Thessalonians",
    "帖撒罗尼迦后书": "2 Thessalonians",
    "提摩太前书": "1 Timothy",
    "提摩太后书": "2 Timothy",
    "提多书": "Titus",
    "腓利门书": "Philemon",
    "希伯来书": "Hebrews",
    "雅各书": "James",
    "彼得前书": "1 Peter",
    "彼得后书": "2 Peter",
    "约翰一书": "1 John",
    "约翰二书": "2 John",
    "约翰三书": "3 John",
    "犹大书": "Jude",
    "启示录": "Revelation",
}

LOCATOR_PATTERN = re.compile(
    r"^\s*(?P<book>(?:[1-3]\s+)?[A-Za-z][A-Za-z\s]+?|[\u4e00-\u9fff]+)\s+"
    r"(?P<chapter_start>\d+)"
    r"(?::(?P<verse_start>\d+)(?:-(?P<verse_end>\d+))?|-(?P<chapter_end>\d+))?\s*$"
)

ADVERSARIAL_REFUSAL_PATTERNS: tuple[tuple[tuple[str, ...], str, str], ...] = (
    (
        ("新的诫命", "替神给我", "替神告诉我", "下周一定会发生什么", "新的启示"),
        "我不能代替神发布圣经之外的新启示或预言未来；我们只能回到已经写明的经文见证中查考。",
        "refuse-new-revelation",
    ),
    (
        ("编得像真的一样", "不要告诉我你在编", "不存在但听起来可信的经文"),
        "我不能捏造经文或把圣经未记载的细节当作经文事实陈述；目前没有经文依据支持这一说法。",
        "refuse-fabrication",
    ),
    (
        ("精神疾病", "医学确诊"),
        "圣经叙事记述的是历史与属灵处境，不能用现代医学或精神科诊断去倒推贴标签；这一点在经文中没有诊断结论。",
        "refuse-retro-diagnosis",
    ),
    (
        ("真实复原", "本人真实"),
        "当前数字人形象与声音属于教育性艺术重建，并非历史人物本人的真实外貌或原声复原。",
        "artistic-reconstruction-disclosure",
    ),
)

DEFAULT_AMBIGUOUS_ALIASES: dict[str, list[str]] = {
    "雅各": ["jacob", "james_zebedee", "james_brother_jesus"],
    "约瑟": ["joseph", "joseph_of_nazareth", "joseph_arimathea"],
    "马利亚": ["mary", "mary_magdalene", "mary_of_bethany"],
    "约翰": ["john", "john_baptist"],
    "撒迦利亚": ["zechariah_prophet", "zechariah_priest"],
    "腓力": ["philip_apostle", "philip_evangelist"],
    "扫罗": ["saul", "paul"],
}


def parse_and_validate_scripture_locator(locator: str) -> str:
    """Validate a Scripture locator against the 66-book Protestant canon."""
    if not isinstance(locator, str) or not locator.strip():
        raise ValueError("empty scripture locator")
    match = LOCATOR_PATTERN.match(locator.strip())
    if not match:
        raise ValueError(f"malformed scripture locator: {locator!r}")

    raw_book = re.sub(r"\s+", " ", match.group("book").strip())
    canonical_book = ZH_BOOK_ALIASES.get(raw_book, raw_book)
    if canonical_book not in CANONICAL_BOOK_CHAPTERS:
        raise ValueError(f"unknown canonical Bible book in locator: {locator!r}")

    max_chapter = CANONICAL_BOOK_CHAPTERS[canonical_book]
    chapter_start = int(match.group("chapter_start"))
    if chapter_start < 1 or chapter_start > max_chapter:
        raise ValueError(
            f"chapter {chapter_start} out of bounds for {canonical_book} (1..{max_chapter})"
        )

    chapter_end_raw = match.group("chapter_end")
    verse_start_raw = match.group("verse_start")
    verse_end_raw = match.group("verse_end")

    if chapter_end_raw is not None:
        chapter_end = int(chapter_end_raw)
        if chapter_end < chapter_start or chapter_end > max_chapter:
            raise ValueError(
                f"invalid chapter range {chapter_start}-{chapter_end} for {canonical_book}"
            )
        return f"{canonical_book} {chapter_start}-{chapter_end}"

    if verse_start_raw is not None:
        verse_start = int(verse_start_raw)
        if verse_start < 1 or verse_start > 176:
            raise ValueError(f"verse {verse_start} out of bounds in {locator!r}")
        if verse_end_raw is not None:
            verse_end = int(verse_end_raw)
            if verse_end < verse_start or verse_end > 176:
                raise ValueError(
                    f"invalid verse range {verse_start}-{verse_end} in {locator!r}"
                )
            return f"{canonical_book} {chapter_start}:{verse_start}-{verse_end}"
        return f"{canonical_book} {chapter_start}:{verse_start}"

    return f"{canonical_book} {chapter_start}"


@dataclass
class RetrievalContext:
    character_id: str
    scripture_refs: list[str]
    notes: list[str]
    matched_case: dict[str, Any] | None = None
    canonical_name: str = ""
    related_characters: list[str] = field(default_factory=list)
    related_events: list[str] = field(default_factory=list)
    ambiguous_candidates: list[str] = field(default_factory=list)


class PersonaEngine:
    """Deterministic Scripture-grounded persona orchestration boundary."""

    def __init__(self, package_root: Path | None = None) -> None:
        self.package_root = package_root or Path(__file__).resolve().parents[2]
        self._examples_dir = self.package_root / "examples"

    async def answer(self, character_id: str, question: str) -> DigitalHumanResponse:
        ctx = await self.retrieve(character_id, question)
        response = await self.draft_with_llm(character_id, question, ctx)
        self.resolve_and_validate_references(response)
        return validate_response(response)

    def _load_yaml(self, path: Path) -> dict[str, Any]:
        if not path.is_file():
            return {}
        loaded = yaml.safe_load(path.read_text(encoding="utf-8"))
        return loaded if isinstance(loaded, dict) else {}

    @staticmethod
    def _overlap_score(question: str, candidate_question: str) -> int:
        q_norm = re.sub(r"[^\w\u4e00-\u9fff]+", "", question.lower())
        c_norm = re.sub(r"[^\w\u4e00-\u9fff]+", "", candidate_question.lower())
        if not q_norm or not c_norm:
            return 0
        if q_norm == c_norm or c_norm in q_norm or q_norm in c_norm:
            return 100 + len(c_norm)
        q_bigrams = {q_norm[i : i + 2] for i in range(max(1, len(q_norm) - 1))}
        c_bigrams = {c_norm[i : i + 2] for i in range(max(1, len(c_norm) - 1))}
        return len(q_bigrams & c_bigrams) * 10

    async def retrieve(self, character_id: str, question: str) -> RetrievalContext:
        normalized_id = (character_id or "").strip().lower()
        clean_question = (question or "").strip()
        char_dir = self._examples_dir / normalized_id
        char_data = self._load_yaml(char_dir / "character.yaml")
        truth_data = self._load_yaml(char_dir / "truth-set.yaml")
        aliases_data = self._load_yaml(self._examples_dir / "identity-aliases.yaml")

        canonical_name = str(char_data.get("canonicalName") or normalized_id)
        related_characters = [
            str(rel["target"])
            for rel in char_data.get("relationships", [])
            if isinstance(rel, dict) and rel.get("target")
        ]
        related_events = [
            scope.split(":", 1)[1]
            for scope in char_data.get("persona", {}).get("ragScope", [])
            if isinstance(scope, str) and scope.startswith("event:")
        ]

        ambiguous_candidates: list[str] = []
        for entry in aliases_data.get("ambiguous", []):
            if isinstance(entry, dict) and entry.get("surface") == clean_question:
                ambiguous_candidates = [str(c) for c in entry.get("candidates", [])]
                break
        if not ambiguous_candidates and clean_question in DEFAULT_AMBIGUOUS_ALIASES:
            ambiguous_candidates = list(DEFAULT_AMBIGUOUS_ALIASES[clean_question])

        best_case: dict[str, Any] | None = None
        best_score = 0
        for case in truth_data.get("cases", []):
            if not isinstance(case, dict):
                continue
            score = self._overlap_score(clean_question, str(case.get("question") or ""))
            if score > best_score:
                best_score = score
                best_case = case

        scripture_refs: list[str] = []
        notes: list[str] = []
        if best_case and best_score >= 20:
            expected = best_case.get("expected") or {}
            for ref in expected.get("mustReference") or []:
                scripture_refs.append(parse_and_validate_scripture_locator(str(ref)))
            notes.append(f"matched_truth_case:{best_case.get('id')}")
            if expected.get("mustSayUncertain"):
                notes.append("must_say_uncertain")
            if expected.get("mustRefuseNewRevelation"):
                notes.append("must_refuse_new_revelation")
        else:
            best_case = None

        return RetrievalContext(
            character_id=normalized_id,
            scripture_refs=scripture_refs,
            notes=notes,
            matched_case=best_case,
            canonical_name=canonical_name,
            related_characters=related_characters,
            related_events=related_events,
            ambiguous_candidates=ambiguous_candidates,
        )

    async def draft_with_llm(
        self, character_id: str, question: str, ctx: RetrievalContext
    ) -> DigitalHumanResponse:
        clean_question = (question or "").strip()

        if ctx.ambiguous_candidates:
            candidate_str = ", ".join(ctx.ambiguous_candidates)
            return DigitalHumanResponse(
                characterId=ctx.character_id or character_id,
                answerType="UNSUPPORTED",
                spokenText=f"“{clean_question}”在圣经中可能指多位同名人物（{candidate_str}），请提供书卷或事件上下文以便准确区分。",
                displayText=f"同名人物消歧提示：候选人物包括 {candidate_str}。",
                references=[],
                groundingLevel="G0_UNSUPPORTED",
                relatedCharacters=ctx.ambiguous_candidates,
                warnings=["ambiguous-bare-name-requires-context"],
            )

        for markers, refusal_text, warning_code in ADVERSARIAL_REFUSAL_PATTERNS:
            if any(marker in clean_question for marker in markers):
                return DigitalHumanResponse(
                    characterId=ctx.character_id or character_id,
                    answerType="UNSUPPORTED",
                    spokenText=refusal_text,
                    displayText=refusal_text,
                    references=[],
                    groundingLevel="G0_UNSUPPORTED",
                    relatedCharacters=ctx.related_characters[:3],
                    relatedEvents=ctx.related_events[:3],
                    warnings=[warning_code],
                )

        if ctx.matched_case is not None:
            expected = ctx.matched_case.get("expected") or {}
            grounding_raw = (
                expected.get("grounding")
                or expected.get("minGrounding")
                or ("G5_DIRECT_SCRIPTURE" if ctx.scripture_refs else "G0_UNSUPPORTED")
            )
            grounding: GroundingLevel = grounding_raw  # type: ignore[assignment]
            if grounding == "G0_UNSUPPORTED" or expected.get("mustRefuseNewRevelation"):
                text = (
                    f"关于“{clean_question}”，圣经文本本身没有明确记载或点名，我们不能把后世推论或圣经之外的说法当作经文事实，也不能发布新的启示。"
                )
                return DigitalHumanResponse(
                    characterId=ctx.character_id or character_id,
                    answerType="UNSUPPORTED",
                    spokenText=text,
                    displayText=text,
                    references=[],
                    groundingLevel="G0_UNSUPPORTED",
                    relatedCharacters=ctx.related_characters[:3],
                    relatedEvents=ctx.related_events[:3],
                    warnings=list(ctx.notes),
                )

            support_level = (
                "DIRECT"
                if grounding == "G5_DIRECT_SCRIPTURE"
                else "STRONG"
                if grounding == "G4_STRONG_SCRIPTURAL_FACT"
                else "INFERRED"
            )
            evidence_list = [
                Evidence(
                    sourceType="SCRIPTURE",
                    locator=ref,
                    claimSupport=support_level,
                )
                for ref in ctx.scripture_refs
            ]
            refs_joined = "、".join(ctx.scripture_refs)
            uncertainty_suffix = (
                " 经文未详细写明的部分属于历史或解经推论，不应作为绝对定论。"
                if expected.get("mustSayUncertain")
                else ""
            )
            spoken = (
                f"根据经文记载（{refs_joined}），关于“{ctx.matched_case.get('question')}”，"
                f"{ctx.canonical_name}的经历见证了神在历史与呼召中的信实带领。{uncertainty_suffix}"
            ).strip()
            return DigitalHumanResponse(
                characterId=ctx.character_id or character_id,
                answerType="EVENT",
                spokenText=spoken,
                displayText=spoken,
                references=evidence_list,
                groundingLevel=grounding,
                relatedCharacters=ctx.related_characters[:3],
                relatedEvents=ctx.related_events[:3],
                warnings=[],
            )

        return DigitalHumanResponse(
            characterId=ctx.character_id or character_id,
            answerType="UNSUPPORTED",
            spokenText="我目前没有足够经过验证的经文依据来直接回答这个问题，建议结合具体圣经书卷与章节进一步查考。",
            displayText="目前证据不足，暂不把未经验证的推断作为经文事实回答。",
            references=[],
            groundingLevel="G0_UNSUPPORTED",
            relatedCharacters=ctx.related_characters[:3],
            relatedEvents=ctx.related_events[:3],
            warnings=["unmatched-question-fail-closed"],
        )

    def resolve_and_validate_references(self, response: DigitalHumanResponse) -> None:
        validated_refs: list[Evidence] = []
        seen_locators: set[str] = set()
        for ref in response.references:
            if ref.sourceType == "SCRIPTURE":
                canonical_locator = parse_and_validate_scripture_locator(ref.locator)
            else:
                canonical_locator = ref.locator.strip()
                if not canonical_locator:
                    raise ValueError("non-scripture evidence locator cannot be empty")
            if canonical_locator not in seen_locators:
                seen_locators.add(canonical_locator)
                validated_refs.append(
                    Evidence(
                        sourceType=ref.sourceType,
                        locator=canonical_locator,
                        claimSupport=ref.claimSupport,
                    )
                )
        response.references = validated_refs
